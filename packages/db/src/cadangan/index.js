import { fileURLToPath as kliraFilePath } from 'node:url';
const __dirname = kliraFilePath(new URL('.', import.meta.url));
import { spawn } from 'node:child_process';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdtemp, open, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { pipeline } from 'node:stream/promises';
/** Akar repositori; sama untuk src (uji) maupun dist karena kedalaman folder sama. */
const AKAR = path.resolve(__dirname, '../../../..');
export class GalatCadangan extends Error {
}
function sambunganDb() {
    const u = new URL(process.env.DATABASE_URL ?? '');
    return {
        arg: ['-h', u.hostname, '-P', u.port || '3306', '-u', decodeURIComponent(u.username)],
        nama: u.pathname.slice(1),
        env: { ...process.env, MYSQL_PWD: decodeURIComponent(u.password) },
    };
}
/** Menjalankan perintah, mengembalikan stdout; galat berisi stderr. */
function jalankan(perintah, arg, opsi = {}) {
    return new Promise((selesai, gagal) => {
        const anak = spawn(perintah, arg, { env: opsi.env ?? process.env, cwd: opsi.cwd, stdio: ['pipe', 'pipe', 'pipe'] });
        let keluar = '';
        let galat = '';
        anak.stdout.on('data', (d) => (keluar += d.toString()));
        anak.stderr.on('data', (d) => (galat += d.toString()));
        anak.on('error', gagal);
        anak.on('close', (kode) => (kode === 0 ? selesai(keluar) : gagal(new GalatCadangan(galat.trim().slice(-500) || `${perintah} gagal (${kode})`))));
        anak.stdin.on('error', () => undefined);
        if (typeof opsi.masuk === 'string')
            anak.stdin.end(opsi.masuk);
        else if (opsi.masuk)
            opsi.masuk.pipe(anak.stdin);
        else
            anak.stdin.end();
    });
}
/** Menghapus semua tabel di database aplikasi. */
async function kosongkanDb() {
    const { arg, nama, env } = sambunganDb();
    const daftar = await jalankan('mysql', [...arg, '-N', '-B', nama, '-e', 'SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = \'BASE TABLE\''], { env });
    const tabel = daftar.split('\n').map((t) => t.trim()).filter(Boolean);
    if (!tabel.length)
        return;
    const sql = `SET FOREIGN_KEY_CHECKS=0;\n${tabel.map((t) => `DROP TABLE IF EXISTS \`${t.replace(/`/g, '``')}\`;`).join('\n')}\n`;
    await jalankan('mysql', [...arg, nama], { env, masuk: sql });
}
let sibuk = false;
async function eksklusif(f) {
    if (sibuk)
        throw new GalatCadangan('Proses cadangan lain sedang berjalan.');
    sibuk = true;
    try {
        return await f();
    }
    finally {
        sibuk = false;
    }
}
/** Aliran hasil mysqldump untuk diunduh; hubungi `tutup` bila klien memutus. */
export function mulaiUnduhBackup() {
    const { arg, nama, env } = sambunganDb();
    const anak = spawn('mysqldump', [...arg, '--single-transaction', '--routines', '--no-tablespaces', nama], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let galat = '';
    anak.stderr.on('data', (d) => (galat += d.toString()));
    const selesai = new Promise((ok, gagal) => {
        anak.on('error', gagal);
        anak.on('close', (kode) => (kode === 0 ? ok() : gagal(new GalatCadangan(galat.trim().slice(-500) || 'mysqldump gagal'))));
    });
    return { aliran: anak.stdout, selesai, batal: () => anak.kill() };
}
// Dua perbaikan pada dump sebelum dimuat: (1) trigger satu pernyataan yang tersimpan dengan titik koma di ujung
// ditulis mysqldump dengan titik koma sebelum penutup komentar versi, dan MySQL menolaknya; (2) klausa DEFINER
// ke akun/host lain butuh hak SUPER, jadi dibuang agar objek dimiliki user aplikasi.
const buangDefiner = (b) => (b.startsWith('/*!') ? b.replace(/\s*DEFINER=`[^`]*`@`[^`]*`/g, '') : b);
const rapikanBaris = (b) => buangDefiner(b.endsWith('*/;;') ? b.replace(/;\s*\*\/;;$/, ' */;;') : b);
async function bersihkanDump(asal, tujuan) {
    const keluar = createWriteStream(tujuan);
    const baris = createInterface({ input: createReadStream(asal), crlfDelay: Infinity });
    for await (const b of baris) {
        if (!keluar.write(rapikanBaris(b) + '\n'))
            await new Promise((r) => keluar.once('drain', r));
    }
    await new Promise((selesai, gagal) => keluar.end((e) => (e ? gagal(e) : selesai())));
}
/** Pulihkan: simpan unggahan ke berkas sementara, periksa itu dump MySQL, hapus data lama, lalu muat. */
export async function pulihkanBackup(isi) {
    await eksklusif(async () => {
        const dir = await mkdtemp(path.join(tmpdir(), 'klira-pulih-'));
        const berkas = path.join(dir, 'backup.sql');
        try {
            await pipeline(isi, createWriteStream(berkas));
            const fh = await open(berkas, 'r');
            const kepala = Buffer.alloc(4096);
            const { bytesRead } = await fh.read(kepala, 0, 4096, 0);
            await fh.close();
            if (!/(MySQL|MariaDB) dump|CREATE TABLE/i.test(kepala.subarray(0, bytesRead).toString('utf8'))) {
                throw new GalatCadangan('Berkas bukan hasil backup Klira (.sql).');
            }
            const bersih = path.join(dir, 'bersih.sql');
            await bersihkanDump(berkas, bersih);
            await kosongkanDb();
            const { arg, nama, env } = sambunganDb();
            await jalankan('mysql', [...arg, nama], { env, masuk: createReadStream(bersih) });
        }
        finally {
            await rm(dir, { recursive: true, force: true });
        }
    });
}
/** Reset: hapus semua tabel, bangun ulang lewat migrasi, lalu seed awal. */
export async function resetSistem() {
    await eksklusif(async () => {
        await jalankan(process.execPath, [path.join(AKAR, 'packages/db/src/migrasi/entry-points/cli.js'), 'fresh'], { cwd: AKAR });
        await jalankan(process.execPath, [path.join(AKAR, 'packages/db/src/seed/seed.js')], { cwd: AKAR });
    });
}
