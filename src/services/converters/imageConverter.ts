import {
	ConversionOptions,
	ConversionProgress,
	ConversionResult,
} from "../../types";
// import { convert } from "wasm-imagemagick";

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
		// return await convertWithImageMagick(file, targetFormat, options, onProgress);
		return canvasResult; // Return canvas result even if it failed, for now
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
	onProgress?.({
		stage: "Converting",
		progress: 25,
		message: "Loading HEIC converter...",
	});

	const heic2anyLib = await loadHeic2Any();

	onProgress?.({
		stage: "Converting",
		progress: 50,
		message: "Converting HEIC file...",
	});

	const convertedBlob = await heic2anyLib({
		blob: file,
		toType: `image/${targetFormat}`,
		quality: options.quality || 0.8,
	});

	onProgress?.({
		stage: "Finalizing",
		progress: 90,
		message: "Finalizing conversion...",
	});

	const convertedFile = new File(
		[convertedBlob],
		file.name.replace(/\.[^/.]+$/, `.${targetFormat}`),
		{ type: `image/${targetFormat}` }
	);

	onProgress?.({
		stage: "Complete",
		progress: 100,
		message: "Conversion completed successfully!",
	});

	return {
		success: true,
		file: convertedFile,
		originalName: file.name,
		targetFormat,
		fileSize: convertedFile.size,
	};
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
			onProgress?.({
				stage: "Converting",
				progress: 50,
				message: "Rendering SVG to canvas...",
			});

			canvas.width = options.width || img.width || 800;
			canvas.height = options.height || img.height || 600;

			ctx.fillStyle = "white";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
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
							error: "Failed to convert SVG to blob",
							originalName: file.name,
							targetFormat,
						});
					}
					URL.revokeObjectURL(url);
				},
				`image/${targetFormat}`,
				options.quality || 0.8
			);
		};

		img.onerror = () => {
			URL.revokeObjectURL(url);
			resolve({
				success: false,
				error: "Failed to load SVG image",
				originalName: file.name,
				targetFormat,
			});
		};

		img.src = url;
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

// Comment out the entire ImageMagick function to fix the error
/*
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
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
			originalName: file.name,
			targetFormat,
		};
	}
}
*/
