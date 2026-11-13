import { berkasKurang, siapkanKlaimMasukan, ubahBerkasKlaimMasukan, ubahStatusKlaimMasukan } from '@klira/shared';
const petakan = (isu) => {
    const g = {};
    for (const i of isu ?? [])
        g[i.path.map(String).join('.') || ''] ??= i.message;
    return g;
};
export const awalKlaim = (klaim) => ({ kunjungan_id: klaim?.kunjungan_id ?? null, nomor_sep: klaim?.nomor_sep ?? '', berkas: klaim?.berkas ?? [], catatan: klaim?.catatan ?? '' });
export const bentukSiapkan = (k) => ({ kunjungan_id: k.kunjungan_id ?? 0, nomor_sep: k.nomor_sep, berkas: k.berkas, catatan: k.catatan });
export const bentukUbahBerkas = (k) => ({ nomor_sep: k.nomor_sep, berkas: k.berkas, catatan: k.catatan });
export const galatKlaim = (k, ubah) => petakan((ubah ? ubahBerkasKlaimMasukan.safeParse(bentukUbahBerkas(k)) : siapkanKlaimMasukan.safeParse(bentukSiapkan(k))).error?.issues);
/** Pilih kunjungan kandidat: nomor SEP dari kunjungan ikut terisi bila belum diketik. */
export const pilihKandidat = (k, kandidat) => ({ ...k, kunjungan_id: kandidat?.kunjungan_id ?? null, nomor_sep: k.nomor_sep || kandidat?.nomor_sep || '' });
/** Pindah satu berkas masuk atau keluar dari daftar lengkap (urutan mengikuti katalog). */
export function alihBerkas(k, berkas, lengkap, urutan) {
    const set = new Set(k.berkas);
    if (lengkap)
        set.add(berkas);
    else
        set.delete(berkas);
    return { ...k, berkas: urutan.filter((b) => set.has(b)) };
}
export const kurangBerkas = (jenis, k) => berkasKurang(jenis, k.berkas);
/** Indeks langkah pertama bermasalah (0 kunjungan dan SEP, 2 berkas) atau -1. */
export function langkahBermasalahKlaim(g) {
    if (g.kunjungan_id || g.nomor_sep)
        return 0;
    if (g.berkas || g.catatan)
        return 2;
    return -1;
}
export const awalStatusKlaim = (aksi = '', hariIni = '') => ({ aksi, berita_acara: '', alasan: '', jumlah_dibayar: '', dibayar_pada: hariIni });
export const bentukStatusKlaim = (k) => ({ ...k, aksi: k.aksi });
export const galatStatusKlaim = (k) => petakan(ubahStatusKlaimMasukan.safeParse(bentukStatusKlaim(k)).error?.issues);
