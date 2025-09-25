"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { ClaimFunds } from "@/components/claim-funds";

interface ClaimApprovalComponentProps {
	claimId: string;
	questId: string;
	claimerAddress: string;
	claimerUsername?: string;
	amount: number;
	onApprovalSuccess?: () => void;
}

export function ClaimApprovalComponent({
	claimId,
	questId,
	claimerAddress,
	claimerUsername,
	amount,
	onApprovalSuccess,
}: ClaimApprovalComponentProps) {
	const { address } = useAccount();
	const [isApproving, setIsApproving] = useState(false);
	const [isRejecting, setIsRejecting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleApprove = async () => {
		if (!address) {
			setError("Please connect your wallet first");
			return;
		}

		try {
			setError(null);
			setIsApproving(true);

			const response = await fetch(`/api/claims/${claimId}/verify`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					status: "APPROVED",
					verifierAddress: address,
				}),
			});

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || "Failed to approve claim");
			}

			// Call success callback
			onApprovalSuccess?.();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to approve claim"
			);
		} finally {
			setIsApproving(false);
		}
	};

	const handleReject = async () => {
		if (!address) {
			setError("Please connect your wallet first");
			return;
		}

		try {
			setError(null);
			setIsRejecting(true);

			const response = await fetch(`/api/claims/${claimId}/verify`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					status: "REJECTED",
					verifierAddress: address,
				}),
			});

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || "Failed to reject claim");
			}

			// Call success callback
			onApprovalSuccess?.();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to reject claim"
			);
		} finally {
			setIsRejecting(false);
		}
	};

	// Check if current user is the quest creator
	const isQuestCreator = address === claimerAddress; // This should be compared with quest creator address

	return (
		<div className="space-y-4">
			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-3">
					<div className="flex items-center">
						<AlertCircle className="w-4 h-4 text-red-500 mr-2" />
						<p className="text-red-800 text-sm">{error}</p>
					</div>
				</div>
			)}

			<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<h4 className="text-yellow-800 font-medium text-sm mb-2">
							Claim Review Required
						</h4>
						<p className="text-yellow-700 text-sm mb-3">
							Review the submission and approve or reject this
							claim for <strong>{amount} ETH</strong>
						</p>
						<p className="text-yellow-600 text-xs">
							Claimer: {claimerUsername || "Anonymous"} (
							{claimerAddress})
						</p>
					</div>
				</div>

				<div className="flex items-center space-x-3 mt-4">
					<button
						onClick={handleApprove}
						disabled={isApproving || isRejecting}
						className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isApproving ? (
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						) : (
							<CheckCircle className="w-4 h-4 mr-2" />
						)}
						{isApproving ? "Approving..." : "Approve"}
					</button>

					<button
						onClick={handleReject}
						disabled={isApproving || isRejecting}
						className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isRejecting ? (
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						) : (
							<XCircle className="w-4 h-4 mr-2" />
						)}
						{isRejecting ? "Rejecting..." : "Reject"}
					</button>
				</div>
			</div>

			{/* Fund Release Component for Approved Claims */}
			<ClaimFunds
				questId={questId}
				claimerAddress={claimerAddress}
				onFundsReleased={onApprovalSuccess}
			/>
		</div>
	);
}
