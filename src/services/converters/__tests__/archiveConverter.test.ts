import { convertArchive } from "../archiveConverter";
import JSZip from "jszip";
// @ts-ignore
import { Tar, Untar } from "tar-js";
import { ConversionProgress } from "../../../types";

// Mock JSZip
jest.mock("jszip");

// Mock tar-js
// jest.mock("tar-js"); // tar-js is not a default export, need to mock named exports if used directly
// For tar-js, since it's imported as { Tar, Untar }, we mock the module and its exports
jest.mock('tar-js', () => ({
  Tar: jest.fn(),
  Untar: jest.fn(),
}));

// Import TextEncoder/TextDecoder for mockFile
import { TextEncoder, TextDecoder } from 'util';


describe("archiveConverter", () => {
  let mockJSZipInstance: any;
  let mockTarInstance: any;
  // let mockUntarInstance: any; // If Untar methods are called

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

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Define the behavior for JSZip constructor
    mockJSZipInstance = {
      file: jest.fn().mockReturnThis(),
      generateAsync: jest.fn().mockResolvedValue(new Uint8Array([4,5,6])),
      files: {},
      loadAsync: jest.fn(), // This will be overridden by the static mock assignment below
    };
    (JSZip as jest.Mock).mockReturnValue(mockJSZipInstance);

    // Define the behavior for the static JSZip.loadAsync
    JSZip.loadAsync = jest.fn().mockResolvedValue({
      files: { "entry.txt": { dir: false, async: jest.fn().mockResolvedValue("content") } },
    });
    mockJSZipInstance.loadAsync = JSZip.loadAsync;


    // Setup mock Tar instance
    mockTarInstance = {
      append: jest.fn(),
      out: new Uint8Array([1, 2, 3]),
    };
    (Tar as jest.Mock).mockImplementation(() => mockTarInstance);
  });

  const onProgressMock = jest.fn<void, [ConversionProgress]>();

  // Test for zipToOther (GZ)
  describe("zipToOther - GZ", () => {
    it("should convert a ZIP file to a GZ file", async () => {
      const zipData = new ArrayBuffer(10);
      const file = mockFile("test.zip", "application/zip", zipData);
      const mockEntryData = "entry content";

      mockJSZipInstance.loadAsync.mockResolvedValue({
        files: {
          "file1.txt": {
            dir: false,
            async: jest.fn().mockResolvedValue(mockEntryData),
            name: "file1.txt",
          },
        },
      });

      // pako's gzip is used internally, it's not mocked here but could be if specific behavior is needed.
      // For now, we rely on its actual implementation if it's called.

      const result = await convertArchive(file, "gz", {}, onProgressMock);

      expect(JSZip.loadAsync).toHaveBeenCalledWith(zipData);
      expect(result.success).toBe(true);
      expect(result.file).toBeDefined();
      expect(result.file?.name).toBe("test.gz");
      expect(result.file?.type).toBe("application/gzip");
      // We can't easily check the exact content of the GZ without unzipping it here,
      // so we trust pako.gzip works if the flow is correct.
      // Check that onProgress was called
      expect(onProgressMock).toHaveBeenCalled();
    });
  });

  // Test for otherToZip (GZ)
  describe("otherToZip - GZ", () => {
    it("should convert a GZ file to a ZIP file", async () => {
      // We need to mock pako.inflate if we are testing GZ to ZIP
      // For simplicity, assume GZ contains a single text file.
      // This would require mocking 'pako'
      const gzData = new Uint8Array([/* some gzipped data */]).buffer;
      const file = mockFile("test.gz", "application/gzip", gzData);

      // Mock pako's inflate (used in otherToZip for .gz)
      // This is a bit more involved as pako is imported directly.
      // jest.mock('pako', () => ({
      //   ...jest.requireActual('pako'), // Import and retain default behavior
      //   inflate: jest.fn().mockReturnValue(new TextEncoder().encode("inflated content")),
      // }));
      // Due to complexity in mocking pako here, this test will be more of an integration test for this part
      // or would require refactoring otherToZip to allow injecting the inflate function.

      mockJSZipInstance.generateAsync.mockResolvedValue(new Uint8Array([4,5,6]));

      // For now, this test is more conceptual for GZ->ZIP due to pako.
      // A more robust test would involve a helper to create actual GZ data and verify inflation.
      const result = await convertArchive(file, "zip", {}, onProgressMock);

      expect(mockJSZipInstance.file).toHaveBeenCalledWith("test", expect.any(Uint8Array)); // Name after .gz removal
      expect(mockJSZipInstance.generateAsync).toHaveBeenCalledWith({ type: "uint8array", compression: "DEFLATE" });
      expect(result.success).toBe(true);
      expect(result.file?.name).toBe("test.zip");
      expect(result.file?.type).toBe("application/zip");
      expect(onProgressMock).toHaveBeenCalled();
    });
  });

  // Test for zipToOther (TAR)
  describe("zipToOther - TAR", () => {
    it("should convert a ZIP file to a TAR file", async () => {
      const zipData = new ArrayBuffer(10);
      const file = mockFile("archive.zip", "application/zip", zipData);
      const mockEntryContent = new Uint8Array([1,2,3]);

      mockJSZipInstance.loadAsync.mockResolvedValue({
        files: {
          "file1.txt": {
            dir: false,
            async: jest.fn().mockResolvedValue(mockEntryContent),
            name: "file1.txt",
          },
          "folder/": {
            dir: true,
            name: "folder/",
          }
        },
      });

      const result = await convertArchive(file, "tar", {}, onProgressMock);

      expect(JSZip.loadAsync).toHaveBeenCalledWith(zipData);
      expect(Tar).toHaveBeenCalledTimes(1);
      expect(mockTarInstance.append).toHaveBeenCalledWith("file1.txt", mockEntryContent);
      // We are not explicitly appending directories in the current archiveConverter.ts, so don't expect "folder/"
      expect(result.success).toBe(true);
      expect(result.file).toBeDefined();
      expect(result.file?.name).toBe("archive.tar");
      expect(result.file?.type).toBe("application/x-tar");
      expect(result.file?.size).toBe(mockTarInstance.out.length); // tar.out is mocked
      expect(onProgressMock).toHaveBeenCalled();
    });
  });

  // Test for error handling
  describe("Error Handling", () => {
    it("should return an error for unsupported conversion", async () => {
      const file = mockFile("test.txt", "text/plain", new ArrayBuffer(10));
      const result = await convertArchive(file, "xyz", {}, onProgressMock); // xyz is unsupported

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unsupported archive conversion: txt -> xyz");
      // expect(onProgressMock).not.toHaveBeenCalled(); // Or called with error progress
    });

    it("should handle errors during zip processing", async () => {
      const zipData = new ArrayBuffer(10);
      const file = mockFile("bad.zip", "application/zip", zipData);
      mockJSZipInstance.loadAsync.mockRejectedValue(new Error("Invalid ZIP file"));

      const result = await convertArchive(file, "gz", {}, onProgressMock);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid ZIP file");
    });
  });
});
