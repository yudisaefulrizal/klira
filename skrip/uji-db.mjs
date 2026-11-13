import { spawnSync } from 'node:child_process';
if (process.env.NODE_ENV === 'production') throw new Error('Uji database menolak lingkungan produksi.');
const env = { ...process.env, NODE_ENV: 'test', KLIRA_UJI_DB: '1' };
function jalankan(args) {
  const hasil = spawnSync(process.execPath, ['--experimental-vm-modules', 'node_modules/jest/bin/jest.js', '--runInBand', ...args], { env, stdio: 'inherit' });
  if (hasil.status !== 0) process.exit(hasil.status ?? 1);
}
// Skema diuji lebih dahulu: fresh dan seed menyiapkan database untuk pengujian alur API.
jalankan(['--runTestsByPath', 'packages/db/src/skema.test.js']);
jalankan(['--testPathPatterns', process.argv[2] || 'integrasi.test.js|seed/.*test.js|migrasi/.*test.js']);
