import { DAFTAR_PASIEN, REGISTRASI, registrasiPasienMasukan, statusIdentitasDari, STATUS_IDENTITAS } from '@klira/shared';
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
export const JUMLAH_LANGKAH_REGISTRASI = 6;
const L = { identitas: 0, sosial: 1, wali: 2, penjamin: 3, consent: 4, ringkasan: 5 };
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
const LANGKAH_BIDANG = {
    nomor_hp: L.identitas, nama: L.identitas, nik: L.identitas, tanggal_lahir: L.identitas, ibu_kandung: L.identitas, tempat_lahir: L.identitas, jenis_kelamin: L.identitas,
    tidak_cakap: L.identitas,
    agama: L.sosial, suku: L.sosial, bahasa: L.sosial, pekerjaan: L.sosial, pendidikan: L.sosial, status_kawin: L.sosial,
    alamat: L.identitas, kode_wilayah: L.identitas, jalur_identitas: L.identitas, nomor_paspor: L.identitas, nomor_kitas: L.identitas,
    wali: L.wali,
    jkn_nomor_kartu: L.penjamin, asuransi_nama: L.penjamin, asuransi_nomor_polis: L.penjamin,
    persetujuan: L.consent,
};
/**
 * Galat per langkah dan per bidang. Validasi isian memakai skema Zod bersama; langkah Identitas memakai
 * aturan tambahan: kandidat harus ditinjau (NIK sama memblokir, selain itu dinyatakan berbeda).
 */
export function galatRegistrasi(k, teksId, kandidat) {
    const perLangkah = Array(JUMLAH_LANGKAH_REGISTRASI).fill(null);
    const bidang = {};
    const r = registrasiPasienMasukan.safeParse(bentukRegistrasi(k, teksId));
    if (!r.success) {
        for (const i of r.error.issues) {
            const jalur = i.path.join('.');
            bidang[jalur] ??= i.message;
            const langkah = LANGKAH_BIDANG[String(i.path[0])];
            if (langkah !== undefined)
                perLangkah[langkah] ??= i.message;
        }
    }
    if (teksId === null) {
        bidang['persetujuan.teks_persetujuan_id'] = REGISTRASI.consentTidakAda;
        perLangkah[L.consent] ??= REGISTRASI.consentTidakAda;
    }
    if (kandidat?.some((c) => c.alasan === 'nik'))
        perLangkah[L.identitas] = REGISTRASI.duplikatNikBlokir;
    else if (kandidat?.length && !k.konfirmasi_duplikat)
        perLangkah[L.identitas] = REGISTRASI.duplikatPerluTinjau;
    return { perLangkah, bidang };
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
const nilai = (v) => (v && v.trim() ? v.trim() : REGISTRASI.kosongStrip);
/** Ringkasan pada langkah terakhir. */
export function ringkasanRegistrasi(k, teks) {
    const d = DAFTAR_PASIEN.detail;
    const R = REGISTRASI.ringkasanJudul;
    const penandatangan = k.penandatangan === 'wali' && k.wali_ke !== '' ? k.wali[Number(k.wali_ke)]?.nama : undefined;
    return [
        {
            judul: R.identitas,
            baris: [
                { label: d.nama, nilai: nilai(k.nama) }, { label: d.nik, nilai: nilai(k.nik) }, { label: d.tanggalLahir, nilai: nilai(k.tanggal_lahir) },
                { label: 'Nomor HP pasien', nilai: nilai(k.nomor_hp) }, { label: d.ibu, nilai: nilai(k.ibu_kandung) }, { label: d.tempatLahir, nilai: nilai(k.tempat_lahir) },
                { label: d.jenisKelamin, nilai: k.jenis_kelamin ? DAFTAR_PASIEN.jenisKelamin[k.jenis_kelamin] : REGISTRASI.kosongStrip },
                { label: d.identitas, nilai: STATUS_IDENTITAS.label(statusIdentitasDari(k.jalur_identitas)) },
                ...(k.tidak_cakap ? [{ label: d.tidakCakap, nilai: DAFTAR_PASIEN.detail.tidakCakap }] : []),
            ],
        },
        {
            judul: R.sosial,
            baris: [
                { label: d.agama, nilai: nilai(k.agama) }, { label: d.suku, nilai: nilai(k.suku) }, { label: d.bahasa, nilai: nilai(k.bahasa) },
                { label: d.pekerjaan, nilai: nilai(k.pekerjaan) }, { label: d.pendidikan, nilai: nilai(k.pendidikan) }, { label: d.statusKawin, nilai: nilai(k.status_kawin) },
            ],
        },
        {
            judul: R.alamat,
            baris: [
                { label: d.alamat, nilai: nilai(k.kode_wilayah) },
                ...(k.jalur_identitas === 'paspor' ? [{ label: d.paspor, nilai: nilai(k.nomor_paspor) }] : []),
                ...(k.jalur_identitas === 'kitas' ? [{ label: d.kitas, nilai: nilai(k.nomor_kitas) }] : []),
            ],
        },
        {
            judul: R.wali,
            baris: k.wali.length ? k.wali.map((w) => ({ label: w.hubungan, nilai: w.kontak.trim() ? `${w.nama} (${w.kontak.trim()})` : w.nama })) : [{ label: d.wali, nilai: REGISTRASI.waliKosong }],
        },
        {
            judul: R.penjamin,
            baris: [{ label: d.jknKartu, nilai: nilai(k.jkn_nomor_kartu) }, { label: d.asuransiNama, nilai: nilai(k.asuransi_nama) }, { label: d.asuransiPolis, nilai: nilai(k.asuransi_nomor_polis) }],
        },
        {
            judul: R.consent,
            baris: [
                { label: REGISTRASI.consentVersi(teks?.versi ?? 0), nilai: teks?.judul ?? REGISTRASI.kosongStrip },
                { label: REGISTRASI.consentBentuk, nilai: REGISTRASI.consentBentukOpsi.find((o) => o.nilai === k.bentuk)?.label ?? k.bentuk },
                { label: REGISTRASI.consentPenandatangan, nilai: penandatangan ?? REGISTRASI.consentPenandatanganOpsi.find((o) => o.nilai === k.penandatangan)?.label ?? k.penandatangan },
            ],
        },
    ];
}
