// API menyajikan frontend ES Modules langsung dari source.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const akar = fileURLToPath(new URL('../', import.meta.url));
const proses = new Set();
let berhenti = false;

function hentikan(kode = 0) {
  if (berhenti) return;
  berhenti = true;
  process.exitCode = kode;
  for (const anak of proses) {
    if (process.platform === 'win32') anak.kill('SIGTERM');
    else {
      try { process.kill(-anak.pid, 'SIGTERM'); } catch (galat) {
        if (galat.code !== 'ESRCH') throw galat;
      }
    }
  }
}

function jalankan(argumen) {
  const anak = spawn(process.execPath, argumen, {
    cwd: akar, stdio: 'inherit', detached: process.platform !== 'win32',
  });
  proses.add(anak);
  anak.once('exit', () => proses.delete(anak));
  return anak;
}

process.on('SIGINT', () => hentikan());
process.on('SIGTERM', () => hentikan());

try {
  console.log('[dev] Menjalankan API, engine WhatsApp, dan frontend. Tekan Ctrl+C untuk berhenti.');
  // Pantau source backend; perubahan frontend tersedia saat halaman dimuat ulang.
  const perintah = [
    ['--watch-path=apps/api/src', '--watch-path=packages/shared/src', '--watch-path=packages/db/src', 'apps/api/src/main.js'],
    ['--watch-path=apps/whatsapp/src', '--watch-path=packages/shared/src', '--watch-path=packages/db/src', 'apps/whatsapp/src/entry-points/main.js'],
  ];
  for (const argumen of perintah) {
    const anak = jalankan(argumen);
    anak.once('error', (galat) => { console.error(galat); hentikan(1); });
    anak.once('exit', (kode) => { if (!berhenti) hentikan(kode || 1); });
  }
} catch (galat) {
  if (!berhenti) { console.error(galat.message); hentikan(1); }
}
