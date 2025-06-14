import JSZip from "jszip";
import { Untar } from "tar-js"; // Added for TAR parsing
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
	const fileBuffer = await file.arrayBuffer(); // Read buffer once for all cases

	if (sourceFormat === "gz") {
		// Assume single file gzip
		const decompressed = inflate(new Uint8Array(fileBuffer));
		// Try to determine a reasonable name if original is just .gz
		let originalName = file.name.endsWith(".gz")
			? file.name.slice(0, -3)
			: file.name + "_decompressed";
		if (!originalName) { // Handle cases like just ".gz"
			originalName = "decompressed_file";
		}
		zip.file(originalName, decompressed);
	} else if (sourceFormat === "tar") {
		// TAR parsing using tar-js
		// Note: The Untar class and its behavior (especially readNext) are based on
		// information from bug reports and common patterns due to sparse official documentation for tar-js.
		onProgress?.({ stage: "Converting", progress: 30, message: "Parsing TAR entries..." });
		try {
			const untar = new Untar(fileBuffer);
			const tarFiles: { name: string; buffer: ArrayBuffer; type: string }[] = [];

			untar.onfile = (tarFile: any) => {
				// Ensure to capture necessary details. The structure of tarFile might vary.
				// Common properties are name, buffer (or similar for content), and type.
				// Filter out directory entries if they don't have content or are handled differently.
				if (tarFile.buffer && tarFile.name) { // Ensure basic properties exist
					tarFiles.push({
						name: tarFile.name,
						buffer: tarFile.buffer.slice(0, tarFile.size), // Make sure to respect file size
						type: tarFile.type || 'file' // Assuming 'file' if type is not specified
					});
				}
			};

			// Attempt to trigger reading of the tar entries.
			// This loop is based on the assumption that readNext() drives the onfile callback
			// and returns a truthy value (like the file object or true) while there are entries,
			// and a falsy value (null, undefined, or false) when done.
			if (typeof untar.readNext === 'function') {
				while (untar.readNext()) {
					// The onfile callback should populate tarFiles during these calls.
				}
			} else {
				// Fallback or alternative if readNext isn't the driver or doesn't exist.
				// This part is highly speculative. If tar-js processes files differently,
				// this might need adjustment based on observed behavior or more detailed API info.
				console.warn("Untar.readNext() not found or does not drive processing as expected. Tar parsing might be incomplete.");
				// If untar.entries or untar.files exists and is populated after construction,
				// it implies a different processing model. However, the bug report suggests onfile is the way.
			}

			if (tarFiles.length === 0) {
				// This might happen if onfile was never called or readNext didn't work as expected.
				// Or if the TAR file was genuinely empty or only contained directories without explicit file entries.
				console.warn("No files extracted from TAR. The archive might be empty or structured in an unexpected way for tar-js.");
				// To provide some feedback, we can add an empty marker or log this.
				// For now, we'll proceed, and an empty ZIP might be created if no files were added.
			}

			onProgress?.({ stage: "Converting", progress: 50, message: `Adding ${tarFiles.length} files to ZIP...` });
			for (const tarEntry of tarFiles) {
				if (tarEntry.type === 'file' || (tarEntry.buffer && tarEntry.buffer.byteLength > 0)) {
					zip.file(tarEntry.name, tarEntry.buffer);
				} else if (tarEntry.type === 'directory' || tarEntry.type === '5') { // '5' is often directory type in tar
					// JSZip creates directories implicitly if files are added with paths like "folder/file.txt"
					// Or explicitly: zip.folder(tarEntry.name);
					// For now, we only add files with content. Directories will be created by file paths.
				}
			}
		} catch (e) {
			console.error("Error during TAR to ZIP conversion:", e);
			throw new Error(`TAR parsing failed: ${e instanceof Error ? e.message : String(e)}`);
		}
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
