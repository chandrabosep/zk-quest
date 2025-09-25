export class GitHubHelpers {
	/**
	 * Validate GitHub repository URL
	 */
	static validateGitHubUrl(url: string): {
		isValid: boolean;
		error?: string;
		normalizedUrl?: string;
	} {
		if (!url || !url.trim()) {
			return { isValid: false, error: "GitHub URL is required" };
		}

		const trimmedUrl = url.trim();

		// Check if it's a valid GitHub URL format
		const githubRegex =
			/^https:\/\/github\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+(?:\/.*)?$/;

		if (!githubRegex.test(trimmedUrl)) {
			return {
				isValid: false,
				error: "Please provide a valid GitHub repository URL (e.g., https://github.com/username/repository)",
			};
		}

		// Normalize the URL to just the repository URL (remove any subpaths)
		const urlParts = trimmedUrl.split("/");
		if (urlParts.length < 5) {
			return {
				isValid: false,
				error: "Please provide a complete GitHub repository URL",
			};
		}

		const normalizedUrl = `https://github.com/${urlParts[3]}/${urlParts[4]}`;

		return {
			isValid: true,
			normalizedUrl,
		};
	}

	/**
	 * Extract repository information from GitHub URL
	 */
	static extractRepoInfo(
		url: string
	): { owner: string; repo: string } | null {
		const validation = this.validateGitHubUrl(url);
		if (!validation.isValid || !validation.normalizedUrl) {
			return null;
		}

		const urlParts = validation.normalizedUrl.split("/");
		return {
			owner: urlParts[3],
			repo: urlParts[4],
		};
	}

	/**
	 * Generate GitHub API URL for repository
	 */
	static getApiUrl(url: string): string | null {
		const repoInfo = this.extractRepoInfo(url);
		if (!repoInfo) {
			return null;
		}

		return `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`;
	}

	/**
	 * Generate GitHub issues URL for the repository
	 */
	static getIssuesUrl(url: string): string | null {
		const repoInfo = this.extractRepoInfo(url);
		if (!repoInfo) {
			return null;
		}

		return `https://github.com/${repoInfo.owner}/${repoInfo.repo}/issues`;
	}

	/**
	 * Generate GitHub pull requests URL for the repository
	 */
	static getPullRequestsUrl(url: string): string | null {
		const repoInfo = this.extractRepoInfo(url);
		if (!repoInfo) {
			return null;
		}

		return `https://github.com/${repoInfo.owner}/${repoInfo.repo}/pulls`;
	}
}
