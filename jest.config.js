module.exports = {
  testEnvironment: 'node',
  // Jalankan berkas uji bergantian agar penggunaan sumber daya tetap ringan.
  // Tes database dilewati karena dengan-env.mjs tidak menyediakan DATABASE_URL_UJI.
  maxWorkers: 1,
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    '^@klira/shared$': '<rootDir>/packages/shared/src/index.ts',
    '^@klira/db$': '<rootDir>/packages/db/src/index.ts',
  },
  modulePathIgnorePatterns: ['/dist/'],
};
