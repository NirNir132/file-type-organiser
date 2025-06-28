// Import Jest DOM utilities
require("@testing-library/jest-dom");

// Mock any browser APIs that might not be available in the test environment
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();
