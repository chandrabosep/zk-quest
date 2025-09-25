import { NextRequest, NextResponse } from "next/server";
import { UserController } from "@/controllers/user-controller";

// GET /api/users - Get user by wallet address or get leaderboard
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const walletAddress = searchParams.get("walletAddress");
		const leaderboard = searchParams.get("leaderboard");
		const limit = parseInt(searchParams.get("limit") || "10");

		if (leaderboard === "true") {
			const users = await UserController.getLeaderboard(limit);
			return NextResponse.json({
				success: true,
				data: users,
			});
		}

		if (walletAddress) {
			const user = await UserController.getUserByWallet(walletAddress);
			return NextResponse.json({
				success: true,
				data: user,
			});
		}

		return NextResponse.json(
			{
				success: false,
				error: "Missing required parameter: walletAddress or leaderboard=true",
			},
			{ status: 400 }
		);
	} catch (error) {
		console.error("Error fetching users:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch users" },
			{ status: 500 }
		);
	}
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { walletAddress, username, email } = body;

		if (!walletAddress) {
			return NextResponse.json(
				{ success: false, error: "walletAddress is required" },
				{ status: 400 }
			);
		}

		const user = await UserController.createUser({
			walletAddress,
			username,
			email,
		});

		return NextResponse.json({
			success: true,
			data: user,
		});
	} catch (error) {
		console.error("Error creating user:", error);

		if (
			error instanceof Error &&
			error.message.includes("Unique constraint")
		) {
			return NextResponse.json(
				{
					success: false,
					error: "User with this wallet address or email already exists",
				},
				{ status: 409 }
			);
		}

		return NextResponse.json(
			{ success: false, error: "Failed to create user" },
			{ status: 500 }
		);
	}
}
