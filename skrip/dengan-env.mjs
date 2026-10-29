// Menjalankan perintah dengan isi .env dimuat dan DATABASE_URL disusun dari DB_USER, DB_PASSWORD, DB_NAME.
// Pemakaian: node skrip/dengan-env.mjs <perintah> [argumen...]
import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...process.env };
const berkas = join(akar, '.env');
if (existsSync(berkas)) {
  for (const baris of readFileSync(berkas, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(baris);
    if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
const url = (nama) => `mysql://${encodeURIComponent(env.DB_USER)}:${encodeURIComponent(env.DB_PASSWORD ?? '')}@${env.DB_HOST || '127.0.0.1'}:${env.DB_PORT || '3306'}/${nama}`;
if (env.DB_USER && env.DB_NAME && !env.DATABASE_URL) env.DATABASE_URL = url(env.DB_NAME);
// Proyek memakai satu database. Tes database destruktif tetap dilewati.
delete env.DB_NAME_UJI;
delete env.DATABASE_URL_UJI;

const [perintah, ...argumen] = process.argv.slice(2);
const anak = spawn(perintah, argumen, { stdio: 'inherit', env });
anak.on('exit', (kode, sinyal) => process.exit(kode ?? (sinyal ? 1 : 0)));
