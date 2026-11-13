module.exports = {
  testEnvironment: 'node',
  // Jalankan berkas uji bergantian agar penggunaan sumber daya tetap ringan.
  // Uji database hanya aktif melalui npm run test:db.
  maxWorkers: 1,
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/skrip/jest-setelah.cjs'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    '^@klira/shared$': '<rootDir>/packages/shared/src/index.ts',
    '^@klira/db/uji$': '<rootDir>/packages/db/src/uji/index.ts',
    '^@klira/db$': '<rootDir>/packages/db/src/index.ts',
  },
  modulePathIgnorePatterns: ['/dist/'],
};
