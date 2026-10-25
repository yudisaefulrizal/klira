import { FARMASI, masterObatMasukan, mutasiStokMasukan, resepMasukan, telaahMasukan, ubahMasterObatMasukan } from '@klira/shared';
import type { MasterObatDto, ReferensiKfaDto, StokObatDto } from '@klira/shared';

type Isu = { path: PropertyKey[]; message: string };
/** Galat per bidang dari skema bersama (pesan sama dengan API); kunci = nama bidang, bidang di dalam daftar memakai `item.n.bidang`. */
const petakan = (isu: readonly Isu[]): Record<string, string> => {
  const g: Record<string, string> = {};
  for (const i of isu) g[i.path.map(String).join('.') || ''] ??= i.message;
  return g;
};

// ---- Master obat ----
export type KeadaanMasterObat = { kfa: ReferensiKfaDto | null; nama_tampil: string; satuan: string; harga: string; aktif: boolean };

export const awalMasterObat = (m?: MasterObatDto): KeadaanMasterObat => ({
  kfa: null, nama_tampil: m?.nama_tampil ?? '', satuan: m?.satuan ?? '', harga: m ? String(m.harga) : '', aktif: m?.aktif ?? true,
});

/** Memilih kode KFA mengisi nama tampil dan satuan awal bila masih kosong (boleh diubah klinik). */
export const pilihKfa = (k: KeadaanMasterObat, kfa: ReferensiKfaDto): KeadaanMasterObat => ({
  ...k, kfa, nama_tampil: k.nama_tampil.trim() ? k.nama_tampil : kfa.nama, satuan: k.satuan.trim() ? k.satuan : kfa.satuan ?? '',
});

/** Galat untuk tambah (kode KFA wajib) atau ubah (tanpa kode KFA; hanya bidang yang berubah divalidasi). */
export function galatMasterObat(k: KeadaanMasterObat, ubah: boolean): Record<string, string> {
  if (ubah) {
    const h = ubahMasterObatMasukan.safeParse({ nama_tampil: k.nama_tampil, satuan: k.satuan, harga: k.harga, aktif: k.aktif });
    return h.success ? {} : petakan(h.error.issues);
  }
  const g = petakan(masterObatMasukan.safeParse({ kfa_id: k.kfa?.id ?? 0, nama_tampil: k.nama_tampil, satuan: k.satuan, harga: k.harga, aktif: k.aktif }).error?.issues ?? []);
  if (!k.kfa) g.kfa_id = FARMASI.galat.kfaTidakAda;
  return g;
}
export const bentukTambahObat = (k: KeadaanMasterObat): Record<string, unknown> => ({ kfa_id: k.kfa?.id, nama_tampil: k.nama_tampil, satuan: k.satuan, harga: k.harga, aktif: k.aktif });

/** Hanya bidang yang berubah dikirim saat mengubah (PATCH). */
export function perubahanMasterObat(awal: KeadaanMasterObat, k: KeadaanMasterObat): Record<string, unknown> {
  const h: Record<string, unknown> = {};
  if (k.nama_tampil !== awal.nama_tampil) h.nama_tampil = k.nama_tampil;
  if (k.satuan !== awal.satuan) h.satuan = k.satuan;
  if (k.harga !== awal.harga) h.harga = k.harga;
  if (k.aktif !== awal.aktif) h.aktif = k.aktif;
  return h;
}

// ---- Mutasi stok ----
export type KeadaanMutasi = { obatId: string; jenis: 'terima' | 'keluar' | 'koreksi'; batch: string; kedaluwarsa: string; jumlah: string; alasan: string };
export const awalMutasi = (obatId = ''): KeadaanMutasi => ({ obatId, jenis: 'terima', batch: '', kedaluwarsa: '', jumlah: '', alasan: '' });
export const bentukMutasi = (k: KeadaanMutasi): Record<string, unknown> => ({
  master_obat_id: Number(k.obatId), jenis: k.jenis, batch: k.batch, kedaluwarsa: k.kedaluwarsa, jumlah: k.jumlah, alasan: k.alasan,
});
export function galatMutasi(k: KeadaanMutasi): Record<string, string> {
  const g = petakan(mutasiStokMasukan.safeParse(bentukMutasi(k)).error?.issues ?? []);
  if (!k.obatId) g.master_obat_id = FARMASI.galat.obatTidakAda;
  return g;
}
/** Mengganti jenis mutasi: batch dan kedaluwarsa dikosongkan agar tidak terbawa; batch yang ada dipilih dari daftar stok. */
export const gantiJenisMutasi = (k: KeadaanMutasi, jenis: KeadaanMutasi['jenis']): KeadaanMutasi => ({ ...k, jenis, batch: '', kedaluwarsa: '', jumlah: '' });
/** Memilih batch yang ada: kedaluwarsa dan (untuk koreksi) jumlah awal diambil dari stok. */
export function pilihBatch(k: KeadaanMutasi, stok: readonly StokObatDto[], batch: string): KeadaanMutasi {
  const s = stok.find((x) => x.batch === batch);
  return { ...k, batch, kedaluwarsa: s?.kedaluwarsa ?? k.kedaluwarsa, jumlah: k.jenis === 'koreksi' && s ? String(s.jumlah) : k.jumlah };
}

// ---- Resep ----
export type BarisResep = { master_obat_id: string; jumlah: string; aturan_pakai: string; bentuk: string; rute: string };
export const barisResepKosong = (): BarisResep => ({ master_obat_id: '', jumlah: '1', aturan_pakai: '', bentuk: '', rute: '' });
export const awalResep = (): BarisResep[] => [barisResepKosong()];
export const ubahBarisResep = (b: readonly BarisResep[], n: number, p: Partial<BarisResep>): BarisResep[] => b.map((x, i) => (i === n ? { ...x, ...p } : x));
export const hapusBarisResep = (b: readonly BarisResep[], n: number): BarisResep[] => (b.length <= 1 ? [barisResepKosong()] : b.filter((_, i) => i !== n));
export const bentukResep = (b: readonly BarisResep[]): { item: Record<string, unknown>[] } => ({
  item: b.map((x) => ({ master_obat_id: Number(x.master_obat_id), jumlah: x.jumlah, aturan_pakai: x.aturan_pakai, bentuk: x.bentuk.trim() || null, rute: x.rute.trim() || null })),
});
export function galatResep(b: readonly BarisResep[]): Record<string, string> {
  const g = petakan(resepMasukan.safeParse(bentukResep(b)).error?.issues ?? []);
  b.forEach((x, n) => {
    if (!x.master_obat_id) g[`item.${n}.master_obat_id`] = FARMASI.galat.obatTidakAda;
  });
  return g;
}
/** Perkiraan biaya resep dari harga master obat. */
export const biayaResep = (b: readonly BarisResep[], obat: readonly { id: number; harga: number }[]): number =>
  b.reduce((s, x) => s + (obat.find((o) => String(o.id) === x.master_obat_id)?.harga ?? 0) * (Number(x.jumlah) || 0), 0);

// ---- Telaah ----
export type KeadaanTelaah = { administratif: boolean; farmasetik: boolean; klinis: boolean; catatan: string };
export const awalTelaah = (t?: { administratif: boolean; farmasetik: boolean; klinis: boolean; catatan: string | null } | null): KeadaanTelaah => ({
  administratif: t?.administratif ?? false, farmasetik: t?.farmasetik ?? false, klinis: t?.klinis ?? false, catatan: t?.catatan ?? '',
});
export const telaahLengkap = (k: KeadaanTelaah): boolean => k.administratif && k.farmasetik && k.klinis;
export const galatTelaah = (k: KeadaanTelaah): Record<string, string> => petakan(telaahMasukan.safeParse({ ...k, catatan: k.catatan }).error?.issues ?? []);
