import { DEFAULT_KEPERAWATAN, hasilRisikoGizi, isiDefault, isianDiubah, KLINIS, STATUS_JENIS_NYERI, STATUS_RISIKO_GIZI, STATUS_SKRINING_VISUAL, } from '@klira/shared';
export const kosongKeperawatan = () => ({
    kajian_keperawatan: '', telah_diobati: '', alergi: '', obat_dikonsumsi: '', diagnosa_keperawatan: '', rencana_asuhan: '',
    nyeri_jenis: '', nyeri_skala: '', nyeri_lokasi: '', nyeri_durasi: '', nyeri_frekuensi: '', nyeri_hilang_bila: '',
    gizi_bb_turun: false, gizi_asupan_kurang: false, skrining_visual: '',
});
/** Form keperawatan baru: terisi default keadaan baik (satu sumber: DEFAULT_KEPERAWATAN di packages/shared). */
export const defaultKeperawatan = () => isiDefault(kosongKeperawatan(), DEFAULT_KEPERAWATAN);
export const ISIAN_NYERI_LAIN = ['nyeri_skala', 'nyeri_lokasi', 'nyeri_durasi', 'nyeri_frekuensi', 'nyeri_hilang_bila'];
/** Kelompok isian (kartu); kelompok tanpa isian berdefault tidak punya tombol "Semua normal". */
export const KELOMPOK_KEPERAWATAN = [
    { id: 'kajian', kunci: ['kajian_keperawatan', 'telah_diobati', 'alergi', 'obat_dikonsumsi'] },
    { id: 'nyeri', kunci: ['nyeri_jenis', ...ISIAN_NYERI_LAIN] },
    { id: 'gizi', kunci: ['gizi_bb_turun', 'gizi_asupan_kurang'] },
    { id: 'asuhan', kunci: ['diagnosa_keperawatan', 'rencana_asuhan', 'skrining_visual'] },
];
const kunciKelompok = (id) => KELOMPOK_KEPERAWATAN.find((g) => g.id === id)?.kunci ?? [];
/** Kelompok punya isian berdefault (tombol "Semua normal" tampil). */
export const kelompokBerdefault = (id) => kunciKelompok(id).some((k) => k in DEFAULT_KEPERAWATAN);
/** Isian yang berbeda dari default (seluruh form atau satu kelompok). */
export const keperawatanDiubah = (k, kelompok) => isianDiubah(k, DEFAULT_KEPERAWATAN, kelompok ? kunciKelompok(kelompok).filter((x) => x in DEFAULT_KEPERAWATAN) : undefined);
/** Ubah jenis nyeri; "tidak" mengosongkan isian nyeri lain (disembunyikan dan disimpan null). */
export const ubahJenisNyeri = (k, jenis) => jenis === 'tidak' ? { ...k, nyeri_jenis: jenis, ...Object.fromEntries(ISIAN_NYERI_LAIN.map((n) => [n, ''])) } : { ...k, nyeri_jenis: jenis };
export const adaNyeri = (k) => k.nyeri_jenis === 'akut' || k.nyeri_jenis === 'kronis';
const teks = (v) => v ?? '';
/** Keadaan form dari isi tersimpan. */
export const keperawatanDariIsi = (p) => ({
    kajian_keperawatan: teks(p.kajian_keperawatan), telah_diobati: teks(p.telah_diobati), alergi: teks(p.alergi), obat_dikonsumsi: teks(p.obat_dikonsumsi),
    diagnosa_keperawatan: teks(p.diagnosa_keperawatan), rencana_asuhan: teks(p.rencana_asuhan),
    nyeri_jenis: p.nyeri_jenis, nyeri_skala: p.nyeri_skala === null ? '' : String(p.nyeri_skala), nyeri_lokasi: teks(p.nyeri_lokasi), nyeri_durasi: teks(p.nyeri_durasi),
    nyeri_frekuensi: teks(p.nyeri_frekuensi), nyeri_hilang_bila: teks(p.nyeri_hilang_bila),
    gizi_bb_turun: p.gizi_bb_turun, gizi_asupan_kurang: p.gizi_asupan_kurang,
    skrining_visual: p.skrining_visual ?? '',
});
/** Isi kirim ke API (server menormalkan: kosong menjadi null, nyeri lain null bila tidak nyeri). */
export const isiKeperawatan = (k) => ({ ...k });
/** Belum ada isian sama sekali (form tanpa default). */
export const keperawatanKosong = (k) => k.nyeri_jenis === '' && k.skrining_visual === '' && Object.values(k).every((v) => v === '' || v === false);
const yaTidak = (v) => (v ? KLINIS.keperawatan.ya : KLINIS.keperawatan.tidak);
/** Ringkasan baca saja (ringkasan dokter di atas langkah Anamnesa, ringkasan akhir, detail kunjungan). */
export function ringkasanKeperawatan(k) {
    const t = KLINIS.keperawatan;
    const nilai = (v) => v.trim() || '-';
    const baris = [
        { label: t.kajian_keperawatan, nilai: nilai(k.kajian_keperawatan) },
        { label: t.telah_diobati, nilai: nilai(k.telah_diobati) },
        { label: t.alergi, nilai: nilai(k.alergi) },
        { label: t.obat_dikonsumsi, nilai: nilai(k.obat_dikonsumsi) },
        { label: t.nyeri_jenis, nilai: k.nyeri_jenis ? STATUS_JENIS_NYERI.label(k.nyeri_jenis) : '-' },
        ...(adaNyeri(k) ? [
            { label: t.nyeri_skala, nilai: nilai(k.nyeri_skala) }, { label: t.nyeri_lokasi, nilai: nilai(k.nyeri_lokasi) }, { label: t.nyeri_durasi, nilai: nilai(k.nyeri_durasi) },
            { label: t.nyeri_frekuensi, nilai: nilai(k.nyeri_frekuensi) }, { label: t.nyeri_hilang_bila, nilai: nilai(k.nyeri_hilang_bila) },
        ] : []),
        { label: t.kelompok.gizi, nilai: `${STATUS_RISIKO_GIZI.label(hasilRisikoGizi(k))} (${yaTidak(k.gizi_bb_turun)}/${yaTidak(k.gizi_asupan_kurang)})` },
        { label: t.diagnosa_keperawatan, nilai: nilai(k.diagnosa_keperawatan) },
        { label: t.rencana_asuhan, nilai: nilai(k.rencana_asuhan) },
        { label: t.skrining_visual, nilai: k.skrining_visual ? STATUS_SKRINING_VISUAL.label(k.skrining_visual) : '-' },
    ];
    return { judul: t.judul, baris };
}
