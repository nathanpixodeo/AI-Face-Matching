/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterSetup: ['<rootDir>/src/__tests__/helpers/setup.ts'],
  testTimeout: 30000,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/__tests__/**'],
};
