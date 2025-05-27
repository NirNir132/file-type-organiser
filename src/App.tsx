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

			<footer className="mt-20 pt-10 border-t border-slate-300/70 w-full max-w-3xl text-center text-sm text-slate-600/90">
				<p>
					&copy; {new Date().getFullYear()} OrganiseFiles.live - All rights
					reserved.
				</p>
				<p className="mt-2">
					<a
						href="/contact.html"
						className="text-sky-600 hover:text-sky-700 hover:underline mx-2"
					>
						Contact & Support
					</a>
					|
					<a
						href="/terms.html"
						className="text-sky-600 hover:text-sky-700 hover:underline mx-2"
					>
						Terms of Service
					</a>
					|
					<a
						href="/privacy.html"
						className="text-sky-600 hover:text-sky-700 hover:underline mx-2"
					>
						Privacy Policy
					</a>
				</p>
				<p className="text-xs text-slate-500/80 mt-3">
					All file processing is done locally in your browser for your privacy.
				</p>
				<p className="text-xs text-slate-500/80 mt-1">
					Crafted with React, Tailwind CSS, and a sprinkle of innovation.
				</p>
			</footer>
		</div>
	);
};

export default App;
