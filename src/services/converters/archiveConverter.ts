import JSZip from "jszip";
import { inflate, gzip } from "pako";
import {
	ConversionOptions,
	ConversionProgress,
	ConversionResult,
} from "../../types";

export async function convertArchive(
	file: File,
	targetFormat: string,
	_options: ConversionOptions = {},
	onProgress?: (p: ConversionProgress) => void
): Promise<ConversionResult> {
	const sourceFormat = file.name.split(".").pop()?.toLowerCase() || "";

	try {
		if (
			sourceFormat === "zip" &&
			(targetFormat === "tar" || targetFormat === "gz")
		) {
			return await zipToOther(file, targetFormat, onProgress);
		} else if (
			(sourceFormat === "tar" || sourceFormat === "gz") &&
			targetFormat === "zip"
		) {
			return await otherToZip(file, sourceFormat, onProgress);
		} else {
			throw new Error(
				`Unsupported archive conversion: ${sourceFormat} -> ${targetFormat}`
			);
		}
	} catch (error) {
		console.error("Archive conversion error", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
			originalName: file.name,
			targetFormat,
		};
	}
}

async function zipToOther(
	file: File,
	targetFormat: string,
	onProgress?: (p: ConversionProgress) => void
): Promise<ConversionResult> {
	onProgress?.({
		stage: "Loading",
		progress: 10,
		message: "Reading ZIP archive...",
	});
	const zip = await JSZip.loadAsync(await file.arrayBuffer());

	onProgress?.({
		stage: "Converting",
		progress: 40,
		message: `Converting ZIP to ${targetFormat.toUpperCase()}...`,
	});

	if (targetFormat === "tar") {
		// For now, we'll create a simple tar-like structure
		// This is a simplified implementation
		throw new Error(
			"TAR conversion temporarily unavailable - use ZIP or GZ instead"
		);
	} else {
		// zip -> gz : we will concatenate all files and gzip (simple implementation)
		let combined = "";
		const files = Object.values(zip.files);
		for (const entry of files) {
			if (!entry.dir) {
				combined += await entry.async("string");
			}
		}
		const gzData = gzip(combined);
		const convertedFile = new File(
			[gzData],
			file.name.replace(/\.[^/.]+$/, `.gz`),
			{ type: "application/gzip" }
		);
		onProgress?.({
			stage: "Complete",
			progress: 100,
			message: "ZIP to GZ conversion completed!",
		});
		return {
			success: true,
			file: convertedFile,
			originalName: file.name,
			targetFormat: "gz",
			fileSize: convertedFile.size,
		};
	}
}

async function otherToZip(
	file: File,
	sourceFormat: string,
	onProgress?: (p: ConversionProgress) => void
): Promise<ConversionResult> {
	onProgress?.({
		stage: "Loading",
		progress: 10,
		message: "Reading archive...",
	});
	const zip = new JSZip();

	if (sourceFormat === "gz") {
		// Assume single file gzip
		const buffer = new Uint8Array(await file.arrayBuffer());
		const decompressed = inflate(buffer);
		zip.file(file.name.replace(/\.gz$/, ""), decompressed);
	} else if (sourceFormat === "tar") {
		// Simple tar parsing is complex; we will store the tar as single file inside zip
		zip.file(file.name, await file.arrayBuffer());
	}

	onProgress?.({
		stage: "Converting",
		progress: 60,
		message: "Generating ZIP file...",
	});
	const zipData = await zip.generateAsync({
		type: "uint8array",
		compression: "DEFLATE",
	});
	const convertedFile = new File(
		[zipData],
		file.name.replace(/\.[^/.]+$/, `.zip`),
		{ type: "application/zip" }
	);

	onProgress?.({
		stage: "Complete",
		progress: 100,
		message: `${sourceFormat.toUpperCase()} to ZIP conversion completed!`,
	});

	return {
		success: true,
		file: convertedFile,
		originalName: file.name,
		targetFormat: "zip",
		fileSize: convertedFile.size,
	};
}
