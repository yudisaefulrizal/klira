import { admisiMasukan, catatanHarianMasukan, pemulanganMasukan, penempatanMasukan, TANDA_VITAL } from '@klira/shared';
const petakan = (isu) => {
    const g = {};
    for (const i of isu ?? [])
        g[i.path.map(String).join('.') || ''] ??= i.message;
    return g;
};
const idAtauNull = (v) => (v ? Number(v) : null);
export const awalAdmisi = () => ({ pasien_id: null, bed_id: '', kelas: 'tiga', indikator: 'kelas_tetap', tarif_id: '', dpjp_id: '', dpjp_bersama: [], spri: '', keluhan_singkat: '', cara_pembayaran: 'umum' });
export const bentukAdmisi = (k) => ({
    pasien_id: k.pasien_id ?? 0, bed_id: idAtauNull(k.bed_id), kelas: k.kelas, indikator: k.indikator, tarif_id: idAtauNull(k.tarif_id), dpjp_id: Number(k.dpjp_id) || 0,
    dpjp_bersama: k.dpjp_bersama.map(Number), spri: k.spri, keluhan_singkat: k.keluhan_singkat, cara_pembayaran: k.cara_pembayaran,
});
export const galatAdmisi = (k) => petakan(admisiMasukan.safeParse(bentukAdmisi(k)).error?.issues);
/** Isi spri dari kunjungan rawat jalan asal hanya bila belum diisi. */
export const isiSpriAsal = (k, spri) => (k.spri || !spri ? k : { ...k, spri });
/** Indeks langkah pertama bermasalah (0 pasien, 1 ruang dan kelas, 2 DPJP) atau -1. */
export function langkahBermasalahAdmisi(g) {
    if (g.pasien_id)
        return 0;
    if (g.bed_id || g.kelas || g.indikator || g.tarif_id)
        return 1;
    if (g.dpjp_id || g.dpjp_bersama)
        return 2;
    return -1;
}
export function awalPenempatan(d) {
    const aktif = d?.penempatan.find((x) => !x.selesai);
    return {
        bed_id: '', kelas: aktif?.kelas ?? 'tiga', indikator: aktif?.indikator ?? 'kelas_tetap', tarif_id: aktif?.tarif_id ? String(aktif.tarif_id) : '', dpjp_id: String(d?.dpjp.find((x) => x.tipe === 'ATND')?.id ?? ''),
        dpjp_bersama: (d?.dpjp.filter((x) => x.tipe === 'SPRF') ?? []).map((x) => String(x.id)), alasan: '',
    };
}
export const bentukPenempatan = (k) => ({
    bed_id: idAtauNull(k.bed_id), kelas: k.kelas, indikator: k.indikator, tarif_id: idAtauNull(k.tarif_id), dpjp_id: Number(k.dpjp_id) || 0, dpjp_bersama: k.dpjp_bersama.map(Number), alasan: k.alasan,
});
export const galatPenempatan = (k) => petakan(penempatanMasukan.safeParse(bentukPenempatan(k)).error?.issues);
export const awalCatatan = () => ({ subjektif: '', objektif: '', asesmen: '', rencana: '', instruksi: '', tanda_vital: Object.fromEntries(TANDA_VITAL.map((t) => [t.kunci, ''])) });
const adaTandaVital = (k) => Object.values(k.tanda_vital).some((v) => v.trim() !== '');
export const bentukCatatan = (k) => ({
    subjektif: k.subjektif, objektif: k.objektif, asesmen: k.asesmen, rencana: k.rencana, instruksi: k.instruksi, tanda_vital: adaTandaVital(k) ? k.tanda_vital : null,
});
export const galatCatatan = (k) => petakan(catatanHarianMasukan.safeParse(bentukCatatan(k)).error?.issues);
export const awalPulang = () => ({ ringkasan: '', diagnosis_akhir: '', terapi: '', disposisi: 'home', kondisi_pulang: '', tindak_lanjut: '', buat_resume: true });
export const bentukPulang = (k) => ({ ...k, disposisi: k.disposisi });
export const galatPulang = (k) => petakan(pemulanganMasukan.safeParse(bentukPulang(k)).error?.issues);
export function langkahBermasalahPulang(g) {
    if (g.ringkasan)
        return 0;
    if (g.diagnosis_akhir)
        return 1;
    if (g.disposisi || g.kondisi_pulang)
        return 2;
    return -1;
}
