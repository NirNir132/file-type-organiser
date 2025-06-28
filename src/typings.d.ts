declare module "pako";
declare module "tar-stream";
declare module "wasm-imagemagick";

// Add declaration for PDF.js worker
declare module "pdfjs-dist/build/pdf.worker.mjs";

// Add other declarations as needed

// Allow importing images and other assets
declare module "*.svg" {
	import React = require("react");
	export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
	const src: string;
	export default src;
}

declare module "*.png" {
	const content: string;
	export default content;
}

declare module "*.jpg" {
	const content: string;
	export default content;
}

declare module "*.jpeg" {
	const content: string;
	export default content;
}

declare module "*.gif" {
	const content: string;
	export default content;
}

declare module "*.pdf" {
	const content: string;
	export default content;
}

declare module "*.css" {
	const content: { [className: string]: string };
	export default content;
}

// JSZip for handling ZIP files
declare module "jszip" {
	interface JSZipFileOptions {
		base64?: boolean;
		binary?: boolean;
		date?: Date;
		compression?: string;
		comment?: string;
		optimizedBinaryString?: boolean;
		createFolders?: boolean;
		unixPermissions?: number | string;
		dosPermissions?: number;
	}

	interface JSZipGeneratorOptions {
		compression?: string;
		compressionOptions?: {
			level: number;
		};
		type?: string;
		comment?: string;
		mimeType?: string;
		platform?: string;
		encodeFileName?: (filename: string) => string;
	}

	interface JSZipObject {
		name: string;
		dir: boolean;
		date: Date;
		comment: string;
		unixPermissions: number | string | null;
		dosPermissions: number | null;
		options: {
			compression: string;
		};
		async<T>(type: string): Promise<T>;
	}

	interface JSZipFile extends JSZipObject {
		async(type: "string"): Promise<string>;
		async(type: "uint8array"): Promise<Uint8Array>;
		async(type: "arraybuffer"): Promise<ArrayBuffer>;
		async(type: "blob"): Promise<Blob>;
		async(type: "base64"): Promise<string>;
		async(type: "binarystring"): Promise<string>;
		async(type: "nodebuffer"): Promise<Buffer>;
		async(type: "text"): Promise<string>;
		nodeStream(): NodeJS.ReadableStream;
	}

	interface JSZip {
		files: { [key: string]: JSZipFile };
		comment: string;
		root: string;
		clone(): JSZip;
		generate(options?: JSZipGeneratorOptions): any;
		generateAsync(options?: JSZipGeneratorOptions): Promise<any>;
		loadAsync(
			data: string | ArrayBuffer | Blob | Uint8Array,
			options?: JSZipFileOptions
		): Promise<JSZip>;
		file(
			path: string,
			data: string | ArrayBuffer | Uint8Array | Buffer,
			options?: JSZipFileOptions
		): JSZip;
		file(path: string): JSZipObject;
		folder(name: string): JSZip;
		remove(path: string): JSZip;
		filter(
			predicate: (relativePath: string, file: JSZipObject) => boolean
		): Array<JSZipObject>;
	}

	class JSZip {
		constructor();
		static loadAsync(
			data: string | ArrayBuffer | Blob | Uint8Array,
			options?: JSZipFileOptions
		): Promise<JSZip>;
	}

	export default JSZip;
}

// PDF.js for PDF processing
declare module "pdfjs-dist" {
	const pdfjsLib: any;
	export default pdfjsLib;
}

// Mammoth for DOCX processing
declare module "mammoth" {
	export function convertToHtml(
		buffer: ArrayBuffer
	): Promise<{ value: string }>;
}

// jsPDF for PDF generation
declare module "jspdf" {
	export class jsPDF {
		constructor(options?: any);
		text(text: string, x: number, y: number): this;
		setFontSize(size: number): this;
		addPage(): this;
		save(filename: string): void;
		output(type: string): string | ArrayBuffer | Blob;
		html(element: HTMLElement, options?: any): Promise<any>;
	}
}

// jsPDF-AutoTable plugin
declare module "jspdf-autotable" {
	import { jsPDF } from "jspdf";

	interface jsPDF {
		autoTable(options: any): jsPDF;
	}
}

// docx for DOCX generation
declare module "docx" {
	export class Document {
		constructor(options: any);
	}

	export class Paragraph {
		constructor(options: any);
	}

	export class TextRun {
		constructor(options: any);
	}

	export class Table {
		constructor(options: any);
	}

	export class TableRow {
		constructor(options: any);
	}

	export class TableCell {
		constructor(options: any);
	}

	export enum HeadingLevel {
		HEADING_1 = "Heading1",
		HEADING_2 = "Heading2",
		HEADING_3 = "Heading3",
	}

	export namespace Packer {
		function toBlob(document: Document): Promise<Blob>;
	}
}
