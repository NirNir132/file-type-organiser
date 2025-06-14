// src/services/converters/__mocks__/pdfjs-dist/legacy/build/pdf.js
// This path directly mimics the import path in documentConverter.ts

// console.log("Using SUT-adjacent manual mock for pdfjs-dist/legacy/build/pdf.js");

const mockPage = {
  getViewport: jest.fn().mockReturnValue({ width: 600, height: 800, scale: 1.5 }),
  render: jest.fn().mockResolvedValue(undefined),
  getTextContent: jest.fn().mockResolvedValue({
    items: [{ str: 'Mocked PDF Text', hasEOL: true }],
  }),
};

const mockDocument = {
  numPages: 1,
  getPage: jest.fn().mockResolvedValue(mockPage),
};

const getDocument = jest.fn().mockReturnValue({
  promise: Promise.resolve(mockDocument),
});

const GlobalWorkerOptions = {
  workerSrc: 'mock-worker.js',
};

// Helper to reset mocks, if needed from tests, though direct jest.clearAllMocks()
// on 'getDocument' (if re-imported in test) or specific mock fns is usually better.
const __resetPdfJsMocks = () => {
  getDocument.mockClear();
  getDocument.mockReturnValue({ promise: Promise.resolve(mockDocument) });

  mockDocument.getPage.mockClear();
  mockDocument.getPage.mockResolvedValue(mockPage);

  mockPage.getViewport.mockClear();
  mockPage.getViewport.mockReturnValue({ width: 600, height: 800, scale: 1.5 });
  mockPage.render.mockClear();
  mockPage.render.mockResolvedValue(undefined);
  mockPage.getTextContent.mockClear();
  mockPage.getTextContent.mockResolvedValue({ items: [{ str: 'Mocked PDF Text', hasEOL: true }] });
};

module.exports = {
  GlobalWorkerOptions,
  getDocument,
  __resetPdfJsMocks, // Export reset if tests need to call it
  // version: 'mock-pdfjs-version', // if needed by SUT
};
