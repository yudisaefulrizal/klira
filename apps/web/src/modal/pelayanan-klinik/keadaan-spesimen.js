import { PENUNJANG } from '@klira/shared';
import { dariInputLokal, keInputLokal } from './keadaan-pemeriksaan.js';
/** Order yang masih menunggu spesimen. */
export const menungguSpesimen = (orders) => orders.filter((o) => o.status === 'dipesan');
export function awalSpesimen(orders, sekarang = new Date()) {
    const menunggu = menungguSpesimen(orders);
    return { terpilih: menunggu.map((o) => o.id), asal: menunggu[0]?.jenis_spesimen ?? '', waktu: keInputLokal(sekarang.toISOString()), petugas: '' };
}
/** Memilih order mengisi asal dari jenis spesimen pemeriksaan pertama bila asal masih kosong. */
export function gantiOrderSpesimen(k, orders, id) {
    const terpilih = k.terpilih.includes(id) ? k.terpilih.filter((x) => x !== id) : [...k.terpilih, id];
    const asal = k.asal.trim() ? k.asal : (orders.find((o) => o.id === terpilih[0])?.jenis_spesimen ?? '');
    return { ...k, terpilih, asal };
}
export function galatSpesimen(k) {
    const g = {};
    if (!k.terpilih.length)
        g.terpilih = PENUNJANG.galat.pilihOrder;
    if (!k.asal.trim())
        g.asal = PENUNJANG.galat.asalWajib;
    if (!dariInputLokal(k.waktu))
        g.waktu = PENUNJANG.galat.waktuWajib;
    else if (new Date(dariInputLokal(k.waktu)).getTime() > Date.now() + 5 * 60_000)
        g.waktu = PENUNJANG.galat.waktuMasaDepan;
    return g;
}
export const bentukSpesimen = (k) => ({
    asal: k.asal.trim(), waktu_ambil: dariInputLokal(k.waktu), ...(k.petugas ? { petugas_id: Number(k.petugas) } : {}),
});
