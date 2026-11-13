import { kunjunganMasukan } from '@klira/shared';
export const awalKunjungan = (pasienId) => ({
    pasien_id: pasienId ? String(pasienId) : '', jenis: 'AMB', jenis_poli: '', dpjp_id: '', cara_pembayaran: 'umum', nomor_sep: '', keluhan_singkat: '',
});
export function bentukKunjungan(k) {
    return {
        pasien_id: Number(k.pasien_id) || 0,
        jenis: k.jenis,
        jenis_poli: k.jenis === 'AMB' ? (k.jenis_poli || undefined) : undefined,
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
/** Dokter yang bertugas di salah satu poli jenis itu (jadwal praktik aktif); jenis kosong = tidak ada pilihan. */
export function dokterPoli(dpjp, jenisPoli) {
    const kunci = String(jenisPoli ?? '').trim().toLowerCase();
    return kunci === '' ? [] : dpjp.filter((d) => (d.jenis_poli ?? []).some((j) => j.toLowerCase() === kunci));
}
/**
 * Perubahan jenis layanan, jenis poli, atau cara pembayaran membersihkan isian yang tidak berlaku. Saat jenis poli berganti,
 * dokter yang tidak bertugas di poli jenis itu dikosongkan. Dokter bersifat opsional (pasien boleh minta dokter tertentu).
 */
export function ubahKunjungan(k, p, dpjp = []) {
    const baru = { ...k, ...p };
    if (baru.cara_pembayaran !== 'jkn')
        baru.nomor_sep = '';
    if (baru.jenis !== 'AMB')
        baru.jenis_poli = '';
    if (baru.jenis_poli !== k.jenis_poli || baru.jenis !== 'AMB') {
        const calon = dokterPoli(dpjp, baru.jenis_poli);
        if (!calon.some((d) => String(d.id) === baru.dpjp_id))
            baru.dpjp_id = '';
    }
    return baru;
}
/** Keterangan asuransi pasien untuk cara bayar Asuransi lain: baris baca saja, atau null bila data asuransi belum diisi. */
export function keteranganAsuransi(p) {
    const nama = p?.asuransi_nama?.trim() || null;
    const polis = p?.asuransi_nomor_polis?.trim() || null;
    return nama || polis ? { nama, polis } : null;
}
