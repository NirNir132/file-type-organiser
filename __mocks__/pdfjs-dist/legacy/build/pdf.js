// <rootDir>/__mocks__/pdfjs-dist/legacy/build/pdf.js
// Using module.exports for Attempt 1

// console.log("Attempt 1: Using manual CJS mock for pdfjs-dist/legacy/build/pdf.js");

const mockPage = {
  getViewport: jest.fn().mockReturnValue({ width: 600, height: 800, scale: 1.5 }),
  render: jest.fn().mockResolvedValue(undefined),
  getTextContent: jest.fn().mockResolvedValue({
    items: [{ str: 'Mocked PDF Text CJS', hasEOL: true }],
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
  workerSrc: 'mock-worker-src-cjs', // Unique identifier for this mock version
};

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
  mockPage.getTextContent.mockResolvedValue({ items: [{ str: 'Mocked PDF Text CJS', hasEOL: true }] });
};

module.exports = {
  GlobalWorkerOptions,
  getDocument,
  __resetPdfJsMocks,
  // version: 'mock-pdfjs-version-cjs', // if needed
};
