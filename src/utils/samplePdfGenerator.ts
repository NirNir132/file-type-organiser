import { jsPDF } from "jspdf";
import "jspdf-autotable";

declare module "jspdf" {
	interface jsPDF {
		autoTable: (options: any) => jsPDF;
	}
}

/**
 * Generates a sample PDF document for testing the Document Intelligence feature
 */
export function generateSamplePdf(): Blob {
	const doc = new jsPDF();

	// Add title
	doc.setFontSize(22);
	doc.text("Test Document for Document Intelligence", 20, 20);

	// Add introduction
	doc.setFontSize(16);
	doc.text("Introduction", 20, 40);

	doc.setFontSize(12);
	doc.text(
		"This is a test document to demonstrate the Document Intelligence feature of our File Type\n" +
			"Organizer application. This document contains various elements like paragraphs, headings,\n" +
			"and tables that can be processed by our document processing service.",
		20,
		50
	);

	// Add section on document processing
	doc.setFontSize(16);
	doc.text("Document Processing", 20, 80);

	doc.setFontSize(12);
	doc.text(
		"Document Intelligence can extract structured data from documents, including:\n\n" +
			"• Text content extraction\n" +
			"• Table detection and parsing\n" +
			"• Layout analysis\n" +
			"• Metadata extraction",
		20,
		90
	);

	// Add a table
	doc.setFontSize(16);
	doc.text("Sample Data Table", 20, 130);

	doc.autoTable({
		startY: 140,
		head: [["Document Type", "Processing Time", "Accuracy"]],
		body: [
			["PDF", "2-3 seconds", "95%"],
			["DOCX", "1-2 seconds", "90%"],
			["Images", "3-4 seconds", "85%"],
			["HTML", "1 second", "98%"],
		],
		theme: "striped",
		headStyles: { fillColor: [41, 128, 185], textColor: 255 },
		margin: { top: 10 },
	});

	// Add conclusion
	doc.setFontSize(16);
	doc.text("Conclusion", 20, 190);

	doc.setFontSize(12);
	doc.text(
		"This sample document demonstrates the capabilities of our Document Intelligence\n" +
			"feature. You can use this document to test the extraction and analysis functions.",
		20,
		200
	);

	// Return as blob
	return doc.output("blob") as Blob;
}

/**
 * Downloads the sample PDF
 */
export function downloadSamplePdf(): void {
	const pdfBlob = generateSamplePdf();
	const url = URL.createObjectURL(pdfBlob);

	const link = document.createElement("a");
	link.href = url;
	link.download = "test-document.pdf";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	// Clean up
	URL.revokeObjectURL(url);
}
