import { Suspense } from "react";
import { QuestController, TagController } from "@/controllers";
import QuestCard from "@/components/ui/quest-card";
import QuestFilters from "@/components/ui/quest-filters";
import { Loader2 } from "lucide-react";

interface QuestsPageProps {
	searchParams: Promise<{
		search?: string;
		status?: string;
		type?: string;
		tags?: string;
	}>;
}

async function QuestsList({ searchParams }: QuestsPageProps) {
	const params = await searchParams;
	const filters = {
		status: params.status as "OPEN" | "COMPLETED" | "EXPIRED" | undefined,
		type: params.type as "REGULAR" | "TIME_BASED" | undefined,
		tags: params.tags ? params.tags.split(",") : undefined,
	};

	const [quests, popularTags] = await Promise.all([
		QuestController.getQuests(filters).catch((error) => {
			console.error("Failed to fetch quests:", error);
			return [];
		}),
		TagController.getPopularTags().catch((error) => {
			console.error("Failed to fetch tags:", error);
			return [];
		}),
	]);

	// Filter by search term on the server
	let filteredQuests = quests;
	if (params.search) {
		const searchTerm = params.search.toLowerCase();
		filteredQuests = quests.filter(
			(quest) =>
				quest.title.toLowerCase().includes(searchTerm) ||
				quest.description.toLowerCase().includes(searchTerm)
		);
	}

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">
					Explore Quests
				</h1>
				<p className="text-gray-600">
					Discover bounties, complete challenges, and earn rewards
				</p>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
					<div className="text-2xl font-bold text-gray-900">
						{quests.length}
					</div>
					<div className="text-sm text-gray-600">Total Quests</div>
				</div>
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
					<div className="text-2xl font-bold text-green-600">
						{quests.filter((q) => q.status === "OPEN").length}
					</div>
					<div className="text-sm text-gray-600">Open Quests</div>
				</div>
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
					<div className="text-2xl font-bold text-purple-600">
						{quests
							.reduce((sum, q) => sum + q.rewardAmount, 0)
							.toFixed(6)}
					</div>
					<div className="text-sm text-gray-600">
						Total Rewards (ETH)
					</div>
				</div>
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
					<div className="text-2xl font-bold text-orange-600">
						{quests.filter((q) => q.type === "TIME_BASED").length}
					</div>
					<div className="text-sm text-gray-600">Time-Based</div>
				</div>
			</div>

			{/* Filters - This will be enhanced with client-side functionality */}
			<div className="mb-6">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
					<div className="text-sm text-gray-600">
						Filters will be interactive in the next update.
						Currently showing: {filteredQuests.length} quests
					</div>
				</div>
			</div>

			{/* Quest Grid */}
			{filteredQuests.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredQuests.map((quest) => (
						<QuestCard key={quest.id} quest={quest} />
					))}
				</div>
			) : (
				<div className="text-center py-12">
					<div className="text-gray-500 text-lg mb-2">
						No quests available
					</div>
					<div className="text-gray-400 mb-4">
						{quests.length === 0
							? "The database might not be set up yet, or there are no quests created."
							: "Try adjusting your search or filters"}
					</div>
					{quests.length === 0 && (
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
							<div className="text-blue-800 text-sm mb-2">
								<strong>Getting Started:</strong>
							</div>
							<div className="text-blue-700 text-sm text-left">
								1. Run{" "}
								<code className="bg-blue-100 px-1 rounded">
									./setup-db.sh
								</code>{" "}
								to set up your database
								<br />
								2. Or manually run:{" "}
								<code className="bg-blue-100 px-1 rounded">
									npm run db:migrate
								</code>
								<br />
								3. Seed with sample data:{" "}
								<code className="bg-blue-100 px-1 rounded">
									npm run db:seed
								</code>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function LoadingSkeleton() {
	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div className="flex items-center justify-center py-12">
				<Loader2 className="w-8 h-8 animate-spin text-purple-600" />
				<span className="ml-2 text-gray-600">Loading quests...</span>
			</div>
		</div>
	);
}

export default function QuestsPage(props: QuestsPageProps) {
	return (
		<Suspense fallback={<LoadingSkeleton />}>
			<QuestsList {...props} />
		</Suspense>
	);
}
