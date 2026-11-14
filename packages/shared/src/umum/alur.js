/** Aturan alur murni pendaftaran dan antrean (bagian 7), dipakai API dan web. */
export const AKSI_ANTREAN = ['panggil', 'mulai', 'selesai', 'batal'];
/** Perpindahan status antrean: panggil ulang (dipanggil ke dipanggil) diizinkan untuk memanggil lagi. */
export const TRANSISI_ANTREAN = {
    panggil: { dari: ['menunggu', 'dipanggil'], ke: 'dipanggil' },
    mulai: { dari: ['dipanggil'], ke: 'dilayani' },
    selesai: { dari: ['dilayani'], ke: 'selesai' },
    batal: { dari: ['menunggu', 'dipanggil'], ke: 'batal' },
};
export const bolehAksiAntrean = (status, aksi) => TRANSISI_ANTREAN[aksi].dari.includes(status);
export const aksiAntreanTersedia = (status) => AKSI_ANTREAN.filter((a) => bolehAksiAntrean(status, a));
export const AWALAN_ANTREAN = 'A';
/** Antrean penunjang saja (tes lab tanpa poli): jenis dan awalan nomor tetap. */
export const ANTREAN_LAB = { jenis_poli: 'Laboratorium', awalan: 'L' };
/** Nomor antrean tampil, mis. 1 menjadi A-001. */
export const kodeAntrean = (nomor, awalan = AWALAN_ANTREAN) => `${awalan}-${String(nomor).padStart(3, '0')}`;
/** Awalan nomor antrean untuk jenis poli: huruf pertama nama jenis; bila sudah dipakai jenis lain, huruf berikutnya dari nama, lalu A sampai Z. `terpakai` adalah awalan jenis lain. */
export function awalanUntukJenis(jenis, terpakai) {
    const pakai = new Set(terpakai);
    const kandidat = [...String(jenis).toUpperCase().replace(/[^A-Z]/g, ''), ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
    return kandidat.find((h) => !pakai.has(h)) ?? 'A';
}
/** Tahap tujuan yang sah dari tahap sekarang. Penutupan kunjungan (ditutup) memiliki peristiwa sendiri (7), bukan ubah tahap biasa. */
export const TAHAP_TUJUAN = {
    menunggu_skrining: ['pemeriksaan'],
    pemeriksaan: ['resep', 'kasir'],
    resep: ['kasir'],
    kasir: [],
    ditutup: [],
};
export const bolehPindahTahap = (dari, ke) => TAHAP_TUJUAN[dari].includes(ke);
/** Tahap kunjungan yang masih berjalan (belum ditutup). */
export const TAHAP_BERJALAN = ['menunggu_skrining', 'pemeriksaan', 'resep', 'kasir'];
/** Rawat jalan wajib poli; rawat inap langsung tidak memakai poli dan antrean poli. */
export const jenisPakaiAntrean = (jenis) => jenis === 'AMB' || jenis === 'LAB';
/** Nomor RM berurutan per fasyankes: 7 digit dikelompokkan 2-2-3, mis. 12345 menjadi 00-01-234 (dari 0012345). */
export function formatNomorRm(urutan) {
    const d = String(urutan).padStart(7, '0');
    return `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4)}`;
}
const WIB_MS = 7 * 60 * 60 * 1000;
/** Tanggal (YYYY-MM-DD) pada zona Asia/Jakarta (UTC+7) untuk batas hari antrean; waktu tetap disimpan UTC. */
export const tanggalWib = (waktu) => new Date(waktu.getTime() + WIB_MS).toISOString().slice(0, 10);
/** Batas waktu UTC untuk rentang tanggal WIB inklusif (YYYY-MM-DD): awal hari `dari` sampai sebelum hari sesudah `sampai`. */
export function rentangHariWib(dari, sampai) {
    const hari = (t) => new Date(`${t}T00:00:00.000Z`).getTime() - WIB_MS;
    return { ...(dari ? { awal: new Date(hari(dari)) } : {}), ...(sampai ? { akhir: new Date(hari(sampai) + 24 * 3_600_000) } : {}) };
}
/** Umur penuh dalam tahun dari tanggal lahir (YYYY-MM-DD) pada tanggal acuan. */
export function umurTahun(tanggalLahir, acuan = new Date()) {
    const [y, m, d] = tanggalLahir.split('-').map(Number);
    const a = new Date(acuan.getTime() + WIB_MS);
    let umur = a.getUTCFullYear() - y;
    if (a.getUTCMonth() + 1 < m || (a.getUTCMonth() + 1 === m && a.getUTCDate() < d))
        umur -= 1;
    return Math.max(0, umur);
}
