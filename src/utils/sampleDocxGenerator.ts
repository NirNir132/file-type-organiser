import {
	Document,
	Packer,
	Paragraph,
	TextRun,
	Table,
	TableRow,
	TableCell,
	HeadingLevel,
} from "docx";

/**
 * Generates a sample DOCX document for testing the Document Intelligence feature
 */
export async function generateSampleDocx(): Promise<Blob> {
	const doc = new Document({
		sections: [
			{
				properties: {},
				children: [
					// Title
					new Paragraph({
						text: "Test Document for Document Intelligence",
						heading: HeadingLevel.HEADING_1,
					}),

					// Introduction
					new Paragraph({
						text: "Introduction",
						heading: HeadingLevel.HEADING_2,
					}),
					new Paragraph({
						children: [
							new TextRun({
								text: "This is a test document to demonstrate the Document Intelligence feature of our File Type Organizer application. This document contains various elements like paragraphs, headings, and tables that can be processed by our document processing service.",
							}),
						],
					}),

					// Document Processing section
					new Paragraph({
						text: "Document Processing",
						heading: HeadingLevel.HEADING_2,
						spacing: {
							before: 400,
						},
					}),
					new Paragraph({
						children: [
							new TextRun({
								text: "Document Intelligence can extract structured data from documents, including:",
							}),
						],
					}),
					new Paragraph({
						children: [
							new TextRun({
								text: "• Text content extraction",
							}),
						],
						bullet: {
							level: 0,
						},
					}),
					new Paragraph({
						children: [
							new TextRun({
								text: "• Table detection and parsing",
							}),
						],
						bullet: {
							level: 0,
						},
					}),
					new Paragraph({
						children: [
							new TextRun({
								text: "• Layout analysis",
							}),
						],
						bullet: {
							level: 0,
						},
					}),
					new Paragraph({
						children: [
							new TextRun({
								text: "• Metadata extraction",
							}),
						],
						bullet: {
							level: 0,
						},
					}),

					// Sample Table section
					new Paragraph({
						text: "Sample Data Table",
						heading: HeadingLevel.HEADING_2,
						spacing: {
							before: 400,
						},
					}),

					// Table
					new Table({
						rows: [
							// Header row
							new TableRow({
								children: [
									new TableCell({
										children: [new Paragraph("Document Type")],
										shading: {
											fill: "2980b9",
										},
									}),
									new TableCell({
										children: [new Paragraph("Processing Time")],
										shading: {
											fill: "2980b9",
										},
									}),
									new TableCell({
										children: [new Paragraph("Accuracy")],
										shading: {
											fill: "2980b9",
										},
									}),
								],
							}),
							// Data rows
							new TableRow({
								children: [
									new TableCell({
										children: [new Paragraph("PDF")],
									}),
									new TableCell({
										children: [new Paragraph("2-3 seconds")],
									}),
									new TableCell({
										children: [new Paragraph("95%")],
									}),
								],
							}),
							new TableRow({
								children: [
									new TableCell({
										children: [new Paragraph("DOCX")],
									}),
									new TableCell({
										children: [new Paragraph("1-2 seconds")],
									}),
									new TableCell({
										children: [new Paragraph("90%")],
									}),
								],
							}),
							new TableRow({
								children: [
									new TableCell({
										children: [new Paragraph("Images")],
									}),
									new TableCell({
										children: [new Paragraph("3-4 seconds")],
									}),
									new TableCell({
										children: [new Paragraph("85%")],
									}),
								],
							}),
							new TableRow({
								children: [
									new TableCell({
										children: [new Paragraph("HTML")],
									}),
									new TableCell({
										children: [new Paragraph("1 second")],
									}),
									new TableCell({
										children: [new Paragraph("98%")],
									}),
								],
							}),
						],
						width: {
							size: 100,
							type: "pct",
						},
					}),

					// Conclusion
					new Paragraph({
						text: "Conclusion",
						heading: HeadingLevel.HEADING_2,
						spacing: {
							before: 400,
						},
					}),
					new Paragraph({
						children: [
							new TextRun({
								text: "This sample document demonstrates the capabilities of our Document Intelligence feature. You can use this document to test the extraction and analysis functions.",
							}),
						],
					}),
				],
			},
		],
	});

	return await Packer.toBlob(doc);
}

/**
 * Downloads the sample DOCX
 */
export async function downloadSampleDocx(): Promise<void> {
	const docxBlob = await generateSampleDocx();
	const url = URL.createObjectURL(docxBlob);

	const link = document.createElement("a");
	link.href = url;
	link.download = "test-document.docx";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	// Clean up
	URL.revokeObjectURL(url);
}
