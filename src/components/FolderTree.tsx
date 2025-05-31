import React, { useState, useCallback } from "react";
import { FileNode, AppFile } from "../types";
import { formatFileSize } from "../services/fileService";
import {
	ChevronDown,
	ChevronRight,
	Folder,
	File,
	FileText,
	Image,
	Music,
	Video,
	Archive,
	Code,
} from "lucide-react";

interface FolderTreeProps {
	tree: FileNode[];
	onFileSelect?: (file: AppFile) => void;
	onNodeToggle?: (nodeId: string) => void;
	selectedFiles?: Set<string>;
	onSelectionChange?: (selectedFiles: Set<string>) => void;
}

const getFileIcon = (extension: string) => {
	const ext = extension.toLowerCase();

	if (
		[".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"].includes(ext)
	) {
		return <Image className="w-4 h-4 text-green-500" />;
	}
	if ([".mp3", ".wav", ".flac", ".ogg", ".m4a"].includes(ext)) {
		return <Music className="w-4 h-4 text-purple-500" />;
	}
	if ([".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv"].includes(ext)) {
		return <Video className="w-4 h-4 text-red-500" />;
	}
	if ([".zip", ".rar", ".7z", ".tar", ".gz"].includes(ext)) {
		return <Archive className="w-4 h-4 text-orange-500" />;
	}
	if (
		[
			".js",
			".ts",
			".jsx",
			".tsx",
			".py",
			".java",
			".cpp",
			".c",
			".html",
			".css",
		].includes(ext)
	) {
		return <Code className="w-4 h-4 text-blue-500" />;
	}

	return <FileText className="w-4 h-4 text-gray-500" />;
};

const TreeNode: React.FC<{
	node: FileNode;
	level: number;
	onFileSelect?: (file: AppFile) => void;
	onToggle?: (nodeId: string) => void;
	isSelected?: boolean;
	onSelectionChange?: (nodeId: string, selected: boolean) => void;
}> = ({
	node,
	level,
	onFileSelect,
	onToggle,
	isSelected,
	onSelectionChange,
}) => {
	const [isExpanded, setIsExpanded] = useState(node.isExpanded || false);

	const handleToggle = useCallback(() => {
		const newExpanded = !isExpanded;
		setIsExpanded(newExpanded);
		onToggle?.(node.id);
	}, [isExpanded, node.id, onToggle]);

	const handleFileClick = useCallback(() => {
		if (node.type === "file" && node.file) {
			onFileSelect?.(node.file);
		}
	}, [node, onFileSelect]);

	const handleCheckboxChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			e.stopPropagation();
			onSelectionChange?.(node.id, e.target.checked);
		},
		[node.id, onSelectionChange]
	);

	const paddingLeft = level * 20 + 8;

	return (
		<div className="select-none">
			<div
				className={`flex items-center py-1.5 px-2 hover:bg-slate-50 cursor-pointer group transition-colors
          ${isSelected ? "bg-blue-50 border-l-2 border-blue-500" : ""}
        `}
				style={{ paddingLeft: `${paddingLeft}px` }}
				onClick={node.type === "folder" ? handleToggle : handleFileClick}
			>
				{/* Checkbox for selection */}
				<input
					type="checkbox"
					checked={isSelected || false}
					onChange={handleCheckboxChange}
					className="mr-2 rounded text-blue-600 focus:ring-blue-500"
					onClick={(e) => e.stopPropagation()}
				/>

				{/* Folder chevron */}
				{node.type === "folder" && (
					<div className="mr-1 text-gray-400">
						{isExpanded ? (
							<ChevronDown className="w-4 h-4" />
						) : (
							<ChevronRight className="w-4 h-4" />
						)}
					</div>
				)}

				{/* Icon */}
				<div className="mr-2 flex-shrink-0">
					{node.type === "folder" ? (
						<Folder className="w-4 h-4 text-blue-500" />
					) : (
						getFileIcon(node.extension || "")
					)}
				</div>

				{/* Name and details */}
				<div className="flex-1 min-w-0 flex items-center justify-between">
					<span className="text-sm text-gray-700 truncate font-medium">
						{node.name}
					</span>

					{node.type === "file" && node.size !== undefined && (
						<span className="text-xs text-gray-500 ml-2 flex-shrink-0">
							{formatFileSize(node.size)}
						</span>
					)}
				</div>
			</div>

			{/* Children */}
			{node.type === "folder" && isExpanded && node.children && (
				<div>
					{node.children.map((child) => (
						<TreeNode
							key={child.id}
							node={child}
							level={level + 1}
							onFileSelect={onFileSelect}
							onToggle={onToggle}
							isSelected={isSelected}
							onSelectionChange={onSelectionChange}
						/>
					))}
				</div>
			)}
		</div>
	);
};

const FolderTree: React.FC<FolderTreeProps> = ({
	tree,
	onFileSelect,
	onNodeToggle,
	selectedFiles = new Set(),
	onSelectionChange,
}) => {
	const handleSelectionChange = useCallback(
		(nodeId: string, selected: boolean) => {
			const newSelectedFiles = new Set(selectedFiles);

			if (selected) {
				newSelectedFiles.add(nodeId);
			} else {
				newSelectedFiles.delete(nodeId);
			}

			onSelectionChange?.(newSelectedFiles);
		},
		[selectedFiles, onSelectionChange]
	);

	if (tree.length === 0) {
		return (
			<div className="text-center py-8 text-gray-500">
				<Folder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
				<p>No folder structure to display</p>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
			<div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
				<h3 className="text-sm font-semibold text-gray-700 flex items-center">
					<Folder className="w-4 h-4 mr-2" />
					Folder Structure
				</h3>
			</div>

			<div className="max-h-96 overflow-y-auto">
				{tree.map((node) => (
					<TreeNode
						key={node.id}
						node={node}
						level={0}
						onFileSelect={onFileSelect}
						onToggle={onNodeToggle}
						isSelected={selectedFiles.has(node.id)}
						onSelectionChange={handleSelectionChange}
					/>
				))}
			</div>
		</div>
	);
};

export default FolderTree;
