// <rootDir>/__mocks__/jszip.js
console.log('Attempting to load JSZip MANUAL MOCK (Corrected Default Export)');

const mockInstanceMethods = {
  file: jest.fn().mockReturnThis(),
  generateAsync: jest.fn().mockResolvedValue(new Blob(['minimal zip from instance'])),
};

const MockJSZip = {
  constructorFn: jest.fn(() => mockInstanceMethods),
  loadAsync: jest.fn().mockResolvedValue({
    files: { 'test.txt': { name: 'test.txt', async: () => Promise.resolve('content from loadAsync') } },
    forEach: jest.fn(cb => cb('test.txt', { name: 'test.txt', async: () => Promise.resolve('content from loadAsync forEach') })),
    file: jest.fn(path => ({ name: path, async: () => Promise.resolve('content from loaded file') }))
  }),
  _resetAllMocks: jest.fn(() => {
    MockJSZip.constructorFn.mockClear();
    mockInstanceMethods.file.mockClear().mockReturnThis();
    mockInstanceMethods.generateAsync.mockClear().mockResolvedValue(new Blob(['minimal zip from instance']));
    MockJSZip.loadAsync.mockClear().mockResolvedValue({
      files: { 'test.txt': { name: 'test.txt', async: () => Promise.resolve('content from loadAsync') } },
      forEach: jest.fn(cb => cb('test.txt', { name: 'test.txt', async: () => Promise.resolve('content from loadAsync forEach') })),
      file: jest.fn(path => ({ name: path, async: () => Promise.resolve('content from loaded file') }))
    });
    // console.log('JSZip MANUAL MOCK _resetAllMocks CALLED (Corrected)');
  }),
  __isMocked__: true,
  __uniqueMockProperty__: 'Hello from JSZip Manual Mock!',
  support: { blob: true },
  version: "mock-3.x.x",
  DEFLATE: "DEFLATE",
  STORE: "STORE",
};

// The default export should be the function that acts as the constructor
const MainMockConstructor = MockJSZip.constructorFn;

// Attach all other static-like properties from MockJSZip to this main constructor mock
for (const key in MockJSZip) {
  if (key !== 'constructorFn') {
    MainMockConstructor[key] = MockJSZip[key];
  }
}

console.log('JSZip MANUAL MOCK (Corrected): Exporting MainMockConstructor:', MainMockConstructor.__uniqueMockProperty__);

export default MainMockConstructor;
