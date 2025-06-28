import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import DocumentIntelligence from "../DocumentIntelligence";
import { doclingService } from "../../services/doclingService";

// Mock the doclingService
jest.mock("../../services/doclingService", () => ({
	doclingService: {
		processDocument: jest.fn().mockResolvedValue({
			text: "Sample extracted text",
			tables: [
				{
					headers: ["Header1", "Header2"],
					rows: [["Data1", "Data2"]],
				},
			],
			layout: {
				title: "Test Document",
				headings: ["Heading 1", "Heading 2"],
				paragraphs: 3,
				images: 1,
			},
			metadata: {
				author: "Test Author",
				creationDate: "2023-05-01",
				pageCount: 2,
				fileType: "PDF",
				fileSize: 12345,
			},
		}),
	},
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "mock-url");
global.URL.revokeObjectURL = jest.fn();

describe("DocumentIntelligence Component", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("renders the document intelligence interface", () => {
		render(<DocumentIntelligence />);

		expect(screen.getAllByText(/Document Processing/i)[0]).toBeInTheDocument();
		expect(
			screen.getByText(/Upload a document to extract structured data/i)
		).toBeInTheDocument();
		expect(
			screen.getByText(/Drag & drop your document here/i)
		).toBeInTheDocument();
	});

	test("processes document when file is uploaded", async () => {
		render(<DocumentIntelligence />);

		const file = new File(["dummy content"], "test.pdf", {
			type: "application/pdf",
		});
		const fileInput = screen.getByLabelText(/Browse Files/i);

		Object.defineProperty(fileInput, "files", {
			value: [file],
		});

		fireEvent.change(fileInput);

		await waitFor(() => {
			expect(screen.getByText("test.pdf")).toBeInTheDocument();
		});

		const processButton = screen.getByText("Process Document");
		fireEvent.click(processButton);

		await waitFor(() => {
			expect(doclingService.processDocument).toHaveBeenCalled();
		});

		await waitFor(() => {
			expect(screen.getByText("Sample extracted text")).toBeInTheDocument();
		});
	});

	test("shows error message when processing fails", async () => {
		// Mock the processDocument to reject
		(doclingService.processDocument as jest.Mock).mockRejectedValueOnce(
			new Error("Processing failed")
		);

		render(<DocumentIntelligence />);

		const file = new File(["dummy content"], "test.pdf", {
			type: "application/pdf",
		});
		const fileInput = screen.getByLabelText(/Browse Files/i);

		Object.defineProperty(fileInput, "files", {
			value: [file],
		});

		fireEvent.change(fileInput);

		await waitFor(() => {
			expect(screen.getByText("test.pdf")).toBeInTheDocument();
		});

		const processButton = screen.getByText("Process Document");
		fireEvent.click(processButton);

		await waitFor(() => {
			expect(screen.getByText("Error:")).toBeInTheDocument();
			expect(
				screen.getByText(/An error occurred while processing the document/i)
			).toBeInTheDocument();
		});
	});
});
