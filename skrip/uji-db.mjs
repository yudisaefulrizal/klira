import { spawnSync } from 'node:child_process';
if (process.env.NODE_ENV === 'production') throw new Error('Uji database menolak lingkungan produksi.');
const env = { ...process.env, NODE_ENV: 'test', KLIRA_UJI_DB: '1' };
function jalankan(args) {
  const hasil = spawnSync(process.execPath, ['node_modules/jest/bin/jest.js', '--runInBand', ...args], { env, stdio: 'inherit' });
  if (hasil.status !== 0) process.exit(hasil.status ?? 1);
}
// Skema diuji lebih dahulu: fresh dan seed menyiapkan database untuk pengujian alur API.
jalankan(['--runTestsByPath', 'packages/db/src/skema.test.ts']);
jalankan(['--testPathPatterns', process.argv[2] || 'integrasi.test.ts|seed/.*test.ts|migrasi/.*test.ts']);
