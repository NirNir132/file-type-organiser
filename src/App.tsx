import React, { useState, useCallback, useEffect, useMemo } from "react";
import DropZone from "./components/DropZone";
import FolderTree from "./components/FolderTree";
import AdvancedFilter from "./components/AdvancedFilter";
import FolderStats from "./components/FolderStats";
import FileList from "./components/FileList";
import FileConverter from "./components/FileConverter";
import DocumentIntelligence from "./components/DocumentIntelligence";
import {
	createZipFromFiles,
	buildFileTree,
	filterFiles,
	getFolderStats,
} from "./services/fileService";
import { AppFile, FileNode, FilterOptions } from "./types";
import SpinnerIcon from "./components/icons/SpinnerIcon";
import {
	AlertTriangle,
	Download,
	Layout,
	List,
	FolderOpen,
	RefreshCw,
	FileText,
} from "lucide-react";

type AppMode = "organizer" | "converter" | "intelligence";

const App: React.FC = () => {
	const [currentMode, setCurrentMode] = useState<AppMode>("organizer");
	const [allScannedFiles, setAllScannedFiles] = useState<AppFile[]>([]);
	const [filteredFiles, setFilteredFiles] = useState<AppFile[]>([]);
	const [fileTree, setFileTree] = useState<FileNode[]>([]);
	const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

	const [filters, setFilters] = useState<FilterOptions>({
		searchTerm: "",
		fileTypes: [],
	});

	// UI State
	const [viewMode, setViewMode] = useState<"tree" | "list">("tree");
	const [isLoadingInitialScan, setIsLoadingInitialScan] =
		useState<boolean>(false);
	const [isZipping, setIsZipping] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	// Memoized calculations
	const folderStats = useMemo(() => {
		return allScannedFiles.length > 0
			? getFolderStats(allScannedFiles)
			: {
					totalFiles: 0,
					totalFolders: 0,
					totalSize: 0,
					fileTypeStats: {},
			  };
	}, [allScannedFiles]);

	const handleFilesScanned = useCallback((files: AppFile[]) => {
		setAllScannedFiles(files);
		setFilteredFiles(files);
		setFileTree(buildFileTree(files));
		setSelectedFiles(new Set());
		setError(null);
	}, []);

	const handleSetAppLoading = useCallback((isLoading: boolean) => {
		setIsLoadingInitialScan(isLoading);
	}, []);

	const handleSetAppError = useCallback((appError: string | null) => {
		setError(appError);
	}, []);

	// Filter files whenever filters change
	useEffect(() => {
		if (allScannedFiles.length > 0) {
			const filtered = filterFiles(allScannedFiles, filters);
			setFilteredFiles(filtered);

			// Update tree with filtered files
			setFileTree(buildFileTree(filtered));
		}
	}, [allScannedFiles, filters]);

	const handleFiltersChange = useCallback((newFilters: FilterOptions) => {
		setFilters(newFilters);
	}, []);

	const handleFileSelect = useCallback((file: AppFile) => {
		// Handle individual file selection (could be used for preview)
		console.log("Selected file:", file.name);
	}, []);

	const handleSelectionChange = useCallback((newSelectedFiles: Set<string>) => {
		setSelectedFiles(newSelectedFiles);
	}, []);

	const getSelectedFilesForDownload = useCallback((): AppFile[] => {
		if (selectedFiles.size === 0) {
			return filteredFiles;
		}

		// Get actual files from selected node IDs
		const selectedFileObjects: AppFile[] = [];

		const collectFiles = (nodes: FileNode[]) => {
			nodes.forEach((node) => {
				if (selectedFiles.has(node.id)) {
					if (node.type === "file" && node.file) {
						selectedFileObjects.push(node.file);
					} else if (node.type === "folder" && node.children) {
						// If folder is selected, include all its files
						const collectAllFiles = (children: FileNode[]) => {
							children.forEach((child) => {
								if (child.type === "file" && child.file) {
									selectedFileObjects.push(child.file);
								} else if (child.children) {
									collectAllFiles(child.children);
								}
							});
						};
						collectAllFiles(node.children);
					}
				}

				if (node.children) {
					collectFiles(node.children);
				}
			});
		};

		collectFiles(fileTree);
		return selectedFileObjects;
	}, [selectedFiles, filteredFiles, fileTree]);

	const handleDownloadZip = useCallback(async () => {
		const filesToDownload = getSelectedFilesForDownload();

		if (filesToDownload.length === 0) {
			setError("No files to download.");
			return;
		}

		setIsZipping(true);
		setError(null);

		try {
			const zipBlob = await createZipFromFiles(filesToDownload);
			const link = document.createElement("a");
			link.href = URL.createObjectURL(zipBlob);
			link.download = "selected_files.zip";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(link.href);
		} catch (err) {
			console.error("Error creating ZIP:", err);
			setError(
				err instanceof Error
					? err.message
					: "Failed to create ZIP file. Check console for details."
			);
		} finally {
			setIsZipping(false);
		}
	}, [getSelectedFilesForDownload]);

	const clearSelection = useCallback(() => {
		setSelectedFiles(new Set());
	}, []);

	return (
		<div className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				{/* Header with Navigation */}
				<header className="mb-8 text-center">
					<h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-700 mb-3">
						{currentMode === "organizer"
							? "Advanced Folder Visualizer"
							: currentMode === "converter"
							? "File Format Converter"
							: "Document Intelligence"}
					</h1>
					<p className="text-lg text-slate-700/90 max-w-3xl mx-auto mb-6">
						{currentMode === "organizer"
							? "Drag & drop folders to visualize their structure, search files, apply advanced filters, and download organized collections. All processing happens locally in your browser."
							: currentMode === "converter"
							? "Convert between different file formats quickly and securely. All conversions happen locally in your browser - no uploads to servers."
							: "Extract insights from complex documents with advanced AI-powered document processing. Analyze layouts, extract tables, and transform documents into structured data."}
					</p>

					{/* Navigation Tabs */}
					<div className="flex justify-center">
						<div className="bg-white/80 backdrop-blur-sm rounded-xl p-2 border border-slate-200/50 shadow-lg">
							<div className="flex space-x-2">
								<button
									onClick={() => setCurrentMode("organizer")}
									className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
										currentMode === "organizer"
											? "bg-blue-600 text-white shadow-md"
											: "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
									}`}
								>
									<FolderOpen className="w-4 h-4" />
									<span>File Organizer</span>
								</button>
								<button
									onClick={() => setCurrentMode("converter")}
									className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
										currentMode === "converter"
											? "bg-blue-600 text-white shadow-md"
											: "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
									}`}
								>
									<RefreshCw className="w-4 h-4" />
									<span>File Converter</span>
								</button>
								<button
									onClick={() => setCurrentMode("intelligence")}
									className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
										currentMode === "intelligence"
											? "bg-blue-600 text-white shadow-md"
											: "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
									}`}
								>
									<FileText className="w-4 h-4" />
									<span>Document Intelligence</span>
								</button>
							</div>
						</div>
					</div>
				</header>

				{/* Error Display */}
				{error && (
					<div className="mb-6 p-4 text-sm text-red-800 bg-red-100/90 backdrop-blur-sm rounded-xl border border-red-300/80 shadow-lg flex items-start space-x-3 max-w-4xl mx-auto">
						<AlertTriangle
							className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
							strokeWidth={2.5}
						/>
						<div>
							<span className="font-semibold block text-base">Error:</span>
							<p className="text-sm">{error}</p>
						</div>
					</div>
				)}

				{/* Document Intelligence Mode */}
				{currentMode === "intelligence" && (
					<div className="max-w-4xl mx-auto">
						{/* Beta Notification Banner */}
						<div className="mb-6 p-4 text-sm text-blue-800 bg-blue-50/90 backdrop-blur-sm rounded-xl border border-blue-300/80 shadow-lg flex items-start space-x-3">
							<AlertTriangle
								className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
								strokeWidth={2.5}
							/>
							<div>
								<span className="font-semibold block text-base">
									New Feature
								</span>
								<p className="text-sm">
									Document Intelligence is powered by Docling, an open-source
									document processing toolkit that helps extract structured data
									from complex documents. All processing happens locally in your
									browser.
								</p>
							</div>
						</div>

						<DocumentIntelligence />
					</div>
				)}

				{/* File Converter Mode */}
				{currentMode === "converter" && (
					<div className="max-w-4xl mx-auto">
						{/* Beta Notification Banner */}
						<div className="mb-6 p-4 text-sm text-amber-800 bg-amber-50/90 backdrop-blur-sm rounded-xl border border-amber-300/80 shadow-lg flex items-start space-x-3">
							<AlertTriangle
								className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5"
								strokeWidth={2.5}
							/>
							<div>
								<span className="font-semibold block text-base">
									Beta Feature
								</span>
								<p className="text-sm">
									The File Converter is currently in beta and under active
									development. Some features may not work as expected. We're
									working hard to improve the experience!
								</p>
							</div>
						</div>

						<FileConverter />
					</div>
				)}

				{/* File Organizer Mode */}
				{currentMode === "organizer" && (
					<>
						{/* Drop Zone */}
						<div className="max-w-2xl mx-auto mb-8">
							<DropZone
								onFilesScanned={handleFilesScanned}
								setAppIsLoading={handleSetAppLoading}
								setAppError={handleSetAppError}
							/>
						</div>

						{/* Loading State */}
						{isLoadingInitialScan && (
							<div className="flex flex-col items-center justify-center p-10 bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl max-w-2xl mx-auto mb-8">
								<SpinnerIcon className="w-12 h-12 text-sky-600 mb-5" />
								<p className="text-slate-700 text-lg font-semibold">
									Scanning Folder Contents...
								</p>
								<p className="text-slate-500/90 text-sm">
									Building folder structure and analyzing files...
								</p>
							</div>
						)}

						{/* Main Content */}
						{!isLoadingInitialScan && allScannedFiles.length > 0 && (
							<div className="space-y-6">
								{/* Controls Bar */}
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
									<div className="flex items-center space-x-4">
										{/* View Mode Toggle */}
										<div className="flex items-center space-x-2">
											<span className="text-sm font-medium text-gray-700">
												View:
											</span>
											<div className="flex bg-gray-100 rounded-lg p-1">
												<button
													onClick={() => setViewMode("tree")}
													className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
														viewMode === "tree"
															? "bg-white text-gray-900 shadow-sm"
															: "text-gray-600 hover:text-gray-900"
													}`}
												>
													<Layout className="w-4 h-4 inline mr-1" />
													Tree
												</button>
												<button
													onClick={() => setViewMode("list")}
													className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
														viewMode === "list"
															? "bg-white text-gray-900 shadow-sm"
															: "text-gray-600 hover:text-gray-900"
													}`}
												>
													<List className="w-4 h-4 inline mr-1" />
													List
												</button>
											</div>
										</div>
									</div>

									{/* Download Controls */}
									<div className="flex items-center space-x-3">
										{selectedFiles.size > 0 && (
											<>
												<span className="text-sm text-gray-600">
													{selectedFiles.size} selected
												</span>
												<button
													onClick={clearSelection}
													className="text-sm text-gray-500 hover:text-gray-700"
												>
													Clear
												</button>
											</>
										)}

										<button
											onClick={handleDownloadZip}
											disabled={filteredFiles.length === 0 || isZipping}
											className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
										>
											{isZipping ? (
												<SpinnerIcon className="w-4 h-4" />
											) : (
												<Download className="w-4 h-4" />
											)}
											<span>
												{isZipping
													? "Creating ZIP..."
													: `Download Selected Files`}
											</span>
										</button>
									</div>
								</div>

								{/* Main Layout */}
								<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
									{/* Left Sidebar - Filters and Stats */}
									<div className="lg:col-span-1 space-y-6">
										<AdvancedFilter
											filters={filters}
											onFiltersChange={handleFiltersChange}
											totalFiles={allScannedFiles.length}
											filteredFiles={filteredFiles.length}
										/>

										<FolderStats stats={folderStats} />
									</div>

									{/* Main Content Area */}
									<div className="lg:col-span-3">
										{viewMode === "tree" ? (
											<FolderTree
												tree={fileTree}
												onFileSelect={handleFileSelect}
												selectedFiles={selectedFiles}
												onSelectionChange={handleSelectionChange}
											/>
										) : (
											<FileList
												files={filteredFiles}
												onDownloadZip={handleDownloadZip}
												isZipping={isZipping}
												targetExtension={
													filters.fileTypes.join(", ") || "filtered"
												}
											/>
										)}
									</div>
								</div>
							</div>
						)}

						{/* File Type Encyclopedia Section - Only show when no files are loaded */}
						{!isLoadingInitialScan && allScannedFiles.length === 0 && (
							<section className="mt-16 w-full max-w-4xl mx-auto">
								<div className="bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl p-8 border border-slate-200/50">
									<div className="text-center mb-8">
										<h2 className="text-3xl font-bold text-slate-800 mb-3">
											📁 File Type Encyclopedia
										</h2>
										<p className="text-slate-600 max-w-2xl mx-auto">
											Discover detailed information about file formats, their
											uses, and best practices. Your complete reference guide to
											digital file types.
										</p>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
										<a
											href="/docling-document-intelligence.html"
											className="group bg-blue-50 hover:bg-blue-100 p-6 rounded-xl border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg"
										>
											<div className="flex items-center mb-3">
												<div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
													<span className="text-xl">🧠</span>
												</div>
												<h3 className="ml-3 font-semibold text-slate-800 group-hover:text-blue-900">
													NEW: Document Intelligence
												</h3>
											</div>
											<p className="text-sm text-slate-600 group-hover:text-blue-700">
												Transform complex documents into structured data with
												AI-powered document processing
											</p>
										</a>

										<a
											href="/file-types-documents.html"
											className="group bg-slate-50 hover:bg-blue-50 p-6 rounded-xl border border-slate-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg"
										>
											<div className="flex items-center mb-3">
												<div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
													<span className="text-xl">📄</span>
												</div>
												<h3 className="ml-3 font-semibold text-slate-800 group-hover:text-blue-900">
													Document Files
												</h3>
											</div>
											<p className="text-sm text-slate-600 group-hover:text-blue-700">
												PDF, DOC, DOCX, TXT, RTF, and other document formats
											</p>
										</a>

										<a
											href="/file-types-images.html"
											className="group bg-slate-50 hover:bg-green-50 p-6 rounded-xl border border-slate-200 hover:border-green-300 transition-all duration-300 hover:shadow-lg"
										>
											<div className="flex items-center mb-3">
												<div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
													<span className="text-xl">🖼️</span>
												</div>
												<h3 className="ml-3 font-semibold text-slate-800 group-hover:text-green-900">
													Image Files
												</h3>
											</div>
											<p className="text-sm text-slate-600 group-hover:text-green-700">
												JPG, PNG, GIF, SVG, WebP, and other image formats
											</p>
										</a>

										<a
											href="/file-types-audio.html"
											className="group bg-slate-50 hover:bg-purple-50 p-6 rounded-xl border border-slate-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg"
										>
											<div className="flex items-center mb-3">
												<div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
													<span className="text-xl">🎵</span>
												</div>
												<h3 className="ml-3 font-semibold text-slate-800 group-hover:text-purple-900">
													Audio Files
												</h3>
											</div>
											<p className="text-sm text-slate-600 group-hover:text-purple-700">
												MP3, WAV, FLAC, OGG, M4A, and other audio formats
											</p>
										</a>

										<a
											href="/file-types-video.html"
											className="group bg-slate-50 hover:bg-red-50 p-6 rounded-xl border border-slate-200 hover:border-red-300 transition-all duration-300 hover:shadow-lg"
										>
											<div className="flex items-center mb-3">
												<div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
													<span className="text-xl">🎬</span>
												</div>
												<h3 className="ml-3 font-semibold text-slate-800 group-hover:text-red-900">
													Video Files
												</h3>
											</div>
											<p className="text-sm text-slate-600 group-hover:text-red-700">
												MP4, AVI, MKV, MOV, WebM, and other video formats
											</p>
										</a>

										<a
											href="/file-types-archives.html"
											className="group bg-slate-50 hover:bg-orange-50 p-6 rounded-xl border border-slate-200 hover:border-orange-300 transition-all duration-300 hover:shadow-lg"
										>
											<div className="flex items-center mb-3">
												<div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
													<span className="text-xl">📦</span>
												</div>
												<h3 className="ml-3 font-semibold text-slate-800 group-hover:text-orange-900">
													Archive Files
												</h3>
											</div>
											<p className="text-sm text-slate-600 group-hover:text-orange-700">
												ZIP, RAR, 7Z, TAR, GZ, and other archive formats
											</p>
										</a>

										<a
											href="/file-types-programming.html"
											className="group bg-slate-50 hover:bg-indigo-50 p-6 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-lg"
										>
											<div className="flex items-center mb-3">
												<div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
													<span className="text-xl">💻</span>
												</div>
												<h3 className="ml-3 font-semibold text-slate-800 group-hover:text-indigo-900">
													Programming Files
												</h3>
											</div>
											<p className="text-sm text-slate-600 group-hover:text-indigo-700">
												JS, TS, PY, HTML, CSS, and other code formats
											</p>
										</a>
									</div>
								</div>
							</section>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default App;
