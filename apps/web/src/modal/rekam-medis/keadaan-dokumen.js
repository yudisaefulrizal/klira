import { filterLaporan, pembukaanMasukan, penyampaianMasukan, REKAM_MEDIS, resumeMasukan, suratMasukan } from '@klira/shared';
const petakan = (isu) => {
    const g = {};
    for (const i of isu ?? [])
        g[i.path.map(String).join('.') || ''] ??= i.message;
    return g;
};
/** Apakah sudah ada resume medis atau minimal satu surat keterangan yang bisa dicetak. */
export const bisaCetakDokumen = (d) => Boolean(d && (d.resume || (Array.isArray(d.surat) && d.surat.length > 0)));
/** Menyusun data lembar cetak resume medis dan surat keterangan satu kunjungan (fungsi murni, tanpa DOM). */
export function susunLembarDokumen({ dok, pasien = {}, kunjungan = {} }) {
    const R = REKAM_MEDIS.dok.resume, kj = dok?.kunjungan ?? {};
    const dokterBawaan = kunjungan.dpjp_nama ?? null;
    const resume = dok?.resume ? {
        versi: dok.resume.versi ?? 1,
        verifikasi: dok.resume.verifikasi ?? 'belum_disahkan',
        dokter: dok.resume.pengesahan?.pengguna_nama ?? dokterBawaan,
        waktu: dok.resume.pengesahan?.waktu ?? dok.resume.diperbarui_pada ?? null,
        baris: [
            { label: R.ringkasan, nilai: dok.resume.isi?.ringkasan || '-' },
            { label: R.diagnosis, nilai: dok.resume.isi?.diagnosis_akhir || '-' },
            { label: R.terapi, nilai: dok.resume.isi?.terapi || '-' },
            { label: R.kondisi, nilai: dok.resume.isi?.kondisi_pulang || '-' },
            { label: R.anjuran, nilai: dok.resume.isi?.anjuran || '-' },
        ],
    } : null;
    const surat = (dok?.surat ?? []).map((s) => ({
        id: s.id,
        nomor: s.nomor_surat,
        jenisLabel: R.jenisSurat[s.jenis] ?? s.jenis,
        tujuan: s.tujuan ?? null,
        isi: s.isi ?? '-',
        dokter: s.dokter_nama ?? dokterBawaan,
        waktu: s.dibuat_pada ?? null,
    }));
    return {
        kunjunganId: kunjungan.id ?? kj.id ?? null,
        poli: kunjungan.poli_nama ?? null,
        dokter: dokterBawaan,
        pasien: {
            nama: pasien.nama ?? kj.pasien_nama ?? '-',
            nomorRm: pasien.nomor_rm ?? kj.pasien_nomor_rm ?? '-',
        },
        resume,
        surat,
    };
}
/** Isi awal dari resume tersimpan; bila belum ada, dari saran (diagnosis dan tindakan kunjungan). */
export function awalResume(d) {
    const r = d?.resume?.isi;
    return {
        ringkasan: r?.ringkasan ?? '', diagnosis_akhir: r?.diagnosis_akhir ?? d?.saran.diagnosis_akhir ?? '', terapi: r?.terapi ?? d?.saran.terapi ?? '', kondisi_pulang: r?.kondisi_pulang ?? d?.saran.kondisi_pulang ?? '',
        anjuran: r?.anjuran ?? '', alasan: '', surat_jenis: 'rujukan', surat_tujuan: '', surat_isi: '',
    };
}
export const bentukResume = (k, ada) => ({
    ringkasan: k.ringkasan, diagnosis_akhir: k.diagnosis_akhir, terapi: k.terapi, kondisi_pulang: k.kondisi_pulang, anjuran: k.anjuran, ...(ada ? { alasan: k.alasan } : {}),
});
/** Resume tidak berubah dari yang tersimpan (tidak perlu disimpan ulang). */
export function resumeSama(k, d) {
    const r = d?.resume?.isi;
    return !!r && r.ringkasan === k.ringkasan.trim() && r.diagnosis_akhir === k.diagnosis_akhir.trim() && (r.terapi ?? '') === k.terapi.trim() && r.kondisi_pulang === k.kondisi_pulang.trim() && (r.anjuran ?? '') === k.anjuran.trim();
}
export const adaSuratBaru = (k) => k.surat_isi.trim().length > 0;
export const bentukSurat = (k) => ({ jenis: k.surat_jenis, tujuan: k.surat_tujuan, isi: k.surat_isi });
/** Galat per bidang; alasan wajib hanya bila resume sudah ada dan isinya berubah. Surat divalidasi hanya bila isinya diisi. */
export function galatResume(k, d) {
    const ada = !!d?.resume;
    const g = ada && resumeSama(k, d) ? {} : petakan(resumeMasukan.safeParse(bentukResume(k, ada)).error?.issues);
    if (ada && !resumeSama(k, d) && !k.alasan.trim())
        g.alasan = 'Alasan wajib untuk mengubah resume yang sudah disahkan.';
    if (adaSuratBaru(k))
        for (const [a, b] of Object.entries(petakan(suratMasukan.safeParse(bentukSurat(k)).error?.issues)))
            g[`surat_${a}`] = b;
    return g;
}
/** Indeks langkah pertama bermasalah (0 resume, 1 kondisi pulang, 2 surat) atau -1. */
export function langkahBermasalahResume(g) {
    if (g.ringkasan || g.diagnosis_akhir || g.terapi)
        return 0;
    if (g.kondisi_pulang || g.anjuran || g.alasan)
        return 1;
    if (g.surat_jenis || g.surat_tujuan || g.surat_isi)
        return 2;
    return -1;
}
export const awalPembukaan = () => ({ pasien_id: null, pemohon_nama: '', pemohon_instansi: '', dasar: 'hukum', alasan_hukum: '', dasar_rinci: '', cakupan: '', identitas_disamarkan: true });
export const bentukPembukaan = (k) => ({ ...k, pasien_id: k.pasien_id ?? 0, alasan_hukum: (k.alasan_hukum || undefined) });
export const galatPembukaan = (k) => petakan(pembukaanMasukan.safeParse(bentukPembukaan(k)).error?.issues);
export function langkahBermasalahPembukaan(g) {
    if (g.pasien_id || g.pemohon_nama || g.pemohon_instansi)
        return 0;
    if (g.dasar || g.alasan_hukum || g.dasar_rinci || g.cakupan)
        return 1;
    return -1;
}
export const awalPenyampaian = () => ({ pasien_id: null, penerima_nama: '', hubungan: 'pasien', bentuk: 'cetak', bukti_persetujuan: '', catatan: '' });
export const bentukPenyampaian = (k) => ({ ...k, pasien_id: k.pasien_id ?? 0 });
export const galatPenyampaian = (k) => petakan(penyampaianMasukan.safeParse(bentukPenyampaian(k)).error?.issues);
export const awalLaporan = () => ({ jenis: 'kunjungan_per_poli', dari: '', sampai: '' });
export const galatLaporan = (k) => petakan(filterLaporan.safeParse(k).error?.issues);
