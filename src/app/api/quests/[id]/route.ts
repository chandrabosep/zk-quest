import { NextRequest, NextResponse } from "next/server";
import { QuestController } from "@/controllers/quest-controller";
import type { QuestStatus } from "@prisma/client";

// GET /api/quests/[id] - Get a specific quest
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const quest = await QuestController.getQuestById(params.id);

		return NextResponse.json({
			success: true,
			data: quest,
		});
	} catch (error) {
		console.error("Error fetching quest:", error);

		if (error instanceof Error && error.message === "Quest not found") {
			return NextResponse.json(
				{ success: false, error: "Quest not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(
			{ success: false, error: "Failed to fetch quest" },
			{ status: 500 }
		);
	}
}

// PATCH /api/quests/[id] - Update quest status
export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const body = await request.json();
		const { status } = body;

		const quest = await QuestController.updateQuestStatus(
			params.id,
			status as QuestStatus
		);

		return NextResponse.json({
			success: true,
			data: quest,
		});
	} catch (error) {
		console.error("Error updating quest:", error);

		if (error instanceof Error && error.message === "Invalid status") {
			return NextResponse.json(
				{ success: false, error: "Invalid status" },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ success: false, error: "Failed to update quest" },
			{ status: 500 }
		);
	}
}
