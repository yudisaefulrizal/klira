import type { PoolConnection } from 'mysql2/promise';
import { baca, tulis, type Koneksi } from '../../koneksi';
import type { BerkasMigrasi, CatatanMigrasi } from '../domain/berkas';

export async function kunciMigrasi(koneksi: Koneksi): Promise<string> {
  const [hasil] = await baca<{ nama: string; terkunci: number | null }>(
    "SELECT nama, GET_LOCK(nama, 30) AS terkunci FROM (SELECT CONCAT('klira:migrasi:', LEFT(SHA2(DATABASE(), 256), 48)) AS nama) k", [], koneksi);
  if (hasil.terkunci !== 1) throw new Error('Migrasi lain sedang berjalan atau pengunci database tidak tersedia.');
  return hasil.nama;
}
export async function lepasKunci(koneksi: Koneksi, nama: string): Promise<void> {
  await baca('SELECT RELEASE_LOCK(?)', [nama], koneksi);
}
export async function siapkanRiwayat(koneksi: Koneksi): Promise<void> {
  await tulis(`CREATE TABLE IF NOT EXISTS _migrasi (
    nomor BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL UNIQUE,
    checksum CHAR(64) CHARACTER SET ascii NOT NULL,
    mulai_pada DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    selesai_pada DATETIME(3) NULL
  ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`, [], koneksi);
}
export function daftarRiwayat(koneksi: Koneksi): Promise<CatatanMigrasi[]> {
  return baca<CatatanMigrasi>('SELECT nomor, nama, checksum, selesai_pada FROM _migrasi ORDER BY nomor', [], koneksi).then(baris => baris.map(b => ({ ...b, nomor: Number(b.nomor) })));
}
export async function catatMulai(koneksi: Koneksi, berkas: BerkasMigrasi): Promise<void> {
  await tulis('INSERT INTO _migrasi (nomor, nama, checksum) VALUES (?, ?, ?)', [berkas.nomor, berkas.nama, berkas.checksum], koneksi);
}
export async function catatSelesai(koneksi: Koneksi, nomor: number): Promise<void> {
  await tulis('UPDATE _migrasi SET selesai_pada = CURRENT_TIMESTAMP(3) WHERE nomor = ?', [nomor], koneksi);
}
export function daftarTabel(koneksi: Koneksi): Promise<{ nama: string }[]> {
  return baca("SELECT TABLE_NAME AS nama FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'", [], koneksi);
}
export async function hapusTabel(koneksi: PoolConnection, nama: string): Promise<void> {
  await tulis(`DROP TABLE ${koneksi.escapeId(nama)}`, [], koneksi);
}
