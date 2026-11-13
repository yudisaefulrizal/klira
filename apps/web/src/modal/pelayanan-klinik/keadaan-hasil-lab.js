import { INTERPRETASI_HASIL, PENUNJANG, sarankanInterpretasi } from '@klira/shared';
/** Order yang menunggu hasil: spesimen sudah diambil, belum divalidasi. */
export const menungguHasil = (orders) => orders.filter((o) => o.status === 'spesimen_diambil' || o.status === 'menunggu_hasil');
/** Isian awal; hasil yang sudah tersimpan (menunggu validasi) diisikan kembali. */
export function awalHasilLab(orders) {
    const k = { nilai: {}, interpretasi: {}, catatan: {}, validasi: true };
    for (const o of menungguHasil(orders)) {
        k.nilai[o.id] = o.hasil?.nilai ?? '';
        k.interpretasi[o.id] = o.hasil?.interpretasi ?? '';
        k.catatan[o.id] = o.hasil?.catatan ?? '';
    }
    return k;
}
export const ubahIsian = (k, bidang, id, v) => ({ ...k, [bidang]: { ...k[bidang], [id]: v } });
/** Interpretasi yang disarankan dari rentang rujukan; kosong bila tidak dapat ditentukan. */
export const saranUntuk = (o, nilai) => sarankanInterpretasi(nilai, o.rujukan_min, o.rujukan_maks);
/** Mengisi interpretasi yang masih kosong dengan saran rentang rujukan (pilihan analis yang sudah ada tidak ditimpa). */
export function terapkanSaran(k, orders) {
    const interpretasi = { ...k.interpretasi };
    for (const o of menungguHasil(orders)) {
        const nilai = (k.nilai[o.id] ?? '').trim();
        if (nilai && !interpretasi[o.id])
            interpretasi[o.id] = saranUntuk(o, nilai) ?? '';
    }
    return { ...k, interpretasi };
}
/** Order yang nilainya terisi dan interpretasinya sah; hanya ini yang diproses saat menyimpan. */
export function rencanaHasil(k, orders) {
    return menungguHasil(orders).flatMap((order) => {
        const nilai = (k.nilai[order.id] ?? '').trim();
        const i = k.interpretasi[order.id] ?? '';
        if (!nilai || !INTERPRETASI_HASIL.nilai.includes(i))
            return [];
        return [{ order, nilai, interpretasi: i, catatan: (k.catatan[order.id] ?? '').trim() || null }];
    });
}
/** Galat per order (kunci id): nilai terisi tetapi interpretasi belum dipilih. Order tanpa nilai tidak diproses sehingga bukan galat. */
export function galatHasilLab(k, orders) {
    const g = {};
    for (const o of menungguHasil(orders)) {
        const nilai = (k.nilai[o.id] ?? '').trim();
        const i = k.interpretasi[o.id] ?? '';
        if (nilai.length > 200)
            g[o.id] = PENUNJANG.galat.nilaiWajib;
        else if (nilai && !INTERPRETASI_HASIL.nilai.includes(i))
            g[o.id] = PENUNJANG.galat.pilihInterpretasi;
    }
    return g;
}
/** Indeks langkah (0 hasil, 1 interpretasi, 2 validasi) yang butuh perbaikan, atau -1. */
export function langkahBermasalahHasil(k, orders) {
    if (!menungguHasil(orders).some((o) => (k.nilai[o.id] ?? '').trim()))
        return 0;
    return Object.keys(galatHasilLab(k, orders)).length ? 1 : -1;
}
/** Draf tersimpan menimpa isian awal hanya untuk order yang masih menunggu hasil (order lain yang sudah berubah dibuang). */
export function pulihkanHasilLab(awal, draf) {
    if (!draf)
        return awal;
    const ambil = (bidang) => Object.fromEntries(Object.keys(awal[bidang]).map((id) => [id, typeof draf[bidang]?.[id] === 'string' ? draf[bidang][id] : awal[bidang][id]]));
    return { nilai: ambil('nilai'), interpretasi: ambil('interpretasi'), catatan: ambil('catatan'), validasi: typeof draf.validasi === 'boolean' ? draf.validasi : awal.validasi };
}
