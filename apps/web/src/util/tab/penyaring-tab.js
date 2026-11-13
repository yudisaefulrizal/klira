/** Baca penyaring dari query string; hanya kunci di `bawaan` yang dikenal. */
export function bacaPenyaring(search, bawaan) {
    const q = new URLSearchParams(search);
    const nilai = {};
    for (const k of Object.keys(bawaan))
        nilai[k] = (q.get(k) ?? bawaan[k]).trim();
    const halaman = Number(q.get('halaman'));
    return { nilai, halaman: Number.isInteger(halaman) && halaman >= 1 ? halaman : 1 };
}
/** Query string memuat tab dan hanya nilai yang berbeda dari bawaan. */
export function queryPenyaring(tab, k, bawaan) {
    const q = new URLSearchParams({ tab });
    for (const key of Object.keys(bawaan))
        if (k.nilai[key] && k.nilai[key] !== bawaan[key])
            q.set(key, k.nilai[key]);
    if (k.halaman > 1)
        q.set('halaman', String(k.halaman));
    return `?${q.toString()}`;
}
/** Mengubah penyaring mengembalikan ke halaman pertama. */
export const ubahPenyaring = (k, perubahan) => ({
    nilai: { ...k.nilai, ...perubahan },
    halaman: 1,
});
export const totalHalaman = (total, ukuran) => Math.max(1, Math.ceil(total / Math.max(1, ukuran)));
const tanggalLokal = (t, akhirHari) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t))
        return undefined;
    const d = new Date(`${t}T${akhirHari ? '23:59:59.999' : '00:00:00'}`);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};
/** Rentang tanggal (YYYY-MM-DD, zona setempat, akhir inklusif) menjadi waktu UTC ISO untuk API. */
export const rentangIso = (dari, sampai) => ({
    ...(tanggalLokal(dari, false) ? { dari: tanggalLokal(dari, false) } : {}),
    ...(tanggalLokal(sampai, true) ? { sampai: tanggalLokal(sampai, true) } : {}),
});
/** True bila tanggal akhir sebelum tanggal awal. */
export const rentangTerbalik = (dari, sampai) => !!dari && !!sampai && sampai < dari;
export const BAWAAN_AUDIT = { pengguna: '', aksi: '', entitas: '', dari: '', sampai: '' };
/** Penyaring tab Master data: subbagian (jenis), pencarian, status, dan tingkat wilayah. */
export const BAWAAN_MASTER = { jenis: 'poli', cari: '', status: 'semua', tingkat: '' };
export const BAWAAN_PERINGATAN = { cari: '', jenis: '', dari: '', sampai: '' };
export const penggunaIdSah = (t) => t === '' || /^[1-9]\d*$/.test(t);
export function saringanAudit(k, ukuran) {
    const n = k.nilai;
    return {
        halaman: k.halaman, ukuran,
        ...(n.pengguna && penggunaIdSah(n.pengguna) ? { pengguna_id: Number(n.pengguna) } : {}),
        ...(n.aksi ? { aksi: n.aksi } : {}),
        ...(n.entitas ? { entitas: n.entitas } : {}),
        ...rentangIso(n.dari, n.sampai),
    };
}
/** Penyaring ekspor: sama dengan daftar tetapi tanpa paginasi (semua baris yang cocok, dibatasi peladen). */
export function saringanEkspor(k) {
    const s = saringanAudit(k, 1);
    delete s.halaman;
    delete s.ukuran;
    return s;
}
export function saringanPeringatan(k, ukuran) {
    const n = k.nilai;
    return {
        halaman: k.halaman, ukuran,
        ...(n.cari ? { cari: n.cari } : {}),
        ...(n.jenis ? { jenis_peringatan: n.jenis } : {}),
        ...rentangIso(n.dari, n.sampai),
    };
}
/** Waktu ISO (UTC) dari API menjadi tanggal dan jam setempat, mis. 25/10/2026 14.30. */
export function formatWaktu(iso, zona) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return iso;
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'short', timeZone: zona }).format(d);
}
/** Saringan daftar master dari keadaan tab; kosong tidak dikirim. */
export function saringanMaster(k, ukuran) {
    const { cari, status, tingkat } = k.nilai;
    return { halaman: k.halaman, ukuran, ...(cari ? { cari } : {}), ...(status && status !== 'semua' ? { status } : {}), ...(tingkat ? { tingkat } : {}) };
}
