import {
	ConversionOptions,
	ConversionProgress,
	ConversionResult,
} from "../../types";
import { convert } from "wasm-imagemagick";

// Lazy load heic2any for HEIC conversions
let heic2any: any = null;

async function loadHeic2Any() {
	if (!heic2any) {
		heic2any = (await import("heic2any")).default;
	}
	return heic2any;
}

export async function convertImage(
	file: File,
	targetFormat: string,
	options: ConversionOptions = {},
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	try {
		onProgress?.({
			stage: "Loading",
			progress: 0,
			message: "Loading image file...",
		});

		const sourceFormat = file.name.split(".").pop()?.toLowerCase() || "";

		// Handle HEIC files specially
		if (sourceFormat === "heic" || sourceFormat === "heif") {
			return await convertHeicImage(file, targetFormat, options, onProgress);
		}

		// Handle SVG files specially
		if (sourceFormat === "svg") {
			return await convertSvgImage(file, targetFormat, options, onProgress);
		}

		// For other image formats, attempt Canvas conversion first
		const canvasResult = await convertStandardImage(
			file,
			targetFormat,
			options,
			onProgress
		);

		if (canvasResult.success) {
			return canvasResult;
		}

		// Fallback to ImageMagick WASM for broader format support
		if (!canvasResult.success) {
			onProgress?.({
				stage: "Fallback",
				progress: 0,
				message: "Canvas conversion failed. Attempting ImageMagick...",
			});
			try {
				const magickResult = await convertWithImageMagick(
					file,
					targetFormat,
					options,
					onProgress
				);
				if (magickResult.success) {
					return magickResult;
				}
				// If ImageMagick also fails, return its error or a combined one
				return {
					...magickResult, // contains error from magick
					error: `Canvas failed: ${canvasResult.error}. ImageMagick failed: ${magickResult.error}`,
				};
			} catch (magickError) {
				// Catch errors during the ImageMagick conversion attempt itself
				console.error("ImageMagick fallback error:", magickError);
				return {
					success: false,
					error: `Canvas conversion failed: ${
						canvasResult.error
					}. ImageMagick fallback also failed: ${
						magickError instanceof Error ? magickError.message : String(magickError)
					}`,
					originalName: file.name,
					targetFormat,
				};
			}
		}
		return canvasResult; // Return canvas result if it succeeded
	} catch (error) {
		console.error("Image conversion error:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Unknown conversion error",
			originalName: file.name,
			targetFormat,
		};
	}
}

async function convertHeicImage(
	file: File,
	targetFormat: string,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	try {
		onProgress?.({
			stage: "Converting",
			progress: 25,
			message: "Loading HEIC converter...",
		});

		const heic2anyLib = await loadHeic2Any();
		if (!heic2anyLib) {
			throw new Error("HEIC conversion library (heic2any) failed to load.");
		}

		onProgress?.({
			stage: "Converting",
			progress: 50,
			message: "Converting HEIC file...",
		});

		const targetMimeType = `image/${targetFormat.toLowerCase()}`;
		// heic2any might throw an error for unsupported target types or other issues
		const convertedBlob = (await heic2anyLib({
			blob: file,
			toType: targetMimeType,
			quality: options.quality, // heic2any handles undefined quality
		})) as Blob | Blob[]; // heic2any can return a single blob or an array for multi-image HEICs

		const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

		if (!finalBlob) {
			throw new Error(
				`HEIC conversion resulted in an empty blob. Target format: ${targetFormat}`
			);
		}

		onProgress?.({
			stage: "Finalizing",
			progress: 90,
			message: "Finalizing HEIC conversion...",
		});

		const outputFileName = file.name.replace(/\.[^/.]+$/, `.${targetFormat}`);
		const convertedFile = new File([finalBlob], outputFileName, {
			type: targetMimeType,
		});

		onProgress?.({
			stage: "Complete",
			progress: 100,
			message: "HEIC conversion completed successfully!",
		});

		return {
			success: true,
			file: convertedFile,
			originalName: file.name,
			targetFormat,
			fileSize: convertedFile.size,
		};
	} catch (error) {
		console.error("HEIC conversion error:", error);
		return {
			success: false,
			error: `HEIC conversion failed: ${
				error instanceof Error ? error.message : String(error)
			}`,
			originalName: file.name,
			targetFormat,
		};
	}
}

async function convertSvgImage(
	file: File,
	targetFormat: string,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	onProgress?.({
		stage: "Converting",
		progress: 25,
		message: "Reading SVG file...",
	});

	const svgText = await file.text();
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d")!;

	const img = new Image();
	const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
	const url = URL.createObjectURL(svgBlob);

	return new Promise((resolve) => {
		img.onload = () => {
			try {
				onProgress?.({
					stage: "Converting",
					progress: 50,
					message: "Rendering SVG to canvas...",
				});

				canvas.width = options.width || img.naturalWidth || 800;
				canvas.height = options.height || img.naturalHeight || 600;

				// Ensure canvas is clean, especially for formats that don't support transparency well by default (e.g. JPG)
				if (targetFormat === "jpg" || targetFormat === "jpeg") {
					ctx.fillStyle = "white"; // White background for JPG
					ctx.fillRect(0, 0, canvas.width, canvas.height);
				} else {
					ctx.clearRect(0, 0, canvas.width, canvas.height); // Transparent background for others
				}
				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

				onProgress?.({
					stage: "Finalizing",
					progress: 75,
					message: "Converting to target format...",
				});

				canvas.toBlob(
					(blob) => {
						if (blob) {
							const convertedFile = new File(
								[blob],
								file.name.replace(/\.[^/.]+$/, `.${targetFormat}`),
								{ type: `image/${targetFormat}` }
							);

							onProgress?.({
								stage: "Complete",
								progress: 100,
								message: "SVG Conversion completed successfully!",
							});

							resolve({
								success: true,
								file: convertedFile,
								originalName: file.name,
								targetFormat,
								fileSize: convertedFile.size,
							});
						} else {
							console.error("SVG toBlob callback received null blob");
							resolve({
								success: false,
								error: `Failed to convert SVG to blob (target: ${targetFormat})`,
								originalName: file.name,
								targetFormat,
							});
						}
						URL.revokeObjectURL(url);
					},
					`image/${targetFormat}`,
					options.quality || 0.8
				);
			} catch (e) {
				console.error("Error during SVG rendering:", e);
				URL.revokeObjectURL(url);
				resolve({
					success: false,
					error: `SVG rendering error: ${e instanceof Error ? e.message : String(e)}`,
					originalName: file.name,
					targetFormat,
				});
			}
		};

		img.onerror = (e) => {
			URL.revokeObjectURL(url);
			console.error("Error loading SVG into Image element:", e);
			resolve({
				success: false,
				error: "Failed to load SVG image for conversion. The SVG might be invalid or contain unsupported features.",
				originalName: file.name,
				targetFormat,
			});
		};

		img.src = url; // Start loading the SVG
	});
}

async function convertStandardImage(
	file: File,
	targetFormat: string,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	return new Promise((resolve) => {
		const img = new Image();
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d")!;

		img.onload = () => {
			onProgress?.({
				stage: "Converting",
				progress: 50,
				message: "Drawing image to canvas...",
			});

			// Set canvas dimensions
			canvas.width = options.width || img.width;
			canvas.height = options.height || img.height;

			// Handle PNG to JPG conversion (add white background)
			if (targetFormat === "jpg" || targetFormat === "jpeg") {
				ctx.fillStyle = "white";
				ctx.fillRect(0, 0, canvas.width, canvas.height);
			}

			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

			onProgress?.({
				stage: "Finalizing",
				progress: 75,
				message: "Converting to target format...",
			});

			canvas.toBlob(
				(blob) => {
					if (blob) {
						const convertedFile = new File(
							[blob],
							file.name.replace(/\.[^/.]+$/, `.${targetFormat}`),
							{ type: `image/${targetFormat}` }
						);

						onProgress?.({
							stage: "Complete",
							progress: 100,
							message: "Conversion completed successfully!",
						});

						resolve({
							success: true,
							file: convertedFile,
							originalName: file.name,
							targetFormat,
							fileSize: convertedFile.size,
						});
					} else {
						resolve({
							success: false,
							error: "Failed to convert image to blob",
							originalName: file.name,
							targetFormat,
						});
					}
				},
				`image/${targetFormat}`,
				options.quality || 0.8
			);
		};

		img.onerror = () => {
			resolve({
				success: false,
				error: "Failed to load image file",
				originalName: file.name,
				targetFormat,
			});
		};

		onProgress?.({
			stage: "Loading",
			progress: 25,
			message: "Loading image data...",
		});
		img.src = URL.createObjectURL(file);
	});
}

async function convertWithImageMagick(
	file: File,
	targetFormat: string,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	try {
		onProgress?.({
			stage: "Loading",
			progress: 10,
			message: "Loading ImageMagick core...",
		});

		const inputName = `input.${file.name.split(".").pop()}`;
		const outputName = `output.${targetFormat}`;

		const arrayBuffer = await file.arrayBuffer();
		const inputFiles = [
			{ name: inputName, data: new Uint8Array(arrayBuffer) },
		];

		onProgress?.({
			stage: "Converting",
			progress: 40,
			message: "Running convert command...",
		});

		const result = await convert({
			inputFiles,
			commands: [inputName, outputName],
		});

		onProgress?.({
			stage: "Finalizing",
			progress: 80,
			message: "Generating output file...",
		});

		const outputFile = result.outputFiles[0];
		const blob = new Blob([outputFile.data], { type: `image/${targetFormat}` });
		const convertedFile = new File(
			[blob],
			file.name.replace(/\.[^/.]+$/, `.${targetFormat}`),
			{ type: `image/${targetFormat}` }
		);

		onProgress?.({
			stage: "Complete",
			progress: 100,
			message: "Conversion completed via ImageMagick!",
		});

		return {
			success: true,
			file: convertedFile,
			originalName: file.name,
			targetFormat,
			fileSize: convertedFile.size,
		};
	} catch (error) {
		console.error("ImageMagick conversion failed", error);
		// Ensure the error message is a string
		const errorMessage = error instanceof Error ? error.message :
			(typeof error === 'string' ? error : "Unknown ImageMagick error");

		// Check if the error is due to wasm-imagemagick specific issues like download failure
		// The specific error message " शर्त: NetworkError when attempting to fetch resource" might be browser/language specific.
		// A more generic check for "fetch" or "NetworkError" might be better, or if wasm-imagemagick throws a specific error type.
		if (errorMessage.includes("NetworkError") || errorMessage.includes("fetch")) {
			return {
				success: false,
				error: "Failed to download ImageMagick components. Check network connection or CDN access.",
				originalName: file.name,
				targetFormat,
			};
		}

		return {
			success: false,
			error: errorMessage,
			originalName: file.name,
			targetFormat,
		};
	}
}
