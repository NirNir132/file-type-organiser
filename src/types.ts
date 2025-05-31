// This declares JSZip for use with the CDN version
// Fix: Declare JSZip in the global scope so it's recognized globally.
declare global {
	var JSZip: any;
}

// If more complex types are needed, they can be defined here.
// For now, standard File objects and simple types are sufficient.

export interface AppFile extends File {
	// Add relative path information for tree visualization
	relativePath?: string;
	path?: string;
}

export interface FileNode {
	id: string;
	name: string;
	type: "file" | "folder";
	path: string;
	relativePath: string;
	file?: AppFile;
	children?: FileNode[];
	size?: number;
	lastModified?: number;
	extension?: string;
	isExpanded?: boolean;
}

export interface FilterOptions {
	searchTerm: string;
	fileTypes: string[];
	sizeRange?: {
		min: number;
		max: number;
	};
	dateRange?: {
		start: Date;
		end: Date;
	};
}

export interface FolderStats {
	totalFiles: number;
	totalFolders: number;
	totalSize: number;
	fileTypeStats: Record<string, number>;
}
