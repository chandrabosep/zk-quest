"use client";

import { useState } from "react";
import zkeSDK, { Proof } from "@zk-email/sdk";
import {
	zkVerifySession,
	Library,
	CurveType,
	ZkVerifyEvents,
} from "zkverifyjs";
import axios from "axios";

interface ZkEmailProps {
	onProofGenerated?: (proof: Proof) => void;
	onProofVerified?: (verificationResult: any) => void;
	onError?: (error: string) => void;
	disabled?: boolean;
	username?: string;
	apiKey?: string; // zkVerify API key for relayer
	seedPhrase?: string; // fallback for direct zkVerifyJS (use with caution in client)
}

export default function ZkEmail({
	onProofGenerated,
	onProofVerified,
	onError,
	disabled = false,
	username,
	apiKey,
	seedPhrase,
}: ZkEmailProps) {
	const [proof, setProof] = useState<Proof | null>(null);
	const [loading, setLoading] = useState(false);
	const [verifying, setVerifying] = useState(false);
	const [verificationStatus, setVerificationStatus] = useState<string>("");
	const [verificationResult, setVerificationResult] = useState<any>(null);

	// zkVerify verification using zkVerifyJS
	const verifyWithZkVerifyJS = async (proof: Proof, vkey: any) => {
		try {
			setVerifying(true);
			setVerificationStatus("Verifying with zkVerifyJS...");

			if (!seedPhrase) {
				throw new Error(
					"Missing seedPhrase for zkVerifyJS verification. Provide apiKey to use the Relayer or pass seedPhrase explicitly."
				);
			}

			// Create a session using provided seed phrase
			const session = await zkVerifySession
				.start()
				.Volta()
				.withAccount(seedPhrase);

			// Verify the proof
			const { events } = await session
				.verify()
				.groth16({ library: Library.snarkjs, curve: CurveType.bn128 })
				.execute({
					proofData: {
						vk: JSON.parse(vkey),
						proof: proof.props.proofData,
						publicSignals: proof.props.publicOutputs,
					},
				});

			// Listen for verification events
			events.on(ZkVerifyEvents.IncludedInBlock, (eventData) => {
				console.log("Included in block", eventData);
				setVerificationStatus("Verified on-chain!");
				setVerificationResult(eventData);
				if (onProofVerified) {
					onProofVerified(eventData);
				}
				session.close();
			});
		} catch (error) {
			console.error("zkVerifyJS verification error:", error);
			setVerificationStatus("Verification failed");
			if (onError) {
				onError("zkVerifyJS verification failed");
			}
		} finally {
			setVerifying(false);
		}
	};

	// zkVerify verification using Relayer API
	const verifyWithRelayer = async (proof: Proof, vkey: any) => {
		if (!apiKey) {
			console.warn("No API key provided for relayer verification");
			return;
		}

		try {
			setVerifying(true);
			setVerificationStatus("Verifying with zkVerify Relayer...");

			const API_URL = "https://relayer-api.horizenlabs.io/api/v1";

			// Register verification key first
			const regParams = {
				proofType: "groth16",
				proofOptions: {
					library: "snarkjs",
					curve: "bn128",
				},
				vk: JSON.parse(vkey),
			};

			const regResponse = await axios.post(
				`${API_URL}/register-vk/${apiKey}`,
				regParams
			);
			console.log("VK registered:", regResponse.data);

			// Submit proof for verification
			const submitParams = {
				proofType: "groth16",
				proofOptions: {
					library: "snarkjs",
					curve: "bn128",
				},
				proof: proof.props.proofData,
				publicInputs: proof.props.publicOutputs,
				vkHash: regResponse.data.vkHash,
			};

			const submitResponse = await axios.post(
				`${API_URL}/submit-proof/${apiKey}`,
				submitParams
			);
			console.log("Proof submitted:", submitResponse.data);

			if (submitResponse.data.optimisticVerify !== "success") {
				throw new Error("Proof verification failed");
			}

			// Poll for job status
			const jobId = submitResponse.data.jobId;
			while (true) {
				const jobStatusResponse = await axios.get(
					`${API_URL}/job-status/${apiKey}/${jobId}`
				);
				const status = jobStatusResponse.data.status;

				setVerificationStatus(`Status: ${status}`);

				if (status === "Finalized") {
					console.log(
						"Job finalized successfully:",
						jobStatusResponse.data
					);
					setVerificationStatus("Verified on-chain!");
					setVerificationResult(jobStatusResponse.data);
					if (onProofVerified) {
						onProofVerified(jobStatusResponse.data);
					}
					break;
				} else if (status === "Failed") {
					throw new Error("Proof verification failed");
				}

				// Wait 5 seconds before checking again
				await new Promise((resolve) => setTimeout(resolve, 5000));
			}
		} catch (error) {
			console.error("Relayer verification error:", error);
			setVerificationStatus("Verification failed");
			if (onError) {
				onError("Relayer verification failed");
			}
		} finally {
			setVerifying(false);
		}
	};

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setLoading(true);
		try {
			// Read the file as text
			const eml = await file.text();

			// Initialize the SDK
			const sdk = zkeSDK();

			// Get the blueprint
			const blueprint = await sdk.getBlueprint(
				"chandrabosep/retro_github@v3"
			);

			// Create a prover
			const prover = blueprint.createProver();

			// Define external inputs - only username is needed
			const externalInputs = username
				? [
						{
							name: "username",
							value: username,
							maxLength: 100,
						},
				  ]
				: [];

			// Generate the proof with external inputs
			const generatedProof = await prover.generateProof(
				eml,
				externalInputs
			);
			setProof(generatedProof);

			// Call the callback if provided
			if (onProofGenerated) {
				onProofGenerated(generatedProof);
			}

			// Get the verification key for zkVerify
			const vkey = await blueprint.getVkey();

			// Immediately verify on-chain with zkVerify (skip zkEmail local verification)
			if (apiKey) {
				await verifyWithRelayer(generatedProof, vkey);
			} else {
				await verifyWithZkVerifyJS(generatedProof, vkey);
			}
		} catch (error) {
			console.error("Error generating proof:", error);
			if (onError) {
				onError(
					error instanceof Error
						? error.message
						: "Failed to generate proof"
				);
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-4">
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					ZK Email Verification
				</label>
				<input
					type="file"
					accept=".eml"
					onChange={handleFileUpload}
					disabled={loading || disabled}
					className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50"
				/>
			</div>

			{loading && (
				<div className="text-center py-4">
					<div className="inline-flex items-center text-sm text-purple-600">
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
						Generating ZK proof...
					</div>
				</div>
			)}

			{verifying && (
				<div className="text-center py-4">
					<div className="inline-flex items-center text-sm text-blue-600">
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
						{verificationStatus || "Verifying with zkVerify..."}
					</div>
				</div>
			)}

			{proof && !verifying && (
				<div className="bg-green-50 border border-green-200 rounded-lg p-3">
					<div className="flex items-center">
						<div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
						<p className="text-green-800 text-sm font-medium">
							ZK Proof generated successfully
						</p>
					</div>
				</div>
			)}

			{verificationResult && (
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
					<div className="flex items-center mb-2">
						<div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
						<p className="text-blue-800 text-sm font-medium">
							zkVerify Verification Complete
						</p>
					</div>
					<div className="text-xs text-blue-700">
						<p>
							<strong>Transaction Hash:</strong>{" "}
							{verificationResult.txHash}
						</p>
						<p>
							<strong>Block Hash:</strong>{" "}
							{verificationResult.blockHash}
						</p>
						{verificationResult.statement && (
							<p>
								<strong>Statement:</strong>{" "}
								{verificationResult.statement}
							</p>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
