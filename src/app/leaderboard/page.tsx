import { Suspense } from "react";
import { UserController } from "@/controllers";
import { Trophy, Medal, Award, Star } from "lucide-react";

async function LeaderboardList() {
	const leaderboard = await UserController.getLeaderboard(50);

	const getRankIcon = (rank: number) => {
		switch (rank) {
			case 1:
				return <Trophy className="w-6 h-6 text-yellow-500" />;
			case 2:
				return <Medal className="w-6 h-6 text-gray-400" />;
			case 3:
				return <Award className="w-6 h-6 text-amber-600" />;
			default:
				return (
					<span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">
						#{rank}
					</span>
				);
		}
	};

	const getRankBadge = (rank: number) => {
		if (rank <= 3) {
			return `bg-gradient-to-r ${
				rank === 1
					? "from-yellow-400 to-yellow-600"
					: rank === 2
					? "from-gray-300 to-gray-500"
					: "from-amber-400 to-amber-600"
			} text-white`;
		}
		return "bg-gray-100 text-gray-700";
	};

	return (
		<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">
					Leaderboard
				</h1>
				<p className="text-gray-600">
					Top performers in the ZKQuest community
				</p>
			</div>

			{/* Top 3 Podium */}
			{leaderboard.length >= 3 && (
				<div className="mb-12">
					<div className="flex items-end justify-center space-x-4 mb-8">
						{/* 2nd Place */}
						<div className="text-center">
							<div className="bg-gradient-to-r from-gray-300 to-gray-500 rounded-lg p-6 mb-4 min-h-[120px] flex flex-col justify-end">
								<div className="text-white">
									<Medal className="w-8 h-8 mx-auto mb-2" />
									<div className="font-bold text-lg">
										{leaderboard[1].username ||
											`${leaderboard[1].walletAddress.slice(
												0,
												6
											)}...`}
									</div>
									<div className="text-sm opacity-90">
										{leaderboard[1].xp} XP
									</div>
								</div>
							</div>
							<div className="text-sm text-gray-600">
								2nd Place
							</div>
						</div>

						{/* 1st Place */}
						<div className="text-center">
							<div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg p-6 mb-4 min-h-[140px] flex flex-col justify-end">
								<div className="text-white">
									<Trophy className="w-10 h-10 mx-auto mb-2" />
									<div className="font-bold text-xl">
										{leaderboard[0].username ||
											`${leaderboard[0].walletAddress.slice(
												0,
												6
											)}...`}
									</div>
									<div className="text-sm opacity-90">
										{leaderboard[0].xp} XP
									</div>
								</div>
							</div>
							<div className="text-sm text-gray-600">
								1st Place
							</div>
						</div>

						{/* 3rd Place */}
						<div className="text-center">
							<div className="bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg p-6 mb-4 min-h-[100px] flex flex-col justify-end">
								<div className="text-white">
									<Award className="w-8 h-8 mx-auto mb-2" />
									<div className="font-bold text-lg">
										{leaderboard[2].username ||
											`${leaderboard[2].walletAddress.slice(
												0,
												6
											)}...`}
									</div>
									<div className="text-sm opacity-90">
										{leaderboard[2].xp} XP
									</div>
								</div>
							</div>
							<div className="text-sm text-gray-600">
								3rd Place
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Full Leaderboard */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
				<div className="px-6 py-4 border-b border-gray-200">
					<h2 className="text-lg font-semibold text-gray-900">
						Complete Rankings
					</h2>
				</div>
				<div className="divide-y divide-gray-200">
					{leaderboard.map((user, index) => {
						const rank = index + 1;
						return (
							<div
								key={user.id}
								className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 ${
									rank <= 3
										? "bg-gradient-to-r from-purple-50 to-pink-50"
										: ""
								}`}
							>
								<div className="flex items-center space-x-4">
									<div className="flex-shrink-0">
										{getRankIcon(rank)}
									</div>
									<div className="flex-1">
										<div className="flex items-center space-x-3">
											<h3 className="text-lg font-medium text-gray-900">
												{user.username ||
													`${user.walletAddress.slice(
														0,
														6
													)}...${user.walletAddress.slice(
														-4
													)}`}
											</h3>
											<span
												className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRankBadge(
													rank
												)}`}
											>
												#{rank}
											</span>
										</div>
										<p className="text-sm text-gray-500">
											Level {user.level} • Joined{" "}
											{new Date(
												user.createdAt
											).toLocaleDateString()}
										</p>
									</div>
								</div>
								<div className="text-right">
									<div className="text-xl font-bold text-purple-600">
										{user.xp.toLocaleString()}
									</div>
									<div className="text-sm text-gray-500">
										XP
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{leaderboard.length === 0 && (
				<div className="text-center py-12">
					<Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						No users yet
					</h3>
					<p className="text-gray-600">
						Be the first to complete quests and climb the
						leaderboard!
					</p>
				</div>
			)}

			{/* Stats */}
			<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
					<div className="text-2xl font-bold text-gray-900">
						{leaderboard.length}
					</div>
					<div className="text-sm text-gray-600">Total Users</div>
				</div>
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
					<div className="text-2xl font-bold text-purple-600">
						{leaderboard
							.reduce((sum, user) => sum + user.xp, 0)
							.toLocaleString()}
					</div>
					<div className="text-sm text-gray-600">Total XP Earned</div>
				</div>
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
					<div className="text-2xl font-bold text-green-600">
						{leaderboard.length > 0
							? Math.round(
									leaderboard.reduce(
										(sum, user) => sum + user.xp,
										0
									) / leaderboard.length
							  )
							: 0}
					</div>
					<div className="text-sm text-gray-600">Average XP</div>
				</div>
			</div>
		</div>
	);
}

function LoadingSkeleton() {
	return (
		<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div className="mb-8">
				<div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
				<div className="h-4 bg-gray-300 rounded w-1/2"></div>
			</div>
			<div className="space-y-4">
				{[...Array(10)].map((_, i) => (
					<div
						key={i}
						className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
					>
						<div className="animate-pulse flex items-center space-x-4">
							<div className="w-12 h-12 bg-gray-300 rounded-full"></div>
							<div className="flex-1">
								<div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
								<div className="h-3 bg-gray-300 rounded w-1/3"></div>
							</div>
							<div className="h-6 bg-gray-300 rounded w-16"></div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export default function LeaderboardPage() {
	return (
		<Suspense fallback={<LoadingSkeleton />}>
			<LeaderboardList />
		</Suspense>
	);
}
