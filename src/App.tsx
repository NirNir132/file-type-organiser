import React, { useState, useCallback, useEffect } from "react";
import DropZone from "./components/DropZone";
import FileFilter from "./components/FileFilter";
import FileList from "./components/FileList";
import { createZipFromFiles, normalizeExtension } from "./services/fileService";
import { AppFile } from "./types";
import SpinnerIcon from "./components/icons/SpinnerIcon";
import { AlertTriangle } from "lucide-react";

const App: React.FC = () => {
	const [allScannedFiles, setAllScannedFiles] = useState<AppFile[]>([]);
	const [filteredFiles, setFilteredFiles] = useState<AppFile[]>([]);
	const [targetExtension, setTargetExtension] = useState<string>("");

	const [isLoadingInitialScan, setIsLoadingInitialScan] =
		useState<boolean>(false);
	const [isFiltering, setIsFiltering] = useState<boolean>(false);
	const [isZipping, setIsZipping] = useState<boolean>(false);

	const [error, setError] = useState<string | null>(null);
	const [showFilteredList, setShowFilteredList] = useState<boolean>(false);

	const handleFilesScanned = useCallback((files: AppFile[]) => {
		setAllScannedFiles(files);
		setFilteredFiles([]);
		setShowFilteredList(false);
		setError(null);
	}, []);

	const handleSetAppLoading = useCallback((isLoading: boolean) => {
		setIsLoadingInitialScan(isLoading);
	}, []);

	const handleSetAppError = useCallback((appError: string | null) => {
		setError(appError);
	}, []);

	const handleProcessFiles = useCallback(() => {
		if (!targetExtension.trim()) {
			setError("Please enter a file extension to filter by.");
			setFilteredFiles([]);
			setShowFilteredList(true); // Show the (empty) list area to display the "no files found" message if applicable
			return;
		}
		setIsFiltering(true);
		setError(null);

		// Simulate processing time
		setTimeout(() => {
			const normalizedExt = normalizeExtension(targetExtension);
			const files = allScannedFiles.filter((file) =>
				file.name.toLowerCase().endsWith(normalizedExt)
			);
			setFilteredFiles(files);
			setIsFiltering(false);
			setShowFilteredList(true);
		}, 500);
	}, [allScannedFiles, targetExtension]);

	const handleDownloadZip = useCallback(async () => {
		if (filteredFiles.length === 0) {
			setError("No files to download.");
			return;
		}
		setIsZipping(true);
		setError(null);
		try {
			const zipBlob = await createZipFromFiles(
				filteredFiles,
				`organized_${targetExtension}.zip`
			);
			const link = document.createElement("a");
			link.href = URL.createObjectURL(zipBlob);
			link.download = `organized_${targetExtension}_files.zip`;
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
	}, [filteredFiles, targetExtension]);

	useEffect(() => {
		if (allScannedFiles.length === 0) {
			setFilteredFiles([]);
			setShowFilteredList(false);
		}
		// If targetExtension is cleared, hide the list and clear filtered files,
		// unless an error specific to no extension being typed is active.
		if (
			!targetExtension.trim() &&
			showFilteredList &&
			!error?.includes("file extension to filter by")
		) {
			setFilteredFiles([]);
			// setShowFilteredList(false); // Keep this true to show "No files found" if extension was cleared
		}
	}, [allScannedFiles, targetExtension, showFilteredList, error]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-50 flex flex-col items-center py-12 sm:py-20 px-4 sm:px-6 lg:px-8 selection:bg-sky-200 selection:text-sky-900">
			<header className="mb-12 md:mb-16 text-center">
				<h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-700 mb-3">
					File Type Organizer
				</h1>
				<p className="mt-4 text-lg text-slate-700/90 max-w-2xl mx-auto">
					Effortlessly drag & drop a folder, specify a file type, and instantly
					download your neatly organized files.
				</p>
			</header>

			<main className="w-full max-w-2xl lg:max-w-3xl space-y-10">
				{error && (
					<div
						className="p-4 text-sm text-red-800 bg-red-100/90 backdrop-blur-sm rounded-xl border border-red-300/80 shadow-lg flex items-start space-x-3"
						role="alert"
					>
						{/* Using a more prominent error icon like Lucide's AlertTriangle */}
						<AlertTriangle
							className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
							strokeWidth={2.5}
						/>
						<div>
							<span className="font-semibold block text-base">
								Oops! An error occurred:
							</span>
							<p className="text-sm">{error}</p>
						</div>
					</div>
				)}

				<DropZone
					onFilesScanned={handleFilesScanned}
					setAppIsLoading={handleSetAppLoading}
					setAppError={handleSetAppError}
				/>

				{isLoadingInitialScan && (
					<div className="flex flex-col items-center justify-center p-10 bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl">
						<SpinnerIcon className="w-12 h-12 text-sky-600 mb-5" />
						<p className="text-slate-700 text-lg font-semibold">
							Scanning Folder Contents...
						</p>
						<p className="text-slate-500/90 text-sm">
							Please wait, this may take a moment for large folders.
						</p>
					</div>
				)}

				{!isLoadingInitialScan &&
					(allScannedFiles.length > 0 ||
						targetExtension ||
						showFilteredList) && (
						<FileFilter
							targetExtension={targetExtension}
							setTargetExtension={setTargetExtension}
							onProcess={handleProcessFiles}
							isProcessingDisabled={allScannedFiles.length === 0}
							totalFilesScanned={allScannedFiles.length}
							isProcessing={isFiltering}
						/>
					)}

				{!isLoadingInitialScan && showFilteredList && (
					<FileList
						files={filteredFiles}
						onDownloadZip={handleDownloadZip}
						isZipping={isZipping}
						targetExtension={targetExtension}
					/>
				)}
			</main>

			{/* File Type Encyclopedia Section */}
			<section className="mt-16 w-full max-w-4xl">
				<div className="bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl p-8 border border-slate-200/50">
					<div className="text-center mb-8">
						<h2 className="text-3xl font-bold text-slate-800 mb-3">
							📁 File Type Encyclopedia
						</h2>
						<p className="text-slate-600 max-w-2xl mx-auto">
							Discover detailed information about file formats, their uses, and
							best practices. Your complete reference guide to digital file
							types.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<a
							href="/file-types-documents.html"
							className="group bg-slate-50 hover:bg-blue-50 p-6 rounded-xl border border-slate-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg text-decoration-none"
						>
							<div className="text-center">
								<div className="text-3xl mb-3">📄</div>
								<h3 className="font-semibold text-slate-800 mb-2 group-hover:text-blue-700">
									Document Files
								</h3>
								<p className="text-sm text-slate-600 mb-3">
									Learn about PDF, DOCX, TXT, and other document formats.
									Perfect for business and academic use.
								</p>
								<span className="text-blue-600 text-sm font-medium group-hover:text-blue-700">
									Explore Documents →
								</span>
							</div>
						</a>

						<a
							href="/file-types-images.html"
							className="group bg-slate-50 hover:bg-green-50 p-6 rounded-xl border border-slate-200 hover:border-green-300 transition-all duration-300 hover:shadow-lg text-decoration-none"
						>
							<div className="text-center">
								<div className="text-3xl mb-3">🖼️</div>
								<h3 className="font-semibold text-slate-800 mb-2 group-hover:text-green-700">
									Image Files
								</h3>
								<p className="text-sm text-slate-600 mb-3">
									Understand JPEG, PNG, SVG, and WebP formats. Optimize images
									for web and print.
								</p>
								<span className="text-green-600 text-sm font-medium group-hover:text-green-700">
									View Image Guide →
								</span>
							</div>
						</a>

						<a
							href="/file-types-audio.html"
							className="group bg-slate-50 hover:bg-purple-50 p-6 rounded-xl border border-slate-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg text-decoration-none"
						>
							<div className="text-center">
								<div className="text-3xl mb-3">🎵</div>
								<h3 className="font-semibold text-slate-800 mb-2 group-hover:text-purple-700">
									Audio Files
								</h3>
								<p className="text-sm text-slate-600 mb-3">
									Master MP3, WAV, FLAC formats. Choose the right audio quality
									for your needs.
								</p>
								<span className="text-purple-600 text-sm font-medium group-hover:text-purple-700">
									Audio Formats →
								</span>
							</div>
						</a>

						<a
							href="/file-types-video.html"
							className="group bg-slate-50 hover:bg-red-50 p-6 rounded-xl border border-slate-200 hover:border-red-300 transition-all duration-300 hover:shadow-lg text-decoration-none"
						>
							<div className="text-center">
								<div className="text-3xl mb-3">🎬</div>
								<h3 className="font-semibold text-slate-800 mb-2 group-hover:text-red-700">
									Video Files
								</h3>
								<p className="text-sm text-slate-600 mb-3">
									Explore MP4, AVI, MOV formats. Optimize videos for streaming
									and storage.
								</p>
								<span className="text-red-600 text-sm font-medium group-hover:text-red-700">
									Video Guide →
								</span>
							</div>
						</a>

						<a
							href="/file-types-archives.html"
							className="group bg-slate-50 hover:bg-orange-50 p-6 rounded-xl border border-slate-200 hover:border-orange-300 transition-all duration-300 hover:shadow-lg text-decoration-none"
						>
							<div className="text-center">
								<div className="text-3xl mb-3">📦</div>
								<h3 className="font-semibold text-slate-800 mb-2 group-hover:text-orange-700">
									Archive Files
								</h3>
								<p className="text-sm text-slate-600 mb-3">
									Compare ZIP, RAR, 7Z formats. Choose the best compression for
									your files.
								</p>
								<span className="text-orange-600 text-sm font-medium group-hover:text-orange-700">
									Archive Types →
								</span>
							</div>
						</a>

						<a
							href="/file-types-programming.html"
							className="group bg-slate-50 hover:bg-indigo-50 p-6 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-lg text-decoration-none"
						>
							<div className="text-center">
								<div className="text-3xl mb-3">💻</div>
								<h3 className="font-semibold text-slate-800 mb-2 group-hover:text-indigo-700">
									Code Files
								</h3>
								<p className="text-sm text-slate-600 mb-3">
									Navigate JavaScript, Python, HTML files. Essential reference
									for developers.
								</p>
								<span className="text-indigo-600 text-sm font-medium group-hover:text-indigo-700">
									Programming Files →
								</span>
							</div>
						</a>
					</div>

					<div className="text-center mt-8">
						<a
							href="/file-encyclopedia.html"
							className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-sky-700 hover:to-indigo-700 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
						>
							<span>📚 Complete File Encyclopedia</span>
							<svg
								className="w-5 h-5 ml-2"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</a>
					</div>
				</div>
			</section>

			<footer className="mt-20 w-full max-w-6xl">
				<div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/50 overflow-hidden">
					{/* Main Footer Content */}
					<div className="p-8 lg:p-12">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
							{/* Brand Section */}
							<div className="lg:col-span-1">
								<h3 className="text-xl font-bold text-slate-800 mb-4">
									📁 OrganiseFiles.live
								</h3>
								<p className="text-slate-600 text-sm leading-relaxed mb-4">
									Your ultimate file organization toolkit. Extract, sort, and
									manage files with ease.
								</p>
								<div className="flex space-x-2">
									<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
									<span className="text-xs text-slate-500">
										Processing locally for privacy
									</span>
								</div>
							</div>

							{/* Popular Tools */}
							<div>
								<h4 className="font-semibold text-slate-800 mb-4">
									🛠️ Popular Tools
								</h4>
								<div className="space-y-2">
									<a
										href="/how-to-extract-pdf-files.html"
										className="block text-sm text-slate-600 hover:text-sky-600 transition-colors"
									>
										Extract PDF Files
									</a>
									<a
										href="/organize-photos-by-type.html"
										className="block text-sm text-slate-600 hover:text-sky-600 transition-colors"
									>
										Organize Photos
									</a>
									<a
										href="/unzip-files-online.html"
										className="block text-sm text-slate-600 hover:text-sky-600 transition-colors"
									>
										Unzip Files Online
									</a>
									<a
										href="/rar-extractor-online.html"
										className="block text-sm text-slate-600 hover:text-sky-600 transition-colors"
									>
										RAR Extractor
									</a>
								</div>
							</div>

							{/* File Encyclopedia */}
							<div>
								<h4 className="font-semibold text-slate-800 mb-4">
									📚 File Encyclopedia
								</h4>
								<div className="space-y-2">
									<a
										href="/file-types-documents.html"
										className="block text-sm text-slate-600 hover:text-purple-600 transition-colors"
									>
										Document Types
									</a>
									<a
										href="/file-types-images.html"
										className="block text-sm text-slate-600 hover:text-green-600 transition-colors"
									>
										Image Formats
									</a>
									<a
										href="/file-types-audio.html"
										className="block text-sm text-slate-600 hover:text-purple-600 transition-colors"
									>
										Audio Files
									</a>
									<a
										href="/file-types-video.html"
										className="block text-sm text-slate-600 hover:text-red-600 transition-colors"
									>
										Video Formats
									</a>
								</div>
							</div>

							{/* Support & Legal */}
							<div>
								<h4 className="font-semibold text-slate-800 mb-4">
									🤝 Support & Legal
								</h4>
								<div className="space-y-2">
									<a
										href="/contact.html"
										className="block text-sm text-slate-600 hover:text-sky-600 transition-colors"
									>
										Contact & Support
									</a>
									<a
										href="/terms.html"
										className="block text-sm text-slate-600 hover:text-sky-600 transition-colors"
									>
										Terms of Service
									</a>
									<a
										href="/privacy.html"
										className="block text-sm text-slate-600 hover:text-sky-600 transition-colors"
									>
										Privacy Policy
									</a>
									<a
										href="/file-encyclopedia.html"
										className="block text-sm text-slate-600 hover:text-indigo-600 transition-colors font-medium"
									>
										Complete File Guide
									</a>
								</div>
							</div>
						</div>
					</div>

					{/* Bottom Bar */}
					<div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-t border-slate-200/50">
						<div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
							<div className="text-center md:text-left">
								<p className="text-sm text-slate-600">
									&copy; {new Date().getFullYear()} OrganiseFiles.live - All
									rights reserved.
								</p>
								<p className="text-xs text-slate-500 mt-1">
									Crafted with React, Tailwind CSS, and a sprinkle of
									innovation. ✨
								</p>
							</div>
							<div className="flex items-center space-x-4">
								<div className="flex items-center space-x-2 text-xs text-slate-500">
									<div className="w-2 h-2 bg-slate-400 rounded-full"></div>
									<span>Browser-based processing</span>
								</div>
								<div className="flex items-center space-x-2 text-xs text-slate-500">
									<div className="w-2 h-2 bg-blue-400 rounded-full"></div>
									<span>No uploads required</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
};

export default App;
