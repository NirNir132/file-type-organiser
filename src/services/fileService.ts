// Ensures JSZip declaration is acknowledged // This line is removed

import { FileNode, AppFile, FilterOptions, FolderStats } from "../types";

// Helper function to promisify FileSystemFileEntry.file()
const getFileFromFileEntry = (
	fileEntry: FileSystemFileEntry
): Promise<File> => {
	return new Promise((resolve, reject) => {
		fileEntry.file(resolve, reject);
	});
};

// Enhanced file entry with path information
interface FileEntryWithPath {
	file: File;
	relativePath: string;
}

// Recursively reads all files from a directory entry with path information
const getFilesInDirectory = async (
	directoryEntry: FileSystemDirectoryEntry,
	relativePath: string = ""
): Promise<FileEntryWithPath[]> => {
	const reader = directoryEntry.createReader();
	let entries: FileSystemEntry[] = [];

	const readBatch = (): Promise<FileSystemEntry[]> => {
		return new Promise((resolve, reject) => {
			reader.readEntries(resolve, reject);
		});
	};

	let currentBatch = await readBatch();
	while (currentBatch.length > 0) {
		entries = entries.concat(currentBatch);
		currentBatch = await readBatch();
	}

	const files: FileEntryWithPath[] = [];
	for (const entry of entries) {
		const currentPath = relativePath
			? `${relativePath}/${entry.name}`
			: entry.name;

		if (entry.isFile) {
			try {
				const file = await getFileFromFileEntry(entry as FileSystemFileEntry);
				files.push({ file, relativePath: currentPath });
			} catch (error) {
				console.error("Error reading file:", entry.name, error);
			}
		} else if (entry.isDirectory) {
			try {
				const subFiles = await getFilesInDirectory(
					entry as FileSystemDirectoryEntry,
					currentPath
				);
				files.push(...subFiles);
			} catch (error) {
				console.error("Error reading subdirectory:", entry.name, error);
			}
		}
	}
	return files;
};

export const processDroppedItems = async (
	items: DataTransferItemList
): Promise<AppFile[]> => {
	const fileEntries: FileEntryWithPath[] = [];
	const promises: Promise<void>[] = [];

	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		const entry = item.webkitGetAsEntry();

		if (entry) {
			if (entry.isFile) {
				promises.push(
					getFileFromFileEntry(entry as FileSystemFileEntry)
						.then((file) => {
							fileEntries.push({ file, relativePath: file.name });
						})
						.catch((error) =>
							console.error("Error processing dropped file:", entry.name, error)
						)
				);
			} else if (entry.isDirectory) {
				promises.push(
					getFilesInDirectory(entry as FileSystemDirectoryEntry, entry.name)
						.then((dirFiles) => {
							fileEntries.push(...dirFiles);
						})
						.catch((error) =>
							console.error(
								"Error processing dropped directory:",
								entry.name,
								error
							)
						)
				);
			}
		}
	}

	await Promise.all(promises);

	// Convert to AppFile with path information
	return fileEntries.map(({ file, relativePath }) => {
		const appFile = file as AppFile;
		appFile.relativePath = relativePath;
		appFile.path = relativePath;
		return appFile;
	});
};

export const buildFileTree = (files: AppFile[]): FileNode[] => {
	const tree: FileNode[] = [];
	const nodeMap = new Map<string, FileNode>();

	// Create root node for all files
	files.forEach((file) => {
		const pathParts = file.relativePath?.split("/") || [file.name];
		let currentPath = "";

		pathParts.forEach((part, index) => {
			const isFile = index === pathParts.length - 1;
			const parentPath = currentPath;
			currentPath = currentPath ? `${currentPath}/${part}` : part;

			if (!nodeMap.has(currentPath)) {
				const node: FileNode = {
					id: currentPath,
					name: part,
					type: isFile ? "file" : "folder",
					path: currentPath,
					relativePath: currentPath,
					children: isFile ? undefined : [],
					file: isFile ? file : undefined,
					size: isFile ? file.size : undefined,
					lastModified: isFile ? file.lastModified : undefined,
					extension: isFile ? getFileExtension(file.name) : undefined,
					isExpanded: false,
				};

				nodeMap.set(currentPath, node);

				if (parentPath) {
					const parent = nodeMap.get(parentPath);
					if (parent && parent.children) {
						parent.children.push(node);
					}
				} else {
					tree.push(node);
				}
			}
		});
	});

	return tree;
};

export const getFileExtension = (filename: string): string => {
	const parts = filename.split(".");
	return parts.length > 1 ? `.${parts.pop()?.toLowerCase()}` : "";
};

export const searchFiles = (
	files: AppFile[],
	searchTerm: string
): AppFile[] => {
	if (!searchTerm.trim()) return files;

	const term = searchTerm.toLowerCase();
	return files.filter((file) => {
		// Search in filename
		if (file.name.toLowerCase().includes(term)) return true;
		if (file.relativePath?.toLowerCase().includes(term)) return true;

		// TODO: Implement content search for text files when searchInContent is true
		// This would require reading file contents, which can be resource intensive

		return false;
	});
};

export function filterFiles(
	files: AppFile[],
	{ searchTerm, fileTypes, sizeRange, dateRange }: FilterOptions
): AppFile[] {
	let filtered = files;

	// Search filter
	if (searchTerm) {
		filtered = searchFiles(filtered, searchTerm);
	}

	// File type filter
	if (fileTypes.length > 0) {
		filtered = filtered.filter((file) => {
			const extension = getFileExtension(file.name);
			return fileTypes.some((type) => extension === normalizeExtension(type));
		});
	}

	// Size filter
	if (sizeRange) {
		filtered = filtered.filter(
			(file) => file.size >= sizeRange.min && file.size <= sizeRange.max
		);
	}

	// Date filter
	if (dateRange) {
		filtered = filtered.filter(
			(file) =>
				file.lastModified >= dateRange.start.getTime() &&
				file.lastModified <= dateRange.end.getTime()
		);
	}

	return filtered;
}

export const getFolderStats = (files: AppFile[]): FolderStats => {
	const fileTypeStats: Record<string, number> = {};
	let totalSize = 0;
	const uniqueFolders = new Set<string>();

	files.forEach((file) => {
		totalSize += file.size;

		const extension = getFileExtension(file.name) || "No extension";
		fileTypeStats[extension] = (fileTypeStats[extension] || 0) + 1;

		// Count unique folder paths
		const pathParts = file.relativePath?.split("/") || [];
		for (let i = 0; i < pathParts.length - 1; i++) {
			const folderPath = pathParts.slice(0, i + 1).join("/");
			uniqueFolders.add(folderPath);
		}
	});

	return {
		totalFiles: files.length,
		totalFolders: uniqueFolders.size,
		totalSize,
		fileTypeStats,
	};
};

export const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const createZipFromFiles = async (
	filesToZip: AppFile[]
): Promise<Blob> => {
	if (typeof JSZip === "undefined") {
		throw new Error(
			"JSZip library is not loaded. Please ensure it is included in your HTML."
		);
	}
	const zip = new JSZip();

	filesToZip.forEach((file) => {
		// Use relative path to maintain folder structure in ZIP
		const path = file.relativePath || file.name;
		zip.file(path, file);
	});

	return zip.generateAsync({ type: "blob" });
};

export const normalizeExtension = (ext: string): string => {
	if (!ext) return "";
	return ext.startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
};
