/** Logika murni isian tanggal tiga kolom (tanggal, bulan, tahun): nilai tersimpan YYYY-MM-DD; yang belum lengkap atau tidak sah dibawa apa adanya sebagai "tt/bb/tttt". */
const POLA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const dua = (n) => String(n).padStart(2, '0');
/** Tanggal kalender yang ada (mis. 31/02 tidak ada; tahun kabisat dihitung). */
export function tanggalKalender(tahun, bulan, hari) {
    if (![tahun, bulan, hari].every(Number.isInteger) || tahun < 1000 || tahun > 9999 || bulan < 1 || bulan > 12 || hari < 1)
        return false;
    const d = new Date(Date.UTC(tahun, bulan - 1, hari));
    return d.getUTCFullYear() === tahun && d.getUTCMonth() === bulan - 1 && d.getUTCDate() === hari;
}
/** Nilai YYYY-MM-DD yang sah (dipakai pemanggil yang hanya menerima tanggal lengkap, mis. penyaring otomatis). */
export function tanggalLengkapSah(nilai) {
    const m = POLA_ISO.exec(String(nilai ?? ''));
    return !!m && tanggalKalender(Number(m[1]), Number(m[2]), Number(m[3]));
}
/** Memecah nilai (YYYY-MM-DD, "tt/bb/tttt", atau kosong) menjadi isi tiga kolom. */
export function pecahTanggal(nilai) {
    const s = String(nilai ?? '').trim();
    const iso = POLA_ISO.exec(s);
    if (iso)
        return { hari: iso[3], bulan: iso[2], tahun: iso[1] };
    if (s.includes('/')) {
        const [hari = '', bulan = '', tahun = ''] = s.split('/').map((x) => x.replace(/\D/g, ''));
        return { hari: hari.slice(0, 2), bulan: bulan.slice(0, 2), tahun: tahun.slice(0, 4) };
    }
    return { hari: '', bulan: '', tahun: '' };
}
/** Isi tiga kolom menjadi nilai: kosong bila semuanya kosong, YYYY-MM-DD bila lengkap dan sah, selain itu "tt/bb/tttt" apa adanya. */
export function gabungTanggal({ hari, bulan, tahun }) {
    if (!hari && !bulan && !tahun)
        return '';
    if (/^\d{1,2}$/.test(hari) && /^\d{1,2}$/.test(bulan) && /^\d{4}$/.test(tahun) && tanggalKalender(Number(tahun), Number(bulan), Number(hari)))
        return `${tahun}-${dua(bulan)}-${dua(hari)}`;
    return `${hari}/${bulan}/${tahun}`;
}
/** Tanggal dari teks tempelan: YYYY-MM-DD, tt/bb/tttt, tt-bb-tttt, atau tt.bb.tttt; null bila bentuknya lain. */
export function tanggalDariTeks(teks) {
    const s = String(teks ?? '').trim();
    const iso = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s);
    if (iso)
        return { hari: iso[3], bulan: iso[2], tahun: iso[1] };
    const lokal = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s);
    return lokal ? { hari: lokal[1], bulan: lokal[2], tahun: lokal[3] } : null;
}
/** Nilai kolom setelah ketikan: hanya angka, dipotong ke panjang maksimal. */
export const bersihkanAngka = (teks, maks) => String(teks ?? '').replace(/\D/g, '').slice(0, maks);
/** Apakah ketikan di kolom ini sudah selesai sehingga fokus pindah ke kolom berikutnya (dua digit, atau satu digit yang pasti awal angka dua digit tidak mungkin). */
export function kolomSelesai(jenis, isi) {
    if (jenis === 'tahun')
        return isi.length === 4;
    if (isi.length >= 2)
        return true;
    return isi.length === 1 && Number(isi) > (jenis === 'hari' ? 3 : 1);
}
/** Mengisi nol di depan angka satu digit (5 menjadi 05) saat kolom ditinggalkan. */
export const lengkapiNol = (isi) => (/^\d$/.test(isi) ? `0${isi}` : isi);
