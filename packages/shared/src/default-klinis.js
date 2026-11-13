/**
 * Default keadaan baik (rekam medis mengikuti formulir klinik, P6–P8): isian pemeriksaan yang punya keadaan normal sudah terisi teks keadaan baik,
 * sehingga tenaga kesehatan hanya mengubah yang tidak normal. Satu sumber untuk form, uji, dan data demo.
 *
 * Util di sini bersifat umum (dipakai ulang bagian lain, mis. pemeriksaan fisik dan anamnesis P7): bandingkan nilai dengan default,
 * hitung isian yang diubah, dan kembalikan sekelompok isian ke normal.
 */
/** Teks default "tidak ada" (alergi, riwayat pengobatan, obat yang dikonsumsi, ...). */
export const TEKS_TIDAK_ADA = 'tidak ada';
/** Normalisasi pembanding: teks tanpa beda huruf besar/kecil dan spasi berlebih; null/undefined sama dengan teks kosong. */
const normal = (v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').toLowerCase() : v === null || v === undefined ? '' : v);
/** Nilai dianggap sama dengan default (kunci tanpa default selalu dianggap sama). */
export const samaDenganDefault = (nilai, bawaan) => bawaan === undefined || normal(nilai) === normal(bawaan);
/** Teks bermakna "tidak ada" (abaikan huruf besar/kecil dan spasi). */
export const berartiTidakAda = (teks) => normal(teks) === TEKS_TIDAK_ADA;
/** Alergi untuk konteks pasien: kosong atau default "tidak ada" berarti tanpa alergi (null). */
export const alergiTercatat = (alergi) => (!alergi?.trim() || berartiTidakAda(alergi) ? null : alergi.trim());
const kunciDefault = (bawaan, kunci) => (kunci ?? Object.keys(bawaan)).filter((k) => bawaan[k] !== undefined);
/** Kunci isian yang nilainya berbeda dari default (dibatasi `kunci` bila diberikan, mis. satu kelompok). */
export function isianDiubah(nilai, bawaan, kunci) {
    return kunciDefault(bawaan, kunci).filter((k) => !samaDenganDefault(nilai[k], bawaan[k]));
}
/** Jumlah isian yang berbeda dari default ("n isian diubah"). */
export const jumlahDiubah = (nilai, bawaan, kunci) => isianDiubah(nilai, bawaan, kunci).length;
/**
 * Kembalikan isian ke default ("Semua normal" untuk satu kelompok bila `kunci` diberikan, "Kembalikan semua ke normal" bila tidak).
 * Isian teks di form menerima default null sebagai teks kosong; isian tanpa default tidak disentuh.
 */
export function kembalikanNormal(nilai, bawaan, kunci) {
    const hasil = { ...nilai };
    for (const k of kunciDefault(bawaan, kunci)) {
        const d = bawaan[k];
        hasil[k] = d === null && typeof nilai[k] === 'string' ? '' : d;
    }
    return hasil;
}
/** Form baru (belum pernah disimpan dan tanpa draf): isian kosong diisi default keadaan baik. */
export const isiDefault = (kosong, bawaan) => kembalikanNormal(kosong, bawaan);
// --- Skrining keperawatan (P6) ---
/** Default keadaan baik isian keperawatan; isian nyeri lain normal bila kosong (disimpan null saat tidak nyeri). */
export const DEFAULT_KEPERAWATAN = {
    kajian_keperawatan: 'keadaan umum baik',
    telah_diobati: TEKS_TIDAK_ADA,
    alergi: TEKS_TIDAK_ADA,
    obat_dikonsumsi: TEKS_TIDAK_ADA,
    nyeri_jenis: 'tidak',
    nyeri_skala: null,
    nyeri_lokasi: null,
    nyeri_durasi: null,
    nyeri_frekuensi: null,
    nyeri_hilang_bila: null,
    gizi_bb_turun: false,
    gizi_asupan_kurang: false,
};
/** Skrining gizi sederhana: ada "ya" = berisiko malnutrisi. Dihitung, tidak disimpan. */
export const hasilRisikoGizi = (d) => d.gizi_bb_turun || d.gizi_asupan_kurang ? 'berisiko' : 'tidak_berisiko';
// --- Anamnesa dokter (P7) ---
/** Default keadaan baik anamnesa: riwayat penyakit dahulu dan keluarga; keluhan, riwayat sekarang, dan kajian sosial tanpa default. */
export const DEFAULT_ANAMNESIS = {
    riwayat_pribadi: TEKS_TIDAK_ADA,
    riwayat_keluarga: TEKS_TIDAK_ADA,
};
// --- Pemeriksaan fisik terstruktur (P7) ---
/** Kelompok pemeriksaan fisik sesuai formulir klinik (urutan tampil dan cetak). */
export const KELOMPOK_PEMERIKSAAN = [
    { kunci: 'rambut', label: 'Rambut' },
    { kunci: 'mata', label: 'Mata' },
    { kunci: 'tht', label: 'THT' },
    { kunci: 'jantung', label: 'Jantung' },
    { kunci: 'paru', label: 'Paru-paru' },
    { kunci: 'abdomen', label: 'Abdomen' },
    { kunci: 'ekstremitas', label: 'Ekstremitas' },
    { kunci: 'lokalis', label: 'Status lokalis' },
    { kunci: 'odontogram', label: 'Odontogram' },
];
/**
 * Bidang pemeriksaan fisik (disimpan per baris di Observasi, kelompok `pemeriksaan`, `bidang` = kunci): kunci, kelompok, label, dan default keadaan baik.
 * `bawaan` null = tanpa default (tidak ditandai dan tidak diubah "Semua normal").
 */
export const DEFINISI_PEMERIKSAAN = [
    { kunci: 'rambut_warna', kelompok: 'rambut', label: 'Warna', bawaan: 'hitam' },
    { kunci: 'rambut_bentuk', kelompok: 'rambut', label: 'Bentuk', bawaan: 'normal, tidak mudah rontok' },
    { kunci: 'rambut_lain', kelompok: 'rambut', label: 'Lain-lain', bawaan: TEKS_TIDAK_ADA },
    { kunci: 'mata_konjungtiva', kelompok: 'mata', label: 'Konjungtiva', bawaan: 'tidak anemis' },
    { kunci: 'mata_sklera', kelompok: 'mata', label: 'Sklera', bawaan: 'tidak ikterik' },
    { kunci: 'mata_lain', kelompok: 'mata', label: 'Lain-lain', bawaan: TEKS_TIDAK_ADA },
    { kunci: 'tht_gendang_telinga', kelompok: 'tht', label: 'Gendang telinga', bawaan: 'intak' },
    { kunci: 'tht_serumen', kelompok: 'tht', label: 'Serumen', bawaan: TEKS_TIDAK_ADA },
    { kunci: 'tht_tonsil_kanan', kelompok: 'tht', label: 'Tonsil kanan', bawaan: 'T1' },
    { kunci: 'tht_tonsil_kiri', kelompok: 'tht', label: 'Tonsil kiri', bawaan: 'T1' },
    { kunci: 'tht_warna_tonsil', kelompok: 'tht', label: 'Warna tonsil', bawaan: 'tidak hiperemis' },
    { kunci: 'tht_faring', kelompok: 'tht', label: 'Faring', bawaan: 'tidak hiperemis' },
    { kunci: 'tht_lain', kelompok: 'tht', label: 'Lain-lain', bawaan: TEKS_TIDAK_ADA },
    { kunci: 'jantung_bj1', kelompok: 'jantung', label: 'Bunyi jantung I', bawaan: 'reguler' },
    { kunci: 'jantung_bj2', kelompok: 'jantung', label: 'Bunyi jantung II', bawaan: 'reguler' },
    { kunci: 'jantung_murmur', kelompok: 'jantung', label: 'Murmur', bawaan: TEKS_TIDAK_ADA },
    { kunci: 'jantung_gallop', kelompok: 'jantung', label: 'Gallop', bawaan: TEKS_TIDAK_ADA },
    { kunci: 'jantung_lain', kelompok: 'jantung', label: 'Lain-lain', bawaan: TEKS_TIDAK_ADA },
    { kunci: 'paru_bunyi', kelompok: 'paru', label: 'Bunyi napas', bawaan: 'vesikuler' },
    { kunci: 'paru_wheezing', kelompok: 'paru', label: 'Wheezing', bawaan: TEKS_TIDAK_ADA },
    { kunci: 'paru_rhonki', kelompok: 'paru', label: 'Rhonki', bawaan: TEKS_TIDAK_ADA },
    { kunci: 'paru_lain', kelompok: 'paru', label: 'Lain-lain', bawaan: TEKS_TIDAK_ADA },
    { kunci: 'abdomen_massa', kelompok: 'abdomen', label: 'Massa', bawaan: TEKS_TIDAK_ADA },
    { kunci: 'abdomen_bising_usus', kelompok: 'abdomen', label: 'Bising usus', bawaan: 'normal' },
    { kunci: 'abdomen_lain', kelompok: 'abdomen', label: 'Lain-lain', bawaan: TEKS_TIDAK_ADA },
    { kunci: 'ekstremitas_akral', kelompok: 'ekstremitas', label: 'Akral', bawaan: 'hangat' },
    { kunci: 'ekstremitas_pitting_edema', kelompok: 'ekstremitas', label: 'Pitting edema', bawaan: TEKS_TIDAK_ADA },
    { kunci: 'ekstremitas_lain', kelompok: 'ekstremitas', label: 'Lain-lain', bawaan: TEKS_TIDAK_ADA },
    { kunci: 'lokalis_bentuk', kelompok: 'lokalis', label: 'Bentuk', bawaan: TEKS_TIDAK_ADA },
    { kunci: 'lokalis_letak', kelompok: 'lokalis', label: 'Letak', bawaan: TEKS_TIDAK_ADA },
    { kunci: 'lokalis_jumlah', kelompok: 'lokalis', label: 'Jumlah', bawaan: TEKS_TIDAK_ADA },
    { kunci: 'lokalis_warna', kelompok: 'lokalis', label: 'Warna', bawaan: TEKS_TIDAK_ADA },
    { kunci: 'lokalis_ukuran', kelompok: 'lokalis', label: 'Ukuran', bawaan: TEKS_TIDAK_ADA },
    { kunci: 'lokalis_lain', kelompok: 'lokalis', label: 'Lain-lain', bawaan: TEKS_TIDAK_ADA },
    { kunci: 'odontogram_tanggal', kelompok: 'odontogram', label: 'Tanggal odontogram', bawaan: null, jenis: 'tanggal' },
];
/** Kunci bidang pemeriksaan fisik (urutan formulir). */
export const PEMERIKSAAN_BIDANG = DEFINISI_PEMERIKSAAN.map((d) => d.kunci);
export const BIDANG_TEKS_PEMERIKSAAN = PEMERIKSAAN_BIDANG.filter((k) => k !== 'odontogram_tanggal');
/** Default keadaan baik pemeriksaan fisik per kunci (bidang tanpa default tidak ada di peta). */
export const DEFAULT_PEMERIKSAAN = Object.fromEntries(DEFINISI_PEMERIKSAAN.flatMap((d) => (d.bawaan === null ? [] : [[d.kunci, d.bawaan]])));
/** Kunci bidang satu kelompok pemeriksaan. */
export const bidangKelompok = (kelompok) => DEFINISI_PEMERIKSAAN.filter((d) => d.kelompok === kelompok).map((d) => d.kunci);
/** Label bidang pemeriksaan; kunci tak dikenal (data lama) dikembalikan apa adanya. */
export const labelBidangPemeriksaan = (kunci) => DEFINISI_PEMERIKSAAN.find((d) => d.kunci === kunci)?.label ?? kunci;
const huruf = (s) => s.charAt(0).toLowerCase() + s.slice(1);
/**
 * Ringkasan pemeriksaan fisik per kelompok untuk ringkasan, detail kunjungan, riwayat, dan cetak:
 * nilai per bidang dengan penanda berbeda dari default; kelompok yang seluruhnya normal diringkas menjadi satu kalimat.
 * Kelompok tanpa isian sama sekali (mis. odontogram belum dibuat) tetap dikembalikan dengan nilai null.
 */
export function ringkasanPemeriksaan(isi) {
    return KELOMPOK_PEMERIKSAAN.map(({ kunci: kelompok, label }) => {
        const baris = DEFINISI_PEMERIKSAAN.filter((d) => d.kelompok === kelompok).map((d) => {
            const v = isi?.[d.kunci];
            const nilai = typeof v === 'string' && v.trim() ? v.trim() : null;
            return { kunci: d.kunci, label: d.label, nilai, diubah: d.bawaan === null ? false : !samaDenganDefault(nilai, d.bawaan) };
        });
        const adaDefault = (k) => DEFAULT_PEMERIKSAAN[k] !== undefined;
        const normal = baris.every((b) => (adaDefault(b.kunci) ? !b.diubah : b.nilai === null));
        const kalimat = normal && baris.some((b) => adaDefault(b.kunci)) ? baris.filter((b) => b.nilai !== null).map((b, i) => `${i === 0 ? b.label : huruf(b.label)} ${b.nilai}`).join(', ') : null;
        return { kelompok, label, normal, kalimat, baris };
    });
}
