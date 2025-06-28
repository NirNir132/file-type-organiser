import mammoth from "mammoth";

export interface DocumentAnalysisResult {
	text: string;
	tables: DocumentTable[];
	layout: DocumentLayout;
	metadata: DocumentMetadata;
}

export interface DocumentTable {
	headers: string[];
	rows: string[][];
}

export interface DocumentLayout {
	title?: string;
	headings: string[];
	paragraphs: number;
	images: number;
}

export interface DocumentMetadata {
	author?: string;
	creationDate?: string;
	pageCount: number;
	fileType: string;
	fileSize: number;
}

export class DoclingService {
	/**
	 * Process a document file and extract structured information
	 */
	public async processDocument(file: File): Promise<DocumentAnalysisResult> {
		try {
			// Determine file type
			const fileType = this.getFileType(file);

			// Process based on file type
			if (fileType === "application/pdf") {
				return await this.processPdf(file);
			} else if (
				fileType ===
					"application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
				fileType === "application/msword"
			) {
				return await this.processDocx(file);
			} else if (fileType.startsWith("image/")) {
				return await this.processImage(file);
			} else {
				throw new Error(`Unsupported file type: ${fileType}`);
			}
		} catch (error) {
			console.error("Document processing error:", error);
			throw new Error("Failed to process document. See console for details.");
		}
	}

	private getFileType(file: File): string {
		return file.type || this.getFileTypeFromExtension(file.name);
	}

	private getFileTypeFromExtension(filename: string): string {
		const extension = filename.split(".").pop()?.toLowerCase();
		switch (extension) {
			case "pdf":
				return "application/pdf";
			case "docx":
				return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
			case "doc":
				return "application/msword";
			case "jpg":
			case "jpeg":
				return "image/jpeg";
			case "png":
				return "image/png";
			case "tiff":
			case "tif":
				return "image/tiff";
			default:
				return "application/octet-stream";
		}
	}

	/**
	 * Process PDF files
	 * In a real implementation, this would use PDF.js
	 * For now, we'll use a mock implementation
	 */
	private async processPdf(file: File): Promise<DocumentAnalysisResult> {
		// Simulate processing time
		await new Promise((resolve) => setTimeout(resolve, 1500));

		// Create a mock result
		const fileName = file.name.split(".")[0];

		return {
			text: `This is sample text extracted from the PDF document "${file.name}". In a real implementation, this would contain the actual text content of the document.`,
			tables: [
				{
					headers: ["Column 1", "Column 2", "Column 3"],
					rows: [
						["Data 1", "Data 2", "Data 3"],
						["Data 4", "Data 5", "Data 6"],
						["Data 7", "Data 8", "Data 9"],
					],
				},
			],
			layout: {
				title: fileName,
				headings: [
					"Introduction",
					"Methods",
					"Results",
					"Discussion",
					"Conclusion",
				],
				paragraphs: 12,
				images: 3,
			},
			metadata: {
				author: "Sample Author",
				creationDate: new Date().toISOString().split("T")[0],
				pageCount: 5,
				fileType: "PDF",
				fileSize: file.size,
			},
		};
	}

	/**
	 * Process DOCX files using mammoth
	 */
	private async processDocx(file: File): Promise<DocumentAnalysisResult> {
		try {
			const arrayBuffer = await file.arrayBuffer();

			// Convert DOCX to HTML
			const result = await mammoth.convertToHtml({ arrayBuffer });
			const html = result.value;

			// Parse HTML to extract information
			const parser = new DOMParser();
			const doc = parser.parseFromString(html, "text/html");

			// Extract text
			const fullText = doc.body.textContent || "";

			// Extract headings
			const headingElements = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
			const headings = Array.from(headingElements).map(
				(el) => el.textContent || ""
			);

			// Count paragraphs
			const paragraphElements = doc.querySelectorAll("p");
			const paragraphCount = paragraphElements.length;

			// Count images
			const imageElements = doc.querySelectorAll("img");
			const imageCount = imageElements.length;

			// Extract tables
			const tables = this.extractTablesFromHtml(doc);

			return {
				text: fullText,
				tables,
				layout: {
					title: file.name.split(".")[0],
					headings,
					paragraphs: paragraphCount,
					images: imageCount,
				},
				metadata: {
					pageCount: Math.ceil(fullText.length / 3000), // Rough estimate
					fileType: "DOCX",
					fileSize: file.size,
				},
			};
		} catch (error) {
			console.error("Error processing DOCX file:", error);

			// Fallback to mock data
			return this.createMockDocumentResult(file);
		}
	}

	/**
	 * Process image files
	 */
	private async processImage(file: File): Promise<DocumentAnalysisResult> {
		// Simulate processing time
		await new Promise((resolve) => setTimeout(resolve, 1000));

		return {
			text: "Image content would be extracted using OCR in a full implementation.",
			tables: [],
			layout: {
				title: file.name.split(".")[0],
				headings: [],
				paragraphs: 0,
				images: 1,
			},
			metadata: {
				pageCount: 1,
				fileType: "Image",
				fileSize: file.size,
			},
		};
	}

	/**
	 * Extract tables from HTML
	 */
	private extractTablesFromHtml(doc: Document): DocumentTable[] {
		const tables: DocumentTable[] = [];
		const tableElements = doc.querySelectorAll("table");

		tableElements.forEach((tableEl) => {
			const headers: string[] = [];
			const rows: string[][] = [];

			// Extract headers
			const headerCells = tableEl.querySelectorAll("th");
			headerCells.forEach((cell) => {
				headers.push(cell.textContent || "");
			});

			// If no explicit headers, use first row
			if (headers.length === 0) {
				const firstRow = tableEl.querySelector("tr");
				if (firstRow) {
					const cells = firstRow.querySelectorAll("td");
					cells.forEach((cell) => {
						headers.push(cell.textContent || "");
					});
				}
			}

			// Extract rows
			const rowElements = tableEl.querySelectorAll("tr");
			rowElements.forEach((rowEl, index) => {
				// Skip first row if we used it for headers
				if (headers.length > 0 && index === 0 && headerCells.length === 0) {
					return;
				}

				const rowData: string[] = [];
				const cells = rowEl.querySelectorAll("td");
				cells.forEach((cell) => {
					rowData.push(cell.textContent || "");
				});

				if (rowData.length > 0) {
					rows.push(rowData);
				}
			});

			if (headers.length > 0 && rows.length > 0) {
				tables.push({ headers, rows });
			}
		});

		return tables;
	}

	/**
	 * Create a mock document result for fallback
	 */
	private createMockDocumentResult(file: File): DocumentAnalysisResult {
		const fileName = file.name.split(".")[0];

		return {
			text: `This is sample text extracted from the document "${file.name}". In a real implementation, this would contain the actual text content of the document.`,
			tables: [
				{
					headers: ["Column 1", "Column 2", "Column 3"],
					rows: [
						["Data 1", "Data 2", "Data 3"],
						["Data 4", "Data 5", "Data 6"],
					],
				},
			],
			layout: {
				title: fileName,
				headings: ["Introduction", "Methods", "Results", "Conclusion"],
				paragraphs: 8,
				images: 2,
			},
			metadata: {
				author: "Sample Author",
				creationDate: new Date().toISOString().split("T")[0],
				pageCount: 3,
				fileType: file.type || "Unknown",
				fileSize: file.size,
			},
		};
	}
}

export const doclingService = new DoclingService();
