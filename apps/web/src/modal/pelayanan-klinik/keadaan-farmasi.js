import { KASIR, FARMASI, ATURAN_PAKAI_BAWAAN, RUTE_BAWAAN, RUTE_PEMBERIAN, ruteDariBentuk, daftarItemResepMasukan, masterObatMasukan, mutasiStokMasukan, resepMasukan, telaahMasukan, ubahMasterObatMasukan } from '@klira/shared';
/** Galat per bidang dari skema bersama (pesan sama dengan API); kunci = nama bidang, bidang di dalam daftar memakai `item.n.bidang`. */
const petakan = (isu) => {
    const g = {};
    for (const i of isu)
        g[i.path.map(String).join('.') || ''] ??= i.message;
    return g;
};
// ---- Master obat ----
/** Opsi rute: kosong, daftar baku, dan nilai lama di luar daftar agar tidak hilang saat disunting. */
export const opsiRute = (nilai) => [
    { nilai: '', label: FARMASI.item.ruteKosong },
    ...RUTE_PEMBERIAN.map((r) => ({ nilai: r, label: r })),
    ...(nilai && !RUTE_PEMBERIAN.includes(nilai) ? [{ nilai, label: nilai }] : []),
];
/** Memilih obat di item resep: bentuk dari KFA bila belum diisi; rute dari master obat, atau dari bentuk (bawaan Oral) bila master kosong. */
export function isiDariObat(b, o) {
    const bentuk = b.bentuk || (o?.bentuk_sediaan ?? '');
    return { master_obat_id: o ? String(o.id) : '', bentuk, rute: o ? o.rute || (ruteDariBentuk(bentuk) ?? '') : RUTE_BAWAAN };
}
export const awalMasterObat = (m) => ({
    kfa: null, nama_tampil: m?.nama_tampil ?? '', satuan: m?.satuan ?? '', rute: m?.rute ?? '', harga: m ? String(m.harga) : '', aktif: m?.aktif ?? true,
});
/** Memilih kode KFA mengisi nama tampil, satuan, dan rute (ditebak dari bentuk sediaan) bila masih kosong (boleh diubah klinik). */
export const pilihKfa = (k, kfa) => ({
    ...k, kfa, nama_tampil: k.nama_tampil.trim() ? k.nama_tampil : kfa.nama, satuan: k.satuan.trim() ? k.satuan : kfa.satuan ?? '',
    rute: k.rute || (ruteDariBentuk(kfa.bentuk_sediaan) ?? ''),
});
/** Galat untuk tambah (kode KFA wajib) atau ubah (tanpa kode KFA; hanya bidang yang berubah divalidasi). */
export function galatMasterObat(k, ubah) {
    if (ubah) {
        const h = ubahMasterObatMasukan.safeParse({ nama_tampil: k.nama_tampil, satuan: k.satuan, rute: k.rute, harga: k.harga, aktif: k.aktif });
        return h.success ? {} : petakan(h.error.issues);
    }
    const g = petakan(masterObatMasukan.safeParse({ kfa_kode: k.kfa?.kode ?? '', nama_tampil: k.nama_tampil, satuan: k.satuan, rute: k.rute, harga: k.harga, aktif: k.aktif }).error?.issues ?? []);
    if (!k.kfa)
        g.kfa_kode = FARMASI.galat.kfaTidakAda;
    return g;
}
export const bentukTambahObat = (k) => ({ kfa_kode: k.kfa?.kode, nama_tampil: k.nama_tampil, satuan: k.satuan, rute: k.rute, harga: k.harga, aktif: k.aktif });
/** Hanya bidang yang berubah dikirim saat mengubah (PATCH). */
export function perubahanMasterObat(awal, k) {
    const h = {};
    if (k.nama_tampil !== awal.nama_tampil)
        h.nama_tampil = k.nama_tampil;
    if (k.satuan !== awal.satuan)
        h.satuan = k.satuan;
    if (k.rute !== awal.rute)
        h.rute = k.rute;
    if (k.harga !== awal.harga)
        h.harga = k.harga;
    if (k.aktif !== awal.aktif)
        h.aktif = k.aktif;
    return h;
}
export const awalMutasi = (obatId = '') => ({ obatId, jenis: 'terima', batch: '', kedaluwarsa: '', jumlah: '', alasan: '' });
export const bentukMutasi = (k) => ({
    master_obat_id: Number(k.obatId), jenis: k.jenis, batch: k.batch, kedaluwarsa: k.kedaluwarsa, jumlah: k.jumlah, alasan: k.alasan,
});
export function galatMutasi(k) {
    const g = petakan(mutasiStokMasukan.safeParse(bentukMutasi(k)).error?.issues ?? []);
    if (!k.obatId)
        g.master_obat_id = FARMASI.galat.obatTidakAda;
    return g;
}
/** Mengganti jenis mutasi: batch dan kedaluwarsa dikosongkan agar tidak terbawa; batch yang ada dipilih dari daftar stok. */
export const gantiJenisMutasi = (k, jenis) => ({ ...k, jenis, batch: '', kedaluwarsa: '', jumlah: '' });
/** Memilih batch yang ada: kedaluwarsa dan (untuk koreksi) jumlah awal diambil dari stok. */
export function pilihBatch(k, stok, batch) {
    const s = stok.find((x) => x.batch === batch);
    return { ...k, batch, kedaluwarsa: s?.kedaluwarsa ?? k.kedaluwarsa, jumlah: k.jenis === 'koreksi' && s ? String(s.jumlah) : k.jumlah };
}
// ---- Resep (dokter): teks bebas, P3 ----
export const awalResep = () => '';
/** Resep hanya diajukan bila teks berisi selain spasi. */
export const adaIsianResep = (teks) => !!teks.trim();
export const bentukResep = (teks) => ({ teks });
export const galatResep = (teks) => petakan(resepMasukan.safeParse(bentukResep(teks)).error?.issues ?? []);
/** Baris baru langsung berisi nilai bawaan (jumlah 1, aturan pakai 3 x 1, rute Oral); apoteker menyesuaikan bila berbeda. */
export const barisResepKosong = () => ({ master_obat_id: '', jumlah: '1', aturan_pakai: ATURAN_PAKAI_BAWAAN, bentuk: '', rute: RUTE_BAWAAN });
export const ubahBarisResep = (b, n, p) => b.map((x, i) => (i === n ? { ...x, ...p } : x));
export const hapusBarisResep = (b, n) => b.filter((_, i) => i !== n);
/** Item tersimpan menjadi baris editor (urutan sama). */
export const barisDariItem = (item) => item.map((i) => ({ master_obat_id: String(i.master_obat_id), jumlah: String(i.jumlah), aturan_pakai: i.aturan_pakai, bentuk: i.bentuk ?? '', rute: i.rute ?? '' }));
export const bentukItemResep = (b) => b.map((x) => ({ master_obat_id: Number(x.master_obat_id), jumlah: x.jumlah, aturan_pakai: x.aturan_pakai, bentuk: x.bentuk.trim() || null, rute: x.rute.trim() || null }));
/** Galat per baris (`item.n.bidang`) dari skema bersama; obat wajib dipilih dari master. Obat yang sama boleh lebih dari sekali. */
export function galatItemResep(b) {
    const g = petakan((daftarItemResepMasukan.safeParse(bentukItemResep(b)).error?.issues ?? []).map((i) => ({ ...i, path: ['item', ...i.path] })));
    b.forEach((x, n) => {
        if (!x.master_obat_id)
            g[`item.${n}.master_obat_id`] = FARMASI.galat.obatTidakAda;
    });
    return g;
}
/** Perkiraan biaya obat dari harga master obat. */
export const biayaResep = (b, obat) => b.reduce((s, x) => s + (obat.find((o) => String(o.id) === x.master_obat_id)?.harga ?? 0) * (Number(x.jumlah) || 0), 0);
export const awalTelaah = (t) => ({
    administratif: t?.administratif ?? false, farmasetik: t?.farmasetik ?? false, klinis: t?.klinis ?? false, catatan: t?.catatan ?? '',
});
export const telaahLengkap = (k) => k.administratif && k.farmasetik && k.klinis;
export const galatTelaah = (k) => petakan(telaahMasukan.safeParse({ administratif: k.administratif, farmasetik: k.farmasetik, klinis: k.klinis, catatan: k.catatan }).error?.issues ?? []);
export const awalSerah = () => ({ izinkan: false, alasan: '' });
export const galatSerah = (k) => (k.izinkan && !k.alasan.trim() ? KASIR.galat.alasanWajib : null);
export const bentukSerah = (k) => (k.izinkan ? { izinkan_stok_kurang: true, alasan: k.alasan } : {});
