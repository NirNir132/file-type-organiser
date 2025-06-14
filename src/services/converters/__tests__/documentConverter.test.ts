// Import TextEncoder/TextDecoder for mockFile (if mockFile is used later)
// For this initial import test, it might not be strictly necessary yet.
import { TextEncoder, TextDecoder } from 'util';

// pdfjs-dist/legacy/build/pdf.js is manually mocked by a file at
// <rootDir>/__mocks__/pdfjs-dist/legacy/build/pdf.js
// Jest should automatically pick this up.
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

import mammoth from 'mammoth'; // Import to access the mock

// Mock mammoth
jest.mock("mammoth", () => ({
  extractRawText: jest.fn().mockResolvedValue({ value: 'Default Mocked Word text' }),
  convertToHtml: jest.fn().mockResolvedValue({ value: '<p>Default Mocked Word HTML</p>', messages: [] }),
  images: {
    imgElement: jest.fn((handler) => (image: any) => {
      return handler({
        contentType: image.contentType || "image/png",
        read: jest.fn().mockResolvedValue(image.buffer || "base64imagedata")
      });
    })
  }
}));

// Mock jspdf
const mockPdfInstance = {
  html: jest.fn().mockImplementation((element, config) => {
    if (config && typeof config.callback === 'function') {
      config.callback({}); // Simulate callback for jsPDF
    }
    return Promise.resolve();
  }),
  output: jest.fn().mockReturnValue(new Blob(['fake pdf data'], { type: 'application/pdf' })),
  addPage: jest.fn(),
  setFontSize: jest.fn(),
  text: jest.fn(),
  // Add any other methods called by the SUT, e.g. internal.pageSize from spreadsheetConverter
  internal: {
    pageSize: {
        getWidth: jest.fn().mockReturnValue(595),
        getHeight: jest.fn().mockReturnValue(842),
    }
  },
  getImageProperties: jest.fn().mockReturnValue({width: 100, height: 100}),
};
jest.mock("jspdf", () => ({ // Mocks the default export which is the class constructor
  __esModule: true,
  default: jest.fn(() => mockPdfInstance)
}));

// Mock html2canvas
jest.mock("html2canvas", () => ({
  __esModule: true, // Important for default export mocks
  default: jest.fn().mockResolvedValue({
    toDataURL: jest.fn().mockReturnValue('data:image/png;base64,fakeimgdata'),
    width: 800,
    height: 600,
  }),
}));

// Mock docx
const mockDocxPackerToBlob = jest.fn().mockResolvedValue(new Blob(['fake docx data'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
jest.mock("docx", () => ({
  Packer: {
    toBlob: mockDocxPackerToBlob,
  },
  Document: jest.fn(),
  Paragraph: jest.fn(),
  TextRun: jest.fn(),
  PageBreak: jest.fn(), // If used
  Table: jest.fn(),     // If used
  TableRow: jest.fn(),   // If used
  TableCell: jest.fn(), // If used
  WidthType: { DXA: 'dxa' }, // If used
  convertInchesToTwip: jest.fn(val => val * 1440),
  convertMillimetersToTwip: jest.fn(val => val * 56.7),
}));


describe('Document Converter - pdfjs-dist import test (Attempt 1: CJS mock)', () => {
  it('should import the mocked pdfjsLib and identify it', () => {
    expect(pdfjsLib).toBeDefined();
    expect(pdfjsLib.getDocument).toBeDefined();
    // Check if it's the CJS mock by looking for a property we defined only in that mock version
    expect(pdfjsLib.GlobalWorkerOptions.workerSrc).toBe('mock-worker-src-cjs');
  });

  // A more complex test using convertDocument and the mockFile helper would go here later,
  // once this basic import test passes.
  // For now, the priority is to confirm the manual mock is loaded.
});

// Add mockFile helper (copied and adapted from spreadsheetConverter.test.ts)
const mockFile = (name: string, content: string | ArrayBuffer, type: string): File => {
  const blobContent = content instanceof ArrayBuffer ? new Uint8Array(content) : content;
  const blob = new Blob([blobContent], { type });
  const file = new File([blob], name, { type });

  if (typeof file.arrayBuffer !== 'function') {
    (file as any).arrayBuffer = async () => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result instanceof ArrayBuffer) {
            resolve(reader.result);
          } else {
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
       return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
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

// --- Add pdfToText Test ---
import { convertDocument } from '../documentConverter';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.js'; // To access the mock
import { ConversionProgress } from '../../../types';


describe('Document Converter - PDF to Text', () => {
  const onProgressMock = jest.fn<void, [ConversionProgress]>();

  beforeEach(() => {
    onProgressMock.mockClear();
    // Reset the getDocument mock from the manual mock
    // The manual mock exports getDocument directly.
    (getDocument as jest.Mock).mockClear();

    // Define a default implementation for getDocument for this test suite,
    // which can be overridden in specific tests if needed.
    (getDocument as jest.Mock).mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: jest.fn().mockResolvedValue({
          getTextContent: jest.fn().mockResolvedValue({
            items: [{ str: 'Default mock text', hasEOL: true }],
          }),
        }),
      }),
    });
  });

  it('should convert PDF to text successfully', async () => {
    const pdfFile = mockFile('test.pdf', 'fake PDF content', 'application/pdf');

    // Specific mock response for this test case, if different from default
    const mockPdfDocument = {
      numPages: 1,
      getPage: jest.fn().mockResolvedValue({
        getTextContent: jest.fn().mockResolvedValue({
          // Adjusted items to produce "Hello world\n" with the SUT's spacing logic
          items: [{ str: 'Hello', hasEOL: false }, {str: 'world', hasEOL: true }],
        }),
      }),
    };
    (getDocument as jest.Mock).mockReturnValueOnce({ promise: Promise.resolve(mockPdfDocument) });

    const result = await convertDocument(pdfFile, 'txt', {}, onProgressMock);

    expect(getDocument).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.file?.name).toBe('test.txt');
    expect(result.error).toBeUndefined();

    // To robustly get text from the result.file in a test environment:
    let textContent = '';
    if (result.file) {
      if (typeof result.file.text === 'function') {
        textContent = await result.file.text();
      } else {
        // Fallback for JSDOM if .text() isn't on the File instance from SUT
        textContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsText(result.file as Blob); // Cast to Blob as File is a Blob
        });
      }
    }
    expect(textContent).toBe('Hello world\n');

    expect(onProgressMock).toHaveBeenCalledWith(expect.objectContaining({ stage: 'Complete', progress: 100 }));
  });

  it('should handle errors during PDF text extraction', async () => {
    const pdfFile = mockFile('error.pdf', 'fake error content', 'application/pdf');
    (getDocument as jest.Mock).mockImplementationOnce(() => ({
        promise: Promise.reject(new Error('Mock PDF parsing error'))
    }));

    const result = await convertDocument(pdfFile, 'txt', {}, onProgressMock);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Mock PDF parsing error');
  });
});

// --- Additional Tests for documentConverter ---
import { convertDocument } from '../documentConverter';
import { getDocument as getPdfJsDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.js'; // For pdfjs-dist mock access
import mammoth from 'mammoth';
import jsPDF from 'jspdf'; // Default import for jsPDF class mock
import { Packer as DocxPacker, Document as DocxDocument, Paragraph as DocxParagraph, TextRun as DocxTextRun } from 'docx'; // For docx mock access
import { ConversionProgress } from '../../../types';

// mockFile helper should already be defined from the previous diff.

describe('Document Converter - Full Suite', () => {
  const onProgressMock = jest.fn<void, [ConversionProgress]>();

  beforeEach(() => {
    jest.clearAllMocks(); // Clears all mocks

    // Reset specific mock implementations for pdfjs-dist if needed,
    // though the manual mock's __resetPdfJsMocks should handle its state.
    // If tests modify the behavior of getPdfJsDocument().promise.resolve().getPage().etc...
    // those specific mocks might need resetting here too.
    // For now, assume manual mock + clearAllMocks is enough.
    const pdfjsMock = require('pdfjs-dist/legacy/build/pdf.js');
    if (pdfjsMock.__resetPdfJsMocks) {
       pdfjsMock.__resetPdfJsMocks();
    }
    // Reset mammoth mocks using the imported reference
    (mammoth.extractRawText as jest.Mock).mockClear().mockResolvedValue({ value: 'Default Mocked Word text' });
    (mammoth.convertToHtml as jest.Mock).mockClear().mockResolvedValue({ value: '<p>Default Mocked Word HTML</p>', messages: [] });

    // Reset JSPDF instance mocks
    (mockPdfInstance.html as jest.Mock).mockClear().mockImplementation((element, config) => {
       if (config && typeof config.callback === 'function') { config.callback({});}
        return Promise.resolve();
     });
     (mockPdfInstance.output as jest.Mock).mockReturnValue(new Blob(['fake pdf data'], { type: 'application/pdf' }));
     (mockDocxPackerToBlob as jest.Mock).mockResolvedValue(new Blob(['fake docx data'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));

  });

  // --- pdfToImage ---
  describe('pdfToImage', () => {
    it('should convert PDF to an image (e.g., png)', async () => {
      const pdfFile = mockFile('test.pdf', 'fake pdf data', 'application/pdf');
      // Ensure pdfjs-dist mock is set up for getPage -> render
       const mockPageRender = jest.fn().mockResolvedValue(undefined);
       const mockGetPage = jest.fn().mockResolvedValue({
         getViewport: jest.fn().mockReturnValue({ width: 100, height: 150, scale: 1.5 }),
         render: mockPageRender,
       });
      (getPdfJsDocument as jest.Mock).mockReturnValue({
        promise: Promise.resolve({ numPages: 1, getPage: mockGetPage }),
      });

      // Mock canvas.toBlob for image output
      const mockToBlob = jest.fn((callback, type) => callback(new Blob(['fake png'], {type})));
      jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'canvas') {
          return {
            getContext: () => ({ fillRect: jest.fn(), drawImage: jest.fn() }), // mock context
            toBlob: mockToBlob,
            width: 0, height: 0,
          } as unknown as HTMLCanvasElement;
        }
        return jest.requireActual('react-dom/test-utils').Simulate.create(tagName); // Fallback for other elements
      });


      const result = await convertDocument(pdfFile, 'png', {}, onProgressMock);
      expect(result.success).toBe(true);
      expect(result.file?.name).toBe('test.png');
      expect(result.file?.type).toBe('image/png');
      expect(getPdfJsDocument).toHaveBeenCalled();
      expect(mockGetPage).toHaveBeenCalledWith(1); // Assuming first page
      expect(mockPageRender).toHaveBeenCalled();
      expect(mockToBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png', expect.any(Number));
    });
  });

  // --- pdfToDocxInternal ---
  describe('pdfToDocxInternal', () => {
    it('should convert PDF to DOCX', async () => {
      const pdfFile = mockFile('test.pdf', 'fake pdf data', 'application/pdf');
      // pdfjs mock is already set up to provide text via getDocument -> getPage -> getTextContent

      const result = await convertDocument(pdfFile, 'docx', {}, onProgressMock);
      expect(result.success).toBe(true);
      expect(result.file?.name).toBe('test.docx');
      expect(getPdfJsDocument).toHaveBeenCalled();
      expect(DocxPacker.toBlob).toHaveBeenCalled();
    });
  });

  // --- wordToText ---
  describe('wordToText', () => {
    it('should convert DOCX to text', async () => {
      // Specific mock for this test if needed, otherwise default from beforeEach is used.
      (mammoth.extractRawText as jest.Mock).mockResolvedValueOnce({ value: 'Specific test text for docx to text' });
      const docxFile = mockFile('test.docx', 'fake docx data', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      const result = await convertDocument(docxFile, 'txt', {}, onProgressMock);

      expect(mammoth.extractRawText).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.file?.name).toBe('test.txt');

      let fileText = '';
      if (result.file) {
          if (typeof result.file.text === 'function') fileText = await result.file.text();
          else fileText = await new Promise((resolve) => { const fr = new FileReader(); fr.onload = (e) => resolve(e.target?.result as string); fr.readAsText(result.file as Blob); });
      }
      expect(fileText).toBe('Specific test text for docx to text');
    });
  });

  // --- wordToPdfAdvanced ---
  describe('wordToPdfAdvanced', () => {
    it('should convert DOCX to PDF', async () => {
      const docxFile = mockFile('test.docx', 'fake docx data', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      const result = await convertDocument(docxFile, 'pdf', {}, onProgressMock);

      expect(mammoth.convertToHtml).toHaveBeenCalled();
      const jsPDFMockConstructor = require("jspdf").default; // Get the mock constructor
      expect(jsPDFMockConstructor).toHaveBeenCalled();
      expect(mockPdfInstance.html).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.file?.name).toBe('test.pdf');
    });
  });

  // --- textToDocx ---
  describe('textToDocx', () => {
    it('should convert text file to DOCX', async () => {
      const txtFile = mockFile('test.txt', 'Hello world', 'text/plain');
      const result = await convertDocument(txtFile, 'docx', {}, onProgressMock);
      expect(result.success).toBe(true);
      expect(result.file?.name).toBe('test.docx');
      expect(DocxPacker.toBlob).toHaveBeenCalled();
      // Check if DocxDocument, Paragraph, TextRun were called (they are constructors)
      expect(require('docx').Document).toHaveBeenCalled();
      expect(require('docx').Paragraph).toHaveBeenCalled();
      expect(require('docx').TextRun).toHaveBeenCalledWith('Hello world');
    });
  });

  // --- textToPdf ---
  describe('textToPdf', () => {
    it('should convert text file to PDF', async () => {
      const txtFile = mockFile('test.txt', 'Hello PDF', 'text/plain');
      const result = await convertDocument(txtFile, 'pdf', {}, onProgressMock);
      expect(result.success).toBe(true);
      expect(result.file?.name).toBe('test.pdf');
      expect(jsPDF).toHaveBeenCalled();
      expect(mockPdfInstance.html).toHaveBeenCalledWith(expect.stringContaining('<pre style="white-space: pre-wrap; font-family: monospace;">Hello PDF</pre>'), expect.any(Object));
    });
  });
});
