import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

// Clean File Type Organizer Component
function FileTypeOrganizer() {
	const [dragActive, setDragActive] = React.useState(false);
	const [files, setFiles] = React.useState<File[]>([]);
	const [extension, setExtension] = React.useState("");
	const [filteredFiles, setFilteredFiles] = React.useState<File[]>([]);
	const [isProcessing, setIsProcessing] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	const handleDragEnter = React.useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(true);
	}, []);

	const handleDragLeave = React.useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
	}, []);

	const handleDragOver = React.useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = React.useCallback(async (e: React.DragEvent) => {
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
	}, []);

	const filterFiles = React.useCallback(() => {
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
	}, [extension, files]);

	const downloadFile = React.useCallback((file: File) => {
		try {
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
	}, []);

	return (
		<div className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-50 flex flex-col items-center py-12 px-4">
			<header className="mb-12 text-center">
				<h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-700 mb-3">
					File Type Organizer
				</h1>
				<p className="text-lg text-slate-700 max-w-2xl mx-auto">
					Effortlessly drag & drop files, specify a file type, and instantly
					download your organized files.
				</p>
			</header>

			<main className="w-full max-w-2xl space-y-8">
				{error && (
					<div className="p-4 text-sm text-red-800 bg-red-100 rounded-xl border border-red-300 shadow-lg">
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
							? "border-solid border-sky-500 bg-sky-100 ring-4 ring-sky-500 shadow-2xl scale-105"
							: "border-dashed border-slate-400 bg-white hover:border-sky-500 hover:bg-sky-50 shadow-xl"
					}`}
				>
					<div className="flex flex-col items-center space-y-4">
						<svg
							className="w-12 h-12 text-slate-400"
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
					<div className="text-center p-8 bg-white rounded-2xl shadow-2xl">
						<div className="animate-spin w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full mx-auto mb-4"></div>
						<p className="text-slate-700">Processing files...</p>
					</div>
				)}

				{files.length > 0 && !isProcessing && (
					<div className="p-6 bg-white rounded-2xl shadow-2xl">
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
								<h3 className="text-xl font-semibold text-slate-800 mb-4">
									Found {filteredFiles.length} .{extension} file(s)
								</h3>
								<div className="max-h-64 overflow-y-auto space-y-2">
									{filteredFiles.map((file, index) => (
										<div
											key={index}
											className="p-3 bg-slate-50 rounded-lg flex justify-between items-center"
										>
											<div className="flex-1">
												<span className="text-sm font-medium text-slate-800">
													{file.name}
												</span>
												<span className="text-xs text-slate-500 ml-2">
													{(file.size / 1024).toFixed(1)} KB
												</span>
											</div>
											<button
												onClick={() => downloadFile(file)}
												className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
											>
												Download
											</button>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</main>

			<footer className="mt-20 pt-10 border-t border-slate-300 w-full max-w-3xl text-center text-sm text-slate-600">
				<p>&copy; 2025 File Organizer App. All rights reserved.</p>
				<p className="text-xs text-slate-500 mt-1">
					Crafted with React, Tailwind CSS, and a sprinkle of innovation.
				</p>
			</footer>
		</div>
	);
}

// Clean initialization
const rootElement = document.getElementById("root");
if (rootElement) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(React.createElement(FileTypeOrganizer));
}
