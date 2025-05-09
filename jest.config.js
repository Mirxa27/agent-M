module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/client/src', '<rootDir>/server/src', '<rootDir>/shared/src'], // Adjusted to common src patterns
  moduleNameMapper: {
    // Handle CSS imports (e.g., .css, .scss, .less)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle image imports
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js',
    // Handle module path aliases
    '^@/(.*)$': '<rootDir>/client/src/$1', // Assuming @/ maps to client/src
    '^@shared/(.*)$': '<rootDir>/shared/$1', // Assuming @shared/ maps to shared
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // For setting up testing library, etc.
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json' // Ensure this points to your main tsconfig
    } ],
  },
  // Ignore paths
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/public/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coverageDirectory: 'coverage',
  // Optional: collect coverage from specific directories
  collectCoverageFrom: [
    'client/src/**/*.{ts,tsx}',
    'server/src/**/*.{ts,tsx}', // If you have server-side tests in TypeScript
    'shared/src/**/*.{ts,tsx}', // If you have shared code tests
    '!client/src/**/*.d.ts',
    '!server/src/**/*.d.ts',
    '!shared/src/**/*.d.ts',
    '!client/src/main.tsx', // Often entry points are not tested directly
    '!client/src/vite-env.d.ts',
  ],
};
