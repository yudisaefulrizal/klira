import { kabarkanLayarPanggilan } from '../../layar-panggilan/domain/kanal.js';
import { ANTREAN_LAB, REGISTRASI, bolehAksiAntrean, bolehPindahTahap, tanggalWib, TRANSISI_ANTREAN } from '@klira/shared';
import { gagal } from '../../../umum/hasil.js';
import { KunjunganBerjalanError } from '../data-access/repositori.js';
const kosongJadiNull = (v) => (v == null || v.trim() === '' ? null : v.trim());
export function buatLayananKunjungan({ repo, audit, orderLab, sekarang = () => new Date() }) {
    return {
        opsi(p) {
            return repo.opsi(p.fasyankes_id);
        },
        /** Pendaftaran kunjungan rawat jalan atau langsung rawat inap; antrean otomatis untuk rawat jalan. */
        async daftarkan(p, m, alamat) {
            if (!(await repo.pasienAda(p.fasyankes_id, m.pasien_id)))
                return gagal('tidak_ditemukan', REGISTRASI.galat.pasienTidakAda);
            let jenisPoli = null;
            if (m.jenis === 'LAB') {
                // Penunjang saja: tanpa poli dan dokter; antrean jenis Laboratorium (awalan L); pemeriksaan wajib dan harus sah.
                const ids = [...new Set(m.pemeriksaan_ids ?? [])];
                if (!ids.length || (await repo.pemeriksaanLabAktif(p.fasyankes_id, ids)) !== ids.length)
                    return gagal('tidak_valid', REGISTRASI.galat.pemeriksaanTidakSah, 'pemeriksaan_ids');
                m = { ...m, pemeriksaan_ids: ids, dpjp_id: undefined };
                jenisPoli = { jenis_poli: ANTREAN_LAB.jenis_poli, awalan: ANTREAN_LAB.awalan };
            }
            if (m.jenis === 'AMB') {
                jenisPoli = await repo.jenisPoliOperasional(p.fasyankes_id, m.jenis_poli);
                if (!jenisPoli)
                    return gagal('tidak_valid', REGISTRASI.galat.poliTidakSah, 'jenis_poli');
            }
            if (m.dpjp_id && !(await repo.dpjpSah(p.fasyankes_id, m.dpjp_id)))
                return gagal('tidak_valid', REGISTRASI.galat.dpjpTidakSah, 'dpjp_id');
            if (m.dpjp_id && jenisPoli && !(await repo.dokterDiJenis(p.fasyankes_id, m.dpjp_id, jenisPoli.jenis_poli))) {
                return gagal('tidak_valid', REGISTRASI.galat.dokterBukanPoli, 'dpjp_id');
            }
            if (await repo.kunjunganBerjalan(p.fasyankes_id, m.pasien_id))
                return gagal('konflik', REGISTRASI.galat.kunjunganBerjalan);
            let k;
            try {
                k = await repo.daftarkan(p.fasyankes_id, p.id, { ...m, ...(jenisPoli ?? {}), nomor_sep: kosongJadiNull(m.nomor_sep), keluhan_singkat: kosongJadiNull(m.keluhan_singkat) }, sekarang());
            }
            catch (e) {
                if (e instanceof KunjunganBerjalanError)
                    return gagal('konflik', REGISTRASI.galat.kunjunganBerjalan);
                throw e;
            }
            if (m.jenis === 'LAB') {
                // Order lab dan item tagihannya dibuat dari tarif tes; pemeriksaan sudah divalidasi di atas.
                const o = await orderLab(p, k.id, { pemeriksaan_ids: m.pemeriksaan_ids, prioritas: 'rutin', catatan: null }, alamat);
                if (!o.ok)
                    return o;
            }
            kabarkanLayarPanggilan(p.fasyankes_id);
            await audit.catat({
                fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'input', entitas: 'kunjungan', entitas_id: k.id,
                keterangan: `Pendaftaran kunjungan ${m.jenis}${k.antrean ? ` antrean ${k.antrean.kode}` : ''}`, alamat,
            });
            return { ok: true, data: k };
        },
        /** Maju satu tahap layanan (skrining, pemeriksaan, resep, kasir); penutupan kunjungan punya peristiwanya sendiri. */
        async ubahTahap(p, id, ke, alamat) {
            const dari = await repo.tahapSekarang(p.fasyankes_id, id);
            if (!dari)
                return gagal('tidak_ditemukan', REGISTRASI.galat.kunjunganTidakAda);
            if (!bolehPindahTahap(dari, ke))
                return gagal('konflik', REGISTRASI.galat.tahapTidakSah, 'tahap');
            const k = await repo.ubahTahap(p.fasyankes_id, id, dari, ke);
            if (!k)
                return gagal('konflik', REGISTRASI.galat.tahapTidakSah, 'tahap');
            kabarkanLayarPanggilan(p.fasyankes_id);
            await audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'perbaikan', entitas: 'kunjungan', entitas_id: id, keterangan: `Tahap layanan ${dari} menjadi ${ke}`, alamat });
            return { ok: true, data: k };
        },
        /** Panggil, mulai, selesai, atau batalkan antrean sesuai perpindahan status yang sah. */
        async aksiAntrean(p, id, aksi, alamat, lokasiPilihan) {
            const status = await repo.statusAntrean(p.fasyankes_id, id);
            if (!status)
                return gagal('tidak_ditemukan', REGISTRASI.galat.antreanTidakAda);
            if (!bolehAksiAntrean(status, aksi))
                return gagal('konflik', REGISTRASI.galat.antreanTidakSah);
            const t = TRANSISI_ANTREAN[aksi];
            const hasil = await repo.ubahAntrean(p.fasyankes_id, id, aksi, t.dari, t.ke, sekarang(), lokasiPilihan);
            if (!hasil)
                return gagal('konflik', REGISTRASI.galat.antreanTidakSah);
            if (hasil.galat === 'poli_sibuk')
                return gagal('konflik', REGISTRASI.galat.poliSibuk(hasil.poli, hasil.kode));
            if (hasil.galat === 'jenis_sibuk')
                return gagal('konflik', REGISTRASI.galat.poliSibukJenis(hasil.jenis));
            if (hasil.galat === 'dokter_poli_sibuk')
                return gagal('konflik', REGISTRASI.galat.dokterTanpaPoliKosong(hasil.jenis));
            if (hasil.galat === 'poli_pilihan_tidak_tersedia')
                return gagal('konflik', REGISTRASI.galat.poliBukanJenis);
            if (hasil.galat === 'poli_tidak_operasional')
                return gagal('konflik', REGISTRASI.galat.poliTidakOperasional(hasil.poli));
            kabarkanLayarPanggilan(p.fasyankes_id);
            await audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'perbaikan', entitas: 'antrean', entitas_id: id, keterangan: `Antrean ${hasil.kode}: ${aksi} (${status} menjadi ${t.ke})`, alamat });
            return { ok: true, data: hasil };
        },
        /** Daftar antrean satu hari (bawaan hari ini menurut zona Asia/Jakarta). */
        async daftarAntrean(p, f) {
            const tanggal = f.tanggal ?? tanggalWib(sekarang());
            const { total, baris } = await repo.daftarAntrean(p.fasyankes_id, { ...f, tanggal });
            return { data: baris, halaman: f.halaman, ukuran: f.ukuran, total };
        },
    };
}
