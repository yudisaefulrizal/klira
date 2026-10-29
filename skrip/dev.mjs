// Dipanggil melalui dengan-env.mjs agar API dan proxy memakai PORT dari .env.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const akar = fileURLToPath(new URL('../', import.meta.url));
process.env.KLIRA_DEV = '1';
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

async function siapkan(label, argumen) {
  const mulai = Date.now();
  console.log(`[dev] ${label}…`);
  const anak = jalankan(argumen);
  const kode = await new Promise((resolve, reject) => {
    anak.once('error', reject);
    anak.once('exit', resolve);
  });
  if (kode !== 0 || berhenti) throw new Error(`Persiapan gagal: ${label}.`);
  console.log(`[dev] ${label} selesai (${((Date.now() - mulai) / 1000).toFixed(1)} detik).`);
}

// Development cukup menerjemahkan kode. Pemeriksaan tipe lengkap tetap melalui npm run typecheck.
const proyek = ['packages/shared', 'packages/db', 'apps/api', 'apps/whatsapp'];
const kompilasi = (nama) => ['node_modules/typescript/bin/tsc', '-p', nama, '--noCheck', '--incremental', '--tsBuildInfoFile', `${nama}/dist/.dev.tsbuildinfo`];

try {
  await siapkan('Menyiapkan Prisma', ['node_modules/prisma/build/index.js', 'generate', '--schema', 'packages/db/prisma/schema.prisma']);
  for (const nama of proyek) await siapkan(`Menyiapkan ${nama}`, kompilasi(nama));
  console.log('[dev] Menjalankan API, engine WhatsApp, dan frontend. Tekan Ctrl+C untuk berhenti.');
  // Batasi Node ke output backend; file sementara Vite dapat memicu loop jika semua import dipantau.
  const perintah = [
    ...proyek.map((nama) => [...kompilasi(nama), '--watch', '--preserveWatchOutput']),
    ['--watch-path=apps/api/dist', '--watch-path=packages/shared/dist', '--watch-path=packages/db/dist', 'apps/api/dist/main.js'],
    ['--watch-path=apps/whatsapp/dist', '--watch-path=packages/shared/dist', '--watch-path=packages/db/dist', 'apps/whatsapp/dist/main.js'],
  ];
  for (const argumen of perintah) {
    const anak = jalankan(argumen);
    anak.once('error', (galat) => { console.error(galat); hentikan(1); });
    anak.once('exit', (kode) => { if (!berhenti) hentikan(kode || 1); });
  }
} catch (galat) {
  if (!berhenti) { console.error(galat.message); hentikan(1); }
}
