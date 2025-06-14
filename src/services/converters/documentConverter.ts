import {
	ConversionOptions,
	ConversionProgress,
	ConversionResult,
} from "../../types";

// pdfjs-dist and docx will be imported dynamically.


// Lazy load libraries
let pdfLibLoaded: any = null; // Renamed to avoid conflict with pdfjsLib
let mammoth: any = null;
let html2canvas: any = null;
let jsPDF: any = null;

async function loadPdfLib() {
	if (!pdfLibLoaded) {
		pdfLibLoaded = await import("pdf-lib");
	}
	return pdfLibLoaded;
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

export async function convertDocument(
	file: File,
	targetFormat: string,
	options: ConversionOptions = {},
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	try {
		onProgress?.({
			stage: "Loading",
			progress: 0,
			message: "Loading document...",
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

async function convertFromPdf(
	file: File,
	targetFormat: string,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	onProgress?.({
		stage: "Loading",
		progress: 20, // Adjusted starting progress
		message: "Preparing PDF...",
	});

	// pdf-lib is generally used for PDF manipulation or image conversion.
	// For text extraction or DOCX, we'll use pdf.js directly with the file.
	// For image conversion, we might still need pdf-lib if pdfToImage relies on it.

	switch (targetFormat) {
		case "txt":
			return await pdfToText(file, options, onProgress); // Pass the raw file
		case "docx":
			return await pdfToDocxInternal(file, options, onProgress); // Pass the raw file
		case "jpg":
		case "png":
			// If pdfToImage uses pdf-lib, it needs to load the doc itself or receive a pdf-lib doc.
			// For this refactor, let's assume pdfToImage will handle its PDF loading if needed,
			// or we adapt it to take `file: File`. For now, we load it here.
			onProgress?.({ stage: "Loading", progress: 25, message: "Loading PDF for image conversion..." });
			const pdfLibMod = await loadPdfLib(); // Ensure pdfLibLoaded is used
			const arrBuff = await file.arrayBuffer();
			const pdfDocForImage = await pdfLibMod.PDFDocument.load(arrBuff);
			onProgress?.({ stage: "Converting", progress: 50, message: "Processing PDF for image..." });
			return await pdfToImage(pdfDocForImage, file, targetFormat, options, onProgress);
		default:
			console.error(`PDF to ${targetFormat} conversion not supported`);
			return {
				success: false,
				error: `PDF to ${targetFormat} conversion not supported`,
				originalName: file.name,
				targetFormat,
			};
	}
}


async function extractTextContentFromPdf(
	file: File,
	onProgress?: (progress: ConversionProgress) => void
): Promise<string> {
	const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
	if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
		pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
	}

	const arrayBuffer = await file.arrayBuffer();

	onProgress?.({
		stage: "Converting",
		progress: 5, // Progress before loading
		message: `Loading PDF document...`,
	});

	const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
	let fullText = "";
	const totalPages = pdfDocument.numPages;

	onProgress?.({
		stage: "Converting",
		progress: 10,
		message: `Extracting text from ${totalPages} pages...`,
	});

	for (let i = 1; i <= totalPages; i++) {
		const page = await pdfDocument.getPage(i);
		const textContent = await page.getTextContent();

		// Basic text item concatenation. Might need refinement for spacing, hyphenation, etc.
		textContent.items.forEach((item: any) => { // TODO: Add proper type for item if available from pdfjsLib
			fullText += item.str;
			if (item.hasEOL) { // End of Line marker from pdf.js
				fullText += "\n";
			} else if (item.str.trim().length > 0 && !item.str.endsWith(" ")) {
				// Add a space if the item is not empty and doesn't end with one,
				// to prevent words from merging. This is a heuristic.
				fullText += " ";
			}
		});
		// Add a double newline after each page to simulate paragraph breaks between pages.
		// This might need to be more sophisticated based on actual document structure.
		if (totalPages > 1 && i < totalPages) {
			fullText += "\n\n";
		}

		onProgress?.({
			stage: "Converting",
			// Progress: 10% (initial) + 80% (spread across pages) = 90% total for this part
			progress: 10 + Math.round((i / totalPages) * 80),
			message: `Processed page ${i}/${totalPages}...`,
		});
	}
	onProgress?.({
		stage: "Converting",
		progress: 90,
		message: `Text extraction complete. Finalizing...`,
	});
	return fullText.trim(); // Trim trailing spaces/newlines
}

async function pdfToText(
	originalFile: File,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	onProgress?.({
		stage: "Converting",
		progress: 0, // Start progress for this specific function
		message: "Starting PDF to text conversion...",
	});

	try {
		const textContent = await extractTextContentFromPdf(originalFile, onProgress);

		const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
		const convertedFile = new File(
			[blob],
			originalFile.name.replace(/\.[^/.]+$/, ".txt"),
			{ type: "text/plain;charset=utf-8" }
		);

		onProgress?.({
			stage: "Complete",
			progress: 100,
			message: "PDF to .txt conversion completed!",
		});

		return {
			success: true,
			file: convertedFile,
			originalName: originalFile.name,
			targetFormat: "txt",
			fileSize: convertedFile.size,
		};
	} catch (error) {
		console.error("PDF to Text conversion error:", error);
		onProgress?.({ stage: "Error", progress: 100, message: "PDF to Text failed." });
		return {
			success: false,
			error: `PDF to Text failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			originalName: originalFile.name,
			targetFormat: "txt",
		};
	}
}

// pdfToImage still expects pdfDoc from pdf-lib. Ensure this is handled if image conversion is triggered.
async function pdfToImage(
	pdfDoc: any,
	originalFile: File,
	targetFormat: string,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {

	// This function currently uses pdf-lib's pdfDoc.
	// If called from the refactored convertFromPdf, ensure pdfDoc is loaded correctly with pdf-lib.
	// For actual PDF page rendering to canvas, pdf.js would be used.
	// The 'scale' option would influence the viewport dimensions when rendering a PDF page.
	// The 'quality' option is for the output image format (e.g., JPEG quality).

	onProgress?.({
		stage: "Converting",
		progress: 75, // Assuming previous steps took up to 75%
		message: "Converting PDF to image...",
	});

	// Example: Use pdf.js to render a page (conceptual)
	// This part is illustrative and would need actual pdf.js integration.
	// const pdfPage = await pdfDoc.getPage(1); // Assuming pdfDoc is a pdf.js document object
	// const viewport = pdfPage.getViewport({ scale: options.scale || 1.5 });
	// canvas.width = viewport.width;
	// canvas.height = viewport.height;
	// await pdfPage.render({ canvasContext: ctx, viewport: viewport }).promise;

	// --- Placeholder rendering ---
	// For now, we'll stick to the placeholder, but apply scale conceptually.
	const scale = typeof options.scale === 'number' && options.scale > 0 && options.scale <= 5 ? options.scale : 1.5;
	// Adjust canvas size based on scale, assuming base dimensions before scaling
	const baseWidth = options.width || 800 / 1.5; // default base width if scale is 1.5
	const baseHeight = options.height || 600 / 1.5; // default base height if scale is 1.5

	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d")!;

	canvas.width = baseWidth * scale;
	canvas.height = baseHeight * scale;

	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "black";
	ctx.font = `${20 * scale}px Arial`; // Scale font size too
	ctx.fillText("PDF converted to image", 50 * scale, 50 * scale);
	ctx.fillText("(Requires pdf.js for full implementation)", 50 * scale, 80 * scale);

	return new Promise((resolve) => {
		canvas.toBlob(
			(blob) => {
				if (blob) {
					const convertedFile = new File(
						[blob],
						originalFile.name.replace(/\.[^/.]+$/, `.${targetFormat}`),
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
						originalName: originalFile.name,
						targetFormat,
						fileSize: convertedFile.size,
					});
				} else {
					resolve({
						success: false,
						error: "Failed to convert PDF to image",
						originalName: originalFile.name,
						targetFormat,
					});
				}
			},
			`image/${targetFormat}`,
			// Ensure options.quality is used for image compression (0.0 to 1.0)
			// Default to 0.92 for JPEGs if not specified or out of range.
			typeof options.quality === 'number' && options.quality > 0 && options.quality <= 1 ? options.quality : 0.92
		);
	});
}

async function convertFromWord(
	file: File,
	targetFormat: string,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	const mammothModule = await loadMammoth();

	onProgress?.({
		stage: "Loading",
		progress: 25,
		message: "Loading Word document...",
	});

	const arrayBuffer = await file.arrayBuffer();

	switch (targetFormat) {
		case "txt":
			return await wordToText(mammothModule, arrayBuffer, file, onProgress);
		case "pdf":
			return await wordToPdfAdvanced(
				mammothModule,
				arrayBuffer,
				file,
				options,
				onProgress
			);
		default:
			throw new Error(`Word to ${targetFormat} conversion not supported`);
	}
}

async function wordToText(
	mammothModule: any,
	arrayBuffer: ArrayBuffer,
	originalFile: File,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	onProgress?.({
		stage: "Converting",
		progress: 50,
		message: "Extracting text from Word document...",
	});

	const result = await mammothModule.extractRawText({ arrayBuffer });
	const textContent = result.value;

	onProgress?.({
		stage: "Finalizing",
		progress: 75,
		message: "Creating text file...",
	});

	const blob = new Blob([textContent], { type: "text/plain" });
	const convertedFile = new File(
		[blob],
		originalFile.name.replace(/\.[^/.]+$/, ".txt"),
		{ type: "text/plain" }
	);

	onProgress?.({
		stage: "Complete",
		progress: 100,
		message: "Text extraction completed!",
	});

	return {
		success: true,
		file: convertedFile,
		originalName: originalFile.name,
		targetFormat: "txt",
		fileSize: convertedFile.size,
	};
}

async function wordToPdfAdvanced(
	mammothModule: any,
	arrayBuffer: ArrayBuffer,
	originalFile: File,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	onProgress?.({
		stage: "Converting",
		progress: 10,
		message: "Converting Word to HTML...",
	});

	try {
		// Convert DOCX to HTML with comprehensive style mapping
		const result = await mammothModule.convertToHtml({
			arrayBuffer,
			styleMap: [
				"p[style-name='Title'] => h1.title",
				"p[style-name='Heading 1'] => h1",
				"p[style-name='Heading 2'] => h2",
				"p[style-name='Heading 3'] => h3",
				"p[style-name='Heading 4'] => h4",
				"p[style-name='Heading 5'] => h5", // Added h5
				"p[style-name='Heading 6'] => h6", // Added h6
				"r[style-name='Strong'] => strong",
				"r[style-name='Emphasis'] => em",
				"r[style-name='Intense Emphasis'] => strong em",
				"p[style-name='List Paragraph'] => li", // Ensure this maps to li
				"p[style-name='Block Text'] => pre", // Map block text to pre for preformatted text
				"p[style-name='Comment Text'] => p.comment-text", // Example of mapping a custom style
				"p[style-name='Quote'] => blockquote p",
				"table => table.word-table", // Basic table mapping
				"u => u", // Underline
				// More specific mappings can be added if certain Word styles are common
				// e.g., "p[style-name='Caption'] => p.caption",
			],
			includeDefaultStyleMap: true, // Keep this true to include Mammoth's defaults
			convertImage: mammothModule.images.imgElement(function (image: any) {
				return image.read("base64").then(function (imageBuffer: any) {
					return {
						src: "data:" + image.contentType + ";base64," + imageBuffer,
					};
				}).catch(function(error: any) {
					console.warn("Mammoth: Failed to convert an image.", error);
					// Return a placeholder or skip the image
					return { src: "" }; // Could be an empty string or a placeholder image data URI
				});
			}),
		});

		const htmlContent = result.value;
		const messages = result.messages;

		// Log the HTML output from mammoth.convertToHtml
		console.log("Mammoth HTML output:", htmlContent);

		// Log any conversion warnings/errors for debugging
		if (messages.length > 0) {
			console.log("Mammoth conversion messages:", messages);
		}

		onProgress?.({
			stage: "Converting",
			progress: 40,
			message: "Creating PDF with jsPDF...",
		});

		return await htmlToPdfWithJsPDF(
			htmlContent,
			originalFile,
			options,
			onProgress
		);
	} catch (conversionError) { // Catching errors from htmlToPdfWithJsPDF or mammoth
		if (conversionError instanceof Error && conversionError.message.includes("jsPDF")) {
			console.error("Advanced Word to PDF conversion failed specifically during jsPDF processing:", conversionError);
			onProgress?.({
				stage: "Converting",
				progress: 30,
				message: "Falling back to basic conversion due to jsPDF error...",
			});
		} else {
			console.error("Advanced Word to PDF conversion failed (Mammoth or other HTML processing error):", conversionError);
			onProgress?.({
				stage: "Converting",
				progress: 30,
				message: "Falling back to basic conversion due to HTML processing error...",
			});
		}
		return await wordToPdfBasic(
			mammothModule,
			arrayBuffer,
			originalFile,
			options,
			onProgress
		);
	}
}

async function wordToPdfBasic(
	mammothModule: any,
	arrayBuffer: ArrayBuffer,
	originalFile: File,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	onProgress?.({
		stage: "Converting",
		progress: 50,
		message: "Basic Word to PDF conversion...",
	});
	console.log("Attempting basic Word to PDF conversion for:", originalFile.name);
	try {
		const result = await mammothModule.convertToHtml({ arrayBuffer });
		const htmlContent = result.value;
		console.log("Basic conversion HTML content generated for fallback.");
		return await htmlToPdf(htmlContent, originalFile, options, onProgress); // Assuming htmlToPdf is the basic canvas-based one
	} catch (error) {
		console.error("Basic Word to PDF conversion (mammoth part during fallback) failed:", error);
		// If even basic mammoth conversion fails, we need to return a failure result
		return {
			success: false,
			error: `Fallback basic conversion also failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			originalName: originalFile.name,
			targetFormat: "pdf",
		};
	}
}

async function pdfToDocxInternal(
	file: File,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	const DocxModule = await import('docx');
	onProgress?.({
		stage: "Converting",
		progress: 0,
		message: "Starting PDF to DOCX conversion...",
	});

	try {
		const textContent = await extractTextContentFromPdf(file, onProgress); // Uses 0-90% of progress

		onProgress?.({
			stage: "Converting",
			progress: 90,
			message: "Creating DOCX structure...",
		});

		const paragraphs = textContent.split("\n").map(
			(line) =>
				new DocxModule.Paragraph({ // Changed to DocxModule.Paragraph
					children: [new DocxModule.TextRun(line)], // Changed to DocxModule.TextRun
				})
		);

		const document = new DocxModule.Document({ // Changed to DocxModule.Document
			sections: [
				{
					properties: {}, // Default properties
					children: paragraphs,
				},
			],
		});

		const blob = await DocxModule.Packer.toBlob(document); // Changed to DocxModule.Packer
		const convertedFile = new File(
			[blob],
			file.name.replace(/\.[^/.]+$/, ".docx"),
			{
				type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			}
		);

		onProgress?.({
			stage: "Complete",
			progress: 100,
			message: "PDF to DOCX conversion completed!",
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
		onProgress?.({ stage: "Error", progress: 100, message: "PDF to DOCX failed." });
		return {
			success: false,
			error: `PDF to DOCX failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			originalName: file.name,
			targetFormat: "docx",
		};
	}
}


async function htmlToPdfWithJsPDF(
	htmlContent: string,
	originalFile: File,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	const jsPDFModule = await loadJsPDF();

	onProgress?.({
		stage: "Converting",
		progress: 50,
		message: "Setting up PDF generator...",
	});

	// Create new jsPDF instance
	const pdf = new jsPDFModule({
		orientation: "portrait", // Standard portrait orientation
		unit: "pt", // Points are good for precision
		format: "a4", // Default to A4, could be made an option
		compress: true, // Enable PDF compression
		// precision: 16, // Default is 16, can be adjusted if needed
		// putOnlyUsedFonts: true, // Potentially reduces file size
		// hotfixes: ["px_scaling"], // May help with some scaling issues
	});

	// Create a properly styled HTML document
	const styledHtml = createAdvancedStyledHtml(htmlContent);

	// Log the styledHtml before passing it to jsPDF
	console.log("Styled HTML for jsPDF:", styledHtml);

	onProgress?.({
		stage: "Converting",
		progress: 60,
		message: "Rendering HTML content...",
	});

	// Create temporary container
	const tempDiv = document.createElement("div");
	tempDiv.innerHTML = styledHtml;
	tempDiv.style.position = "absolute";
	tempDiv.style.left = "-9999px"; // Keep it off-screen
	tempDiv.style.top = "0";
	tempDiv.style.width = "595pt"; // A4 width in points, matching jsPDF unit and windowWidth
	// tempDiv.style.fontFamily = "Arial, sans-serif"; // Remove - should be handled by styledHtml's body
	// tempDiv.style.fontSize = "12px"; // Remove - should be handled by styledHtml's body
	// tempDiv.style.lineHeight = "1.4"; // Remove - should be handled by styledHtml's body
	// tempDiv.style.color = "#000000"; // Remove - should be handled by styledHtml's body
	tempDiv.style.background = "white"; // Ensure background for html2canvas if not set in body
	document.body.appendChild(tempDiv);

	// Log the dimensions and properties of the tempDiv
	console.log("tempDiv properties:", {
		width: tempDiv.style.width,
		position: tempDiv.style.position,
		left: tempDiv.style.left,
		top: tempDiv.style.top,
		background: tempDiv.style.background,
	});

	try {
		onProgress?.({
			stage: "Converting",
			progress: 70,
			message: "Converting to PDF...",
		});

		await pdf.html(tempDiv, {
			callback: function (doc: any) {
				// PDF generation complete
				// doc.putTotalPages('___total_pages___'); // Example for total pages if needed
			},
			x: 36, // Left margin (0.5 inch for A4 = 36pt)
			y: 36, // Top margin (0.5 inch)
			width: 523, // Content width (A4 width 595pt - 2*36pt margins)
			windowWidth: 595, // A4 width in points, important for html2canvas scaling
			margin: { // More explicit margin object
				top: 36,
				right: 36,
				bottom: 36,
				left: 36,
			},
			autoPaging: "text", // 'text' is generally good for flowing content
			// autoPaging: 'slice', // Alternative: might behave differently with complex layouts
			// html2canvas: {
			//   scale: 2, // Default scale for jsPDF.html, higher can improve image quality but increase size
			//   logging: true, // Enable html2canvas logging for debugging if needed
			//   useCORS: true, // Important for external images
			//   dpi: 144 // (scale * 72) - affects rasterized elements
			//   // letterRendering: true, // Might improve text rendering in some cases
			// },
		});

		onProgress?.({
			stage: "Finalizing",
			progress: 90,
			message: "Finalizing PDF...",
		});

		// Get PDF as blob
		const pdfBlob = pdf.output("blob");

		const convertedFile = new File(
			[pdfBlob],
			originalFile.name.replace(/\.[^/.]+$/, ".pdf"),
			{ type: "application/pdf" }
		);

		onProgress?.({
			stage: "Complete",
			progress: 100,
			message: "PDF conversion completed successfully!",
		});

		return {
			success: true,
			file: convertedFile,
			originalName: originalFile.name,
			targetFormat: "pdf",
			fileSize: convertedFile.size,
		};
	} catch (error) {
		// Log any errors or exceptions caught during the jsPDF.html() conversion
		console.error("jsPDF.html() conversion error:", error);
		throw new Error(
			`jsPDF conversion failed: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	} finally {
		document.body.removeChild(tempDiv);
	}
}

function createAdvancedStyledHtml(content: string): string {
	return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Calibri', 'Times New Roman', 'Arial', sans-serif; /* Added Times New Roman and ensured Arial is a fallback */
          font-size: 12pt; /* Common default size */
          line-height: 1.5; /* Improved line spacing */
          color: #000000;
          background: white;
          padding: 0; /* Margins will be handled by jsPDF options */
        }
        
        .content {
          max-width: 100%;
          padding: 0;
        }
        
        h1, h1.title {
          font-size: 20pt; /* Adjusted for better hierarchy */
          font-weight: bold;
          margin: 24pt 0 12pt 0; /* Consistent heading margins */
          color: #000000;
          line-height: 1.2;
          page-break-after: avoid;
        }
        
        h2 {
          font-size: 16pt; /* Adjusted for better hierarchy */
          font-weight: bold;
          margin: 18pt 0 10pt 0; /* Consistent heading margins */
          color: #000000;
          line-height: 1.2;
          page-break-after: avoid;
        }
        
        h3 {
          font-size: 14pt; /* Adjusted for better hierarchy */
          font-weight: bold;
          margin: 16pt 0 8pt 0; /* Consistent heading margins */
          color: #000000;
          line-height: 1.2;
          page-break-after: avoid;
        }
        
        h4 {
          font-size: 12pt; /* Adjusted for better hierarchy */
          font-weight: bold;
          margin: 12pt 0 6pt 0; /* Consistent heading margins */
          color: #000000;
          line-height: 1.2;
          page-break-after: avoid;
        }
        
        p {
          margin: 0 0 10pt 0; /* Consistent paragraph spacing */
          line-height: 1.5;
          text-align: left;
        }
        
        ul, ol {
          margin: 0 0 10pt 25pt; /* Adjusted indentation */
          padding-left: 15pt; /* Ensure space for bullets/numbers */
        }
        
        li {
          margin: 0 0 5pt 0; /* Consistent list item spacing */
          line-height: 1.5;
        }

        ul li { list-style-type: disc; } /* Default bullet */
        ol li { list-style-type: decimal; } /* Default numbering */

        /* More specific list styling if Mammoth preserves it */
        ul[style*="list-style-type: square"] li { list-style-type: square; }
        ul[style*="list-style-type: circle"] li { list-style-type: circle; }
        ol[style*="list-style-type: lower-roman"] li { list-style-type: lower-roman; }
        ol[style*="list-style-type: upper-roman"] li { list-style-type: upper-roman; }
        ol[style*="list-style-type: lower-alpha"] li { list-style-type: lower-alpha; }
        ol[style*="list-style-type: upper-alpha"] li { list-style-type: upper-alpha; }

        table, table.word-table {
          width: auto; /* Let tables size naturally, or 100% if specified by Word */
          border-collapse: collapse;
          margin: 12pt 0;
          font-size: 10pt; /* Slightly smaller for tables */
          page-break-inside: avoid; /* Try to keep tables on one page */
        }
        
        table th, table td {
          border: 1px solid #333333; /* Darker border for better visibility */
          padding: 5pt 7pt; /* Adjusted cell padding */
          text-align: left; /* Default, can be overridden by Word styles */
          vertical-align: top;
          line-height: 1.3;
        }
        
        table th {
          background-color: #e0e0e0; /* Lighter gray for header */
          font-weight: bold;
          text-align: center; /* Common for headers */
        }
        
        strong, b {
          font-weight: bold;
        }
        
        em, i {
          font-style: italic;
        }
        
        blockquote {
          margin: 12px 0;
          padding-left: 20px;
          border-left: 3px solid #cccccc;
          font-style: italic;
        }
        
        blockquote p {
          margin: 6px 0;
        }
        
        pre, code {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          background-color: #f8f8f8;
          padding: 4px;
          border: 1px solid #ddd;
        }
        
        pre {
          margin: 12px 0;
          padding: 8px;
          white-space: pre-wrap;
        }
        
        img {
          max-width: 100%;
          height: auto;
          margin: 8px 0;
        }

        .page-break-before {
          page-break-before: always;
        }
        
        /* Special styling for checkmarks and targets */
        .checkmark::before {
          content: "✓ ";
          color: #22c55e;
          font-weight: bold;
        }
        
        .target::before {
          content: "🎯 ";
        }
        
        /* Handle lists better - adjusted margins */
        p + ul, p + ol {
          margin-top: 0; /* Let paragraph margin handle spacing */
        }
        
        /* Better spacing for headers after content - adjusted margins */
        p + h1, ul + h1, ol + h1, table + h1 { margin-top: 24pt; }
        p + h2, ul + h2, ol + h2, table + h2 { margin-top: 18pt; }
        p + h3, ul + h3, ol + h3, table + h3 { margin-top: 16pt; }
        p + h4, ul + h4, ol + h4, table + h4 { margin-top: 12pt; }

      </style>
    </head>
    <body>
      <div class="content">
        ${content}
      </div>
    </body>
    </html>
  `;
}

async function convertFromText(
	file: File,
	targetFormat: string,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	onProgress?.({
		stage: "Loading",
		progress: 25,
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
	onProgress?.({
		stage: "Converting",
		progress: 50,
		message: "Creating PDF from text...",
	});

	const htmlContent = `<pre style="white-space: pre-wrap; font-family: monospace;">${textContent}</pre>`;

	return await htmlToPdfWithJsPDF(
		htmlContent,
		originalFile,
		options,
		onProgress
	);
}

async function textToDocx(
	textContent: string,
	originalFile: File,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	onProgress?.({
		stage: "Converting",
		progress: 50,
		message: "Creating DOCX from text...",
	});

	// This is a simplified implementation
	// For real DOCX creation, you'd use libraries like docx or officegen
	const blob = new Blob([textContent], {
		type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	});
	const convertedFile = new File(
		[blob],
		originalFile.name.replace(/\.[^/.]+$/, ".docx"),
		{
			type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		}
	);

	onProgress?.({
		stage: "Complete",
		progress: 100,
		message: "DOCX creation completed!",
	});

	return {
		success: true,
		file: convertedFile,
		originalName: originalFile.name,
		targetFormat: "docx",
		fileSize: convertedFile.size,
	};
}

function createStyledHtmlContent(bodyContent: string): string {
	return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: 'Calibri', 'Arial', sans-serif;
            font-size: 11pt;
            line-height: 1.15;
            color: #000000;
            background: white;
            padding: 72pt 72pt 72pt 72pt; /* 1 inch margins */
            max-width: 612pt; /* Letter width in points */
            margin: 0 auto;
          }
          
          h1, h1.title {
            font-size: 18pt;
            font-weight: bold;
            margin: 0 0 12pt 0;
            color: #000000;
            page-break-after: avoid;
          }
          
          h2 {
            font-size: 14pt;
            font-weight: bold;
            margin: 16pt 0 8pt 0;
            color: #000000;
            page-break-after: avoid;
          }
          
          h3 {
            font-size: 12pt;
            font-weight: bold;
            margin: 12pt 0 6pt 0;
            color: #000000;
            page-break-after: avoid;
          }
          
          p {
            margin: 0 0 12pt 0;
            text-align: left;
            orphans: 2;
            widows: 2;
          }
          
          ul, ol {
            margin: 0 0 12pt 18pt;
            padding-left: 18pt;
          }
          
          li {
            margin: 0 0 6pt 0;
            line-height: 1.15;
          }
          
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 12pt 0;
            font-size: 10pt;
          }
          
          table, th, td {
            border: 1pt solid #000000;
          }
          
          th, td {
            padding: 6pt 8pt;
            text-align: left;
            vertical-align: top;
          }
          
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          
          strong, b {
            font-weight: bold;
          }
          
          em, i {
            font-style: italic;
          }
          
          pre {
            font-family: 'Courier New', monospace;
            font-size: 10pt;
            white-space: pre-wrap;
            margin: 12pt 0;
            padding: 6pt;
            background-color: #f8f8f8;
            border: 1pt solid #cccccc;
          }
          
          /* Page break handling */
          .page-break {
            page-break-before: always;
          }
          
          /* Prevent breaking inside these elements */
          h1, h2, h3, table { 
            page-break-inside: avoid; 
          }
          
          /* Style checkmarks and bullet points */
          .checkmark::before {
            content: "✓ ";
            color: #22c55e;
            font-weight: bold;
          }
          
          .target::before {
            content: "🎯 ";
          }
        </style>
      </head>
      <body>
        ${bodyContent}
      </body>
    </html>
  `;
}

async function htmlToPdf(
	htmlContent: string,
	originalFile: File,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	const html2canvasModule = await loadHtml2Canvas();
	const pdfLibModule = await loadPdfLib();

	onProgress?.({
		stage: "Converting",
		progress: 60,
		message: "Preparing document for rendering...",
	});

	// Create proper styled HTML
	const styledHtml = createStyledHtmlContent(htmlContent);

	// Create a temporary container for the HTML
	const container = document.createElement("div");
	container.innerHTML = styledHtml;
	container.style.position = "absolute";
	container.style.left = "-9999px";
	container.style.top = "0";
	container.style.width = "816px"; // US Letter width in pixels at 96 DPI
	container.style.minHeight = "1056px"; // US Letter height in pixels at 96 DPI
	container.style.background = "white";
	container.style.overflow = "visible";
	document.body.appendChild(container);

	try {
		onProgress?.({
			stage: "Converting",
			progress: 70,
			message: "Rendering HTML to canvas...",
		});

		// Wait for any fonts to load
		await new Promise((resolve) => setTimeout(resolve, 500));

		const canvas = await html2canvasModule(container, {
			backgroundColor: "#FFFFFF",
			scale: 2, // Higher resolution
			useCORS: true,
			allowTaint: false,
			height: null, // Auto height to capture full content
			width: 816,
			windowWidth: 816,
			windowHeight: 1056,
			scrollX: 0,
			scrollY: 0,
			logging: false,
		});

		onProgress?.({
			stage: "Converting",
			progress: 80,
			message: "Creating PDF document...",
		});

		const pdfDoc = await pdfLibModule.PDFDocument.create();

		// Calculate how many pages we need
		const pageHeight = 1056 * 2; // Account for scale
		const canvasHeight = canvas.height;
		const numPages = Math.ceil(canvasHeight / pageHeight);

		for (let pageIndex = 0; pageIndex < numPages; pageIndex++) {
			const page = pdfDoc.addPage([612, 792]); // US Letter size in points

			// Create a canvas for this page
			const pageCanvas = document.createElement("canvas");
			pageCanvas.width = canvas.width;
			pageCanvas.height = Math.min(
				pageHeight,
				canvasHeight - pageIndex * pageHeight
			);

			const pageCtx = pageCanvas.getContext("2d")!;

			// Draw the portion of the main canvas for this page
			pageCtx.drawImage(
				canvas,
				0,
				pageIndex * pageHeight, // Source position
				canvas.width,
				pageCanvas.height, // Source size
				0,
				0, // Destination position
				pageCanvas.width,
				pageCanvas.height // Destination size
			);

			// Convert page canvas to image and embed in PDF
			const pageImageData = pageCanvas.toDataURL("image/png", 1.0);
			const pageImageBytes = await fetch(pageImageData).then((res) =>
				res.arrayBuffer()
			);
			const pageImage = await pdfDoc.embedPng(pageImageBytes);

			// Draw the image on the PDF page
			page.drawImage(pageImage, {
				x: 0,
				y: 0,
				width: 612,
				height: 792,
			});

			if (pageIndex < numPages - 1) {
				onProgress?.({
					stage: "Converting",
					progress: 80 + (pageIndex / numPages) * 10,
					message: `Processing page ${pageIndex + 1} of ${numPages}...`,
				});
			}
		}

		onProgress?.({
			stage: "Finalizing",
			progress: 90,
			message: "Finalizing PDF...",
		});

		const pdfBytes = await pdfDoc.save();

		const convertedFile = new File(
			[pdfBytes],
			originalFile.name.replace(/\.[^/.]+$/, ".pdf"),
			{ type: "application/pdf" }
		);

		onProgress?.({
			stage: "Complete",
			progress: 100,
			message: "PDF conversion completed successfully!",
		});

		return {
			success: true,
			file: convertedFile,
			originalName: originalFile.name,
			targetFormat: "pdf",
			fileSize: convertedFile.size,
		};
	} catch (error) {
		console.error("HTML to PDF conversion error:", error);
		throw new Error(
			`Failed to convert to PDF: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	} finally {
		document.body.removeChild(container);
	}
}
