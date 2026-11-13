import * as db from '@klira/db';
export class RepositoriPersetujuanMysql {
    async kunjungan(fasyankesId, id) {
        return db.cariKunjunganUntukKunjungan(id, fasyankesId);
    }
    async pasien(fasyankesId, id) {
        return db.cariPasienUntukPasien3(id, fasyankesId);
    }
    async teksAktif(fasyankesId) {
        // Teks klinik sendiri didahulukan, lalu teks bawaan; yang aktif dengan versi tertinggi.
        for (const fas of [fasyankesId, null]) {
            const t = await db.cariTeksPersetujuanUntukTeksAktif(fas, 'tindakan', true);
            if (t)
                return t;
        }
        return null;
    }
    async teksUntukPakai(fasyankesId, id) {
        return db.cariTeksPersetujuanUntukTeksUntukPakai(id, 'tindakan', true, fasyankesId, null);
    }
    async wali(fasyankesId, pasienId) {
        return db.daftarWaliKeluargaUntukWali(fasyankesId, pasienId);
    }
    async saksiOpsi(fasyankesId) {
        return db.daftarPenggunaUntukSaksiOpsi(fasyankesId, true, 300);
    }
    async saksi(fasyankesId, id) {
        return db.cariPenggunaUntukSaksi(id, fasyankesId, true);
    }
    async catat(d) {
        const p = await db.transaksi(async (koneksiBaru) => { const _hasil = await db.tambahPersetujuanUntukCatat(d.fasyankesId, d.pasienId, 'tindakan', d.teks.id, d.teks.versi, d.teks.tujuan, d.penjelasan, d.bentuk, 'diberikan', d.waktu, d.penandatangan, d.waliId, d.penandatanganNama, d.saksiId, d.kunjunganId, d.tindakanKode, d.tindakanNama, d.oleh, koneksiBaru); return db.tambahPersetujuanUntukDaftarkanHasil(_hasil.id, koneksiBaru); });
        return (await this.daftarDari(d.fasyankesId, [p]))[0];
    }
    async daftar(fasyankesId, kunjunganId) {
        return this.daftarDari(fasyankesId, await db.daftarPersetujuanUntukDaftar(fasyankesId, kunjunganId, 'tindakan', 200));
    }
    async daftarDari(fasyankesId, baris) {
        const ids = [...new Set(baris.flatMap((b) => [b.saksi_pengguna_id, b.dibuat_oleh].filter((x) => !!x)))];
        const pengguna = ids.length ? await db.daftarPenggunaUntukRiwayat(ids, fasyankesId) : [];
        const nama = new Map(pengguna.map((x) => [x.id, x.nama]));
        return baris.map((b) => ({
            id: b.id, kunjungan_id: b.kunjungan_id, tindakan_kode: b.tindakan_kode, tindakan_nama: b.tindakan_nama, versi_teks: b.versi_teks, tujuan: b.tujuan, penjelasan: b.penjelasan,
            bentuk: b.bentuk, status: b.status, waktu: b.waktu.toISOString(), penandatangan: b.penandatangan, penandatangan_nama: b.penandatangan_nama,
            saksi_nama: b.saksi_pengguna_id ? nama.get(b.saksi_pengguna_id) ?? null : null, dicatat_oleh_nama: b.dibuat_oleh ? nama.get(b.dibuat_oleh) ?? null : null,
        }));
    }
}
