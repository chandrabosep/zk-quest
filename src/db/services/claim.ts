import { prisma } from "../prisma";
import type { Claim, ClaimStatus } from "@prisma/client";
import { QuestService } from "./quest";
import { UserService } from "./user";

export class ClaimService {
	static async createClaim(data: {
		questId: string;
		userId: string;
		proofUrl?: string;
		username?: string;
	}): Promise<Claim> {
		// Check if quest is still open
		const quest = await QuestService.getQuestById(data.questId);
		if (!quest) throw new Error("Quest not found");
		if (quest.status !== "OPEN")
			throw new Error("Quest is not open for claims");

		// Check if user already has a pending/approved claim for this quest
		const existingClaim = await prisma.claim.findFirst({
			where: {
				questId: data.questId,
				userId: data.userId,
				status: {
					in: ["PENDING", "APPROVED"],
				},
			},
		});

		if (existingClaim) {
			throw new Error("User already has a claim for this quest");
		}

		// For time-based quests, check if expired
		if (
			quest.type === "TIME_BASED" &&
			quest.expiry &&
			new Date() > quest.expiry
		) {
			await QuestService.updateQuestStatus(quest.id, "EXPIRED");
			throw new Error("Quest has expired");
		}

		// Update user's username if provided
		if (data.username) {
			await prisma.user.update({
				where: { walletAddress: data.userId },
				data: { username: data.username },
			});
		}

		return prisma.claim.create({
			data: {
				questId: data.questId,
				userId: data.userId,
				proofUrl: data.proofUrl,
			},
			include: {
				quest: true,
				user: true,
			},
		});
	}

	static async updateClaimStatus(
		claimId: string,
		status: ClaimStatus,
		options?: { skipRewards?: boolean }
	): Promise<Claim> {
		const claim = await prisma.claim.findUnique({
			where: { id: claimId },
			include: { quest: true, user: true },
		});

		if (!claim) throw new Error("Claim not found");

		const updatedClaim = await prisma.claim.update({
			where: { id: claimId },
			data: { status },
			include: {
				quest: true,
				user: true,
			},
		});

		// If claim is approved and we're not skipping rewards
		if (status === "APPROVED" && !options?.skipRewards) {
			// Award XP to user (example: 50 XP per quest)
			await UserService.updateUserXP(claim.userId, 50);

			// Mark quest as completed
			await QuestService.updateQuestStatus(claim.questId, "COMPLETED");

			// For time-based quests, reject all other pending claims
			if (claim.quest.type === "TIME_BASED") {
				await prisma.claim.updateMany({
					where: {
						questId: claim.questId,
						id: { not: claimId },
						status: "PENDING",
					},
					data: {
						status: "REJECTED",
					},
				});
			}
		}

		return updatedClaim;
	}

	static async getClaimById(id: string) {
		return prisma.claim.findUnique({
			where: { id },
			include: {
				quest: {
					include: {
						creator: true,
						tags: {
							include: {
								tag: true,
							},
						},
					},
				},
				user: true,
			},
		});
	}

	static async getClaimsByQuest(questId: string) {
		return prisma.claim.findMany({
			where: { questId },
			include: {
				user: true,
			},
			orderBy: {
				createdAt: "asc",
			},
		});
	}

	static async getClaimsByUser(userId: string) {
		return prisma.claim.findMany({
			where: { userId },
			include: {
				quest: {
					include: {
						creator: true,
						tags: {
							include: {
								tag: true,
							},
						},
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});
	}

	static async getPendingClaims() {
		return prisma.claim.findMany({
			where: { status: "PENDING" },
			include: {
				quest: {
					include: {
						creator: true,
					},
				},
				user: true,
			},
			orderBy: {
				createdAt: "asc",
			},
		});
	}
}
