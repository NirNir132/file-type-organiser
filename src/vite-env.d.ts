/// <reference types="vite/client" />

// CSS modules
declare module "*.css" {
	const css: { [key: string]: string };
	export default css;
}

// CSS files
declare module "*.css" {
	const css: string;
	export default css;
}

// Global JSZip type (for CDN version)
declare global {
	var JSZip: any;
}

// Type declarations for conversion libraries
declare module "heic2any" {
	interface ConvertOptions {
		blob: Blob;
		toType: string;
		quality?: number;
	}

	function convert(options: ConvertOptions): Promise<Blob>;
	export default convert;
}

declare module "mammoth" {
	interface ConvertToHtmlOptions {
		convertImage?: any;
		styleMap?: string[];
		includeDefaultStyleMap?: boolean;
	}

	interface ConvertResult {
		value: string;
		messages: any[];
	}

	export function convertToHtml(
		options: { arrayBuffer: ArrayBuffer } & ConvertToHtmlOptions
	): Promise<ConvertResult>;
	export function extractRawText(options: {
		arrayBuffer: ArrayBuffer;
	}): Promise<ConvertResult>;
}

declare module "@ffmpeg/ffmpeg" {
	export class FFmpeg {
		load(): Promise<void>;
		writeFile(name: string, data: Uint8Array): Promise<void>;
		exec(args: string[]): Promise<void>;
		readFile(name: string): Promise<Uint8Array>;
		on(event: string, callback: (data: any) => void): void;
	}
}

declare module "@ffmpeg/util" {
	export function fetchFile(file: File | string): Promise<Uint8Array>;
}

declare module "html2canvas" {
	interface Options {
		allowTaint?: boolean;
		backgroundColor?: string;
		canvas?: HTMLCanvasElement;
		foreignObjectRendering?: boolean;
		imageTimeout?: number;
		ignoreElements?: (element: Element) => boolean;
		logging?: boolean;
		onclone?: (clonedDoc: Document, element: HTMLElement) => void;
		proxy?: string;
		removeContainer?: boolean;
		scale?: number;
		useCORS?: boolean;
		width?: number;
		height?: number;
		windowWidth?: number;
		windowHeight?: number;
		scrollX?: number;
		scrollY?: number;
	}

	function html2canvas(
		element: HTMLElement,
		options?: Options
	): Promise<HTMLCanvasElement>;
	export default html2canvas;
}

declare module "pdf-lib" {
	export class PDFDocument {
		static load(data: ArrayBuffer): Promise<PDFDocument>;
		static create(): Promise<PDFDocument>;
		addPage(size?: [number, number]): PDFPage;
		embedPng(data: ArrayBuffer): Promise<PDFImage>;
		embedJpg(data: ArrayBuffer): Promise<PDFImage>;
		save(): Promise<Uint8Array>;
	}

	export class PDFPage {
		drawImage(
			image: PDFImage,
			options: {
				x: number;
				y: number;
				width: number;
				height: number;
			}
		): void;
	}

	export class PDFImage {}
}

declare module "jspdf" {
	interface jsPDFOptions {
		orientation?: "portrait" | "landscape";
		unit?: "pt" | "mm" | "cm" | "in";
		format?: string | [number, number];
		compress?: boolean;
	}

	export default class jsPDF {
		constructor(options?: jsPDFOptions);
		text(text: string, x: number, y: number, options?: any): jsPDF;
		setFontSize(size: number): jsPDF;
		setFont(fontName: string, fontStyle?: string): jsPDF;
		addPage(
			format?: string | [number, number],
			orientation?: "portrait" | "landscape"
		): jsPDF;
		html(
			element: HTMLElement | string,
			options?: {
				callback?: (pdf: jsPDF) => void;
				x?: number;
				y?: number;
				width?: number;
				windowWidth?: number;
				margin?: number | [number, number, number, number];
				autoPaging?: boolean | "text" | "slice";
				html2canvas?: any;
				jsPDF?: jsPDF;
			}
		): Promise<jsPDF>;
		save(filename?: string): jsPDF;
		output(
			type?:
				| "blob"
				| "bloburi"
				| "dataurlstring"
				| "dataurlnewwindow"
				| "datauri"
		): any;
		internal: {
			pageSize: {
				width: number;
				height: number;
			};
		};
	}
}

declare module "jspdf-autotable" {
	interface AutoTableOptions {
		head?: any[][];
		body?: any[][];
		startY?: number;
		margin?: { top?: number; right?: number; bottom?: number; left?: number };
		pageBreak?: "auto" | "avoid" | "always";
		theme?: "striped" | "grid" | "plain";
		styles?: any;
		headStyles?: any;
		bodyStyles?: any;
	}

	export default function autoTable(doc: any, options: AutoTableOptions): void;
}

declare module "xlsx" {
	interface WorkBook {
		SheetNames: string[];
		Sheets: { [key: string]: WorkSheet };
	}

	interface WorkSheet {
		[key: string]: any;
	}

	export function read(data: ArrayBuffer, options?: any): WorkBook;
	export function write(workbook: WorkBook, options?: any): ArrayBuffer;
	export const utils: {
		sheet_to_csv(worksheet: WorkSheet): string;
		json_to_sheet(data: any[]): WorkSheet;
		book_new(): WorkBook;
		book_append_sheet(
			workbook: WorkBook,
			worksheet: WorkSheet,
			name: string
		): void;
	};
}
