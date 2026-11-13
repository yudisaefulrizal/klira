import { bayarMasukan, bolehUbahHarga, bukaShiftMasukan, KASIR, MAKS_BARIS_BAYAR, NILAI_METODE_BAYAR, rincianBayar, tambahItemTarifMasukan, tutupShiftMasukan, ubahHargaMasukan } from '@klira/shared';
const petakan = (isu) => {
    const g = {};
    for (const i of isu)
        g[i.path.map(String).join('.') || ''] ??= i.message;
    return g;
};
const angkaSah = (j) => {
    const n = Number(j);
    return j.trim() !== '' && Number.isInteger(n) && n > 0 ? n : 0;
};
/** Baris pertama tunai terisi sisa tagihan. */
export const awalBayar = (sisa = 0) => ({ baris: [{ metode: 'tunai', jumlah: sisa > 0 ? String(sisa) : '' }] });
/** Sisa yang belum tertutup baris yang ada (tidak negatif). */
export const belumTertutup = (k, sisa) => Math.max(0, sisa - k.baris.reduce((s, b) => s + angkaSah(b.jumlah), 0));
/** Menambah baris metode (maks 3) dengan metode pertama yang belum dipakai dan jumlah = sisa yang belum tertutup. */
export function tambahBaris(k, sisa) {
    if (k.baris.length >= MAKS_BARIS_BAYAR)
        return k;
    const metode = NILAI_METODE_BAYAR.find((m) => !k.baris.some((b) => b.metode === m)) ?? 'tunai';
    const n = belumTertutup(k, sisa);
    return { baris: [...k.baris, { metode, jumlah: n > 0 ? String(n) : '' }] };
}
/** Baris pertama tidak bisa dihapus. */
export const hapusBaris = (k, i) => (i <= 0 ? k : { baris: k.baris.filter((_, j) => j !== i) });
export const ubahBaris = (k, i, ubah) => ({ baris: k.baris.map((b, j) => (j === i ? { ...b, ...ubah } : b)) });
/** Galat per isian: kunci `pembayaran.<i>.metode` / `pembayaran.<i>.jumlah`; `pembayaran` untuk non-tunai melebihi sisa. */
export function galatBayar(k, sisa) {
    const g = petakan(bayarMasukan.safeParse(bentukBayar(k)).error?.issues ?? []);
    if (sisa !== undefined && !Object.keys(g).length && rincianBayar(barisAngka(k), sisa).non_tunai_lebih)
        g.pembayaran = KASIR.galat.nonTunaiLebih;
    return g;
}
export const bentukBayar = (k) => ({ pembayaran: k.baris.map((b) => ({ metode: b.metode, jumlah: b.jumlah })) });
const barisAngka = (k) => k.baris.map((b) => ({ metode: b.metode, jumlah: angkaSah(b.jumlah) }));
/** Ringkasan diterima, diterapkan ke tagihan, dan kembalian (hanya dari tunai); isian tidak sah dihitung 0. */
export function ringkasBayar(k, sisa) {
    const r = rincianBayar(barisAngka(k), sisa);
    return { diterima: r.diterima, diterapkan: Math.min(r.diterapkan, sisa), kembalian: r.kembalian };
}
// ---- Tambah item dari tarif ----
/** Pesan galat pertama isian tambah item (tarif dan jumlah), atau null bila sah. */
export function galatTambahItem(tarifId, jumlah) {
    const h = tambahItemTarifMasukan.safeParse({ tarif_id: tarifId ? Number(tarifId) : undefined, jumlah });
    return h.success ? null : h.error.issues[0]?.message ?? KASIR.galat.pilihTarif;
}
// ---- Ubah harga per kunjungan ----
/** Galat per bidang isian ubah harga (harga, alasan); harga sama dengan sekarang juga ditolak. */
export function galatUbahHarga(harga, alasan, hargaSekarang) {
    const h = ubahHargaMasukan.safeParse({ harga: harga.trim(), alasan });
    const galat = h.success ? {} : petakan(h.error.issues);
    if (!galat.harga && h.success && h.data.harga === hargaSekarang)
        galat.harga = KASIR.galat.hargaSama;
    return galat;
}
/** Aksi ubah harga tersedia: item bukan obat dan berharga, belum ada pembayaran, kunjungan belum ditutup. */
export const ubahHargaTersedia = (i, g) => bolehUbahHarga(i) && g.tagihan.pembayaran.length === 0 && g.kunjungan.tahap_layanan !== 'ditutup';
/** Item yang harganya diubah kasir: harga acuan (dicoret) berbeda dari harga sekarang. */
export const hargaDiubah = (i) => !!i.alasan_ubah_harga && i.harga_acuan !== null && i.harga_acuan !== undefined && i.harga_acuan !== i.harga;
// ---- Syarat tutup ----
/** Daftar syarat tutup kunjungan dari gambaran kasir; `lunas` bukan penghalang (butuh alasan), sisanya wajib. */
export function daftarSyarat(g) {
    return [
        { kunci: 'tahap', ok: g.syarat.tahap_kasir, wajib: true },
        { kunci: 'tagihan', ok: g.syarat.tagihan_lengkap, wajib: true },
        { kunci: 'resep', ok: g.syarat.resep_diserahkan, wajib: true },
        { kunci: 'lunas', ok: g.syarat.lunas, wajib: false },
    ];
}
/** Belum lunas butuh alasan, kecuali kunjungan JKN (biaya diklaim ke BPJS; alasan dicatat otomatis oleh server). */
export const bisaTutup = (g, alasan) => daftarSyarat(g).every((s) => s.ok || !s.wajib) && (g.syarat.lunas || g.syarat.ditanggung_jkn || alasan.trim().length > 0);
export const awalShift = () => ({ kas: '', alasan: '' });
export function galatBukaShift(k) {
    return Object.fromEntries(Object.entries(petakan(bukaShiftMasukan.safeParse({ kas_awal: k.kas }).error?.issues ?? [])).map(([a, b]) => [a === 'kas_awal' ? 'kas' : a, b]));
}
export function galatTutupShift(k, seharusnya) {
    const g = Object.fromEntries(Object.entries(petakan(tutupShiftMasukan.safeParse({ kas_akhir: k.kas, alasan_selisih: k.alasan }).error?.issues ?? [])).map(([a, b]) => [a === 'kas_akhir' ? 'kas' : a === 'alasan_selisih' ? 'alasan' : a, b]));
    if (!g.kas && Number(k.kas) !== seharusnya && !k.alasan.trim())
        g.alasan = KASIR.galat.alasanWajib;
    return g;
}
export const selisihShift = (k, seharusnya) => (k.kas.trim() !== '' && Number.isInteger(Number(k.kas)) ? Number(k.kas) - seharusnya : null);
