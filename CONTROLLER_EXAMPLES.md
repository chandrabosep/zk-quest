# ZKQuest Controllers - Usage Examples

## Quick Start

```typescript
// Import all controllers
import {
	QuestController,
	UserController,
	ClaimController,
	TagController,
} from "@/controllers";

// Or use the default export
import ZKQuestControllers from "@/controllers";
```

## Real-World Examples

### 1. User Registration Flow

```typescript
import { UserController } from "@/controllers";

export async function registerUser(walletAddress: string, username?: string) {
	try {
		// Try to get existing user first
		const existingUser = await UserController.getUserByWallet(
			walletAddress
		);

		if (existingUser) {
			return { success: true, user: existingUser, isNew: false };
		}

		// Create new user
		const newUser = await UserController.createUser({
			walletAddress,
			username,
		});

		return { success: true, user: newUser, isNew: true };
	} catch (error) {
		return { success: false, error: error.message };
	}
}
```

### 2. Quest Creation with Full Validation

```typescript
import { QuestController, TagController } from "@/controllers";

export async function createQuestWithSuggestions(questData: {
	title: string;
	description: string;
	type: "REGULAR" | "TIME_BASED";
	expiry?: Date;
	creatorId: string;
	rewardAmount: number;
}) {
	try {
		// Generate tag suggestions
		const suggestedTags = await TagController.generateTagSuggestions({
			title: questData.title,
			description: questData.description,
		});

		// Create quest with suggested tags
		const quest = await QuestController.createQuest({
			...questData,
			tags: suggestedTags,
		});

		return { success: true, quest, suggestedTags };
	} catch (error) {
		return { success: false, error: error.message };
	}
}
```

### 3. Claim Processing Workflow

```typescript
import {
	ClaimController,
	QuestController,
	UserController,
} from "@/controllers";

export async function processClaimSubmission(
	questId: string,
	userId: string,
	proofUrl: string
) {
	try {
		// Check if user already has a claim for this quest
		const hasExistingClaim = await ClaimController.hasUserClaimedQuest(
			userId,
			questId
		);

		if (hasExistingClaim) {
			throw new Error("User already has a claim for this quest");
		}

		// Get quest details
		const quest = await QuestController.getQuestById(questId);

		// Check if quest is still open and not expired
		if (quest.status !== "OPEN") {
			throw new Error("Quest is not open for claims");
		}

		if (quest.isExpired) {
			throw new Error("Quest has expired");
		}

		// Create the claim
		const claim = await ClaimController.createClaim({
			questId,
			userId,
			proofUrl,
		});

		return { success: true, claim };
	} catch (error) {
		return { success: false, error: error.message };
	}
}
```

### 4. Dashboard Data Aggregation

```typescript
import {
	QuestController,
	UserController,
	ClaimController,
} from "@/controllers";

export async function getDashboardData(userId: string) {
	try {
		const [
			userProfile,
			userRank,
			userClaims,
			createdQuests,
			leaderboard,
			questStats,
		] = await Promise.all([
			UserController.getUserProfile(userId),
			UserController.getUserRank(userId),
			ClaimController.getClaimsByUser(userId),
			QuestController.getQuestsByCreator(userId),
			UserController.getLeaderboard(5),
			QuestController.getQuestStats(),
		]);

		const claimStats = await ClaimController.getUserClaimStats(userId);

		return {
			success: true,
			data: {
				profile: userProfile,
				rank: userRank,
				claims: userClaims,
				createdQuests,
				leaderboard,
				questStats,
				claimStats,
			},
		};
	} catch (error) {
		return { success: false, error: error.message };
	}
}
```

### 5. Admin Operations

```typescript
import {
	ClaimController,
	QuestController,
	UserController,
	TagController,
} from "@/controllers";

export async function getAdminOverview() {
	try {
		const [
			pendingClaims,
			questStats,
			tagStats,
			topPerformers,
			recentActivity,
			expiredQuests,
		] = await Promise.all([
			ClaimController.getPendingClaims(),
			QuestController.getQuestStats(),
			TagController.getTagStats(),
			UserController.getTopPerformers(),
			ClaimController.getRecentActivity(20),
			QuestController.handleExpiredQuests(),
		]);

		return {
			success: true,
			data: {
				pendingClaims,
				questStats,
				tagStats,
				topPerformers,
				recentActivity,
				expiredQuestsCount: expiredQuests,
			},
		};
	} catch (error) {
		return { success: false, error: error.message };
	}
}

export async function bulkApproveClaims(claimIds: string[]) {
	const results = [];

	for (const claimId of claimIds) {
		try {
			const claim = await ClaimController.approveClaim(claimId);
			results.push({ claimId, success: true, claim });
		} catch (error) {
			results.push({ claimId, success: false, error: error.message });
		}
	}

	return results;
}
```

### 6. Search and Discovery

```typescript
import { QuestController, TagController } from "@/controllers";

export async function searchQuests(params: {
	query?: string;
	tags?: string[];
	type?: "REGULAR" | "TIME_BASED";
	status?: "OPEN" | "COMPLETED" | "EXPIRED";
	minReward?: number;
	maxReward?: number;
}) {
	try {
		// Get base quests with filters
		let quests = await QuestController.getQuests({
			status: params.status,
			type: params.type,
			tags: params.tags,
			limit: 100,
		});

		// Filter by reward range
		if (params.minReward !== undefined) {
			quests = quests.filter((q) => q.rewardAmount >= params.minReward!);
		}

		if (params.maxReward !== undefined) {
			quests = quests.filter((q) => q.rewardAmount <= params.maxReward!);
		}

		// Text search in title/description
		if (params.query) {
			const searchTerm = params.query.toLowerCase();
			quests = quests.filter(
				(q) =>
					q.title.toLowerCase().includes(searchTerm) ||
					q.description.toLowerCase().includes(searchTerm)
			);
		}

		// Get related tags for discovery
		const relatedTags = params.tags?.length
			? await Promise.all(
					params.tags.map((tag) =>
						TagController.getRelatedTags(tag, 3)
					)
			  )
			: [];

		return {
			success: true,
			data: {
				quests,
				relatedTags: relatedTags.flat(),
				total: quests.length,
			},
		};
	} catch (error) {
		return { success: false, error: error.message };
	}
}
```

### 7. Notification System

```typescript
import {
	ClaimController,
	QuestController,
	UserController,
} from "@/controllers";

export async function getNotifications(userId: string) {
	try {
		const [userClaims, createdQuests] = await Promise.all([
			ClaimController.getClaimsByUser(userId),
			QuestController.getQuestsByCreator(userId),
		]);

		const notifications = [];

		// Check for approved claims
		const approvedClaims = userClaims.filter(
			(c) => c.status === "APPROVED"
		);
		approvedClaims.forEach((claim) => {
			notifications.push({
				type: "claim_approved",
				message: `Your claim for "${claim.quest.title}" was approved!`,
				questId: claim.questId,
				timestamp: claim.updatedAt,
			});
		});

		// Check for rejected claims
		const rejectedClaims = userClaims.filter(
			(c) => c.status === "REJECTED"
		);
		rejectedClaims.forEach((claim) => {
			notifications.push({
				type: "claim_rejected",
				message: `Your claim for "${claim.quest.title}" was rejected.`,
				questId: claim.questId,
				timestamp: claim.updatedAt,
			});
		});

		// Check for new claims on created quests
		for (const quest of createdQuests) {
			const questClaims = await ClaimController.getClaimsByQuest(
				quest.id
			);
			const pendingClaims = questClaims.filter(
				(c) => c.status === "PENDING"
			);

			if (pendingClaims.length > 0) {
				notifications.push({
					type: "new_claims",
					message: `${pendingClaims.length} new claim(s) for "${quest.title}"`,
					questId: quest.id,
					count: pendingClaims.length,
					timestamp: Math.max(
						...pendingClaims.map((c) => c.createdAt.getTime())
					),
				});
			}
		}

		// Sort by timestamp (newest first)
		notifications.sort((a, b) => b.timestamp - a.timestamp);

		return { success: true, notifications };
	} catch (error) {
		return { success: false, error: error.message };
	}
}
```

### 8. Analytics and Reporting

```typescript
import {
	QuestController,
	UserController,
	ClaimController,
	TagController,
} from "@/controllers";

export async function generateAnalyticsReport(
	timeframe: "week" | "month" | "year"
) {
	try {
		const [questStats, userStats, tagStats, trendingTags] =
			await Promise.all([
				QuestController.getQuestStats(),
				UserController.getLeaderboard(1000), // Get all users for stats
				TagController.getTagStats(),
				TagController.getTrendingTags(
					timeframe === "week" ? 7 : timeframe === "month" ? 30 : 365
				),
			]);

		// Calculate user engagement metrics
		const totalUsers = userStats.length;
		const activeUsers = userStats.filter((u) => u.xp > 0).length;
		const avgXP = userStats.reduce((sum, u) => sum + u.xp, 0) / totalUsers;

		// Get completion rate
		const completionRate =
			questStats.total > 0
				? (questStats.completed / questStats.total) * 100
				: 0;

		return {
			success: true,
			data: {
				timeframe,
				quests: {
					...questStats,
					completionRate: Math.round(completionRate * 100) / 100,
				},
				users: {
					total: totalUsers,
					active: activeUsers,
					engagementRate:
						Math.round((activeUsers / totalUsers) * 100 * 100) /
						100,
					averageXP: Math.round(avgXP * 100) / 100,
				},
				tags: {
					...tagStats,
					trending: trendingTags,
				},
				generatedAt: new Date().toISOString(),
			},
		};
	} catch (error) {
		return { success: false, error: error.message };
	}
}
```

## Integration Patterns

### Server Actions (Next.js 13+)

```typescript
"use server";

import { QuestController } from "@/controllers";
import { revalidatePath } from "next/cache";

export async function createQuestAction(formData: FormData) {
	try {
		const quest = await QuestController.createQuest({
			title: formData.get("title") as string,
			description: formData.get("description") as string,
			type: formData.get("type") as "REGULAR" | "TIME_BASED",
			tags: (formData.get("tags") as string).split(","),
			creatorId: formData.get("creatorId") as string,
			rewardAmount: parseFloat(formData.get("rewardAmount") as string),
		});

		revalidatePath("/quests");
		return { success: true, quest };
	} catch (error) {
		return { success: false, error: error.message };
	}
}
```

### Background Jobs

```typescript
import { QuestController, ClaimController } from "@/controllers";

// Cron job to handle expired quests
export async function expireQuestsJob() {
	console.log("Running expired quests job...");

	try {
		const expiredCount = await QuestController.handleExpiredQuests();
		console.log(`✅ Marked ${expiredCount} quests as expired`);
	} catch (error) {
		console.error("❌ Error in expired quests job:", error);
	}
}

// Process pending claims with AI validation (example)
export async function processPendingClaimsJob() {
	try {
		const pendingClaims = await ClaimController.getPendingClaims();

		for (const claim of pendingClaims) {
			// Example: AI validation of proof URL
			const isValid = await validateProofWithAI(claim.proofUrl);

			if (isValid) {
				await ClaimController.approveClaim(claim.id);
				console.log(`✅ Auto-approved claim ${claim.id}`);
			}
		}
	} catch (error) {
		console.error("❌ Error in claims processing job:", error);
	}
}
```

This controller-based architecture gives you maximum flexibility to use the same business logic across different parts of your application while maintaining clean separation of concerns!
