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
	export default class JSZip {
		file(name: string, data: any, options?: any): this;
		folder(name: string): this;
		generateAsync(options: { type: string }): Promise<Blob>;
	}
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
