/** Aturan murni penunjang (4.3, 7), dipakai API dan web. */
/** Urutan status order: hanya maju. */
export const URUTAN_STATUS_ORDER = ['dipesan', 'spesimen_diambil', 'menunggu_hasil', 'divalidasi'];
/** Status sesudah `dari` yang sah: ambil spesimen (dipesan), isi hasil (spesimen diambil atau menunggu hasil), validasi (menunggu hasil). */
export const AKSI_ORDER = ['spesimen', 'hasil', 'validasi'];
export const TRANSISI_ORDER = {
    spesimen: { dari: ['dipesan'], ke: 'spesimen_diambil' },
    hasil: { dari: ['spesimen_diambil', 'menunggu_hasil'], ke: 'menunggu_hasil' },
    validasi: { dari: ['menunggu_hasil'], ke: 'divalidasi' },
};
export const bolehAksiOrder = (status, aksi) => TRANSISI_ORDER[aksi].dari.includes(status);
export const adalahMaju = (dari, ke) => URUTAN_STATUS_ORDER.indexOf(ke) > URUTAN_STATUS_ORDER.indexOf(dari);
/** Order yang masih menunggu pekerjaan lab (belum divalidasi). */
export const orderBerjalan = (status) => status !== 'divalidasi';
/** Angka dari isian hasil ("5,4" atau "5.4"); null bila bukan angka murni. */
export function angkaDariNilai(nilai) {
    const t = nilai.trim().replace(',', '.');
    if (!/^-?\d+(\.\d+)?$/.test(t))
        return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
}
/** Saran interpretasi dari rentang rujukan; null bila nilai bukan angka atau rentang tidak ada (analis memilih sendiri). */
export function sarankanInterpretasi(nilai, min, maks) {
    const n = angkaDariNilai(nilai);
    if (n === null || (min === null && maks === null))
        return null;
    if (min !== null && n < min)
        return 'rendah';
    if (maks !== null && n > maks)
        return 'tinggi';
    return 'normal';
}
/** Teks rentang rujukan untuk tampilan: teks bebas lebih dahulu, lalu "min - maks satuan". */
export function teksRujukan(m) {
    if (m.rujukan_teks?.trim())
        return m.rujukan_teks.trim();
    const { rujukan_min: a, rujukan_maks: b } = m;
    const satuan = m.satuan ? ` ${m.satuan}` : '';
    if (a !== null && b !== null)
        return `${a} - ${b}${satuan}`;
    if (a !== null)
        return `>= ${a}${satuan}`;
    if (b !== null)
        return `<= ${b}${satuan}`;
    return null;
}
/** Harga item tagihan: harga JKN untuk kunjungan JKN bila ada, selain itu harga umum (asuransi lain = umum); null bila tarif tidak ada atau tanpa harga. */
export function hargaTarif(tarif, caraPembayaran) {
    if (!tarif)
        return null;
    return caraPembayaran === 'jkn' && tarif.harga_jkn !== null ? tarif.harga_jkn : tarif.harga_umum;
}
/** Hasil susulan menjadi addendum bila catatan sudah disahkan (bagian 7): bagian diagnosis atau tindak lanjut sudah disahkan, atau pemeriksaan sudah selesai. */
export function hasilJadiAddendum(d) {
    return ['resep', 'kasir', 'ditutup'].includes(d.tahap) || d.bagianDisahkan.some((b) => b === 'diagnosis' || b === 'tindak_lanjut');
}
/** Nomor order tampil di rekap, mis. 31 menjadi L-031. */
export const kodeOrderLab = (id) => `L-${String(id).padStart(3, '0')}`;
