import type { Quest, QuestType, QuestStatus } from "@prisma/client";

export class QuestHelpers {
	/**
	 * Check if a quest has expired
	 */
	static isExpired(quest: Quest): boolean {
		if (quest.type !== "TIME_BASED" || !quest.expiry) return false;
		return new Date() > quest.expiry;
	}

	/**
	 * Get time remaining for a time-based quest
	 */
	static getTimeRemaining(quest: Quest): {
		days: number;
		hours: number;
		minutes: number;
		seconds: number;
		isExpired: boolean;
	} {
		if (quest.type !== "TIME_BASED" || !quest.expiry) {
			return {
				days: 0,
				hours: 0,
				minutes: 0,
				seconds: 0,
				isExpired: false,
			};
		}

		const now = new Date();
		const expiry = new Date(quest.expiry);
		const diff = expiry.getTime() - now.getTime();

		if (diff <= 0) {
			return {
				days: 0,
				hours: 0,
				minutes: 0,
				seconds: 0,
				isExpired: true,
			};
		}

		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor(
			(diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
		);
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((diff % (1000 * 60)) / 1000);

		return { days, hours, minutes, seconds, isExpired: false };
	}

	/**
	 * Format time remaining as human-readable string
	 */
	static formatTimeRemaining(quest: Quest): string {
		const time = this.getTimeRemaining(quest);

		if (time.isExpired) return "Expired";

		if (time.days > 0) return `${time.days}d ${time.hours}h remaining`;
		if (time.hours > 0) return `${time.hours}h ${time.minutes}m remaining`;
		if (time.minutes > 0)
			return `${time.minutes}m ${time.seconds}s remaining`;
		return `${time.seconds}s remaining`;
	}

	/**
	 * Calculate quest priority score for sorting
	 * Higher score = higher priority
	 */
	static calculatePriority(quest: Quest): number {
		let score = 0;

		// Base reward amount contributes to priority
		score += quest.rewardAmount * 10;

		// Time-based quests with less time remaining get higher priority
		if (quest.type === "TIME_BASED" && quest.expiry) {
			const timeRemaining = this.getTimeRemaining(quest);
			if (!timeRemaining.isExpired) {
				const totalMinutes =
					timeRemaining.days * 1440 +
					timeRemaining.hours * 60 +
					timeRemaining.minutes;
				// Inverse relationship: less time = higher priority
				score += Math.max(0, 10000 - totalMinutes);
			}
		}

		return score;
	}

	/**
	 * Validate quest creation data
	 */
	static validateQuestData(data: {
		title: string;
		description: string;
		type: QuestType;
		expiry?: Date;
		rewardAmount: number;
		suppliedFunds: number;
	}): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!data.title || data.title.trim().length === 0) {
			errors.push("Title is required");
		}

		if (!data.description || data.description.trim().length === 0) {
			errors.push("Description is required");
		}

		if (data.rewardAmount <= 0) {
			errors.push("Reward amount must be greater than 0");
		}

		if (data.suppliedFunds <= 0) {
			errors.push("Supplied funds must be greater than 0");
		}

		if (data.suppliedFunds < data.rewardAmount) {
			errors.push(
				"Supplied funds must be at least equal to reward amount"
			);
		}

		if (data.type === "TIME_BASED") {
			if (!data.expiry) {
				errors.push("Expiry date is required for time-based quests");
			} else if (new Date(data.expiry) <= new Date()) {
				errors.push("Expiry date must be in the future");
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}
}
