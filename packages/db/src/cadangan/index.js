import { fileURLToPath as kliraFilePath } from 'node:url';
const __dirname = kliraFilePath(new URL('.', import.meta.url));
import { spawn } from 'node:child_process';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdtemp, open, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { daftarIdFasyankes } from '../data-access/fasyankes.js';
import { tambahLogAuditUntukTambah } from '../data-access/log_audit.js';
import { tambahRiwayatBackup } from '../data-access/riwayat_backup.js';
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
// Alat baris perintah berbeda nama menurut paket yang terpasang: MySQL (mysql, mysqldump) atau MariaDB (mariadb, mariadb-dump).
const KANDIDAT_ALAT = { klien: ['mysql', 'mariadb'], dump: ['mysqldump', 'mariadb-dump'] };
const alatDitemukan = new Map();
function alat(jenis) {
    if (!alatDitemukan.has(jenis)) {
        const cari = (async () => {
            for (const nama of KANDIDAT_ALAT[jenis]) {
                try {
                    await jalankan(nama, ['--version']);
                    return nama;
                }
                catch (galat) {
                    if (galat?.code !== 'ENOENT')
                        throw galat;
                }
            }
            throw new GalatCadangan(`Perintah ${KANDIDAT_ALAT[jenis].join(' atau ')} tidak ditemukan di server.`);
        })();
        cari.catch(() => alatDitemukan.delete(jenis));
        alatDitemukan.set(jenis, cari);
    }
    return alatDitemukan.get(jenis);
}
/**
 * Opsi klien yang mematikan perintah pengakses sistem saat memuat dump. Tanpa opsi ini klien menjalankan baris `\!` (perintah shell)
 * dan `source` (baca berkas) dari isi dump. MariaDB: --sandbox; MySQL: --system-command=OFF. Null bila klien tidak mendukung keduanya.
 */
async function opsiTanpaPerintahSistem(klien) {
    const bantuan = await jalankan(klien, ['--help']);
    if (/--sandbox\b/.test(bantuan))
        return ['--sandbox'];
    if (/--system-command\b/.test(bantuan))
        return ['--system-command=OFF'];
    return null;
}
/** Menghapus semua tabel di database aplikasi. */
async function kosongkanDb(klien) {
    const { arg, nama, env } = sambunganDb();
    const daftar = await jalankan(klien, [...arg, '-N', '-B', nama, '-e', 'SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = \'BASE TABLE\''], { env });
    const tabel = daftar.split('\n').map((t) => t.trim()).filter(Boolean);
    if (!tabel.length)
        return;
    const sql = `SET FOREIGN_KEY_CHECKS=0;\n${tabel.map((t) => `DROP TABLE IF EXISTS \`${t.replace(/`/g, '``')}\`;`).join('\n')}\n`;
    await jalankan(klien, [...arg, nama], { env, masuk: sql });
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
/** Aliran hasil dump seluruh database; hubungi `batal` bila penerima memutus. */
export async function mulaiUnduhBackup() {
    const perintah = await alat('dump');
    const { arg, nama, env } = sambunganDb();
    const anak = spawn(perintah, [...arg, '--single-transaction', '--routines', '--no-tablespaces', nama], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let galat = '';
    anak.stderr.on('data', (d) => (galat += d.toString()));
    const selesai = new Promise((ok, gagal) => {
        anak.on('error', gagal);
        anak.on('close', (kode) => (kode === 0 ? ok() : gagal(new GalatCadangan(galat.trim().slice(-500) || `${perintah} gagal`))));
    });
    return { aliran: anak.stdout, selesai, batal: () => anak.kill() };
}
/** Tulis cadangan ke berkas (hanya bisa dibaca pemiliknya); mengembalikan ukuran byte. Menolak menimpa berkas yang sudah ada. */
export async function buatCadanganKeBerkas(berkas) {
    const { aliran, selesai } = await mulaiUnduhBackup();
    let ukuranByte = 0;
    const hitung = new Transform({ transform(potongan, _enc, lanjut) { ukuranByte += potongan.length; lanjut(null, potongan); } });
    try {
        await Promise.all([pipeline(aliran, hitung, createWriteStream(berkas, { flags: 'wx', mode: 0o600 })), selesai]);
    }
    catch (galat) {
        if (galat?.code === 'EEXIST')
            throw new GalatCadangan(`Berkas ${berkas} sudah ada.`);
        await rm(berkas, { force: true });
        throw galat;
    }
    return ukuranByte;
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
/**
 * Pulihkan: simpan isi ke berkas sementara, periksa itu dump MySQL/MariaDB, hapus data lama, lalu muat. Mengembalikan `{ ukuranByte }`.
 * `batasByte` menolak isi yang lebih besar. `wajibTanpaPerintahSistem` menolak sebelum data disentuh bila klien tidak bisa
 * mematikan perintah pengakses sistem (dipakai untuk isi yang datang dari jaringan); opsi itu tetap dipasang kapan pun tersedia.
 */
export async function pulihkanBackup(isi, { batasByte = Infinity, wajibTanpaPerintahSistem = false } = {}) {
    return eksklusif(async () => {
        const klien = await alat('klien');
        const aman = await opsiTanpaPerintahSistem(klien);
        if (!aman && wajibTanpaPerintahSistem)
            throw new GalatCadangan('Klien database di server ini tidak dapat mematikan perintah sistem saat memuat cadangan. Pulihkan lewat perintah operator di server.');
        const dir = await mkdtemp(path.join(tmpdir(), 'klira-pulih-'));
        const berkas = path.join(dir, 'backup.sql');
        let ukuranByte = 0;
        const batasi = new Transform({
            transform(potongan, _enc, lanjut) {
                ukuranByte += potongan.length;
                if (ukuranByte > batasByte)
                    return lanjut(new GalatCadangan(`Berkas cadangan melebihi batas ${Math.ceil(batasByte / 1024 / 1024)} MB.`));
                lanjut(null, potongan);
            },
        });
        try {
            await pipeline(isi, batasi, createWriteStream(berkas, { mode: 0o600 }));
            const fh = await open(berkas, 'r');
            const kepala = Buffer.alloc(4096);
            const { bytesRead } = await fh.read(kepala, 0, 4096, 0);
            await fh.close();
            if (!/(MySQL|MariaDB) dump|CREATE TABLE/i.test(kepala.subarray(0, bytesRead).toString('utf8'))) {
                throw new GalatCadangan('Berkas bukan hasil backup Klira (.sql).');
            }
            const bersih = path.join(dir, 'bersih.sql');
            await bersihkanDump(berkas, bersih);
            await kosongkanDb(klien);
            const { arg, nama, env } = sambunganDb();
            await jalankan(klien, [...(aman ?? []), ...arg, nama], { env, masuk: createReadStream(bersih) });
            return { ukuranByte };
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
/**
 * Jejak setelah isi database diganti (pulihkan atau reset). Pelaku sebelum penggantian belum tentu ada di data yang baru,
 * jadi dicatat tanpa id pengguna; identitasnya ditulis pemanggil di `keterangan`.
 */
export async function catatSetelahGantiData({ lokasi, keterangan, alamat, ukuranByte }) {
    const [fasyankesId = null] = await daftarIdFasyankes(1);
    await tambahLogAuditUntukTambah(fasyankesId, null, 'perbaikan', 'cadangan', null, keterangan.slice(0, 255), new Date(), alamat?.slice(0, 64) ?? null);
    if (fasyankesId !== null)
        await tambahRiwayatBackup(fasyankesId, 'berhasil', lokasi, null, ukuranByte ?? null);
}
