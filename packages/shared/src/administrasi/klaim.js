/** Aturan murni siklus klaim JKN/BPJS FKTP (bagian 4.5 dan 7): batas pengajuan, pengajuan ulang, transisi status, kelengkapan berkas. */
/** Berkas klaim FKTP (Perbpjs 7/2018 P12) dan tambahan klaim rawat inap (P14). */
export const BERKAS_KLAIM = ['fpk', 'rekapitulasi', 'kuitansi', 'surat_tanggung_jawab', 'spri', 'ringkasan_rm'];
export const BERKAS_WAJIB_RAWAT_JALAN = ['fpk', 'rekapitulasi', 'kuitansi', 'surat_tanggung_jawab'];
export const BERKAS_WAJIB_RAWAT_INAP = [...BERKAS_WAJIB_RAWAT_JALAN, 'spri', 'ringkasan_rm'];
export const berkasWajib = (jenis) => (jenis === 'IMP' ? BERKAS_WAJIB_RAWAT_INAP : BERKAS_WAJIB_RAWAT_JALAN);
export const BATAS_KLAIM_BULAN = 6;
/** Peringatan batas mendekat: sisa hari sampai batas. */
export const AMBANG_BATAS_DEKAT_HARI = 30;
const HARI_MS = 86_400_000;
const WIB_MS = 7 * 3_600_000;
const tglWib = (d) => {
    const w = new Date(d.getTime() + WIB_MS);
    return { y: w.getUTCFullYear(), m: w.getUTCMonth(), h: w.getUTCDate() };
};
/** Akhir hari menurut WIB (23:59:59.999) untuk tanggal bulan-tahun yang diberikan. */
const akhirHariWib = (y, m, h) => new Date(Date.UTC(y, m, h, 23, 59, 59, 999) - WIB_MS);
const hariTerakhir = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
/** Batas pengajuan: 6 bulan sejak pelayanan selesai, sampai akhir hari (WIB); 31 Agustus + 6 bulan menjadi 28/29 Februari. */
export function batasPengajuan(selesai) {
    const { y, m, h } = tglWib(selesai);
    const bulan = m + BATAS_KLAIM_BULAN;
    const ty = y + Math.floor(bulan / 12);
    const tm = bulan % 12;
    return akhirHariWib(ty, tm, Math.min(h, hariTerakhir(ty, tm)));
}
/** Batas ajukan ulang berkas yang dikembalikan: paling lambat pada pengajuan klaim bulan berikutnya, yakni akhir bulan berikutnya (WIB) (Perbpjs 7/2018 P29). */
export function batasAjukanUlang(dikembalikan) {
    const { y, m } = tglWib(dikembalikan);
    const ty = y + Math.floor((m + 1) / 12);
    const tm = (m + 1) % 12;
    return akhirHariWib(ty, tm, hariTerakhir(ty, tm));
}
/** Status efektif: klaim yang belum diajukan melewati batas pengajuan, atau yang dikembalikan melewati batas ajukan ulang, berstatus lewat batas waktu. */
export function statusKlaimEfektif(k, sekarang) {
    if ((k.status === 'menunggu_sep' || k.status === 'siap_diajukan') && sekarang.getTime() > k.batas_pengajuan.getTime())
        return 'lewat_batas_waktu';
    if (k.status === 'dikembalikan' && k.batas_ajukan_ulang && sekarang.getTime() > k.batas_ajukan_ulang.getTime())
        return 'lewat_batas_waktu';
    return k.status;
}
/** Sisa hari (dibulatkan ke atas) sampai batas yang berlaku bagi klaim yang belum final; null bila tidak berlaku. */
export function sisaHariBatas(k, sekarang) {
    const batas = k.status === 'dikembalikan' ? k.batas_ajukan_ulang : k.status === 'menunggu_sep' || k.status === 'siap_diajukan' ? k.batas_pengajuan : null;
    return batas ? Math.ceil((batas.getTime() - sekarang.getTime()) / HARI_MS) : null;
}
export const AKSI_KLAIM = ['ajukan', 'dikembalikan', 'ajukan_ulang', 'ditolak', 'dibayar'];
/** Aksi yang sah dari status efektif dan status tujuannya. */
export const TRANSISI_KLAIM = {
    ajukan: { dari: ['siap_diajukan'], ke: 'diajukan' },
    dikembalikan: { dari: ['diajukan', 'diajukan_ulang'], ke: 'dikembalikan' },
    ajukan_ulang: { dari: ['dikembalikan'], ke: 'diajukan_ulang' },
    ditolak: { dari: ['diajukan', 'diajukan_ulang'], ke: 'ditolak' },
    dibayar: { dari: ['diajukan', 'diajukan_ulang'], ke: 'dibayar' },
};
export const aksiKlaimTersedia = (status) => AKSI_KLAIM.filter((a) => TRANSISI_KLAIM[a].dari.includes(status));
/** Status awal klaim: siap diajukan hanya bila nomor SEP ada, semua berkas wajib lengkap (rawat inap juga butuh resume medis); selain itu menunggu SEP atau berkas. */
export function statusAwalKlaim(d) {
    const lengkap = berkasWajib(d.jenis).every((b) => d.berkas.includes(b)) && (d.jenis !== 'IMP' || d.resume_ada);
    return d.nomor_sep?.trim() && lengkap ? 'siap_diajukan' : 'menunggu_sep';
}
/** Berkas wajib yang belum lengkap. */
export const berkasKurang = (jenis, berkas) => berkasWajib(jenis).filter((b) => !berkas.includes(b));
/** Kode klaim harus sama dengan rekam medis (PMK 24/2022 P19): kumpulan kode diagnosis dan tindakan, tanpa melihat urutan. */
export function kodeKlaimBeda(klaim, rm) {
    const kunci = (x) => [...new Set(x.map((k) => k.kode))].sort().join('|');
    return kunci(klaim.diagnosis) !== kunci(rm.diagnosis) || kunci(klaim.tindakan) !== kunci(rm.tindakan);
}
