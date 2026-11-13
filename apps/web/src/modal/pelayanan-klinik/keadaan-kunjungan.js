import { kunjunganMasukan } from '@klira/shared';
export const awalKunjungan = (pasienId) => ({
    pasien_id: pasienId ? String(pasienId) : '', jenis: 'AMB', lokasi_id: '', dpjp_id: '', cara_pembayaran: 'umum', nomor_sep: '', keluhan_singkat: '',
});
const angka = (t) => (t === '' ? undefined : Number(t));
export function bentukKunjungan(k) {
    return {
        pasien_id: Number(k.pasien_id) || 0,
        jenis: k.jenis,
        lokasi_id: k.jenis === 'AMB' ? angka(k.lokasi_id) : undefined,
        ...(k.jenis === 'AMB' && k.dpjp_id ? { dpjp_id: Number(k.dpjp_id) } : {}),
        cara_pembayaran: k.cara_pembayaran,
        nomor_sep: k.cara_pembayaran === 'jkn' ? k.nomor_sep : undefined,
        keluhan_singkat: k.keluhan_singkat,
    };
}
/** Galat per bidang dari skema bersama (kunci = nama bidang). */
export function galatKunjungan(k) {
    const r = kunjunganMasukan.safeParse(bentukKunjungan(k));
    const hasil = {};
    if (!r.success)
        for (const i of r.error.issues)
            hasil[String(i.path[0])] ??= i.message;
    return hasil;
}
/** Dokter yang bertugas di poli (jadwal praktik aktif); poli kosong = tidak ada pilihan. */
export function dokterPoli(dpjp, lokasiId) {
    const id = Number(lokasiId);
    return lokasiId === '' ? [] : dpjp.filter((d) => d.poli_ids.includes(id));
}
/**
 * Perubahan jenis, poli, atau cara pembayaran membersihkan isian yang tidak berlaku. Saat poli berganti, dokter yang
 * tidak bertugas di poli baru dikosongkan; bila poli hanya punya satu dokter, dokter itu terpilih otomatis.
 */
export function ubahKunjungan(k, p, dpjp = []) {
    const baru = { ...k, ...p };
    if (baru.cara_pembayaran !== 'jkn')
        baru.nomor_sep = '';
    if (baru.jenis !== 'AMB')
        baru.lokasi_id = '';
    if (baru.lokasi_id !== k.lokasi_id || baru.jenis !== 'AMB') {
        const calon = dokterPoli(dpjp, baru.lokasi_id);
        if (!calon.some((d) => String(d.id) === baru.dpjp_id))
            baru.dpjp_id = '';
        if (calon.length === 1 && baru.lokasi_id !== k.lokasi_id)
            baru.dpjp_id = String(calon[0].id);
    }
    return baru;
}
/** Keterangan asuransi pasien untuk cara bayar Asuransi lain: baris baca saja, atau null bila data asuransi belum diisi. */
export function keteranganAsuransi(p) {
    const nama = p?.asuransi_nama?.trim() || null;
    const polis = p?.asuransi_nomor_polis?.trim() || null;
    return nama || polis ? { nama, polis } : null;
}
