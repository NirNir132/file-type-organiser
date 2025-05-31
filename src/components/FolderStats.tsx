import React from "react";
import { FolderStats as FolderStatsType } from "../types";
import { formatFileSize } from "../services/fileService";
import { BarChart3, FileText, Folder, HardDrive } from "lucide-react";

interface FolderStatsProps {
	stats: FolderStatsType;
}

const FolderStats: React.FC<FolderStatsProps> = ({ stats }) => {
	const topFileTypes = Object.entries(stats.fileTypeStats)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 6);

	const getColorForIndex = (index: number) => {
		const colors = [
			"bg-blue-500",
			"bg-green-500",
			"bg-purple-500",
			"bg-red-500",
			"bg-orange-500",
			"bg-indigo-500",
		];
		return colors[index % colors.length];
	};

	return (
		<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
			<div className="px-4 py-3 border-b border-gray-200">
				<h3 className="text-sm font-semibold text-gray-700 flex items-center">
					<BarChart3 className="w-4 h-4 mr-2" />
					Folder Statistics
				</h3>
			</div>

			<div className="p-4">
				{/* Summary Cards */}
				<div className="grid grid-cols-3 gap-4 mb-6">
					<div className="text-center p-3 bg-blue-50 rounded-lg">
						<FileText className="w-6 h-6 text-blue-600 mx-auto mb-1" />
						<div className="text-lg font-bold text-blue-900">
							{stats.totalFiles.toLocaleString()}
						</div>
						<div className="text-xs text-blue-600">Files</div>
					</div>

					<div className="text-center p-3 bg-green-50 rounded-lg">
						<Folder className="w-6 h-6 text-green-600 mx-auto mb-1" />
						<div className="text-lg font-bold text-green-900">
							{stats.totalFolders.toLocaleString()}
						</div>
						<div className="text-xs text-green-600">Folders</div>
					</div>

					<div className="text-center p-3 bg-purple-50 rounded-lg">
						<HardDrive className="w-6 h-6 text-purple-600 mx-auto mb-1" />
						<div className="text-lg font-bold text-purple-900">
							{formatFileSize(stats.totalSize)}
						</div>
						<div className="text-xs text-purple-600">Total Size</div>
					</div>
				</div>

				{/* File Type Distribution */}
				<div>
					<h4 className="text-sm font-medium text-gray-700 mb-3">
						File Type Distribution
					</h4>

					{topFileTypes.length > 0 ? (
						<div className="space-y-2">
							{topFileTypes.map(([extension, count], index) => {
								const percentage = (count / stats.totalFiles) * 100;
								return (
									<div key={extension} className="flex items-center space-x-3">
										<div className="w-16 text-xs text-gray-600 font-mono">
											{extension}
										</div>
										<div className="flex-1 bg-gray-200 rounded-full h-2">
											<div
												className={`h-2 rounded-full ${getColorForIndex(
													index
												)}`}
												style={{ width: `${Math.max(percentage, 2)}%` }}
											/>
										</div>
										<div className="w-12 text-xs text-gray-600 text-right">
											{count}
										</div>
										<div className="w-12 text-xs text-gray-500 text-right">
											{percentage.toFixed(1)}%
										</div>
									</div>
								);
							})}

							{Object.keys(stats.fileTypeStats).length > 6 && (
								<div className="text-xs text-gray-500 mt-2">
									+ {Object.keys(stats.fileTypeStats).length - 6} more file
									types
								</div>
							)}
						</div>
					) : (
						<div className="text-center py-4 text-gray-500">
							<FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
							<p className="text-sm">No files found</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default FolderStats;
