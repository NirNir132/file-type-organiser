import * as XLSX from "xlsx";
import {
	ConversionOptions,
	ConversionProgress,
	ConversionResult,
} from "../../types";

export async function convertSpreadsheet(
	file: File,
	targetFormat: string,
	_options: ConversionOptions = {},
	onProgress?: (p: ConversionProgress) => void
): Promise<ConversionResult> {
	const sourceFormat = file.name.split(".").pop()?.toLowerCase() || "";
	try {
		onProgress?.({
			stage: "Loading",
			progress: 10,
			message: "Reading spreadsheet...",
		});
		const arrayBuffer = await file.arrayBuffer();
		const wb = XLSX.read(arrayBuffer, { type: "array" });

		onProgress?.({
			stage: "Converting",
			progress: 50,
			message: "Generating output...",
		});

		let outData: ArrayBuffer;
		let mimeType = "text/csv";
		if (targetFormat === "csv") {
			outData = XLSX.write(wb, {
				type: "array",
				bookType: "csv",
			}) as ArrayBuffer;
			mimeType = "text/csv";
		} else if (targetFormat === "xlsx") {
			outData = XLSX.write(wb, {
				type: "array",
				bookType: "xlsx",
			}) as ArrayBuffer;
			mimeType =
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
		} else if (targetFormat === "xls") {
			outData = XLSX.write(wb, {
				type: "array",
				bookType: "xls",
			}) as ArrayBuffer;
			mimeType = "application/vnd.ms-excel";
		} else if (targetFormat === "ods") {
			outData = XLSX.write(wb, {
				type: "array",
				bookType: "ods",
			}) as ArrayBuffer;
			mimeType = "application/vnd.oasis.opendocument.spreadsheet";
		} else if (targetFormat === "pdf") {
			// Convert to PDF via browser print - placeholder
			throw new Error(
				"Spreadsheet to PDF conversion requires additional implementation"
			);
		} else {
			throw new Error(
				`Unsupported spreadsheet conversion: ${sourceFormat} -> ${targetFormat}`
			);
		}

		onProgress?.({
			stage: "Complete",
			progress: 100,
			message: "Conversion completed!",
		});

		const convertedFile = new File(
			[outData],
			file.name.replace(/\.[^/.]+$/, `.${targetFormat}`),
			{ type: mimeType }
		);

		return {
			success: true,
			file: convertedFile,
			originalName: file.name,
			targetFormat,
			fileSize: convertedFile.size,
		};
	} catch (error) {
		console.error("Spreadsheet conversion error", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
			originalName: file.name,
			targetFormat,
		};
	}
}
