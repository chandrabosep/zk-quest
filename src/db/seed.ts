import { prisma } from "./prisma";
import type { QuestType } from "@prisma/client";

async function seed() {
	console.log("🌱 Seeding database...");

	// Create sample users
	const users = await Promise.all([
		prisma.user.upsert({
			where: {
				walletAddress: "0x1234567890123456789012345678901234567890",
			},
			update: {},
			create: {
				walletAddress: "0x1234567890123456789012345678901234567890",
				username: "alice_dev",
				email: "alice@example.com",
				xp: 250,
				level: 3,
			},
		}),
		prisma.user.upsert({
			where: {
				walletAddress: "0x0987654321098765432109876543210987654321",
			},
			update: {},
			create: {
				walletAddress: "0x0987654321098765432109876543210987654321",
				username: "bob_builder",
				email: "bob@example.com",
				xp: 150,
				level: 2,
			},
		}),
		prisma.user.upsert({
			where: {
				walletAddress: "0x1111111111111111111111111111111111111111",
			},
			update: {},
			create: {
				walletAddress: "0x1111111111111111111111111111111111111111",
				username: "charlie_zk",
				xp: 500,
				level: 5,
			},
		}),
	]);

	console.log(
		"👥 Created users:",
		users.map((u) => u.username)
	);

	// Create sample tags
	const tags = await Promise.all([
		prisma.tag.upsert({
			where: { name: "frontend" },
			update: {},
			create: { name: "frontend" },
		}),
		prisma.tag.upsert({
			where: { name: "smart-contracts" },
			update: {},
			create: { name: "smart-contracts" },
		}),
		prisma.tag.upsert({
			where: { name: "zk-proofs" },
			update: {},
			create: { name: "zk-proofs" },
		}),
		prisma.tag.upsert({
			where: { name: "defi" },
			update: {},
			create: { name: "defi" },
		}),
		prisma.tag.upsert({
			where: { name: "testing" },
			update: {},
			create: { name: "testing" },
		}),
	]);

	console.log(
		"🏷️ Created tags:",
		tags.map((t) => t.name)
	);

	// Create sample quests
	const quest1 = await prisma.quest.upsert({
		where: { id: "quest1" },
		update: {},
		create: {
			id: "quest1",
			title: "Build a DeFi Dashboard",
			description:
				"Create a responsive dashboard that displays DeFi protocol data including TVL, APY, and user positions. Must include at least 3 protocols and real-time data updates.",
			type: "REGULAR" as QuestType,
			creatorId: users[0].id,
			rewardAmount: 0.5,
			escrowAddress: "0xabcd1234567890abcd1234567890abcd12345678",
			tags: {
				create: [
					{ tag: { connect: { name: "frontend" } } },
					{ tag: { connect: { name: "defi" } } },
				],
			},
		},
	});

	const quest2 = await prisma.quest.upsert({
		where: { id: "quest2" },
		update: {},
		create: {
			id: "quest2",
			title: "ZK Email Verification System",
			description:
				"Implement a zero-knowledge email verification system that proves email ownership without revealing the email content. Use zk-email SDK.",
			type: "TIME_BASED" as QuestType,
			expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
			creatorId: users[1].id,
			rewardAmount: 1.0,
			escrowAddress: "0xefgh5678901234efgh5678901234efgh56789012",
			tags: {
				create: [
					{ tag: { connect: { name: "zk-proofs" } } },
					{ tag: { connect: { name: "smart-contracts" } } },
				],
			},
		},
	});

	const quest3 = await prisma.quest.upsert({
		where: { id: "quest3" },
		update: {},
		create: {
			id: "quest3",
			title: "Smart Contract Testing Suite",
			description:
				"Create comprehensive test coverage for a multi-signature wallet contract. Include unit tests, integration tests, and fuzzing tests.",
			type: "REGULAR" as QuestType,
			creatorId: users[2].id,
			rewardAmount: 0.3,
			status: "COMPLETED",
			tags: {
				create: [
					{ tag: { connect: { name: "smart-contracts" } } },
					{ tag: { connect: { name: "testing" } } },
				],
			},
		},
	});

	console.log("🎯 Created quests:", [
		quest1.title,
		quest2.title,
		quest3.title,
	]);

	// Create sample claims
	const claim1 = await prisma.claim.upsert({
		where: { id: "claim1" },
		update: {},
		create: {
			id: "claim1",
			questId: quest3.id,
			userId: users[0].id,
			proofUrl: "https://github.com/alice_dev/multisig-tests/pull/1",
			status: "APPROVED",
		},
	});

	const claim2 = await prisma.claim.upsert({
		where: { id: "claim2" },
		update: {},
		create: {
			id: "claim2",
			questId: quest1.id,
			userId: users[1].id,
			proofUrl: "https://github.com/bob_builder/defi-dashboard/pull/5",
			status: "PENDING",
		},
	});

	console.log("📋 Created claims:", [claim1.id, claim2.id]);

	console.log("✅ Seeding completed!");
}

seed()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
