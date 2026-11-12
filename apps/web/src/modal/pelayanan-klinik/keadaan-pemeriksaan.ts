import { awalResep } from './keadaan-farmasi';
import { awalOrderLab } from './keadaan-order-lab';
import type { KeadaanOrderLab } from './keadaan-order-lab';
import {
  BAGIAN_NARASI, LABEL_NARASI, BAGIAN_KLINIS, DEFAULT_ANAMNESIS, DEFAULT_PEMERIKSAAN, PEMERIKSAAN_BIDANG, SKEMA_BAGIAN, TANDA_VITAL, isiDefault, isianDiubah, kunciTindakan, ringkasanPemeriksaan,
} from '@klira/shared';
import type {
  BagianNarasi, BagianKlinis, BidangPemeriksaan, JenisTindakLanjut, KlinisKunjunganDto, KunciTandaVital, SalinanKunjunganDto, TandaVitalIsi, TemplatDto, PeranDiagnosis, StatusPengesahan,
} from '@klira/shared';
import { KLINIS } from '@klira/shared';
import type { BagianRingkasan } from '../../komponen/ui/susunan';
import { defaultKeperawatan, keperawatanDariIsi, keperawatanKosong, kosongKeperawatan, ringkasanKeperawatan } from './keadaan-keperawatan';
import type { KeadaanKeperawatan } from './keadaan-keperawatan';

/** Logika murni modal Pemeriksaan klinis (3.3): keadaan formulir, langkah dari konfigurasi, perubahan, validasi, penyalinan. */

export type ModePemeriksaan = 'skrining' | 'periksa';

export type ItemDiagnosis = { kode: string; nama: string; peran: PeranDiagnosis; snomed: string };
/** `tarif_layanan_id` = tindakan klinik terpilih (kosong bila dari kamus); `jumlah` teks isian (kosong/tiada = 1). */
export type ItemTindakan = { kode: string; nama: string; mulai: string; selesai: string; performer_id?: number | null; tarif_layanan_id?: number | null; jumlah?: string };
/** Atribut tarif dan jumlah tindakan dari isi server/salinan; jumlah 1 dan tanpa tarif tidak ditulis agar keadaan awal tetap sama. */
const tarifJumlah = (t: { tarif_layanan_id?: number | null; jumlah?: number | null }): Pick<ItemTindakan, 'tarif_layanan_id' | 'jumlah'> => ({
  ...(t.tarif_layanan_id ? { tarif_layanan_id: t.tarif_layanan_id } : {}), ...(t.jumlah && t.jumlah !== 1 ? { jumlah: String(t.jumlah) } : {}),
});
export type KeadaanPemeriksaan = {
  anamnesis: { keluhan_utama: string; penyerta: string; riwayat_sekarang: string };
  /** Riwayat penyakit dahulu, keluarga, dan kajian sosial. */
  riwayat: { riwayat_pribadi: string; riwayat_keluarga: string; kajian_sosial: string };
  tanda_vital: Record<KunciTandaVital, string>;
  /** Skrining keperawatan (P6); alergi pasien dikaji di sini. */
  keperawatan: KeadaanKeperawatan;
  pemeriksaan: Record<BidangPemeriksaan, string>;
  diagnosis: ItemDiagnosis[];
  tindakan: ItemTindakan[];
  tindak_lanjut: { jenis: JenisTindakLanjut | ''; tujuan: string; spri: string; catatan: string };
  /** Alasan perbaikan bagian yang sudah disahkan. */
  alasan: string;
  /** Narasi formulir klinik: diagnosa banding dan KIE (Kesimpulan), obat yang diberikan di poli (Terapi). */
  diagnosis_banding: string;
  kie: string;
  obat_poli: string;
  versi_draf: number;
  lab_dipilih: boolean;
  order_lab: KeadaanOrderLab;
  /** Teks resep dokter (P3); diajukan saat simpan pemeriksaan. */
  resep: string;
};

/**
 * Keadaan dari draf server di atas dasar (catatan tersimpan): hanya bidang yang bentuknya sesuai yang diambil, sisanya tetap dari dasar,
 * sehingga draf lama atau rusak tidak merusak formulir.
 */
export function pulihkanKeadaan(dasar: KeadaanPemeriksaan, nilai: unknown): KeadaanPemeriksaan {
  if (!nilai || typeof nilai !== 'object' || Array.isArray(nilai)) return dasar;
  const n = nilai as Record<string, unknown>;
  // Draf format lama dibuang.
  if (n.versi_draf !== VERSI_DRAF) return dasar;
  const hasil: Record<string, unknown> = { ...dasar };
  for (const [kunci, d] of Object.entries(dasar)) {
    const v = n[kunci];
    if (kunci === 'order_lab') {
      const lab = v as Partial<KeadaanOrderLab> | null;
      if (lab && typeof lab === 'object') hasil[kunci] = {
        pemeriksaan: Array.isArray(lab.pemeriksaan) ? [...new Set(lab.pemeriksaan.filter((id) => Number.isInteger(id) && id > 0))] : [],
        prioritas: lab.prioritas === 'segera' ? 'segera' : 'rutin',
        catatan: typeof lab.catatan === 'string' ? lab.catatan : '',
      };
    } else if (typeof d === 'boolean') {
      if (typeof v === 'boolean') hasil[kunci] = v;
    } else if (typeof d === 'string') {
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

/** Versi format draf; draf dengan versi lain diabaikan. */
export const VERSI_DRAF = 3;

export const awalKeadaan = (): KeadaanPemeriksaan => ({
  anamnesis: { keluhan_utama: '', penyerta: '', riwayat_sekarang: '' },
  riwayat: { riwayat_pribadi: '', riwayat_keluarga: '', kajian_sosial: '' },
  tanda_vital: kosongTeks(TANDA_VITAL.map((t) => t.kunci)),
  keperawatan: kosongKeperawatan(),
  pemeriksaan: kosongTeks(PEMERIKSAAN_BIDANG),
  diagnosis: [],
  tindakan: [],
  tindak_lanjut: { jenis: '', tujuan: '', spri: '', catatan: '' },
  lab_dipilih: false, order_lab: awalOrderLab(), resep: awalResep(),
  alasan: '', diagnosis_banding: '', kie: '', obat_poli: '', versi_draf: VERSI_DRAF,
});

// --- Langkah dari konfigurasi ---

export type IdLangkah = 'keperawatan' | 'anamnesis' | 'pemeriksaan' | 'penunjang' | 'kesimpulan' | 'terapi' | 'tindak_lanjut' | 'ringkasan';
export type KonfigLangkah = {
  id: IdLangkah;
  judul: string;
  /** Bagian catatan yang diisi langkah ini (kosong untuk langkah tanpa catatan). */
  bagian?: BagianKlinis;
  bagianGrup?: readonly BagianKlinis[];
};

/** Langkah dokter mengikuti formulir rekam medis klinik (P7). */
export const LANGKAH_PEMERIKSAAN: readonly KonfigLangkah[] = [
  // Keperawatan diisi perawat saat skrining; dokter melihat ringkasannya di atas Anamnesa dan boleh mengubahnya (P6).
  { id: 'anamnesis', judul: KLINIS.langkah.anamnesis, bagianGrup: ['keperawatan', 'anamnesis'] },
  { id: 'pemeriksaan', judul: KLINIS.langkah.pemeriksaan, bagianGrup: ['tanda_vital', 'pemeriksaan'] },
  { id: 'penunjang', judul: KLINIS.langkah.penunjang },
  { id: 'kesimpulan', judul: KLINIS.langkah.kesimpulan, bagianGrup: ['diagnosis', 'diagnosis_banding', 'kie'] },
  { id: 'terapi', judul: KLINIS.langkah.terapi, bagianGrup: ['tindakan', 'obat_poli'] },
  { id: 'tindak_lanjut', judul: KLINIS.langkah.tindakLanjut, bagianGrup: ['tindak_lanjut'] },
  { id: 'ringkasan', judul: KLINIS.langkah.ringkasan },
];

export const bagianLangkah = (l: KonfigLangkah): readonly BagianKlinis[] => l.bagianGrup ?? (l.bagian ? [l.bagian] : []);

/** Indeks langkah dari draf; draf format lain mulai dari langkah pertama. */
export const langkahDraf = (langkah: number, nilai: unknown): number =>
  nilai && typeof nilai === 'object' && 'versi_draf' in nilai && nilai.versi_draf === VERSI_DRAF ? langkah : 0;

/** Skrining perawat (P6): tanda vital dan isian keperawatan dalam satu langkah, dua bagian tersimpan. */
export const LANGKAH_SKRINING: readonly KonfigLangkah[] = [
  { id: 'keperawatan', judul: KLINIS.langkah.keperawatan, bagianGrup: ['tanda_vital', 'keperawatan'] },
  { id: 'ringkasan', judul: KLINIS.langkah.ringkasanSkrining },
];

export const daftarLangkah = (mode: ModePemeriksaan): readonly KonfigLangkah[] => (mode === 'skrining' ? LANGKAH_SKRINING : LANGKAH_PEMERIKSAAN);
export const bagianDiModal = (mode: ModePemeriksaan): BagianKlinis[] => daftarLangkah(mode).flatMap((l) => [...bagianLangkah(l)]);

/** Nama bagian catatan untuk tampilan (ringkasan dan pesan galat). */
export const LABEL_BAGIAN: Record<BagianKlinis, string> = {
  ...LABEL_NARASI,
  anamnesis: KLINIS.langkah.anamnesis, tanda_vital: KLINIS.langkah.tandaVital, keperawatan: KLINIS.keperawatan.judul, pemeriksaan: KLINIS.langkah.pemeriksaan, diagnosis: KLINIS.langkah.diagnosis,
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
  for (const n of BAGIAN_NARASI) k[n] = b[n]?.isi?.isi ?? '';
  const a = b.anamnesis.isi;
  if (a) {
    k.anamnesis = { keluhan_utama: a.keluhan_utama, penyerta: teks(a.penyerta), riwayat_sekarang: teks(a.riwayat_sekarang) };
    k.riwayat = { riwayat_pribadi: teks(a.riwayat_pribadi), riwayat_keluarga: teks(a.riwayat_keluarga), kajian_sosial: teks(a.kajian_sosial) };
  }
  const kp = b.keperawatan?.isi;
  if (kp) k.keperawatan = keperawatanDariIsi(kp);
  const tv = b.tanda_vital.isi;
  if (tv) for (const t of TANDA_VITAL) k.tanda_vital[t.kunci] = tv[t.kunci] === null ? '' : String(tv[t.kunci]);
  const pm = b.pemeriksaan.isi;
  if (pm) for (const f of PEMERIKSAAN_BIDANG) k.pemeriksaan[f] = teks(pm[f]);
  k.diagnosis = (b.diagnosis.isi?.item ?? []).map((d) => ({ kode: d.kode, nama: d.nama, peran: d.peran, snomed: teks(d.snomed) }));
  k.tindakan = (b.tindakan.isi?.item ?? []).map((t) => ({ kode: t.kode, nama: t.nama, performer_id: t.performer_id, mulai: keInputLokal(t.mulai), selesai: keInputLokal(t.selesai), ...tarifJumlah(t) }));
  const tl = b.tindak_lanjut.isi;
  if (tl) k.tindak_lanjut = { jenis: tl.jenis, tujuan: teks(tl.tujuan), spri: teks(tl.spri), catatan: teks(tl.catatan) };
  return k;
}

/**
 * Keadaan awal form saat dibuka (sebelum draf): isi tersimpan, ditambah default keadaan baik untuk bagian yang belum pernah disimpan.
 * Skrining: keperawatan baru terisi default. Periksa: anamnesa (riwayat) dan pemeriksaan fisik baru terisi default; keperawatan tidak
 * (dokter membuka isiannya sendiri, lihat `mulaiUbahKeperawatan`).
 */
export function keadaanAwalForm(mode: ModePemeriksaan, b: BagianServer): KeadaanPemeriksaan {
  const k = keadaanDariServer(b);
  if (mode === 'skrining' && !b.keperawatan?.isi) k.keperawatan = defaultKeperawatan();
  if (mode === 'periksa') {
    if (!b.anamnesis.isi) k.riwayat = isiDefault(k.riwayat, DEFAULT_ANAMNESIS);
    if (!b.pemeriksaan.isi) k.pemeriksaan = isiDefault(k.pemeriksaan, DEFAULT_PEMERIKSAAN);
  }
  return k;
}

/** Dokter membuka isian keperawatan: bila belum pernah diisi, mulai dari default keadaan baik. */
export const mulaiUbahKeperawatan = (k: KeadaanPemeriksaan): KeadaanPemeriksaan => (keperawatanKosong(k.keperawatan) ? { ...k, keperawatan: defaultKeperawatan() } : k);

/** Isi yang dikirim ke API untuk satu bagian (server menormalkan dan memvalidasi ulang). */
export function isiBagian(bagian: BagianKlinis, k: KeadaanPemeriksaan): unknown {
  switch (bagian) {
    case 'diagnosis_banding': case 'kie': case 'obat_poli': return { isi: k[bagian] };
    case 'anamnesis': return { ...k.anamnesis, ...k.riwayat };
    case 'tanda_vital': return { ...k.tanda_vital };
    case 'keperawatan': return { ...k.keperawatan };
    case 'pemeriksaan': return { ...k.pemeriksaan };
    case 'diagnosis': return { item: k.diagnosis.map((d) => ({ kode: d.kode, nama: d.nama, peran: d.peran, snomed: d.snomed })) };
    case 'tindakan': return {
      item: k.tindakan.map((t) => ({
        kode: t.kode, nama: t.nama, tarif_layanan_id: t.tarif_layanan_id ?? null, jumlah: t.jumlah?.trim() ? t.jumlah.trim() : null,
        performer_id: t.performer_id, mulai: dariInputLokal(t.mulai), selesai: dariInputLokal(t.selesai),
      })),
    };
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

/** Pemeriksaan fisik hanya berisi default keadaan baik (belum ada isian dokter). */
const pemeriksaanHanyaDefault = (k: KeadaanPemeriksaan): boolean =>
  k.pemeriksaan.odontogram_tanggal === '' && isianDiubah(k.pemeriksaan, DEFAULT_PEMERIKSAAN).length === 0;

/** Tidak ada isian pada bagian ini (riwayat anamnesa yang masih default dianggap belum diisi). */
export function bagianKosong(bagian: BagianKlinis, k: KeadaanPemeriksaan): boolean {
  const kosong = (o: Record<string, string>) => Object.values(o).every((v) => v.trim() === '');
  switch (bagian) {
    case 'diagnosis_banding': case 'kie': case 'obat_poli': return !k[bagian].trim();
    case 'anamnesis': return kosong(k.anamnesis) && !k.riwayat.kajian_sosial.trim() && isianDiubah(k.riwayat, DEFAULT_ANAMNESIS).every((n) => !k.riwayat[n].trim());
    case 'tanda_vital': return kosong(k.tanda_vital);
    case 'keperawatan': return keperawatanKosong(k.keperawatan);
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
  const bagian = bagianDiModal(mode).filter((b) => perluDisimpan(b, k, server, disahkan[b]));
  // Pemeriksaan fisik yang masih default ikut disimpan bersama pemeriksaan dokter lainnya, bukan sendirian (membuka form tanpa mengisi apa pun).
  const hanyaDefault = !disahkan.pemeriksaan && pemeriksaanHanyaDefault(k) && bagian.every((b) => b === 'pemeriksaan');
  return bagian.filter((b) => !(hanyaDefault && b === 'pemeriksaan')).map((b) => ({ bagian: b, galat: galatBagian(b, k) }));
}

/** Perbaikan butuh alasan bila ada bagian yang sudah disahkan ikut disimpan. */
export const perluAlasan = (rencana: RencanaSimpan, disahkan: Record<BagianKlinis, boolean>): boolean => rencana.some((r) => disahkan[r.bagian]);

/** Syarat menyelesaikan pemeriksaan: anamnesis, diagnosis, dan tindak lanjut ada (tersimpan atau ikut disimpan sekarang). */
export function syaratSelesaiTerpenuhi(disahkan: Record<BagianKlinis, boolean>, rencana: RencanaSimpan): boolean {
  return (['anamnesis', 'diagnosis', 'tindak_lanjut'] as const).every((b) => disahkan[b] || rencana.some((r) => r.bagian === b));
}

export const disahkanDari = (b: BagianServer): Record<BagianKlinis, boolean> =>
  Object.fromEntries(BAGIAN_KLINIS.map((n) => [n, b[n]?.pengesahan != null])) as Record<BagianKlinis, boolean>;

export type StatusRingkasan = 'belum_diisi' | 'tanpa_perubahan' | 'akan_disimpan' | 'sudah_sah' | 'berubah';
/** Keadaan tiap bagian di ringkasan akhir. */
export function statusRingkasan(bagian: BagianKlinis, k: KeadaanPemeriksaan, server: KeadaanPemeriksaan, verifikasi: StatusPengesahan): StatusRingkasan {
  if (perluDisimpan(bagian, k, server, verifikasi !== 'belum_disahkan')) return 'akan_disimpan';
  if (verifikasi === 'berubah') return 'berubah';
  if (verifikasi === 'sah') return 'sudah_sah';
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

/**
 * Tambah tindakan dari daftar tindakan klinik (dengan `tarif_layanan_id`) atau kamus ICD-9-CM. Yang tidak boleh ganda adalah pasangan
 * kode dan tindakan klinik: dua tindakan klinik berbeda berkode sama boleh, kode kamus yang sama tidak ditambah dua kali.
 */
export function tambahTindakan(daftar: readonly ItemTindakan[], t: { kode: string; nama: string; tarif_layanan_id?: number | null }, sekarang: Date): ItemTindakan[] {
  const kode = t.kode.trim();
  const baru: ItemTindakan = { kode, nama: t.nama.trim(), mulai: keInputLokal(sekarang.toISOString()), selesai: '', ...(t.tarif_layanan_id ? { tarif_layanan_id: t.tarif_layanan_id } : {}) };
  if (!kode || daftar.some((x) => kunciTindakan(x) === kunciTindakan(baru))) return [...daftar];
  return [...daftar, baru];
}
/** Kunci baris tindakan di formulir (kode dan tindakan klinik). */
export const kunciItemTindakan = (t: ItemTindakan): string => kunciTindakan(t);
export const hapusTindakan = (daftar: readonly ItemTindakan[], kunci: string): ItemTindakan[] => daftar.filter((x) => kunciTindakan(x) !== kunci);
export const ubahTindakan = (daftar: readonly ItemTindakan[], kunci: string, p: Partial<ItemTindakan>): ItemTindakan[] =>
  daftar.map((x) => (kunciTindakan(x) === kunci ? { ...x, ...p } : x));

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
    hasil.anamnesis = { keluhan_utama: a.keluhan_utama, penyerta: teks(a.penyerta), riwayat_sekarang: teks(a.riwayat_sekarang) };
    hasil.riwayat = { riwayat_pribadi: teks(a.riwayat_pribadi), riwayat_keluarga: teks(a.riwayat_keluarga), kajian_sosial: teks(a.kajian_sosial) };
    jumlah += 1;
  }
  if (pilih.includes('diagnosis') && s.diagnosis) {
    hasil.diagnosis = s.diagnosis.item.map((d) => ({ kode: d.kode, nama: d.nama, peran: d.peran, snomed: teks(d.snomed) }));
    jumlah += 1;
  }
  if (pilih.includes('tindakan') && s.tindakan) {
    const mulai = keInputLokal(sekarang.toISOString());
    hasil.tindakan = s.tindakan.item.map((t) => ({ kode: t.kode, nama: t.nama, mulai, selesai: '', ...tarifJumlah(t) }));
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
      anamnesis: {
        keluhan_utama: ganti(k.anamnesis.keluhan_utama, 'keluhan_utama'), penyerta: ganti(k.anamnesis.penyerta, 'penyerta'), riwayat_sekarang: ganti(k.anamnesis.riwayat_sekarang, 'riwayat_sekarang'),
      },
      riwayat: {
        riwayat_pribadi: ganti(k.riwayat.riwayat_pribadi, 'riwayat_pribadi'), riwayat_keluarga: ganti(k.riwayat.riwayat_keluarga, 'riwayat_keluarga'), kajian_sosial: ganti(k.riwayat.kajian_sosial, 'kajian_sosial'),
      },
    };
  }
  return { ...k, pemeriksaan: Object.fromEntries(PEMERIKSAAN_BIDANG.map((n) => [n, isi(n) ?? k.pemeriksaan[n]])) as KeadaanPemeriksaan['pemeriksaan'] };
}

/** Alergi sebagai daftar singkat untuk kepala modal. */
export const daftarAlergi = (alergi: string | null): string[] => (alergi ?? '').split(/[\n,;]+/).map((a) => a.trim()).filter(Boolean);

/** Ringkasan pemeriksaan fisik per kelompok: kelompok normal satu kalimat, selain itu per bidang (bidang berubah ditandai "!"). */
export function barisPemeriksaanFisik(isi: Partial<Record<string, string | null>>): { label: string; nilai: string }[] {
  return ringkasanPemeriksaan(isi).flatMap((g) => {
    if (g.kelompok === 'odontogram') {
      const tgl = g.baris[0]?.nilai;
      return [{ label: g.label, nilai: tgl ? `${KLINIS.pemeriksaan.odontogramDibuat} (${tgl})` : KLINIS.pemeriksaan.odontogramBelum }];
    }
    if (g.kalimat) return [{ label: g.label, nilai: g.kalimat }];
    const terisi = g.baris.filter((b) => b.nilai !== null);
    return terisi.length ? [{ label: g.label, nilai: terisi.map((b) => `${b.label} ${b.nilai}${b.diubah ? ' (!)' : ''}`).join(', ') }] : [];
  });
}

/** Isi singkat untuk ringkasan akhir, urut blok formulir klinik. */
export function ringkasanIsi(k: KeadaanPemeriksaan): BagianRingkasan[] {
  const text = (v: string) => v.trim() || '-';
  const narasi = (b: BagianNarasi) => ({ label: LABEL_NARASI[b], nilai: text(k[b]) });
  const jenis = KLINIS.tindakLanjut.jenisOpsi.find((o) => o.nilai === k.tindak_lanjut.jenis)?.label ?? '-';
  const a = KLINIS.anamnesis;
  return [
    ...(keperawatanKosong(k.keperawatan) ? [] : [ringkasanKeperawatan(k.keperawatan)]),
    { judul: KLINIS.langkah.anamnesis, baris: [
      { label: a.keluhanUtama, nilai: text(k.anamnesis.keluhan_utama) },
      { label: a.penyerta, nilai: text(k.anamnesis.penyerta) },
      { label: a.riwayatSekarang, nilai: text(k.anamnesis.riwayat_sekarang) },
      { label: a.riwayatPribadi, nilai: text(k.riwayat.riwayat_pribadi) },
      { label: a.riwayatKeluarga, nilai: text(k.riwayat.riwayat_keluarga) },
      { label: a.kajianSosial, nilai: text(k.riwayat.kajian_sosial) },
    ] },
    { judul: KLINIS.langkah.pemeriksaan, baris: [
      ...TANDA_VITAL.filter((t) => k.tanda_vital[t.kunci]).map((t) => ({ label: KLINIS.tandaVital[t.kunci], nilai: `${k.tanda_vital[t.kunci]} ${t.satuan}` })),
      ...barisPemeriksaanFisik(k.pemeriksaan),
    ] },
    { judul: KLINIS.langkah.kesimpulan, baris: [
      ...k.diagnosis.map((d) => ({ label: d.kode, nilai: `${d.nama} (${d.peran === 'utama' ? KLINIS.kesimpulan.diagnosaMedis : KLINIS.kesimpulan.diagnosaTambahan})` })),
      narasi('diagnosis_banding'), narasi('kie'),
    ] },
    { judul: KLINIS.langkah.terapi, baris: [...k.tindakan.flatMap((t) => [
      { label: t.kode, nilai: t.jumlah && t.jumlah.trim() !== '1' ? `${t.nama} (${KLINIS.tindakan.jumlah} ${t.jumlah.trim()})` : t.nama },
    ]), narasi('obat_poli')] },
    { judul: KLINIS.langkah.tindakLanjut, baris: [
      { label: KLINIS.langkah.tindakLanjut, nilai: jenis },
      ...(k.tindak_lanjut.jenis === 'rujuk' ? [{ label: KLINIS.tindakLanjut.tujuan, nilai: text(k.tindak_lanjut.tujuan) }] : []),
      ...(k.tindak_lanjut.jenis === 'rawat_inap' ? [{ label: KLINIS.tindakLanjut.spri, nilai: text(k.tindak_lanjut.spri) }] : []),
      { label: 'Catatan tindak lanjut', nilai: text(k.tindak_lanjut.catatan) },
    ] },
  ];
}
