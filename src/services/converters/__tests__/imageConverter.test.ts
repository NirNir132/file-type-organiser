import { convertImage } from "../imageConverter";
import { ConversionProgress, ConversionResult } from "../../../types";
// import { convert as convertWithWasm } from "wasm-imagemagick"; // Already mocked below
// import heic2any from "heic2any"; // Already mocked below

// Import TextEncoder/TextDecoder for mockFile
import { TextEncoder, TextDecoder } from 'util';

// Mock wasm-imagemagick
jest.mock("wasm-imagemagick", () => ({
  convert: jest.fn(),
}));

// Mock heic2any
jest.mock("heic2any", () => ({
  __esModule: true, // This is important for modules with default exports
  default: jest.fn(),
}));


describe("imageConverter", () => {
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

  const onProgressMock = jest.fn<void, [ConversionProgress]>();

  // Mock Canvas APIs
  let mockToBlob: jest.Mock;
  let mockDrawImage: jest.Mock;
  let mockFillRect: jest.Mock;
  let mockCreateObjectURL: jest.Mock;
  let mockRevokeObjectURL: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockToBlob = jest.fn();
    mockDrawImage = jest.fn();
    mockFillRect = jest.fn();

    global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      drawImage: mockDrawImage,
      fillRect: mockFillRect,
    })) as any;
    global.HTMLCanvasElement.prototype.toBlob = mockToBlob;

    mockCreateObjectURL = jest.fn((obj: any) => `blob:${obj.size || 'mock_url'}`);
    mockRevokeObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock Image.onload and Image.onerror
    // We need to control when onload/onerror are triggered.
    // This can be tricky globally. We'll set up a mechanism to trigger them.
    const imageInstances: any[] = [];
    Object.defineProperty(global.Image.prototype, 'onload', {
        configurable: true,
        set(fn) {
            this._onload = fn;
        }
    });
    Object.defineProperty(global.Image.prototype, 'onerror', {
        configurable: true,
        set(fn) {
            this._onerror = fn;
        }
    });
    Object.defineProperty(global.Image.prototype, 'src', {
        configurable: true,
        set(url) {
            this._src = url;
            // Simulate async loading, then trigger onload
            // This requires tests to await or use fake timers
            // For simplicity, we might trigger onload directly in tests after setting src.
            // Or, more robustly, control this via a helper.
            imageInstances.push(this);
        }
    });
    // Helper to simulate image load success for the last image whose src was set
    (global.Image as any)._triggerOnload = () => {
        const img = imageInstances[imageInstances.length -1];
        if (img && img._onload) img._onload();
    };
    // Helper to simulate image load error
    (global.Image as any)._triggerOnonerror = () => {
        const img = imageInstances[imageInstances.length -1];
        if (img && img._onerror) img._onerror();
    };
  });

  describe("convertStandardImage (via convertImage)", () => {
    it("should convert PNG to JPG using canvas", async () => {
      const file = mockFile("test.png", "image/png");
      mockToBlob.mockImplementationOnce((callback, type, quality) => {
        expect(type).toBe("image/jpeg");
        expect(quality).toBe(0.8); // Default quality
        callback(new Blob(["jpg data"], { type: "image/jpeg" }));
      });

      const promise = convertImage(file, "jpg", { quality: 0.8 }, onProgressMock);

      // Wait for image to "load" then trigger onload
      // This relies on the src setter having been called.
      await new Promise(resolve => setTimeout(resolve, 0)); // Allow microtasks to run (e.g. Image src setter)
      (global.Image as any)._triggerOnload();

      const result = await promise;

      expect(result.success).toBe(true);
      expect(result.file?.name).toBe("test.jpg");
      expect(result.file?.type).toBe("image/jpeg");
      expect(mockFillRect).toHaveBeenCalled(); // For JPG background
      expect(mockDrawImage).toHaveBeenCalled();
      expect(onProgressMock).toHaveBeenCalledWith(expect.objectContaining({ stage: "Complete" }));
    });

    it("should handle canvas toBlob failure", async () => {
      const file = mockFile("test.png", "image/png");
      mockToBlob.mockImplementationOnce((callback) => {
        callback(null); // Simulate blob creation failure
      });

      const promise = convertImage(file, "jpg", {}, onProgressMock);
      await new Promise(resolve => setTimeout(resolve, 0));
      (global.Image as any)._triggerOnload();
      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to convert image to blob");
    });

    it("should handle image loading error", async () => {
        const file = mockFile("test.png", "image/png");
        const promise = convertImage(file, "jpg", {}, onProgressMock);
        await new Promise(resolve => setTimeout(resolve, 0));
        (global.Image as any)._triggerOnonerror(); // Simulate image failing to load
        const result = await promise;

        expect(result.success).toBe(false);
        expect(result.error).toBe("Failed to load image file");
    });
  });

  describe("convertHeicImage", () => {
    it("should convert HEIC to PNG using heic2any", async () => {
      const file = mockFile("test.heic", "image/heic");
      const mockHeicBlob = new Blob(["png data from heic"], { type: "image/png" });

      // Dynamically import the mocked heic2any to access its 'default' export
      const heic2anyMock = (await import("heic2any")).default;
      (heic2anyMock as jest.Mock).mockResolvedValue(mockHeicBlob);

      const result = await convertImage(file, "png", { quality: 0.9 }, onProgressMock);

      expect(heic2anyMock).toHaveBeenCalledWith({
        blob: file,
        toType: "image/png",
        quality: 0.9,
      });
      expect(result.success).toBe(true);
      expect(result.file?.name).toBe("test.png");
      expect(result.file?.type).toBe("image/png");
      expect(onProgressMock).toHaveBeenCalledWith(expect.objectContaining({ stage: "Complete" }));
    });

    it("should handle heic2any conversion failure", async () => {
      const file = mockFile("test.heic", "image/heic");
      const heic2anyMock = (await import("heic2any")).default;
      (heic2anyMock as jest.Mock).mockRejectedValue(new Error("HEIC conversion error"));

      const result = await convertImage(file, "png", {}, onProgressMock);

      expect(result.success).toBe(false);
      expect(result.error).toContain("HEIC conversion failed: HEIC conversion error");
    });
  });

  describe("convertSvgImage", () => {
    it("should convert SVG to PNG using canvas", async () => {
        const file = mockFile("test.svg", "image/svg+xml");
        mockToBlob.mockImplementationOnce((callback, type) => {
            expect(type).toBe("image/png");
            callback(new Blob(["png data from svg"], {type: "image/png"}));
        });

        const promise = convertImage(file, "png", {}, onProgressMock);
        await new Promise(resolve => setTimeout(resolve, 0));
        (global.Image as any)._triggerOnload(); // Simulate SVG loading into Image
        const result = await promise;

        expect(result.success).toBe(true);
        expect(result.file?.name).toBe("test.png");
        expect(result.file?.type).toBe("image/png");
        expect(mockDrawImage).toHaveBeenCalled();
    });

    it("should handle SVG loading error in Image element", async () => {
        const file = mockFile("bad.svg", "image/svg+xml");
        const promise = convertImage(file, "png", {}, onProgressMock);
        await new Promise(resolve => setTimeout(resolve, 0));
        (global.Image as any)._triggerOnonerror(); // Simulate SVG failing to load
        const result = await promise;

        expect(result.success).toBe(false);
        expect(result.error).toContain("Failed to load SVG image for conversion");
    });
  });

  describe("convertWithImageMagick (Fallback)", () => {
    it("should fallback to ImageMagick if canvas conversion fails", async () => {
      const file = mockFile("test.bmp", "image/bmp"); // A format canvas might struggle with or not support directly for conversion

      // Simulate canvas failure
      mockToBlob.mockImplementationOnce((callback) => callback(null));

      // Mock wasm-imagemagick's convert function
      const mockMagickOutput = { outputFiles: [{ data: new Uint8Array([1,2,3]), name: "output.jpg" }] };
      // @ts-ignore
      require("wasm-imagemagick").convert.mockResolvedValue(mockMagickOutput);

      const promise = convertImage(file, "jpg", {}, onProgressMock);
      await new Promise(resolve => setTimeout(resolve, 0));
      (global.Image as any)._triggerOnload(); // Canvas path onload
      const result = await promise;

      expect(require("wasm-imagemagick").convert).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.file?.name).toBe("test.jpg");
      expect(result.file?.type).toBe("image/jpeg"); // wasm-imagemagick output type
      expect(onProgressMock).toHaveBeenCalledWith(expect.objectContaining({ message: "Canvas conversion failed. Attempting ImageMagick..." }));
    });

    it("should return error if both canvas and ImageMagick fail", async () => {
      const file = mockFile("test.tiff", "image/tiff");

      // Simulate canvas failure
      mockToBlob.mockImplementationOnce((callback) => callback(null));

      // Simulate ImageMagick failure
      // @ts-ignore
      require("wasm-imagemagick").convert.mockRejectedValue(new Error("Magick error"));

      const promise = convertImage(file, "png", {}, onProgressMock);
      await new Promise(resolve => setTimeout(resolve, 0));
      (global.Image as any)._triggerOnload();
      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toContain("Canvas conversion failed: Failed to convert image to blob. ImageMagick fallback also failed: Magick error");
    });
  });
});
