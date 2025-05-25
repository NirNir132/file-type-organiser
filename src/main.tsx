import React from "react";
import ReactDOM from "react-dom/client";

// File Type Organizer with Inline Styles
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

	// Inline styles for guaranteed rendering
	const containerStyle: React.CSSProperties = {
		minHeight: "100vh",
		background:
			"linear-gradient(135deg, #e0f2fe 0%, #e8eaf6 50%, #f3e5f5 100%)",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		padding: "3rem 1rem",
		fontFamily: "system-ui, -apple-system, sans-serif",
	};

	const titleStyle: React.CSSProperties = {
		fontSize: "3rem",
		fontWeight: "800",
		background: "linear-gradient(135deg, #0284c7, #4338ca, #7c3aed)",
		WebkitBackgroundClip: "text",
		WebkitTextFillColor: "transparent",
		backgroundClip: "text",
		marginBottom: "1rem",
		textAlign: "center",
	};

	const subtitleStyle: React.CSSProperties = {
		fontSize: "1.125rem",
		color: "#475569",
		maxWidth: "32rem",
		textAlign: "center",
		marginBottom: "3rem",
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
			? "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
			: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
		transform: dragActive ? "scale(1.05)" : "scale(1)",
		marginBottom: "2rem",
	};

	const iconStyle: React.CSSProperties = {
		width: "3rem",
		height: "3rem",
		color: "#94a3b8",
		marginBottom: "1rem",
	};

	const cardStyle: React.CSSProperties = {
		width: "100%",
		maxWidth: "32rem",
		padding: "1.5rem",
		backgroundColor: "#ffffff",
		borderRadius: "1rem",
		boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
		marginBottom: "2rem",
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
	};

	const inputStyle: React.CSSProperties = {
		flex: 1,
		padding: "0.75rem 1rem",
		border: "1px solid #d1d5db",
		borderRadius: "0.5rem",
		fontSize: "1rem",
		outline: "none",
	};

	return (
		<div style={containerStyle}>
			<header>
				<h1 style={titleStyle}>File Type Organizer</h1>
				<p style={subtitleStyle}>
					Effortlessly drag & drop files, specify a file type, and instantly
					download your organized files.
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
							{dragActive ? "Release to Scan Files!" : "Drag & Drop Files Here"}
						</p>
						<p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
							Drop your files and we'll help you organize them by type.
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
							<p style={{ color: "#374151", margin: 0 }}>Processing files...</p>
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
							Found {files.length} files. Enter a file extension to filter:
						</p>

						<div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
							<input
								type="text"
								value={extension}
								onChange={(e) => setExtension(e.target.value)}
								placeholder="e.g., pdf, jpg, txt"
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
											}}
										>
											<div>
												<span
													style={{
														fontSize: "0.875rem",
														fontWeight: "500",
														color: "#1f2937",
													}}
												>
													{file.name}
												</span>
												<span
													style={{
														fontSize: "0.75rem",
														color: "#6b7280",
														marginLeft: "0.5rem",
													}}
												>
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
			`}</style>
		</div>
	);
}

// Clean initialization
const rootElement = document.getElementById("root");
if (rootElement) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(React.createElement(FileTypeOrganizer));
}
