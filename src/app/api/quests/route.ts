import { NextRequest, NextResponse } from "next/server";
import { QuestController } from "@/controllers/quest-controller";
import type { QuestType, QuestStatus } from "@prisma/client";

// GET /api/quests - Get all quests with optional filters
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);

		const filters = {
			status: searchParams.get("status") as QuestStatus | undefined,
			type: searchParams.get("type") as QuestType | undefined,
			tags: searchParams.get("tags")?.split(",").filter(Boolean),
			creatorId: searchParams.get("creatorId") || undefined,
			limit: parseInt(searchParams.get("limit") || "20"),
			offset: parseInt(searchParams.get("offset") || "0"),
			sort: searchParams.get("sort") || undefined,
		};

		const quests = await QuestController.getQuests(filters);

		return NextResponse.json({
			success: true,
			data: quests,
		});
	} catch (error) {
		console.error("Error fetching quests:", error);

		// Handle database connection errors
		if (error instanceof Error) {
			if (
				error.message.includes("Can't reach database server") ||
				error.message.includes("P1001") ||
				error.message.includes("ECONNREFUSED")
			) {
				return NextResponse.json({
					success: true,
					data: [],
					message:
						"Database not available. Please set up your database first.",
				});
			}
		}

		return NextResponse.json(
			{ success: false, error: "Failed to fetch quests" },
			{ status: 500 }
		);
	}
}

// POST /api/quests - Create a new quest
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			title,
			description,
			githubUrl,
			type,
			expiry,
			tags,
			creatorId,
			rewardAmount,
			suppliedFunds,
			transactionHash,
		} = body;

		const quest = await QuestController.createQuest({
			title,
			description,
			githubUrl,
			type,
			expiry: expiry ? new Date(expiry) : undefined,
			tags: tags || [],
			creatorId,
			rewardAmount,
			suppliedFunds,
			transactionHash,
		});

		return NextResponse.json({
			success: true,
			data: quest,
		});
	} catch (error) {
		console.error("Error creating quest:", error);

		// Handle validation errors
		if (
			error instanceof Error &&
			error.message.includes("Validation failed")
		) {
			return NextResponse.json(
				{ success: false, error: error.message },
				{ status: 400 }
			);
		}

		// Handle database connection errors
		if (error instanceof Error) {
			if (
				error.message.includes("Can't reach database server") ||
				error.message.includes("P1001") ||
				error.message.includes("ECONNREFUSED")
			) {
				return NextResponse.json(
					{
						success: false,
						error: "Database connection failed. Please check your database configuration.",
					},
					{ status: 503 }
				);
			}
		}

		// Return more specific error information in development
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json(
			{
				success: false,
				error: "Failed to create quest",
				details:
					process.env.NODE_ENV === "development"
						? errorMessage
						: undefined,
			},
			{ status: 500 }
		);
	}
}
