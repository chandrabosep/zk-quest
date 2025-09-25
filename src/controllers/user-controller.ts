import { UserService } from "@/db/services/user";

export interface CreateUserData {
	walletAddress: string;
	username?: string;
	email?: string;
}

export interface UpdateUserXPData {
	xpToAdd: number;
}

export class UserController {
	/**
	 * Create a new user with validation
	 */
	static async createUser(data: CreateUserData) {
		if (!data.walletAddress) {
			throw new Error("walletAddress is required");
		}

		// Check if user already exists
		const existingUser = await UserService.getUserByWallet(
			data.walletAddress
		);
		if (existingUser) {
			throw new Error("User with this wallet address already exists");
		}

		try {
			return await UserService.createUser({
				walletAddress: data.walletAddress,
				username: data.username,
				email: data.email,
			});
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.includes("Unique constraint")
			) {
				throw new Error(
					"User with this wallet address or email already exists"
				);
			}
			throw new Error("Failed to create user");
		}
	}

	/**
	 * Get user by wallet address
	 */
	static async getUserByWallet(walletAddress: string) {
		if (!walletAddress) {
			throw new Error("walletAddress is required");
		}

		return await UserService.getUserByWallet(walletAddress);
	}

	/**
	 * Get user by ID
	 */
	static async getUserById(id: string) {
		if (!id) {
			throw new Error("User ID is required");
		}

		const user = await UserService.getUserById(id);
		if (!user) {
			throw new Error("User not found");
		}

		return user;
	}

	/**
	 * Get leaderboard
	 */
	static async getLeaderboard(limit = 10) {
		if (limit <= 0 || limit > 100) {
			throw new Error("Limit must be between 1 and 100");
		}

		return await UserService.getLeaderboard(limit);
	}

	/**
	 * Update user XP
	 */
	static async updateUserXP(userId: string, data: UpdateUserXPData) {
		if (!userId) {
			throw new Error("User ID is required");
		}

		if (typeof data.xpToAdd !== "number" || data.xpToAdd <= 0) {
			throw new Error("Invalid XP amount");
		}

		try {
			return await UserService.updateUserXP(userId, data.xpToAdd);
		} catch (error) {
			if (error instanceof Error && error.message === "User not found") {
				throw new Error("User not found");
			}
			throw new Error("Failed to update user XP");
		}
	}

	/**
	 * Get or create user by wallet address
	 */
	static async getOrCreateUser(data: CreateUserData) {
		const existingUser = await UserService.getUserByWallet(
			data.walletAddress
		);

		if (existingUser) {
			return existingUser;
		}

		return await this.createUser(data);
	}

	/**
	 * Get user profile with stats
	 */
	static async getUserProfile(walletAddress: string) {
		const user = await this.getUserByWallet(walletAddress);
		if (!user) {
			throw new Error("User not found");
		}

		// Calculate additional stats
		const completedQuests =
			user.claims?.filter((claim) => claim.status === "APPROVED")
				.length || 0;

		const pendingClaims =
			user.claims?.filter((claim) => claim.status === "PENDING").length ||
			0;

		const totalRewards =
			user.claims
				?.filter((claim) => claim.status === "APPROVED")
				.reduce(
					(sum, claim) => sum + (claim.quest?.rewardAmount || 0),
					0
				) || 0;

		return {
			...user,
			stats: {
				completedQuests,
				pendingClaims,
				totalRewards,
				questsCreated: user.questsCreated?.length || 0,
			},
		};
	}

	/**
	 * Get user ranking on leaderboard
	 */
	static async getUserRank(userId: string) {
		const user = await this.getUserById(userId);
		const leaderboard = await UserService.getLeaderboard(1000); // Get large leaderboard

		const rank = leaderboard.findIndex((u) => u.id === userId) + 1;
		return {
			rank: rank || null,
			totalUsers: leaderboard.length,
			user: {
				id: user.id,
				username: user.username,
				xp: user.xp,
				level: user.level,
			},
		};
	}

	/**
	 * Search users by username
	 */
	static async searchUsers(query: string, limit = 10) {
		if (!query || query.trim().length < 2) {
			throw new Error("Search query must be at least 2 characters");
		}

		// This would need to be implemented in UserService
		// For now, get leaderboard and filter
		const users = await UserService.getLeaderboard(100);
		const filtered = users
			.filter((user) =>
				user.username?.toLowerCase().includes(query.toLowerCase())
			)
			.slice(0, limit);

		return filtered;
	}

	/**
	 * Get top performers in different categories
	 */
	static async getTopPerformers() {
		const topByXP = await UserService.getLeaderboard(5);

		// You could extend this with more categories
		return {
			topByXP,
			// topByQuestsCompleted: await this.getTopByQuestsCompleted(5),
			// topByQuestsCreated: await this.getTopByQuestsCreated(5),
		};
	}

	/**
	 * Award XP to user for completing a quest
	 */
	static async awardQuestXP(userId: string, questReward: number) {
		// Base XP calculation (could be more sophisticated)
		const baseXP = 50;
		const bonusXP = Math.floor(questReward * 10); // 10 XP per 0.1 ETH reward
		const totalXP = baseXP + bonusXP;

		return await this.updateUserXP(userId, { xpToAdd: totalXP });
	}
}
