"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ConnectButton from "@/components/connect-btn";

const navigation = [
	{ name: "Quests", href: "/quests" },
	{ name: "Leaderboard", href: "/leaderboard" },
	{ name: "My Profile", href: "/profile" },
	{ name: "Create Quest", href: "/create" },
];

export default function Navbar() {
	const pathname = usePathname();

	return (
		<nav className="bg-white shadow-sm border-b">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16">
					<div className="flex items-center">
						<Link href="/" className="flex items-center space-x-2">
							<div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
								<span className="text-white font-bold text-sm">
									ZK
								</span>
							</div>
							<span className="text-xl font-bold text-gray-900">
								ZKQuest
							</span>
						</Link>

						<div className="hidden md:ml-10 md:flex md:space-x-8">
							{navigation.map((item) => (
								<Link
									key={item.name}
									href={item.href}
									className={`${
										pathname === item.href
											? "border-purple-500 text-purple-600"
											: "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
									} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
								>
									{item.name}
								</Link>
							))}
						</div>
					</div>

					<div className="flex items-center space-x-4">
						<ConnectButton />
					</div>
				</div>
			</div>

			{/* Mobile menu */}
			<div className="md:hidden">
				<div className="pt-2 pb-3 space-y-1">
					{navigation.map((item) => (
						<Link
							key={item.name}
							href={item.href}
							className={`${
								pathname === item.href
									? "bg-purple-50 border-purple-500 text-purple-700"
									: "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
							} block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors`}
						>
							{item.name}
						</Link>
					))}
				</div>
			</div>
		</nav>
	);
}
