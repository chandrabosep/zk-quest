"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";

interface QuestFiltersProps {
	onFiltersChange: (filters: {
		search: string;
		status: string;
		type: string;
		tags: string[];
	}) => void;
	popularTags?: string[];
}

export default function QuestFilters({
	onFiltersChange,
	popularTags = [],
}: QuestFiltersProps) {
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("");
	const [type, setType] = useState("");
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [showFilters, setShowFilters] = useState(false);

	const updateFilters = (
		newFilters: Partial<{
			search: string;
			status: string;
			type: string;
			tags: string[];
		}>
	) => {
		const filters = {
			search: newFilters.search ?? search,
			status: newFilters.status ?? status,
			type: newFilters.type ?? type,
			tags: newFilters.tags ?? selectedTags,
		};

		onFiltersChange(filters);
	};

	const handleSearchChange = (value: string) => {
		setSearch(value);
		updateFilters({ search: value });
	};

	const handleStatusChange = (value: string) => {
		setStatus(value);
		updateFilters({ status: value });
	};

	const handleTypeChange = (value: string) => {
		setType(value);
		updateFilters({ type: value });
	};

	const handleTagToggle = (tag: string) => {
		const newTags = selectedTags.includes(tag)
			? selectedTags.filter((t) => t !== tag)
			: [...selectedTags, tag];

		setSelectedTags(newTags);
		updateFilters({ tags: newTags });
	};

	const clearFilters = () => {
		setSearch("");
		setStatus("");
		setType("");
		setSelectedTags([]);
		updateFilters({ search: "", status: "", type: "", tags: [] });
	};

	const hasActiveFilters =
		search || status || type || selectedTags.length > 0;

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
			{/* Search Bar */}
			<div className="relative mb-4">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
				<input
					type="text"
					placeholder="Search quests..."
					value={search}
					onChange={(e) => handleSearchChange(e.target.value)}
					className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
				/>
			</div>

			{/* Filter Toggle */}
			<div className="flex items-center justify-between mb-4">
				<button
					onClick={() => setShowFilters(!showFilters)}
					className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
				>
					<Filter className="w-4 h-4" />
					<span>Filters</span>
				</button>

				{hasActiveFilters && (
					<button
						onClick={clearFilters}
						className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm"
					>
						<X className="w-4 h-4" />
						<span>Clear all</span>
					</button>
				)}
			</div>

			{/* Filters */}
			{showFilters && (
				<div className="space-y-4 border-t pt-4">
					{/* Status Filter */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Status
						</label>
						<select
							value={status}
							onChange={(e) => handleStatusChange(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
						>
							<option value="">All statuses</option>
							<option value="OPEN">Open</option>
							<option value="COMPLETED">Completed</option>
							<option value="EXPIRED">Expired</option>
						</select>
					</div>

					{/* Type Filter */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Type
						</label>
						<select
							value={type}
							onChange={(e) => handleTypeChange(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
						>
							<option value="">All types</option>
							<option value="REGULAR">Regular</option>
							<option value="TIME_BASED">Time-Based</option>
						</select>
					</div>

					{/* Tags Filter */}
					{popularTags.length > 0 && (
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Tags
							</label>
							<div className="flex flex-wrap gap-2">
								{popularTags.map((tag) => (
									<button
										key={tag}
										onClick={() => handleTagToggle(tag)}
										className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
											selectedTags.includes(tag)
												? "bg-purple-100 text-purple-800 border border-purple-300"
												: "bg-gray-100 text-gray-700 hover:bg-gray-200"
										}`}
									>
										{tag}
									</button>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Active Filters Display */}
			{hasActiveFilters && (
				<div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
					{search && (
						<span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
							Search: "{search}"
						</span>
					)}
					{status && (
						<span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
							Status: {status}
						</span>
					)}
					{type && (
						<span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
							Type: {type}
						</span>
					)}
					{selectedTags.map((tag) => (
						<span
							key={tag}
							className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800"
						>
							{tag}
							<button
								onClick={() => handleTagToggle(tag)}
								className="ml-1 hover:text-purple-600"
							>
								<X className="w-3 h-3" />
							</button>
						</span>
					))}
				</div>
			)}
		</div>
	);
}
