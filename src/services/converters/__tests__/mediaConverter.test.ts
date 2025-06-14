import { convertAudio, convertVideo } from "../mediaConverter";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { ConversionProgress } from "../../../types";

import { createFFmpeg } from "@ffmpeg/ffmpeg"; // Import the actual function signature for mocking

// Mock @ffmpeg/ffmpeg
const mockFFmpegInstance = {
  on: jest.fn(),
  load: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined), // Simulates successful file write
  exec: jest.fn().mockResolvedValue(undefined), // Simulates successful command execution
  readFile: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])), // Mock output file data
  terminate: jest.fn(),
  // Add isLoaded if your code checks it, though the implementation doesn't seem to.
  // isLoaded: jest.fn().mockReturnValue(true),
};

// Mock @ffmpeg/ffmpeg
// const mockFFmpegInstance = { // This is now largely defined in the manual mock
//   on: jest.fn(),
//   load: jest.fn().mockResolvedValue(undefined),
//   writeFile: jest.fn().mockResolvedValue(undefined),
//   exec: jest.fn().mockResolvedValue(undefined),
//   readFile: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
//   terminate: jest.fn(),
// };

// @ffmpeg/ffmpeg is manually mocked by a file at <rootDir>/__mocks__/@ffmpeg/ffmpeg.js
// Jest should automatically pick this up.
import {
    createFFmpeg as importedCreateFFmpegMock,
    fetchFile as importedFetchFileMock,
    __resetFFmpegMocks as resetFFmpegMocks
} from "@ffmpeg/ffmpeg"; // These now come from the manual mock

// Keep a reference to the instance created by the mock for configuring its methods per test
let mockFFmpegInstance: any;


// Import TextEncoder/TextDecoder for mockFile (though less likely needed for media files, good for consistency)
import { TextEncoder, TextDecoder } from 'util';

describe("mediaConverter", () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the manual mock's state
    if (resetFFmpegMocks) {
      resetFFmpegMocks();
    }
    // Get a fresh mock instance for each test as createFFmpeg() would do
    // The manual mock for createFFmpeg should return the well-defined mockFFmpegInstance structure
    mockFFmpegInstance = importedCreateFFmpegMock();
  });

  // Audio Conversion
  describe("convertAudio", () => {
    it("should convert MP3 to WAV", async () => {
      const file = mockFile("test.mp3", "mock audio data", "audio/mpeg");
      const targetFormat = "wav";

      const result = await convertAudio(file, targetFormat, {}, onProgressMock);

      expect(importedCreateFFmpegMock).toHaveBeenCalledTimes(1);
      expect(mockFFmpegInstance.load).toHaveBeenCalled();
      expect(mockFFmpegInstance.FS).toHaveBeenCalledWith("writeFile", "input.mp3", expect.any(Uint8Array));
      expect(mockFFmpegInstance.exec).toHaveBeenCalledWith(["-i", "input.mp3", "output.wav"]);
      expect(mockFFmpegInstance.FS).toHaveBeenCalledWith("readFile", "output.wav");
      expect(result.success).toBe(true);
      expect(result.file?.name).toBe("test.wav");
      expect(result.file?.type).toBe("audio/wav");
      expect(result.file?.size).toBe(4); // From mock FS('readFile')
      expect(onProgressMock).toHaveBeenCalledWith(expect.objectContaining({ stage: "Complete" }));
      expect(mockFFmpegInstance.terminate).toHaveBeenCalled();
    });

    it("should handle FFmpeg execution error during audio conversion", async () => {
      const file = mockFile("test.mp3", "mock audio data", "audio/mpeg");
      mockFFmpegInstance.exec.mockRejectedValue(new Error("FFmpeg exec error"));

      const result = await convertAudio(file, "wav", {}, onProgressMock);

      expect(result.success).toBe(false);
      expect(result.error).toContain("FFmpeg exec error");
      expect(mockFFmpegInstance.terminate).toHaveBeenCalled();
    });

    it("should handle FFmpeg loading error during audio conversion", async () => {
      const file = mockFile("test.mp3", "mock audio data", "audio/mpeg");
      mockFFmpegInstance.load.mockRejectedValue(new Error("FFmpeg load error"));

      const result = await convertAudio(file, "wav", {}, onProgressMock);

      expect(result.success).toBe(false);
      expect(result.error).toContain("FFmpeg load error");
      expect(mockFFmpegInstance.terminate).toHaveBeenCalled();
    });
  });

  // Video Conversion
  describe("convertVideo", () => {
    it("should convert MP4 to AVI", async () => {
      const file = mockFile("test.mp4", "mock video data", "video/mp4");
      const targetFormat = "avi";

      const result = await convertVideo(file, targetFormat, {}, onProgressMock);

      expect(importedCreateFFmpegMock).toHaveBeenCalledTimes(1);
      expect(mockFFmpegInstance.load).toHaveBeenCalled();
      expect(mockFFmpegInstance.FS).toHaveBeenCalledWith("writeFile", "input.mp4", expect.any(Uint8Array));
      expect(mockFFmpegInstance.exec).toHaveBeenCalledWith(expect.arrayContaining(["-i", "input.mp4", "output.avi"]));
      expect(mockFFmpegInstance.FS).toHaveBeenCalledWith("readFile", "output.avi");
      expect(result.success).toBe(true);
      expect(result.file?.name).toBe("test.avi");
      expect(result.file?.type).toBe("video/x-msvideo");
      expect(result.file?.size).toBe(4);
      expect(onProgressMock).toHaveBeenCalledWith(expect.objectContaining({ stage: "Complete" }));
      expect(mockFFmpegInstance.terminate).toHaveBeenCalled();
    });

    it("should handle FFmpeg error during video conversion and call progress with error", async () => {
        const file = mockFile("test.mp4", "mock video data", "video/mp4");
        const ffmpegErrorMessage = "Video processing failed";
        mockFFmpegInstance.exec.mockRejectedValue(new Error(ffmpegErrorMessage));

        const result = await convertVideo(file, "avi", {}, onProgressMock);

        expect(result.success).toBe(false);
        expect(result.error).toContain(ffmpegErrorMessage);
        expect(onProgressMock).toHaveBeenCalledWith(expect.objectContaining({
            stage: "Error",
            message: expect.stringContaining(ffmpegErrorMessage),
        }));
        expect(mockFFmpegInstance.terminate).toHaveBeenCalled();
      });

    it("should correctly map target format to output options for video", async () => {
        const file = mockFile("test.mov", "mock video data", "video/quicktime");
        await convertVideo(file, "mp4", { videoCodec: "libx264", audioCodec: "aac" }, onProgressMock);
        expect(mockFFmpegInstance.exec).toHaveBeenCalledWith(expect.arrayContaining([
            "-i", "input.mov", "-c:v", "libx264", "-c:a", "aac", "output.mp4"
        ]));
    });

    it("should use default codecs if none are provided for video", async () => {
        const file = mockFile("test.webm", "mock video data", "video/webm");
        await convertVideo(file, "mp4", {}, onProgressMock);
        expect(mockFFmpegInstance.exec).toHaveBeenCalledWith(expect.arrayContaining([
            "-i", "input.webm", "-c:v", "libx264", "-c:a", "aac", "output.mp4"
        ]));
    });
  });

  // Error handling for unsupported formats (though mediaConverter might not have this check itself)
  // This depends on how the main conversion service routes to mediaConverter.
  // If mediaConverter itself checks source/target compatibility, add tests here.
  // For now, assuming it's called with valid media types.
});
