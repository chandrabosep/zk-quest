"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import {
	Calendar,
	DollarSign,
	Tag,
	FileText,
	AlertCircle,
	CheckCircle,
	Loader2,
} from "lucide-react";
import { useQuestEscrow } from "@/hooks/useQuestEscrow";
import { GitHubHelpers } from "@/utils/github-helpers";

export default function CreateQuestPage() {
	const { address, isConnected } = useAccount();
	const router = useRouter();

	const [formData, setFormData] = useState({
		title: "",
		description: "",
		githubUrl: "",
		type: "REGULAR" as "REGULAR" | "TIME_BASED",
		expiry: "",
		tags: "",
		amount: "",
	});

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [step, setStep] = useState<
		"form" | "blockchain" | "database" | "complete"
	>("form");

	// Escrow contract integration
	const {
		createQuest: createEscrowQuest,
		isLoading: isEscrowLoading,
		isConfirming,
		isConfirmed,
		error: escrowError,
		transactionHash,
	} = useQuestEscrow();

	// Handle blockchain transaction confirmation
	useEffect(() => {
		if (isConfirmed && step === "blockchain") {
			setStep("database");
			createQuestInDatabase();
		}
	}, [isConfirmed, step]);

	// Handle escrow errors
	useEffect(() => {
		if (escrowError) {
			setError(escrowError);
			setIsSubmitting(false);
			setStep("form");
		}
	}, [escrowError]);

	const createQuestInDatabase = async () => {
		try {
			// Validate GitHub URL again for the database call
			const githubValidation = GitHubHelpers.validateGitHubUrl(
				formData.githubUrl
			);
			if (!githubValidation.isValid || !githubValidation.normalizedUrl) {
				throw new Error("Invalid GitHub URL");
			}

			const response = await fetch("/api/quests", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title: formData.title.trim(),
					description: formData.description.trim(),
					githubUrl: githubValidation.normalizedUrl,
					type: formData.type,
					expiry: formData.expiry
						? new Date(formData.expiry).toISOString()
						: null,
					tags: formData.tags
						.split(",")
						.map((tag) => tag.trim())
						.filter(Boolean),
					creatorId: address,
					rewardAmount: parseFloat(formData.amount),
					suppliedFunds: parseFloat(formData.amount),
					transactionHash: transactionHash,
				}),
			});

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || "Failed to create quest");
			}

			setStep("complete");
			setSuccess(true);

			// Redirect to the new quest after a delay
			setTimeout(() => {
				router.push(`/quests/${data.data.id}`);
			}, 3000);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to create quest in database"
			);
			setIsSubmitting(false);
			setStep("form");
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsSubmitting(true);
		setStep("form");

		try {
			if (!isConnected || !address) {
				throw new Error("Please connect your wallet first");
			}

			// Validate form
			if (!formData.title.trim()) {
				throw new Error("Title is required");
			}
			if (!formData.description.trim()) {
				throw new Error("Description is required");
			}
			if (!formData.githubUrl.trim()) {
				throw new Error("GitHub repository URL is required");
			}

			// Validate GitHub URL
			const githubValidation = GitHubHelpers.validateGitHubUrl(
				formData.githubUrl
			);
			if (!githubValidation.isValid) {
				throw new Error(githubValidation.error || "Invalid GitHub URL");
			}

			// Ensure we have a valid normalized URL
			if (!githubValidation.normalizedUrl) {
				throw new Error("Failed to normalize GitHub URL");
			}

			if (!formData.amount || parseFloat(formData.amount) <= 0) {
				throw new Error("Valid amount is required");
			}
			if (parseFloat(formData.amount) < 0.000001) {
				throw new Error("Amount must be at least 0.000001 ETH");
			}
			if (formData.type === "TIME_BASED" && !formData.expiry) {
				throw new Error(
					"Expiry date is required for time-based quests"
				);
			}

			// Step 1: Create escrow transaction
			setStep("blockchain");

			// Generate a temporary quest ID for the escrow
			const tempQuestId = `temp_${Date.now()}_${Math.random()
				.toString(36)
				.substr(2, 9)}`;

			await createEscrowQuest(tempQuestId, formData.amount);

			// The rest of the flow is handled by useEffect when transaction is confirmed
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to create quest"
			);
			setIsSubmitting(false);
			setStep("form");
		}
	};

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	if (!isConnected) {
		return (
			<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="text-center bg-white rounded-lg shadow-sm border border-gray-200 p-8">
					<AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<h2 className="text-2xl font-bold text-gray-900 mb-4">
						Connect Your Wallet
					</h2>
					<p className="text-gray-600">
						You need to connect your wallet to create a quest
					</p>
				</div>
			</div>
		);
	}

	// Show progress states
	if (isSubmitting || success) {
		return (
			<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="text-center bg-white rounded-lg shadow-sm border border-gray-200 p-8">
					{step === "blockchain" && (
						<>
							<Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" />
							<h2 className="text-2xl font-bold text-gray-900 mb-4">
								{isEscrowLoading
									? "Confirm Transaction in Wallet"
									: isConfirming
									? "Processing Transaction..."
									: "Preparing Transaction..."}
							</h2>
							<p className="text-gray-600 mb-4">
								{isEscrowLoading
									? "Please confirm the transaction in your wallet to deposit funds into escrow."
									: isConfirming
									? "Waiting for blockchain confirmation..."
									: "Setting up your quest escrow..."}
							</p>
							{transactionHash && (
								<p className="text-sm text-gray-500 font-mono break-all">
									Transaction: {transactionHash}
								</p>
							)}
						</>
					)}

					{step === "database" && (
						<>
							<Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
							<h2 className="text-2xl font-bold text-gray-900 mb-4">
								Saving Quest Details...
							</h2>
							<p className="text-gray-600 mb-4">
								Funds secured! Now saving your quest to the
								platform.
							</p>
						</>
					)}

					{step === "complete" && success && (
						<>
							<CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
							<h2 className="text-2xl font-bold text-gray-900 mb-4">
								Quest Created Successfully!
							</h2>
							<p className="text-gray-600 mb-4">
								Your quest has been created and funds are
								secured in escrow.
							</p>
							<p className="text-sm text-gray-500">
								Redirecting to your quest page...
							</p>
						</>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">
					Create New Quest
				</h1>
				<p className="text-gray-600">
					Set up a bounty for developers to complete and earn rewards
				</p>
			</div>

			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Title */}
					<div>
						<label
							htmlFor="title"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Quest Title *
						</label>
						<div className="relative">
							<FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
							<input
								type="text"
								id="title"
								name="title"
								value={formData.title}
								onChange={handleInputChange}
								placeholder="e.g., Build a DeFi Dashboard"
								className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								required
							/>
						</div>
					</div>

					{/* Description */}
					<div>
						<label
							htmlFor="description"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Description *
						</label>
						<textarea
							id="description"
							name="description"
							value={formData.description}
							onChange={handleInputChange}
							rows={4}
							placeholder="Describe what needs to be built, requirements, and acceptance criteria..."
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							required
						/>
					</div>

					{/* GitHub Repository URL */}
					<div>
						<label
							htmlFor="githubUrl"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							GitHub Repository URL *
						</label>
						<div className="relative">
							<svg
								className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fillRule="evenodd"
									d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
									clipRule="evenodd"
								/>
							</svg>
							<input
								type="url"
								id="githubUrl"
								name="githubUrl"
								value={formData.githubUrl}
								onChange={handleInputChange}
								placeholder="https://github.com/username/repository"
								className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								required
							/>
						</div>
						<p className="mt-1 text-sm text-gray-600">
							The GitHub repository where contributors will submit
							their work via pull requests.
						</p>
					</div>

					{/* Type */}
					<div>
						<label
							htmlFor="type"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Quest Type *
						</label>
						<select
							id="type"
							name="type"
							value={formData.type}
							onChange={handleInputChange}
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
						>
							<option value="REGULAR">
								Regular - Open until completed
							</option>
							<option value="TIME_BASED">
								Time-Based - First come, first served
							</option>
						</select>
					</div>

					{/* Expiry (conditional) */}
					{formData.type === "TIME_BASED" && (
						<div>
							<label
								htmlFor="expiry"
								className="block text-sm font-medium text-gray-700 mb-2"
							>
								Expiry Date *
							</label>
							<div className="relative">
								<Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
								<input
									type="datetime-local"
									id="expiry"
									name="expiry"
									value={formData.expiry}
									onChange={handleInputChange}
									min={new Date().toISOString().slice(0, 16)}
									className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
									required
								/>
							</div>
						</div>
					)}

					{/* Tags */}
					<div>
						<label
							htmlFor="tags"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Tags
						</label>
						<div className="relative">
							<Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
							<input
								type="text"
								id="tags"
								name="tags"
								value={formData.tags}
								onChange={handleInputChange}
								placeholder="frontend, defi, smart-contracts (comma-separated)"
								className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							/>
						</div>
						<p className="mt-1 text-sm text-gray-600">
							Separate tags with commas. These help users discover
							your quest.
						</p>
					</div>

					{/* Quest Amount */}
					<div>
						<label
							htmlFor="amount"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Quest Amount (ETH) *
						</label>
						<div className="relative">
							<DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
							<input
								type="number"
								id="amount"
								name="amount"
								value={formData.amount}
								onChange={handleInputChange}
								step="0.000001"
								min="0.000001"
								placeholder="0.001"
								className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								required
							/>
						</div>
						<p className="mt-1 text-sm text-gray-600">
							This amount will be deposited into escrow and
							released to the successful claimer.
						</p>
					</div>

					{/* Error Message */}
					{error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4">
							<div className="flex items-center">
								<AlertCircle className="w-5 h-5 text-red-500 mr-2" />
								<span className="text-red-700">{error}</span>
							</div>
						</div>
					)}

					{/* Submit Button */}
					<button
						type="submit"
						disabled={
							isSubmitting || isEscrowLoading || isConfirming
						}
						className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
					>
						{isSubmitting || isEscrowLoading || isConfirming ? (
							<div className="flex items-center justify-center">
								<Loader2 className="h-5 w-5 mr-2 animate-spin" />
								{step === "blockchain"
									? "Depositing Funds..."
									: "Creating Quest..."}
							</div>
						) : (
							"Create Quest & Deposit Funds"
						)}
					</button>
				</form>

				{/* Info Box */}
				<div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
					<div className="flex items-start">
						<AlertCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
						<div className="text-blue-700 text-sm">
							<p className="font-medium mb-1">
								Before creating your quest:
							</p>
							<ul className="list-disc list-inside space-y-1">
								<li>
									Make sure you have clear requirements and
									acceptance criteria
								</li>
								<li>
									Set a fair amount - funds will be held in
									escrow
								</li>
								<li>
									Your wallet will prompt you to deposit the
									funds on-chain
								</li>
								<li>
									Consider using time-based quests for urgent
									or competitive tasks
								</li>
								<li>
									Add relevant tags to help developers find
									your quest
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
