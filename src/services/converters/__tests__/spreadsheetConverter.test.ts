import { convertSpreadsheet } from "../spreadsheetConverter";
import * as XLSX from "xlsx";
import { ConversionProgress, ConversionResult } from "../../../types";
import { TextEncoder, TextDecoder } from 'util'; // Import for Node.js environment if JSDOM's isn't working
import jsPDF from "jspdf"; // Import for type checking, actual is mocked
import html2canvas from "html2canvas"; // Import for type checking, actual is mocked

// Mock xlsx
jest.mock("xlsx", () => ({
  read: jest.fn().mockReturnValue({
    SheetNames: ["Sheet1"],
    Sheets: {
      Sheet1: { A1: { t: "s", v: "Test Data" } },
    },
  }),
  utils: {
    sheet_to_html: jest
      .fn()
      .mockReturnValue("<table><tr><td>Test Data</td></tr></table>"),
    book_new: jest.fn(),
    aoa_to_sheet: jest.fn(),
    book_append_sheet: jest.fn(),
  },
  write: jest.fn().mockImplementation((wb, opts) => {
    if (opts.bookType === "csv") return "csv,data"; // string for CSV
    return new Uint8Array([1, 2, 3]).buffer; // ArrayBuffer for others
  }),
}));

// Mock jspdf
const mockJsPDFInstance = {
  html: jest.fn().mockImplementation((element, options) => {
    if (options && options.callback) {
      options.callback({}); // Simulate callback
    }
    return Promise.resolve();
  }),
  output: jest.fn().mockReturnValue(new Blob(["fake pdf data"], { type: "application/pdf" })),
  addPage: jest.fn(),
  addImage: jest.fn(),
  internal: {
    pageSize: {
        getWidth: jest.fn().mockReturnValue(842), // Landscape A4
        getHeight: jest.fn().mockReturnValue(595),
    }
  },
  getImageProperties: jest.fn().mockReturnValue({width: 100, height: 100}),
};
jest.mock("jspdf", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockJsPDFInstance)
}));

// html2canvas is typically imported as a default export: import html2canvas from 'html2canvas';
// The SUT uses dynamic import: const module = await import("html2canvas"); html2canvasModule = module.default;
// So, the mock needs to provide a 'default' property.
jest.mock("html2canvas", () => ({
  __esModule: true, // Important for ES Module mocks with a default export
  default: jest.fn().mockResolvedValue({
    toDataURL: jest.fn().mockReturnValue('data:image/png;base64,fakeimgdata'),
    width: 800,
    height: 600,
  }),
}));


describe("spreadsheetConverter", () => {
  const mockFile = (name: string, content: string | ArrayBuffer, type: string): File => {
    const blobContent = content instanceof ArrayBuffer ? new Uint8Array(content) : content;
    // Create a blob from the content first
    const blob = new Blob([blobContent], { type });

    // Create the File object from the blob
    const file = new File([blob], name, { type });

    // JSDOM's File object might not have arrayBuffer() or text() methods,
    // or they might not work as expected with Blob content.
    // Manually add them if they don't exist or don't work.
    if (typeof file.arrayBuffer !== 'function') {
      (file as any).arrayBuffer = async () => {
        // Read the blob's ArrayBuffer
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result instanceof ArrayBuffer) {
              resolve(reader.result);
            } else {
              // This case should ideally not happen if reader reads as ArrayBuffer
              reject(new Error("FileReader did not return ArrayBuffer"));
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(blob);
        });
      };
    }

    if (typeof file.text !== 'function') {
      (file as any).text = async () => {
        // Read the blob's text content
         return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              // This case should ideally not happen if reader reads as text
              reject(new Error("FileReader did not return string"));
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsText(blob);
        });
      };
    }
    return file;
  };

  const mockXLSXFile = (name: string, fakeSheetData: string = "Sheet1,A1,TestCell") => {
    const buffer = new TextEncoder().encode(fakeSheetData).buffer; // Now TextEncoder should be available
    return mockFile(name, buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  const onProgressMock = jest.fn<void, [ConversionProgress]>();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock workbook for each test to avoid interference if tests modify it
    (XLSX.read as jest.Mock).mockReturnValue({
        SheetNames: ["Sheet1"],
        Sheets: {
          Sheet1: { A1: { t: "s", v: "Test Data" } },
        },
    });
  });

  it('mockFile should have a working arrayBuffer method', async () => {
    const file = mockXLSXFile('test.xlsx', 'data');
    expect(typeof file.arrayBuffer).toBe('function');
    const buffer = await file.arrayBuffer();
    expect(buffer).toBeInstanceOf(ArrayBuffer);
    const decodedText = new TextDecoder().decode(buffer); // Use TextDecoder to verify content
    expect(decodedText).toBe('data');
    expect(buffer.byteLength).toBe(4); // 'data' is 4 bytes in UTF-8

    const textFromBlob = await file.text();
    expect(textFromBlob).toBe('data');
  });

  describe("XLSX to CSV", () => {
    it("should convert an XLSX file to CSV", async () => {
      const file = mockXLSXFile("test.xlsx");

      const result = await convertSpreadsheet(file, "csv", {}, onProgressMock);

      expect(XLSX.read).toHaveBeenCalledWith(await file.arrayBuffer(), { type: "array" });
      expect(XLSX.write).toHaveBeenCalledWith(
        expect.objectContaining({ SheetNames: ["Sheet1"] }), // Check if a workbook-like object was passed
        { type: "array", bookType: "csv" }
      );
      expect(result.success).toBe(true);
      expect(result.file?.name).toBe("test.csv");
      expect(result.file?.type).toBe("text/csv");
      expect(onProgressMock).toHaveBeenCalledWith(expect.objectContaining({ stage: "Complete" }));
    });
  });

  describe("XLSX to PDF", () => {
    it("should convert an XLSX file to PDF", async () => {
      const file = mockXLSXFile("test.xlsx");

      const result = await convertSpreadsheet(file, "pdf", {}, onProgressMock);

      expect(XLSX.read).toHaveBeenCalledWith(await file.arrayBuffer(), { type: "array" });
      expect(XLSX.utils.sheet_to_html).toHaveBeenCalledWith(
        expect.objectContaining({ A1: { t: "s", v: "Test Data" } }) // Check if a sheet-like object was passed
        , expect.any(Object) // options for sheet_to_html
      );

      // Check if html2canvas was called (indirectly via htmlSheetToPdf)
      const html2canvasMockModule = require("html2canvas");
      expect(html2canvasMockModule.default).toHaveBeenCalled();

      // Check if jsPDF constructor and methods were called (indirectly via htmlSheetToPdf)
      const jsPDFMock = require("jspdf").default; // Gets the mock constructor
      expect(jsPDFMock).toHaveBeenCalled();
      expect(mockJsPDFInstance.addImage).toHaveBeenCalled();
      expect(mockJsPDFInstance.output).toHaveBeenCalledWith("blob");

      expect(result.success).toBe(true);
      expect(result.file?.name).toBe("test.pdf");
      expect(result.file?.type).toBe("application/pdf");
      expect(onProgressMock).toHaveBeenCalledWith(expect.objectContaining({ stage: "Complete" }));
    });
  });

  describe("Error Handling", () => {
    it("should handle XLSX.read error", async () => {
        const file = mockXLSXFile("bad.xlsx");
        (XLSX.read as jest.Mock).mockImplementationOnce(() => {
            throw new Error("Test XLSX read error");
        });

        const result = await convertSpreadsheet(file, "csv", {}, onProgressMock);
        expect(result.success).toBe(false);
        expect(result.error).toBe("Test XLSX read error");
        expect(onProgressMock).toHaveBeenCalledWith(expect.objectContaining({ stage: "Error" }));
    });

    it("should handle unsupported target format", async () => {
        const file = mockXLSXFile("test.xlsx");
        const result = await convertSpreadsheet(file, "unsupported", {}, onProgressMock);
        expect(result.success).toBe(false);
        expect(result.error).toContain("Unsupported spreadsheet conversion");
    });
  });
});
