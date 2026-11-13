module.exports = {
  transform: {},
  testEnvironment: 'node',
  // Jalankan berkas uji bergantian agar penggunaan sumber daya tetap ringan.
  // Uji database hanya aktif melalui npm run test:db.
  maxWorkers: 1,
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/skrip/jest-setelah.mjs'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    '^@klira/shared$': '<rootDir>/packages/shared/src/index.js',
    '^@klira/db/uji$': '<rootDir>/packages/db/src/uji/index.js',
    '^@klira/db$': '<rootDir>/packages/db/src/index.js',
  },
  modulePathIgnorePatterns: ['/dist/'],
};
