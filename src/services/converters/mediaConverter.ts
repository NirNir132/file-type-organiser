import {
	ConversionOptions,
	ConversionProgress,
	ConversionResult,
} from "../../types";

// Lazy load FFmpeg
let ffmpeg: any = null;
let fetchFile: any = null;

async function loadFFmpeg() {
	if (!ffmpeg) {
		// Dynamic import to avoid heavy bundle on initial load
		const ffmpegModule: any = await import("@ffmpeg/ffmpeg");
		const { createFFmpeg, fetchFile: fetchFileFn } = ffmpegModule;
		fetchFile = fetchFileFn;
		ffmpeg = createFFmpeg({ log: true });
		await ffmpeg.load();
	}
	return ffmpeg;
}

function getMimeType(format: string, isVideo: boolean): string {
	if (isVideo) {
		switch (format) {
			case "mp4":
				return "video/mp4";
			case "avi":
				return "video/x-msvideo";
			case "mov":
				return "video/quicktime";
			case "mkv":
				return "video/x-matroska";
			case "webm":
				return "video/webm";
			case "gif":
				return "image/gif";
			default:
				return "video/mp4";
		}
	} else {
		switch (format) {
			case "mp3":
				return "audio/mpeg";
			case "wav":
				return "audio/wav";
			case "ogg":
				return "audio/ogg";
			case "m4a":
				return "audio/mp4";
			case "flac":
				return "audio/flac";
			case "aac":
				return "audio/aac";
			default:
				return "audio/mpeg";
		}
	}
}

async function convertWithFFmpeg(
	file: File,
	targetFormat: string,
	ffmpegCommand: string[],
	_options: ConversionOptions,
	isVideo: boolean,
	onProgress?: (p: ConversionProgress) => void
): Promise<ConversionResult> {
	try {
		const ffmpegInstance = await loadFFmpeg();

		onProgress?.({
			stage: "Loading",
			progress: 0,
			message: "Loading FFmpeg core...",
		});

		// Hook into ffmpeg progress events
		ffmpegInstance.setProgress(({ ratio }: { ratio: number }) => {
			// ratio is between 0 and 1 during run()
			const percent = 30 + Math.round(ratio * 40); // Map to 30-70 range
			onProgress?.({
				stage: "Converting",
				progress: percent,
				message: "Processing media...",
			});
		});

		// Write input file to FFmpeg FS
		const inputName = `input.${file.name.split(".").pop()}`;
		ffmpegInstance.FS("writeFile", inputName, await fetchFile(file));

		onProgress?.({
			stage: "Converting",
			progress: 30,
			message: "Running FFmpeg command...",
		});

		await ffmpegInstance.run(...ffmpegCommand);

		// After run we can't get ratio; but we can register progress earlier

		onProgress?.({
			stage: "Finalizing",
			progress: 70,
			message: "Reading converted file...",
		});

		const outputName = `output.${targetFormat}`;
		const data = ffmpegInstance.FS("readFile", outputName);

		const mimeType = getMimeType(targetFormat, isVideo);
		const convertedFile = new File(
			[data.buffer],
			file.name.replace(/\.[^/.]+$/, `.${targetFormat}`),
			{ type: mimeType }
		);

		onProgress?.({
			stage: "Complete",
			progress: 100,
			message: "Conversion completed successfully!",
		});

		// Clean up FS
		ffmpegInstance.FS("unlink", inputName);
		ffmpegInstance.FS("unlink", outputName);

		return {
			success: true,
			file: convertedFile,
			originalName: file.name,
			targetFormat,
			fileSize: convertedFile.size,
		};
	} catch (error) {
		console.error("FFmpeg conversion error", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
			originalName: file.name,
			targetFormat,
		};
	}
}

export async function convertAudio(
	file: File,
	targetFormat: string,
	options: ConversionOptions = {},
	onProgress?: (p: ConversionProgress) => void
): Promise<ConversionResult> {
	// Basic command: ffmpeg -i input.ext output.target
	const ffmpegCmd = [
		"-i",
		`input.${file.name.split(".").pop()}`,
		// Optional bitrate
		...(options.bitrate ? ["-b:a", `${options.bitrate}k`] : []),
		"output." + targetFormat,
	];
	return await convertWithFFmpeg(
		file,
		targetFormat,
		ffmpegCmd,
		options,
		false,
		onProgress
	);
}

export async function convertVideo(
	file: File,
	targetFormat: string,
	options: ConversionOptions = {},
	onProgress?: (p: ConversionProgress) => void
): Promise<ConversionResult> {
	// Basic command: ffmpeg -i input.ext -c:v libx264 -preset veryfast -crf 23 output.target
	const ffmpegCmd = [
		"-i",
		`input.${file.name.split(".").pop()}`,
		// Use default codec parameters; could be extended with options
		"-c:v",
		"libx264",
		"-preset",
		"veryfast",
		"-crf",
		"23",
		...(options.bitrate ? ["-b:v", `${options.bitrate}k`] : []),
		"output." + targetFormat,
	];
	return await convertWithFFmpeg(
		file,
		targetFormat,
		ffmpegCmd,
		options,
		true,
		onProgress
	);
}
