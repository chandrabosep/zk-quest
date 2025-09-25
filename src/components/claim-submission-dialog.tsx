"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { X, Upload, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface ClaimSubmissionDialogProps {
	isOpen: boolean;
	onClose: () => void;
	questId: string;
	questTitle: string;
}

export function ClaimSubmissionDialog({
	isOpen,
	onClose,
	questId,
	questTitle,
}: ClaimSubmissionDialogProps) {
	const { address, isConnected } = useAccount();
	const [proofUrl, setProofUrl] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsSubmitting(true);

		try {
			if (!isConnected || !address) {
				throw new Error("Please connect your wallet first");
			}

			if (!proofUrl.trim()) {
				throw new Error("Please provide a proof URL");
			}

			// Validate URL format
			try {
				new URL(proofUrl);
			} catch {
				throw new Error("Please provide a valid URL");
			}

			const response = await fetch("/api/claims", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					questId,
					userId: address,
					proofUrl: proofUrl.trim(),
				}),
			});

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || "Failed to submit claim");
			}

			setSuccess(true);
			setProofUrl("");

			// Close dialog after 2 seconds
			setTimeout(() => {
				setSuccess(false);
				onClose();
			}, 2000);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to submit claim"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		if (!isSubmitting) {
			setError("");
			setSuccess(false);
			setProofUrl("");
			onClose();
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<div>
						<h2 className="text-lg font-semibold text-gray-900">
							Submit Claim
						</h2>
						<p className="text-sm text-gray-600 mt-1">
							{questTitle}
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
							<p className="text-gray-600 mb-4">
								You need to connect your wallet to submit a claim
							</p>
						</div>
					) : success ? (
						<div className="text-center py-8">
							<CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								Claim Submitted Successfully!
							</h3>
							<p className="text-gray-600">
								Your claim has been submitted and is pending review.
							</p>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label
									htmlFor="proofUrl"
									className="block text-sm font-medium text-gray-700 mb-2"
								>
									Proof URL *
								</label>
								<div className="relative">
									<Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
									<input
										type="url"
										id="proofUrl"
										value={proofUrl}
										onChange={(e) => setProofUrl(e.target.value)}
										placeholder="https://github.com/username/repo/pull/123"
										className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
										required
									/>
								</div>
								<p className="mt-1 text-sm text-gray-600">
									Provide a link to your GitHub pull request, commit, or other proof of work
								</p>
							</div>

							{error && (
								<div className="bg-red-50 border border-red-200 rounded-lg p-3">
									<div className="flex items-center">
										<AlertCircle className="w-4 h-4 text-red-500 mr-2" />
										<p className="text-red-800 text-sm">{error}</p>
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
									type="submit"
									disabled={isSubmitting || !proofUrl.trim()}
									className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isSubmitting ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											Submitting...
										</>
									) : (
										"Submit Claim"
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
