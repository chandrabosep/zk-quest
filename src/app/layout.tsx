import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

import { headers } from "next/headers"; // added
import ContextProvider from "@/context";
import Navbar from "@/components/layout/navbar";

export const metadata: Metadata = {
	title: "ZKQuest - Decentralized Bounty Platform",
	description:
		"Complete quests, earn rewards, and build your reputation in the ZKQuest ecosystem",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const headersObj = await headers();
	const cookies = headersObj.get("cookie");

	return (
		<html lang="en">
			<body className={inter.className}>
				<ContextProvider cookies={cookies}>
					<div className="min-h-screen bg-gray-50">
						<Navbar />
						<main>{children}</main>
					</div>
				</ContextProvider>
			</body>
		</html>
	);
}
