import { BUTIR_PERJANJIAN, dpiaMasukan, hakMasukan, insidenMasukan, pemberitahuanMasukan, pemusnahanMasukan, prosesHakMasukan, prosesorMasukan, prosesPemusnahanMasukan, ropaMasukan, tarikMasukan, } from '@klira/shared';
const petakan = (isu) => {
    const g = {};
    for (const i of isu ?? [])
        g[i.path.map(String).join('.') || ''] ??= i.message;
    return g;
};
const idAtauNull = (v) => (v ? Number(v) : null);
/** Waktu dari ISO ke bentuk datetime-local (WIB) untuk isian. */
export const keIsianWaktu = (iso) => (iso ? new Date(new Date(iso).getTime() + 7 * 3_600_000).toISOString().slice(0, 16) : '');
export const awalHak = () => ({ pasien_id: null, jenis: '', saluran: 'langsung', pemohon_nama: '', pemohon_hubungan: 'pasien', verifikasi: '', rincian: '' });
export const bentukHak = (k) => ({ ...k, pasien_id: k.pasien_id ?? 0, jenis: k.jenis, saluran: k.saluran, pemohon_hubungan: k.pemohon_hubungan });
export const galatHak = (k) => petakan(hakMasukan.safeParse(bentukHak(k)).error?.issues);
export function langkahBermasalahHak(g) {
    if (g.pasien_id || g.pemohon_nama || g.pemohon_hubungan || g.saluran || g.verifikasi)
        return 0;
    if (g.jenis || g.rincian)
        return 1;
    return -1;
}
export const awalProsesHak = () => ({ keputusan: '', alasan: '', pelaksanaan: '', catatan: '' });
export function bentukProsesHak(tahap, k) {
    if (tahap === 'keputusan')
        return { tahap, keputusan: k.keputusan, alasan: k.alasan };
    if (tahap === 'pelaksanaan')
        return { tahap, pelaksanaan: k.pelaksanaan };
    return { tahap, catatan: k.catatan };
}
export const galatProsesHak = (tahap, k) => petakan(prosesHakMasukan.safeParse(bentukProsesHak(tahap, k)).error?.issues);
/** Indeks langkah modal proses (0 tinjau, 1 keputusan, 2 pelaksanaan, 3 notifikasi) untuk tahap berikutnya. */
export const indeksTahapHak = (tahap) => (tahap === 'keputusan' ? 1 : tahap === 'pelaksanaan' ? 2 : tahap === 'notifikasi' ? 3 : 0);
export const awalPemberitahuan = (dari) => ({ judul: dari?.judul ?? '', tujuan: dari?.tujuan ?? '', isi: dari?.isi ?? '' });
export const galatPemberitahuan = (k) => petakan(pemberitahuanMasukan.safeParse(k).error?.issues);
export const galatTarik = (persetujuanId, alasan) => petakan(tarikMasukan.safeParse({ persetujuan_id: persetujuanId, alasan }).error?.issues);
// ---- ROPA ----
export const KUNCI_ROPA = ['nama_kegiatan', 'ppdp_nama', 'sumber_tujuan', 'dasar', 'tujuan', 'jenis_data', 'kategori_subjek', 'pihak_akses', 'pemenuhan_hak', 'aliran', 'masa_retensi', 'pengamanan', 'transfer'];
export const awalRopa = (r) => Object.fromEntries(KUNCI_ROPA.map((k) => [k, r?.[k] ?? (k === 'transfer' && !r ? 'Tidak ada transfer ke luar negeri' : '')]));
export const galatRopa = (k) => petakan(ropaMasukan.safeParse(k).error?.issues);
export function langkahBermasalahRopa(g) {
    if (g.nama_kegiatan || g.ppdp_nama || g.sumber_tujuan)
        return 0;
    if (g.dasar || g.tujuan || g.jenis_data || g.kategori_subjek)
        return 1;
    if (g.pihak_akses || g.pemenuhan_hak || g.aliran)
        return 2;
    if (g.masa_retensi || g.pengamanan || g.transfer)
        return 3;
    return -1;
}
export const awalDpia = (d) => ({ pemrosesan: d?.pemrosesan ?? '', ropa_id: d?.ropa_id ? String(d.ropa_id) : '', risiko: d?.risiko ?? '', mitigasi: d?.mitigasi ?? '', saran_ppdp: d?.saran_ppdp ?? '', tinjau_ulang_pada: d?.tinjau_ulang_pada ?? '', tandai_ditinjau: false });
export const bentukDpia = (k) => ({ ...k, ropa_id: idAtauNull(k.ropa_id) });
export const galatDpia = (k) => petakan(dpiaMasukan.safeParse(bentukDpia(k)).error?.issues);
export function langkahBermasalahDpia(g) {
    if (g.pemrosesan || g.risiko)
        return 0;
    if (g.mitigasi)
        return 1;
    if (g.saran_ppdp)
        return 2;
    if (g.tinjau_ulang_pada)
        return 3;
    return -1;
}
export const awalInsiden = (i) => ({
    waktu_kejadian: keIsianWaktu(i?.waktu_kejadian ?? null), waktu_diketahui: keIsianWaktu(i?.waktu_diketahui ?? null), siber: i?.siber ?? false, uraian: i?.uraian ?? '', data_terungkap: i?.data_terungkap ?? '', pasien: i?.pasien ?? [],
    penanganan: i?.penanganan ?? '', pemulihan: i?.pemulihan ?? '', kontak_ppdp: i?.kontak_ppdp ?? '', notifikasi_pasien_pada: keIsianWaktu(i?.notifikasi_pasien_pada ?? null), notifikasi_lembaga_pada: keIsianWaktu(i?.notifikasi_lembaga_pada ?? null),
});
export const bentukInsiden = (k) => ({ ...k, pasien_ids: k.pasien.map((p) => p.id) });
export const galatInsiden = (k) => petakan(insidenMasukan.safeParse(bentukInsiden(k)).error?.issues);
export const tambahPasienTerdampak = (k, p) => (k.pasien.some((x) => x.id === p.id) ? k : { ...k, pasien: [...k.pasien, p] });
export const buangPasienTerdampak = (k, id) => ({ ...k, pasien: k.pasien.filter((p) => p.id !== id) });
export function langkahBermasalahInsiden(g) {
    if (g.waktu_kejadian || g.waktu_diketahui || g.uraian)
        return 0;
    if (g.data_terungkap || g.pasien_ids)
        return 1;
    if (g.penanganan || g.pemulihan || g.kontak_ppdp)
        return 2;
    if (g.notifikasi_pasien_pada || g.notifikasi_lembaga_pada)
        return 3;
    return -1;
}
export const awalRencanaMusnah = () => ({ cakupan: '', dasar: 'retensi_habis', permintaan_hak_id: '', pasien_id: null, jadwal: '' });
export const bentukRencanaMusnah = (k) => ({ ...k, dasar: k.dasar, permintaan_hak_id: idAtauNull(k.permintaan_hak_id) });
export const galatRencanaMusnah = (k) => petakan(pemusnahanMasukan.safeParse(bentukRencanaMusnah(k)).error?.issues);
export const awalProsesMusnah = () => ({ prosesor_id: '', nomor_perintah: '', pelaksana: '', metode: '', mencakup_cadangan: false, pelaksanaan_pada: '', berita_acara: '' });
export function bentukProsesMusnah(tahap, k) {
    if (tahap === 'perintah')
        return { tahap, prosesor_id: Number(k.prosesor_id) || 0, nomor_perintah: k.nomor_perintah };
    if (tahap === 'pelaksanaan')
        return { tahap, pelaksana: k.pelaksana, metode: k.metode, mencakup_cadangan: k.mencakup_cadangan, pelaksanaan_pada: k.pelaksanaan_pada };
    return { tahap, berita_acara: k.berita_acara };
}
/** Tahap pelaksanaan menuntut cadangan dan salinan prosesor ikut dimusnahkan. */
export function galatProsesMusnah(tahap, k, pesanCadangan) {
    const g = petakan(prosesPemusnahanMasukan.safeParse(bentukProsesMusnah(tahap, k)).error?.issues);
    if (tahap === 'pelaksanaan' && !k.mencakup_cadangan)
        g.mencakup_cadangan = pesanCadangan;
    return g;
}
/** Indeks langkah modal pemusnahan (0 data, 1 perintah, 2 pelaksanaan, 3 berita acara) untuk tahap berikutnya. */
export const indeksTahapMusnah = (tahap) => (tahap === 'perintah' ? 1 : tahap === 'pelaksanaan' ? 2 : tahap === 'berita_acara' ? 3 : 0);
export const awalProsesor = (p) => ({
    nama: p?.nama ?? '', layanan: p?.layanan ?? '', lokasi_data: p?.lokasi_data ?? '', nomor_perjanjian: p?.nomor_perjanjian ?? '', butir: p?.butir_perjanjian ?? [], sub: p?.sub_prosesor ?? [], sla: p?.sla_lapor_jam ? String(p.sla_lapor_jam) : '', aktif: p?.aktif ?? true,
});
export const bentukProsesor = (k) => ({ nama: k.nama, layanan: k.layanan, lokasi_data: k.lokasi_data, nomor_perjanjian: k.nomor_perjanjian, butir_perjanjian: k.butir, sub_prosesor: k.sub, sla_lapor_jam: k.sla, aktif: k.aktif });
export const galatProsesor = (k) => petakan(prosesorMasukan.safeParse(bentukProsesor(k)).error?.issues);
export function alihButir(k, butir, ada) {
    const set = new Set(k.butir);
    if (ada)
        set.add(butir);
    else
        set.delete(butir);
    return { ...k, butir: BUTIR_PERJANJIAN.filter((b) => set.has(b)) };
}
export function langkahBermasalahProsesor(g) {
    if (g.nama || g.layanan || g.lokasi_data || g.nomor_perjanjian)
        return 0;
    if (g.butir_perjanjian)
        return 1;
    if (Object.keys(g).some((x) => x.startsWith('sub_prosesor') || x === 'sla_lapor_jam'))
        return 2;
    return -1;
}
