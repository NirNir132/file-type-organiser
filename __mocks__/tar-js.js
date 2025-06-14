// <rootDir>/__mocks__/tar-js.js
const { TextEncoder } = require('util');

// console.log("Using updated manual mock for tar-js with jest.fn() constructor for Tar");

const mockTarInstance = {
  append: jest.fn((filename, data, opts) => {}),
  out: new Uint8Array([116, 97, 114, 32, 100, 97, 116, 97]), // "tar data"
  write: jest.fn(function() { return this.out; }), // Ensure 'this' context if called
};

export const Tar = jest.fn(() => mockTarInstance);

const mockUntarInstance = {
  onfilecallback: null,
  arrayBuffer: null,
  set onfile(callback) {
    this.onfilecallback = callback;
    if (this.onfilecallback && this.arrayBuffer) {
      const mockFileEntry = {
        name: 'mocked-untar-entry.txt',
        buffer: new TextEncoder().encode('mock untarred content').buffer,
        type: 'file',
        eof: false,
        extract: jest.fn(() => new Uint8Array(new TextEncoder().encode('mock untarred content').buffer))
      };
      this.onfilecallback(mockFileEntry);
      this.onfilecallback({ eof: true, name: null, buffer: null });
    }
  },
  get onfile() {
    return this.onfilecallback;
  },
  // Add any other methods Untar instances might need
};

export const Untar = jest.fn((arrayBuffer) => {
  const instance = Object.create(mockUntarInstance);
  instance.arrayBuffer = arrayBuffer;
  instance.onfilecallback = null; // Ensure fresh callback for each instance
  // Ensure 'onfile' setter/getter are correctly on the instance
  // This is tricky with object create; might be better to return a new object literal
  // that mimics the structure, or refine how 'onfile' is handled.
  // For now, let's try with this. If onfile is not set correctly, test will fail.
  return {
    arrayBuffer: arrayBuffer,
    _onfilecallback: null,
    set onfile(cb) { this._onfilecallback = cb; /* simplified simulation */ },
    get onfile() { return this._onfilecallback; },
    // Simulate the onfile behavior from the previous mock more directly here
    _simulateFileProcessing: function() {
        if (this._onfilecallback) {
            const mockFileEntry = {
                name: 'simulated-untar-entry.txt',
                buffer: new TextEncoder().encode('simulated untarred content').buffer,
                type: 'file', eof: false,
                extract: jest.fn(() => new Uint8Array(new TextEncoder().encode('simulated untarred content').buffer))
            };
            this._onfilecallback(mockFileEntry);
            this._onfilecallback({ eof: true, name: null, buffer: null });
        }
    }
  };
});

// Helper to reset Tar and Untar mocks
export const __resetTarMocks = () => {
  Tar.mockClear();
  // Reset methods on the shared mockTarInstance that Tar constructor returns
  mockTarInstance.append.mockClear();
  mockTarInstance.write.mockClear();
  // Reset 'out' if it's modified by tests (it's not currently)

  Untar.mockClear();
  // Untar's mock instance methods are part of the object returned by the constructor.
  // If we need to clear calls on those, it's more complex as each `new Untar()` creates a new object.
  // For now, clearing the constructor mock is the main part.
};

// Ensure __esModule is present for Jest's ESM interop with CJS-style module.exports if this file was CJS.
// However, since this file IS __mocks__/tar-js.js and uses ESM `export`, this might not be needed
// but doesn't hurt if Jest's internals check for it during resolution.
// export const __esModule = true; // Usually for CJS mocks being imported into ESM.
                                // For ESM mocks, this isn't standard. Removing it.
