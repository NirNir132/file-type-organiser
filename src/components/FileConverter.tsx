import React, { useState, useCallback } from "react";
import {
	Upload,
	Download,
	FileText,
	Settings,
	AlertCircle,
	CheckCircle,
	Loader,
} from "lucide-react";
import {
	CONVERSION_CATEGORIES,
	getFileExtension,
	getSupportedFormats,
	isConversionSupported,
	formatFileSize,
} from "../services/conversionService";
import { convertImage } from "../services/converters/imageConverter";
import { convertDocument } from "../services/converters/documentConverter";
import {
	convertAudio,
	convertVideo,
} from "../services/converters/mediaConverter";
import { convertArchive } from "../services/converters/archiveConverter";
import { convertSpreadsheet } from "../services/converters/spreadsheetConverter";
import {
	ConversionProgress,
	ConversionResult,
	ConversionOptions,
} from "../types";

interface FileConverterProps {
	className?: string;
}

const FileConverter: React.FC<FileConverterProps> = ({ className = "" }) => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [targetFormat, setTargetFormat] = useState<string>("");
	const [isConverting, setIsConverting] = useState(false);
	const [progress, setProgress] = useState<ConversionProgress | null>(null);
	const [result, setResult] = useState<ConversionResult | null>(null);
	const [options, setOptions] = useState<ConversionOptions>({
		quality: 0.8,
		width: undefined,
		height: undefined,
	});
	const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

	const handleFileSelect = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (file) {
				setSelectedFile(file);
				setTargetFormat("");
				setResult(null);
				setProgress(null);
			}
		},
		[]
	);

	const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		const file = event.dataTransfer.files[0];
		if (file) {
			setSelectedFile(file);
			setTargetFormat("");
			setResult(null);
			setProgress(null);
		}
	}, []);

	const handleDragOver = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault();
		},
		[]
	);

	const sourceFormat = selectedFile ? getFileExtension(selectedFile.name) : "";
	const supportedFormats = sourceFormat
		? getSupportedFormats(sourceFormat)
		: [];

	const handleConvert = useCallback(async () => {
		if (!selectedFile || !targetFormat) return;

		setIsConverting(true);
		setProgress(null);
		setResult(null);

		try {
			let conversionResult: ConversionResult;

			// Route to appropriate converter based on source format
			const category = CONVERSION_CATEGORIES.find((cat) =>
				cat.formats.some((format) => format.from === sourceFormat)
			);

			if (!category) {
				throw new Error(`Unsupported file format: ${sourceFormat}`);
			}

			if (category.name === "Images") {
				conversionResult = await convertImage(
					selectedFile,
					targetFormat,
					options,
					setProgress
				);
			} else if (category.name === "Documents") {
				conversionResult = await convertDocument(
					selectedFile,
					targetFormat,
					options,
					setProgress
				);
			} else if (category.name === "Audio") {
				conversionResult = await convertAudio(
					selectedFile,
					targetFormat,
					options,
					setProgress
				);
			} else if (category.name === "Video") {
				conversionResult = await convertVideo(
					selectedFile,
					targetFormat,
					options,
					setProgress
				);
			} else if (category.name === "Archives") {
				// throw new Error(
				// 	"Archive conversion coming soon - dependencies being resolved"
				// );
				conversionResult = await convertArchive(
					selectedFile,
					targetFormat,
					options,
					setProgress
				);
			} else if (category.name === "Spreadsheets") {
				conversionResult = await convertSpreadsheet(
					selectedFile,
					targetFormat,
					options,
					setProgress
				);
			} else {
				throw new Error(`Converter for ${category.name} not yet implemented`);
			}

			setResult(conversionResult);
		} catch (error) {
			console.error("Conversion error:", error);
			setResult({
				success: false,
				error:
					error instanceof Error ? error.message : "Unknown error occurred",
				originalName: selectedFile.name,
				targetFormat,
			});
		} finally {
			setIsConverting(false);
			setProgress(null);
		}
	}, [selectedFile, targetFormat, options, sourceFormat]);

	const handleDownload = useCallback(() => {
		if (result?.file) {
			const url = URL.createObjectURL(result.file);
			const a = document.createElement("a");
			a.href = url;
			a.download = result.file.name;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}
	}, [result]);

	const resetConverter = useCallback(() => {
		setSelectedFile(null);
		setTargetFormat("");
		setResult(null);
		setProgress(null);
		setIsConverting(false);
	}, []);

	return (
		<div
			className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}
		>
			<div className="p-6">
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center space-x-3">
						<div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
							<FileText className="w-5 h-5 text-blue-600" />
						</div>
						<div>
							<h2 className="text-xl font-semibold text-gray-900">
								File Converter
							</h2>
							<p className="text-sm text-gray-500">
								Convert between different file formats
							</p>
						</div>
					</div>
					{selectedFile && (
						<button
							onClick={resetConverter}
							className="text-sm text-gray-500 hover:text-gray-700"
						>
							Reset
						</button>
					)}
				</div>

				{/* File Upload Area */}
				{!selectedFile && (
					<div
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
					>
						<input
							type="file"
							onChange={handleFileSelect}
							className="hidden"
							id="file-upload"
							accept="*/*"
						/>
						<label htmlFor="file-upload" className="cursor-pointer">
							<Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
							<p className="text-lg font-medium text-gray-600 mb-2">
								Choose a file or drag it here
							</p>
							<p className="text-sm text-gray-500">
								Supports images, documents, and many other formats
							</p>
						</label>
					</div>
				)}

				{/* Selected File Info */}
				{selectedFile && (
					<div className="bg-gray-50 rounded-lg p-4 mb-6">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="font-medium text-gray-900">
									{selectedFile.name}
								</h3>
								<p className="text-sm text-gray-500">
									{formatFileSize(selectedFile.size)} •{" "}
									{sourceFormat.toUpperCase()}
								</p>
							</div>
							<div className="text-right">
								<p className="text-sm text-gray-500">Source Format</p>
								<p className="font-medium text-gray-900">
									{sourceFormat.toUpperCase()}
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Format Selection */}
				{selectedFile && supportedFormats.length > 0 && (
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-3">
							Convert to:
						</label>
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
							{supportedFormats.map((format) => (
								<button
									key={format}
									onClick={() => setTargetFormat(format)}
									className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
										targetFormat === format
											? "bg-blue-50 border-blue-300 text-blue-700"
											: "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
									}`}
								>
									{format.toUpperCase()}
								</button>
							))}
						</div>
					</div>
				)}

				{/* Advanced Options */}
				{selectedFile && targetFormat && (
					<div className="mb-6">
						<button
							onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
							className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
						>
							<Settings className="w-4 h-4" />
							<span>Advanced Options</span>
						</button>

						{showAdvancedOptions && (
							<div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-4">
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
									<div>
										<label className="block text-xs font-medium text-gray-700 mb-1">
											Quality (0.1-1.0)
										</label>
										<input
											type="number"
											min="0.1"
											max="1.0"
											step="0.1"
											value={options.quality || 0.8}
											onChange={(e) =>
												setOptions((prev) => ({
													...prev,
													quality: parseFloat(e.target.value),
												}))
											}
											className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
									<div>
										<label className="block text-xs font-medium text-gray-700 mb-1">
											Width (px)
										</label>
										<input
											type="number"
											value={options.width || ""}
											onChange={(e) =>
												setOptions((prev) => ({
													...prev,
													width: e.target.value
														? parseInt(e.target.value)
														: undefined,
												}))
											}
											className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
											placeholder="Auto"
										/>
									</div>
									<div>
										<label className="block text-xs font-medium text-gray-700 mb-1">
											Height (px)
										</label>
										<input
											type="number"
											value={options.height || ""}
											onChange={(e) =>
												setOptions((prev) => ({
													...prev,
													height: e.target.value
														? parseInt(e.target.value)
														: undefined,
												}))
											}
											className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
											placeholder="Auto"
										/>
									</div>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Convert Button */}
				{selectedFile && targetFormat && (
					<button
						onClick={handleConvert}
						disabled={
							isConverting || !isConversionSupported(sourceFormat, targetFormat)
						}
						className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
					>
						{isConverting ? (
							<>
								<Loader className="w-5 h-5 animate-spin" />
								<span>Converting...</span>
							</>
						) : (
							<>
								<FileText className="w-5 h-5" />
								<span>Convert to {targetFormat.toUpperCase()}</span>
							</>
						)}
					</button>
				)}

				{/* Progress */}
				{progress && (
					<div className="mt-4 p-4 bg-blue-50 rounded-lg">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-blue-900">
								{progress.stage}
							</span>
							<span className="text-sm text-blue-700">
								{progress.progress}%
							</span>
						</div>
						<div className="w-full bg-blue-200 rounded-full h-2">
							<div
								className="bg-blue-600 h-2 rounded-full transition-all duration-300"
								style={{ width: `${progress.progress}%` }}
							/>
						</div>
						<p className="text-xs text-blue-700 mt-2">{progress.message}</p>
					</div>
				)}

				{/* Result */}
				{result && (
					<div className="mt-4">
						{result.success ? (
							<div className="p-4 bg-green-50 rounded-lg">
								<div className="flex items-start space-x-3">
									<CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
									<div className="flex-1">
										<h4 className="font-medium text-green-900">
											Conversion Successful!
										</h4>
										<p className="text-sm text-green-700 mt-1">
											{result.file?.name} •{" "}
											{result.fileSize
												? formatFileSize(result.fileSize)
												: "Unknown size"}
										</p>
										<button
											onClick={handleDownload}
											className="mt-3 inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
										>
											<Download className="w-4 h-4" />
											<span>Download Converted File</span>
										</button>
									</div>
								</div>
							</div>
						) : (
							<div className="p-4 bg-red-50 rounded-lg">
								<div className="flex items-start space-x-3">
									<AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
									<div>
										<h4 className="font-medium text-red-900">
											Conversion Failed
										</h4>
										<p className="text-sm text-red-700 mt-1">{result.error}</p>
									</div>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Supported Formats Info */}
				{!selectedFile && (
					<div className="mt-8">
						<h3 className="text-lg font-medium text-gray-900 mb-4">
							Supported Conversions
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{CONVERSION_CATEGORIES.map((category) => (
								<div key={category.name} className="p-4 bg-gray-50 rounded-lg">
									<div className="flex items-center space-x-2 mb-3">
										<span className="text-2xl">{category.icon}</span>
										<h4 className="font-medium text-gray-900">
											{category.name}
										</h4>
									</div>
									<div className="space-y-2">
										{category.formats.slice(0, 3).map((format) => (
											<div key={format.from} className="text-xs text-gray-600">
												<span className="font-medium">
													{format.from.toUpperCase()}
												</span>
												<span className="mx-1">→</span>
												<span>{format.to.join(", ").toUpperCase()}</span>
											</div>
										))}
										{category.formats.length > 3 && (
											<div className="text-xs text-gray-500">
												+{category.formats.length - 3} more...
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default FileConverter;
