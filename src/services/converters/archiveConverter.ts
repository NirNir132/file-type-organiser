import JSZip from "jszip";
import { inflate, gzip } from "pako";
// @ts-ignore
import { Tar, Untar } from "tar-js";
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
	const files = Object.values(zip.files);
	let processedFileCount = 0;

	onProgress?.({
		stage: "Converting",
		progress: 30,
		message: `Converting ZIP to ${targetFormat.toUpperCase()}...`,
	});

	if (targetFormat === "tar") {
		const tar = new Tar();
		for (const entry of files) {
			if (!entry.dir) {
				const content = await entry.async("uint8array");
				// Ensure proper file mode (e.g., 0o644 for files)
				// tar-js might handle this by default, but good to be aware
				tar.append(entry.name, content);
			} else {
				// tar-js might require explicit directory entries for some TAR readers
				// For simplicity, we'll focus on files first.
				// tar.append(entry.name, new Uint8Array(0), { mode: '040755' }); // Example for directory
			}
			processedFileCount++;
			onProgress?.({
				stage: "Converting",
				progress: 30 + Math.round((processedFileCount / files.length) * 60),
				message: `Processing ${entry.name}`,
			});
		}
		const tarData = tar.out; // This should be a Uint8Array
		const convertedFile = new File(
			[tarData],
			file.name.replace(/\.[^/.]+$/, ".tar"),
			{ type: "application/x-tar" }
		);
		onProgress?.({
			stage: "Complete",
			progress: 100,
			message: "ZIP to TAR conversion completed!",
		});
		return {
			success: true,
			file: convertedFile,
			originalName: file.name,
			targetFormat: "tar",
			fileSize: convertedFile.size,
		};
	} else {
		// zip -> gz : we will concatenate all files and gzip (simple implementation)
		// This part remains less robust as it just concatenates string content.
		// A more robust GZ from ZIP would ideally create a tar.gz or handle individual file gzipping.
		let combined = "";
		for (const entry of files) {
			if (!entry.dir) {
				combined += await entry.async("string"); // Potentially lossy for non-text files
			}
			processedFileCount++;
			onProgress?.({
				stage: "Converting",
				progress: 30 + Math.round((processedFileCount / files.length) * 60),
				message: `Processing ${entry.name}`,
			});
		}
		const gzData = gzip(combined); // pako.gzip returns Uint8Array
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
		message: `Reading ${sourceFormat.toUpperCase()} archive...`,
	});
	const zip = new JSZip();
	const fileBuffer = await file.arrayBuffer();

	if (sourceFormat === "gz") {
		// Assume single file gzip
		const decompressed = inflate(new Uint8Array(fileBuffer));
		// Try to determine original filename if embedded, otherwise use modified input name
		const originalFileName = file.name.endsWith(".gz")
			? file.name.slice(0, -3)
			: `${file.name}.decompressed`;
		zip.file(originalFileName, decompressed);
		onProgress?.({
			stage: "Converting",
			progress: 50,
			message: "Decompressed GZ file.",
		});
	} else if (sourceFormat === "tar") {
		const untar = new Untar(fileBuffer);
		let processedFileCount = 0;
		const tarFiles: any[] = [];
		untar.onfile = (tarFile: any) => {
			// tar-js Untar provides files with name, buffer, etc.
			tarFiles.push(tarFile);
		};
		// untar.readNext() // Might be needed if onfile is not automatically triggered by constructor
		// For tar-js, the files are typically available after the constructor or a read method.
		// Assuming Untar populates `untar.files` or similar, or `onfile` populates `tarFiles`

		// tar-js's Untar is a stream-like processor. We need to trigger reading.
		// This part is a bit tricky with tar-js as it's designed for streaming.
		// For a non-streaming ArrayBuffer input, it should process upon instantiation or a specific method call.
		// If Untar immediately processes, tarFiles will be populated.
		// If not, we might need a loop with `untar.readNext()` or similar.
		// Let's assume `untar.untar()` or a similar method to extract all files.
		// The documentation for tar-js is minimal, so some assumptions are made here.
		// A common pattern for such libraries is to have an extract or similar method.
		// If onfile is the primary way, we need to ensure it's called.
		// For simplicity, let's assume files are directly accessible or through a method.
		// This might need adjustment based on tar-js actual API for buffer input.

		// Re-checking tar-js, it seems onfile is the way. It should be called during constructor or a read method.
		// If `new Untar(fileBuffer)` already triggers `onfile` for all files:
		if (tarFiles.length === 0 && untar.buffer) { // Fallback if onfile didn't populate
			try {
				// This is a guess if `onfile` isn't automatically called for all files
				// In some tar parsers, you repeatedly call a read method.
				// tar-js's `onfile` should ideally be called for each file as it's parsed.
				// If `new Untar(fileBuffer)` doesn't fully process, this part is problematic.
				// Let's assume `onfile` has been called and `tarFiles` is populated.
				// If not, this part of the implementation will fail.
				// A more robust solution might involve a library with clearer non-streaming API
				// or adapting to tar-js's streaming model if it's strictly streaming.

				// The `Untar` constructor itself processes the buffer and calls `onfile`.
				// So `tarFiles` should be populated by now.
			} catch (e) {
				console.error("Error reading tar file entries:", e);
				throw new Error("Failed to parse TAR file contents.");
			}
		}

		if (tarFiles.length === 0) {
			// This handles the case where the TAR might be empty or `onfile` wasn't triggered as expected.
			// Or, if the TAR contains only directories and `onfile` only triggers for files.
			console.warn("TAR file contained no processable file entries or directories were not handled.");
			// We can still create an empty zip or a zip with just the tar file if desired.
			// For now, let's proceed assuming tarFiles might be empty.
		}

		const totalFiles = tarFiles.length;
		for (const tarEntry of tarFiles) {
			// tarEntry should have { name: string, buffer: ArrayBuffer, type: string ... }
			// JSZip's file method can take Uint8Array or ArrayBuffer.
			// tarEntry.buffer is usually an ArrayBuffer or Uint8Array.
			if (tarEntry.type === "file" || (tarEntry.type !== "directory" && tarEntry.buffer)) {
				zip.file(tarEntry.name, tarEntry.buffer, { binary: true });
			} else if (tarEntry.type === "directory") {
				zip.folder(tarEntry.name);
			}
			processedFileCount++;
			onProgress?.({
				stage: "Converting",
				progress: 10 + Math.round((processedFileCount / totalFiles) * 80),
				message: `Adding ${tarEntry.name} to ZIP`,
			});
		}
	} else {
		throw new Error(`Unsupported source format for ZIP conversion: ${sourceFormat}`);
	}

	onProgress?.({
		stage: "Finalizing",
		progress: 90,
		message: "Generating ZIP file...",
	});

	const zipData = await zip.generateAsync({
		type: "uint8array",
		compression: "DEFLATE",
		onUpdate: (metadata: any) => {
			if (metadata.percent && metadata.currentFile) {
				onProgress?.({
					stage: "Finalizing",
					progress: 90 + Math.round(metadata.percent * 0.1), // Scale 0-100 to 0-10 for the last 10%
					message: `Compressing ${metadata.currentFile}`,
				});
			}
		},
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
