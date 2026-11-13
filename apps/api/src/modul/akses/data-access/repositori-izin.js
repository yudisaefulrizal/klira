import * as db from '@klira/db';
export class KonflikNama extends Error {
}
const petaJenis = (j) => ({
    id: j.id, fasyankes_id: j.fasyankes_id, nama: j.nama, syarat_profesi: j.syarat_profesi, aktif: j.aktif,
    diubah_oleh: j.diubah_oleh, alasan_perubahan: j.alasan_perubahan, dibuat_pada: j.dibuat_pada,
    izin: j.izin.map((x) => ({ id: x.izin.id, fitur: x.izin.fitur, aksi: x.izin.aksi, cakupan: x.izin.cakupan })),
});
export class RepositoriIzinMysql {
    async penggunaAda(penggunaId, fasyankesId) {
        return (await db.hitungPenggunaUntukPenggunaAda(penggunaId, fasyankesId)) > 0;
    }
    async ambilSnapshot(penggunaId) {
        const p = await db.ambilPenggunaUntukAmbilSnapshot(penggunaId);
        if (!p)
            return null;
        return {
            pengguna_id: p.id,
            aktif: p.aktif,
            profil: p.profil_profesi,
            penugasan: p.penugasan_jenis.map((x) => ({
                id: x.id, jenis_akun_id: x.jenis_akun_id, jenis_nama: x.jenis_akun.nama, syarat_profesi: x.jenis_akun.syarat_profesi,
                jenis_aktif: x.jenis_akun.aktif, mulai: x.mulai, selesai: x.selesai,
                izin: x.jenis_akun.izin.map((i) => ({ fitur: i.izin.fitur, aksi: i.izin.aksi, cakupan: i.izin.cakupan })),
            })),
            izin_akun: p.izin_per_akun.map((x) => ({
                id: x.id, tipe: x.tipe, mulai: x.mulai, selesai: x.selesai,
                izin: { fitur: x.izin.fitur, aksi: x.izin.aksi, cakupan: x.izin.cakupan },
            })),
        };
    }
    daftarIzin() {
        return db.daftarIzinUntukDaftarIzin();
    }
    izinByIds(ids) {
        return db.daftarIzinUntukIzinByIds(ids);
    }
    cariIzin(fitur, aksi, cakupan) {
        return db.cariIzinUntukCariIzin(fitur, aksi, cakupan);
    }
    /** `jumlah_pemakai` = akun berbeda dengan penugasan jenis ini yang sedang berjalan (mulai sudah lewat, belum selesai). */
    async daftarJenisAkun(fasyankesId, sekarang = new Date()) {
        const [j, pemakai] = await Promise.all([
            db.daftarJenisAkunUntukDaftarJenisAkun(fasyankesId),
            db.daftarPenugasanJenisUntukDaftarJenisAkun(fasyankesId, sekarang, null, sekarang),
        ]);
        const hitung = new Map();
        for (const x of pemakai)
            hitung.set(x.jenis_akun_id, (hitung.get(x.jenis_akun_id) ?? 0) + 1);
        return j.map((x) => ({ ...petaJenis(x), jumlah_pemakai: hitung.get(x.id) ?? 0 }));
    }
    async ambilJenisAkun(fasyankesId, id) {
        const j = await db.cariJenisAkunUntukAmbilJenisAkun(id, fasyankesId);
        return j ? petaJenis(j) : null;
    }
    async buatJenisAkun(d) {
        try {
            const id = await db.transaksi(async (tx) => {
                const j = await (async () => { const _hasil = await db.tambahJenisAkunUntukBuatJenisAkun(d.fasyankes_id, d.nama, d.syarat_profesi, d.oleh, d.alasan, tx); return db.tambahJenisAkunUntukBuatJenisAkunHasil(_hasil.id, tx); })();
                await db.tambahBanyakIzinJenisAkunUntukBuatJenisAkun(d.izin_ids.map((izin_id) => ({ fasyankes_id: d.fasyankes_id, jenis_akun_id: j.id, izin_id, dibuat_oleh: d.oleh })), tx);
                await db.tambahRiwayatJenisAkunUntukBuatJenisAkun(d.fasyankes_id, j.id, d.ringkasan, d.alasan, d.oleh, tx);
                return j.id;
            });
            return (await this.ambilJenisAkun(d.fasyankes_id, id));
        }
        catch (galat) {
            if (db.bentrokUnik(galat))
                throw new KonflikNama();
            throw galat;
        }
    }
    async ubahJenisAkun(d) {
        try {
            await db.transaksi(async (tx) => {
                await db.ubahJenisAkunUntukUbahJenisAkun((d.nama !== undefined) ? (d.nama) : (undefined), (d.syarat_profesi !== undefined) ? (d.syarat_profesi) : (undefined), (d.aktif !== undefined) ? (d.aktif) : (undefined), d.oleh, d.alasan, d.id, tx);
                if (d.izin_ids) {
                    // Isi paket diganti; jejak perubahan tersimpan di riwayat_jenis_akun.
                    await db.hapusIzinJenisAkunUntukUbahJenisAkun(d.id, d.izin_ids, tx);
                    await db.tambahBanyakIzinJenisAkunUntukUbahJenisAkun(d.izin_ids.map((izin_id) => ({ fasyankes_id: d.fasyankes_id, jenis_akun_id: d.id, izin_id, dibuat_oleh: d.oleh })), tx);
                }
                await db.tambahRiwayatJenisAkunUntukBuatJenisAkun(d.fasyankes_id, d.id, d.ringkasan, d.alasan, d.oleh, tx);
            });
        }
        catch (galat) {
            if (db.bentrokUnik(galat))
                throw new KonflikNama();
            throw galat;
        }
        return (await this.ambilJenisAkun(d.fasyankes_id, d.id));
    }
    riwayatJenisAkun(fasyankesId, id) {
        return db.daftarRiwayatJenisAkunUntukRiwayatJenisAkun(fasyankesId, id);
    }
    daftarPenugasan(penggunaId) {
        return db.daftarPenugasanJenisUntukDaftarPenugasan(penggunaId);
    }
    ambilPenugasan(penggunaId, id) {
        return db.cariPenugasanJenisUntukAmbilPenugasan(id, penggunaId);
    }
    buatPenugasan(d) {
        return db.transaksi(async (koneksiBaru) => { const _hasil = await db.tambahPenugasanJenisUntukBuatPenugasan((d)?.fasyankes_id, (d)?.pengguna_id, (d)?.jenis_akun_id, (d)?.mulai, (d)?.selesai, (d)?.ditetapkan_oleh, d.ditetapkan_oleh, koneksiBaru); return db.tambahPenugasanJenisUntukBuatPenugasanHasil(_hasil.id, koneksiBaru); });
    }
    akhiriPenugasan(id, selesai) {
        return db.transaksi(async (koneksiBaru) => { (await db.ubahPenugasanJenisUntukAkhiriPenugasan(selesai, id, koneksiBaru)); return db.tambahPenugasanJenisUntukBuatPenugasanHasil(id, koneksiBaru); });
    }
    daftarIzinAkun(penggunaId) {
        return db.daftarIzinPerAkunUntukDaftarIzinAkun(penggunaId);
    }
    ambilIzinAkun(penggunaId, id) {
        return db.cariIzinPerAkunUntukAmbilIzinAkun(id, penggunaId);
    }
    buatIzinAkun(d) {
        return db.transaksi(async (koneksiBaru) => { const _hasil = await db.tambahIzinPerAkunUntukBuatIzinAkun((d)?.fasyankes_id, (d)?.pengguna_id, (d)?.izin_id, (d)?.tipe, (d)?.alasan, (d)?.mulai, (d)?.selesai, (d)?.ditetapkan_oleh, d.ditetapkan_oleh, koneksiBaru); return db.tambahIzinPerAkunUntukBuatIzinAkunHasil(_hasil.id, koneksiBaru); });
    }
    akhiriIzinAkun(id, selesai) {
        return db.transaksi(async (koneksiBaru) => { (await db.ubahIzinPerAkunUntukAkhiriIzinAkun(selesai, id, koneksiBaru)); return db.tambahIzinPerAkunUntukBuatIzinAkunHasil(id, koneksiBaru); });
    }
    async simpanPeringatan(entri) {
        const hasil = [];
        for (const e of entri) {
            hasil.push(await db.transaksi(async (koneksiBaru) => { const _hasil = await db.tambahPeringatanIzinUntukSimpanPeringatan((e)?.fasyankes_id, (e)?.pengguna_id, (e)?.izin_id, (e)?.penugasan_id, (e)?.jenis_peringatan, (e)?.alasan_pimpinan, (e)?.sumber, (e)?.diterima_untuk_akun, (e)?.keterangan, (e)?.ditetapkan_oleh, e.ditetapkan_oleh, koneksiBaru); return db.tambahPeringatanIzinUntukSimpanPeringatanHasil(_hasil.id, koneksiBaru); }));
        }
        return hasil;
    }
    async daftarPeringatan(fasyankesId, f) {
        const [baris, total] = await Promise.all([
            db.daftarPeringatanIzinUntukDaftarPeringatan(fasyankesId, (f.pengguna_id) ? (f.pengguna_id) : undefined, (f.jenis_peringatan) ? (f.jenis_peringatan) : undefined, f.cari, f.cari, ((f.dari || f.sampai) && (f.dari)) ? (f.dari) : undefined, ((f.dari || f.sampai) && (f.sampai)) ? (f.sampai) : undefined, f.ukuran, (f.halaman - 1) * f.ukuran),
            db.hitungPeringatanIzinUntukDaftarPeringatan(fasyankesId, (f.pengguna_id) ? (f.pengguna_id) : undefined, (f.jenis_peringatan) ? (f.jenis_peringatan) : undefined, f.cari, f.cari, ((f.dari || f.sampai) && (f.dari)) ? (f.dari) : undefined, ((f.dari || f.sampai) && (f.sampai)) ? (f.sampai) : undefined),
        ]);
        const ids = [...new Set(baris.flatMap((b) => [b.pengguna_id, ...(b.ditetapkan_oleh ? [b.ditetapkan_oleh] : [])]))];
        const nama = new Map((ids.length ? await db.daftarPenggunaUntukNamaPengguna(ids) : []).map((x) => [x.id, x.nama]));
        const data = baris.map((b) => ({
            ...b, pengguna_nama: nama.get(b.pengguna_id) ?? null, ditetapkan_oleh_nama: b.ditetapkan_oleh ? (nama.get(b.ditetapkan_oleh) ?? null) : null,
        }));
        return { data, total };
    }
    cariDiterima(penggunaId, jenis) {
        return db.cariPeringatanIzinUntukCariDiterima(penggunaId, jenis, true);
    }
    async alasanTerakhir(penggunaId, jenis) {
        const r = await db.cariPeringatanIzinUntukAlasanTerakhir(penggunaId, jenis, 'tindakan');
        return r?.alasan_pimpinan ?? null;
    }
    async adaTindakanSejak(penggunaId, kunci, sejak) {
        return ((await db.hitungPeringatanIzinUntukAdaTindakanSejak(penggunaId, 'tindakan', kunci, sejak)) > 0);
    }
}
