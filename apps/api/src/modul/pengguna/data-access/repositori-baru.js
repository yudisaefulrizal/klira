import * as db from '@klira/db';
/** Username atau NIK bentrok saat menyimpan (balapan setelah pemeriksaan awal). */
export class KonflikAkun extends Error {
    bidang;
    constructor(bidang = 'username') {
        super(`konflik ${bidang}`);
        this.bidang = bidang;
    }
}
/** Nama indeks pada galat ER_DUP_ENTRY membedakan konflik NIK dan username. */
export function bidangKonflik(galat) {
    const indeks = /for key ['`]([^'`]+)['`]/i.exec(db.pesanGalat(galat))?.[1] ?? '';
    return indeks.toLowerCase().split(/[^a-z0-9]+/).includes('nik') ? 'nik' : 'username';
}
export class RepositoriAkunBaruMysql {
    async cekDuplikat(username, nik, fasyankesId) {
        const [u, n] = await Promise.all([
            db.hitungPenggunaUntukCekDuplikat(username),
            db.hitungPenggunaUntukCekDuplikat2(fasyankesId, nik),
        ]);
        return { username: u > 0, nik: n > 0 };
    }
    async buatAkun(d) {
        try {
            return await db.transaksi(async (tx) => {
                const p = await (async () => { const _hasil = await db.tambahPenggunaUntukBuatAkun(d.fasyankes_id, d.nama, d.nik, d.username, d.kata_sandi_hash, true, d.oleh, tx); return db.tambahPenggunaUntukBuatAkunHasil(_hasil.id, tx); })();
                const profil = d.profil
                    ? await (async () => { const _hasil = await db.tambahProfilProfesiUntukBuat(d.fasyankes_id, p.id, (d.profil)?.profesi, (d.profil)?.nomor_sip, (d.profil)?.masa_berlaku_sip, (d.profil)?.ihs_practitioner_id, d.oleh, tx); return db.tambahProfilProfesiUntukBuatAkunHasil(_hasil.id, tx); })()
                    : null;
                const penugasanIds = new Map();
                const ids = [];
                for (const x of d.penugasan) {
                    const r = await (async () => { const _hasil = await db.tambahPenugasanJenisUntukBuatAkun(d.fasyankes_id, p.id, x.jenis_akun_id, x.mulai, x.selesai, d.oleh, tx); return db.tambahPenugasanJenisUntukBuatAkunHasil(_hasil.id, tx); })();
                    ids.push(r.id);
                    if (!penugasanIds.has(x.jenis_akun_id))
                        penugasanIds.set(x.jenis_akun_id, r.id);
                }
                const izinIds = [];
                for (const x of d.izin_akun) {
                    const r = await (async () => { const _hasil = await db.tambahIzinPerAkunUntukBuatAkun(d.fasyankes_id, p.id, (x)?.izin_id, (x)?.tipe, (x)?.alasan, (x)?.mulai, (x)?.selesai, d.oleh, tx); return db.tambahIzinPerAkunUntukBuatAkunHasil(_hasil.id, tx); })();
                    izinIds.push(r.id);
                }
                const peringatan = [];
                for (const w of d.peringatan) {
                    const r = await (async () => { const _hasil = await db.tambahPeringatanIzinUntukBuatAkun(d.fasyankes_id, p.id, w.izin_id, w.jenis_akun_id ? (penugasanIds.get(w.jenis_akun_id) ?? null) : null, w.jenis_peringatan, w.alasan_pimpinan, 'pemberian', w.diterima_untuk_akun, w.keterangan, d.oleh, tx); return db.tambahPeringatanIzinUntukBuatAkunHasil(_hasil.id, tx); })();
                    peringatan.push({ id: r.id, jenis_peringatan: r.jenis_peringatan, alasan_pimpinan: r.alasan_pimpinan });
                }
                return { id: p.id, profil_id: profil?.id ?? null, penugasan_ids: ids, izin_akun_ids: izinIds, peringatan };
            });
        }
        catch (galat) {
            if (db.bentrokUnik(galat))
                throw new KonflikAkun(bidangKonflik(galat));
            throw galat;
        }
    }
}
