import { PENGATURAN_SATUSEHAT as S } from '@klira/shared';

/** Batas waktu per panggilan saat pendaftaran: petugas tidak boleh menunggu lama bila SATUSEHAT lambat. */
export const BATAS_WAKTU_PENDAFTARAN_MS = 4000;

/**
 * Cari pasien di SATUSEHAT menurut NIK lalu simpan IHS Number. Tidak pernah melempar galat:
 * pendaftaran harus tetap berhasil walau SATUSEHAT mati atau belum dikonfigurasi.
 *
 * Opsi: `paksa` mencari ulang walau IHS Number sudah ada (tidak ditemukan berarti dikosongkan, gagal berarti dibiarkan);
 * `nikBerubah` mengosongkan IHS Number lama lebih dulu karena milik NIK sebelumnya.
 * Hasil: { status: sudah | dilewati | terhubung | tidak_ditemukan | gagal, ihs_number?, alasan?, pesan? }.
 */
export function buatSinkronIhs({ repo, klienAktif, audit }) {
    return async function sinkronIhs(p, pasienId, { paksa = false, nikBerubah = false, alamat } = {}) {
        try {
            const pasien = await repo.pasienUntukSinkron(p.fasyankes_id, pasienId);
            if (!pasien)
                return { status: 'dilewati', alasan: 'pasien_tidak_ada', pesan: '' };
            const catat = (keterangan) => audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'perbaikan', entitas: 'pasien', entitas_id: pasienId, keterangan, alamat });
            if (nikBerubah && pasien.ihs_number) {
                await repo.isiIhs(p.fasyankes_id, pasienId, null);
                pasien.ihs_number = null;
                await catat('IHS Number dihapus karena NIK berubah');
            }
            if (pasien.ihs_number && !paksa)
                return { status: 'sudah', ihs_number: pasien.ihs_number, pesan: '' };
            if (!pasien.nik)
                return { status: 'dilewati', alasan: 'tanpa_nik', pesan: S.ihs.tanpaNik };
            const aktif = await klienAktif(p.fasyankes_id, { batasWaktuMs: BATAS_WAKTU_PENDAFTARAN_MS });
            if (!aktif)
                return { status: 'dilewati', alasan: 'belum_dikonfigurasi', pesan: S.ihs.belumDikonfigurasi };
            const hasil = await aktif.klien.cariPasienNik(pasien.nik);
            if (!hasil.ditemukan) {
                if (pasien.ihs_number) {
                    await repo.isiIhs(p.fasyankes_id, pasienId, null);
                    await catat('IHS Number dihapus: NIK tidak ditemukan di SATUSEHAT');
                }
                return { status: 'tidak_ditemukan', pesan: S.ihs.tidakDitemukan };
            }
            if (hasil.id !== pasien.ihs_number) {
                await repo.isiIhs(p.fasyankes_id, pasienId, hasil.id);
                await catat(`IHS Number diisi dari SATUSEHAT (${aktif.environment})`);
            }
            return { status: 'terhubung', ihs_number: hasil.id, pesan: S.ihs.terhubung };
        }
        catch (galat) {
            // Hanya pesan dari klien integrasi yang ditampilkan; galat lain (SQL, audit) tidak dibocorkan.
            const pesan = galat?.name === 'GalatIntegrasi' ? galat.message : 'kesalahan tak terduga';
            return { status: 'gagal', pesan: S.ihs.gagal(pesan) };
        }
    };
}
