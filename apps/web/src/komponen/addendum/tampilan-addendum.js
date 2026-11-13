import { ADDENDUM_TEKS, INTERPRETASI_HASIL, STATUS_PENGESAHAN } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { Lencana } from '../ui/lencana.js';
import { Kisi, Tumbuh } from '../ui/susunan.js';
/** Urutan bidang isi addendum yang ditampilkan; isi lain yang tak dikenal tidak ditampilkan mentah. */
const BIDANG = ['pemeriksaan', 'nilai', 'satuan', 'interpretasi', 'rujukan', 'catatan', 'kode_loinc'];
const teksIsi = (k, v) => {
    if (v === null || v === undefined || v === '')
        return '-';
    if (k === 'interpretasi')
        return INTERPRETASI_HASIL.nilai.includes(v) ? INTERPRETASI_HASIL.label(v) : String(v);
    return String(v);
};
/**
 * Tampilan addendum (4.2): isi susulan, versi, pengesah, dan penanda kirim ulang. Dipakai berkas hasil dan panel; CPPT dan resume nanti memakai
 * komponen yang sama. Addendum hanya dibaca (tidak menimpa catatan yang sudah disahkan).
 */
export function TampilanAddendum({ daftar }) {
    if (!daftar.length)
        return null;
    return jarak = "sm" >
        { daftar, : .map((a) => key = { a, : .id }, arah = "kolom", halus >
                bungkus >
                { ADDENDUM_TEKS, : .versi(a.versi) } < /strong>
                < Lencana, warna = { STATUS_PENGESAHAN, : .warna(a.verifikasi) } > { STATUS_PENGESAHAN, : .label(a.verifikasi) } < /Lencana>
                < Tumbuh, style = {}, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }) } > { tanggalWaktuPendek(a) { }, : .waktu } < /Tumbuh>
        < Lencana;
    warna = { a, : .perlu_kirim_ulang ? 'kuning' : 'hijau' } > { a, : .perlu_kirim_ulang ? ADDENDUM_TEKS.kirimUlang : ADDENDUM_TEKS.terkirim } < /Lencana>
        < /Sebaris>
        < Kisi;
    tag = "dl";
    kolom = "max-content 1fr";
    jarakBaris = "xs" >
        { BIDANG, : .filter((k) => k in a.isi).map((k) => key = { k }, label = { ADDENDUM_TEKS, : .isiLabel[k] ?? k }, nilai = { teksIsi(k, a) { }, : .isi[k] }) } /  >
    ;
}
/Kisi>
    < span;
style = {};
{
    color: token.warna.teksRedup, fontSize;
    token.huruf.ukuran.kecil;
}
 >
    { a, : .pengesahan ? ADDENDUM_TEKS.disahkanOleh(a.pengesahan.pengguna_nama, a.pengesahan.jenis_akun) : ADDENDUM_TEKS.oleh(a.dibuat_oleh_nama ?? '-') }
    < /span>
    < /Bingkai>;
/Kolom>;
;
