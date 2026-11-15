import { REGISTRASI, registrasiPasienMasukan } from '@klira/shared';
/** Bidang yang tidak boleh masuk draf lokal: identitas, kontak, penjamin (JKN dan asuransi), wali, persetujuan (komputer bersama). */
export const BIDANG_SENSITIF_REGISTRASI = [
    'nama', 'nomor_hp', 'nik', 'tanggal_lahir', 'ibu_kandung', 'tempat_lahir', 'alamat', 'kode_wilayah', 'nomor_paspor', 'nomor_kitas', 'wali',
    'jkn_nomor_kartu', 'asuransi_nama', 'asuransi_nomor_polis', 'setuju', 'konfirmasi_duplikat',
];
export const awalRegistrasi = () => ({
    nama: '', nomor_hp: '', nik: '', tanggal_lahir: '', ibu_kandung: '', tempat_lahir: '', jenis_kelamin: '', tidak_cakap: false,
    agama: '', suku: '', bahasa: '', pekerjaan: '', pendidikan: '', status_kawin: '',
    alamat: '', kode_wilayah: '', jalur_identitas: 'nik', nomor_paspor: '', nomor_kitas: '',
    wali: [], jkn_nomor_kartu: '', asuransi_nama: '', asuransi_nomor_polis: '',
    bentuk: 'lisan', penandatangan: 'pasien', wali_ke: '', setuju: false, konfirmasi_duplikat: false,
});
/** Bentuk permintaan API dari isian (skema bersama di packages/shared memvalidasi dan menormalkan). */
export function bentukRegistrasi(k, teksId) {
    const wali = k.penandatangan === 'wali' && k.wali_ke !== '' ? Number(k.wali_ke) : null;
    return {
        jalur_identitas: k.jalur_identitas,
        nik: k.jalur_identitas === 'tanpa_identitas' ? undefined : k.nik,
        nama: k.nama,
        nomor_hp: k.nomor_hp,
        ibu_kandung: k.ibu_kandung,
        tempat_lahir: k.tempat_lahir,
        tanggal_lahir: k.tanggal_lahir,
        jenis_kelamin: k.jenis_kelamin,
        agama: k.agama, suku: k.suku, bahasa: k.bahasa, pekerjaan: k.pekerjaan, pendidikan: k.pendidikan, status_kawin: k.status_kawin,
        kode_wilayah: k.kode_wilayah,
        nomor_paspor: k.jalur_identitas === 'paspor' ? k.nomor_paspor : undefined,
        nomor_kitas: k.jalur_identitas === 'kitas' ? k.nomor_kitas : undefined,
        jkn_nomor_kartu: k.jkn_nomor_kartu, asuransi_nama: k.asuransi_nama, asuransi_nomor_polis: k.asuransi_nomor_polis,
        tidak_cakap: k.tidak_cakap,
        wali: k.wali.map((w) => ({ hubungan: w.hubungan, nama: w.nama, kontak: w.kontak })),
        persetujuan: {
            teks_persetujuan_id: teksId ?? 0,
            bentuk: k.bentuk,
            penandatangan: k.penandatangan,
            wali_ke: wali !== null && Number.isInteger(wali) ? wali : null,
            setuju: k.setuju,
        },
        konfirmasi_duplikat: k.konfirmasi_duplikat,
    };
}
/**
 * Galat registrasi (satu formulir): `bidang` per jalur isian untuk ditandai, dan `pesan` berurutan menurut letak di formulir
 * (data ganda lebih dulu, lalu isian menurut skema bersama, lalu general consent). Validasi isian memakai skema Zod bersama;
 * kandidat data ganda harus ditinjau (NIK sama memblokir, selain itu dinyatakan berbeda).
 */
export function galatRegistrasi(k, teksId, kandidat) {
    const pesan = [];
    const bidang = {};
    if (kandidat?.some((c) => c.alasan === 'nik'))
        pesan.push(REGISTRASI.duplikatNikBlokir);
    else if (kandidat?.length && !k.konfirmasi_duplikat)
        pesan.push(REGISTRASI.duplikatPerluTinjau);
    const r = registrasiPasienMasukan.safeParse(bentukRegistrasi(k, teksId));
    if (!r.success) {
        for (const i of r.error.issues) {
            const jalur = i.path.join('.');
            if (bidang[jalur] === undefined) {
                bidang[jalur] = i.message;
                pesan.push(i.message);
            }
        }
    }
    if (teksId === null) {
        bidang['persetujuan.teks_persetujuan_id'] = REGISTRASI.consentTidakAda;
        pesan.push(REGISTRASI.consentTidakAda);
    }
    return { pesan, bidang };
}
/** Cukup data untuk mencari duplikat: NIK 16 digit, atau nama dengan tanggal lahir dan ibu kandung. */
export const bisaCariDuplikat = (k) => /^\d{16}$/.test(k.nik) || (!!k.nama.trim() && !!k.tanggal_lahir && !!k.ibu_kandung.trim());
/** Isian pencarian duplikat; kosong tidak dikirim. */
export function isianCariDuplikat(k) {
    return {
        ...(/^\d{16}$/.test(k.nik) ? { nik: k.nik } : {}),
        ...(k.nama.trim() ? { nama: k.nama.trim() } : {}),
        ...(k.tanggal_lahir ? { tanggal_lahir: k.tanggal_lahir } : {}),
        ...(k.ibu_kandung.trim() ? { ibu_kandung: k.ibu_kandung.trim() } : {}),
    };
}
/** Bidang kunci pencarian duplikat: mengubahnya membuat hasil pencarian lama tidak berlaku. */
export const BIDANG_KUNCI_DUPLIKAT = ['nik', 'nama', 'tanggal_lahir', 'ibu_kandung'];
/** Isian yang bergantung jalur identitas dikosongkan saat jalur berubah (pasien tanpa identitas tidak ber-NIK). */
export function ubahJalur(k, jalur) {
    return {
        ...k,
        jalur_identitas: jalur,
        nik: jalur === 'tanpa_identitas' ? '' : k.nik,
        nomor_paspor: jalur === 'paspor' ? k.nomor_paspor : '',
        nomor_kitas: jalur === 'kitas' ? k.nomor_kitas : '',
        konfirmasi_duplikat: false,
    };
}
/** Pasien tidak cakap ditandatangani wali; kembali ke pasien bila tidak ada wali yang bisa dipilih. */
export function ubahTidakCakap(k, tidakCakap) {
    return { ...k, tidak_cakap: tidakCakap, ...(tidakCakap ? { penandatangan: 'wali' } : {}) };
}
/** Hapus wali ke-n dan jaga penunjuk wali penandatangan tetap sah. */
export function hapusWali(k, n) {
    const wali = k.wali.filter((_, i) => i !== n);
    const ke = k.wali_ke === '' ? -1 : Number(k.wali_ke);
    const waliKe = ke === n ? '' : ke > n ? String(ke - 1) : k.wali_ke;
    return { ...k, wali, wali_ke: waliKe, ...(wali.length === 0 && !k.tidak_cakap ? { penandatangan: 'pasien', wali_ke: '' } : {}) };
}
