import { TagHelpers } from "@/utils/tag-helpers";
import { prisma } from "@/db/prisma";

export interface TagSuggestionData {
	title?: string;
	description?: string;
}

export class TagController {
	/**
	 * Get all tags with quest counts
	 */
	static async getAllTags() {
		const tags = await prisma.tag.findMany({
			select: {
				name: true,
				_count: {
					select: {
						quests: true,
					},
				},
			},
			orderBy: {
				quests: {
					_count: "desc",
				},
			},
		});

		return tags.map((tag) => ({
			name: tag.name,
			questCount: tag._count.quests,
		}));
	}

	/**
	 * Search tags by query
	 */
	static async searchTags(query: string) {
		if (!query || query.trim().length === 0) {
			return [];
		}

		// Get all tags from database for searching
		const allTags = await prisma.tag.findMany({
			select: { name: true },
			orderBy: { name: "asc" },
		});

		const tagNames = allTags.map((tag) => tag.name);
		return TagHelpers.searchTags(query, tagNames);
	}

	/**
	 * Get popular/suggested tags
	 */
	static async getPopularTags() {
		return TagHelpers.getPopularTags();
	}

	/**
	 * Generate tag suggestions based on text
	 */
	static async generateTagSuggestions(data: TagSuggestionData) {
		if (!data.title && !data.description) {
			throw new Error("Title or description is required");
		}

		return TagHelpers.suggestTags(data.title || "", data.description || "");
	}

	/**
	 * Get trending tags (most used in recent quests)
	 */
	static async getTrendingTags(days = 7, limit = 10) {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		const trendingTags = await prisma.tag.findMany({
			select: {
				name: true,
				_count: {
					select: {
						quests: {
							where: {
								createdAt: {
									gte: startDate,
								},
							},
						},
					},
				},
			},
			orderBy: {
				quests: {
					_count: "desc",
				},
			},
			take: limit,
		});

		return trendingTags
			.filter((tag) => tag._count.quests > 0)
			.map((tag) => ({
				name: tag.name,
				recentQuestCount: tag._count.quests,
			}));
	}

	/**
	 * Get tag statistics
	 */
	static async getTagStats() {
		const [totalTags, tagsWithQuests, mostUsedTag] = await Promise.all([
			prisma.tag.count(),
			prisma.tag.count({
				where: {
					quests: {
						some: {},
					},
				},
			}),
			prisma.tag.findFirst({
				select: {
					name: true,
					_count: {
						select: {
							quests: true,
						},
					},
				},
				orderBy: {
					quests: {
						_count: "desc",
					},
				},
			}),
		]);

		return {
			totalTags,
			tagsWithQuests,
			unusedTags: totalTags - tagsWithQuests,
			mostUsedTag: mostUsedTag
				? {
						name: mostUsedTag.name,
						questCount: mostUsedTag._count.quests,
				  }
				: null,
		};
	}

	/**
	 * Validate and normalize tags
	 */
	static validateTags(tags: string[]) {
		const validation = TagHelpers.validateTags(tags);
		if (!validation.isValid) {
			throw new Error(
				`Tag validation failed: ${validation.errors.join(", ")}`
			);
		}

		return TagHelpers.normalizeTags(tags);
	}

	/**
	 * Get tags for a specific category/domain
	 */
	static async getTagsByCategory(category: string) {
		const categoryMap: Record<string, string[]> = {
			blockchain: [
				"ethereum",
				"polygon",
				"arbitrum",
				"optimism",
				"solidity",
			],
			frontend: [
				"react",
				"nextjs",
				"javascript",
				"typescript",
				"frontend",
			],
			backend: ["backend", "api", "database", "nodejs"],
			defi: ["defi", "dex", "lending", "yield-farming", "liquidity"],
			nft: ["nft", "marketplace", "metadata", "opensea"],
			zk: ["zk-proofs", "zero-knowledge", "privacy", "cryptography"],
			testing: ["testing", "unit-tests", "integration-tests", "e2e"],
		};

		const categoryTags = categoryMap[category.toLowerCase()] || [];

		if (categoryTags.length === 0) {
			return [];
		}

		// Get these tags from database with their quest counts
		const tags = await prisma.tag.findMany({
			where: {
				name: {
					in: categoryTags,
				},
			},
			select: {
				name: true,
				_count: {
					select: {
						quests: true,
					},
				},
			},
			orderBy: {
				quests: {
					_count: "desc",
				},
			},
		});

		return tags.map((tag) => ({
			name: tag.name,
			questCount: tag._count.quests,
		}));
	}

	/**
	 * Create or get existing tags
	 */
	static async ensureTagsExist(tagNames: string[]) {
		const normalizedTags = this.validateTags(tagNames);

		const tags = await Promise.all(
			normalizedTags.map((tagName) =>
				prisma.tag.upsert({
					where: { name: tagName },
					update: {},
					create: { name: tagName },
				})
			)
		);

		return tags;
	}

	/**
	 * Get related tags based on co-occurrence in quests
	 */
	static async getRelatedTags(tagName: string, limit = 5) {
		// Find quests that have this tag
		const questsWithTag = await prisma.quest.findMany({
			where: {
				tags: {
					some: {
						tag: {
							name: tagName,
						},
					},
				},
			},
			select: {
				tags: {
					select: {
						tag: {
							select: {
								name: true,
							},
						},
					},
				},
			},
		});

		// Count co-occurring tags
		const tagCounts: Record<string, number> = {};

		questsWithTag.forEach((quest) => {
			quest.tags.forEach((tagRelation) => {
				const relatedTagName = tagRelation.tag.name;
				if (relatedTagName !== tagName) {
					tagCounts[relatedTagName] =
						(tagCounts[relatedTagName] || 0) + 1;
				}
			});
		});

		// Sort by frequency and return top results
		return Object.entries(tagCounts)
			.sort(([, a], [, b]) => b - a)
			.slice(0, limit)
			.map(([name, count]) => ({ name, coOccurrences: count }));
	}
}
