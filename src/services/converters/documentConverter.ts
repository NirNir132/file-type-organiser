import {
	ConversionOptions,
	ConversionProgress,
	ConversionResult,
} from "../../types";

// Lazy load libraries
let pdfLib: any = null;
let mammoth: any = null;
let html2canvas: any = null;
let jsPDF: any = null;
let pdfjsLib: any = null;
let docxLib: any = null;

async function loadPdfLib() {
	if (!pdfLib) {
		pdfLib = await import("pdf-lib");
	}
	return pdfLib;
}

async function loadMammoth() {
	if (!mammoth) {
		mammoth = await import("mammoth");
	}
	return mammoth;
}

async function loadHtml2Canvas() {
	if (!html2canvas) {
		const module = await import("html2canvas");
		html2canvas = module.default;
	}
	return html2canvas;
}

async function loadJsPDF() {
	if (!jsPDF) {
		const module = await import("jspdf");
		jsPDF = module.default;
	}
	return jsPDF;
}

async function loadPdfJs() {
	if (!pdfjsLib) {
		pdfjsLib = await import("pdfjs-dist");
		// Set up worker path for PDF.js
		pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
			"pdfjs-dist/build/pdf.worker.min.js",
			import.meta.url
		).toString();
	}
	return pdfjsLib;
}

async function loadDocx() {
	if (!docxLib) {
		docxLib = await import("docx");
	}
	return docxLib;
}

export async function convertDocument(
	file: File,
	targetFormat: string,
	options: ConversionOptions = {},
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	try {
		onProgress?.({
			stage: "Initializing",
			progress: 0,
			message: "Preparing document conversion...",
		});

		const sourceFormat = file.name.split(".").pop()?.toLowerCase() || "";

		switch (sourceFormat) {
			case "pdf":
				return await convertFromPdf(file, targetFormat, options, onProgress);
			case "docx":
			case "doc":
				return await convertFromWord(file, targetFormat, options, onProgress);
			case "txt":
				return await convertFromText(file, targetFormat, options, onProgress);
			default:
				throw new Error(`Unsupported source format: ${sourceFormat}`);
		}
	} catch (error) {
		console.error("Document conversion error:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Unknown conversion error",
			originalName: file.name,
			targetFormat,
		};
	}
}

// ==================== PDF CONVERSION FUNCTIONS ====================

async function convertFromPdf(
	file: File,
	targetFormat: string,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	onProgress?.({
		stage: "Loading",
		progress: 10,
		message: "Loading PDF document...",
	});

	switch (targetFormat) {
		case "txt":
			return await pdfToText(file, onProgress);
		case "docx":
			return await pdfToDocx(file, options, onProgress);
		case "jpg":
		case "png":
			return await pdfToImage(file, targetFormat, options, onProgress);
		default:
			throw new Error(`PDF to ${targetFormat} conversion not supported`);
	}
}

async function pdfToText(
	file: File,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	const pdfjsLib = await loadPdfJs();

	onProgress?.({
		stage: "Processing",
		progress: 25,
		message: "Extracting text from PDF pages...",
	});

	try {
		const arrayBuffer = await file.arrayBuffer();
		const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
		let fullText = "";

		onProgress?.({
			stage: "Converting",
			progress: 40,
			message: `Processing ${pdf.numPages} pages...`,
		});

		for (let i = 1; i <= pdf.numPages; i++) {
			const page = await pdf.getPage(i);
			const textContent = await page.getTextContent();
			const pageText = textContent.items
				.filter((item: any) => item.str)
				.map((item: any) => item.str)
				.join(" ");

			fullText += pageText + "\n\n";

			// Update progress
			const progress = 40 + Math.round((i / pdf.numPages) * 40);
			onProgress?.({
				stage: "Converting",
				progress,
				message: `Processed page ${i} of ${pdf.numPages}`,
			});
		}

		onProgress?.({
			stage: "Finalizing",
			progress: 90,
			message: "Creating text file...",
		});

		const blob = new Blob([fullText], { type: "text/plain" });
		const convertedFile = new File(
			[blob],
			file.name.replace(/\.[^/.]+$/, ".txt"),
			{ type: "text/plain" }
		);

		onProgress?.({
			stage: "Complete",
			progress: 100,
			message: "PDF text extraction completed successfully!",
		});

		return {
			success: true,
			file: convertedFile,
			originalName: file.name,
			targetFormat: "txt",
			fileSize: convertedFile.size,
		};
	} catch (error) {
		console.error("PDF text extraction error:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to extract text from PDF",
			originalName: file.name,
			targetFormat: "txt",
		};
	}
}

async function pdfToDocx(
	file: File,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	const pdfjsLib = await loadPdfJs();
	const docxLib = await loadDocx();

	onProgress?.({
		stage: "Processing",
		progress: 20,
		message: "Analyzing PDF structure...",
	});

	try {
		const arrayBuffer = await file.arrayBuffer();
		const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

		onProgress?.({
			stage: "Converting",
			progress: 30,
			message: "Extracting content and formatting...",
		});

		let allText = "";

		// Extract text from all pages
		for (let i = 1; i <= pdf.numPages; i++) {
			const page = await pdf.getPage(i);
			const textContent = await page.getTextContent();

			// Group text items by their vertical position to preserve paragraph structure
			const textByLines: { [key: number]: string } = {};

			textContent.items.forEach((item: any) => {
				if (item.str && item.str.trim()) {
					const y = Math.round(item.transform[5]);
					if (!textByLines[y]) {
						textByLines[y] = "";
					}
					textByLines[y] += item.str + " ";
				}
			});

			// Sort lines by vertical position (top to bottom)
			const sortedLines = Object.keys(textByLines)
				.sort((a, b) => parseInt(b) - parseInt(a))
				.map((y) => textByLines[parseInt(y)].trim())
				.filter((line) => line.length > 0);

			// Add page content
			allText += sortedLines.join("\n") + "\n\n";

			const progress = 30 + Math.round((i / pdf.numPages) * 40);
			onProgress?.({
				stage: "Converting",
				progress,
				message: `Converted page ${i} of ${pdf.numPages}`,
			});
		}

		onProgress?.({
			stage: "Building",
			progress: 75,
			message: "Building DOCX document...",
		});

		// Create DOCX document with extracted text
		const paragraphs = allText
			.split("\n\n")
			.filter((p) => p.trim())
			.map((paragraph) => {
				// Detect if this might be a heading (short lines, often uppercase)
				const isHeading =
					paragraph.length < 100 &&
					(paragraph === paragraph.toUpperCase() ||
						paragraph.split(/\s+/).length <= 8);

				if (isHeading) {
					return new docxLib.Paragraph({
						children: [
							new docxLib.TextRun({
								text: paragraph,
								bold: true,
								size: 28, // 14pt
							}),
						],
						heading: docxLib.HeadingLevel.HEADING_1,
						spacing: {
							after: 240, // 12pt
						},
					});
				} else {
					return new docxLib.Paragraph({
						children: [
							new docxLib.TextRun({
								text: paragraph,
								size: 24, // 12pt
							}),
						],
						spacing: {
							after: 120, // 6pt
						},
					});
				}
			});

		const doc = new docxLib.Document({
			sections: [
				{
					properties: {
						page: {
							margin: {
								top: 1440, // 1 inch
								right: 1440,
								bottom: 1440,
								left: 1440,
							},
						},
					},
					children: paragraphs,
				},
			],
		});

		onProgress?.({
			stage: "Finalizing",
			progress: 90,
			message: "Generating DOCX file...",
		});

		const buffer = await docxLib.Packer.toBuffer(doc);
		const convertedFile = new File(
			[buffer],
			file.name.replace(/\.[^/.]+$/, ".docx"),
			{
				type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			}
		);

		onProgress?.({
			stage: "Complete",
			progress: 100,
			message: "PDF to DOCX conversion completed successfully!",
		});

		return {
			success: true,
			file: convertedFile,
			originalName: file.name,
			targetFormat: "docx",
			fileSize: convertedFile.size,
		};
	} catch (error) {
		console.error("PDF to DOCX conversion error:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to convert PDF to DOCX",
			originalName: file.name,
			targetFormat: "docx",
		};
	}
}

async function pdfToImage(
	file: File,
	targetFormat: string,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	const pdfjsLib = await loadPdfJs();

	onProgress?.({
		stage: "Processing",
		progress: 25,
		message: "Rendering PDF pages...",
	});

	try {
		const arrayBuffer = await file.arrayBuffer();
		const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

		// For now, convert only the first page
		const page = await pdf.getPage(1);
		const scale = options.width
			? options.width / page.getViewport({ scale: 1 }).width
			: 2.0;
		const viewport = page.getViewport({ scale });

		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d")!;
		canvas.height = viewport.height;
		canvas.width = viewport.width;

		onProgress?.({
			stage: "Converting",
			progress: 50,
			message: "Rendering page to canvas...",
		});

		await page.render({
			canvasContext: context,
			viewport: viewport,
		}).promise;

		onProgress?.({
			stage: "Finalizing",
			progress: 90,
			message: "Creating image file...",
		});

		return new Promise((resolve) => {
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
							message: "PDF to image conversion completed!",
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
							error: "Failed to convert PDF to image",
							originalName: file.name,
							targetFormat,
						});
					}
				},
				`image/${targetFormat}`,
				options.quality || 0.8
			);
		});
	} catch (error) {
		console.error("PDF to image conversion error:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to convert PDF to image",
			originalName: file.name,
			targetFormat,
		};
	}
}

// ==================== WORD CONVERSION FUNCTIONS ====================

async function convertFromWord(
	file: File,
	targetFormat: string,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	onProgress?.({
		stage: "Loading",
		progress: 15,
		message: "Loading Word document...",
	});

	switch (targetFormat) {
		case "txt":
			return await wordToText(file, onProgress);
		case "pdf":
			return await wordToPdf(file, options, onProgress);
		default:
			throw new Error(`Word to ${targetFormat} conversion not supported`);
	}
}

async function wordToText(
	file: File,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	const mammothModule = await loadMammoth();

	onProgress?.({
		stage: "Processing",
		progress: 30,
		message: "Extracting text from Word document...",
	});

	try {
		const arrayBuffer = await file.arrayBuffer();
		const result = await mammothModule.extractRawText({ arrayBuffer });
		const textContent = result.value;

		onProgress?.({
			stage: "Finalizing",
			progress: 80,
			message: "Creating text file...",
		});

		const blob = new Blob([textContent], { type: "text/plain" });
		const convertedFile = new File(
			[blob],
			file.name.replace(/\.[^/.]+$/, ".txt"),
			{ type: "text/plain" }
		);

		onProgress?.({
			stage: "Complete",
			progress: 100,
			message: "Word to text conversion completed!",
		});

		return {
			success: true,
			file: convertedFile,
			originalName: file.name,
			targetFormat: "txt",
			fileSize: convertedFile.size,
		};
	} catch (error) {
		console.error("Word to text conversion error:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to extract text from Word document",
			originalName: file.name,
			targetFormat: "txt",
		};
	}
}

async function wordToPdf(
	file: File,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	const mammothModule = await loadMammoth();
	const jsPDFModule = await loadJsPDF();

	onProgress?.({
		stage: "Processing",
		progress: 20,
		message: "Converting Word document to HTML...",
	});

	try {
		const arrayBuffer = await file.arrayBuffer();

		// Convert DOCX to HTML with styling
		const result = await mammothModule.convertToHtml(
			{ arrayBuffer },
			{
				styleMap: [
					"p[style-name='Heading 1'] => h1:fresh",
					"p[style-name='Heading 2'] => h2:fresh",
					"p[style-name='Heading 3'] => h3:fresh",
					"p[style-name='Title'] => h1:fresh",
					"b => strong",
					"i => em",
					"u => u",
				],
				convertImage: mammothModule.images.inline((element: any) => {
					return element.read("base64").then((imageBuffer: string) => {
						return {
							src: "data:" + element.contentType + ";base64," + imageBuffer,
						};
					});
				}),
			}
		);

		const htmlContent = result.value;
		const messages = result.messages;

		if (messages.length > 0) {
			console.warn("Mammoth conversion messages:", messages);
		}

		onProgress?.({
			stage: "Converting",
			progress: 50,
			message: "Generating PDF from content...",
		});

		// Parse HTML to extract text content with basic structure
		const parser = new DOMParser();
		const doc = parser.parseFromString(htmlContent, "text/html");

		// Create PDF with proper Unicode support
		const pdf = new jsPDFModule({
			orientation: "portrait",
			unit: "mm",
			format: "a4",
		});

		// Add Unicode font support for better international text rendering
		pdf.setFont("helvetica", "normal");
		pdf.setFontSize(12);

		const pageWidth = 210; // A4 width in mm
		const pageHeight = 297; // A4 height in mm
		const marginLeft = 20;
		const marginRight = 20;
		const marginTop = 20;
		const marginBottom = 20;
		const maxWidth = pageWidth - marginLeft - marginRight;
		const maxHeight = pageHeight - marginTop - marginBottom;

		let yPosition = marginTop;
		let pageNumber = 1;

		onProgress?.({
			stage: "Building",
			progress: 70,
			message: "Building PDF pages...",
		});

		// Process all elements in the document
		const elements = doc.body.querySelectorAll(
			"h1, h2, h3, h4, h5, h6, p, ul, ol, li, div, span, strong, em, u, img, table"
		);
		let currentPage = 1;

		const addNewPageIfNeeded = (requiredHeight: number) => {
			if (yPosition + requiredHeight > pageHeight - marginBottom) {
				pdf.addPage();
				yPosition = marginTop;
				currentPage++;
				return true;
			}
			return false;
		};

		// Helper function to add text with word wrapping and page breaks
		const addWrappedText = (
			text: string,
			fontSize: number,
			isBold: boolean = false,
			isItalic: boolean = false
		) => {
			if (!text || text.trim() === "") return;

			pdf.setFontSize(fontSize);

			// Set font style
			let fontStyle = "normal";
			if (isBold && isItalic) fontStyle = "bolditalic";
			else if (isBold) fontStyle = "bold";
			else if (isItalic) fontStyle = "italic";

			pdf.setFont("helvetica", fontStyle);

			// Split text into lines that fit the page width
			const lines = pdf.splitTextToSize(text, maxWidth);
			const lineHeight = fontSize * 0.5; // Adjust line height based on font size

			for (const line of lines) {
				// Check if we need a new page
				addNewPageIfNeeded(lineHeight);

				// Handle RTL text (Hebrew, Arabic, etc.)
				let processedLine = line;
				// Simple RTL detection - if line contains Hebrew characters
				if (/[\u0590-\u05FF]/.test(line)) {
					// For RTL text, align to the right
					const textWidth = pdf.getTextWidth(line);
					pdf.text(line, pageWidth - marginRight - textWidth, yPosition);
				} else {
					pdf.text(line, marginLeft, yPosition);
				}

				yPosition += lineHeight;
			}
		};

		// Process each element
		elements.forEach((element, index) => {
			const tagName = element.tagName.toLowerCase();
			const textContent = element.textContent?.trim() || "";

			if (!textContent) return;

			// Update progress
			if (index % 10 === 0) {
				const progress = 70 + Math.round((index / elements.length) * 20);
				onProgress?.({
					stage: "Building",
					progress,
					message: `Processing element ${index + 1} of ${elements.length}`,
				});
			}

			switch (tagName) {
				case "h1":
					yPosition += 8; // Add space before heading
					addWrappedText(textContent, 18, true);
					yPosition += 6; // Add space after heading
					break;
				case "h2":
					yPosition += 6;
					addWrappedText(textContent, 16, true);
					yPosition += 4;
					break;
				case "h3":
					yPosition += 4;
					addWrappedText(textContent, 14, true);
					yPosition += 3;
					break;
				case "p":
				case "div":
					// Check for nested formatting
					const isBold =
						element.querySelector("strong, b") !== null ||
						element.tagName === "STRONG" ||
						element.tagName === "B";
					const isItalic =
						element.querySelector("em, i") !== null ||
						element.tagName === "EM" ||
						element.tagName === "I";

					addWrappedText(textContent, 12, isBold, isItalic);
					yPosition += 4; // Paragraph spacing
					break;
				case "li":
					// Add bullet point or number
					const listParent = element.parentElement;
					if (listParent?.tagName === "UL") {
						pdf.text("• ", marginLeft - 5, yPosition);
					} else if (listParent?.tagName === "OL") {
						const listItems = listParent.querySelectorAll("li");
						const itemIndex =
							Array.from(listItems).indexOf(element as HTMLLIElement) + 1;
						pdf.text(`${itemIndex}. `, marginLeft - 8, yPosition);
					}
					addWrappedText(textContent, 12);
					yPosition += 2;
					break;
				case "img":
					// Handle images if present
					const img = element as HTMLImageElement;
					if (img.src && img.src.startsWith("data:")) {
						try {
							const imgWidth = 50; // Default image width in mm
							const imgHeight = 30; // Default image height in mm

							addNewPageIfNeeded(imgHeight);
							pdf.addImage(
								img.src,
								"JPEG",
								marginLeft,
								yPosition,
								imgWidth,
								imgHeight
							);
							yPosition += imgHeight + 4;
						} catch (e) {
							console.warn("Failed to add image to PDF:", e);
						}
					}
					break;
				case "table":
					// Basic table support
					yPosition += 4;
					const rows = element.querySelectorAll("tr");
					rows.forEach((row) => {
						const cells = row.querySelectorAll("td, th");
						let xPosition = marginLeft;
						const cellWidth = maxWidth / cells.length;

						cells.forEach((cell) => {
							const cellText = cell.textContent?.trim() || "";
							const cellLines = pdf.splitTextToSize(cellText, cellWidth - 2);

							let cellY = yPosition;
							cellLines.forEach((line) => {
								addNewPageIfNeeded(7);
								pdf.text(line, xPosition + 1, cellY);
								cellY += 7;
							});

							xPosition += cellWidth;
						});

						yPosition += 8;
					});
					yPosition += 4;
					break;
			}
		});

		// Alternative approach: If elements parsing fails, fall back to text-only conversion
		if (elements.length === 0) {
			console.warn("No elements found, falling back to text conversion");

			// Extract plain text from HTML
			const tempDiv = document.createElement("div");
			tempDiv.innerHTML = htmlContent;
			const plainText = tempDiv.textContent || tempDiv.innerText || "";

			// Split into paragraphs and add to PDF
			const paragraphs = plainText.split(/\n\n+/);

			paragraphs.forEach((paragraph, idx) => {
				if (paragraph.trim()) {
					addWrappedText(paragraph.trim(), 12);
					yPosition += 6; // Add spacing between paragraphs

					// Update progress
					const progress = 70 + Math.round((idx / paragraphs.length) * 20);
					onProgress?.({
						stage: "Building",
						progress,
						message: `Processing paragraph ${idx + 1} of ${paragraphs.length}`,
					});
				}
			});
		}

		onProgress?.({
			stage: "Finalizing",
			progress: 95,
			message: "Finalizing PDF...",
		});

		const pdfBlob = pdf.output("blob");
		const convertedFile = new File(
			[pdfBlob],
			file.name.replace(/\.[^/.]+$/, ".pdf"),
			{ type: "application/pdf" }
		);

		onProgress?.({
			stage: "Complete",
			progress: 100,
			message: `Word to PDF conversion completed! (${currentPage} pages)`,
		});

		return {
			success: true,
			file: convertedFile,
			originalName: file.name,
			targetFormat: "pdf",
			fileSize: convertedFile.size,
		};
	} catch (error) {
		console.error("Word to PDF conversion error:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to convert Word to PDF",
			originalName: file.name,
			targetFormat: "pdf",
		};
	}
}

// ==================== TEXT CONVERSION FUNCTIONS ====================

async function convertFromText(
	file: File,
	targetFormat: string,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	onProgress?.({
		stage: "Loading",
		progress: 20,
		message: "Reading text file...",
	});

	const textContent = await file.text();

	switch (targetFormat) {
		case "pdf":
			return await textToPdf(textContent, file, options, onProgress);
		case "docx":
			return await textToDocx(textContent, file, onProgress);
		default:
			throw new Error(`Text to ${targetFormat} conversion not supported`);
	}
}

async function textToPdf(
	textContent: string,
	originalFile: File,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	const jsPDFModule = await loadJsPDF();

	onProgress?.({
		stage: "Processing",
		progress: 40,
		message: "Creating PDF document...",
	});

	try {
		const pdf = new jsPDFModule({
			orientation: "portrait",
			unit: "mm",
			format: "a4",
		});

		// Set up text formatting
		pdf.setFont("times", "normal");
		pdf.setFontSize(12);

		const pageWidth = 210; // A4 width in mm
		const pageHeight = 297; // A4 height in mm
		const margin = 20;
		const maxWidth = pageWidth - 2 * margin;
		const lineHeight = 7;

		let yPosition = margin;

		// Split text into lines that fit the page width
		const lines = pdf.splitTextToSize(textContent, maxWidth);

		onProgress?.({
			stage: "Building",
			progress: 60,
			message: "Adding content to PDF...",
		});

		for (let i = 0; i < lines.length; i++) {
			// Check if we need a new page
			if (yPosition + lineHeight > pageHeight - margin) {
				pdf.addPage();
				yPosition = margin;
			}

			pdf.text(lines[i], margin, yPosition);
			yPosition += lineHeight;

			// Update progress
			if (i % 50 === 0) {
				const progress = 60 + Math.round((i / lines.length) * 25);
				onProgress?.({
					stage: "Building",
					progress,
					message: `Processing line ${i + 1} of ${lines.length}`,
				});
			}
		}

		onProgress?.({
			stage: "Finalizing",
			progress: 90,
			message: "Finalizing PDF...",
		});

		const pdfBlob = pdf.output("blob");
		const convertedFile = new File(
			[pdfBlob],
			originalFile.name.replace(/\.[^/.]+$/, ".pdf"),
			{ type: "application/pdf" }
		);

		onProgress?.({
			stage: "Complete",
			progress: 100,
			message: "Text to PDF conversion completed!",
		});

		return {
			success: true,
			file: convertedFile,
			originalName: originalFile.name,
			targetFormat: "pdf",
			fileSize: convertedFile.size,
		};
	} catch (error) {
		console.error("Text to PDF conversion error:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to convert text to PDF",
			originalName: originalFile.name,
			targetFormat: "pdf",
		};
	}
}

async function textToDocx(
	textContent: string,
	originalFile: File,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	const docxLib = await loadDocx();

	onProgress?.({
		stage: "Processing",
		progress: 40,
		message: "Creating DOCX document...",
	});

	try {
		// Split text into paragraphs
		const paragraphs = textContent
			.split(/\n\s*\n/)
			.filter((p) => p.trim())
			.map(
				(paragraph) =>
					new docxLib.Paragraph({
						children: [
							new docxLib.TextRun({
								text: paragraph.trim(),
								size: 24, // 12pt
							}),
						],
						spacing: {
							after: 240, // 12pt spacing after
						},
					})
			);

		onProgress?.({
			stage: "Building",
			progress: 70,
			message: "Building document structure...",
		});

		const doc = new docxLib.Document({
			sections: [
				{
					properties: {
						page: {
							margin: {
								top: 1440, // 1 inch
								right: 1440,
								bottom: 1440,
								left: 1440,
							},
						},
					},
					children: paragraphs,
				},
			],
		});

		onProgress?.({
			stage: "Finalizing",
			progress: 90,
			message: "Generating DOCX file...",
		});

		const buffer = await docxLib.Packer.toBuffer(doc);
		const convertedFile = new File(
			[buffer],
			originalFile.name.replace(/\.[^/.]+$/, ".docx"),
			{
				type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			}
		);

		onProgress?.({
			stage: "Complete",
			progress: 100,
			message: "Text to DOCX conversion completed!",
		});

		return {
			success: true,
			file: convertedFile,
			originalName: originalFile.name,
			targetFormat: "docx",
			fileSize: convertedFile.size,
		};
	} catch (error) {
		console.error("Text to DOCX conversion error:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to convert text to DOCX",
			originalName: originalFile.name,
			targetFormat: "docx",
		};
	}
}

// ==================== UTILITY FUNCTIONS ====================

function createProfessionalHtmlContent(bodyContent: string): string {
	return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Document</title>
			<style>
				body {
					font-family: 'Times New Roman', Times, serif;
					font-size: 12pt;
					line-height: 1.6;
					color: #000;
					background: #fff;
					margin: 0;
					padding: 20mm;
					max-width: 210mm;
					min-height: 297mm;
					box-sizing: border-box;
				}
				h1, h2, h3, h4, h5, h6 {
					color: #000;
					margin-top: 24pt;
					margin-bottom: 12pt;
					font-weight: bold;
				}
				h1 { font-size: 18pt; }
				h2 { font-size: 16pt; }
				h3 { font-size: 14pt; }
				p {
					margin: 0 0 12pt 0;
					text-align: justify;
				}
				strong, b {
					font-weight: bold;
				}
				em, i {
					font-style: italic;
				}
				ul, ol {
					margin: 12pt 0;
					padding-left: 24pt;
				}
				li {
					margin-bottom: 6pt;
				}
				table {
					border-collapse: collapse;
					width: 100%;
					margin: 12pt 0;
				}
				td, th {
					border: 1pt solid #000;
					padding: 6pt;
					text-align: left;
				}
				th {
					background-color: #f5f5f5;
					font-weight: bold;
				}
				blockquote {
					margin: 12pt 24pt;
					padding-left: 12pt;
					border-left: 2pt solid #ccc;
					font-style: italic;
				}
			</style>
		</head>
		<body>
			${bodyContent}
		</body>
		</html>
	`;
}
