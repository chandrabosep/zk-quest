"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import {
	X,
	Upload,
	AlertCircle,
	CheckCircle,
	Loader2,
	User,
	Github,
	ArrowRight,
} from "lucide-react";
import { verifyEmail, waitForEmailVerification } from "@/lib/zk-email-simple";

interface SimpleClaimDialogProps {
	isOpen: boolean;
	onClose: () => void;
	questId: string;
	questTitle: string;
	rewardAmount: number;
}

type ClaimStep = "username" | "upload" | "verifying" | "success";

export function SimpleClaimDialog({
	isOpen,
	onClose,
	questId,
	questTitle,
	rewardAmount,
}: SimpleClaimDialogProps) {
	const { address, isConnected } = useAccount();
	const [currentStep, setCurrentStep] = useState<ClaimStep>("username");
	const [username, setUsername] = useState("");
	const [emlFile, setEmlFile] = useState<File | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [proof, setProof] = useState<any>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && file.name.endsWith(".eml")) {
			setEmlFile(file);
			setError("");
		} else {
			setError("Please select a valid .eml file");
		}
	};

	const handleUsernameNext = () => {
		if (!username.trim()) {
			setError("Please enter your GitHub username");
			return;
		}
		setError("");
		setCurrentStep("upload");
	};

	const handleUploadBack = () => {
		setCurrentStep("username");
		setEmlFile(null);
		setError("");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsSubmitting(true);
		setCurrentStep("verifying");

		try {
			console.log("[Claim] Submit start", {
				isConnected,
				address,
				username,
				emlFileName: emlFile?.name,
				emlFileSize: emlFile?.size,
			});
			if (!isConnected || !address) {
				throw new Error("Please connect your wallet first");
			}

			if (!username.trim()) {
				throw new Error("Please enter your username");
			}

			if (!emlFile) {
				throw new Error("Please upload a .eml file");
			}

			// Step 1: Generate and verify via helper (no blueprint input)
			const verification = await verifyEmail(emlFile, username.trim());
			if (!verification.isValid) {
				throw new Error(verification.error || "Verification failed");
			}

			// Step 2: Submit claim with proof
			const formData = new FormData();
			formData.append("questId", questId);
			formData.append("userId", address);
			formData.append("username", username.trim());
			formData.append("emlFile", emlFile);
			formData.append(
				"proof",
				JSON.stringify(verification.proofData || {})
			);
			console.log("[Claim] Submitting /api/claims", { questId, address });

			const response = await fetch("/api/claims", {
				method: "POST",
				body: formData,
			});

			const data = await response.json();
			console.log("[Claim] /api/claims response", data);

			if (!data.success) {
				throw new Error(data.error || "Failed to submit claim");
			}

			setCurrentStep("success");
			setSuccess(true);

			// Close dialog after 3 seconds
			setTimeout(() => {
				setSuccess(false);
				onClose();
			}, 3000);
		} catch (err) {
			console.error("[Claim] Failed in submit flow", err);
			setError(
				err instanceof Error ? err.message : "Failed to submit claim"
			);
			setCurrentStep("upload");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		if (!isSubmitting) {
			setError("");
			setSuccess(false);
			setUsername("");
			setEmlFile(null);
			setCurrentStep("username");
			setProof(null);
			onClose();
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<div>
						<h2 className="text-lg font-semibold text-gray-900">
							Submit Claim
						</h2>
						<p className="text-sm text-gray-600 mt-1">
							{questTitle} - {rewardAmount} ETH
						</p>
					</div>
					<button
						onClick={handleClose}
						disabled={isSubmitting}
						className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6">
					{!isConnected ? (
						<div className="text-center py-8">
							<AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								Connect Your Wallet
							</h3>
							<p className="text-gray-600">
								You need to connect your wallet to submit a
								claim
							</p>
						</div>
					) : currentStep === "success" ? (
						<div className="text-center py-8">
							<CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								Claim Submitted Successfully!
							</h3>
							<p className="text-gray-600">
								Your claim has been verified and submitted.
							</p>
							{proof && (
								<div className="mt-4 p-3 bg-green-50 rounded-lg">
									<p className="text-sm text-green-800">
										✓ ZK Proof generated and verified
									</p>
								</div>
							)}
						</div>
					) : currentStep === "verifying" ? (
						<div className="text-center py-8">
							<Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" />
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								Verifying Your Claim
							</h3>
							<p className="text-gray-600">
								Generating ZK proof and submitting claim...
							</p>
						</div>
					) : currentStep === "username" ? (
						<div className="space-y-4">
							<div className="text-center mb-6">
								<div className="flex items-center justify-center mb-2">
									<div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
										<Github className="w-4 h-4 text-purple-600" />
									</div>
									<h3 className="text-lg font-medium text-gray-900">
										Step 1: GitHub Username
									</h3>
								</div>
								<p className="text-sm text-gray-600">
									Enter your GitHub username to continue
								</p>
							</div>

							<div>
								<label
									htmlFor="username"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									GitHub Username *
								</label>
								<div className="relative">
									<Github className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
									<input
										type="text"
										id="username"
										value={username}
										onChange={(e) =>
											setUsername(e.target.value)
										}
										placeholder="Enter your GitHub username"
										className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
										required
									/>
								</div>
							</div>

							{error && (
								<div className="bg-red-50 border border-red-200 rounded-lg p-3">
									<div className="flex items-center">
										<AlertCircle className="w-4 h-4 text-red-500 mr-2" />
										<p className="text-red-800 text-sm">
											{error}
										</p>
									</div>
								</div>
							)}

							<div className="flex items-center justify-end space-x-3 pt-4">
								<button
									type="button"
									onClick={handleClose}
									disabled={isSubmitting}
									className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleUsernameNext}
									disabled={!username.trim()}
									className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
								>
									Next
									<ArrowRight className="w-4 h-4 ml-2" />
								</button>
							</div>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="text-center mb-6">
								<div className="flex items-center justify-center mb-2">
									<div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
										<Upload className="w-4 h-4 text-purple-600" />
									</div>
									<h3 className="text-lg font-medium text-gray-900">
										Step 2: Upload Email
									</h3>
								</div>
								<p className="text-sm text-gray-600">
									Upload your GitHub merge notification .eml
									file
								</p>
								<div className="mt-2 text-xs text-gray-500">
									Username:{" "}
									<span className="font-medium">
										{username}
									</span>
								</div>
							</div>

							<div>
								<label
									htmlFor="emlFile"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									Upload .eml File *
								</label>
								<div className="relative">
									<input
										type="file"
										id="emlFile"
										accept=".eml"
										onChange={handleFileChange}
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
										required
									/>
								</div>
								<p className="mt-1 text-sm text-gray-600">
									Upload your GitHub merge notification .eml
									file
								</p>
								{emlFile && (
									<p className="mt-1 text-sm text-green-600">
										✓ {emlFile.name} selected
									</p>
								)}
							</div>

							{error && (
								<div className="bg-red-50 border border-red-200 rounded-lg p-3">
									<div className="flex items-center">
										<AlertCircle className="w-4 h-4 text-red-500 mr-2" />
										<p className="text-red-800 text-sm">
											{error}
										</p>
									</div>
								</div>
							)}

							<div className="flex items-center justify-between space-x-3 pt-4">
								<button
									type="button"
									onClick={handleUploadBack}
									disabled={isSubmitting}
									className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
								>
									Back
								</button>
								<button
									type="submit"
									disabled={isSubmitting || !emlFile}
									className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isSubmitting ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											Verifying...
										</>
									) : (
										"Verify & Submit"
									)}
								</button>
							</div>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}
