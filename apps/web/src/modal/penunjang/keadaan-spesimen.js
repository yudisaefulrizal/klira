import { PENUNJANG } from '@klira/shared';
import { dariInputLokal, keInputLokal } from '../pemeriksaan/keadaan-pemeriksaan.js';
/** Order yang masih menunggu spesimen. */
export const menungguSpesimen = (orders) => orders.filter((o) => o.status === 'dipesan');
/** Asal bersama: jenis spesimen yang sama untuk semua order terpilih; kosong bila berbeda atau ada yang belum punya jenis. */
export function asalBersama(orders) {
    const jenis = orders.map((o) => (o.jenis_spesimen ?? '').trim());
    return jenis.length && jenis.every((j) => j && j === jenis[0]) ? jenis[0] : '';
}
export function awalSpesimen(orders, sekarang = new Date()) {
    const menunggu = menungguSpesimen(orders);
    return { terpilih: menunggu.map((o) => o.id), asal: asalBersama(menunggu), asalManual: false, waktu: keInputLokal(sekarang.toISOString()), petugas: '' };
}
/** Memilih/melepas order: asal otomatis mengikuti jenis spesimen order terpilih selama belum diketik petugas. */
export function gantiOrderSpesimen(k, orders, id) {
    const terpilih = k.terpilih.includes(id) ? k.terpilih.filter((x) => x !== id) : [...k.terpilih, id];
    const asal = k.asalManual && k.asal.trim() ? k.asal : asalBersama(orders.filter((o) => terpilih.includes(o.id)));
    return { ...k, terpilih, asal, asalManual: k.asalManual && !!k.asal.trim() };
}
/** `orders` (opsional): asal boleh kosong bila setiap order terpilih punya jenis spesimen sendiri; tanpa `orders` asal wajib. */
export function galatSpesimen(k, orders) {
    const g = {};
    if (!k.terpilih.length)
        g.terpilih = PENUNJANG.galat.pilihOrder;
    const terpilih = orders ? orders.filter((o) => k.terpilih.includes(o.id)) : [];
    if (!k.asal.trim() && (!orders || terpilih.some((o) => !(o.jenis_spesimen ?? '').trim())))
        g.asal = PENUNJANG.galat.asalWajib;
    if (!dariInputLokal(k.waktu))
        g.waktu = PENUNJANG.galat.waktuWajib;
    else if (new Date(dariInputLokal(k.waktu)).getTime() > Date.now() + 5 * 60_000)
        g.waktu = PENUNJANG.galat.waktuMasaDepan;
    return g;
}
/** Asal yang diketik petugas berlaku untuk semua order; bila kosong tiap order memakai jenis spesimennya sendiri. */
export const bentukSpesimen = (k, order) => ({
    asal: k.asal.trim() || (order?.jenis_spesimen ?? '').trim(), waktu_ambil: dariInputLokal(k.waktu), ...(k.petugas ? { petugas_id: Number(k.petugas) } : {}),
});
