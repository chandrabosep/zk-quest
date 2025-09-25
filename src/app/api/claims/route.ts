import { NextRequest, NextResponse } from "next/server";
import { ClaimController } from "@/controllers/claim-controller";
import type { ClaimStatus } from "@prisma/client";

// GET /api/claims - Get claims (with optional filters)
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const questId = searchParams.get("questId");
		const userId = searchParams.get("userId");
		const status = searchParams.get("status");

		if (questId) {
			const claims = await ClaimController.getClaimsByQuest(questId);
			return NextResponse.json({ success: true, data: claims });
		}

		if (userId) {
			const claims = await ClaimController.getClaimsByUser(userId);
			return NextResponse.json({ success: true, data: claims });
		}

		if (status === "pending") {
			const claims = await ClaimController.getPendingClaims();
			return NextResponse.json({ success: true, data: claims });
		}

		return NextResponse.json(
			{
				success: false,
				error: "Missing required query parameter: questId, userId, or status=pending",
			},
			{ status: 400 }
		);
	} catch (error) {
		console.error("Error fetching claims:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch claims" },
			{ status: 500 }
		);
	}
}

// POST /api/claims - Create a new claim
export async function POST(request: NextRequest) {
	try {
		const contentType = request.headers.get("content-type");

		if (contentType?.includes("multipart/form-data")) {
			// Handle file upload
			const formData = await request.formData();
			const questId = formData.get("questId") as string;
			const userId = formData.get("userId") as string;
			const username = formData.get("username") as string;
			const emlFile = formData.get("emlFile") as File;

			if (!questId || !userId || !username || !emlFile) {
				return NextResponse.json(
					{
						success: false,
						error: "questId, userId, username, and emlFile are required",
					},
					{ status: 400 }
				);
			}

			// For now, we'll store the file name as proofUrl
			// In a real implementation, you'd upload to a file storage service
			const proofUrl = `eml_file_${Date.now()}_${emlFile.name}`;

			const claim = await ClaimController.createClaim({
				questId,
				userId,
				proofUrl,
				username,
			});

			return NextResponse.json({
				success: true,
				data: claim,
			});
		} else {
			// Handle JSON request (legacy)
			const body = await request.json();
			const { questId, userId, proofUrl } = body;

			if (!questId || !userId) {
				return NextResponse.json(
					{
						success: false,
						error: "questId and userId are required",
					},
					{ status: 400 }
				);
			}

			const claim = await ClaimController.createClaim({
				questId,
				userId,
				proofUrl,
			});

			return NextResponse.json({
				success: true,
				data: claim,
			});
		}
	} catch (error) {
		console.error("Error creating claim:", error);

		// Handle specific business logic errors
		if (error instanceof Error) {
			return NextResponse.json(
				{ success: false, error: error.message },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ success: false, error: "Failed to create claim" },
			{ status: 500 }
		);
	}
}
