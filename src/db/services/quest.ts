import { prisma } from "../prisma";
import type { Quest, QuestType, QuestStatus, Prisma } from "@prisma/client";

export class QuestService {
	static async createQuest(data: {
		title: string;
		description: string;
		githubUrl?: string;
		type: QuestType;
		expiry?: Date;
		tags: string[];
		creatorId: string; // This should be wallet address
		rewardAmount: number;
		suppliedFunds: number;
		transactionHash?: string;
	}) {
		// First, ensure the creator user exists (create if not exists)
		const creator = await prisma.user.upsert({
			where: { walletAddress: data.creatorId },
			update: {},
			create: {
				walletAddress: data.creatorId,
				username: `user_${data.creatorId.slice(2, 8)}`, // Generate username from wallet
			},
		});

		// Then, ensure all tags exist
		const tagPromises = data.tags.map((tagName) =>
			prisma.tag.upsert({
				where: { name: tagName },
				update: {},
				create: { name: tagName },
			})
		);
		const tags = await Promise.all(tagPromises);

		return prisma.quest.create({
			data: {
				title: data.title,
				description: data.description,
				githubUrl: data.githubUrl,
				type: data.type,
				expiry: data.expiry,
				creatorId: creator.id, // Use the created user's ID
				rewardAmount: data.rewardAmount,
				suppliedFunds: data.suppliedFunds,
				fundsReleased: false,
				transactionHash: data.transactionHash,
				tags: {
					create: tags.map((tag) => ({
						tag: {
							connect: { id: tag.id },
						},
					})),
				},
			},
			include: {
				creator: true,
				tags: {
					include: {
						tag: true,
					},
				},
			},
		});
	}

	static async getQuestById(id: string) {
		return prisma.quest.findUnique({
			where: { id },
			include: {
				creator: true,
				tags: {
					include: {
						tag: true,
					},
				},
				claims: {
					include: {
						user: true,
					},
				},
			},
		});
	}

	static async getQuests(filters?: {
		status?: QuestStatus;
		type?: QuestType;
		tags?: string[];
		creatorId?: string;
		limit?: number;
		offset?: number;
	}) {
		try {
			const where: Prisma.QuestWhereInput = {};

			if (filters?.status) where.status = filters.status;
			if (filters?.type) where.type = filters.type;
			if (filters?.creatorId) where.creatorId = filters.creatorId;
			if (filters?.tags && filters.tags.length > 0) {
				where.tags = {
					some: {
						tag: {
							name: {
								in: filters.tags,
							},
						},
					},
				};
			}

			return await prisma.quest.findMany({
				where,
				include: {
					creator: true,
					tags: {
						include: {
							tag: true,
						},
					},
					_count: {
						select: {
							claims: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
				take: filters?.limit || 20,
				skip: filters?.offset || 0,
			});
		} catch (error) {
			console.error("Database error in getQuests:", error);
			// Re-throw the error so it can be handled by the calling code
			throw error;
		}
	}

	static async updateQuestStatus(
		id: string,
		status: QuestStatus
	): Promise<Quest> {
		return prisma.quest.update({
			where: { id },
			data: { status },
		});
	}

	static async getExpiredQuests(): Promise<Quest[]> {
		return prisma.quest.findMany({
			where: {
				type: "TIME_BASED",
				status: "OPEN",
				expiry: {
					lt: new Date(),
				},
			},
		});
	}

	static async markExpiredQuests(): Promise<number> {
		const expiredQuests = await this.getExpiredQuests();

		if (expiredQuests.length === 0) return 0;

		await prisma.quest.updateMany({
			where: {
				id: {
					in: expiredQuests.map((q) => q.id),
				},
			},
			data: {
				status: "EXPIRED",
			},
		});

		return expiredQuests.length;
	}

	/**
	 * Release funds to user when claim is approved
	 * This method should be called AFTER the blockchain transaction is confirmed
	 */
	static async releaseFunds(questId: string, userId: string): Promise<Quest> {
		// Update quest to mark funds as released
		const quest = await prisma.quest.update({
			where: { id: questId },
			data: {
				fundsReleased: true,
				status: "COMPLETED",
			},
			include: {
				creator: true,
				claims: {
					where: {
						userId: userId,
						status: "APPROVED",
					},
					include: {
						user: true,
					},
				},
			},
		});

		// Note: The actual fund transfer happens on the blockchain via the escrow contract
		// This method is called after the contract's releaseQuestFunds function is executed

		return quest;
	}

	/**
	 * Check if quest has available funds to release
	 */
	static async canReleaseFunds(questId: string): Promise<boolean> {
		const quest = await prisma.quest.findUnique({
			where: { id: questId },
			select: {
				fundsReleased: true,
				suppliedFunds: true,
				status: true,
			},
		});

		return (
			quest !== null &&
			!quest.fundsReleased &&
			quest.suppliedFunds > 0 &&
			quest.status === "OPEN"
		);
	}
}
