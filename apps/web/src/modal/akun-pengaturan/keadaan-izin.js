import { ATUR_IZIN, IZIN, izinAkunPembuatan, penugasanAkunBaru } from '@klira/shared';
import { galatSkema } from './keadaan-akun.js';
/** Potong tanggal-waktu ISO dari API menjadi YYYY-MM-DD. */
export const tanggalSaja = (t) => (t ? t.slice(0, 10) : '');
/** Waktu ISO dari API mengikuti batas eksklusif mesin izin; tanggal formulir tetap inklusif. */
export function statusPeriode(mulai, selesai, hariIni, sekarang = Date.now()) {
    if (mulai.includes('T') || selesai?.includes('T')) {
        if (selesai && Date.parse(selesai) <= sekarang)
            return 'berakhir';
        if (Date.parse(mulai) > sekarang)
            return 'akan_datang';
        return 'berjalan';
    }
    if (mulai > hariIni)
        return 'akan_datang';
    if (selesai && selesai < hariIni)
        return 'berakhir';
    return 'berjalan';
}
export const periodeTeks = (mulai, selesai) => `${tanggalSaja(mulai)} s.d. ${tanggalSaja(selesai) || ATUR_IZIN.tanpaBatas}`;
export const penugasanAwal = (hariIni) => ({ jenis_akun_id: '', mulai: hariIni, selesai: '' });
export const izinAwal = (hariIni) => ({ izin_id: 0, tipe: 'tambah', alasan: '', mulai: hariIni, selesai: '' });
const kosongJadi = (v) => (v.trim() === '' ? undefined : v.trim());
const bentukPenugasan = (f) => ({ jenis_akun_id: Number(f.jenis_akun_id) || 0, mulai: f.mulai, selesai: kosongJadi(f.selesai) });
export function galatPenugasanBaru(f) {
    const g = galatSkema(penugasanAkunBaru, bentukPenugasan(f));
    const hasil = {};
    if (g.jenis_akun_id)
        hasil.jenis_akun_id = g.jenis_akun_id;
    if (g.mulai)
        hasil.mulai = g.mulai;
    if (g.selesai)
        hasil.selesai = g.selesai;
    return hasil;
}
/** Badan POST /pengguna/:id/penugasan. */
export function bentukPenugasanBaru(f, konfirmasi) {
    return { ...bentukPenugasan(f), ...(konfirmasi ? { konfirmasi_peringatan: konfirmasi } : {}) };
}
const bentukIzin = (f) => ({ ...f, selesai: kosongJadi(f.selesai) });
export const galatIzinBaru = (f) => galatSkema(izinAkunPembuatan, bentukIzin(f));
/** Badan POST /pengguna/:id/izin-akun; alasan dipangkas dan wajib. */
export function bentukIzinBaru(f, konfirmasi) {
    return { ...bentukIzin(f), alasan: f.alasan.trim(), ...(konfirmasi ? { konfirmasi_peringatan: konfirmasi } : {}) };
}
/** Galat ubah periode: tanggal selesai wajib dan tidak sebelum mulai. */
export function galatUbahPeriode(mulai, selesai) {
    if (!selesai.trim())
        return ATUR_IZIN.selesaiWajib;
    return selesai.trim() < tanggalSaja(mulai) ? IZIN.selesaiSebelumMulai : null;
}
/** Jenis akun aktif yang belum berjalan atau terjadwal pada akun ini (menghindari penugasan ganda). */
export function opsiJenisBaru(jenis, penugasan, hariIni) {
    const dipakai = new Set(penugasan.filter((p) => statusPeriode(p.mulai, p.selesai, hariIni) !== 'berakhir').map((p) => p.jenis_akun_id));
    return jenis.filter((j) => j.aktif && !dipakai.has(j.id));
}
/** Jenis akun yang paketnya dihitung untuk pilihan izin: penugasan yang belum berakhir. */
export const jenisBerjalan = (jenis, penugasan, hariIni) => jenis.filter((j) => penugasan.some((p) => p.jenis_akun_id === j.id && statusPeriode(p.mulai, p.selesai, hariIni) !== 'berakhir'));
/** Baris izin akun yang masih berlaku atau terjadwal pada tipe sama, agar tidak ditambahkan ganda. */
export const izinTerpakai = (izinAkun, hariIni) => izinAkun
    .filter((i) => statusPeriode(i.mulai, i.selesai, hariIni) !== 'berakhir')
    .map((i) => ({ izin_id: i.izin_id, tipe: i.tipe, alasan: i.alasan, mulai: tanggalSaja(i.mulai), selesai: tanggalSaja(i.selesai) }));
/** Akses efektif untuk Panel detail: jenis akun, fitur, dan daftar izin. */
export function bagianAkses(a) {
    const tidakAda = ATUR_IZIN.aksesTidakAda;
    const perFitur = new Map();
    for (const i of a.izin)
        perFitur.set(i.fitur, [...(perFitur.get(i.fitur) ?? []), `${i.aksi} (${i.cakupan})`]);
    return [
        {
            baris: [
                { label: ATUR_IZIN.aksesJenis, nilai: a.jenis_akun.length ? a.jenis_akun.join(', ') : tidakAda },
                { label: ATUR_IZIN.aksesFitur, nilai: a.fitur.length ? a.fitur.join(', ') : tidakAda },
                { label: ATUR_IZIN.aksesIzin, nilai: String(a.izin.length) },
            ],
        },
        { judul: ATUR_IZIN.aksesIzin, baris: [...perFitur.entries()].map(([fitur, daftar]) => ({ label: fitur, nilai: daftar.join(', ') })) },
    ];
}
