import Link from "next/link";
import { QuestController, UserController } from "@/controllers";
import { ArrowRight, Zap, Shield, Award, Users } from "lucide-react";

export default async function HomePage() {
	// Get some stats for the landing page
	const [questStats, leaderboard] = await Promise.all([
		QuestController.getQuestStats().catch(() => ({
			total: 0,
			open: 0,
			completed: 0,
			expired: 0,
			totalRewards: 0,
		})),
		UserController.getLeaderboard(3).catch(() => []),
	]);

	return (
		<div className="min-h-screen">
			{/* Hero Section */}
			<div className="bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
					<div className="text-center">
						<h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
							Welcome to{" "}
							<span className="bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
								ZKQuest
							</span>
						</h1>
						<p className="text-xl text-purple-100 mb-8 max-w-3xl mx-auto">
							The decentralized bounty platform where developers
							complete quests, earn rewards, and build their
							reputation using zero-knowledge proofs.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link
								href="/quests"
								className="inline-flex items-center px-8 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
							>
								Explore Quests
								<ArrowRight className="ml-2 w-5 h-5" />
							</Link>
							<Link
								href="/create"
								className="inline-flex items-center px-8 py-3 bg-purple-800 text-white font-semibold rounded-lg hover:bg-purple-900 transition-colors"
							>
								Create Quest
							</Link>
						</div>
					</div>
				</div>
			</div>

			{/* Features Section */}
			<div className="py-24 bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<h2 className="text-3xl font-bold text-gray-900 mb-4">
							Why Choose ZKQuest?
						</h2>
						<p className="text-lg text-gray-600 max-w-2xl mx-auto">
							Built for the future of decentralized work with
							cutting-edge technology
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<div className="text-center">
							<div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Shield className="w-8 h-8 text-purple-600" />
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								Zero-Knowledge Proofs
							</h3>
							<p className="text-gray-600">
								Verify work completion without revealing
								sensitive information using advanced ZK
								technology.
							</p>
						</div>

						<div className="text-center">
							<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Zap className="w-8 h-8 text-green-600" />
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								Instant Rewards
							</h3>
							<p className="text-gray-600">
								Get paid immediately upon quest completion with
								smart contract automation and escrow protection.
							</p>
						</div>

						<div className="text-center">
							<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<Award className="w-8 h-8 text-blue-600" />
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								Build Reputation
							</h3>
							<p className="text-gray-600">
								Earn XP, level up, and build your on-chain
								reputation as you complete more challenging
								quests.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Stats Section */}
			<div className="py-16 bg-gray-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-4">
							Platform Statistics
						</h2>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
						<div className="text-center">
							<div className="text-3xl font-bold text-purple-600 mb-2">
								{questStats.total}
							</div>
							<div className="text-gray-600">Total Quests</div>
						</div>
						<div className="text-center">
							<div className="text-3xl font-bold text-green-600 mb-2">
								{questStats.open}
							</div>
							<div className="text-gray-600">Open Quests</div>
						</div>
						<div className="text-3xl font-bold text-blue-600 mb-2 text-center">
							{questStats.totalRewards.toFixed(2)} ETH
						</div>
						<div className="text-gray-600 text-center">
							Total Rewards
						</div>
						<div className="text-center">
							<div className="text-3xl font-bold text-orange-600 mb-2">
								{leaderboard.length}
							</div>
							<div className="text-gray-600">Active Users</div>
						</div>
					</div>
				</div>
			</div>

			{/* Top Users */}
			{leaderboard.length > 0 && (
				<div className="py-16 bg-white">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="text-center mb-12">
							<h2 className="text-3xl font-bold text-gray-900 mb-4">
								Top Contributors
							</h2>
							<p className="text-gray-600">
								Meet the leaders in our community
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							{leaderboard.map((user, index) => (
								<div
									key={user.id}
									className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center"
								>
									<div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
										<Users className="w-8 h-8 text-white" />
									</div>
									<h3 className="text-lg font-semibold text-gray-900 mb-2">
										{user.username ||
											`${user.walletAddress.slice(
												0,
												6
											)}...`}
									</h3>
									<div className="text-2xl font-bold text-purple-600 mb-1">
										{user.xp.toLocaleString()}
									</div>
									<div className="text-sm text-gray-600">
										XP • Level {user.level}
									</div>
								</div>
							))}
						</div>

						<div className="text-center mt-8">
							<Link
								href="/leaderboard"
								className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
							>
								View Full Leaderboard
								<ArrowRight className="ml-1 w-4 h-4" />
							</Link>
						</div>
					</div>
				</div>
			)}

			{/* CTA Section */}
			<div className="py-16 bg-gradient-to-r from-purple-600 to-pink-600">
				<div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
					<h2 className="text-3xl font-bold text-white mb-4">
						Ready to Start Your Quest?
					</h2>
					<p className="text-xl text-purple-100 mb-8">
						Join thousands of developers earning rewards for their
						skills
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link
							href="/quests"
							className="inline-flex items-center px-8 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
						>
							Browse Quests
							<ArrowRight className="ml-2 w-5 h-5" />
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
