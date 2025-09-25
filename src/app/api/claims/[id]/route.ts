import { NextRequest, NextResponse } from "next/server";
import { ClaimController } from "@/controllers/claim-controller";
import type { ClaimStatus } from "@prisma/client";

// GET /api/claims/[id] - Get a specific claim
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const claim = await ClaimController.getClaimById(params.id);

		if (!claim) {
			return NextResponse.json(
				{ success: false, error: "Claim not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			data: claim,
		});
	} catch (error) {
		console.error("Error fetching claim:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch claim" },
			{ status: 500 }
		);
	}
}

// PATCH /api/claims/[id] - Update claim status (approve/reject)
export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const body = await request.json();
		const { status, skipRewards } = body;

		if (!status || !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
			return NextResponse.json(
				{ success: false, error: "Invalid status" },
				{ status: 400 }
			);
		}

		const claim = await ClaimController.updateClaimStatus(params.id, {
			status: status as ClaimStatus,
			skipRewards,
		});

		return NextResponse.json({
			success: true,
			data: claim,
		});
	} catch (error) {
		console.error("Error updating claim:", error);

		if (error instanceof Error) {
			return NextResponse.json(
				{ success: false, error: error.message },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ success: false, error: "Failed to update claim" },
			{ status: 500 }
		);
	}
}
