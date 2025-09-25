import { useState } from "react";
import {
	useAccount,
	useWriteContract,
	useReadContract,
	useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { QUEST_ESCROW_CONFIG } from "@/contracts/config";

export function useQuestEscrow() {
	const { address } = useAccount();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { writeContract, data: hash, isPending } = useWriteContract();

	const { isLoading: isConfirming, isSuccess: isConfirmed } =
		useWaitForTransactionReceipt({
			hash,
		});

	/**
	 * Create a quest and deposit funds into escrow
	 */
	const createQuest = async (questId: string, amountInEth: string) => {
		try {
			setError(null);
			setIsLoading(true);

			if (!address) {
				throw new Error("Wallet not connected");
			}

			const amountWei = parseEther(amountInEth);

			await writeContract({
				address: QUEST_ESCROW_CONFIG.address,
				abi: QUEST_ESCROW_CONFIG.abi,
				functionName: "createQuest",
				args: [questId],
				value: amountWei,
			});

			return hash;
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to create quest";
			setError(errorMessage);
			throw new Error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Release funds to claimer
	 */
	const releaseFunds = async (questId: string, claimerAddress: string) => {
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
	 * Withdraw available balance
	 */
	const withdraw = async () => {
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
				err instanceof Error ? err.message : "Failed to withdraw";
			setError(errorMessage);
			throw new Error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Cancel quest and get refund
	 */
	const cancelQuest = async (questId: string) => {
		try {
			setError(null);
			setIsLoading(true);

			if (!address) {
				throw new Error("Wallet not connected");
			}

			await writeContract({
				address: QUEST_ESCROW_CONFIG.address,
				abi: QUEST_ESCROW_CONFIG.abi,
				functionName: "cancelQuest",
				args: [questId],
			});

			return hash;
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to cancel quest";
			setError(errorMessage);
			throw new Error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return {
		createQuest,
		releaseFunds,
		withdraw,
		cancelQuest,
		isLoading: isLoading || isPending,
		isConfirming,
		isConfirmed,
		error,
		transactionHash: hash,
	};
}

/**
 * Hook to read quest data from contract
 */
export function useQuestData(questId: string | null) {
	const { data, isLoading, error, refetch } = useReadContract({
		address: QUEST_ESCROW_CONFIG.address,
		abi: QUEST_ESCROW_CONFIG.abi,
		functionName: "getQuest",
		args: questId ? [questId] : undefined,
		query: {
			enabled: !!questId,
		},
	});

	const questData = data
		? {
				creator: data[0] as string,
				amount: data[1] as bigint,
				amountEth: formatEther(data[1] as bigint),
				completed: data[2] as boolean,
				fundsReleased: data[3] as boolean,
				claimer: data[4] as string,
		  }
		: null;

	return {
		questData,
		isLoading,
		error,
		refetch,
	};
}

/**
 * Hook to read user's withdrawable balance
 */
export function useUserBalance() {
	const { address } = useAccount();

	const { data, isLoading, error, refetch } = useReadContract({
		address: QUEST_ESCROW_CONFIG.address,
		abi: QUEST_ESCROW_CONFIG.abi,
		functionName: "getBalance",
		args: address ? [address] : undefined,
		query: {
			enabled: !!address,
		},
	});

	const balance = data
		? {
				wei: data as bigint,
				eth: formatEther(data as bigint),
		  }
		: null;

	return {
		balance,
		isLoading,
		error,
		refetch,
	};
}

/**
 * Hook to check if quest has available funds
 */
export function useQuestFundsAvailable(questId: string | null) {
	const { data, isLoading, error, refetch } = useReadContract({
		address: QUEST_ESCROW_CONFIG.address,
		abi: QUEST_ESCROW_CONFIG.abi,
		functionName: "hasAvailableFunds",
		args: questId ? [questId] : undefined,
		query: {
			enabled: !!questId,
		},
	});

	return {
		hasAvailableFunds: data as boolean,
		isLoading,
		error,
		refetch,
	};
}
