import * as db from '@klira/db';
export class RepositoriPersetujuanMysql {
    async kunjungan(id) {
        return db.cariKunjunganUntukKunjungan(id);
    }
    async pasien(id) {
        return db.cariPasienUntukPasien3(id);
    }
    async teksAktif() {
        return (await db.cariTeksPersetujuanUntukTeksAktif('tindakan', true)) ?? null;
    }
    async teksUntukPakai(id) {
        return db.cariTeksPersetujuanUntukTeksUntukPakai(id, 'tindakan', true);
    }
    async wali(pasienId) {
        return db.daftarWaliKeluargaUntukWali(pasienId);
    }
    async saksiOpsi() {
        return db.daftarPenggunaUntukSaksiOpsi(true, 300);
    }
    async saksi(id) {
        return db.cariPenggunaUntukSaksi(id, true);
    }
    async catat(d) {
        const p = await db.transaksi(async (koneksiBaru) => { const _hasil = await db.tambahPersetujuanUntukCatat(d.pasienId, 'tindakan', d.teks.id, d.teks.versi, d.teks.tujuan, d.penjelasan, d.bentuk, 'diberikan', d.waktu, d.penandatangan, d.waliId, d.penandatanganNama, d.saksiId, d.kunjunganId, d.tindakanKode, d.tindakanNama, d.oleh, koneksiBaru); return db.tambahPersetujuanUntukDaftarkanHasil(_hasil.id, koneksiBaru); });
        return (await this.daftarDari([p]))[0];
    }
    async daftar(kunjunganId) {
        return this.daftarDari(await db.daftarPersetujuanUntukDaftar(kunjunganId, 'tindakan', 200));
    }
    async daftarDari(baris) {
        const ids = [...new Set(baris.flatMap((b) => [b.saksi_pengguna_id, b.dibuat_oleh].filter((x) => !!x)))];
        const pengguna = ids.length ? await db.daftarPenggunaUntukRiwayat(ids) : [];
        const nama = new Map(pengguna.map((x) => [x.id, x.nama]));
        return baris.map((b) => ({
            id: b.id, kunjungan_id: b.kunjungan_id, tindakan_kode: b.tindakan_kode, tindakan_nama: b.tindakan_nama, versi_teks: b.versi_teks, tujuan: b.tujuan, penjelasan: b.penjelasan,
            bentuk: b.bentuk, status: b.status, waktu: b.waktu.toISOString(), penandatangan: b.penandatangan, penandatangan_nama: b.penandatangan_nama,
            saksi_nama: b.saksi_pengguna_id ? nama.get(b.saksi_pengguna_id) ?? null : null, dicatat_oleh_nama: b.dibuat_oleh ? nama.get(b.dibuat_oleh) ?? null : null,
        }));
    }
}
