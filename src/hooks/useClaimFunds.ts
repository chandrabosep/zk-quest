import { useState } from "react";
import { useAccount } from "wagmi";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { QUEST_ESCROW_CONFIG } from "@/contracts/config";

export function useClaimFunds() {
	const { address } = useAccount();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { writeContract, data: hash, isPending } = useWriteContract();

	const { isLoading: isConfirming, isSuccess: isConfirmed } =
		useWaitForTransactionReceipt({
			hash,
		});

	/**
	 * Release funds from escrow to claimer (called by quest creator)
	 */
	const releaseQuestFunds = async (
		questId: string,
		claimerAddress: string
	) => {
		try {
			setError(null);
			setIsLoading(true);

			if (!address) {
				throw new Error("Wallet not connected");
			}

			await writeContract({
				address: QUEST_ESCROW_CONFIG.address,
				abi: QUEST_ESCROW_CONFIG.abi,
				functionName: "releaseQuestFunds",
				args: [questId, claimerAddress],
			});

			return hash;
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to release funds";
			setError(errorMessage);
			throw new Error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Withdraw available balance (called by claimer)
	 */
	const withdrawFunds = async () => {
		try {
			setError(null);
			setIsLoading(true);

			if (!address) {
				throw new Error("Wallet not connected");
			}

			await writeContract({
				address: QUEST_ESCROW_CONFIG.address,
				abi: QUEST_ESCROW_CONFIG.abi,
				functionName: "withdraw",
			});

			return hash;
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to withdraw funds";
			setError(errorMessage);
			throw new Error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return {
		releaseQuestFunds,
		withdrawFunds,
		isLoading: isLoading || isPending,
		isConfirming,
		isConfirmed,
		error,
		transactionHash: hash,
	};
}

/**
 * Hook to automatically handle fund release when claim is verified
 */
export function useAutoFundRelease() {
	const { releaseQuestFunds, isLoading, error, transactionHash } =
		useClaimFunds();

	const releaseFundsForClaim = async (
		questId: string,
		claimerAddress: string
	) => {
		try {
			// Release funds from escrow contract
			const txHash = await releaseQuestFunds(questId, claimerAddress);

			// Return transaction hash for tracking
			return txHash;
		} catch (err) {
			console.error("Failed to release funds:", err);
			throw err;
		}
	};

	return {
		releaseFundsForClaim,
		isLoading,
		error,
		transactionHash,
	};
}
