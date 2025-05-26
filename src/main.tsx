import React from "react";
import ReactDOM from "react-dom/client";
import JSZip from "jszip";

// File Type Organizer with Enhanced Folder Support and ZIP Download
function FileTypeOrganizer() {
	const [dragActive, setDragActive] = React.useState(false);
	const [files, setFiles] = React.useState<File[]>([]);
	const [extension, setExtension] = React.useState("");
	const [filteredFiles, setFilteredFiles] = React.useState<File[]>([]);
	const [isProcessing, setIsProcessing] = React.useState(false);
	const [isCreatingZip, setIsCreatingZip] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	// Debug logging
	React.useEffect(() => {
		console.log("🎨 File Type Organizer v2.1 loaded with ZIP support");
		console.log("📍 Current URL:", window.location.href);
		console.log("🔧 React version:", React.version);
		console.log("📦 ZIP functionality enabled");
	}, []);

	// Enhanced drag and drop sensitivity with document-level event handling
	React.useEffect(() => {
		const handleDocumentDragOver = (e: DragEvent) => {
			e.preventDefault();
			// Keep drag active while dragging over document
			if (e.dataTransfer && e.dataTransfer.types.includes("Files")) {
				setDragActive(true);
			}
		};

		const handleDocumentDragLeave = (e: DragEvent) => {
			// Only reset if we're truly leaving the document area
			if (
				!e.relatedTarget ||
				(e.relatedTarget as Element).nodeName === "HTML"
			) {
				dragCounter.current = 0;
				setDragActive(false);
			}
		};

		const handleDocumentDrop = (e: DragEvent) => {
			e.preventDefault();
			dragCounter.current = 0;
			setDragActive(false);
		};

		// Prevent default drag behavior on the entire document
		const preventDefaults = (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
		};

		document.addEventListener("dragenter", preventDefaults);
		document.addEventListener("dragover", handleDocumentDragOver);
		document.addEventListener("dragleave", handleDocumentDragLeave);
		document.addEventListener("drop", handleDocumentDrop);

		return () => {
			document.removeEventListener("dragenter", preventDefaults);
			document.removeEventListener("dragover", handleDocumentDragOver);
			document.removeEventListener("dragleave", handleDocumentDragLeave);
			document.removeEventListener("drop", handleDocumentDrop);
		};
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

	// Create a proper ZIP file using JSZip library
	const createZipFile = async (
		files: File[],
		zipName: string
	): Promise<Blob> => {
		console.log(`📦 Creating ZIP file: ${zipName} with ${files.length} files`);

		const zip = new JSZip();

		// Add each file to the ZIP
		for (const file of files) {
			try {
				console.log(
					`✅ Adding ${file.name} to ZIP (${(file.size / 1024).toFixed(1)} KB)`
				);

				// Read file as ArrayBuffer to preserve binary data integrity
				const arrayBuffer = await file.arrayBuffer();

				// Add file to ZIP with original filename and data
				zip.file(file.name, arrayBuffer);
			} catch (error) {
				console.warn(`⚠️ Could not add ${file.name} to ZIP:`, error);
			}
		}

		console.log(`🔧 Generating ZIP file...`);

		// Generate the ZIP file as a Blob with proper compression
		const zipBlob = await zip.generateAsync({
			type: "blob",
			compression: "DEFLATE",
			compressionOptions: {
				level: 6, // Good balance between compression and speed
			},
		});

		console.log(
			`✅ ZIP file generated successfully - Size: ${(
				zipBlob.size / 1024
			).toFixed(1)} KB`
		);

		return zipBlob;
	};

	const dragCounter = React.useRef(0);

	const handleDragEnter = React.useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounter.current++;
		if (e.dataTransfer && e.dataTransfer.types.includes("Files")) {
			setDragActive(true);
			console.log("📥 Drag enter detected");
		}
	}, []);

	const handleDragLeave = React.useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounter.current--;
		// Use a small delay to prevent flickering
		setTimeout(() => {
			if (dragCounter.current <= 0) {
				dragCounter.current = 0;
				setDragActive(false);
			}
		}, 50);
	}, []);

	const handleDragOver = React.useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.dataTransfer && e.dataTransfer.types.includes("Files")) {
			setDragActive(true);
		}
	}, []);

	const handleDrop = React.useCallback(async (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounter.current = 0;
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

	const downloadAllFiles = React.useCallback(async () => {
		if (filteredFiles.length === 0) {
			setError("No files to download.");
			return;
		}

		setIsCreatingZip(true);
		setError(null);

		try {
			console.log(`📦 Creating ZIP with ${filteredFiles.length} files`);

			const ext = extension.startsWith(".") ? extension.slice(1) : extension;
			const timestamp = new Date()
				.toISOString()
				.replace(/[:.]/g, "-")
				.split("T")[0];
			const zipName = `${ext}_files_${timestamp}.zip`;

			console.log(`🔧 ZIP filename will be: ${zipName}`);

			const zipBlob = await createZipFile(filteredFiles, zipName);

			console.log(
				`📦 ZIP blob created - Size: ${zipBlob.size} bytes, Type: ${zipBlob.type}`
			);

			// Download the ZIP file with cache busting
			const url = URL.createObjectURL(zipBlob);
			const a = document.createElement("a");
			a.href = url;
			a.download = zipName;
			a.style.display = "none";

			// Force download attribute and add cache busting
			a.setAttribute("download", zipName);
			a.setAttribute("type", "application/zip");

			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			console.log(`✅ Successfully triggered download of ZIP: ${zipName}`);
		} catch (err) {
			console.error("❌ Error creating ZIP:", err);
			setError(
				"Error creating ZIP file. Please try downloading files individually."
			);
		} finally {
			setIsCreatingZip(false);
		}
	}, [filteredFiles, extension]);

	// Enhanced inline styles with better browser compatibility
	const containerStyle: React.CSSProperties = {
		minHeight: "100vh",
		background:
			"linear-gradient(135deg, #e0f2fe 0%, #e8eaf6 50%, #f3e5f5 100%)",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "flex-start",
		padding: "clamp(2rem, 5vw, 4rem) 1rem",
		fontFamily:
			"system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		margin: 0,
		boxSizing: "border-box",
		width: "100%",
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
		textAlign: "center",
		margin: "0 auto 3rem auto",
		lineHeight: 1.6,
		maxWidth: "42rem",
	};

	const dropZoneStyle: React.CSSProperties = {
		width: "100%",
		padding: "clamp(3rem, 6vw, 4rem) clamp(1.5rem, 4vw, 2rem)",
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
		padding: "2rem",
		backgroundColor: "#ffffff",
		borderRadius: "1rem",
		boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
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

	const downloadAllButtonStyle: React.CSSProperties = {
		...buttonStyle,
		background: "linear-gradient(135deg, #f59e0b, #d97706)",
		marginLeft: "1rem",
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
			<header
				style={{
					width: "100%",
					maxWidth: "48rem",
					textAlign: "center",
					marginBottom: "2rem",
				}}
			>
				<h1 style={titleStyle}>Extract Files by Type Online</h1>
				<p style={subtitleStyle}>
					Extract specific file types from folders instantly. Drag & drop files
					or folders, filter by extension, and download your organized files as
					a ZIP archive. Perfect for organizing documents, images, and media
					files.
				</p>
			</header>

			<main
				style={{
					width: "100%",
					maxWidth: "48rem",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: "2rem",
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
								<div style={{ marginBottom: "1rem" }}>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "flex-start",
											marginBottom: "1rem",
											flexWrap: "wrap",
											gap: "1rem",
										}}
									>
										<h3
											style={{
												fontSize: "1.25rem",
												fontWeight: "600",
												color: "#1f2937",
												margin: 0,
												flex: "1 1 auto",
												minWidth: "200px",
											}}
										>
											Found {filteredFiles.length} .{extension} file(s)
										</h3>
										<button
											onClick={downloadAllFiles}
											disabled={isCreatingZip}
											style={{
												...downloadAllButtonStyle,
												opacity: isCreatingZip ? 0.6 : 1,
												cursor: isCreatingZip ? "not-allowed" : "pointer",
												marginLeft: 0,
												flexShrink: 0,
												whiteSpace: "nowrap",
											}}
										>
											{isCreatingZip ? "📦 Creating ZIP..." : "📦 Download ZIP"}
										</button>
									</div>
								</div>
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

			{/* Features Section */}
			<section
				style={{
					...cardStyle,
					marginTop: "3rem",
					width: "100%",
					maxWidth: "48rem",
				}}
			>
				<h2
					style={{
						fontSize: "1.75rem",
						fontWeight: "700",
						color: "#1f2937",
						marginBottom: "1.5rem",
						textAlign: "center",
					}}
				>
					Why Choose OrganiseFiles?
				</h2>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
						gap: "1.5rem",
					}}
				>
					<div style={{ textAlign: "center", padding: "1rem" }}>
						<div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🆓</div>
						<h3
							style={{
								fontSize: "1.125rem",
								fontWeight: "600",
								color: "#1f2937",
								marginBottom: "0.5rem",
							}}
						>
							100% Free
						</h3>
						<p
							style={{
								color: "#6b7280",
								fontSize: "0.875rem",
								lineHeight: "1.5",
							}}
						>
							No registration or downloads required
						</p>
					</div>
					<div style={{ textAlign: "center", padding: "1rem" }}>
						<div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔒</div>
						<h3
							style={{
								fontSize: "1.125rem",
								fontWeight: "600",
								color: "#1f2937",
								marginBottom: "0.5rem",
							}}
						>
							Secure
						</h3>
						<p
							style={{
								color: "#6b7280",
								fontSize: "0.875rem",
								lineHeight: "1.5",
							}}
						>
							Files processed in your browser, never uploaded to servers
						</p>
					</div>
					<div style={{ textAlign: "center", padding: "1rem" }}>
						<div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚡</div>
						<h3
							style={{
								fontSize: "1.125rem",
								fontWeight: "600",
								color: "#1f2937",
								marginBottom: "0.5rem",
							}}
						>
							Fast
						</h3>
						<p
							style={{
								color: "#6b7280",
								fontSize: "0.875rem",
								lineHeight: "1.5",
							}}
						>
							Instant file extraction and sorting
						</p>
					</div>
					<div style={{ textAlign: "center", padding: "1rem" }}>
						<div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>♾️</div>
						<h3
							style={{
								fontSize: "1.125rem",
								fontWeight: "600",
								color: "#1f2937",
								marginBottom: "0.5rem",
							}}
						>
							Unlimited
						</h3>
						<p
							style={{
								color: "#6b7280",
								fontSize: "0.875rem",
								lineHeight: "1.5",
							}}
						>
							No file size or quantity limits
						</p>
					</div>
					<div style={{ textAlign: "center", padding: "1rem" }}>
						<div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📁</div>
						<h3
							style={{
								fontSize: "1.125rem",
								fontWeight: "600",
								color: "#1f2937",
								marginBottom: "0.5rem",
							}}
						>
							All Formats
						</h3>
						<p
							style={{
								color: "#6b7280",
								fontSize: "0.875rem",
								lineHeight: "1.5",
							}}
						>
							PDF, DOCX, JPG, PNG, MP4, ZIP, and 50+ more
						</p>
					</div>
				</div>
			</section>

			{/* How it Works Section */}
			<section
				style={{
					...cardStyle,
					marginTop: "2rem",
					width: "100%",
					maxWidth: "48rem",
				}}
			>
				<h2
					style={{
						fontSize: "1.75rem",
						fontWeight: "700",
						color: "#1f2937",
						marginBottom: "1.5rem",
						textAlign: "center",
					}}
				>
					How to Extract Files by Type
				</h2>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
						gap: "1.5rem",
					}}
				>
					<div
						style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}
					>
						<div
							style={{
								backgroundColor: "#dbeafe",
								color: "#1e40af",
								width: "2rem",
								height: "2rem",
								borderRadius: "50%",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontWeight: "600",
								flexShrink: 0,
							}}
						>
							1
						</div>
						<div>
							<h3
								style={{
									fontSize: "1.125rem",
									fontWeight: "600",
									color: "#1f2937",
									marginBottom: "0.5rem",
								}}
							>
								Drag & Drop
							</h3>
							<p
								style={{
									color: "#6b7280",
									fontSize: "0.875rem",
									lineHeight: "1.5",
								}}
							>
								Drag and drop your files or folders into the upload area
							</p>
						</div>
					</div>
					<div
						style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}
					>
						<div
							style={{
								backgroundColor: "#dbeafe",
								color: "#1e40af",
								width: "2rem",
								height: "2rem",
								borderRadius: "50%",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontWeight: "600",
								flexShrink: 0,
							}}
						>
							2
						</div>
						<div>
							<h3
								style={{
									fontSize: "1.125rem",
									fontWeight: "600",
									color: "#1f2937",
									marginBottom: "0.5rem",
								}}
							>
								Enter Extension
							</h3>
							<p
								style={{
									color: "#6b7280",
									fontSize: "0.875rem",
									lineHeight: "1.5",
								}}
							>
								Type the file extension you want (pdf, jpg, docx, etc.)
							</p>
						</div>
					</div>
					<div
						style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}
					>
						<div
							style={{
								backgroundColor: "#dbeafe",
								color: "#1e40af",
								width: "2rem",
								height: "2rem",
								borderRadius: "50%",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontWeight: "600",
								flexShrink: 0,
							}}
						>
							3
						</div>
						<div>
							<h3
								style={{
									fontSize: "1.125rem",
									fontWeight: "600",
									color: "#1f2937",
									marginBottom: "0.5rem",
								}}
							>
								Extract Files
							</h3>
							<p
								style={{
									color: "#6b7280",
									fontSize: "0.875rem",
									lineHeight: "1.5",
								}}
							>
								Click "Filter" to find all matching files instantly
							</p>
						</div>
					</div>
					<div
						style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}
					>
						<div
							style={{
								backgroundColor: "#dbeafe",
								color: "#1e40af",
								width: "2rem",
								height: "2rem",
								borderRadius: "50%",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontWeight: "600",
								flexShrink: 0,
							}}
						>
							4
						</div>
						<div>
							<h3
								style={{
									fontSize: "1.125rem",
									fontWeight: "600",
									color: "#1f2937",
									marginBottom: "0.5rem",
								}}
							>
								Download ZIP
							</h3>
							<p
								style={{
									color: "#6b7280",
									fontSize: "0.875rem",
									lineHeight: "1.5",
								}}
							>
								Download your organized files as a ZIP archive
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* FAQ Section */}
			<section
				style={{
					...cardStyle,
					marginTop: "2rem",
					width: "100%",
					maxWidth: "48rem",
				}}
			>
				<h2
					style={{
						fontSize: "1.75rem",
						fontWeight: "700",
						color: "#1f2937",
						marginBottom: "1.5rem",
						textAlign: "center",
					}}
				>
					Frequently Asked Questions
				</h2>
				<div
					style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
				>
					<div>
						<h3
							style={{
								fontSize: "1.125rem",
								fontWeight: "600",
								color: "#1f2937",
								marginBottom: "0.5rem",
							}}
						>
							What file types can I extract?
						</h3>
						<p
							style={{
								color: "#6b7280",
								fontSize: "0.875rem",
								lineHeight: "1.6",
							}}
						>
							Extract any file type including PDF, Word documents (DOCX), Excel
							files (XLSX), images (JPG, PNG, GIF), videos (MP4, AVI, MOV),
							audio files (MP3, WAV), text files (TXT), and many more.
						</p>
					</div>
					<div>
						<h3
							style={{
								fontSize: "1.125rem",
								fontWeight: "600",
								color: "#1f2937",
								marginBottom: "0.5rem",
							}}
						>
							Is it free to use?
						</h3>
						<p
							style={{
								color: "#6b7280",
								fontSize: "0.875rem",
								lineHeight: "1.6",
							}}
						>
							Yes, OrganiseFiles is completely free. No registration, no
							downloads, no hidden fees.
						</p>
					</div>
					<div>
						<h3
							style={{
								fontSize: "1.125rem",
								fontWeight: "600",
								color: "#1f2937",
								marginBottom: "0.5rem",
							}}
						>
							Are my files secure?
						</h3>
						<p
							style={{
								color: "#6b7280",
								fontSize: "0.875rem",
								lineHeight: "1.6",
							}}
						>
							Absolutely. All file processing happens in your browser. Your
							files are never uploaded to our servers.
						</p>
					</div>
					<div>
						<h3
							style={{
								fontSize: "1.125rem",
								fontWeight: "600",
								color: "#1f2937",
								marginBottom: "0.5rem",
							}}
						>
							Is there a file size limit?
						</h3>
						<p
							style={{
								color: "#6b7280",
								fontSize: "0.875rem",
								lineHeight: "1.6",
							}}
						>
							No, you can process folders with unlimited file sizes and
							quantities.
						</p>
					</div>
					<div>
						<h3
							style={{
								fontSize: "1.125rem",
								fontWeight: "600",
								color: "#1f2937",
								marginBottom: "0.5rem",
							}}
						>
							Can I extract from nested folders?
						</h3>
						<p
							style={{
								color: "#6b7280",
								fontSize: "0.875rem",
								lineHeight: "1.6",
							}}
						>
							Yes, our tool works with nested folder structures and extracts
							files from all subdirectories.
						</p>
					</div>
				</div>
			</section>

			{/* Related Pages Section */}
			<section
				style={{
					...cardStyle,
					marginTop: "2rem",
					width: "100%",
					maxWidth: "48rem",
				}}
			>
				<h2
					style={{
						fontSize: "1.75rem",
						fontWeight: "700",
						color: "#1f2937",
						marginBottom: "1.5rem",
						textAlign: "center",
					}}
				>
					Popular File Extraction Guides
				</h2>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
						gap: "1.5rem",
					}}
				>
					<div
						style={{
							textAlign: "center",
							padding: "1.5rem",
							background: "#f8fafc",
							borderRadius: "0.5rem",
							border: "1px solid #e5e7eb",
						}}
					>
						<div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📄</div>
						<h3
							style={{
								fontSize: "1.125rem",
								fontWeight: "600",
								color: "#1f2937",
								marginBottom: "0.5rem",
							}}
						>
							<a
								href="/how-to-extract-pdf-files.html"
								style={{ color: "#1f2937", textDecoration: "none" }}
							>
								Extract PDF Files
							</a>
						</h3>
						<p
							style={{
								color: "#6b7280",
								fontSize: "0.875rem",
								lineHeight: "1.5",
								marginBottom: "1rem",
							}}
						>
							Complete guide to extracting PDF documents from folders and
							archives
						</p>
						<a
							href="/how-to-extract-pdf-files.html"
							style={{
								color: "#0ea5e9",
								fontSize: "0.875rem",
								fontWeight: "500",
								textDecoration: "none",
							}}
						>
							Learn More →
						</a>
					</div>
					<div
						style={{
							textAlign: "center",
							padding: "1.5rem",
							background: "#f8fafc",
							borderRadius: "0.5rem",
							border: "1px solid #e5e7eb",
						}}
					>
						<div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🖼️</div>
						<h3
							style={{
								fontSize: "1.125rem",
								fontWeight: "600",
								color: "#1f2937",
								marginBottom: "0.5rem",
							}}
						>
							<a
								href="/organize-photos-by-type.html"
								style={{ color: "#1f2937", textDecoration: "none" }}
							>
								Organize Photos
							</a>
						</h3>
						<p
							style={{
								color: "#6b7280",
								fontSize: "0.875rem",
								lineHeight: "1.5",
								marginBottom: "1rem",
							}}
						>
							Sort and extract JPG, PNG, GIF images from your photo collections
						</p>
						<a
							href="/organize-photos-by-type.html"
							style={{
								color: "#0ea5e9",
								fontSize: "0.875rem",
								fontWeight: "500",
								textDecoration: "none",
							}}
						>
							Learn More →
						</a>
					</div>
				</div>
			</section>

			<footer
				style={{
					marginTop: "4rem",
					paddingTop: "3rem",
					borderTop: "1px solid #d1d5db",
					width: "100%",
					maxWidth: "48rem",
					textAlign: "center",
					fontSize: "0.875rem",
					color: "#6b7280",
				}}
			>
				<div style={{ marginBottom: "2rem" }}>
					<h2
						style={{
							fontSize: "1.25rem",
							fontWeight: "600",
							color: "#1f2937",
							marginBottom: "1rem",
						}}
					>
						How to Extract Files by Type
					</h2>
					<p style={{ marginBottom: "1rem", lineHeight: "1.6" }}>
						OrganiseFiles makes it easy to extract specific file types from any
						folder. Simply drag and drop your files or folders, enter the file
						extension you want to extract (like pdf, jpg, docx, or txt), and
						download your filtered files as a ZIP archive. Perfect for
						organizing documents, extracting images from photo collections, or
						filtering media files.
					</p>
					<p style={{ marginBottom: "1rem", lineHeight: "1.6" }}>
						<strong>Supported file types:</strong> Extract PDFs, Word documents,
						Excel files, images (JPG, PNG, GIF), videos (MP4, AVI, MOV), audio
						files (MP3, WAV), text files, and many more. Works with nested
						folders and unlimited file sizes.
					</p>
				</div>
				<p>
					&copy; 2025 OrganiseFiles.live - Extract Files Online. All rights
					reserved.
				</p>
				<p
					style={{
						fontSize: "0.75rem",
						color: "#9ca3af",
						marginTop: "0.25rem",
					}}
				>
					Free online file extraction tool. No downloads required.
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
