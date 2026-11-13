import * as db from '@klira/db';
import type { PengaturanKeamananMasukan } from '@klira/shared';

export type BarisPengaturan = PengaturanKeamananMasukan & { diubah_pada: Date };
export type BarisBackup = { id: number; waktu: Date; status: string; ukuran_byte: number | null; lokasi: string | null };

export interface RepositoriKeamanan {
  ambilPengaturan(fasyankesId: number): Promise<BarisPengaturan | null>;
  simpanPengaturan(fasyankesId: number, nilai: PengaturanKeamananMasukan, oleh: number): Promise<BarisPengaturan>;
  /** Hanya baca: baris riwayat diisi tugas backup di worker. */
  daftarBackup(fasyankesId: number, lewati: number, ambil: number): Promise<{ total: number; baris: BarisBackup[] }>;
}



export class RepositoriKeamananMysql implements RepositoriKeamanan {
  ambilPengaturan(fasyankesId: number): Promise<BarisPengaturan | null> {
    return db.ambilPengaturanKeamananUntukAmbilPengaturan(fasyankesId);
  }

  simpanPengaturan(fasyankesId: number, nilai: PengaturanKeamananMasukan, oleh: number): Promise<BarisPengaturan> {
    const sekarang = new Date();
    return db.transaksi(async koneksiBaru => { (await db.simpanPengaturanKeamananUntukSimpanPengaturan(fasyankesId, (nilai)?.masa_sesi_jam, (nilai)?.batas_percobaan_masuk, (nilai)?.panjang_minimum_kata_sandi, oleh, sekarang, koneksiBaru)); return db.simpanPengaturanKeamananUntukSimpanPengaturanHasil(fasyankesId, koneksiBaru); });
  }

  async daftarBackup(fasyankesId: number, lewati: number, ambil: number) {
    const [total, baris] = await Promise.all([
      db.hitungRiwayatBackupUntukDaftarBackup(fasyankesId),
      db.daftarRiwayatBackupUntukDaftarBackup(fasyankesId, ambil, lewati),
    ]);
    return { total, baris: baris.map((b) => ({ ...b, ukuran_byte: b.ukuran_byte === null ? null : Number(b.ukuran_byte) })) };
  }
}
