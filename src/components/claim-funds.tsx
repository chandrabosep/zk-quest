"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { CheckCircle, AlertCircle, Loader2, DollarSign } from "lucide-react";
import { useClaimFunds } from "@/hooks/useClaimFunds";

interface ClaimFundsProps {
	questId?: string;
	claimerAddress?: string;
	onFundsReleased?: () => void;
}

export function ClaimFunds({
	questId,
	claimerAddress,
	onFundsReleased,
}: ClaimFundsProps) {
	const { address } = useAccount();
	const [isReleasing, setIsReleasing] = useState(false);
	const [isWithdrawing, setIsWithdrawing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const {
		releaseQuestFunds,
		withdrawFunds,
		isLoading,
		isConfirming,
		isConfirmed,
		transactionHash,
	} = useClaimFunds();
	const [balance, setBalance] = useState<string>("0");
	const [balanceLoading, setBalanceLoading] = useState(false);

	// Handle transaction confirmation
	useEffect(() => {
		if (isConfirmed && (isReleasing || isWithdrawing)) {
			setSuccess(true);
			setIsReleasing(false);
			setIsWithdrawing(false);
			onFundsReleased?.();
		}
	}, [isConfirmed, isReleasing, isWithdrawing, onFundsReleased]);

	const handleReleaseFunds = async () => {
		if (!questId || !claimerAddress) {
			setError("Missing quest ID or claimer address");
			return;
		}

		try {
			setError(null);
			setIsReleasing(true);
			await releaseQuestFunds(questId, claimerAddress);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to release funds"
			);
			setIsReleasing(false);
		}
	};

	const handleWithdrawFunds = async () => {
		try {
			setError(null);
			setIsWithdrawing(true);
			await withdrawFunds();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to withdraw funds"
			);
			setIsWithdrawing(false);
		}
	};

	if (!address) {
		return (
			<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
				<div className="flex items-center">
					<AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
					<span className="text-yellow-700">
						Connect your wallet to manage funds
					</span>
				</div>
			</div>
		);
	}

	if (success) {
		return (
			<div className="bg-green-50 border border-green-200 rounded-lg p-4">
				<div className="flex items-center">
					<CheckCircle className="w-5 h-5 text-green-500 mr-2" />
					<span className="text-green-700">
						Transaction confirmed! Funds processed successfully.
					</span>
				</div>
				{transactionHash && (
					<p className="text-sm text-green-600 mt-2 font-mono break-all">
						Tx: {transactionHash}
					</p>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* User Balance */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center">
						<DollarSign className="w-5 h-5 text-blue-500 mr-2" />
						<span className="text-blue-700 font-medium">
							Your Balance:
						</span>
					</div>
					<div className="text-blue-900 font-bold">
						{balanceLoading ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							`${balance?.eth || "0"} ETH`
						)}
					</div>
				</div>
			</div>

			{/* Release Funds Button (for quest creators) */}
			{questId && claimerAddress && (
				<button
					onClick={handleReleaseFunds}
					disabled={isLoading || isReleasing}
					className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
				>
					{isLoading || isReleasing ? (
						<div className="flex items-center justify-center">
							<Loader2 className="h-5 w-5 mr-2 animate-spin" />
							{isConfirming
								? "Confirming..."
								: "Releasing Funds..."}
						</div>
					) : (
						"Release Funds to Claimer"
					)}
				</button>
			)}

			{/* Withdraw Funds Button (for claimers) */}
			{balance && parseFloat(balance.eth) > 0 && (
				<button
					onClick={handleWithdrawFunds}
					disabled={isLoading || isWithdrawing}
					className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
				>
					{isLoading || isWithdrawing ? (
						<div className="flex items-center justify-center">
							<Loader2 className="h-5 w-5 mr-2 animate-spin" />
							{isConfirming ? "Confirming..." : "Withdrawing..."}
						</div>
					) : (
						`Withdraw ${balance.eth} ETH`
					)}
				</button>
			)}

			{/* Error Message */}
			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<div className="flex items-center">
						<AlertCircle className="w-5 h-5 text-red-500 mr-2" />
						<span className="text-red-700">{error}</span>
					</div>
				</div>
			)}

			{/* Transaction Hash */}
			{transactionHash && (
				<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
					<p className="text-sm text-gray-600 font-mono break-all">
						Transaction: {transactionHash}
					</p>
				</div>
			)}
		</div>
	);
}

/**
 * Component for displaying fund status and actions
 */
export function FundStatus({
	questId,
	claimerAddress,
}: {
	questId: string;
	claimerAddress: string;
}) {
	const [balance] = useState<string>("0");
	const [isLoading] = useState(false);

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<h3 className="text-lg font-semibold text-gray-900 mb-4">
				Fund Status
			</h3>

			<div className="space-y-3">
				<div className="flex justify-between items-center">
					<span className="text-gray-600">Quest ID:</span>
					<span className="font-mono text-sm">{questId}</span>
				</div>

				<div className="flex justify-between items-center">
					<span className="text-gray-600">Claimer:</span>
					<span className="font-mono text-sm">{claimerAddress}</span>
				</div>

				<div className="flex justify-between items-center">
					<span className="text-gray-600">Available Balance:</span>
					<span className="font-bold">
						{isLoading ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							`${balance?.eth || "0"} ETH`
						)}
					</span>
				</div>
			</div>
		</div>
	);
}
