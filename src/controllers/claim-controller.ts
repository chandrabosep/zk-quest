import { ClaimService } from "@/db/services/claim";
import { QuestService } from "@/db/services/quest";
import type { ClaimStatus } from "@prisma/client";

export interface CreateClaimData {
	questId: string;
	userId: string;
	proofUrl?: string;
	username?: string;
}

export interface UpdateClaimStatusData {
	status: ClaimStatus;
	skipRewards?: boolean;
}

export class ClaimController {
	/**
	 * Create a new claim with validation
	 */
	static async createClaim(data: CreateClaimData) {
		if (!data.questId || !data.userId) {
			throw new Error("questId and userId are required");
		}

		try {
			return await ClaimService.createClaim({
				questId: data.questId,
				userId: data.userId,
				proofUrl: data.proofUrl,
				username: data.username,
			});
		} catch (error) {
			// Re-throw with original message for business logic errors
			if (error instanceof Error) {
				throw error;
			}
			throw new Error("Failed to create claim");
		}
	}

	/**
	 * Get a specific claim by ID
	 */
	static async getClaimById(id: string) {
		const claim = await ClaimService.getClaimById(id);

		if (!claim) {
			throw new Error("Claim not found");
		}

		return claim;
	}

	/**
	 * Update claim status (approve/reject)
	 */
	static async updateClaimStatus(
		claimId: string,
		data: UpdateClaimStatusData
	) {
		const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
		if (!validStatuses.includes(data.status)) {
			throw new Error("Invalid status");
		}

		try {
			return await ClaimService.updateClaimStatus(claimId, data.status, {
				skipRewards: data.skipRewards,
			});
		} catch (error) {
			if (error instanceof Error) {
				throw error;
			}
			throw new Error("Failed to update claim");
		}
	}

	/**
	 * Get claims by quest ID
	 */
	static async getClaimsByQuest(questId: string) {
		if (!questId) {
			throw new Error("questId is required");
		}

		return await ClaimService.getClaimsByQuest(questId);
	}

	/**
	 * Get claims by user ID
	 */
	static async getClaimsByUser(userId: string) {
		if (!userId) {
			throw new Error("userId is required");
		}

		return await ClaimService.getClaimsByUser(userId);
	}

	/**
	 * Get all pending claims
	 */
	static async getPendingClaims() {
		return await ClaimService.getPendingClaims();
	}

	/**
	 * Approve a claim and release funds
	 */
	static async approveClaim(claimId: string, skipRewards = false) {
		// First get the claim to extract questId and userId
		const claim = await ClaimService.getClaimById(claimId);
		if (!claim) {
			throw new Error("Claim not found");
		}

		// Check if funds can be released
		const canRelease = await QuestService.canReleaseFunds(claim.questId);
		if (!canRelease && !skipRewards) {
			throw new Error("Funds cannot be released for this quest");
		}

		// Update claim status
		const updatedClaim = await this.updateClaimStatus(claimId, {
			status: "APPROVED",
			skipRewards,
		});

		// Release funds if not skipped
		if (!skipRewards && canRelease) {
			await QuestService.releaseFunds(claim.questId, claim.userId);
		}

		return updatedClaim;
	}

	/**
	 * Reject a claim
	 */
	static async rejectClaim(claimId: string) {
		return await this.updateClaimStatus(claimId, {
			status: "REJECTED",
		});
	}

	/**
	 * Get claim statistics for a user
	 */
	static async getUserClaimStats(userId: string) {
		const claims = await this.getClaimsByUser(userId);

		const stats = {
			total: claims.length,
			pending: 0,
			approved: 0,
			rejected: 0,
			totalRewards: 0,
		};

		claims.forEach((claim) => {
			switch (claim.status) {
				case "PENDING":
					stats.pending++;
					break;
				case "APPROVED":
					stats.approved++;
					stats.totalRewards += claim.quest.rewardAmount;
					break;
				case "REJECTED":
					stats.rejected++;
					break;
			}
		});

		return stats;
	}

	/**
	 * Get claim statistics for a quest
	 */
	static async getQuestClaimStats(questId: string) {
		const claims = await this.getClaimsByQuest(questId);

		const stats = {
			total: claims.length,
			pending: 0,
			approved: 0,
			rejected: 0,
		};

		claims.forEach((claim) => {
			switch (claim.status) {
				case "PENDING":
					stats.pending++;
					break;
				case "APPROVED":
					stats.approved++;
					break;
				case "REJECTED":
					stats.rejected++;
					break;
			}
		});

		return stats;
	}

	/**
	 * Check if user has already claimed a quest
	 */
	static async hasUserClaimedQuest(userId: string, questId: string) {
		const claims = await this.getClaimsByUser(userId);
		return claims.some(
			(claim) =>
				claim.questId === questId &&
				(claim.status === "PENDING" || claim.status === "APPROVED")
		);
	}

	/**
	 * Get recent claims activity
	 */
	static async getRecentActivity(limit = 10) {
		const pendingClaims = await this.getPendingClaims();
		return pendingClaims.slice(0, limit);
	}

	/**
	 * Auto-approve claim and release funds when proof is verified
	 * This is called by external verification services
	 */
	static async autoApproveClaim(claimId: string, verificationData?: any) {
		// Get claim details
		const claim = await ClaimService.getClaimById(claimId);
		if (!claim) {
			throw new Error("Claim not found");
		}

		// Check if claim is still pending
		if (claim.status !== "PENDING") {
			throw new Error("Claim is not pending");
		}

		// Update claim status to approved
		const updatedClaim = await ClaimService.updateClaimStatus(
			claimId,
			"APPROVED",
			{
				skipRewards: false,
			}
		);

		// Check if quest has escrow funds and release them
		const quest = await QuestService.getQuestById(claim.questId);
		if (quest && quest.transactionHash && !quest.fundsReleased) {
			// Mark funds as released in database
			await QuestService.releaseFunds(claim.questId, claim.userId);
		}

		return {
			claim: updatedClaim,
			quest: quest,
			requiresBlockchainRelease:
				quest?.transactionHash && !quest?.fundsReleased,
		};
	}
}
