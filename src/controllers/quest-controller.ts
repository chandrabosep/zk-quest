import { QuestService } from "@/db/services/quest";
import { QuestHelpers } from "@/utils/quest-helpers";
import { TagHelpers } from "@/utils/tag-helpers";
import type { QuestType, QuestStatus } from "@prisma/client";

export interface QuestFilters {
	status?: QuestStatus;
	type?: QuestType;
	tags?: string[];
	creatorId?: string;
	limit?: number;
	offset?: number;
	sort?: string;
}

export interface CreateQuestData {
	title: string;
	description: string;
	githubUrl?: string;
	type: QuestType;
	expiry?: Date;
	tags: string[];
	creatorId: string; // Wallet address - will be used to create/find user
	rewardAmount: number;
	suppliedFunds: number;
	transactionHash?: string;
}

export class QuestController {
	/**
	 * Get all quests with optional filters and metadata
	 */
	static async getQuests(filters: QuestFilters = {}) {
		const questFilters = {
			status: filters.status,
			type: filters.type,
			tags: filters.tags,
			creatorId: filters.creatorId,
			limit: filters.limit || 20,
			offset: filters.offset || 0,
		};

		const quests = await QuestService.getQuests(questFilters);

		// Calculate priority and add time remaining for time-based quests
		const questsWithMetadata = quests.map((quest) => ({
			...quest,
			priority: QuestHelpers.calculatePriority(quest),
			timeRemaining:
				quest.type === "TIME_BASED"
					? QuestHelpers.formatTimeRemaining(quest)
					: null,
			isExpired: QuestHelpers.isExpired(quest),
			tags: TagHelpers.formatTagsForDisplay(quest.tags),
		}));

		// Sort by priority if no specific ordering requested
		if (!filters.sort) {
			questsWithMetadata.sort((a, b) => b.priority - a.priority);
		}

		return questsWithMetadata;
	}

	/**
	 * Get a specific quest by ID with metadata
	 */
	static async getQuestById(id: string) {
		const quest = await QuestService.getQuestById(id);

		if (!quest) {
			throw new Error("Quest not found");
		}

		return {
			...quest,
			timeRemaining:
				quest.type === "TIME_BASED"
					? QuestHelpers.formatTimeRemaining(quest)
					: null,
			isExpired: QuestHelpers.isExpired(quest),
			tags: TagHelpers.formatTagsForDisplay(quest.tags),
		};
	}

	/**
	 * Create a new quest with validation
	 */
	static async createQuest(data: CreateQuestData) {
		// Validate quest data
		const validation = QuestHelpers.validateQuestData({
			title: data.title,
			description: data.description,
			type: data.type,
			expiry: data.expiry,
			rewardAmount: data.rewardAmount,
			suppliedFunds: data.suppliedFunds,
		});

		if (!validation.isValid) {
			throw new Error(
				`Validation failed: ${validation.errors.join(", ")}`
			);
		}

		// Validate and normalize tags
		const tagValidation = TagHelpers.validateTags(data.tags || []);
		if (!tagValidation.isValid) {
			throw new Error(
				`Tag validation failed: ${tagValidation.errors.join(", ")}`
			);
		}

		const normalizedTags = TagHelpers.normalizeTags(data.tags || []);

		const quest = await QuestService.createQuest({
			title: data.title.trim(),
			description: data.description.trim(),
			githubUrl: data.githubUrl?.trim(),
			type: data.type,
			expiry: data.expiry,
			tags: normalizedTags,
			creatorId: data.creatorId,
			rewardAmount: data.rewardAmount,
			suppliedFunds: data.suppliedFunds,
			transactionHash: data.transactionHash,
		});

		return {
			...quest,
			tags: TagHelpers.formatTagsForDisplay((quest as any).tags || []),
		};
	}

	/**
	 * Update quest status
	 */
	static async updateQuestStatus(id: string, status: QuestStatus) {
		const validStatuses = ["OPEN", "COMPLETED", "EXPIRED"];
		if (!validStatuses.includes(status)) {
			throw new Error("Invalid status");
		}

		return await QuestService.updateQuestStatus(id, status);
	}

	/**
	 * Get and mark expired quests
	 */
	static async handleExpiredQuests() {
		return await QuestService.markExpiredQuests();
	}

	/**
	 * Get quests by creator
	 */
	static async getQuestsByCreator(creatorId: string, limit = 20, offset = 0) {
		return await this.getQuests({
			creatorId,
			limit,
			offset,
		});
	}

	/**
	 * Get quests by tags
	 */
	static async getQuestsByTags(tags: string[], limit = 20, offset = 0) {
		return await this.getQuests({
			tags,
			limit,
			offset,
		});
	}

	/**
	 * Get quest statistics
	 */
	static async getQuestStats() {
		const [openQuests, completedQuests, expiredQuests] = await Promise.all([
			this.getQuests({ status: "OPEN", limit: 1000 }),
			this.getQuests({ status: "COMPLETED", limit: 1000 }),
			this.getQuests({ status: "EXPIRED", limit: 1000 }),
		]);

		return {
			total:
				openQuests.length +
				completedQuests.length +
				expiredQuests.length,
			open: openQuests.length,
			completed: completedQuests.length,
			expired: expiredQuests.length,
			totalRewards: [
				...openQuests,
				...completedQuests,
				...expiredQuests,
			].reduce((sum, quest) => sum + quest.rewardAmount, 0),
		};
	}
}
