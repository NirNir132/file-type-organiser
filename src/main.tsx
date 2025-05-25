import React from "react";
import ReactDOM from "react-dom/client";

// File Type Organizer with Enhanced Folder Support
function FileTypeOrganizer() {
	const [dragActive, setDragActive] = React.useState(false);
	const [files, setFiles] = React.useState<File[]>([]);
	const [extension, setExtension] = React.useState("");
	const [filteredFiles, setFilteredFiles] = React.useState<File[]>([]);
	const [isProcessing, setIsProcessing] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	// Debug logging
	React.useEffect(() => {
		console.log("🎨 File Type Organizer loaded with inline styles");
		console.log("📍 Current URL:", window.location.href);
		console.log("🔧 React version:", React.version);
	}, []);

	// Helper function to recursively process directory entries
	const processDirectoryEntry = async (
		entry: FileSystemEntry
	): Promise<File[]> => {
		return new Promise((resolve, reject) => {
			if (entry.isFile) {
				const fileEntry = entry as FileSystemFileEntry;
				fileEntry.file(
					(file) => {
						console.log(
							`📄 Found file: ${file.name} (${(file.size / 1024).toFixed(
								1
							)} KB)`
						);
						resolve([file]);
					},
					(error) => {
						console.error(`❌ Error reading file ${entry.name}:`, error);
						resolve([]);
					}
				);
			} else if (entry.isDirectory) {
				const dirEntry = entry as FileSystemDirectoryEntry;
				console.log(`📁 Processing directory: ${entry.name}`);

				const dirReader = dirEntry.createReader();
				const allFiles: File[] = [];

				const readEntries = () => {
					dirReader.readEntries(
						async (entries) => {
							if (entries.length === 0) {
								// No more entries, resolve with collected files
								resolve(allFiles);
								return;
							}

							// Process all entries in this batch
							const promises = entries.map((entry) =>
								processDirectoryEntry(entry)
							);
							try {
								const results = await Promise.all(promises);
								const flatFiles = results.flat();
								allFiles.push(...flatFiles);

								// Continue reading more entries
								readEntries();
							} catch (error) {
								console.error(`❌ Error processing directory entries:`, error);
								resolve(allFiles);
							}
						},
						(error) => {
							console.error(`❌ Error reading directory ${entry.name}:`, error);
							resolve(allFiles);
						}
					);
				};

				readEntries();
			} else {
				resolve([]);
			}
		});
	};

	const handleDragEnter = React.useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(true);
		console.log("📥 Drag enter detected");
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

		console.log("📁 Files/folders dropped");
		const items = e.dataTransfer.items;
		if (!items || items.length === 0) {
			setError("No files were dropped. Please try again.");
			return;
		}

		setIsProcessing(true);
		const allFiles: File[] = [];

		try {
			console.log(`🔍 Processing ${items.length} dropped items...`);

			// Process each dropped item
			for (let i = 0; i < items.length; i++) {
				const item = items[i];

				if (item.kind === "file") {
					// Check if it's a directory or file
					const entry = item.webkitGetAsEntry();
					if (entry) {
						console.log(
							`📦 Processing entry: ${entry.name} (${
								entry.isDirectory ? "directory" : "file"
							})`
						);
						const files = await processDirectoryEntry(entry);
						allFiles.push(...files);
					} else {
						// Fallback for browsers that don't support webkitGetAsEntry
						const file = item.getAsFile();
						if (file) {
							console.log(`📄 Direct file: ${file.name}`);
							allFiles.push(file);
						}
					}
				}
			}

			console.log(
				`✅ Processed ${allFiles.length} total files from all sources`
			);

			// Log file breakdown by extension
			const extensionCounts = allFiles.reduce((acc, file) => {
				const ext = file.name.split(".").pop()?.toLowerCase() || "no-extension";
				acc[ext] = (acc[ext] || 0) + 1;
				return acc;
			}, {} as Record<string, number>);

			console.log("📊 File breakdown by extension:", extensionCounts);

			setFiles(allFiles);
			setIsProcessing(false);
		} catch (err) {
			console.error("❌ Error processing files:", err);
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
		console.log(`🔍 Filtered ${filtered.length} files with extension ${ext}`);

		// Log the filtered files
		filtered.forEach((file) => {
			console.log(`  📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
		});

		setFilteredFiles(filtered);
		setError(null);
	}, [extension, files]);

	const downloadFile = React.useCallback((file: File) => {
		try {
			console.log(`⬇️ Downloading file: ${file.name}`);
			const url = URL.createObjectURL(file);
			const a = document.createElement("a");
			a.href = url;
			a.download = file.name;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error("❌ Download error:", err);
			setError("Error downloading file. Please try again.");
		}
	}, []);

	// Enhanced inline styles with better browser compatibility
	const containerStyle: React.CSSProperties = {
		minHeight: "100vh",
		background:
			"linear-gradient(135deg, #e0f2fe 0%, #e8eaf6 50%, #f3e5f5 100%)",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		padding: "3rem 1rem",
		fontFamily:
			"system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		margin: 0,
		boxSizing: "border-box",
	};

	const titleStyle: React.CSSProperties = {
		fontSize: "clamp(2rem, 5vw, 3rem)",
		fontWeight: "800",
		background: "linear-gradient(135deg, #0284c7, #4338ca, #7c3aed)",
		WebkitBackgroundClip: "text",
		WebkitTextFillColor: "transparent",
		backgroundClip: "text",
		marginBottom: "1rem",
		textAlign: "center",
		lineHeight: 1.2,
	};

	const subtitleStyle: React.CSSProperties = {
		fontSize: "1.125rem",
		color: "#475569",
		maxWidth: "32rem",
		textAlign: "center",
		marginBottom: "3rem",
		lineHeight: 1.6,
	};

	const dropZoneStyle: React.CSSProperties = {
		width: "100%",
		maxWidth: "32rem",
		padding: "3rem",
		border: dragActive ? "2px solid #0ea5e9" : "2px dashed #94a3b8",
		borderRadius: "1rem",
		textAlign: "center",
		cursor: "pointer",
		transition: "all 0.3s ease",
		backgroundColor: dragActive ? "#e0f2fe" : "#ffffff",
		boxShadow: dragActive
			? "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 4px rgba(14, 165, 233, 0.3)"
			: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
		transform: dragActive ? "scale(1.02)" : "scale(1)",
		marginBottom: "2rem",
	};

	const iconStyle: React.CSSProperties = {
		width: "3rem",
		height: "3rem",
		color: "#94a3b8",
		marginBottom: "1rem",
		display: "block",
	};

	const cardStyle: React.CSSProperties = {
		width: "100%",
		maxWidth: "32rem",
		padding: "1.5rem",
		backgroundColor: "#ffffff",
		borderRadius: "1rem",
		boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
		marginBottom: "2rem",
		border: "1px solid rgba(0, 0, 0, 0.05)",
	};

	const buttonStyle: React.CSSProperties = {
		padding: "0.75rem 1.5rem",
		background: "linear-gradient(135deg, #0ea5e9, #4338ca)",
		color: "white",
		border: "none",
		borderRadius: "0.5rem",
		fontWeight: "600",
		cursor: "pointer",
		transition: "all 0.3s ease",
		fontSize: "1rem",
	};

	const inputStyle: React.CSSProperties = {
		flex: 1,
		padding: "0.75rem 1rem",
		border: "1px solid #d1d5db",
		borderRadius: "0.5rem",
		fontSize: "1rem",
		outline: "none",
		transition: "border-color 0.2s ease",
	};

	return (
		<div style={containerStyle}>
			<header>
				<h1 style={titleStyle}>File Type Organizer</h1>
				<p style={subtitleStyle}>
					Effortlessly drag & drop files or folders, specify a file type, and
					instantly download your organized files.
				</p>
			</header>

			<main
				style={{
					width: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				{error && (
					<div
						style={{
							...cardStyle,
							backgroundColor: "#fef2f2",
							color: "#991b1b",
							border: "1px solid #fecaca",
						}}
					>
						<strong>Error:</strong> {error}
					</div>
				)}

				<div
					onDragEnter={handleDragEnter}
					onDragLeave={handleDragLeave}
					onDragOver={handleDragOver}
					onDrop={handleDrop}
					style={dropZoneStyle}
				>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: "1rem",
						}}
					>
						<svg
							style={iconStyle}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
							/>
						</svg>
						<p
							style={{
								fontSize: "1.25rem",
								fontWeight: "600",
								color: "#374151",
								margin: 0,
							}}
						>
							{dragActive
								? "Release to Scan Files!"
								: "Drag & Drop Files or Folders Here"}
						</p>
						<p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
							Drop files or entire folders and we'll recursively scan all files
							inside.
						</p>
					</div>
				</div>

				{isProcessing && (
					<div style={cardStyle}>
						<div style={{ textAlign: "center" }}>
							<div
								style={{
									width: "2rem",
									height: "2rem",
									border: "4px solid #e5e7eb",
									borderTop: "4px solid #0ea5e9",
									borderRadius: "50%",
									animation: "spin 1s linear infinite",
									margin: "0 auto 1rem",
								}}
							></div>
							<p style={{ color: "#374151", margin: 0 }}>
								Processing files and folders...
							</p>
						</div>
					</div>
				)}

				{files.length > 0 && !isProcessing && (
					<div style={cardStyle}>
						<h2
							style={{
								fontSize: "1.5rem",
								fontWeight: "600",
								color: "#1f2937",
								marginBottom: "1rem",
							}}
						>
							Filter Your Files
						</h2>
						<p style={{ color: "#6b7280", marginBottom: "1rem" }}>
							Found {files.length} files total. Enter a file extension to
							filter:
						</p>

						<div
							style={{
								display: "flex",
								gap: "1rem",
								marginBottom: "1rem",
								flexWrap: "wrap",
							}}
						>
							<input
								type="text"
								value={extension}
								onChange={(e) => setExtension(e.target.value)}
								placeholder="e.g., json, pdf, jpg, txt"
								style={inputStyle}
							/>
							<button onClick={filterFiles} style={buttonStyle}>
								Filter
							</button>
						</div>

						{filteredFiles.length > 0 && (
							<div style={{ marginTop: "1.5rem" }}>
								<h3
									style={{
										fontSize: "1.25rem",
										fontWeight: "600",
										color: "#1f2937",
										marginBottom: "1rem",
									}}
								>
									Found {filteredFiles.length} .{extension} file(s)
								</h3>
								<div style={{ maxHeight: "16rem", overflowY: "auto" }}>
									{filteredFiles.map((file, index) => (
										<div
											key={index}
											style={{
												padding: "0.75rem",
												backgroundColor: "#f8fafc",
												borderRadius: "0.5rem",
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												marginBottom: "0.5rem",
												flexWrap: "wrap",
												gap: "0.5rem",
											}}
										>
											<div style={{ flex: 1, minWidth: "200px" }}>
												<span
													style={{
														fontSize: "0.875rem",
														fontWeight: "500",
														color: "#1f2937",
														display: "block",
													}}
												>
													{file.name}
												</span>
												<span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
													{(file.size / 1024).toFixed(1)} KB
												</span>
											</div>
											<button
												onClick={() => downloadFile(file)}
												style={{
													...buttonStyle,
													padding: "0.5rem 1rem",
													fontSize: "0.875rem",
													background:
														"linear-gradient(135deg, #10b981, #059669)",
												}}
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

			<footer
				style={{
					marginTop: "5rem",
					paddingTop: "2.5rem",
					borderTop: "1px solid #d1d5db",
					width: "100%",
					maxWidth: "48rem",
					textAlign: "center",
					fontSize: "0.875rem",
					color: "#6b7280",
				}}
			>
				<p>&copy; 2025 File Organizer App. All rights reserved.</p>
				<p
					style={{
						fontSize: "0.75rem",
						color: "#9ca3af",
						marginTop: "0.25rem",
					}}
				>
					Crafted with React and a sprinkle of innovation.
				</p>
			</footer>

			<style>{`
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
				
				* {
					box-sizing: border-box;
				}
				
				body {
					margin: 0;
					padding: 0;
				}
			`}</style>
		</div>
	);
}

// Enhanced initialization with error handling
console.log("🚀 Initializing File Type Organizer...");

const rootElement = document.getElementById("root");
if (!rootElement) {
	console.error("❌ Root element not found!");
	document.body.innerHTML = `
		<div style="
			display: flex;
			justify-content: center;
			align-items: center;
			min-height: 100vh;
			background: linear-gradient(135deg, #e0f2fe 0%, #e8eaf6 50%, #f3e5f5 100%);
			font-family: system-ui, sans-serif;
			text-align: center;
			padding: 2rem;
		">
			<div style="
				background: white;
				padding: 2rem;
				border-radius: 1rem;
				box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
				max-width: 400px;
			">
				<h2 style="color: #dc2626; margin-bottom: 1rem;">⚠️ Loading Error</h2>
				<p style="color: #374151; margin-bottom: 1rem;">The root element was not found. Please refresh the page.</p>
				<button onclick="window.location.reload()" style="
					background: linear-gradient(135deg, #0ea5e9, #4338ca);
					color: white;
					border: none;
					padding: 0.75rem 1.5rem;
					border-radius: 0.5rem;
					cursor: pointer;
					font-weight: 600;
				">
					🔄 Reload Page
				</button>
			</div>
		</div>
	`;
} else {
	try {
		console.log("✅ Root element found, creating React app...");
		const root = ReactDOM.createRoot(rootElement);
		root.render(React.createElement(FileTypeOrganizer));
		console.log("🎉 React app rendered successfully!");
	} catch (error) {
		console.error("❌ Failed to render React app:", error);
		rootElement.innerHTML = `
			<div style="
				display: flex;
				justify-content: center;
				align-items: center;
				min-height: 100vh;
				background: linear-gradient(135deg, #e0f2fe 0%, #e8eaf6 50%, #f3e5f5 100%);
				font-family: system-ui, sans-serif;
				text-align: center;
				padding: 2rem;
			">
				<div style="
					background: white;
					padding: 2rem;
					border-radius: 1rem;
					box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
					max-width: 400px;
				">
					<h2 style="color: #dc2626; margin-bottom: 1rem;">❌ React Error</h2>
					<p style="color: #374151; margin-bottom: 1rem;">Failed to load the React application.</p>
					<details style="text-align: left; margin-bottom: 1rem;">
						<summary style="cursor: pointer; color: #6b7280;">Error Details</summary>
						<pre style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow: auto; font-size: 0.75rem; margin-top: 0.5rem;">${error}</pre>
					</details>
					<button onclick="window.location.reload()" style="
						background: linear-gradient(135deg, #0ea5e9, #4338ca);
						color: white;
						border: none;
						padding: 0.75rem 1.5rem;
						border-radius: 0.5rem;
						cursor: pointer;
						font-weight: 600;
					">
						🔄 Reload Page
					</button>
				</div>
			</div>
		`;
	}
}
