import { NextRequest, NextResponse } from "next/server";
import { UserController } from "@/controllers/user-controller";

// GET /api/users/[id] - Get user profile by ID
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const user = await UserController.getUserById(params.id);

		if (!user) {
			return NextResponse.json(
				{ success: false, error: "User not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			data: user,
		});
	} catch (error) {
		console.error("Error fetching user:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch user" },
			{ status: 500 }
		);
	}
}

// PATCH /api/users/[id] - Update user XP (internal use)
export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const body = await request.json();
		const { xpToAdd } = body;

		if (typeof xpToAdd !== "number" || xpToAdd <= 0) {
			return NextResponse.json(
				{ success: false, error: "Invalid XP amount" },
				{ status: 400 }
			);
		}

		const user = await UserController.updateUserXP(params.id, { xpToAdd });

		return NextResponse.json({
			success: true,
			data: user,
		});
	} catch (error) {
		console.error("Error updating user XP:", error);

		if (error instanceof Error && error.message === "User not found") {
			return NextResponse.json(
				{ success: false, error: "User not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(
			{ success: false, error: "Failed to update user XP" },
			{ status: 500 }
		);
	}
}
