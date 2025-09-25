"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";

interface ClaimSubmissionFormProps {
	questId: string;
}

export default function ClaimSubmissionForm({
	questId,
}: ClaimSubmissionFormProps) {
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
					userId: address, // Using wallet address as user ID for now
					proofUrl: proofUrl.trim(),
				}),
			});

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || "Failed to submit claim");
			}

			setSuccess(true);
			setProofUrl("");
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to submit claim"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isConnected) {
		return (
			<div className="text-center py-8 bg-gray-50 rounded-lg">
				<AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
				<h3 className="text-lg font-medium text-gray-900 mb-2">
					Connect Your Wallet
				</h3>
				<p className="text-gray-600 mb-4">
					You need to connect your wallet to submit a claim
				</p>
			</div>
		);
	}

	if (success) {
		return (
			<div className="text-center py-8 bg-green-50 rounded-lg">
				<CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
				<h3 className="text-lg font-medium text-green-900 mb-2">
					Claim Submitted Successfully!
				</h3>
				<p className="text-green-700">
					Your claim has been submitted and is pending review. You'll
					be notified once it's processed.
				</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label
					htmlFor="proofUrl"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					Proof URL
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
						disabled={isSubmitting}
					/>
				</div>
				<p className="mt-2 text-sm text-gray-600">
					Provide a link to your GitHub PR, deployed application, or
					other proof of completion. For email verification quests,
					upload your .eml file to a file sharing service and paste
					the link.
				</p>
			</div>

			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<div className="flex items-center">
						<AlertCircle className="w-5 h-5 text-red-500 mr-2" />
						<span className="text-red-700">{error}</span>
					</div>
				</div>
			)}

			<button
				type="submit"
				disabled={isSubmitting || !proofUrl.trim()}
				className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{isSubmitting ? (
					<div className="flex items-center justify-center">
						<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
						Submitting...
					</div>
				) : (
					"Submit Claim"
				)}
			</button>

			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div className="flex items-start">
					<AlertCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
					<div className="text-blue-700 text-sm">
						<p className="font-medium mb-1">Before submitting:</p>
						<ul className="list-disc list-inside space-y-1">
							<li>
								Ensure your work meets all quest requirements
							</li>
							<li>
								Double-check that your proof URL is accessible
							</li>
							<li>
								For GitHub PRs, make sure the PR is merged or
								ready for review
							</li>
							<li>
								Claims are reviewed manually and may take some
								time to process
							</li>
						</ul>
					</div>
				</div>
			</div>
		</form>
	);
}
