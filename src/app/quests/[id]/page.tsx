import { Suspense } from "react";
import { notFound } from "next/navigation";
import { QuestController, ClaimController } from "@/controllers";
import { QuestDetailClient } from "./quest-detail-client";

interface QuestDetailPageProps {
	params: { id: string };
}

async function QuestDetail({ params }: QuestDetailPageProps) {
	try {
		const [quest, claims] = await Promise.all([
			QuestController.getQuestById(params.id),
			ClaimController.getClaimsByQuest(params.id),
		]);

		return <QuestDetailClient quest={quest} claims={claims} />;
	} catch (error) {
		notFound();
	}
}

function LoadingSkeleton() {
	return (
		<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
				<div className="animate-pulse">
					<div className="h-8 bg-gray-300 rounded mb-4"></div>
					<div className="h-4 bg-gray-300 rounded w-1/2 mb-6"></div>
					<div className="grid grid-cols-3 gap-4">
						<div className="h-4 bg-gray-300 rounded"></div>
						<div className="h-4 bg-gray-300 rounded"></div>
						<div className="h-4 bg-gray-300 rounded"></div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function QuestDetailPage(props: QuestDetailPageProps) {
	return (
		<Suspense fallback={<LoadingSkeleton />}>
			<QuestDetail {...props} />
		</Suspense>
	);
}
