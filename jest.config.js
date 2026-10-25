module.exports = {
  testEnvironment: 'node',
  // Uji integrasi berbagi basis data klira_uji (ada yang membersihkan tabel), jadi berkas uji berjalan bergantian.
  maxWorkers: 1,
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    '^@klira/shared$': '<rootDir>/packages/shared/src/index.ts',
    '^@klira/db$': '<rootDir>/packages/db/src/index.ts',
  },
  modulePathIgnorePatterns: ['/dist/'],
};
