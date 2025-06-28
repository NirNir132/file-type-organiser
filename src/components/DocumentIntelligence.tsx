import React, { useState } from "react";
import { FileText, Upload, AlertTriangle, Download } from "lucide-react";
import SpinnerIcon from "./icons/SpinnerIcon";
import {
	doclingService,
	DocumentAnalysisResult,
} from "../services/doclingService";
import TestFileGenerator from "./TestFileGenerator";

const DocumentIntelligence: React.FC = () => {
	const [file, setFile] = useState<File | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [result, setResult] = useState<DocumentAnalysisResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setFile(e.target.files[0]);
			setError(null);
			setResult(null);
		}
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			setFile(e.dataTransfer.files[0]);
			setError(null);
			setResult(null);
		}
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	};

	const processDocument = async () => {
		if (!file) {
			setError("Please select a file to process");
			return;
		}

		// Check file type
		const allowedTypes = [
			"application/pdf",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"application/msword",
			"image/jpeg",
			"image/png",
			"image/tiff",
		];

		if (!allowedTypes.includes(file.type)) {
			setError(
				"Unsupported file type. Please upload a PDF, DOCX, DOC, JPEG, PNG, or TIFF file."
			);
			return;
		}

		setIsProcessing(true);
		setError(null);

		try {
			// Process the document using our service
			const result = await doclingService.processDocument(file);
			setResult(result);
		} catch (err) {
			setError(
				"An error occurred while processing the document. Please try again."
			);
			console.error("Document processing error:", err);
		} finally {
			setIsProcessing(false);
		}
	};

	const downloadResults = () => {
		if (!result) return;

		// Create a JSON blob
		const jsonData = JSON.stringify(result, null, 2);
		const blob = new Blob([jsonData], { type: "application/json" });
		const url = URL.createObjectURL(blob);

		// Create a download link
		const link = document.createElement("a");
		link.href = url;
		link.download = `${file?.name || "document"}-analysis.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	return (
		<div className="space-y-6">
			<div className="bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl p-8 border border-slate-200/50">
				<div className="text-center mb-8">
					<h2 className="text-3xl font-bold text-slate-800 mb-3">
						Document Processing
					</h2>
					<p className="text-slate-600 max-w-2xl mx-auto">
						Upload a document to extract structured data, analyze layout, and
						gain insights.
					</p>
				</div>

				{/* File Upload Area */}
				<div
					className={`border-2 border-dashed rounded-xl p-8 mb-6 text-center ${
						file
							? "border-green-300 bg-green-50"
							: "border-slate-300 bg-slate-50"
					}`}
					onDrop={handleDrop}
					onDragOver={handleDragOver}
				>
					{file ? (
						<div className="flex flex-col items-center">
							<FileText className="w-16 h-16 text-green-500 mb-4" />
							<p className="text-lg font-medium text-slate-800 mb-2">
								{file.name}
							</p>
							<p className="text-sm text-slate-500 mb-4">
								{(file.size / 1024 / 1024).toFixed(2)} MB
							</p>
							<button
								onClick={() => setFile(null)}
								className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
							>
								Remove File
							</button>
						</div>
					) : (
						<div className="flex flex-col items-center">
							<Upload className="w-16 h-16 text-slate-400 mb-4" />
							<p className="text-lg font-medium text-slate-700 mb-2">
								Drag & drop your document here
							</p>
							<p className="text-sm text-slate-500 mb-4">
								Supports PDF, DOCX, DOC, JPEG, PNG, and TIFF
							</p>
							<label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
								Browse Files
								<input
									type="file"
									className="hidden"
									onChange={handleFileChange}
									accept=".pdf,.docx,.doc,.jpeg,.jpg,.png,.tiff,.tif"
								/>
							</label>
						</div>
					)}
				</div>

				{/* Error Display */}
				{error && (
					<div className="mb-6 p-4 text-sm text-red-800 bg-red-100/90 backdrop-blur-sm rounded-xl border border-red-300/80 shadow-lg flex items-start space-x-3">
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

				{/* Process Button */}
				<div className="flex justify-center mb-8">
					<button
						onClick={processDocument}
						disabled={!file || isProcessing}
						className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
							!file || isProcessing
								? "bg-slate-300 text-slate-500 cursor-not-allowed"
								: "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
						}`}
					>
						{isProcessing ? (
							<>
								<SpinnerIcon className="w-5 h-5" />
								<span>Processing...</span>
							</>
						) : (
							<>
								<FileText className="w-5 h-5" />
								<span>Process Document</span>
							</>
						)}
					</button>
				</div>

				{/* Results Display */}
				{result && (
					<div className="border border-slate-200 rounded-xl overflow-hidden">
						<div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
							<h3 className="font-semibold text-slate-800">
								Processing Results
							</h3>
							<button
								onClick={downloadResults}
								className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
							>
								<Download className="w-4 h-4" />
								<span>Download JSON</span>
							</button>
						</div>
						<div className="p-6">
							{/* Metadata Section */}
							<div className="mb-6">
								<h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
									Document Metadata
								</h4>
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
									<div className="bg-slate-50 p-4 rounded-lg">
										<p className="text-xs text-slate-500 mb-1">Title</p>
										<p className="font-medium text-slate-800">
											{result.layout.title || "Untitled"}
										</p>
									</div>
									<div className="bg-slate-50 p-4 rounded-lg">
										<p className="text-xs text-slate-500 mb-1">Author</p>
										<p className="font-medium text-slate-800">
											{result.metadata.author || "Unknown"}
										</p>
									</div>
									<div className="bg-slate-50 p-4 rounded-lg">
										<p className="text-xs text-slate-500 mb-1">Pages</p>
										<p className="font-medium text-slate-800">
											{result.metadata.pageCount}
										</p>
									</div>
								</div>
							</div>

							{/* Layout Analysis */}
							<div className="mb-6">
								<h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
									Layout Analysis
								</h4>
								<div className="bg-slate-50 p-4 rounded-lg">
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div>
											<p className="text-xs text-slate-500 mb-1">Structure</p>
											<p className="font-medium text-slate-800">
												{result.layout.paragraphs} paragraphs,{" "}
												{result.layout.images} images
											</p>
										</div>
										<div>
											<p className="text-xs text-slate-500 mb-1">Headings</p>
											<p className="font-medium text-slate-800">
												{result.layout.headings.length} sections
											</p>
										</div>
									</div>
									{result.layout.headings.length > 0 && (
										<div className="mt-4">
											<p className="text-xs text-slate-500 mb-2">
												Document Structure
											</p>
											<div className="flex flex-wrap gap-2">
												{result.layout.headings.map((heading, index) => (
													<span
														key={index}
														className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-lg"
													>
														{heading}
													</span>
												))}
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Tables */}
							<div className="mb-6">
								<h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
									Tables Detected
								</h4>
								<div className="bg-slate-50 p-4 rounded-lg overflow-x-auto">
									{result.tables.length > 0 ? (
										<table className="min-w-full divide-y divide-slate-200">
											<thead>
												<tr>
													{result.tables[0].headers.map((header, index) => (
														<th
															key={index}
															className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
														>
															{header}
														</th>
													))}
												</tr>
											</thead>
											<tbody className="divide-y divide-slate-200">
												{result.tables[0].rows.map((row, rowIndex) => (
													<tr key={rowIndex}>
														{row.map((cell, cellIndex) => (
															<td
																key={cellIndex}
																className="px-4 py-2 text-sm text-slate-800"
															>
																{cell}
															</td>
														))}
													</tr>
												))}
											</tbody>
										</table>
									) : (
										<p className="text-slate-600">
											No tables detected in document
										</p>
									)}
								</div>
							</div>

							{/* Text Preview */}
							<div>
								<h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
									Text Preview
								</h4>
								<div className="bg-slate-50 p-4 rounded-lg">
									<p className="text-slate-700 whitespace-pre-wrap">
										{result.text.length > 500
											? `${result.text.substring(0, 500)}...`
											: result.text}
									</p>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Docling Info */}
				<div className="mt-8 p-6 bg-indigo-50 rounded-xl border border-indigo-200">
					<h3 className="text-xl font-bold text-indigo-800 mb-3">
						Powered by Docling
					</h3>
					<p className="text-indigo-700 mb-4">
						This feature uses Docling, an open-source document processing
						toolkit developed by IBM Research. Docling provides advanced
						capabilities for parsing diverse document formats and extracting
						structured data.
					</p>
					<div className="flex flex-col sm:flex-row gap-4">
						<a
							href="https://github.com/docling-project/docling"
							target="_blank"
							rel="noopener noreferrer"
							className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-center"
						>
							Visit GitHub Repository
						</a>
						<a
							href="https://docling-project.github.io/docling/"
							target="_blank"
							rel="noopener noreferrer"
							className="px-4 py-2 bg-white text-indigo-700 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors text-center"
						>
							Learn More
						</a>
					</div>
				</div>
			</div>

			{/* Test File Generator */}
			<TestFileGenerator />
		</div>
	);
};

export default DocumentIntelligence;
