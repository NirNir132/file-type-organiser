import { ConversionCategory, ConversionProgress } from "../types";

// Supported conversion formats organized by category
export const CONVERSION_CATEGORIES: ConversionCategory[] = [
	{
		name: "Documents",
		icon: "📄",
		formats: [
			{ from: "pdf", to: ["docx", "txt", "jpg", "png"] },
			{ from: "docx", to: ["pdf", "txt"] },
			{ from: "doc", to: ["pdf", "txt", "docx"] },
			{ from: "txt", to: ["pdf", "docx"] },
			{ from: "rtf", to: ["pdf", "txt", "docx"] },
		],
	},
	{
		name: "Images",
		icon: "🖼️",
		formats: [
			{ from: "jpg", to: ["png", "webp", "bmp", "gif"] },
			{ from: "jpeg", to: ["png", "webp", "bmp", "gif"] },
			{ from: "png", to: ["jpg", "webp", "bmp", "gif"] },
			{ from: "webp", to: ["jpg", "png", "gif"] },
			{ from: "bmp", to: ["jpg", "png", "webp"] },
			{ from: "gif", to: ["jpg", "png", "webp"] },
			{ from: "heic", to: ["jpg", "png"] },
			{ from: "tiff", to: ["jpg", "png"] },
			{ from: "svg", to: ["png", "jpg"] },
		],
	},
	{
		name: "Audio",
		icon: "🎵",
		formats: [
			{ from: "mp3", to: ["wav", "ogg", "m4a", "flac"] },
			{ from: "wav", to: ["mp3", "ogg", "m4a"] },
			{ from: "ogg", to: ["mp3", "wav", "m4a"] },
			{ from: "m4a", to: ["mp3", "wav", "ogg"] },
			{ from: "flac", to: ["mp3", "wav", "ogg"] },
			{ from: "aac", to: ["mp3", "wav"] },
		],
	},
	{
		name: "Video",
		icon: "🎬",
		formats: [
			{ from: "mp4", to: ["avi", "mov", "mkv", "webm", "gif"] },
			{ from: "avi", to: ["mp4", "mov", "mkv", "webm"] },
			{ from: "mov", to: ["mp4", "avi", "mkv", "webm"] },
			{ from: "mkv", to: ["mp4", "avi", "mov", "webm"] },
			{ from: "webm", to: ["mp4", "avi", "mov"] },
			{ from: "flv", to: ["mp4", "avi"] },
		],
	},
	{
		name: "Archives",
		icon: "📦",
		formats: [
			{ from: "zip", to: ["tar", "gz"] },
			{ from: "rar", to: ["zip"] },
			{ from: "tar", to: ["zip"] },
			{ from: "7z", to: ["zip"] },
		],
	},
	{
		name: "Spreadsheets",
		icon: "📊",
		formats: [
			{ from: "csv", to: ["xlsx", "xls", "ods"] },
			{ from: "xlsx", to: ["csv", "xls", "pdf"] },
			{ from: "xls", to: ["csv", "xlsx", "pdf"] },
			{ from: "ods", to: ["csv", "xlsx"] },
		],
	},
];

// Utility functions
export function getFileExtension(filename: string): string {
	return filename.split(".").pop()?.toLowerCase() || "";
}

export function getSupportedFormats(fromFormat: string): string[] {
	for (const category of CONVERSION_CATEGORIES) {
		const format = category.formats.find((f) => f.from === fromFormat);
		if (format) {
			return format.to;
		}
	}
	return [];
}

export function isConversionSupported(
	fromFormat: string,
	toFormat: string
): boolean {
	const supportedFormats = getSupportedFormats(fromFormat);
	return supportedFormats.includes(toFormat);
}

export function getCategoryByFormat(format: string): ConversionCategory | null {
	for (const category of CONVERSION_CATEGORIES) {
		if (
			category.formats.some((f) => f.from === format || f.to.includes(format))
		) {
			return category;
		}
	}
	return null;
}

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Progress tracking helper
export function createProgressCallback(
	onProgress: (progress: ConversionProgress) => void
) {
	return {
		updateProgress: (stage: string, progress: number, message: string) => {
			onProgress({ stage, progress, message });
		},
	};
}
