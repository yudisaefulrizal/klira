import * as db from '@klira/db';
import { hargaTarif } from '@klira/shared';
/** Status tagihan: lengkap bila semua item berharga (terpisah dari status pembayaran, 4.5). */
export const statusTagihanDari = (harga) => (harga.every((h) => h !== null) ? 'lengkap' : 'belum_lengkap');
/**
 * Tambah item ke tagihan kunjungan di dalam transaksi pemanggil (order lab, nanti tindakan dan obat); tagihan dibuat bila belum ada
 * dan status tagihan dihitung ulang. Mengembalikan id tagihan.
 */
export async function tambahItemTagihanDalam(tx, fasyankesId, kunjunganId, oleh, item) {
    const tagihan = await (async () => { (await db.simpanTagihanUntukTambahItemTagihanDalam(fasyankesId, kunjunganId, oleh, tx)); return db.simpanTagihanUntukTambahItemTagihanDalamHasil(kunjunganId, tx); })();
    for (const i of item) {
        await db.tambahItemTagihanUntukTambahItemTagihanDalam(fasyankesId, tagihan.id, i.jenis, i.tarifId, i.kode, i.nama, i.jumlah ?? 1, i.harga, i.orderPenunjangId, i.itemResepId ?? null, oleh, tx);
    }
    const semua = await db.daftarItemTagihanUntukTambahItemTagihanDalam(tagihan.id, tx);
    await db.ubahTagihanUntukTambahItemTagihanDalam(statusTagihanDari(semua.map((x) => x.harga)), tagihan.id, tx);
    return tagihan.id;
}
export const keItemDto = (i) => ({
    id: i.id, jenis: i.jenis, kode: i.kode, nama: i.nama, jumlah: i.jumlah, harga: i.harga, order_penunjang_id: i.order_penunjang_id, manual: i.manual ?? false,
    tindakan_sumber: i.tindakan_sumber ?? false, harga_acuan: i.harga_acuan ?? null, alasan_ubah_harga: i.alasan_ubah_harga ?? null,
});
const kunciItem = (i) => `${i.tarif_layanan_id ?? ''}|${i.kode}`;
/**
 * Rencana item tagihan tindakan dari daftar tindakan terbaru (fungsi murni). Bertarif: kode dan nama tarif, harga sesuai cara bayar
 * (JKN pakai harga JKN bila ada, selain itu harga umum; null bila tanpa harga). Dari kamus: kode dan nama ICD-9-CM, harga null.
 * Harga yang sudah diubah kasir (beralasan) atau dilengkapi kasir (tarif tanpa harga) pada item yang sama dipertahankan.
 */
export function rencanaItemTindakan(item, tarif, cara, lama) {
    const peta = new Map(lama.map((l) => [kunciItem(l), l]));
    return item.map((t) => {
        const tr = t.tarif_layanan_id ? tarif.get(t.tarif_layanan_id) : undefined;
        const dasar = tr
            ? { tarif_layanan_id: tr.id, kode: tr.kode, nama: tr.nama, harga: hargaTarif(tr, cara) }
            : { tarif_layanan_id: null, kode: t.kode, nama: t.nama, harga: null };
        const l = peta.get(kunciItem(dasar));
        const jumlah = t.jumlah ?? 1;
        if (l?.alasan_ubah_harga)
            return { ...dasar, jumlah, harga: l.harga, harga_acuan: l.harga_acuan, alasan_ubah_harga: l.alasan_ubah_harga };
        if (dasar.harga === null && l && l.harga !== null)
            return { ...dasar, jumlah, harga: l.harga, harga_acuan: l.harga_acuan, alasan_ubah_harga: null };
        return { ...dasar, jumlah, harga_acuan: dasar.harga, alasan_ubah_harga: null };
    });
}
const samaRencana = (a, b) => a.length === b.length && a.every((x, i) => kunciItem(x) === kunciItem(b[i]) && x.nama === b[i].nama && x.jumlah === b[i].jumlah && x.harga === b[i].harga);
/**
 * Sinkronkan item tagihan tindakan dari pencatatan dengan daftar tindakan terbaru (dalam transaksi pemanggil, kunci baris tagihan).
 * Item manual kasir dan item lain tidak tersentuh. `terkunci` bila perlu berubah tetapi tagihan sudah ada pembayaran atau kunjungan ditutup.
 */
export async function sinkronItemTindakanDalam(tx, fasyankesId, kunjunganId, oleh, item) {
    const kunci = await db.kunciTagihanKunjungan(kunjunganId, fasyankesId, tx);
    const k = await db.cariKunjunganUntukSinkronItemTindakanDalam(kunjunganId, fasyankesId, tx);
    if (!k)
        return 'tidak_perlu';
    const tagihanId = kunci[0]?.id ?? null;
    const lama = tagihanId === null ? [] : await db.daftarItemTagihanUntukSinkronItemTindakanDalam(tagihanId, true, tx);
    const ids = [...new Set(item.flatMap((t) => (t.tarif_layanan_id ? [t.tarif_layanan_id] : [])))];
    const tarif = ids.length ? await db.daftarTarifLayananUntukSinkronItemTindakanDalam(ids, fasyankesId, 'tindakan', tx) : [];
    const rencana = rencanaItemTindakan(item, new Map(tarif.map((t) => [t.id, t])), k.cara_pembayaran, lama);
    if (samaRencana(rencana, lama))
        return 'tidak_perlu';
    if (k.tahap_layanan === 'ditutup')
        return 'terkunci';
    if (tagihanId !== null && (await db.hitungPembayaranUntukSinkronItemTindakanDalam(tagihanId, tx)))
        return 'terkunci';
    const id = tagihanId ?? (await (async () => { const _hasil = await db.tambahTagihanUntukSinkronItemTindakanDalam(fasyankesId, kunjunganId, oleh, tx); return db.tambahTagihanUntukSinkronItemTindakanDalamHasil(_hasil.id, tx); })()).id;
    await db.hapusItemTagihanUntukSinkronItemTindakanDalam(id, true, tx);
    if (rencana.length) {
        await db.tambahBanyakItemTagihanUntukSinkronItemTindakanDalam(rencana.map((r) => ({
            fasyankes_id: fasyankesId, tagihan_id: id, jenis: 'tindakan', tarif_layanan_id: r.tarif_layanan_id, kode: r.kode.slice(0, 50), nama: r.nama.slice(0, 200), jumlah: r.jumlah,
            harga: r.harga, harga_acuan: r.harga_acuan, alasan_ubah_harga: r.alasan_ubah_harga, tindakan_sumber: true, dibuat_oleh: oleh,
        })), tx);
    }
    const semua = await db.daftarItemTagihanUntukTambahItemTagihanDalam(id, tx);
    await db.ubahTagihanUntukTambahItemTagihanDalam(statusTagihanDari(semua.map((x) => x.harga)), id, tx);
    return 'disinkron';
}
/**
 * Ganti item tagihan obat milik satu resep (dalam transaksi pemanggil): item tagihan yang tertaut item resep lama dihapus lalu dibuat ulang
 * dari item baru (jenis obat, harga master obat, tertaut `item_resep_id`). Status tagihan dihitung ulang. Item lain tidak tersentuh.
 */
export async function gantiItemObatResepDalam(tx, fasyankesId, kunjunganId, oleh, itemResepLama, baru) {
    if (itemResepLama.length)
        await db.hapusItemTagihanUntukGantiItemObatResepDalam(fasyankesId, [...itemResepLama], tx);
    if (baru.length) {
        await tambahItemTagihanDalam(tx, fasyankesId, kunjunganId, oleh, baru.map((i) => ({
            jenis: 'obat', tarifId: null, kode: `OBAT-${i.master_obat_id}`, nama: i.nama.slice(0, 200), harga: i.harga, orderPenunjangId: null, jumlah: i.jumlah, itemResepId: i.itemResepId,
        })));
        return;
    }
    const t = await db.cariTagihanUntukGantiItemObatResepDalam(kunjunganId, fasyankesId, tx);
    if (!t)
        return;
    const semua = await db.daftarItemTagihanUntukTambahItemTagihanDalam(t.id, tx);
    await db.ubahTagihanUntukTambahItemTagihanDalam(statusTagihanDari(semua.map((x) => x.harga)), t.id, tx);
}
export const totalTagihan = (item) => item.reduce((s, i) => s + (i.harga ?? 0) * i.jumlah, 0);
export class RepositoriTagihanMysql {
    async kunjunganAda(fasyankesId, kunjunganId) {
        return (await db.hitungKunjunganUntukKunjunganAda(kunjunganId, fasyankesId)) > 0;
    }
    async ambil(fasyankesId, kunjunganId) {
        const t = await db.cariTagihanUntukAmbil(kunjunganId, fasyankesId);
        if (!t)
            return null;
        return {
            id: t.id, kunjungan_id: t.kunjungan_id, status_tagihan: t.status_tagihan, status_pembayaran: t.status_pembayaran, total: totalTagihan(t.item), item: t.item.map(keItemDto),
        };
    }
}
