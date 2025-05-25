import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

// Standalone File Type Organizer Component
const FileTypeOrganizer = () => {
	const [dragActive, setDragActive] = React.useState(false);
	const [files, setFiles] = React.useState<File[]>([]);
	const [extension, setExtension] = React.useState("");
	const [filteredFiles, setFilteredFiles] = React.useState<File[]>([]);
	const [isProcessing, setIsProcessing] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	const handleDragEnter = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
		setError(null);

		const items = e.dataTransfer.items;
		if (!items || items.length === 0) {
			setError("No files were dropped. Please try again.");
			return;
		}

		setIsProcessing(true);
		const allFiles: File[] = [];

		try {
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				if (item.kind === "file") {
					const file = item.getAsFile();
					if (file) allFiles.push(file);
				}
			}

			setFiles(allFiles);
			setIsProcessing(false);
		} catch (err) {
			setError("Error processing files. Please try again.");
			setIsProcessing(false);
		}
	};

	const filterFiles = () => {
		if (!extension.trim()) {
			setError("Please enter a file extension.");
			return;
		}

		const ext = extension.startsWith(".")
			? extension.toLowerCase()
			: `.${extension.toLowerCase()}`;
		const filtered = files.filter((file) =>
			file.name.toLowerCase().endsWith(ext)
		);
		setFilteredFiles(filtered);
		setError(null);
	};

	const downloadZip = async () => {
		if (filteredFiles.length === 0) {
			setError("No files to download.");
			return;
		}

		try {
			// Simple download of first file for now (JSZip might be causing issues)
			const file = filteredFiles[0];
			const url = URL.createObjectURL(file);
			const a = document.createElement("a");
			a.href = url;
			a.download = file.name;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (err) {
			setError("Error downloading file. Please try again.");
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-50 flex flex-col items-center py-12 px-4">
			<header className="mb-12 text-center">
				<h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-700 mb-3">
					File Type Organizer
				</h1>
				<p className="text-lg text-slate-700/90 max-w-2xl mx-auto">
					Effortlessly drag & drop files, specify a file type, and instantly
					download your organized files.
				</p>
			</header>

			<main className="w-full max-w-2xl space-y-8">
				{error && (
					<div className="p-4 text-sm text-red-800 bg-red-100/90 backdrop-blur-sm rounded-xl border border-red-300/80 shadow-lg">
						<strong>Error:</strong> {error}
					</div>
				)}

				<div
					onDragEnter={handleDragEnter}
					onDragLeave={handleDragLeave}
					onDragOver={handleDragOver}
					onDrop={handleDrop}
					className={`w-full p-12 border-2 rounded-2xl text-center cursor-pointer transition-all duration-300 ${
						dragActive
							? "border-solid border-sky-500 bg-sky-100/80 backdrop-blur-sm ring-4 ring-sky-500/40 shadow-2xl scale-105"
							: "border-dashed border-slate-400/70 bg-white/70 backdrop-blur-sm hover:border-sky-500/90 hover:bg-sky-50/70 shadow-xl"
					}`}
				>
					<div className="flex flex-col items-center space-y-4">
						<svg
							className="w-20 h-20 text-slate-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
							/>
						</svg>
						<p className="text-xl font-semibold text-slate-700">
							{dragActive ? "Release to Scan Files!" : "Drag & Drop Files Here"}
						</p>
						<p className="text-sm text-slate-500">
							Drop your files and we'll help you organize them by type.
						</p>
					</div>
				</div>

				{isProcessing && (
					<div className="text-center p-8 bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl">
						<div className="animate-spin w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full mx-auto mb-4"></div>
						<p className="text-slate-700">Processing files...</p>
					</div>
				)}

				{files.length > 0 && !isProcessing && (
					<div className="p-6 bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl">
						<h2 className="text-2xl font-semibold text-slate-800 mb-4">
							Filter Your Files
						</h2>
						<p className="text-slate-600 mb-4">
							Found {files.length} files. Enter a file extension to filter:
						</p>

						<div className="flex gap-4 mb-4">
							<input
								type="text"
								value={extension}
								onChange={(e) => setExtension(e.target.value)}
								placeholder="e.g., pdf, jpg, txt"
								className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
							/>
							<button
								onClick={filterFiles}
								className="px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
							>
								Filter
							</button>
						</div>

						{filteredFiles.length > 0 && (
							<div className="mt-6">
								<div className="flex justify-between items-center mb-4">
									<h3 className="text-xl font-semibold text-slate-800">
										Found {filteredFiles.length} .{extension} file(s)
									</h3>
									<button
										onClick={downloadZip}
										className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
									>
										Download
									</button>
								</div>
								<div className="max-h-64 overflow-y-auto space-y-2">
									{filteredFiles.map((file, index) => (
										<div
											key={index}
											className="p-3 bg-slate-50 rounded-lg flex justify-between items-center"
										>
											<span className="text-sm font-medium text-slate-800">
												{file.name}
											</span>
											<span className="text-xs text-slate-500">
												{(file.size / 1024).toFixed(1)} KB
											</span>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</main>

			<footer className="mt-20 pt-10 border-t border-slate-300/70 w-full max-w-3xl text-center text-sm text-slate-600/90">
				<p>&copy; 2025 File Organizer App. All rights reserved.</p>
				<p className="text-xs text-slate-500/80 mt-1">
					Crafted with React, Tailwind CSS, and a sprinkle of innovation.
				</p>
			</footer>
		</div>
	);
};

const rootElement = document.getElementById("root");
if (!rootElement) {
	console.error("Root element not found");
	document.body.innerHTML =
		'<div style="color: red; text-align: center; padding: 2rem;">Root element not found</div>';
} else {
	console.log("Root element found, rendering React app...");
	try {
		const root = ReactDOM.createRoot(rootElement);
		root.render(<FileTypeOrganizer />);
		console.log("React app rendered successfully!");
	} catch (error) {
		console.error("Failed to render React app:", error);
		rootElement.innerHTML = `
			<div style="color: red; text-align: center; padding: 2rem; font-family: system-ui;">
				<h2>Failed to load the application</h2>
				<p>There was an error loading the React app. Please try refreshing the page.</p>
				<button onclick="window.location.reload()" style="padding: 8px 16px; background: #0ea5e9; color: white; border: none; border-radius: 4px; cursor: pointer;">
					Reload Page
				</button>
			</div>
		`;
	}
}
