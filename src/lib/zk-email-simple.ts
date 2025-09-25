"use client";

import type { Proof } from "@zk-email/sdk";

type ZkEmailProofShape = {
	props: {
		proofData: any;
		publicOutputs?: any[];
		publicData?: any[];
		id?: string;
		status?: string;
	};
};

export interface EmailVerificationResult {
	isValid: boolean;
	jobId: string;
	proofData?: {
		proof: any;
		publicSignals: any[];
		vkHash: string;
	};
	error?: string;
}

const RELAYER_URL = "https://relayer-api.horizenlabs.io";
const API_KEY = process.env.NEXT_PUBLIC_ZK_VERIFY_API_KEY;

// Cache for registered vkHashes to avoid re-registering
const vkHashCache = new Map<string, string>();

async function ensureVkHash(
	vkeyObj: any,
	blueprintSlug: string
): Promise<string> {
	if (!API_KEY)
		throw new Error("Missing NEXT_PUBLIC_ZK_VERIFY_API_KEY env var");
	if (vkHashCache.has(blueprintSlug)) return vkHashCache.get(blueprintSlug)!;

	const regParams = {
		proofType: "groth16",
		proofOptions: { library: "snarkjs", curve: "bn128" },
		vk: vkeyObj,
	};

	const res = await fetch(`${RELAYER_URL}/register-vk/${API_KEY}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(regParams),
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

// Verify email using a fixed blueprint internally; API stays simple (no blueprint arg)
export async function verifyEmail(
	emlFile: File,
	username: string
): Promise<EmailVerificationResult> {
	try {
		const form = new FormData();
		form.append("username", username.trim());
		form.append("emlFile", emlFile);
		const res = await fetch("/api/zkemail/verify", {
			method: "POST",
			body: form,
		});
		const data = await res.json();
		if (!res.ok || !data?.success) {
			return {
				isValid: false,
				jobId: "",
				error: data?.error || res.statusText,
			};
		}
		return {
			isValid: true,
			jobId: data.jobId,
			proofData: data.proofData,
		};
	} catch (error) {
		return {
			isValid: false,
			jobId: "",
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export async function waitForEmailVerification(
	jobId: string,
	maxAttempts: number = 20,
	intervalMs: number = 5000
): Promise<{ success: boolean; status: string; data?: any; error?: string }> {
	if (!API_KEY)
		return { success: false, status: "error", error: "Missing API key" };
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const res = await fetch(
			`${RELAYER_URL}/job-status/${API_KEY}/${jobId}`
		);
		if (!res.ok)
			return { success: false, status: "error", error: res.statusText };
		const data = await res.json();
		const status = data.status;
		if (status === "Finalized" || status === "Aggregated") {
			return { success: true, status, data };
		}
		if (status === "Failed" || status === "Rejected") {
			return {
				success: false,
				status,
				error: `Verification failed with status: ${status}`,
			};
		}
		if (attempt < maxAttempts - 1)
			await new Promise((r) => setTimeout(r, intervalMs));
	}
	return { success: false, status: "timeout", error: "Verification timeout" };
}
