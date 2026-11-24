import * as db from '@klira/db';
const keDto = (f) => ({
    ...f, tanggal_akreditasi: f.tanggal_akreditasi ? f.tanggal_akreditasi.toISOString().slice(0, 10) : null,
});
export class RepositoriFasyankesMysql {
    async ambil(id) {
        const f = await db.ambilFasyankesUntukAmbil(id);
        return f ? keDto(f) : null;
    }
    async kodeDipakaiLain(id, kode) {
        return (await db.hitungFasyankesUntukKodeDipakaiLain(kode, id)) > 0;
    }
    async simpan(id, n, oleh, riwayat) {
        const f = await db.transaksi(async (tx) => {
            const baru = await (async () => { (await db.ubahFasyankesUntukSimpan(n.nama, n.jenis, n.bentuk_usaha, n.kode_registrasi, n.organization_id, n.status_akreditasi, n.tanggal_akreditasi ? new Date(n.tanggal_akreditasi) : null, n.puskesmas_wilayah, id, tx)); return db.ubahFasyankesUntukSimpanHasil(id, tx); })();
            if (riwayat.length) {
                await db.tambahBanyakRiwayatProfilUntukSimpan(riwayat.map((r) => ({ jenis: r.jenis, ringkasan: r.ringkasan.slice(0, 2000), dibuat_oleh: oleh })), tx);
            }
            return baru;
        });
        return keDto(f);
    }
    async riwayat(lewati, ambil) {
        const [total, data] = await Promise.all([
            db.hitungRiwayatProfilUntukRiwayat(),
            db.daftarRiwayatProfilUntukRiwayat(ambil, lewati),
        ]);
        const ids = [...new Set(data.map((r) => r.dibuat_oleh).filter((x) => x !== null))];
        const nama = new Map((await db.daftarPenggunaUntukRiwayat(ids)).map((p) => [p.id, p.nama]));
        return {
            total,
            baris: data.map((r) => ({ id: r.id, jenis: r.jenis, ringkasan: r.ringkasan, dibuat_oleh_nama: r.dibuat_oleh ? nama.get(r.dibuat_oleh) ?? null : null, dibuat_pada: r.dibuat_pada })),
        };
    }
}
