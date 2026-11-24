import * as db from '@klira/db';
import { batasPdp } from '@klira/shared';
export const awalHariWib = (d) => new Date(`${new Date(d.getTime() + 7 * 3_600_000).toISOString().slice(0, 10)}T00:00:00.000+07:00`);
/** Penolakan aturan yang terdeteksi saat menulis (status berubah di antara baca dan tulis, penarikan ganda). */
export class GalatPdp extends Error {
    kode;
    constructor(kode) {
        super(kode);
        this.kode = kode;
    }
}
const bentrokUnik = (e) => db.bentrokUnik(e);
/** Akses data pelindungan data pribadi. Pembaruan status berpagar (status asal harus sama); tidak ada hapus. */
export class RepositoriPdpMysql {
    async pasien(id) {
        return db.cariPasienUntukBuatRuteInstagram(id);
    }
    async pasienBanyak(ids) {
        return new Map((await db.daftarPasienUntukPetakanAntrean([...new Set(ids)])).map((p) => [p.id, p]));
    }
    async namaPengguna(ids) {
        return new Map((await db.daftarPenggunaUntukNamaPengguna([...new Set(ids)])).map((u) => [u.id, u.nama]));
    }
    /** Hitungan tugas: permintaan hak, insiden belum diberitahukan, DPIA jatuh tempo, pemusnahan lewat jadwal. */
    async ringkasan(sekarang) {
        const [hakAktif, hakTerlambat, insidenBelum, insidenTerlambat, dpia, musnah] = await Promise.all([
            db.hitungPermintaanHakUntukRingkasan('selesai'),
            db.hitungPermintaanHakUntukRingkasan2('selesai', sekarang),
            db.hitungInsidenDataUntukRingkasan(null),
            db.hitungInsidenDataUntukRingkasan2(null, sekarang),
            db.hitungDpiaUntukRingkasan(awalHariWib(sekarang)),
            db.hitungPemusnahanUntukRingkasan('selesai', awalHariWib(sekarang)),
        ]);
        return { hak_aktif: hakAktif, hak_terlambat: hakTerlambat, insiden_belum_notifikasi: insidenBelum, insiden_terlambat: insidenTerlambat, dpia_jatuh_tempo: dpia, pemusnahan_terlambat: musnah };
    }
    // ---- Permintaan hak ----
    async buatHak(m, oleh, sekarang) {
        return (await db.transaksi(async (koneksiBaru) => { const _hasil = await db.tambahPermintaanHakUntukBuatHak(m.pasien_id, m.jenis, m.saluran, m.pemohon_nama, m.pemohon_hubungan, m.verifikasi, m.rincian, sekarang, batasPdp(sekarang), oleh, koneksiBaru); return db.tambahPermintaanHakUntukBuatHakHasil(_hasil.id, koneksiBaru); })).id;
    }
    async hak(id) {
        return db.cariPermintaanHakUntukHak(id);
    }
    async daftarHak(f, sekarang) {
        const cari = f.cari?.trim();
        const pasienIds = cari ? (await db.daftarPasienUntukDaftarHak(cari, 1000)).map((p) => p.id) : [];
        const [total, baris, aktif, terlambat] = await Promise.all([
            db.hitungPermintaanHakUntukDaftarHak((f.status) ? (f.status) : undefined, cari, pasienIds, cari),
            db.daftarPermintaanHakUntukDaftarHak((f.status) ? (f.status) : undefined, cari, pasienIds, cari, f.ukuran, (f.halaman - 1) * f.ukuran),
            db.hitungPermintaanHakUntukRingkasan('selesai'),
            db.hitungPermintaanHakUntukRingkasan2('selesai', sekarang),
        ]);
        return { total, baris, aktif, terlambat };
    }
    /** Maju satu tahap hanya bila status tersimpan masih salah satu `dari` (dua petugas serempak tidak sama-sama berhasil). */
    async majuHak(id, dari, ke, data) {
        const n = await db.ubahPermintaanHakUntukMajuHak((data)?.pasien_id, (data)?.jenis, (data)?.saluran, (data)?.pemohon_nama, (data)?.pemohon_hubungan, (data)?.verifikasi, (data)?.rincian, (data)?.diterima_pada, (data)?.batas_waktu, ke, (data)?.keputusan_oleh, (data)?.waktu_keputusan, (data)?.alasan_keputusan, (data)?.pelaksanaan, (data)?.pelaksana_id, (data)?.waktu_pelaksanaan, (data)?.notifikasi_pada, (data)?.notifikasi_oleh, (data)?.catatan_notifikasi, (data)?.dibuat_oleh, (data)?.dibuat_pada, id, [...dari]);
        if (n.count !== 1)
            throw new GalatPdp('bentrok');
    }
    // ---- Teks pemberitahuan dan persetujuan ----
    async daftarTeksPdp() {
        return db.daftarTeksPersetujuanUntukDaftarTeksPdp('PDP', 100);
    }
    /** Versi berikutnya menggantikan yang berlaku (versi lama tetap tersimpan); penomoran dikunci agar versi tidak ganda. */
    async buatTeksPdp(m, oleh) {
        for (let percobaan = 0;; percobaan++) {
            try {
                return await db.transaksi(async (tx) => {
                    const maks = await db.ringkasanTeksPersetujuanUntukBuatTeksPdp('PDP', tx);
                    await db.ubahTeksPersetujuanUntukBuatTeksPdp(false, 'PDP', true, tx);
                    return (await (async () => { const _hasil = await db.tambahTeksPersetujuanUntukBuatTeksPdp('PDP', (maks._max.versi ?? 0) + 1 + percobaan, m.judul, m.tujuan, m.isi, true, oleh, tx); return db.tambahTeksPersetujuanUntukBuatTeksPdpHasil(_hasil.id, tx); })()).id;
                });
            }
            catch (e) {
                if (!((db.bentrokUnik(e) || db.transaksiBisaDiulang(e))) || percobaan >= 3)
                    throw e;
            }
        }
    }
    async daftarPersetujuan(f) {
        const cari = f.cari?.trim();
        const pasienIds = cari ? (await db.daftarPasienUntukDaftarHak(cari, 1000)).map((p) => p.id) : [];
        const [total, baris] = await Promise.all([db.hitungPersetujuanUntukDaftarPersetujuan(['general', 'PDP'], (f.status) ? (f.status) : undefined, (cari) ? (pasienIds) : undefined), db.daftarPersetujuanUntukDaftarPersetujuan(['general', 'PDP'], (f.status) ? (f.status) : undefined, (cari) ? (pasienIds) : undefined, f.ukuran, (f.halaman - 1) * f.ukuran)]);
        const tarik = await db.daftarPenarikanPersetujuanUntukDaftarPersetujuan(baris.map((b) => b.id));
        return { total, baris, tarik };
    }
    async persetujuan(id) {
        return db.cariPersetujuanUntukPersetujuan(id);
    }
    async tarik(persetujuanId, alasan, oleh, sekarang) {
        try {
            await db.transaksi(async (tx) => {
                const n = await db.ubahPersetujuanUntukTarik('ditarik', persetujuanId, 'diberikan', tx);
                if (n.count !== 1)
                    throw new GalatPdp('sudah_ditarik');
                await db.tambahPenarikanPersetujuanUntukTarik(persetujuanId, alasan, sekarang, batasPdp(sekarang), oleh, tx);
            });
        }
        catch (e) {
            if (bentrokUnik(e))
                throw new GalatPdp('sudah_ditarik');
            throw e;
        }
    }
    // ---- ROPA ----
    async daftarRopa(halaman, ukuran) {
        const [total, baris] = await Promise.all([db.hitungRopaUntukDaftarRopa(), db.daftarRopaUntukDaftarRopa(ukuran, (halaman - 1) * ukuran)]);
        return { total, baris };
    }
    semuaRopa() {
        return db.daftarRopaUntukSemuaRopa(1000);
    }
    async ropa(id) {
        return db.cariRopaUntukRopa(id);
    }
    async buatRopa(m, oleh) {
        return (await db.transaksi(async (koneksiBaru) => { const _hasil = await db.tambahRopaUntukBuatRopa((m)?.nama_kegiatan, (m)?.ppdp_nama, (m)?.sumber_tujuan, (m)?.dasar, (m)?.tujuan, (m)?.jenis_data, (m)?.kategori_subjek, (m)?.pihak_akses, (m)?.pemenuhan_hak, (m)?.aliran, (m)?.masa_retensi, (m)?.pengamanan, (m)?.transfer, oleh, koneksiBaru); return db.tambahRopaUntukBuatRopaHasil(_hasil.id, koneksiBaru); })).id;
    }
    async ubahRopa(id, m) {
        return (await db.ubahRopaUntukUbahRopa((m)?.nama_kegiatan, (m)?.ppdp_nama, (m)?.sumber_tujuan, (m)?.dasar, (m)?.tujuan, (m)?.jenis_data, (m)?.kategori_subjek, (m)?.pihak_akses, (m)?.pemenuhan_hak, (m)?.aliran, (m)?.masa_retensi, (m)?.pengamanan, (m)?.transfer, new Date(), id)).count === 1;
    }
    // ---- DPIA ----
    async daftarDpia(halaman, ukuran) {
        const [total, baris] = await Promise.all([db.hitungDpiaUntukDaftarDpia(), db.daftarDpiaUntukDaftarDpia(ukuran, (halaman - 1) * ukuran)]);
        const ropa = new Map((await db.daftarRopaUntukDaftarDpia(baris.flatMap((b) => (b.ropa_id ? [b.ropa_id] : [])))).map((r) => [r.id, r.nama_kegiatan]));
        return { total, baris, ropa };
    }
    async dpia(id) {
        return db.cariDpiaUntukDpia(id);
    }
    async ropaAda(id) {
        return (await db.hitungRopaUntukRopaAda(id)) > 0;
    }
    async buatDpia(m, oleh, sekarang) {
        const { tandai_ditinjau, tinjau_ulang_pada, ...isi } = m;
        return (await db.transaksi(async (koneksiBaru) => { const _hasil = await db.tambahDpiaUntukBuatDpia((isi)?.pemrosesan, (isi)?.ropa_id, (isi)?.risiko, (isi)?.mitigasi, (isi)?.saran_ppdp, new Date(`${tinjau_ulang_pada}T00:00:00.000Z`), tandai_ditinjau ? sekarang : null, oleh, koneksiBaru); return db.tambahDpiaUntukBuatDpiaHasil(_hasil.id, koneksiBaru); })).id;
    }
    async ubahDpia(id, m, sekarang) {
        const { tandai_ditinjau, tinjau_ulang_pada, ...isi } = m;
        return (await db.ubahDpiaUntukUbahDpia((isi)?.pemrosesan, (isi)?.ropa_id, (isi)?.risiko, (isi)?.mitigasi, (isi)?.saran_ppdp, new Date(`${tinjau_ulang_pada}T00:00:00.000Z`), (tandai_ditinjau) ? (sekarang) : (undefined), sekarang, id)).count === 1;
    }
    // ---- Insiden ----
    async daftarInsiden(halaman, ukuran) {
        const [total, baris] = await Promise.all([db.hitungInsidenDataUntukDaftarInsiden(), db.daftarInsidenDataUntukDaftarInsiden(ukuran, (halaman - 1) * ukuran)]);
        const pasien = await db.daftarInsidenPasienUntukDaftarInsiden(baris.map((b) => b.id));
        return { total, baris, pasien };
    }
    async insiden(id) {
        return db.cariInsidenDataUntukInsiden(id);
    }
    async pasienInsiden(insidenId) {
        return (await db.daftarInsidenPasienUntukPasienInsiden(insidenId)).map((p) => p.pasien_id);
    }
    dataInsiden(m, waktu) {
        return {
            waktu_kejadian: m.waktu_kejadian ? waktu(m.waktu_kejadian) : null, waktu_diketahui: waktu(m.waktu_diketahui), siber: m.siber, uraian: m.uraian, data_terungkap: m.data_terungkap, penanganan: m.penanganan, pemulihan: m.pemulihan, kontak_ppdp: m.kontak_ppdp,
            notifikasi_pasien_pada: m.notifikasi_pasien_pada ? waktu(m.notifikasi_pasien_pada) : null, notifikasi_lembaga_pada: m.notifikasi_lembaga_pada ? waktu(m.notifikasi_lembaga_pada) : null,
        };
    }
    async buatInsiden(m, oleh, waktu) {
        const d = this.dataInsiden(m, waktu);
        return db.transaksi(async (tx) => {
            const i = await (async () => { const _hasil = await db.tambahInsidenDataUntukBuatInsiden((d)?.waktu_kejadian, (d)?.waktu_diketahui, (d)?.siber, (d)?.uraian, (d)?.data_terungkap, (d)?.penanganan, (d)?.pemulihan, (d)?.kontak_ppdp, batasPdp(d.waktu_diketahui), (d)?.notifikasi_pasien_pada, (d)?.notifikasi_lembaga_pada, oleh, tx); return db.tambahInsidenDataUntukBuatInsidenHasil(_hasil.id, tx); })();
            if (m.pasien_ids.length)
                await db.tambahBanyakInsidenPasienUntukBuatInsiden([...new Set(m.pasien_ids)].map((pasien_id) => ({ insiden_id: i.id, pasien_id })), tx);
            return i.id;
        });
    }
    async ubahInsiden(id, m, waktu, sekarang) {
        const d = this.dataInsiden(m, waktu);
        return db.transaksi(async (tx) => {
            const n = await db.ubahInsidenDataUntukUbahInsiden((d)?.waktu_kejadian, (d)?.waktu_diketahui, (d)?.siber, (d)?.uraian, (d)?.data_terungkap, (d)?.penanganan, (d)?.pemulihan, (d)?.kontak_ppdp, batasPdp(d.waktu_diketahui), (d)?.notifikasi_pasien_pada, (d)?.notifikasi_lembaga_pada, sekarang, id, tx);
            if (n.count !== 1)
                return false;
            const ada = new Set((await db.daftarInsidenPasienUntukUbahInsiden(id, tx)).map((p) => p.pasien_id));
            const baru = new Set(m.pasien_ids);
            const tambah = [...baru].filter((x) => !ada.has(x));
            if (tambah.length)
                await db.tambahBanyakInsidenPasienUntukBuatInsiden(tambah.map((pasien_id) => ({ insiden_id: id, pasien_id })), tx);
            // Daftar pasien terdampak hanya bertambah (jejak insiden tidak dihapus).
            return true;
        });
    }
    // ---- Retensi dan pemusnahan ----
    /** Kebijakan retensi; bila belum ada, dibuat kebijakan rekam medis 25 tahun (PMK 24/2022 P39). */
    async kebijakan() {
        if ((await db.hitungKebijakanRetensiUntukKebijakan()) === 0) {
            await db.tambahKebijakanRetensiUntukKebijakan('Rekam medis elektronik', 25, 'PMK 24/2022 Pasal 39', 'Penghapusan aman pada sistem, cadangan, dan prosesor dengan berita acara');
        }
        return db.daftarKebijakanRetensiUntukKebijakan();
    }
    async daftarMusnah(halaman, ukuran) {
        const [total, baris] = await Promise.all([db.hitungPemusnahanUntukDaftarMusnah(), db.daftarPemusnahanUntukDaftarMusnah(ukuran, (halaman - 1) * ukuran)]);
        return { total, baris };
    }
    async musnah(id) {
        return db.cariPemusnahanUntukMusnah(id);
    }
    async hakAda(id) {
        return (await db.hitungPermintaanHakUntukHakAda(id)) > 0;
    }
    async buatMusnah(m, oleh) {
        return (await db.transaksi(async (koneksiBaru) => { const _hasil = await db.tambahPemusnahanUntukBuatMusnah(m.cakupan, m.dasar, m.permintaan_hak_id, m.pasien_id, new Date(`${m.jadwal}T00:00:00.000Z`), oleh, koneksiBaru); return db.tambahPemusnahanUntukBuatMusnahHasil(_hasil.id, koneksiBaru); })).id;
    }
    async majuMusnah(id, dari, ke, data) {
        const n = await db.ubahPemusnahanUntukMajuMusnah((data)?.cakupan, (data)?.dasar, (data)?.permintaan_hak_id, (data)?.pasien_id, (data)?.jadwal, ke, (data)?.prosesor_id, (data)?.nomor_perintah, (data)?.perintah_pada, (data)?.pelaksana, (data)?.metode, (data)?.mencakup_cadangan, (data)?.pelaksanaan_pada, (data)?.berita_acara, (data)?.berita_acara_pada, (data)?.dibuat_oleh, (data)?.dibuat_pada, id, dari);
        if (n.count !== 1)
            throw new GalatPdp('bentrok');
    }
    // ---- Prosesor ----
    async daftarProsesor(halaman, ukuran) {
        const [total, baris] = await Promise.all([db.hitungProsesorDataUntukDaftarProsesor(), db.daftarProsesorDataUntukDaftarProsesor(ukuran, (halaman - 1) * ukuran)]);
        return { total, baris };
    }
    async prosesor(id) {
        return db.cariProsesorDataUntukProsesor(id);
    }
    async prosesorAktif() {
        return db.daftarProsesorDataUntukProsesorAktif(true);
    }
    async namaProsesor(ids) {
        return new Map((await db.daftarProsesorDataUntukNamaProsesor(ids)).map((p) => [p.id, p.nama]));
    }
    async buatProsesor(m, oleh) {
        return (await db.transaksi(async (koneksiBaru) => { const _hasil = await db.tambahProsesorDataUntukBuatProsesor((dataProsesor(m))?.nama, (dataProsesor(m))?.layanan, (dataProsesor(m))?.lokasi_data, (dataProsesor(m))?.nomor_perjanjian, (dataProsesor(m))?.butir_perjanjian, (dataProsesor(m))?.sub_prosesor, (dataProsesor(m))?.sla_lapor_jam, (dataProsesor(m))?.aktif, oleh, koneksiBaru); return db.tambahProsesorDataUntukBuatProsesorHasil(_hasil.id, koneksiBaru); })).id;
    }
    async ubahProsesor(id, m) {
        return (await db.ubahProsesorDataUntukUbahProsesor((dataProsesor(m))?.nama, (dataProsesor(m))?.layanan, (dataProsesor(m))?.lokasi_data, (dataProsesor(m))?.nomor_perjanjian, (dataProsesor(m))?.butir_perjanjian, (dataProsesor(m))?.sub_prosesor, (dataProsesor(m))?.sla_lapor_jam, (dataProsesor(m))?.aktif, new Date(), id)).count === 1;
    }
}
const dataProsesor = (m) => ({
    nama: m.nama, layanan: m.layanan, lokasi_data: m.lokasi_data, nomor_perjanjian: m.nomor_perjanjian, butir_perjanjian: m.butir_perjanjian, sub_prosesor: m.sub_prosesor,
    sla_lapor_jam: m.sla_lapor_jam, aktif: m.aktif,
});
