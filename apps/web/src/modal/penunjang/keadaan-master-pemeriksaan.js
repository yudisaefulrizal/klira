import { masterPemeriksaanMasukan, PENUNJANG } from '@klira/shared';
export const awalMasterPemeriksaan = (m) => ({
    kode: m?.kode ?? '', nama: m?.nama ?? '', kode_loinc: m?.kode_loinc ?? '', jenis_spesimen: m?.jenis_spesimen ?? '', satuan: m?.satuan ?? '',
    rujukan_min: m?.rujukan_min != null ? String(m.rujukan_min) : '', rujukan_maks: m?.rujukan_maks != null ? String(m.rujukan_maks) : '', rujukan_teks: m?.rujukan_teks ?? '',
    harga_umum: m?.tarif?.harga_umum != null ? String(m.tarif.harga_umum) : '', harga_jkn: m?.tarif?.harga_jkn != null ? String(m.tarif.harga_jkn) : '', aktif: m?.aktif ?? true,
});
/** Isian menjadi bentuk kiriman (kosong dibiarkan; skema bersama menormalkan menjadi null). */
export const bentukMasterPemeriksaan = (k) => ({ ...k });
/** Galat per bidang dari skema bersama (pesan sama dengan API). */
export function galatMasterPemeriksaan(k) {
    const h = masterPemeriksaanMasukan.safeParse(bentukMasterPemeriksaan(k));
    const g = {};
    if (!h.success)
        for (const i of h.error.issues)
            g[String(i.path[0] ?? '')] ??= i.message;
    // Harga wajib diisi di formulir (0 bila tanpa biaya) agar pemeriksaan selalu dapat ditagih.
    if (k.harga_umum.trim() === '')
        g.harga_umum = PENUNJANG.master.hargaWajib;
    return g;
}
/** Hanya bidang yang berubah dikirim saat mengubah (PATCH). */
export function perubahanMaster(awal, k) {
    const hasil = {};
    for (const kunci of Object.keys(k))
        if (k[kunci] !== awal[kunci])
            hasil[kunci] = k[kunci];
    return hasil;
}
