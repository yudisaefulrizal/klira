module.exports = {
  testEnvironment: 'node',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    '^@klira/shared$': '<rootDir>/packages/shared/src/index.ts',
    '^@klira/db$': '<rootDir>/packages/db/src/index.ts',
  },
  modulePathIgnorePatterns: ['/dist/'],
};
