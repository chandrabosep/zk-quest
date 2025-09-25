"use client";

import { useState } from "react";
import ZkEmail from "./zk-email";
import { Proof } from "@zk-email/sdk";

export default function ZkEmailExample() {
	const [proof, setProof] = useState<Proof | null>(null);
	const [verificationResult, setVerificationResult] = useState<any>(null);

	const handleProofGenerated = (generatedProof: Proof) => {
		console.log("Proof generated:", generatedProof);
		setProof(generatedProof);
	};

	const handleProofVerified = (result: any) => {
		console.log("Proof verified:", result);
		setVerificationResult(result);
	};

	const handleError = (error: string) => {
		console.error("Error:", error);
		alert(`Error: ${error}`);
	};

	return (
		<div className="max-w-2xl mx-auto p-6">
			<h1 className="text-2xl font-bold mb-6">
				ZK Email Verification Example
			</h1>

			<div className="space-y-6">
				{/* Example 1: Basic usage without API key */}
				<div className="border rounded-lg p-4">
					<h2 className="text-lg font-semibold mb-3">
						Basic Usage (Off-chain verification only)
					</h2>
					<ZkEmail
						onProofGenerated={handleProofGenerated}
						onProofVerified={handleProofVerified}
						onError={handleError}
						username="your-github-username"
					/>
				</div>

				{/* Example 2: With zkVerify Relayer API */}
				<div className="border rounded-lg p-4">
					<h2 className="text-lg font-semibold mb-3">
						With zkVerify Relayer API
					</h2>
					<p className="text-sm text-gray-600 mb-3">
						To use this, you need to get an API key from the Horizen
						Labs team.
					</p>
					<ZkEmail
						onProofGenerated={handleProofGenerated}
						onProofVerified={handleProofVerified}
						onError={handleError}
						username="your-github-username"
						apiKey="your-zkverify-api-key-here"
					/>
				</div>

				{/* Display results */}
				{proof && (
					<div className="bg-gray-50 border rounded-lg p-4">
						<h3 className="font-semibold mb-2">Generated Proof:</h3>
						<pre className="text-xs bg-white p-2 rounded border overflow-auto">
							{JSON.stringify(proof.props, null, 2)}
						</pre>
					</div>
				)}

				{verificationResult && (
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<h3 className="font-semibold mb-2">
							Verification Result:
						</h3>
						<div className="space-y-1 text-sm">
							<p>
								<strong>Transaction Hash:</strong>{" "}
								{verificationResult.txHash}
							</p>
							<p>
								<strong>Block Hash:</strong>{" "}
								{verificationResult.blockHash}
							</p>
							<p>
								<strong>Status:</strong>{" "}
								{verificationResult.status}
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

			<div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
				<h3 className="font-semibold text-yellow-800 mb-2">
					Usage Instructions:
				</h3>
				<ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
					<li>
						Upload a .eml file containing a GitHub merge
						notification email
					</li>
					<li>
						The component will generate a ZK proof using the zkEmail
						SDK
					</li>
					<li>
						If an API key is provided, it will verify the proof
						using zkVerify Relayer
					</li>
					<li>
						If no API key is provided, only off-chain verification
						will be performed
					</li>
					<li>
						Verification results will be displayed when complete
					</li>
				</ol>
			</div>
		</div>
	);
}
