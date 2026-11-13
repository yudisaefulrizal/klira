import * as db from '@klira/db';
/** Hari ini (WIB) sebagai tanggal UTC tengah malam, untuk dibandingkan dengan kolom tanggal. */
const hariIni = () => new Date(new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10));
/**
 * Kesiapan pengaturan awal klinik (hanya hitungan, tanpa data pribadi): poli, praktisi, jadwal, tarif konsultasi, obat, pemeriksaan lab;
 * ditambah dua peringatan (pemeriksaan tanpa harga, SIP lewat masa berlaku).
 */
export async function hitungKesiapan(fasyankesId) {
    const [poli, praktisi, jadwal, tarif, obat, pemeriksaan, tanpaTarif, sipLewat] = await Promise.all([
        db.hitungLokasiUntukHitungKesiapan(fasyankesId, 'poli', 'O'),
        db.hitungProfilProfesiUntukHitungKesiapan(fasyankesId, true),
        db.hitungJadwalPraktikUntukHitungKesiapan(fasyankesId, true),
        db.hitungTarifLayananUntukHitungKesiapan(fasyankesId, 'konsultasi', true),
        db.hitungMasterObatUntukHitungKesiapan(fasyankesId, true),
        db.hitungMasterPemeriksaanUntukHitungKesiapan(fasyankesId, true),
        db.hitungMasterPemeriksaanUntukHitungKesiapan2(fasyankesId, true, null),
        db.hitungProfilProfesiUntukHitungKesiapan2(fasyankesId, true, hariIni()),
    ]);
    const wajib = (kunci, jumlah) => ({ kunci, jumlah, ok: jumlah > 0, peringatan: false });
    const peringatan = (kunci, jumlah) => ({ kunci, jumlah, ok: jumlah === 0, peringatan: true });
    return {
        item: [
            wajib('poli', poli), wajib('praktisi', praktisi), wajib('jadwal', jadwal), wajib('tarif', tarif), wajib('obat', obat), wajib('pemeriksaan', pemeriksaan),
            peringatan('pemeriksaan_tanpa_tarif', tanpaTarif), peringatan('sip_kedaluwarsa', sipLewat),
        ],
    };
}
