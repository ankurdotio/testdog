// jest.config.js
export default {
  testEnvironment: 'node', // Use Node.js environment for testing
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'json', 'node'],
  clearMocks: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/logs/', '/coverage/'],
  coverageProvider: 'v8',
  setupFilesAfterEnv: ['./jest.setup.js'],
  testTimeout: 30000,
};
