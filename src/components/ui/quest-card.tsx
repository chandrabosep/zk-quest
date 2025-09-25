import Link from "next/link";
import { Clock, Users, Award, Tag } from "lucide-react";

interface QuestCardProps {
	quest: {
		id: string;
		title: string;
		description: string;
		type: "REGULAR" | "TIME_BASED";
		status: "OPEN" | "COMPLETED" | "EXPIRED";
		rewardAmount: number;
		timeRemaining?: string | null;
		isExpired?: boolean;
		tags: string[];
		creator: {
			username?: string | null;
			walletAddress: string;
		};
		_count?: {
			claims: number;
		};
	};
}

export default function QuestCard({ quest }: QuestCardProps) {
	const statusColors = {
		OPEN: "bg-green-100 text-green-800",
		COMPLETED: "bg-blue-100 text-blue-800",
		EXPIRED: "bg-red-100 text-red-800",
	};

	const typeColors = {
		REGULAR: "bg-gray-100 text-gray-800",
		TIME_BASED: "bg-orange-100 text-orange-800",
	};

	return (
		<Link href={`/quests/${quest.id}`}>
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
				{/* Header */}
				<div className="flex items-start justify-between mb-4">
					<div className="flex-1">
						<h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
							{quest.title}
						</h3>
						<p className="text-gray-600 text-sm line-clamp-3 mb-3">
							{quest.description}
						</p>
					</div>
				</div>

				{/* Tags */}
				{quest.tags && quest.tags.length > 0 && (
					<div className="flex flex-wrap gap-1 mb-4">
						{quest.tags.slice(0, 3).map((tag) => (
							<span
								key={tag}
								className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
							>
								<Tag className="w-3 h-3 mr-1" />
								{tag}
							</span>
						))}
						{quest.tags.length > 3 && (
							<span className="text-xs text-gray-500">
								+{quest.tags.length - 3} more
							</span>
						)}
					</div>
				)}

				{/* Stats Row */}
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center space-x-4 text-sm text-gray-600">
						<div className="flex items-center">
							<Award className="w-4 h-4 mr-1" />
							<span className="font-medium">
								{quest.rewardAmount} ETH
							</span>
						</div>

						{quest._count && (
							<div className="flex items-center">
								<Users className="w-4 h-4 mr-1" />
								<span>{quest._count.claims} claims</span>
							</div>
						)}

						{quest.type === "TIME_BASED" && quest.timeRemaining && (
							<div className="flex items-center">
								<Clock className="w-4 h-4 mr-1" />
								<span
									className={
										quest.isExpired
											? "text-red-600"
											: "text-orange-600"
									}
								>
									{quest.timeRemaining}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Status and Type Badges */}
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
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
					</div>

					<div className="text-xs text-gray-500">
						by{" "}
						{quest.creator.username ||
							`${quest.creator.walletAddress.slice(0, 6)}...`}
					</div>
				</div>
			</div>
		</Link>
	);
}
