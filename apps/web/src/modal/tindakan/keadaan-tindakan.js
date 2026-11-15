import { KLINIS, tindakanIsi } from '@klira/shared';

/** Satu baris editor: tindakan terpilih (kode ICD-9 CM, nama, tindakan klinik bila ada) dan jumlahnya; pelaksana dan waktu dibawa dari catatan tersimpan. */
export const barisTindakanKosong = () => ({ kode: '', nama: '', tarif_layanan_id: null, jumlah: '1', performer_id: null, mulai: '', selesai: null });
/** Isian editor dari isi catatan tersimpan; tanpa tindakan tersimpan ada satu baris kosong. */
export const barisDariTindakan = (item) => (item?.length
    ? item.map((i) => ({ kode: i.kode, nama: i.nama, tarif_layanan_id: i.tarif_layanan_id ?? null, jumlah: String(i.jumlah ?? 1), performer_id: i.performer_id ?? null, mulai: i.mulai, selesai: i.selesai ?? null }))
    : [barisTindakanKosong()]);
/** Baris yang sudah memilih tindakan; baris kosong diabaikan saat disimpan. */
export const barisTerisi = (baris) => baris.filter((b) => b.kode);
/** Isi catatan Tindakan untuk disimpan. Tindakan baru dimulai pada `sekarang`; pelaksana kosong diisi server dengan penyimpan. */
export const bentukIsiTindakan = (baris, sekarang = new Date().toISOString()) => ({
    item: barisTerisi(baris).map((b) => ({
        kode: b.kode, nama: b.nama, ...(b.tarif_layanan_id ? { tarif_layanan_id: b.tarif_layanan_id } : {}), jumlah: b.jumlah,
        ...(b.performer_id ? { performer_id: b.performer_id } : {}), mulai: b.mulai || sekarang, selesai: b.selesai ?? null,
    })),
});
/** Galat per baris (`item.n.bidang`, n = urutan di editor) dan galat daftar (`item`, mis. tindakan ganda) dari skema bersama. */
export function galatTindakan(baris) {
    const urutan = baris.flatMap((b, n) => (b.kode ? [n] : []));
    const g = {};
    for (const i of tindakanIsi.safeParse(bentukIsiTindakan(baris)).error?.issues ?? []) {
        const [, n, ...sisa] = i.path;
        const kunci = typeof n === 'number' ? `item.${urutan[n]}${sisa.length ? `.${sisa.join('.')}` : ''}` : 'item';
        g[kunci] ??= i.message;
    }
    return g;
}
export const ubahBarisTindakan = (baris, n, p) => baris.map((x, i) => (i === n ? { ...x, ...p } : x));
export const hapusBarisTindakan = (baris, n) => baris.filter((_, i) => i !== n);
/** Pilihan pencarian menjadi isian baris: tindakan klinik membawa tarif, kamus ICD-9 hanya kode dan nama. */
export const isiDariPilihan = (p) => (p ? { kode: p.kode, nama: p.nama, tarif_layanan_id: p.tarif_layanan_id ?? null } : { kode: '', nama: '', tarif_layanan_id: null });
/** Gabungan hasil pencarian: tindakan klinik (berkode ICD-9) lebih dulu, lalu kamus ICD-9 CM yang kodenya belum tercakup tindakan klinik. */
export function gabungHasil(klinik, kamus) {
    const dariKlinik = klinik.filter((t) => t.kode_icd9cm).map((t) => ({ sumber: 'klinik', kode: t.kode_icd9cm, nama: t.nama, tarif_layanan_id: t.id, harga_umum: t.harga_umum, harga_jkn: t.harga_jkn }));
    const dipakai = new Set(dariKlinik.map((x) => x.kode));
    return [...dariKlinik, ...kamus.filter((k) => !dipakai.has(k.kode)).map((k) => ({ sumber: 'kamus', kode: k.kode, nama: k.nama }))];
}
export const labelSumber = (s) => (s === 'klinik' ? KLINIS.tindakan.tindakanKlinik : KLINIS.tindakan.kamus);
