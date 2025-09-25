import { NextResponse } from "next/server";

const RELAYER_URL = "https://relayer-api.horizenlabs.io/api/v1";

// Cache vkHash by blueprint slug for this server process
const vkHashCache = new Map<string, string>();

async function ensureVkHash(
	vkeyObj: any,
	blueprintSlug: string,
	apiKey: string
) {
	if (vkHashCache.has(blueprintSlug)) return vkHashCache.get(blueprintSlug)!;

	const res = await fetch(`${RELAYER_URL}/register-vk/${apiKey}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			proofType: "groth16",
			proofOptions: { library: "snarkjs", curve: "bn128" },
			vk: vkeyObj,
		}),
	});

	if (res.ok) {
		const data = await res.json();
		const vkHash: string = data?.vkHash ?? data?.meta?.vkHash;
		if (!vkHash)
			throw new Error("vkHash missing from register-vk response");
		vkHashCache.set(blueprintSlug, vkHash);
		return vkHash;
	}

	const errorText = await res.text();
	try {
		const errJson = JSON.parse(errorText);
		if (
			errJson?.code === "REGISTER_VK_FAILED" &&
			errJson?.message?.includes("already registered") &&
			errJson?.meta?.vkHash
		) {
			const vkHash: string = errJson.meta.vkHash;
			vkHashCache.set(blueprintSlug, vkHash);
			return vkHash;
		}
	} catch {}
	throw new Error(
		`Failed to register vkey: ${res.status} ${res.statusText}. ${errorText}`
	);
}

export async function POST(req: Request) {
	try {
		const apiKey =
			process.env.ZK_VERIFY_API_KEY ||
			process.env.NEXT_PUBLIC_ZK_VERIFY_API_KEY;
		if (!apiKey) {
			return NextResponse.json(
				{ success: false, error: "Missing ZK_VERIFY_API_KEY" },
				{ status: 500 }
			);
		}

		const form = await req.formData();
		const username = String(form.get("username") || "").trim();
		if (!username) {
			return NextResponse.json(
				{ success: false, error: "Missing username" },
				{ status: 400 }
			);
		}
		const file = form.get("emlFile") as File | null;
		if (!file)
			return NextResponse.json(
				{ success: false, error: "Missing emlFile" },
				{ status: 400 }
			);

		const { initZkEmailSdk } = await import("@zk-email/sdk");
		const sdk = initZkEmailSdk();

		// Try multiple blueprints until one is compiled
		const envList = (
			process.env.ZKEMAIL_BLUEPRINT ||
			process.env.NEXT_PUBLIC_ZKEMAIL_BLUEPRINT ||
			""
		)
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
		const candidates = [
			...envList,
			"chandrabosep/retro_github@v3",
			"chandrabosep/retro_github@v2",
			"chandrabosep/retro_github@v1",
			// "Akhil-2310/hackerhouse_india@v4",
			// "Bisht13/SuccinctZKResidencyInvite@v3",
		];
		let blueprintSlug = "";
		let blueprint: any = null;
		let vkeyStr = "";
		let lastErr: any = null;
		for (const candidate of candidates) {
			try {
				const bp = await sdk.getBlueprint(candidate);
				const vkey = await bp.getVkey();
				blueprintSlug = candidate;
				blueprint = bp;
				vkeyStr = vkey;
				break;
			} catch (e: any) {
				lastErr = e;
				continue;
			}
		}
		if (!blueprint) {
			const msg =
				"No compiled blueprints were found. Ensure your blueprint is compiled and published (release artifacts present).";
			throw new Error(
				`${msg} Tried: ${candidates.join(", ")}. Last error: ${
					lastErr?.message || lastErr
				}`
			);
		}
		const vkeyObj = JSON.parse(vkeyStr);
		const vkHash = await ensureVkHash(vkeyObj, blueprintSlug, apiKey);

		const eml = await file.text();
		const prover = blueprint.createProver({ isLocal: false });

		// Prepare multiple shapes for external inputs to satisfy blueprint schema
		const externalInputsArray = [
			{ name: "username", value: username, maxLength: 100 },
		];
		const externalInputsMap: any = { username };
		const externalInputsTyped = [
			{
				name: "username",
				value: username,
				type: "string",
				maxLength: 100,
			},
		];

		let proof: any;
		// Try remote with different input shapes, then local with different shapes
		async function tryRemote(inputs: any) {
			let inProgress = await (prover as any).generateProofRequest(
				eml,
				inputs
			);
			let attempts = 0;
			while (attempts < 24) {
				const keepWaiting = await inProgress.checkStatus();
				if (!keepWaiting) break;
				attempts++;
			}
			if (inProgress?.props?.status !== "Done") {
				throw new Error(
					`Remote proving did not complete (status: ${
						inProgress?.props?.status
					}). inputShape=${
						Array.isArray(inputs) ? "array" : typeof inputs
					}`
				);
			}
			return inProgress;
		}

		async function tryLocal(inputs: any) {
			return (prover as any).generateLocalProof(eml, inputs);
		}

		try {
			// Most relayer builds accept a plain object map
			proof = await tryRemote(externalInputsMap);
		} catch (e1) {
			try {
				proof = await tryRemote(externalInputsTyped);
			} catch (e2) {
				try {
					proof = await tryRemote(externalInputsArray);
				} catch (e3) {
					try {
						proof = await tryLocal(externalInputsMap);
					} catch (e4) {
						try {
							proof = await tryLocal(externalInputsTyped);
						} catch (e5) {
							proof = await tryLocal(externalInputsArray);
						}
					}
				}
			}
		}

		const snarkProof = proof?.props?.proofData;
		const publicSignals =
			proof?.props?.publicOutputs ?? proof?.props?.publicData;
		if (!snarkProof || !publicSignals) {
			return NextResponse.json(
				{ success: false, error: "Missing proofData/publicSignals" },
				{ status: 400 }
			);
		}

		const submit = await fetch(`${RELAYER_URL}/submit-proof/${apiKey}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				proofType: "groth16",
				vkRegistered: true,
				proofOptions: { library: "snarkjs", curve: "bn128" },
				proofData: { proof: snarkProof, publicSignals, vk: vkHash },
			}),
		});
		if (!submit.ok) {
			const t = await submit.text();
			return NextResponse.json(
				{ success: false, error: `Submit failed: ${t}` },
				{ status: 500 }
			);
		}
		const submitData = await submit.json();
		if (submitData.optimisticVerify !== "success") {
			return NextResponse.json(
				{ success: false, error: "Optimistic verification failed" },
				{ status: 400 }
			);
		}

		return NextResponse.json({
			success: true,
			jobId: submitData.jobId,
			proofData: { proof: snarkProof, publicSignals, vkHash },
		});
	} catch (e: any) {
		return NextResponse.json(
			{ success: false, error: e?.message || "Server error" },
			{ status: 500 }
		);
	}
}
