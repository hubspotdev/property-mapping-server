/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }],
  },
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  },
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  setupFiles: ['dotenv/config']
};

module.exports = config;
