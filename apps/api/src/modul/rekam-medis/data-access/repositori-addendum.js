import * as db from '@klira/db';
import { hashIsi } from '../domain/pengesahan.js';
import { tulisPengesahanDalam } from './repositori.js';
/**
 * Tulis satu addendum di dalam transaksi pemanggil (hasil lab susulan; CPPT dan resume nanti memakai jalur yang sama). Hanya INSERT:
 * baris addendum (versi per entitas), versi catatan kunjungan (penanda kronologis, `isi_lama` hanya menunjuk addendum karena tidak ada isi yang
 * digantikan), dan pengesahan baru atas isi addendum (entitas `addendum`). Balapan versi muncul sebagai ER_DUP_ENTRY dari pemanggil.
 */
export async function tulisAddendumDalam(tx, d) {
    const terakhir = await db.ringkasanAddendumUntukTulisAddendumDalam(d.entitas, d.entitasId, tx);
    const versi = (terakhir._max.versi ?? 0) + 1;
    const a = await (async () => { const _hasil = await db.tambahAddendumUntukTulisAddendumDalam(d.fasyankesId, d.kunjunganId, d.entitas, d.entitasId, versi, d.isi, d.alasan, d.waktu, d.oleh, tx); return db.tambahAddendumUntukTulisAddendumDalamHasil(_hasil.id, tx); })();
    const versiKunjungan = await db.ringkasanVersiCatatanUntukTulisAddendumDalam('kunjungan', d.kunjunganId, tx);
    await db.tambahVersiCatatanUntukTulisPengesahanDalam(d.fasyankesId, 'kunjungan', d.kunjunganId, (versiKunjungan._max.versi ?? 0) + 1, { jenis: 'addendum', addendum_id: a.id, entitas: d.entitas, entitas_id: d.entitasId }, d.alasan, null, d.oleh, tx);
    await tulisPengesahanDalam(tx, {
        fasyankesId: d.fasyankesId, entitas: 'addendum', entitasId: a.id, versi: 1, penggunaId: d.oleh, jenisAkun: d.jenisAkun, hash: hashIsi(d.isi), waktu: d.waktu, versiLama: null,
    });
    return { id: a.id, versi };
}
export class RepositoriAddendumMysql {
    async petakan(fasyankesId, baris) {
        const ids = [...new Set(baris.flatMap((b) => (b.dibuat_oleh ? [b.dibuat_oleh] : [])))];
        const pengguna = ids.length ? await db.daftarPenggunaUntukRiwayat(ids, fasyankesId) : [];
        const nama = new Map(pengguna.map((p) => [p.id, p.nama]));
        return baris.map((b) => ({
            id: b.id, kunjungan_id: b.kunjungan_id, entitas: b.entitas, entitas_id: b.entitas_id, versi: b.versi, isi: (b.isi ?? {}), alasan: b.alasan, waktu: b.waktu,
            dibuat_oleh_nama: b.dibuat_oleh ? nama.get(b.dibuat_oleh) ?? null : null, perlu_kirim_ulang: b.perlu_kirim_ulang, dikirim_pada: b.dikirim_pada,
        }));
    }
    async kunjunganAda(fasyankesId, kunjunganId) {
        return (await db.hitungKunjunganUntukKunjunganAda(kunjunganId, fasyankesId)) > 0;
    }
    async daftar(fasyankesId, kunjunganId) {
        return this.petakan(fasyankesId, await db.daftarAddendumUntukDaftar(fasyankesId, kunjunganId, 200));
    }
    async untukEntitas(fasyankesId, entitas, entitasIds) {
        if (!entitasIds.length)
            return [];
        return this.petakan(fasyankesId, await db.daftarAddendumUntukUntukEntitas(fasyankesId, entitas, [...entitasIds]));
    }
    async isi(fasyankesId, id) {
        return (await db.cariAddendumUntukIsi(id, fasyankesId))?.isi ?? null;
    }
}
