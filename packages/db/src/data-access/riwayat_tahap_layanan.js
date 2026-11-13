import { baca, pool } from '../koneksi.js';
export function riwayatStatistik(fasyankesId, lokasiId, awal, akhir, batasAktif, koneksi = pool) {
    return baca(`
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
