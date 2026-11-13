import { baca, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export function riwayatStatistik(fasyankesId: number, lokasiId: number | null, awal: Date, akhir: Date, batasAktif: Date, koneksi: Koneksi = pool) {
  return baca<Pick<T.RiwayatTahapLayanan, 'kunjungan_id' | 'tahap' | 'masuk' | 'keluar'>>(`
    SELECT r.kunjungan_id, r.tahap, r.masuk, r.keluar
    FROM riwayat_tahap_layanan r
    JOIN kunjungan k ON k.id = r.kunjungan_id AND k.fasyankes_id = r.fasyankes_id
    LEFT JOIN antrean a ON a.kunjungan_id = k.id
    WHERE r.fasyankes_id = ? AND k.jenis = 'AMB' AND r.tahap <> 'ditutup'
      AND (a.status IS NULL OR a.status <> 'batal')
      AND (? IS NULL OR k.lokasi_id = ?)
      AND ((r.keluar >= ? AND r.keluar < ?) OR r.keluar IS NULL OR r.keluar >= ?)
  `, [fasyankesId, lokasiId, lokasiId, awal, akhir, batasAktif], koneksi);
}
