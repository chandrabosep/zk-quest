# ZKQuest Controllers

This directory contains the business logic controllers for the ZKQuest platform. These controllers provide a clean interface to interact with the database and services without being tied to API routes.

## Usage

### Import Individual Controllers

```typescript
import {
	QuestController,
	UserController,
	ClaimController,
	TagController,
} from "@/controllers";

// Or import specific controllers
import { QuestController } from "@/controllers/quest-controller";
```

### Import All Controllers

```typescript
import ZKQuestControllers from "@/controllers";

// Use like:
const quests = await ZKQuestControllers.quest.getQuests();
const user = await ZKQuestControllers.user.getUserByWallet("0x...");
```

## Controllers Overview

### QuestController

Handles all quest-related operations:

```typescript
// Get all quests with filters
const quests = await QuestController.getQuests({
	status: "OPEN",
	type: "TIME_BASED",
	tags: ["defi", "frontend"],
	limit: 10,
});

// Get specific quest
const quest = await QuestController.getQuestById("quest-id");

// Create new quest
const newQuest = await QuestController.createQuest({
	title: "Build DeFi Dashboard",
	description: "Create a responsive dashboard...",
	type: "REGULAR",
	tags: ["frontend", "defi"],
	creatorId: "user-id",
	rewardAmount: 0.5,
	escrowAddress: "0x...",
});

// Update quest status
await QuestController.updateQuestStatus("quest-id", "COMPLETED");

// Get quest statistics
const stats = await QuestController.getQuestStats();
```

### UserController

Handles user management and profiles:

```typescript
// Create new user
const user = await UserController.createUser({
	walletAddress: "0x1234...",
	username: "alice_dev",
	email: "alice@example.com",
});

// Get user by wallet
const user = await UserController.getUserByWallet("0x1234...");

// Get user profile with stats
const profile = await UserController.getUserProfile("0x1234...");

// Get leaderboard
const leaderboard = await UserController.getLeaderboard(10);

// Award XP
await UserController.updateUserXP("user-id", { xpToAdd: 50 });

// Get user rank
const rank = await UserController.getUserRank("user-id");
```

### ClaimController

Handles claim submissions and approvals:

```typescript
// Create new claim
const claim = await ClaimController.createClaim({
	questId: "quest-id",
	userId: "user-id",
	proofUrl: "https://github.com/user/repo/pull/1",
});

// Get claim by ID
const claim = await ClaimController.getClaimById("claim-id");

// Approve claim
await ClaimController.approveClaim("claim-id");

// Reject claim
await ClaimController.rejectClaim("claim-id");

// Get claims by quest
const claims = await ClaimController.getClaimsByQuest("quest-id");

// Get claims by user
const userClaims = await ClaimController.getClaimsByUser("user-id");

// Get pending claims
const pendingClaims = await ClaimController.getPendingClaims();

// Get claim statistics
const stats = await ClaimController.getUserClaimStats("user-id");
```

### TagController

Handles tag management and suggestions:

```typescript
// Get all tags
const tags = await TagController.getAllTags();

// Search tags
const results = await TagController.searchTags("defi");

// Get popular tags
const popular = await TagController.getPopularTags();

// Generate suggestions
const suggestions = await TagController.generateTagSuggestions({
	title: "Build DeFi Dashboard",
	description: "Create a responsive dashboard...",
});

// Get trending tags
const trending = await TagController.getTrendingTags(7, 10);

// Get related tags
const related = await TagController.getRelatedTags("defi", 5);

// Validate tags
const validatedTags = TagController.validateTags(["frontend", "defi"]);
```

## Error Handling

All controllers throw descriptive errors that can be caught and handled:

```typescript
try {
	const quest = await QuestController.getQuestById("invalid-id");
} catch (error) {
	if (error.message === "Quest not found") {
		// Handle not found
	} else {
		// Handle other errors
	}
}
```

## Integration Examples

### In a Next.js API Route

```typescript
// pages/api/quests/index.ts
import { NextRequest, NextResponse } from "next/server";
import { QuestController } from "@/controllers";

export async function GET(request: NextRequest) {
	try {
		const quests = await QuestController.getQuests();
		return NextResponse.json({ success: true, data: quests });
	} catch (error) {
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}
```

### In a React Component (Server Component)

```typescript
// app/quests/page.tsx
import { QuestController } from "@/controllers";

export default async function QuestsPage() {
	const quests = await QuestController.getQuests({ limit: 20 });

	return (
		<div>
			{quests.map((quest) => (
				<div key={quest.id}>
					<h3>{quest.title}</h3>
					<p>{quest.description}</p>
				</div>
			))}
		</div>
	);
}
```

### In a Server Action

```typescript
// app/actions/quest-actions.ts
"use server";

import { QuestController } from "@/controllers";

export async function createQuest(formData: FormData) {
	try {
		const quest = await QuestController.createQuest({
			title: formData.get("title") as string,
			description: formData.get("description") as string,
			type: formData.get("type") as "REGULAR" | "TIME_BASED",
			tags: (formData.get("tags") as string).split(","),
			creatorId: formData.get("creatorId") as string,
			rewardAmount: parseFloat(formData.get("rewardAmount") as string),
		});

		return { success: true, quest };
	} catch (error) {
		return { success: false, error: error.message };
	}
}
```

### In a Background Job

```typescript
// lib/jobs/expire-quests.ts
import { QuestController } from "@/controllers";

export async function expireQuestsJob() {
	try {
		const expiredCount = await QuestController.handleExpiredQuests();
		console.log(`Marked ${expiredCount} quests as expired`);
	} catch (error) {
		console.error("Error expiring quests:", error);
	}
}
```

## Benefits

1. **Reusable Logic**: Use the same business logic in API routes, server components, server actions, and background jobs
2. **Type Safety**: Full TypeScript support with proper types and interfaces
3. **Error Handling**: Consistent error handling across all operations
4. **Clean Separation**: Business logic separated from HTTP concerns
5. **Easy Testing**: Controllers can be easily unit tested without HTTP mocking
6. **Maintainable**: Single source of truth for business operations

## Advanced Usage

### Custom Validation

```typescript
// Custom quest creation with additional validation
export async function createQuestWithValidation(data: any) {
	// Custom business rules
	if (data.rewardAmount < 0.1) {
		throw new Error("Minimum reward is 0.1 ETH");
	}

	if (data.type === "TIME_BASED" && !data.expiry) {
		throw new Error("Time-based quests require expiry date");
	}

	return await QuestController.createQuest(data);
}
```

### Batch Operations

```typescript
// Process multiple claims
export async function processPendingClaims() {
	const claims = await ClaimController.getPendingClaims();

	for (const claim of claims) {
		try {
			// Custom approval logic
			const isValid = await validateClaimProof(claim.proofUrl);

			if (isValid) {
				await ClaimController.approveClaim(claim.id);
			} else {
				await ClaimController.rejectClaim(claim.id);
			}
		} catch (error) {
			console.error(`Error processing claim ${claim.id}:`, error);
		}
	}
}
```
