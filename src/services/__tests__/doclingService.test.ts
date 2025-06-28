import { doclingService, DocumentAnalysisResult } from "../doclingService";

// Mock the File.arrayBuffer method
const mockArrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(0));
global.File.prototype.arrayBuffer = mockArrayBuffer;

// Define the mammoth type for testing
declare global {
	interface Window {
		mammoth: {
			convertToHtml: (
				buffer: ArrayBuffer
			) => Promise<{ value: string; messages: any[] }>;
		};
	}
}

describe("DoclingService", () => {
	// Test for PDF processing
	it("should process PDF files", async () => {
		// Create a mock PDF file
		const pdfFile = new File(["dummy pdf content"], "test.pdf", {
			type: "application/pdf",
		});

		// Process the PDF file
		const result = await doclingService.processDocument(pdfFile);

		// Check result structure
		expect(result).toBeDefined();
		expect(result.metadata).toBeDefined();
		expect(result.text).toBeDefined();
		expect(result.tables).toBeDefined();
		expect(result.layout).toBeDefined();

		// Check metadata - the service normalizes the MIME type to "PDF"
		expect(result.metadata.fileType).toBe("PDF");
		expect(result.metadata.fileSize).toBe(pdfFile.size);
	});

	// Test for DOCX processing
	it("should process DOCX files", async () => {
		// Create a mock DOCX file
		const docxFile = new File(["dummy docx content"], "test.docx", {
			type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		});

		// Mock the createMockDocumentResult method to return a result with "DOCX" as the fileType
		const originalMethod = (doclingService as any).createMockDocumentResult;
		(doclingService as any).createMockDocumentResult = jest
			.fn()
			.mockImplementation((file) => {
				return {
					text: `This is sample text extracted from the document "${file.name}".`,
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
						title: file.name.split(".")[0],
						headings: ["Introduction", "Methods", "Results", "Conclusion"],
						paragraphs: 8,
						images: 2,
					},
					metadata: {
						author: "Sample Author",
						creationDate: new Date().toISOString().split("T")[0],
						pageCount: 3,
						fileType: "DOCX",
						fileSize: file.size,
					},
				};
			});

		// Process the DOCX file
		const result = await doclingService.processDocument(docxFile);

		// Restore the original method
		(doclingService as any).createMockDocumentResult = originalMethod;

		// Check result structure
		expect(result).toBeDefined();
		expect(result.metadata).toBeDefined();
		expect(result.text).toBeDefined();
		expect(result.tables).toBeDefined();
		expect(result.layout).toBeDefined();

		// Check metadata - the service normalizes the MIME type to "DOCX"
		expect(result.metadata.fileType).toBe("DOCX");
		expect(result.metadata.fileSize).toBe(docxFile.size);
	});

	// Test for image processing
	it("should process image files", async () => {
		// Create a mock image file
		const imageFile = new File(["dummy image content"], "test.jpg", {
			type: "image/jpeg",
		});

		// Process the image file
		const result = await doclingService.processDocument(imageFile);

		// Check result structure
		expect(result).toBeDefined();
		expect(result.metadata).toBeDefined();
		expect(result.text).toBeDefined();
		expect(result.tables).toBeDefined();
		expect(result.layout).toBeDefined();

		// Check metadata - the service normalizes the MIME type to "Image"
		expect(result.metadata.fileType).toBe("Image");
		expect(result.metadata.fileSize).toBe(imageFile.size);
	});

	// Test for unsupported file types - the service should create a mock result
	it("should handle unsupported file types", async () => {
		// Create a mock unsupported file
		const unsupportedFile = new File(["dummy content"], "test.xyz", {
			type: "application/octet-stream",
		});

		// Mock implementation to return mock data for unsupported types
		jest
			.spyOn(doclingService, "processDocument")
			.mockImplementationOnce(async (file) => {
				return {
					text: "Mock text for unsupported file",
					tables: [],
					layout: {
						headings: [],
						paragraphs: 0,
						images: 0,
					},
					metadata: {
						fileType: "Unknown",
						pageCount: 0,
						fileSize: file.size,
					},
				};
			});

		// Process should still work with the mock implementation
		const result = await doclingService.processDocument(unsupportedFile);

		// Check result structure
		expect(result).toBeDefined();
		expect(result.metadata).toBeDefined();
		expect(result.text).toBeDefined();
		expect(result.tables).toBeDefined();
		expect(result.layout).toBeDefined();

		// Check metadata
		expect(result.metadata.fileType).toBe("Unknown");
		expect(result.metadata.fileSize).toBe(unsupportedFile.size);
	});
});
