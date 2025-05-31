import React, { useState, useCallback, useEffect } from "react";
import { FilterOptions } from "../types";
import { Search, Filter, X, FileType, Calendar, HardDrive } from "lucide-react";

interface AdvancedFilterProps {
	filters: FilterOptions;
	onFiltersChange: (filters: FilterOptions) => void;
	totalFiles: number;
	filteredFiles: number;
}

const commonFileTypes = [
	{
		label: "Documents",
		extensions: [".pdf", ".doc", ".docx", ".txt", ".rtf"],
		color: "blue",
	},
	{
		label: "Images",
		extensions: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
		color: "green",
	},
	{
		label: "Audio",
		extensions: [".mp3", ".wav", ".flac", ".ogg", ".m4a"],
		color: "purple",
	},
	{
		label: "Video",
		extensions: [".mp4", ".avi", ".mkv", ".mov", ".wmv"],
		color: "red",
	},
	{
		label: "Archives",
		extensions: [".zip", ".rar", ".7z", ".tar", ".gz"],
		color: "orange",
	},
	{
		label: "Code",
		extensions: [".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".html", ".css"],
		color: "indigo",
	},
];

const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
	filters,
	onFiltersChange,
	totalFiles,
	filteredFiles,
}) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const [customExtension, setCustomExtension] = useState("");

	const handleSearchChange = useCallback(
		(value: string) => {
			onFiltersChange({
				...filters,
				searchTerm: value,
			});
		},
		[filters, onFiltersChange]
	);

	const handleFileTypeToggle = useCallback(
		(extensions: string[]) => {
			const currentTypes = new Set(filters.fileTypes);
			const allIncluded = extensions.every((ext) => currentTypes.has(ext));

			if (allIncluded) {
				// Remove all these extensions
				extensions.forEach((ext) => currentTypes.delete(ext));
			} else {
				// Add all these extensions
				extensions.forEach((ext) => currentTypes.add(ext));
			}

			onFiltersChange({
				...filters,
				fileTypes: Array.from(currentTypes),
			});
		},
		[filters, onFiltersChange]
	);

	const handleCustomExtensionAdd = useCallback(() => {
		if (customExtension.trim()) {
			const normalizedExt = customExtension.startsWith(".")
				? customExtension.toLowerCase().trim()
				: `.${customExtension.toLowerCase().trim()}`;

			const newTypes = [...filters.fileTypes];
			if (!newTypes.includes(normalizedExt)) {
				newTypes.push(normalizedExt);
				onFiltersChange({
					...filters,
					fileTypes: newTypes,
				});
			}
			setCustomExtension("");
		}
	}, [customExtension, filters, onFiltersChange]);

	const handleRemoveFileType = useCallback(
		(extension: string) => {
			onFiltersChange({
				...filters,
				fileTypes: filters.fileTypes.filter((type) => type !== extension),
			});
		},
		[filters, onFiltersChange]
	);

	const clearAllFilters = useCallback(() => {
		onFiltersChange({
			searchTerm: "",
			fileTypes: [],
			sizeRange: undefined,
			dateRange: undefined,
		});
	}, [onFiltersChange]);

	const hasActiveFilters =
		filters.searchTerm ||
		filters.fileTypes.length > 0 ||
		filters.sizeRange ||
		filters.dateRange;

	return (
		<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
			{/* Header */}
			<div className="px-4 py-3 border-b border-gray-200">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<Filter className="w-5 h-5 text-gray-500" />
						<h3 className="text-sm font-semibold text-gray-700">
							Advanced Filters
						</h3>
						{hasActiveFilters && (
							<span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
								{filteredFiles} of {totalFiles} files
							</span>
						)}
					</div>

					<div className="flex items-center space-x-2">
						{hasActiveFilters && (
							<button
								onClick={clearAllFilters}
								className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1"
							>
								<X className="w-3 h-3" />
								<span>Clear</span>
							</button>
						)}

						<button
							onClick={() => setIsExpanded(!isExpanded)}
							className="text-sm text-blue-600 hover:text-blue-800"
						>
							{isExpanded ? "Less" : "More"}
						</button>
					</div>
				</div>
			</div>

			{/* Search Bar */}
			<div className="p-4">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
					<input
						type="text"
						placeholder="Search files and folders..."
						value={filters.searchTerm}
						onChange={(e) => handleSearchChange(e.target.value)}
						className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>
			</div>

			{/* File Type Filters */}
			<div className="px-4 pb-4">
				<div className="flex items-center mb-3">
					<FileType className="w-4 h-4 text-gray-500 mr-2" />
					<span className="text-sm font-medium text-gray-700">File Types</span>
				</div>

				<div className="flex flex-wrap gap-2 mb-3">
					{commonFileTypes.map(({ label, extensions, color }) => {
						const isActive = extensions.some((ext) =>
							filters.fileTypes.includes(ext)
						);
						const colorClasses = {
							blue: isActive
								? "bg-blue-100 border-blue-300 text-blue-800"
								: "bg-gray-100 border-gray-300 text-gray-600",
							green: isActive
								? "bg-green-100 border-green-300 text-green-800"
								: "bg-gray-100 border-gray-300 text-gray-600",
							purple: isActive
								? "bg-purple-100 border-purple-300 text-purple-800"
								: "bg-gray-100 border-gray-300 text-gray-600",
							red: isActive
								? "bg-red-100 border-red-300 text-red-800"
								: "bg-gray-100 border-gray-300 text-gray-600",
							orange: isActive
								? "bg-orange-100 border-orange-300 text-orange-800"
								: "bg-gray-100 border-gray-300 text-gray-600",
							indigo: isActive
								? "bg-indigo-100 border-indigo-300 text-indigo-800"
								: "bg-gray-100 border-gray-300 text-gray-600",
						};

						return (
							<button
								key={label}
								onClick={() => handleFileTypeToggle(extensions)}
								className={`px-3 py-1.5 text-xs font-medium border rounded-full transition-colors ${
									colorClasses[color as keyof typeof colorClasses]
								}`}
							>
								{label}
							</button>
						);
					})}
				</div>

				{/* Custom extension input */}
				<div className="flex items-center space-x-2">
					<input
						type="text"
						placeholder="Custom extension (e.g., .xyz)"
						value={customExtension}
						onChange={(e) => setCustomExtension(e.target.value)}
						onKeyPress={(e) => e.key === "Enter" && handleCustomExtensionAdd()}
						className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
					/>
					<button
						onClick={handleCustomExtensionAdd}
						disabled={!customExtension.trim()}
						className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
					>
						Add
					</button>
				</div>

				{/* Active file type tags */}
				{filters.fileTypes.length > 0 && (
					<div className="mt-3 flex flex-wrap gap-1">
						{filters.fileTypes.map((type) => (
							<span
								key={type}
								className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
							>
								{type}
								<button
									onClick={() => handleRemoveFileType(type)}
									className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
								>
									<X className="w-3 h-3" />
								</button>
							</span>
						))}
					</div>
				)}
			</div>

			{/* Advanced Options */}
			{isExpanded && (
				<div className="px-4 pb-4 border-t border-gray-200 pt-4">
					{/* Size Filter */}
					<div className="mb-4">
						<div className="flex items-center mb-2">
							<HardDrive className="w-4 h-4 text-gray-500 mr-2" />
							<span className="text-sm font-medium text-gray-700">
								File Size
							</span>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<input
								type="number"
								placeholder="Min (KB)"
								className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
								onChange={(e) => {
									const min = e.target.value
										? parseInt(e.target.value) * 1024
										: 0;
									onFiltersChange({
										...filters,
										sizeRange: {
											min,
											max: filters.sizeRange?.max || Number.MAX_SAFE_INTEGER,
										},
									});
								}}
							/>
							<input
								type="number"
								placeholder="Max (KB)"
								className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
								onChange={(e) => {
									const max = e.target.value
										? parseInt(e.target.value) * 1024
										: Number.MAX_SAFE_INTEGER;
									onFiltersChange({
										...filters,
										sizeRange: {
											min: filters.sizeRange?.min || 0,
											max,
										},
									});
								}}
							/>
						</div>
					</div>

					{/* Date Filter */}
					<div>
						<div className="flex items-center mb-2">
							<Calendar className="w-4 h-4 text-gray-500 mr-2" />
							<span className="text-sm font-medium text-gray-700">
								Modified Date
							</span>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<input
								type="date"
								className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
								onChange={(e) => {
									const start = e.target.value
										? new Date(e.target.value)
										: new Date(0);
									onFiltersChange({
										...filters,
										dateRange: {
											start,
											end: filters.dateRange?.end || new Date(),
										},
									});
								}}
							/>
							<input
								type="date"
								className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
								onChange={(e) => {
									const end = e.target.value
										? new Date(e.target.value)
										: new Date();
									onFiltersChange({
										...filters,
										dateRange: {
											start: filters.dateRange?.start || new Date(0),
											end,
										},
									});
								}}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default AdvancedFilter;
