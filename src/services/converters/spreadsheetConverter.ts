import * as XLSX from "xlsx";
import {
	ConversionOptions,
	ConversionProgress,
	ConversionResult,
} from "../../types";
import * as jsPDF from "jspdf"; // For type, will be dynamically loaded
import html2canvas from "html2canvas"; // For type, will be dynamically loaded

// Lazy load libraries
let jsPDFModule: any = null;
let html2canvasModule: any = null;

async function loadJsPDF() {
	if (!jsPDFModule) {
		const module = await import("jspdf");
		jsPDFModule = module.default;
	}
	return jsPDFModule;
}

async function loadHtml2Canvas() {
	if (!html2canvasModule) {
		const module = await import("html2canvas");
		html2canvasModule = module.default;
	}
	return html2canvasModule;
}


export async function convertSpreadsheet(
	file: File,
	targetFormat: string,
	_options: ConversionOptions = {},
	onProgress?: (p: ConversionProgress) => void
): Promise<ConversionResult> {
	const sourceFormat = file.name.split(".").pop()?.toLowerCase() || "";
	try {
		onProgress?.({
			stage: "Loading",
			progress: 10,
			message: "Reading spreadsheet...",
		});
		const arrayBuffer = await file.arrayBuffer();
		const wb = XLSX.read(arrayBuffer, { type: "array" });

		onProgress?.({
			stage: "Converting",
			progress: 50,
			message: "Generating output...",
		});

		let outData: ArrayBuffer;
		let mimeType = "text/csv";
		if (targetFormat === "csv") {
			outData = XLSX.write(wb, {
				type: "array",
				bookType: "csv",
			}) as ArrayBuffer;
			mimeType = "text/csv";
		} else if (targetFormat === "xlsx") {
			outData = XLSX.write(wb, {
				type: "array",
				bookType: "xlsx",
			}) as ArrayBuffer;
			mimeType =
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
		} else if (targetFormat === "xls") {
			outData = XLSX.write(wb, {
				type: "array",
				bookType: "xls",
			}) as ArrayBuffer;
			mimeType = "application/vnd.ms-excel";
		} else if (targetFormat === "ods") {
			outData = XLSX.write(wb, {
				type: "array",
				bookType: "ods",
			}) as ArrayBuffer;
			mimeType = "application/vnd.oasis.opendocument.spreadsheet";
		} else if (targetFormat === "pdf") {
			onProgress?.({
				stage: "Converting",
				progress: 30,
				message: "Converting spreadsheet to HTML...",
			});
			// For simplicity, convert the first sheet.
			// A more advanced implementation could allow sheet selection or convert all sheets.
			const firstSheetName = wb.SheetNames[0];
			const worksheet = wb.Sheets[firstSheetName];
			if (!worksheet) {
				throw new Error(`Sheet "${firstSheetName}" not found in the workbook.`);
			}
			const htmlSheet = XLSX.utils.sheet_to_html(worksheet, {
				// header: "<table>", // Add custom header if needed
				// footer: "</table>" // Add custom footer if needed
			});

			// Use a dedicated HTML to PDF converter for spreadsheets
			return await htmlSheetToPdf(htmlSheet, file, _options, onProgress);

		} else {
			throw new Error(
				`Unsupported spreadsheet conversion: ${sourceFormat} -> ${targetFormat}`
			);
		}

		// For non-PDF formats that directly output `outData`
		onProgress?.({
			stage: "Complete",
			progress: 100,
			message: "Conversion completed!",
		});

		const convertedFile = new File(
			[outData],
			file.name.replace(/\.[^/.]+$/, `.${targetFormat}`),
			{ type: mimeType }
		);

		return {
			success: true,
			file: convertedFile,
			originalName: file.name,
			targetFormat,
			fileSize: convertedFile.size,
		};
	} catch (error) {
		console.error("Spreadsheet conversion error", error);
		// Ensure onProgress is called for errors too
		onProgress?.({
			stage: "Error",
			progress: 100,
			message: error instanceof Error ? error.message : "Spreadsheet conversion failed",
		});
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
			originalName: file.name,
			targetFormat,
		};
	}
}

function getStyledSheetHtml(sheetHtml: string): string {
	// Basic styling for the spreadsheet HTML
	// XLSX.utils.sheet_to_html generates a simple <table>.
	return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: white; }
        table { border-collapse: collapse; width: 100%; table-layout: fixed; /* Helps with column widths */ }
        th, td {
          border: 1px solid #ccc;
          padding: 4px 6px;
          text-align: left;
          vertical-align: top;
          font-size: 10pt;
          word-wrap: break-word; /* Wrap long text in cells */
          overflow: hidden; /* Clip content that still overflows */
          max-width: 150px; /* Prevent extremely wide cells, adjust as needed */
        }
        th { background-color: #f2f2f2; font-weight: bold; }
        /* Mimic basic grid lines and cell appearance */
        br { display: none; } /* XLSX might add <br> in cells, which can mess up PDF rendering */
      </style>
    </head>
    <body>
      ${sheetHtml}
    </body>
    </html>
  `;
}

async function htmlSheetToPdf(
	sheetHtml: string,
	originalFile: File,
	options: ConversionOptions,
	onProgress?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
	const JsPDF = await loadJsPDF();
	const Html2Canvas = await loadHtml2Canvas();

	onProgress?.({
		stage: "Converting",
		progress: 50,
		message: "Setting up PDF generator for spreadsheet...",
	});

	const styledHtml = getStyledSheetHtml(sheetHtml);

	// Create temporary container for jsPDF.html (or html2canvas)
	const tempDiv = document.createElement("div");
	tempDiv.innerHTML = styledHtml;
	tempDiv.style.position = "absolute";
	tempDiv.style.left = "-9999px"; // Off-screen
	tempDiv.style.top = "0";
	// Set width similar to A4 paper for better scaling. 595pt (A4 width) ~ 793px at 96 DPI.
	// This width should ideally accommodate the table content.
	// Consider making this dynamic or using a very large width if tables are wide.
	tempDiv.style.width = "790px"; // A bit less than A4 width to account for potential margins
	tempDiv.style.background = "white";
	document.body.appendChild(tempDiv);

	// Log the HTML being sent to jsPDF/html2canvas
	// console.log("Styled HTML for PDF (Spreadsheet):", styledHtml);

	try {
		const pdf = new JsPDF({
			orientation: "landscape", // Spreadsheets are often wider
			unit: "pt",
			format: "a4", // A4 landscape: 841.89pt x 595.28pt
			compress: true,
		});

		onProgress?.({
			stage: "Converting",
			progress: 70,
			message: "Rendering spreadsheet to PDF...",
		});

		// Using html2canvas directly for more control, then adding image to PDF
		// This is often more reliable for complex HTML like tables than jsPDF.html() alone.
		const canvas = await Html2Canvas(tempDiv.getElementsByTagName("table")[0] || tempDiv, { // Render the table or the whole div
			scale: options.quality || 1.5, // Use quality as scale, default 1.5-2 for better resolution
			useCORS: true,
			logging: false, // Set to true for debugging html2canvas
			width: tempDiv.offsetWidth, // Use actual width of the off-screen div
			windowWidth: tempDiv.offsetWidth,
			// Ensure full content is captured if it's taller than default window
			height: tempDiv.offsetHeight > 0 ? tempDiv.offsetHeight : undefined,
			windowHeight: tempDiv.offsetHeight > 0 ? tempDiv.offsetHeight : undefined,
		});

		const imgData = canvas.toDataURL("image/png");
		const imgProps = pdf.getImageProperties(imgData);
		const pdfWidth = pdf.internal.pageSize.getWidth() - 72; // A4 width in points minus 0.5 inch margins (36pt * 2)
		const pdfHeight = pdf.internal.pageSize.getHeight() - 72;

		let imgHeight = imgProps.height * pdfWidth / imgProps.width;
		let heightLeft = imgHeight;
		let position = 36; // Top margin

		pdf.addImage(imgData, 'PNG', 36, position, pdfWidth, imgHeight);
		heightLeft -= pdfHeight;

		while (heightLeft > 0) {
			position = position - pdfHeight; // Negative position for subsequent pages
			pdf.addPage();
			pdf.addImage(imgData, 'PNG', 36, position, pdfWidth, imgHeight);
			heightLeft -= pdfHeight;
			onProgress?.({
				stage: "Converting",
				progress: 70 + Math.min(20, (1 - heightLeft / imgHeight) * 20), // Progress for multi-page
				message: `Adding page to PDF...`
			});
		}

		onProgress?.({
			stage: "Finalizing",
			progress: 95,
			message: "Finalizing PDF from spreadsheet...",
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
			message: "Spreadsheet to PDF conversion completed!",
		});

		return {
			success: true,
			file: convertedFile,
			originalName: originalFile.name,
			targetFormat: "pdf",
			fileSize: convertedFile.size,
		};

	} catch (error) {
		console.error("Spreadsheet HTML to PDF conversion error:", error);
		throw new Error(
			`Spreadsheet to PDF failed: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	} finally {
		document.body.removeChild(tempDiv);
	}
}
