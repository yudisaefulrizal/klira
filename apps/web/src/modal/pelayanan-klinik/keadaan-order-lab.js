import { hargaTarif } from '@klira/shared';
import { PENUNJANG } from '@klira/shared';
export const awalOrderLab = () => ({ pemeriksaan: [], prioritas: 'rutin', catatan: '' });
/** Pemeriksaan aktif yang cocok dengan kata cari (nama, kode, atau LOINC), urut nama. */
export function saringPemeriksaan(master, cari) {
    const k = cari.trim().toLowerCase();
    if (!k)
        return [];
    return master
        .filter((m) => m.aktif && (m.nama.toLowerCase().includes(k) || m.kode.toLowerCase().includes(k) || (m.kode_loinc ?? '').toLowerCase().includes(k)))
        .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
}
/** Menambah atau melepas satu pemeriksaan dari pilihan (urutan pilih dipertahankan). */
export const gantiPilihan = (k, id) => ({
    ...k, pemeriksaan: k.pemeriksaan.includes(id) ? k.pemeriksaan.filter((x) => x !== id) : [...k.pemeriksaan, id],
});
export const galatOrderLab = (k) => (k.pemeriksaan.length ? null : PENUNJANG.galat.pilihPemeriksaan);
export const bentukOrderLab = (k) => ({
    pemeriksaan_ids: k.pemeriksaan, prioritas: k.prioritas, catatan: k.catatan.trim() || null,
});
/** Perkiraan biaya pemeriksaan terpilih menurut cara pembayaran kunjungan; `tanpaTarif` bila ada yang belum bertarif. */
export function perkiraanBiaya(master, terpilih, cara) {
    let total = 0;
    let tanpaTarif = 0;
    for (const id of terpilih) {
        const harga = hargaTarif(master.find((m) => m.id === id)?.tarif ?? null, cara);
        if (harga === null)
            tanpaTarif += 1;
        else
            total += harga;
    }
    return { total, tanpaTarif };
}
/** Rupiah untuk tampilan (tanpa pecahan). */
export const rupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
/** Rupiah untuk harga yang boleh kosong (mis. tarif tindakan tanpa harga acuan). */
export const rupiahAtau = (n, kosong = '-') => (n === null || n === undefined ? kosong : rupiah(n));
