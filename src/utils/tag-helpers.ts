export class TagHelpers {
	/**
	 * Normalize tag names (lowercase, trim, replace spaces with hyphens)
	 */
	static normalizeTags(tags: string[]): string[] {
		return tags
			.map((tag) => tag.trim().toLowerCase().replace(/\s+/g, "-"))
			.filter((tag) => tag.length > 0)
			.filter((tag, index, array) => array.indexOf(tag) === index); // Remove duplicates
	}

	/**
	 * Validate tag names
	 */
	static validateTags(tags: string[]): {
		isValid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];
		const normalizedTags = this.normalizeTags(tags);

		if (normalizedTags.length === 0) {
			errors.push("At least one tag is required");
		}

		if (normalizedTags.length > 10) {
			errors.push("Maximum 10 tags allowed per quest");
		}

		for (const tag of normalizedTags) {
			if (tag.length < 2) {
				errors.push(`Tag "${tag}" is too short (minimum 2 characters)`);
			}
			if (tag.length > 30) {
				errors.push(`Tag "${tag}" is too long (maximum 30 characters)`);
			}
			if (!/^[a-z0-9-]+$/.test(tag)) {
				errors.push(
					`Tag "${tag}" contains invalid characters (only lowercase letters, numbers, and hyphens allowed)`
				);
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Get popular tags (this would typically come from the database)
	 */
	static getPopularTags(): string[] {
		return [
			"frontend",
			"backend",
			"smart-contracts",
			"zk-proofs",
			"defi",
			"nft",
			"dao",
			"web3",
			"solidity",
			"rust",
			"javascript",
			"typescript",
			"react",
			"nextjs",
			"ethereum",
			"polygon",
			"arbitrum",
			"optimism",
			"testing",
			"documentation",
		];
	}

	/**
	 * Search tags by partial match
	 */
	static searchTags(query: string, availableTags: string[]): string[] {
		const normalizedQuery = query.toLowerCase().trim();
		if (!normalizedQuery) return [];

		return availableTags
			.filter((tag) => tag.toLowerCase().includes(normalizedQuery))
			.sort((a, b) => {
				// Prioritize exact matches
				if (a.toLowerCase() === normalizedQuery) return -1;
				if (b.toLowerCase() === normalizedQuery) return 1;

				// Then prioritize tags that start with the query
				const aStarts = a.toLowerCase().startsWith(normalizedQuery);
				const bStarts = b.toLowerCase().startsWith(normalizedQuery);
				if (aStarts && !bStarts) return -1;
				if (bStarts && !aStarts) return 1;

				// Finally sort alphabetically
				return a.localeCompare(b);
			})
			.slice(0, 10); // Limit results
	}

	/**
	 * Generate tag suggestions based on quest title and description
	 */
	static suggestTags(title: string, description: string): string[] {
		const text = `${title} ${description}`.toLowerCase();
		const popularTags = this.getPopularTags();

		const suggestions = popularTags.filter((tag) => {
			const tagWords = tag.split("-");
			return tagWords.some((word) => text.includes(word));
		});

		return suggestions.slice(0, 5); // Return top 5 suggestions
	}

	/**
	 * Format tags for display
	 */
	static formatTagsForDisplay(tags: { tag: { name: string } }[]): string[] {
		return tags.map((t) => t.tag.name);
	}

	/**
	 * Create tag filter query for database
	 */
	static createTagFilter(tags: string[]): any {
		if (tags.length === 0) return {};

		return {
			tags: {
				some: {
					tag: {
						name: {
							in: tags,
						},
					},
				},
			},
		};
	}
}
