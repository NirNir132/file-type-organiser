// <rootDir>/__mocks__/@ffmpeg/ffmpeg.js
// console.log("Using manual mock for @ffmpeg/ffmpeg");

const mockFFmpegInstance = {
  load: jest.fn().mockResolvedValue(undefined),
  run: jest.fn().mockResolvedValue(undefined), // Deprecated, use exec
  exec: jest.fn().mockResolvedValue(undefined), // For FFmpeg v0.11+
  FS: jest.fn((method, ...args) => {
    // console.log(`Mocked FS called with method: ${method}, args:`, args);
    if (method === 'writeFile') return undefined;
    if (method === 'readFile') return new Uint8Array([1, 2, 3, 4]); // Mock file content
    if (method === 'unlink') return undefined;
    if (method === 'mkdir') return undefined;
    // Add other FS methods if your SUT uses them
    return undefined; // Default for unhandled FS methods
  }),
  setProgress: jest.fn((callback) => {
    // Optionally simulate some progress immediately or after a timeout
    // callback({ ratio: 0.5, time: 5000 });
    // callback({ ratio: 1, time: 10000 });
  }),
  setLogger: jest.fn(), // If SUT uses setLogger
  setLogging: jest.fn(), // If SUT uses setLogging (older versions)
  isLoaded: jest.fn().mockReturnValue(true), // Common check before operations
  terminate: jest.fn(), // If SUT uses terminate
  // Add any other methods/properties the SUT uses from the ffmpeg instance
};

export const createFFmpeg = jest.fn(() => mockFFmpegInstance);

export const fetchFile = jest.fn().mockImplementation(async (file) => {
  if (typeof file.arrayBuffer === 'function') {
    try {
      const buffer = await file.arrayBuffer();
      return new Uint8Array(buffer);
    } catch (e) {
      // console.error("Mock fetchFile: Error reading arrayBuffer from file:", e);
      return new Uint8Array([1,2,3,4,5]); // Fallback
    }
  }
  // Fallback for simpler cases or if it's just a path (though SUT uses File objects)
  // console.log("Mock fetchFile: file object does not have arrayBuffer, returning default byte array.");
  return new Uint8Array([1,2,3,4,5,6,7,8]); // Default mock data
});

// If LogLevel is imported and used by SUT directly from @ffmpeg/ffmpeg
export const LogLevel = {
    INFO: 'info',
    DEBUG: 'debug',
    ERROR: 'error',
    WARNING: 'warning',
    // Add other levels if necessary
};

// Helper to reset mocks, accessible from test files if needed
export const __resetFFmpegMocks = () => {
    createFFmpeg.mockClear();
    createFFmpeg.mockReturnValue(mockFFmpegInstance); // Ensure it returns the same instance structure

    mockFFmpegInstance.load.mockClear().mockResolvedValue(undefined);
    mockFFmpegInstance.run.mockClear().mockResolvedValue(undefined);
    mockFFmpegInstance.exec.mockClear().mockResolvedValue(undefined);
    mockFFmpegInstance.FS.mockClear().mockImplementation((method, ...args) => {
        if (method === 'writeFile') return undefined;
        if (method === 'readFile') return new Uint8Array([1, 2, 3, 4]);
        if (method === 'unlink') return undefined;
        if (method === 'mkdir') return undefined;
        return undefined;
    });
    mockFFmpegInstance.setProgress.mockClear();
    mockFFmpegInstance.setLogger.mockClear();
    mockFFmpegInstance.setLogging.mockClear();
    mockFFmpegInstance.isLoaded.mockClear().mockReturnValue(true);
    mockFFmpegInstance.terminate.mockClear();

    fetchFile.mockClear().mockImplementation(async (file) => {
        if (typeof file.arrayBuffer === 'function') {
            try {
                const buffer = await file.arrayBuffer();
                return new Uint8Array(buffer);
            } catch (e) {
                return new Uint8Array([1,2,3,4,5]);
            }
        }
        return new Uint8Array([1,2,3,4,5,6,7,8]);
    });
};
