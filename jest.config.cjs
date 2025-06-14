// jest.config.cjs
module.exports = {
  preset: 'ts-jest/presets/default-esm', // Use ESM preset for ts-jest
  testEnvironment: 'jsdom',
  moduleDirectories: ['node_modules', '<rootDir>/__mocks__'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs'],
  transform: {
    '^.+\\.m?js$': 'babel-jest',
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  // transformIgnorePatterns: [ // Default is /node_modules/
  //   '/node_modules/(?!(module-that-needs-transforming)/)'
  // ],
  // moduleNameMapper: {
  //   // Example for handling .js extensions in ESM imports if your project uses them
  //   // '^(\.{1,2}/.*)\.js$': '$1',
  // },
  verbose: true,
  clearMocks: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__mocks__/',
    '/__tests__/',
    '/dist/',
  ],
  roots: [
    '<rootDir>/src'
  ],
};
