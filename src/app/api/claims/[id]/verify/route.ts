import { NextRequest, NextResponse } from "next/server";
import { ClaimController } from "@/controllers/claim-controller";
import { QuestService } from "@/db/services/quest";

// POST /api/claims/[id]/verify - External proof verification endpoint
export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params;
		const body = await request.json();
		const { verified, proofData, verifierAddress } = body;

		if (!id) {
			return NextResponse.json(
				{ success: false, error: "Claim ID is required" },
				{ status: 400 }
			);
		}

		if (typeof verified !== "boolean") {
			return NextResponse.json(
				{ success: false, error: "Verified status is required" },
				{ status: 400 }
			);
		}

		// Get the claim details
		const claim = await ClaimController.getClaimById(id);
		if (!claim) {
			return NextResponse.json(
				{ success: false, error: "Claim not found" },
				{ status: 404 }
			);
		}

		// Get quest details
		const quest = await QuestService.getQuestById(claim.questId);
		if (!quest) {
			return NextResponse.json(
				{ success: false, error: "Quest not found" },
				{ status: 404 }
			);
		}

		if (verified) {
			// Proof is verified - automatically approve claim and release funds
			const result = await ClaimController.autoApproveClaim(id, {
				verified: true,
				proofData,
				verifierAddress,
				verifiedAt: new Date().toISOString(),
			});

			if (result.requiresBlockchainRelease) {
				return NextResponse.json({
					success: true,
					data: {
						claim: result.claim,
						quest: result.quest,
						action: "funds_ready_for_release",
						message:
							"Proof verified! Funds are ready to be released from escrow.",
						escrowAction: {
							required: true,
							contractAddress:
								process.env.NEXT_PUBLIC_QUEST_ESCROW_ADDRESS,
							questId: result.quest?.id,
							claimerAddress: result.claim.userId,
							functionName: "releaseQuestFunds",
							args: [result.quest?.id, result.claim.userId],
						},
					},
				});
			} else {
				return NextResponse.json({
					success: true,
					data: {
						claim: result.claim,
						quest: result.quest,
						action: "completed",
						message: "Proof verified! Claim approved successfully.",
					},
				});
			}
		} else {
			// Proof verification failed - reject claim
			const updatedClaim = await ClaimController.updateClaimStatus(id, {
				status: "REJECTED",
			});

			return NextResponse.json({
				success: true,
				data: {
					claim: updatedClaim,
					action: "rejected",
					message: "Proof verification failed. Claim rejected.",
				},
			});
		}
	} catch (error) {
		console.error("Error verifying claim:", error);

		if (error instanceof Error) {
			return NextResponse.json(
				{ success: false, error: error.message },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ success: false, error: "Failed to verify claim" },
			{ status: 500 }
		);
	}
}

// GET /api/claims/[id]/verify - Get verification status
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params;

		if (!id) {
			return NextResponse.json(
				{ success: false, error: "Claim ID is required" },
				{ status: 400 }
			);
		}

		const claim = await ClaimController.getClaimById(id);
		if (!claim) {
			return NextResponse.json(
				{ success: false, error: "Claim not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			data: {
				claimId: claim.id,
				status: claim.status,
				questId: claim.questId,
				userId: claim.userId,
				proofUrl: claim.proofUrl,
				createdAt: claim.createdAt,
				updatedAt: claim.updatedAt,
			},
		});
	} catch (error) {
		console.error("Error fetching claim verification status:", error);

		if (error instanceof Error) {
			return NextResponse.json(
				{ success: false, error: error.message },
				{ status: 404 }
			);
		}

		return NextResponse.json(
			{ success: false, error: "Failed to fetch claim status" },
			{ status: 500 }
		);
	}
}
