import { prisma } from "../prisma";
import type { User, Prisma } from "@prisma/client";

export class UserService {
	static async createUser(data: {
		walletAddress: string;
		username?: string;
		email?: string;
	}): Promise<User> {
		return prisma.user.create({
			data: {
				walletAddress: data.walletAddress,
				username: data.username,
				email: data.email,
			},
		});
	}

	static async getUserByWallet(walletAddress: string): Promise<User | null> {
		return prisma.user.findUnique({
			where: { walletAddress },
			include: {
				questsCreated: {
					include: {
						tags: {
							include: {
								tag: true,
							},
						},
					},
				},
				claims: {
					include: {
						quest: true,
					},
				},
			},
		});
	}

	static async getUserById(id: string): Promise<User | null> {
		return prisma.user.findUnique({
			where: { id },
			include: {
				questsCreated: true,
				claims: {
					include: {
						quest: true,
					},
				},
			},
		});
	}

	static async updateUserXP(userId: string, xpToAdd: number): Promise<User> {
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) throw new Error("User not found");

		const newXP = user.xp + xpToAdd;
		const newLevel = Math.floor(newXP / 100) + 1; // Simple leveling: 100 XP per level

		return prisma.user.update({
			where: { id: userId },
			data: {
				xp: newXP,
				level: newLevel,
			},
		});
	}

	static async getLeaderboard(limit: number = 10) {
		return prisma.user.findMany({
			orderBy: [{ xp: "desc" }, { level: "desc" }],
			take: limit,
			select: {
				id: true,
				walletAddress: true,
				username: true,
				email: true,
				xp: true,
				level: true,
				createdAt: true,
				updatedAt: true,
			},
		});
	}
}
