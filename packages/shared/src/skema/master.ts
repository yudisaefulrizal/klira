import { z } from 'zod';
import { MASTER } from '../teks';
import { profilProfesiMasukan, statusOperasional } from './entitas';
import { idPositif, tanggal, teksOpsional, teksWajib } from './umum';

/** Jenis master pada tab Master data (3.1); Wilayah hanya baca. SIP tenaga ada di Praktisi. */
export const JENIS_MASTER_UBAH = ['poli', 'ruang', 'bed', 'praktisi', 'jadwal', 'tarif'] as const;
export const JENIS_MASTER = [...JENIS_MASTER_UBAH, 'wilayah'] as const;
export type JenisMasterUbah = (typeof JENIS_MASTER_UBAH)[number];
export type JenisMaster = (typeof JENIS_MASTER)[number];
export const jenisMasterUbah = z.enum(JENIS_MASTER_UBAH, { error: MASTER.galat.jenisTakDikenal });
export const jenisMaster = z.enum(JENIS_MASTER, { error: MASTER.galat.jenisTakDikenal });

export const jenisTarif = z.enum(['konsultasi', 'tindakan', 'lab', 'kamar', 'obat']);
export const tingkatWilayah = z.enum(['provinsi', 'kabupaten_kota', 'kecamatan', 'kelurahan_desa']);

const jam = z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, MASTER.galat.waktu);
const harga = z.number({ error: MASTER.galat.angka }).int(MASTER.galat.angka).min(0, MASTER.galat.angka).max(2_000_000_000, MASTER.galat.angka);

export const poliMasukan = z.object({
  nama: teksWajib(200),
  ihs_location_id: teksOpsional(100),
  status_operasional: statusOperasional.default('O'),
});
export const ruangMasukan = poliMasukan.extend({ induk_id: idPositif.nullish() });
export const bedMasukan = poliMasukan.extend({
  induk_id: z.number({ error: MASTER.galat.indukBed }).int(MASTER.galat.indukBed).positive(MASTER.galat.indukBed),
});

export const praktisiMasukan = profilProfesiMasukan.extend({ pengguna_id: idPositif });
export const praktisiUbah = praktisiMasukan.omit({ pengguna_id: true });

const jadwalDasar = z.object({
  pengguna_id: idPositif,
  lokasi_id: idPositif,
  hari: z.number({ error: MASTER.galat.wajib }).int().min(1, MASTER.galat.wajib).max(7, MASTER.galat.wajib),
  jam_mulai: jam,
  jam_selesai: jam,
  kuota: z.number({ error: MASTER.galat.kuota }).int(MASTER.galat.kuota).min(1, MASTER.galat.kuota).max(10000, MASTER.galat.kuota),
  berlaku_dari: tanggal,
  berlaku_sampai: tanggal.nullish(),
});
export const jadwalMasukan = jadwalDasar
  .refine((j) => j.jam_selesai > j.jam_mulai, { path: ['jam_selesai'], message: MASTER.galat.jamSelesai })
  .refine((j) => !j.berlaku_sampai || j.berlaku_sampai >= j.berlaku_dari, { path: ['berlaku_sampai'], message: MASTER.galat.berlakuSampai });

export const tarifMasukan = z.object({
  kode: teksWajib(50),
  nama: teksWajib(200),
  jenis: jenisTarif,
  harga_umum: harga,
  harga_jkn: harga.nullish(),
});

export const SKEMA_MASTER = {
  poli: poliMasukan, ruang: ruangMasukan, bed: bedMasukan, praktisi: praktisiMasukan, jadwal: jadwalMasukan, tarif: tarifMasukan,
} as const satisfies Record<JenisMasterUbah, z.ZodType>;
/** Skema saat mengubah: praktisi tidak memuat pengguna (profil milik pengguna yang sama). */
export const SKEMA_MASTER_UBAH = { ...SKEMA_MASTER, praktisi: praktisiUbah } as const satisfies Record<JenisMasterUbah, z.ZodType>;

export const ubahAktifMaster = z.object({ aktif: z.boolean() });

export const STATUS_FILTER_MASTER = ['semua', 'aktif', 'nonaktif'] as const;
const kosongJadiTiada = (v: unknown) => (v === '' ? undefined : v);
export const filterMaster = z.object({
  cari: z.preprocess(kosongJadiTiada, z.string().trim().max(100).optional()),
  status: z.preprocess(kosongJadiTiada, z.enum(STATUS_FILTER_MASTER).default('semua')),
  tingkat: z.preprocess(kosongJadiTiada, tingkatWilayah.optional()),
  halaman: z.coerce.number().int().min(1).default(1),
  ukuran: z.coerce.number().int().min(1).max(100).default(20),
});
export type FilterMaster = z.infer<typeof filterMaster>;

export const SUMBER_OPSI_MASTER = ['poli', 'ruang', 'praktisi', 'pengguna-tanpa-profil'] as const;
export const sumberOpsiMaster = z.enum(SUMBER_OPSI_MASTER);
export type SumberOpsiMaster = (typeof SUMBER_OPSI_MASTER)[number];
export type OpsiMasterDto = { nilai: string; label: string };

export type TipeBidang = 'teks' | 'angka' | 'tanggal' | 'waktu' | 'pilihan' | 'rujukan';
/** Definisi bidang untuk bentuk generik MODAL-1: satu definisi per jenis master, bukan modal terpisah (3.3). */
export type BidangMaster = {
  kunci: string;
  label: string;
  tipe: TipeBidang;
  wajib?: boolean;
  /** Hanya tampil saat tambah (mis. pengguna pada praktisi). */
  hanyaTambah?: boolean;
  opsi?: readonly OpsiMasterDto[];
  rujukan?: SumberOpsiMaster;
  maks?: number;
  nilaiAwal?: string;
  /** Pilihan bernilai bilangan (mis. hari); dikirim sebagai angka. */
  numerik?: boolean;
};
export type KolomMaster = { kunci: string; label: string };
export type DefinisiMaster = { bidang: readonly BidangMaster[]; kolom: readonly KolomMaster[]; punyaStatus: boolean };

const opsiDari = (peta: Record<string | number, string>): OpsiMasterDto[] => Object.entries(peta).map(([nilai, label]) => ({ nilai, label }));
const B = MASTER.bidang;
const K = MASTER.kolom;
const bidangLokasi = (induk: BidangMaster[]): BidangMaster[] => [
  { kunci: 'nama', label: B.nama, tipe: 'teks', wajib: true, maks: 200 },
  ...induk,
  { kunci: 'status_operasional', label: B.status_operasional, tipe: 'pilihan', wajib: true, opsi: opsiDari(MASTER.operasional), nilaiAwal: 'O' },
  { kunci: 'ihs_location_id', label: B.ihs_location_id, tipe: 'teks', maks: 100 },
];

export const DEFINISI_MASTER: Record<JenisMaster, DefinisiMaster> = {
  poli: {
    bidang: bidangLokasi([]),
    kolom: [{ kunci: 'nama', label: K.nama }, { kunci: 'ihs_location_id', label: K.ihs }],
    punyaStatus: true,
  },
  ruang: {
    bidang: bidangLokasi([{ kunci: 'induk_id', label: B.induk_poli, tipe: 'rujukan', rujukan: 'poli' }]),
    kolom: [{ kunci: 'nama', label: K.nama }, { kunci: 'induk_nama', label: K.induk }, { kunci: 'ihs_location_id', label: K.ihs }],
    punyaStatus: true,
  },
  bed: {
    bidang: bidangLokasi([{ kunci: 'induk_id', label: B.induk_ruang, tipe: 'rujukan', rujukan: 'ruang', wajib: true }]),
    kolom: [{ kunci: 'nama', label: K.nama }, { kunci: 'induk_nama', label: K.induk }, { kunci: 'ihs_location_id', label: K.ihs }],
    punyaStatus: true,
  },
  praktisi: {
    bidang: [
      { kunci: 'pengguna_id', label: B.pengguna_id, tipe: 'rujukan', rujukan: 'pengguna-tanpa-profil', wajib: true, hanyaTambah: true },
      { kunci: 'profesi', label: B.profesi, tipe: 'teks', wajib: true, maks: 100 },
      { kunci: 'nomor_sip', label: B.nomor_sip, tipe: 'teks', maks: 100 },
      { kunci: 'masa_berlaku_sip', label: B.masa_berlaku_sip, tipe: 'tanggal' },
      { kunci: 'ihs_practitioner_id', label: B.ihs_practitioner_id, tipe: 'teks', maks: 100 },
    ],
    kolom: [{ kunci: 'pengguna_nama', label: K.praktisi }, { kunci: 'profesi', label: K.profesi }, { kunci: 'nomor_sip', label: K.sip }, { kunci: 'masa_berlaku_sip', label: K.berlaku }, { kunci: 'ihs_practitioner_id', label: K.ihs }],
    punyaStatus: true,
  },
  jadwal: {
    bidang: [
      { kunci: 'pengguna_id', label: B.praktisi_id, tipe: 'rujukan', rujukan: 'praktisi', wajib: true },
      { kunci: 'lokasi_id', label: B.lokasi_id, tipe: 'rujukan', rujukan: 'poli', wajib: true },
      { kunci: 'hari', label: B.hari, tipe: 'pilihan', wajib: true, opsi: opsiDari(MASTER.hari), nilaiAwal: '1', numerik: true },
      { kunci: 'jam_mulai', label: B.jam_mulai, tipe: 'waktu', wajib: true },
      { kunci: 'jam_selesai', label: B.jam_selesai, tipe: 'waktu', wajib: true },
      { kunci: 'kuota', label: B.kuota, tipe: 'angka', wajib: true },
      { kunci: 'berlaku_dari', label: B.berlaku_dari, tipe: 'tanggal', wajib: true },
      { kunci: 'berlaku_sampai', label: B.berlaku_sampai, tipe: 'tanggal' },
    ],
    kolom: [{ kunci: 'pengguna_nama', label: K.praktisi }, { kunci: 'lokasi_nama', label: K.poli }, { kunci: 'hari', label: K.hari }, { kunci: 'jam', label: K.jam }, { kunci: 'kuota', label: K.kuota }, { kunci: 'periode', label: K.periode }],
    punyaStatus: true,
  },
  tarif: {
    bidang: [
      { kunci: 'kode', label: B.kode, tipe: 'teks', wajib: true, maks: 50 },
      { kunci: 'nama', label: B.nama, tipe: 'teks', wajib: true, maks: 200 },
      { kunci: 'jenis', label: B.jenis, tipe: 'pilihan', wajib: true, opsi: opsiDari(MASTER.jenisTarif), nilaiAwal: 'konsultasi' },
      { kunci: 'harga_umum', label: B.harga_umum, tipe: 'angka', wajib: true },
      { kunci: 'harga_jkn', label: B.harga_jkn, tipe: 'angka' },
    ],
    kolom: [{ kunci: 'kode', label: K.kode }, { kunci: 'nama', label: K.nama }, { kunci: 'jenis', label: K.jenis }, { kunci: 'harga_umum', label: K.hargaUmum }, { kunci: 'harga_jkn', label: K.hargaJkn }],
    punyaStatus: true,
  },
  wilayah: {
    bidang: [],
    kolom: [{ kunci: 'kode', label: K.kode }, { kunci: 'nama', label: K.nama }, { kunci: 'tingkat', label: K.tingkat }, { kunci: 'induk_kode', label: K.indukKode }, { kunci: 'contoh', label: K.asal }],
    punyaStatus: false,
  },
};

/** Baris daftar master: bidang mentah (untuk mengisi bentuk ubah) ditambah nama rujukan untuk tampilan. */
export type BarisMaster = { id: number; aktif: boolean } & Record<string, string | number | boolean | null>;

const rupiah = (n: unknown) => (typeof n === 'number' ? `Rp ${n.toLocaleString('id-ID')}` : '-');

/** Teks sel tabel master (satu tempat agar web dan uji sama). */
export function teksSelMaster(kunci: string, baris: BarisMaster): string {
  const v = baris[kunci];
  switch (kunci) {
    case 'hari': return MASTER.hari[Number(v)] ?? '-';
    case 'jam': return `${baris.jam_mulai}-${baris.jam_selesai}`;
    case 'periode': return baris.berlaku_sampai ? `${baris.berlaku_dari} s/d ${baris.berlaku_sampai}` : `${baris.berlaku_dari} s/d -`;
    case 'jenis': return MASTER.jenisTarif[v as keyof typeof MASTER.jenisTarif] ?? String(v ?? '-');
    case 'tingkat': return MASTER.tingkat[v as keyof typeof MASTER.tingkat] ?? String(v ?? '-');
    case 'harga_umum': case 'harga_jkn': return rupiah(v);
    case 'contoh': return v ? MASTER.contoh : MASTER.resmi;
    default: return v === null || v === undefined || v === '' ? '-' : String(v);
  }
}
