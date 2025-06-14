// src/services/converters/__tests__/archiveConverter.test.ts
import { convertArchive } from "../archiveConverter";
import JSZipImport from 'jszip'; // Import the default export from the mock
import { Tar, Untar } from 'tar-js'; // Imports from the tar-js manual mock
import { ConversionProgress } from "../../../types";
import { TextEncoder } from 'util'; // For mockFile and pako mock

// Cast JSZip import to its expected type (mock constructor with static methods)
// This helps with TypeScript type checking for the static helper methods.
const JSZip = JSZipImport as jest.Mock & {
  loadAsync: jest.Mock;
  _resetAllMocks: () => void;
  _setStaticLoadAsyncFiles: (files: any) => void;
  _setInstanceFiles: (files: any) => void; // If this helper is used/defined in mock
  // Add other static props if used directly in tests: DEFLATE, STORE, support, version
};

// Mock pako for GZ tests (already in place from previous steps)
jest.mock('pako', () => ({
  gzip: jest.fn().mockImplementation(input => new Uint8Array([1,2,3,4,5])),
  inflate: jest.fn().mockImplementation(input => new Uint8Array(new TextEncoder().encode("inflated content"))),
}));

// mockFile helper (already standardized)
const mockFile = (name: string, content: string | ArrayBuffer, type: string): File => {
  const blobContent = content instanceof ArrayBuffer ? new Uint8Array(content) : content;
  const blob = new Blob([blobContent], { type });
  const file = new File([blob], name, { type });

  if (typeof file.arrayBuffer !== 'function') {
    (file as any).arrayBuffer = async () => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result instanceof ArrayBuffer) { resolve(reader.result); }
          else { reject(new Error("FileReader did not return ArrayBuffer")); }
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
          if (typeof reader.result === 'string') { resolve(reader.result); }
          else { reject(new Error("FileReader did not return string")); }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
      });
    };
  }
  return file;
};


describe("archiveConverter", () => {
  const onProgressMock = jest.fn<void, [ConversionProgress]>();

  beforeEach(() => {
    jest.clearAllMocks();
    if (JSZip._resetAllMocks) {
      JSZip._resetAllMocks();
    }
    // Reset Tar/Untar mocks if they have global state or static method mocks
    // This would require __resetMocks helpers in the tar-js manual mock.
    // For now, Tar/Untar are classes, new instances are created by SUT.
    // Calls to their methods (which are jest.fn() in the mock) are cleared by jest.clearAllMocks().
  });

  describe("zipToOther - GZ", () => {
    it("should convert a ZIP file to a GZ file", async () => {
      const zipData = new ArrayBuffer(10); // Content for the mock file
      const file = mockFile("test.zip", zipData, "application/zip");
      const mockEntryData = "entry content";

      // Configure the static JSZip.loadAsync for this test
      JSZip.loadAsync.mockResolvedValueOnce({
        files: { "file1.txt": { dir: false, async: jest.fn().mockResolvedValue(mockEntryData), name: "file1.txt", date: new Date() } },
        forEach: (cb) => cb("file1.txt", { dir: false, async: jest.fn().mockResolvedValue(mockEntryData), name: "file1.txt", date: new Date() }),
        // Add other methods if SUT uses them on loaded zip object
      });

      const result = await convertArchive(file, "gz", {}, onProgressMock);

      expect(JSZip.loadAsync).toHaveBeenCalledWith(zipData);
      expect(result.success).toBe(true);
      expect(result.file?.name).toBe("test.gz");
      expect(result.file?.type).toBe("application/gzip");
      expect(onProgressMock).toHaveBeenCalled();
    });
  });

  describe("otherToZip - GZ", () => {
    it("should convert a GZ file to a ZIP file", async () => {
      const gzDataBuffer = new Uint8Array([11,22,33]).buffer;
      const file = mockFile("test.gz", gzDataBuffer, "application/gzip");

      // SUT does `new JSZip()`. The constructor mock from __mocks__/jszip.js will be used.
      // Then, SUT calls methods on the instance.
      // We can get the instance via JSZip.mock.instances[0] after it's constructed.

      const result = await convertArchive(file, "zip", {}, onProgressMock);

      expect(JSZip).toHaveBeenCalledTimes(1); // Constructor called once for `new JSZip()` in SUT
      // Get the instance that was returned by the mocked constructor
      const actualMockInstanceReturnedByConstructor = (JSZip as jest.Mock).mock.results[0].value;
      expect(actualMockInstanceReturnedByConstructor.file).toHaveBeenCalledWith("test", expect.any(Uint8Array));
      expect(actualMockInstanceReturnedByConstructor.generateAsync).toHaveBeenCalledWith({ type: "uint8array", compression: "DEFLATE" });
      expect(result.success).toBe(true);
      expect(result.file?.name).toBe("test.zip");
      expect(result.file?.type).toBe("application/zip");
      expect(onProgressMock).toHaveBeenCalled();
    });
  });

  describe("zipToOther - TAR", () => {
    it("should convert a ZIP file to a TAR file", async () => {
      const zipData = new ArrayBuffer(20);
      const file = mockFile("archive.zip", zipData, "application/zip");
      const mockEntryContent = new Uint8Array([10,20,30]);

      JSZip.loadAsync.mockResolvedValueOnce({
        files: {
          "file1.txt": { dir: false, async: jest.fn().mockResolvedValue(mockEntryContent), name: "file1.txt", date: new Date() },
          "folder/": { dir: true, name: "folder/", date: new Date() }
        },
        forEach: (cb) => { /* Simplified, SUT doesn't use forEach for TAR path */ }
      });

      // The manual mock for tar-js exports Tar as jest.fn() which returns mockTarInstance
      // So, Tar itself is the mock constructor.
      const mockTarAppend = jest.fn();
      const mockTarOut = new Uint8Array([1,2,3,4,5]);
      (Tar as jest.Mock).mockImplementation(() => {
        return {
          append: mockTarAppend,
          out: mockTarOut, // Ensure the instance has 'out'
        };
      });


      const result = await convertArchive(file, "tar", {}, onProgressMock);

      expect(JSZip.loadAsync).toHaveBeenCalledWith(zipData);
      expect(Tar).toHaveBeenCalledTimes(1); // Tar constructor
      expect(mockTarAppend).toHaveBeenCalledWith("file1.txt", mockEntryContent);

      expect(result.success).toBe(true);
      expect(result.file).toBeDefined();
      expect(result.file?.name).toBe("archive.tar");
      expect(result.file?.type).toBe("application/x-tar");
      expect(result.file?.size).toBe(mockTarOut.length);
      expect(onProgressMock).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should return an error for unsupported conversion", async () => {
      const file = mockFile("test.txt", "some text", "text/plain");
      const result = await convertArchive(file, "xyz", {}, onProgressMock);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unsupported archive conversion: txt -> xyz");
    });

    it("should handle errors during zip processing (JSZip.loadAsync rejection)", async () => {
      const file = mockFile("bad.zip", new ArrayBuffer(10), "application/zip");
      JSZip.loadAsync.mockRejectedValue(new Error("Invalid ZIP file"));

      const result = await convertArchive(file, "gz", {}, onProgressMock);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid ZIP file");
    });
  });
});
