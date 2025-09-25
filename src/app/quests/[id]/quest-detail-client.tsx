"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ClaimApprovalComponent } from "@/components/claim-approval";
import { SimpleClaimDialog } from "@/components/simple-claim-dialog";
import {
	Clock,
	Award,
	User,
	Calendar,
	Tag,
	Users,
	CheckCircle,
	XCircle,
	AlertCircle,
	ExternalLink,
	Plus,
} from "lucide-react";

interface QuestDetailClientProps {
	quest: {
		id: string;
		title: string;
		description: string;
		type: "REGULAR" | "TIME_BASED";
		status: "OPEN" | "COMPLETED" | "EXPIRED";
		rewardAmount: number;
		githubUrl?: string;
		transactionHash?: string;
		suppliedFunds?: number;
		fundsReleased?: boolean;
		timeRemaining?: string | null;
		createdAt: string;
		creator: {
			walletAddress: string;
			username?: string;
		};
		tags: Array<{ name: string }>;
	};
	claims: Array<{
		id: string;
		status: "PENDING" | "APPROVED" | "REJECTED";
		proofUrl?: string;
		createdAt: string;
		user: {
			walletAddress: string;
			username?: string;
		};
	}>;
}

export function QuestDetailClient({ quest, claims }: QuestDetailClientProps) {
	const { address, isConnected } = useAccount();
	const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);

	const statusColors = {
		OPEN: "bg-green-100 text-green-800",
		COMPLETED: "bg-blue-100 text-blue-800",
		EXPIRED: "bg-red-100 text-red-800",
	};

	const typeColors = {
		REGULAR: "bg-gray-100 text-gray-800",
		TIME_BASED: "bg-orange-100 text-orange-800",
	};

	const isQuestCreator = address === quest.creator.walletAddress;

	return (
		<>
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
					<div className="flex items-start justify-between mb-4">
						<div className="flex-1">
							<div className="flex items-center justify-between mb-2">
								<h1 className="text-2xl font-bold text-gray-900">
									{quest.title}
								</h1>
								{quest.status === "OPEN" && (
									<button
										onClick={() =>
											setIsClaimDialogOpen(true)
										}
										className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
									>
										<Plus className="w-4 h-4 mr-2" />
										Submit Claim
									</button>
								)}
							</div>
							<div className="flex items-center space-x-3 mb-4">
								<span
									className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
										statusColors[quest.status]
									}`}
								>
									{quest.status}
								</span>
								<span
									className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
										typeColors[quest.type]
									}`}
								>
									{quest.type === "TIME_BASED"
										? "Time-Based"
										: "Regular"}
								</span>
								{quest.timeRemaining && (
									<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
										<Clock className="w-3 h-3 mr-1" />
										{quest.timeRemaining}
									</span>
								)}
							</div>
							<p className="text-gray-700 mb-6">
								{quest.description}
							</p>
						</div>
					</div>

					{/* Quest Details */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
						<div className="flex items-center">
							<Award className="w-5 h-5 text-purple-500 mr-2" />
							<div>
								<p className="text-sm text-gray-500">Reward</p>
								<p className="font-semibold text-gray-900">
									{quest.rewardAmount} ETH
								</p>
							</div>
						</div>
						<div className="flex items-center">
							<User className="w-5 h-5 text-blue-500 mr-2" />
							<div>
								<p className="text-sm text-gray-500">Creator</p>
								<p className="font-semibold text-gray-900">
									{quest.creator.username || "Anonymous"}
								</p>
							</div>
						</div>
						<div className="flex items-center">
							<Calendar className="w-5 h-5 text-green-500 mr-2" />
							<div>
								<p className="text-sm text-gray-500">Created</p>
								<p className="font-semibold text-gray-900">
									{new Date(
										quest.createdAt
									).toLocaleDateString()}
								</p>
							</div>
						</div>
					</div>

					{/* GitHub Repository Link */}
					{quest.githubUrl && (
						<div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
							<div className="flex items-center">
								<ExternalLink className="w-5 h-5 text-gray-500 mr-2" />
								<div className="flex-1">
									<h3 className="text-gray-800 font-medium">
										GitHub Repository
									</h3>
									<a
										href={quest.githubUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-600 hover:text-blue-800 text-sm underline"
									>
										{quest.githubUrl}
									</a>
								</div>
							</div>
						</div>
					)}

					{/* Escrow Information */}
					{quest.transactionHash && (
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
							<div className="flex items-center">
								<CheckCircle className="w-5 h-5 text-blue-500 mr-2" />
								<div className="flex-1">
									<h3 className="text-blue-800 font-medium">
										Funds Secured in Escrow
									</h3>
									<p className="text-blue-700 text-sm">
										{quest.suppliedFunds} ETH deposited and
										secured in smart contract
									</p>
									<p className="text-blue-600 text-xs mt-1 font-mono break-all">
										Transaction: {quest.transactionHash}
									</p>
								</div>
								<a
									href={`https://sepolia.etherscan.io/tx/${quest.transactionHash}`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 hover:text-blue-800"
								>
									<ExternalLink className="w-4 h-4" />
								</a>
							</div>
						</div>
					)}
				</div>

				{/* Claims Management (for quest creators) */}
				{claims.length > 0 && (
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-lg font-semibold text-gray-900">
								Claims ({claims.length})
							</h2>
							<div className="flex items-center text-sm text-gray-500">
								<Users className="w-4 h-4 mr-1" />
								{
									claims.filter((c) => c.status === "PENDING")
										.length
								}{" "}
								pending
							</div>
						</div>

						<div className="space-y-4">
							{claims.map((claim) => (
								<div
									key={claim.id}
									className="border border-gray-200 rounded-lg p-4"
								>
									<div className="flex items-start justify-between mb-3">
										<div className="flex-1">
											<div className="flex items-center space-x-2 mb-2">
												<h3 className="font-medium text-gray-900">
													{claim.user.username ||
														"Anonymous"}
												</h3>
												<span
													className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
														claim.status ===
														"APPROVED"
															? "bg-green-100 text-green-800"
															: claim.status ===
															  "REJECTED"
															? "bg-red-100 text-red-800"
															: "bg-yellow-100 text-yellow-800"
													}`}
												>
													{claim.status ===
														"APPROVED" && (
														<CheckCircle className="w-3 h-3 mr-1" />
													)}
													{claim.status ===
														"REJECTED" && (
														<XCircle className="w-3 h-3 mr-1" />
													)}
													{claim.status ===
														"PENDING" && (
														<AlertCircle className="w-3 h-3 mr-1" />
													)}
													{claim.status}
												</span>
											</div>
											<p className="text-sm text-gray-500">
												Submitted:{" "}
												{new Date(
													claim.createdAt
												).toLocaleDateString()}
											</p>
										</div>
									</div>

									{claim.proofUrl && (
										<div className="mb-3">
											<span className="text-sm text-gray-600">
												Proof:{" "}
											</span>
											<a
												href={claim.proofUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="text-purple-600 hover:text-purple-800 underline text-sm"
											>
												View Submission
											</a>
										</div>
									)}

									{/* Claim Approval Component for PENDING claims */}
									{claim.status === "PENDING" &&
										quest.status === "OPEN" &&
										isQuestCreator && (
											<ClaimApprovalComponent
												claimId={claim.id}
												questId={quest.id}
												claimerAddress={
													claim.user.walletAddress
												}
												claimerUsername={
													claim.user.username
												}
												amount={quest.rewardAmount}
												onApprovalSuccess={() => {
													// Refresh the page to show updated status
													window.location.reload();
												}}
											/>
										)}

									{/* Show completion status for approved claims */}
									{claim.status === "APPROVED" && (
										<div className="bg-green-50 border border-green-200 rounded-lg p-3">
											<div className="flex items-center">
												<CheckCircle className="w-4 h-4 text-green-500 mr-2" />
												<div>
													<p className="text-green-800 font-medium text-sm">
														Claim Approved
													</p>
													<p className="text-green-700 text-xs">
														{quest.fundsReleased
															? "Funds have been released to the claimer"
															: "Funds are ready to be released from escrow"}
													</p>
												</div>
											</div>
										</div>
									)}

									{/* Show rejection status */}
									{claim.status === "REJECTED" && (
										<div className="bg-red-50 border border-red-200 rounded-lg p-3">
											<div className="flex items-center">
												<XCircle className="w-4 h-4 text-red-500 mr-2" />
												<p className="text-red-800 font-medium text-sm">
													Claim Rejected
												</p>
											</div>
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Simple Claim Dialog */}
			<SimpleClaimDialog
				isOpen={isClaimDialogOpen}
				onClose={() => setIsClaimDialogOpen(false)}
				questId={quest.id}
				questTitle={quest.title}
				rewardAmount={quest.rewardAmount}
			/>
		</>
	);
}
