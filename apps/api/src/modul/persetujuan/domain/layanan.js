import { PERSETUJUAN_TINDAKAN } from '@klira/shared';
import { gagal } from '../../../umum/hasil.js';
const G = PERSETUJUAN_TINDAKAN.galat;
/**
 * Persetujuan tindakan (4.4): memakai tabel `persetujuan` jenis `tindakan` dengan teks persetujuan berversi. Tidak ada ubah atau hapus
 * (persetujuan adalah bukti); penarikan atau perubahan dicatat sebagai persetujuan baru.
 */
export function buatLayananPersetujuan({ repo, audit, tindakanKunjungan, sekarang = () => new Date() }) {
    return {
        /** Bahan modal: pasien, teks aktif, tindakan kunjungan, wali, dan calon saksi. */
        async siapkan(p, kunjunganId) {
            const k = await repo.kunjungan(p.fasyankes_id, kunjunganId);
            if (!k)
                return gagal('tidak_ditemukan', G.kunjunganTidakAda);
            const pasien = await repo.pasien(p.fasyankes_id, k.pasien_id);
            if (!pasien)
                return gagal('tidak_ditemukan', G.kunjunganTidakAda);
            const [teks, tindakan, wali, saksi] = await Promise.all([
                repo.teksAktif(p.fasyankes_id), tindakanKunjungan(p.fasyankes_id, kunjunganId), repo.wali(p.fasyankes_id, pasien.id), repo.saksiOpsi(p.fasyankes_id),
            ]);
            return { ok: true, data: { pasien, teks, tindakan, wali, saksi } };
        },
        /** Catat persetujuan tindakan; pasien tidak cakap hanya boleh ditandatangani wali. Teks yang dipakai disimpan beserta versinya. */
        async catat(p, kunjunganId, m, alamat) {
            const k = await repo.kunjungan(p.fasyankes_id, kunjunganId);
            if (!k)
                return gagal('tidak_ditemukan', G.kunjunganTidakAda);
            if (k.tahap_layanan === 'ditutup')
                return gagal('konflik', PERSETUJUAN_TINDAKAN.galat.kunjunganTidakAda);
            const pasien = await repo.pasien(p.fasyankes_id, k.pasien_id);
            if (!pasien)
                return gagal('tidak_ditemukan', G.kunjunganTidakAda);
            const teks = await repo.teksUntukPakai(p.fasyankes_id, m.teks_persetujuan_id);
            if (!teks)
                return gagal('tidak_valid', G.teksTidakAda, 'teks_persetujuan_id');
            if (pasien.tidak_cakap && m.penandatangan !== 'wali')
                return gagal('tidak_valid', PERSETUJUAN_TINDAKAN.persetujuan.tidakCakap, 'penandatangan');
            let penandatanganNama = pasien.nama;
            if (m.penandatangan === 'wali') {
                const wali = (await repo.wali(p.fasyankes_id, pasien.id)).find((w) => w.id === m.wali_id);
                if (!wali)
                    return gagal('tidak_valid', G.waliTidakSah, 'wali_id');
                penandatanganNama = wali.nama;
            }
            if (!(await repo.saksi(p.fasyankes_id, m.saksi_pengguna_id)))
                return gagal('tidak_valid', G.saksiTidakSah, 'saksi_pengguna_id');
            const d = await repo.catat({
                fasyankesId: p.fasyankes_id, pasienId: pasien.id, kunjunganId, oleh: p.id, teks, tindakanKode: m.tindakan_kode, tindakanNama: m.tindakan_nama.trim(), penjelasan: m.penjelasan.trim(),
                bentuk: m.bentuk, penandatangan: m.penandatangan, waliId: m.wali_id, penandatanganNama, saksiId: m.saksi_pengguna_id, waktu: sekarang(),
            });
            await audit.catat({
                fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'input', entitas: 'persetujuan', entitas_id: d.id, keterangan: `Persetujuan tindakan (${m.bentuk}, teks versi ${teks.versi}) kunjungan ${kunjunganId}`, alamat,
            });
            return { ok: true, data: d };
        },
        /** Persetujuan tindakan satu kunjungan; dicatat `lihat`. */
        async daftar(p, kunjunganId, alamat) {
            if (!(await repo.kunjungan(p.fasyankes_id, kunjunganId)))
                return gagal('tidak_ditemukan', G.kunjunganTidakAda);
            const d = await repo.daftar(p.fasyankes_id, kunjunganId);
            await audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'lihat', entitas: 'persetujuan', entitas_id: kunjunganId, keterangan: 'Membuka persetujuan tindakan kunjungan', alamat });
            return { ok: true, data: d };
        },
    };
}
