import { z } from 'zod';
import { FARMASI } from '../teks';
import type { CaraPembayaran, JenisMutasi, StatusResep, StatusStok } from '../status';
import { idPositif, teksOpsional, teksWajib } from './umum';

const kosongJadiTiada = (v: unknown) => (v === '' || v === null ? undefined : v);
const tglIso = z.preprocess(kosongJadiTiada, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, FARMASI.galat.tanggal).optional());
/** Bilangan bulat dari teks; isian kosong ditolak (tidak dibaca sebagai 0). */
const bilanganBulat = (maks: number) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), z.coerce.number({ error: FARMASI.galat.angka }).int(FARMASI.galat.angka).min(0, FARMASI.galat.negatif).max(maks));

export const NILAI_JENIS_MUTASI = ['terima', 'keluar', 'koreksi'] as const;
/** Ambang stok menipis (satuan) dan kedaluwarsa dekat (hari) untuk penanda di tabel. */
export const AMBANG_STOK_MENIPIS = 50;
export const AMBANG_HARI_KEDALUWARSA = 90;

/** Pencarian katalog KFA (baca-saja): minimal dua huruf, dibatasi hasilnya. */
export const filterKfa = z.object({
  cari: z.string().trim().min(2, FARMASI.galat.cariPendek).max(100),
  batas: z.coerce.number().int().min(1).max(50).default(20),
});
export type FilterKfa = z.infer<typeof filterKfa>;
/** Satu produk KFA (tingkat 93). `lokal` bila berasal dari tambahan/ubahan klinik, bukan katalog resmi. */
export type ReferensiKfaDto = {
  kode: string; nama: string; bentuk_sediaan: string | null; satuan: string | null; status: string; lokal: boolean;
};

export const filterMasterObat = z.object({
  cari: z.string().trim().optional(),
  aktif: z.preprocess((v) => (v === 'true' ? true : v === 'false' ? false : undefined), z.boolean().optional()),
  halaman: z.coerce.number().int().min(1).default(1),
  ukuran: z.coerce.number().int().min(1).max(100).default(20),
});
export type FilterMasterObat = z.infer<typeof filterMasterObat>;

/** Master obat klinik: satu kode KFA per baris (tanpa obat ketik bebas), satuan dan harga milik klinik. */
export const masterObatMasukan = z.object({
  kfa_kode: teksWajib(30),
  nama_tampil: teksWajib(200),
  satuan: teksWajib(50),
  harga: bilanganBulat(100_000_000),
  aktif: z.boolean().default(true),
});
export type MasterObatMasukan = z.infer<typeof masterObatMasukan>;
/** Tanpa nilai bawaan: mengubah harga saja tidak boleh mengaktifkan kembali obat yang dinonaktifkan. */
export const ubahMasterObatMasukan = z
  .object({ nama_tampil: teksWajib(200), satuan: teksWajib(50), harga: bilanganBulat(100_000_000), aktif: z.boolean() })
  .partial()
  .refine((d) => Object.keys(d).length > 0, FARMASI.galat.tanpaPerubahan);
export type UbahMasterObatMasukan = z.infer<typeof ubahMasterObatMasukan>;

export type MasterObatDto = {
  id: number; kfa_kode: string; kfa_nama: string; nama_tampil: string; satuan: string; harga: number; aktif: boolean;
  bentuk_sediaan?: string | null; rute?: string | null;
  stok_total: number; kedaluwarsa_terdekat: string | null; status_stok: StatusStok;
};
export type HalamanMasterObatDto = { data: MasterObatDto[]; halaman: number; ukuran: number; total: number };

export type StokObatDto = { id: number; master_obat_id: number; batch: string; kedaluwarsa: string; jumlah: number };

/**
 * Mutasi stok (3.3 MODAL-1: terima, keluar, koreksi): terima menambah (batch baru bertanggal kedaluwarsa), keluar mengurangi (alasan wajib),
 * koreksi mengubah jumlah ke nilai sebenarnya (alasan wajib). Jumlah mutasi disimpan bertanda.
 */
export const mutasiStokMasukan = z
  .object({
    master_obat_id: idPositif,
    jenis: z.enum(NILAI_JENIS_MUTASI),
    batch: teksWajib(60),
    kedaluwarsa: tglIso,
    jumlah: bilanganBulat(1_000_000),
    alasan: teksOpsional(300),
  })
  .superRefine((d, ctx) => {
    if (d.jenis === 'terima' && d.jumlah < 1) ctx.addIssue({ code: 'custom', path: ['jumlah'], message: FARMASI.galat.jumlahMinimal });
    if (d.jenis === 'keluar' && d.jumlah < 1) ctx.addIssue({ code: 'custom', path: ['jumlah'], message: FARMASI.galat.jumlahMinimal });
    if (d.jenis === 'terima' && !d.kedaluwarsa) ctx.addIssue({ code: 'custom', path: ['kedaluwarsa'], message: FARMASI.galat.kedaluwarsaWajib });
    if (d.jenis !== 'terima' && !(d.alasan && d.alasan.trim())) ctx.addIssue({ code: 'custom', path: ['alasan'], message: FARMASI.galat.alasanWajib });
  });
export type MutasiStokMasukan = z.infer<typeof mutasiStokMasukan>;
export type MutasiStokDto = { id: number; stok_id: number; batch: string; jenis: JenisMutasi; jumlah: number; alasan: string | null; pengguna_nama: string | null; waktu: string };

/** Item resep diisi apoteker dari master obat klinik; jumlah = unit terpakai dari stok (racikan: total unit, dibulatkan ke atas). Obat yang sama boleh lebih dari sekali. */
export const itemResepMasukan = z.object({
  master_obat_id: idPositif,
  aturan_pakai: teksWajib(200),
  bentuk: teksOpsional(50),
  rute: teksOpsional(50),
  jumlah: z.preprocess((v) => (v === '' || v === null ? undefined : v), z.coerce.number({ error: FARMASI.galat.angka }).int(FARMASI.galat.angka).min(1, FARMASI.galat.jumlahMinimal).max(10_000)),
});
/** Daftar item resep yang disiapkan apoteker (boleh kosong saat telaah dicatat). */
export const daftarItemResepMasukan = z.array(itemResepMasukan).max(50);
/** Resep ditulis dokter sebagai teks bebas (termasuk merek dan racikan); item obat diisi apoteker saat telaah (P3). */
export const resepMasukan = z.object({ teks: teksWajib(2000) });
export type ResepMasukan = z.input<typeof resepMasukan>;

export type ItemResepDto = {
  id: number; master_obat_id: number; nama: string; satuan: string; aturan_pakai: string; bentuk: string | null; rute: string | null; jumlah: number; harga: number;
  stok_tersedia: number;
};
export type TelaahResepDto = { apoteker_nama: string | null; administratif: boolean; farmasetik: boolean; klinis: boolean; catatan: string | null; waktu: string };
export type ResepDto = {
  id: number; kunjungan_id: number; nomor_resep: string; teks: string; status: StatusResep; jenis_pembiayaan: CaraPembayaran; dpjp_nama: string | null; dibuat_pada: string;
  waktu_siap: string | null; item: ItemResepDto[]; telaah: TelaahResepDto | null;
};
export type HasilBuatResepDto = { resep: ResepDto; tagihan: { status_tagihan: string; status_pembayaran: string; total: number } };

export const filterRiwayatObat = z.object({
  status: z.preprocess(kosongJadiTiada, z.enum(['diajukan', 'ditelaah', 'siap', 'diserahkan']).optional()),
  dari: tglIso,
  sampai: tglIso,
  halaman: z.coerce.number().int().min(1).default(1),
  ukuran: z.coerce.number().int().min(1).max(100).default(20),
});
export type FilterRiwayatObat = z.infer<typeof filterRiwayatObat>;
export type RiwayatObatBarisDto = {
  id: number; kunjungan_id: number; nomor_resep: string; pasien_nama: string; pasien_nomor_rm: string; status: StatusResep; jumlah_item: number; dibuat_pada: string; dpjp_nama: string | null;
  /** Teks resep dokter dan ringkasan item yang disiapkan farmasi (nama, jumlah, satuan). */
  teks: string; item: { nama: string; jumlah: number; satuan: string }[];
};
export type RiwayatObatDto = { data: RiwayatObatBarisDto[]; halaman: number; ukuran: number; total: number };

/**
 * Telaah resep (administratif, farmasetik, klinis) bersama item obat yang disiapkan apoteker; disimpan dalam satu transaksi.
 * Item boleh kosong saat telaah dicatat; bila `item` tidak dikirim, item resep yang ada tidak diubah. Resep hanya dapat ditandai siap bila ketiga telaah terpenuhi dan ada minimal satu item.
 */
export const telaahMasukan = z
  .object({ administratif: z.boolean(), farmasetik: z.boolean(), klinis: z.boolean(), catatan: teksOpsional(1000), item: daftarItemResepMasukan.optional() })
  .superRefine((d, ctx) => {
    if (!(d.administratif && d.farmasetik && d.klinis) && !(d.catatan && d.catatan.trim())) ctx.addIssue({ code: 'custom', path: ['catatan'], message: FARMASI.galat.catatanTelaahWajib });
  });
export type TelaahMasukan = z.infer<typeof telaahMasukan>;
/** Bentuk kiriman dari formulir (jumlah item masih berupa teks). */
export type TelaahKirim = z.input<typeof telaahMasukan>;
export type HasilSiapDto = { resep: ResepDto; kekurangan: { master_obat_id: number; nama: string; butuh: number; tersedia: number }[]; tahap_kunjungan: string };

/** Status stok sebuah obat dari jumlah total dan kedaluwarsa terdekat (tanggal ISO) pada tanggal acuan. */
export function statusStokDari(total: number, kedaluwarsaTerdekat: string | null, sekarang: Date = new Date()): StatusStok {
  if (total <= 0) return 'habis';
  if (kedaluwarsaTerdekat) {
    const hari = (new Date(`${kedaluwarsaTerdekat}T00:00:00.000Z`).getTime() - sekarang.getTime()) / 86_400_000;
    if (hari <= AMBANG_HARI_KEDALUWARSA) return 'kedaluwarsa_dekat';
  }
  return total <= AMBANG_STOK_MENIPIS ? 'menipis' : 'aman';
}
