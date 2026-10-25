import { BAGIAN_KLINIS, PEMERIKSAAN_BIDANG, SKEMA_BAGIAN, TANDA_VITAL } from '@klira/shared';
import type {
  BagianKlinis, BidangPemeriksaan, JenisTindakLanjut, KlinisKunjunganDto, KunciTandaVital, SalinanKunjunganDto, TandaVitalIsi, TemplatDto, PeranDiagnosis,
} from '@klira/shared';
import { KLINIS, STATUS_PERAN_DIAGNOSIS } from '@klira/shared';
import type { BagianRingkasan } from '../../komponen/ui/susunan';

/** Logika murni modal Pemeriksaan klinis (3.3): keadaan formulir, langkah dari konfigurasi, perubahan, validasi, penyalinan. */

export type ModePemeriksaan = 'skrining' | 'periksa';

export type ItemDiagnosis = { kode: string; nama: string; peran: PeranDiagnosis; snomed: string };
export type ItemTindakan = { kode: string; nama: string; mulai: string; selesai: string };
export type KeadaanPemeriksaan = {
  anamnesis: { keluhan_utama: string; penyerta: string };
  /** Riwayat kesehatan pribadi. */
  riwayat: { riwayat_pribadi: string; riwayat_keluarga: string; alergi: string };
  tanda_vital: Record<KunciTandaVital, string>;
  pemeriksaan: Record<BidangPemeriksaan, string>;
  diagnosis: ItemDiagnosis[];
  tindakan: ItemTindakan[];
  tindak_lanjut: { jenis: JenisTindakLanjut | ''; tujuan: string; spri: string; catatan: string };
  /** Alasan perbaikan bagian yang sudah disahkan. */
  alasan: string;
};

/**
 * Keadaan dari draf server di atas dasar (catatan tersimpan): hanya bidang yang bentuknya sesuai yang diambil, sisanya tetap dari dasar,
 * sehingga draf lama atau rusak tidak merusak formulir.
 */
export function pulihkanKeadaan(dasar: KeadaanPemeriksaan, nilai: unknown): KeadaanPemeriksaan {
  if (!nilai || typeof nilai !== 'object' || Array.isArray(nilai)) return dasar;
  const n = nilai as Record<string, unknown>;
  const hasil: Record<string, unknown> = { ...dasar };
  for (const [kunci, d] of Object.entries(dasar)) {
    const v = n[kunci];
    if (typeof d === 'string') {
      if (typeof v === 'string') hasil[kunci] = v;
    } else if (Array.isArray(d)) {
      if (Array.isArray(v)) hasil[kunci] = v.filter((x) => !!x && typeof x === 'object' && typeof (x as { kode?: unknown }).kode === 'string');
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      const vv = v as Record<string, unknown>;
      hasil[kunci] = Object.fromEntries(Object.entries(d as Record<string, unknown>).map(([k, dv]) => [k, typeof vv[k] === typeof dv ? vv[k] : dv]));
    }
  }
  return hasil as KeadaanPemeriksaan;
}

const kosongTeks = <K extends string>(kunci: readonly K[]) => Object.fromEntries(kunci.map((k) => [k, ''])) as Record<K, string>;

export const awalKeadaan = (): KeadaanPemeriksaan => ({
  anamnesis: { keluhan_utama: '', penyerta: '' },
  riwayat: { riwayat_pribadi: '', riwayat_keluarga: '', alergi: '' },
  tanda_vital: kosongTeks(TANDA_VITAL.map((t) => t.kunci)),
  pemeriksaan: kosongTeks(PEMERIKSAAN_BIDANG),
  diagnosis: [],
  tindakan: [],
  tindak_lanjut: { jenis: '', tujuan: '', spri: '', catatan: '' },
  alasan: '',
});

// --- Langkah dari konfigurasi (titik sambung untuk butir berikutnya) ---

export type IdLangkah = 'anamnesis' | 'tanda_vital' | 'pemeriksaan' | 'diagnosis' | 'tindakan' | 'resep' | 'penunjang' | 'tindak_lanjut' | 'ringkasan';
export type KonfigLangkah = {
  id: IdLangkah;
  judul: string;
  /** Bagian catatan yang diisi langkah ini (kosong untuk langkah tanpa catatan). */
  bagian?: BagianKlinis;
  /** false = langkah belum tersedia: menampilkan penjelasan `menyusul` dan dapat dilewati. Butir berikutnya cukup mengubahnya menjadi true dan memasang isinya. */
  aktif: boolean;
  menyusul?: 'resep' | 'penunjang';
};

/** Sembilan langkah Pemeriksaan klinis (3.3). Resep menunggu Master obat. */
export const LANGKAH_PEMERIKSAAN: readonly KonfigLangkah[] = [
  { id: 'anamnesis', judul: KLINIS.langkah.anamnesis, bagian: 'anamnesis', aktif: true },
  { id: 'tanda_vital', judul: KLINIS.langkah.tandaVital, bagian: 'tanda_vital', aktif: true },
  { id: 'pemeriksaan', judul: KLINIS.langkah.pemeriksaan, bagian: 'pemeriksaan', aktif: true },
  { id: 'diagnosis', judul: KLINIS.langkah.diagnosis, bagian: 'diagnosis', aktif: true },
  { id: 'tindakan', judul: KLINIS.langkah.tindakan, bagian: 'tindakan', aktif: true },
  { id: 'resep', judul: KLINIS.langkah.resep, aktif: false, menyusul: 'resep' },
  { id: 'penunjang', judul: KLINIS.langkah.penunjang, aktif: true },
  { id: 'tindak_lanjut', judul: KLINIS.langkah.tindakLanjut, bagian: 'tindak_lanjut', aktif: true },
  { id: 'ringkasan', judul: KLINIS.langkah.ringkasan, aktif: true },
];

/** Skrining perawat: tanda vital sebagai bagian terpisah dari modal yang sama. */
export const LANGKAH_SKRINING: readonly KonfigLangkah[] = [
  { id: 'tanda_vital', judul: KLINIS.langkah.tandaVital, bagian: 'tanda_vital', aktif: true },
  { id: 'ringkasan', judul: KLINIS.langkah.ringkasanSkrining, aktif: true },
];

export const daftarLangkah = (mode: ModePemeriksaan): readonly KonfigLangkah[] => (mode === 'skrining' ? LANGKAH_SKRINING : LANGKAH_PEMERIKSAAN);
export const bagianDiModal = (mode: ModePemeriksaan): BagianKlinis[] => daftarLangkah(mode).flatMap((l) => (l.aktif && l.bagian ? [l.bagian] : []));

/** Nama bagian catatan untuk tampilan (ringkasan dan pesan galat). */
export const LABEL_BAGIAN: Record<BagianKlinis, string> = {
  anamnesis: KLINIS.langkah.anamnesis, tanda_vital: KLINIS.langkah.tandaVital, pemeriksaan: KLINIS.langkah.pemeriksaan, diagnosis: KLINIS.langkah.diagnosis,
  tindakan: KLINIS.langkah.tindakan, tindak_lanjut: KLINIS.langkah.tindakLanjut,
};

// --- Waktu lokal untuk isian tanggal-waktu ---

const dua = (n: number) => String(n).padStart(2, '0');
/** ISO (UTC) menjadi nilai isian datetime-local (zona peramban), tanpa detik. */
export function keInputLokal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}T${dua(d.getHours())}:${dua(d.getMinutes())}`;
}
/** Nilai isian datetime-local menjadi ISO (UTC); kosong bila tidak sah. */
export function dariInputLokal(lokal: string): string {
  if (!lokal.trim()) return '';
  const d = new Date(lokal);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

// --- Dari dan ke server ---

type BagianServer = KlinisKunjunganDto['bagian'];
const teks = (v: string | null | undefined) => v ?? '';

/** Keadaan formulir dari catatan tersimpan di server (bagian yang belum ada dibiarkan kosong). */
export function keadaanDariServer(b: BagianServer): KeadaanPemeriksaan {
  const k = awalKeadaan();
  const a = b.anamnesis.isi;
  if (a) {
    k.anamnesis = { keluhan_utama: a.keluhan_utama, penyerta: teks(a.penyerta) };
    k.riwayat = { riwayat_pribadi: teks(a.riwayat_pribadi), riwayat_keluarga: teks(a.riwayat_keluarga), alergi: teks(a.alergi) };
  }
  const tv = b.tanda_vital.isi;
  if (tv) for (const t of TANDA_VITAL) k.tanda_vital[t.kunci] = tv[t.kunci] === null ? '' : String(tv[t.kunci]);
  const pm = b.pemeriksaan.isi;
  if (pm) for (const f of PEMERIKSAAN_BIDANG) k.pemeriksaan[f] = teks(pm[f]);
  k.diagnosis = (b.diagnosis.isi?.item ?? []).map((d) => ({ kode: d.kode, nama: d.nama, peran: d.peran, snomed: teks(d.snomed) }));
  k.tindakan = (b.tindakan.isi?.item ?? []).map((t) => ({ kode: t.kode, nama: t.nama, mulai: keInputLokal(t.mulai), selesai: keInputLokal(t.selesai) }));
  const tl = b.tindak_lanjut.isi;
  if (tl) k.tindak_lanjut = { jenis: tl.jenis, tujuan: teks(tl.tujuan), spri: teks(tl.spri), catatan: teks(tl.catatan) };
  return k;
}

/** Isi yang dikirim ke API untuk satu bagian (server menormalkan dan memvalidasi ulang). */
export function isiBagian(bagian: BagianKlinis, k: KeadaanPemeriksaan): unknown {
  switch (bagian) {
    case 'anamnesis': return { ...k.anamnesis, ...k.riwayat };
    case 'tanda_vital': return { ...k.tanda_vital };
    case 'pemeriksaan': return { ...k.pemeriksaan };
    case 'diagnosis': return { item: k.diagnosis.map((d) => ({ kode: d.kode, nama: d.nama, peran: d.peran, snomed: d.snomed })) };
    case 'tindakan': return { item: k.tindakan.map((t) => ({ kode: t.kode, nama: t.nama, mulai: dariInputLokal(t.mulai), selesai: dariInputLokal(t.selesai) })) };
    case 'tindak_lanjut': return { ...k.tindak_lanjut };
  }
}

/** Bagian keadaan yang menjadi dasar perbandingan perubahan (bentuk formulir, bukan isi kirim). */
const bagianKeadaan = (bagian: BagianKlinis, k: KeadaanPemeriksaan): unknown => {
  switch (bagian) {
    case 'anamnesis': return [k.anamnesis, k.riwayat];
    case 'diagnosis': return k.diagnosis;
    case 'tindakan': return k.tindakan;
    default: return k[bagian];
  }
};

export const adaPerubahanBagian = (bagian: BagianKlinis, k: KeadaanPemeriksaan, server: KeadaanPemeriksaan): boolean =>
  JSON.stringify(bagianKeadaan(bagian, k)) !== JSON.stringify(bagianKeadaan(bagian, server));

/** Tidak ada isian sama sekali pada bagian ini. */
export function bagianKosong(bagian: BagianKlinis, k: KeadaanPemeriksaan): boolean {
  const kosong = (o: Record<string, string>) => Object.values(o).every((v) => v.trim() === '');
  switch (bagian) {
    case 'anamnesis': return kosong(k.anamnesis) && kosong(k.riwayat);
    case 'tanda_vital': return kosong(k.tanda_vital);
    case 'pemeriksaan': return kosong(k.pemeriksaan);
    case 'diagnosis': return k.diagnosis.length === 0;
    case 'tindakan': return k.tindakan.length === 0;
    case 'tindak_lanjut': return k.tindak_lanjut.jenis === '';
  }
}

/** Bagian ini perlu dikirim: berubah dari tersimpan, dan tidak sekadar kosong (kecuali sudah pernah disimpan, mis. tindakan dikosongkan). */
export function perluDisimpan(bagian: BagianKlinis, k: KeadaanPemeriksaan, server: KeadaanPemeriksaan, sudahDisahkan: boolean): boolean {
  return adaPerubahanBagian(bagian, k, server) && (!bagianKosong(bagian, k) || sudahDisahkan);
}

/** Pesan galat pertama bagian ini menurut skema bersama, atau null bila sah. */
export function galatBagian(bagian: BagianKlinis, k: KeadaanPemeriksaan): string | null {
  if (bagian === 'tindak_lanjut' && k.tindak_lanjut.jenis === '') return KLINIS.galat.pilihRencana;
  const h = SKEMA_BAGIAN[bagian].safeParse(isiBagian(bagian, k));
  return h.success ? null : h.error.issues[0].message;
}

export type RencanaSimpan = { bagian: BagianKlinis; galat: string | null }[];

/** Bagian yang akan disimpan (urut menurut langkah) beserta galat validasinya. */
export function rencanaSimpan(mode: ModePemeriksaan, k: KeadaanPemeriksaan, server: KeadaanPemeriksaan, disahkan: Record<BagianKlinis, boolean>): RencanaSimpan {
  return bagianDiModal(mode)
    .filter((b) => perluDisimpan(b, k, server, disahkan[b]))
    .map((bagian) => ({ bagian, galat: galatBagian(bagian, k) }));
}

/** Perbaikan butuh alasan bila ada bagian yang sudah disahkan ikut disimpan. */
export const perluAlasan = (rencana: RencanaSimpan, disahkan: Record<BagianKlinis, boolean>): boolean => rencana.some((r) => disahkan[r.bagian]);

/** Syarat menyelesaikan pemeriksaan: anamnesis, diagnosis, dan tindak lanjut ada (tersimpan atau ikut disimpan sekarang). */
export function syaratSelesaiTerpenuhi(disahkan: Record<BagianKlinis, boolean>, rencana: RencanaSimpan): boolean {
  return (['anamnesis', 'diagnosis', 'tindak_lanjut'] as const).every((b) => disahkan[b] || rencana.some((r) => r.bagian === b));
}

export const disahkanDari = (b: BagianServer): Record<BagianKlinis, boolean> =>
  Object.fromEntries(BAGIAN_KLINIS.map((n) => [n, b[n].pengesahan !== null])) as Record<BagianKlinis, boolean>;

export type StatusRingkasan = 'belum_diisi' | 'tanpa_perubahan' | 'akan_disimpan' | 'sudah_sah';
/** Keadaan tiap bagian di ringkasan akhir. */
export function statusRingkasan(bagian: BagianKlinis, k: KeadaanPemeriksaan, server: KeadaanPemeriksaan, disahkan: boolean): StatusRingkasan {
  if (perluDisimpan(bagian, k, server, disahkan)) return 'akan_disimpan';
  if (disahkan) return 'sudah_sah';
  return bagianKosong(bagian, k) ? 'belum_diisi' : 'tanpa_perubahan';
}

// --- Ringkasan kepala modal ---

const angkaId = (n: number) => String(n).replace('.', ',');
/** Contoh: "TD 150/95 · N 82 · S 36,7". */
export function ringkasTandaVital(tv: TandaVitalIsi | null): string {
  if (!tv) return '';
  const s = KLINIS.tandaVital.singkat;
  const bagian: string[] = [];
  if (tv.sistolik !== null || tv.diastolik !== null) bagian.push(`${s.sistolik} ${tv.sistolik ?? '-'}/${tv.diastolik ?? '-'}`);
  if (tv.nadi !== null) bagian.push(`${s.nadi} ${angkaId(tv.nadi)}`);
  if (tv.suhu !== null) bagian.push(`${s.suhu} ${angkaId(tv.suhu)}`);
  if (tv.respirasi !== null) bagian.push(`${s.respirasi} ${angkaId(tv.respirasi)}`);
  if (tv.spo2 !== null) bagian.push(`${s.spo2} ${angkaId(tv.spo2)}%`);
  return bagian.join(' · ');
}

// --- Diagnosis dan tindakan ---

export const normalkanKode = (kode: string): string => kode.trim().toUpperCase();

/** Tambah diagnosis: yang pertama menjadi utama, berikutnya penyerta; kode yang sama tidak ditambah dua kali. */
export function tambahDiagnosis(daftar: readonly ItemDiagnosis[], d: { kode: string; nama: string }): ItemDiagnosis[] {
  const kode = normalkanKode(d.kode);
  if (!kode || daftar.some((x) => x.kode === kode)) return [...daftar];
  return [...daftar, { kode, nama: d.nama.trim(), peran: daftar.length === 0 ? 'utama' : 'penyerta', snomed: '' }];
}
/** Hanya satu diagnosis utama: yang dipilih menjadi utama, lainnya penyerta. */
export const jadikanUtama = (daftar: readonly ItemDiagnosis[], kode: string): ItemDiagnosis[] => daftar.map((x) => ({ ...x, peran: x.kode === kode ? 'utama' : 'penyerta' }));
/** Hapus diagnosis; bila yang utama dihapus, yang pertama tersisa menjadi utama. */
export function hapusDiagnosis(daftar: readonly ItemDiagnosis[], kode: string): ItemDiagnosis[] {
  const sisa = daftar.filter((x) => x.kode !== kode);
  return sisa.length && !sisa.some((x) => x.peran === 'utama') ? jadikanUtama(sisa, sisa[0].kode) : sisa;
}

export function tambahTindakan(daftar: readonly ItemTindakan[], t: { kode: string; nama: string }, sekarang: Date): ItemTindakan[] {
  const kode = t.kode.trim();
  if (!kode || daftar.some((x) => x.kode === kode)) return [...daftar];
  return [...daftar, { kode, nama: t.nama.trim(), mulai: keInputLokal(sekarang.toISOString()), selesai: '' }];
}
export const hapusTindakan = (daftar: readonly ItemTindakan[], kode: string): ItemTindakan[] => daftar.filter((x) => x.kode !== kode);

// --- Salin dari kunjungan sebelumnya, templat ---

export type BagianSalinan = 'anamnesis' | 'diagnosis' | 'tindakan';
/** Bagian kunjungan sumber yang punya isi dan dapat disalin. */
export const bagianDapatDisalin = (s: SalinanKunjunganDto): BagianSalinan[] => (['anamnesis', 'diagnosis', 'tindakan'] as const).filter((b) => s[b] !== null);

/** Salin bagian terpilih sebagai draf ke keadaan formulir (mengganti isian bagian itu); belum disahkan sampai disimpan. */
export function salinKeKeadaan(k: KeadaanPemeriksaan, s: SalinanKunjunganDto, pilih: readonly BagianSalinan[], sekarang: Date): { keadaan: KeadaanPemeriksaan; jumlah: number } {
  const hasil: KeadaanPemeriksaan = { ...k };
  let jumlah = 0;
  if (pilih.includes('anamnesis') && s.anamnesis) {
    const a = s.anamnesis;
    hasil.anamnesis = { keluhan_utama: a.keluhan_utama, penyerta: teks(a.penyerta) };
    hasil.riwayat = { riwayat_pribadi: teks(a.riwayat_pribadi), riwayat_keluarga: teks(a.riwayat_keluarga), alergi: teks(a.alergi) };
    jumlah += 1;
  }
  if (pilih.includes('diagnosis') && s.diagnosis) {
    hasil.diagnosis = s.diagnosis.item.map((d) => ({ kode: d.kode, nama: d.nama, peran: d.peran, snomed: teks(d.snomed) }));
    jumlah += 1;
  }
  if (pilih.includes('tindakan') && s.tindakan) {
    const mulai = keInputLokal(sekarang.toISOString());
    hasil.tindakan = s.tindakan.item.map((t) => ({ kode: t.kode, nama: t.nama, mulai, selesai: '' }));
    jumlah += 1;
  }
  return { keadaan: hasil, jumlah };
}

/** Isi templat dari keadaan sekarang (hanya bagian yang menjadi templat). */
export function isiTemplatDari(bagian: 'anamnesis' | 'pemeriksaan', k: KeadaanPemeriksaan): Record<string, string | null> {
  const sumber: Record<string, string> = bagian === 'anamnesis' ? { ...k.anamnesis, ...k.riwayat } : { ...k.pemeriksaan };
  return Object.fromEntries(Object.entries(sumber).map(([n, v]) => [n, v.trim() === '' ? null : v.trim()]));
}

/** Terapkan templat: hanya bidang templat yang terisi menggantikan isian. */
export function pakaiTemplat(k: KeadaanPemeriksaan, t: Pick<TemplatDto, 'bagian' | 'isi'>): KeadaanPemeriksaan {
  const isi = (n: string) => t.isi[n];
  if (t.bagian === 'anamnesis') {
    const ganti = (v: string, n: string) => isi(n) ?? v;
    return {
      ...k,
      anamnesis: { keluhan_utama: ganti(k.anamnesis.keluhan_utama, 'keluhan_utama'), penyerta: ganti(k.anamnesis.penyerta, 'penyerta') },
      riwayat: {
        riwayat_pribadi: ganti(k.riwayat.riwayat_pribadi, 'riwayat_pribadi'), riwayat_keluarga: ganti(k.riwayat.riwayat_keluarga, 'riwayat_keluarga'), alergi: ganti(k.riwayat.alergi, 'alergi'),
      },
    };
  }
  return { ...k, pemeriksaan: Object.fromEntries(PEMERIKSAAN_BIDANG.map((n) => [n, isi(n) ?? k.pemeriksaan[n]])) as KeadaanPemeriksaan['pemeriksaan'] };
}

/** Alergi sebagai daftar singkat untuk kepala modal. */
export const daftarAlergi = (alergi: string | null): string[] => (alergi ?? '').split(/[\n,;]+/).map((a) => a.trim()).filter(Boolean);

/** Isi singkat untuk ringkasan akhir: keluhan, alergi, diagnosis, tindakan, dan rencana. */
export function ringkasanIsi(k: KeadaanPemeriksaan): BagianRingkasan[] {
  const strip = (v: string) => (v.trim() ? v.trim() : '-');
  const jenisLabel = (j: string) => KLINIS.tindakLanjut.jenisOpsi.find((o) => o.nilai === j)?.label ?? '-';
  return [
    { judul: KLINIS.langkah.anamnesis, baris: [{ label: KLINIS.anamnesis.keluhanUtama, nilai: strip(k.anamnesis.keluhan_utama) }, { label: KLINIS.anamnesis.alergi, nilai: strip(k.riwayat.alergi) }] },
    {
      judul: KLINIS.langkah.diagnosis,
      baris: k.diagnosis.length ? k.diagnosis.map((d) => ({ label: d.kode, nilai: `${d.nama} (${STATUS_PERAN_DIAGNOSIS.label(d.peran)})` })) : [{ label: '-', nilai: KLINIS.diagnosis.kosong }],
    },
    {
      judul: KLINIS.langkah.tindakan,
      baris: k.tindakan.length ? k.tindakan.map((t) => ({ label: t.kode, nilai: t.nama })) : [{ label: '-', nilai: KLINIS.ringkasan.bagianBelum }],
    },
    {
      judul: KLINIS.langkah.tindakLanjut,
      baris: [{ label: KLINIS.tindakLanjut.jenis, nilai: jenisLabel(k.tindak_lanjut.jenis) }, ...(k.tindak_lanjut.tujuan.trim() ? [{ label: KLINIS.tindakLanjut.tujuan, nilai: k.tindak_lanjut.tujuan.trim() }] : [])],
    },
  ];
}
