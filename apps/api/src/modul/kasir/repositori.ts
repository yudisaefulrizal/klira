import { prisma } from '@klira/db';
import type { Prisma } from '@klira/db';
import { hargaTarif } from '@klira/shared';
import type { CaraPembayaran, ItemTagihanDto, SinkronTagihanTindakan, TagihanDto } from '@klira/shared';

export interface RepositoriTagihan {
  /** Tagihan kunjungan (null bila belum ada tagihan). */
  ambil(fasyankesId: number, kunjunganId: number): Promise<TagihanDto | null>;
  kunjunganAda(fasyankesId: number, kunjunganId: number): Promise<boolean>;
}

export type ItemBaru = {
  jenis: 'konsultasi' | 'tindakan' | 'lab' | 'kamar' | 'obat';
  tarifId: number | null;
  kode: string;
  nama: string;
  harga: number | null;
  orderPenunjangId: number | null;
  jumlah?: number;
  itemResepId?: number | null;
};

/** Status tagihan: lengkap bila semua item berharga (terpisah dari status pembayaran, 4.5). */
export const statusTagihanDari = (harga: readonly (number | null)[]): 'lengkap' | 'belum_lengkap' => (harga.every((h) => h !== null) ? 'lengkap' : 'belum_lengkap');

/**
 * Tambah item ke tagihan kunjungan di dalam transaksi pemanggil (order lab, nanti tindakan dan obat); tagihan dibuat bila belum ada
 * dan status tagihan dihitung ulang. Mengembalikan id tagihan.
 */
export async function tambahItemTagihanDalam(tx: Prisma.TransactionClient, fasyankesId: number, kunjunganId: number, oleh: number, item: readonly ItemBaru[]): Promise<number> {
  const tagihan = await tx.tagihan.upsert({
    where: { kunjungan_id: kunjunganId }, update: {}, create: { fasyankes_id: fasyankesId, kunjungan_id: kunjunganId, dibuat_oleh: oleh },
  });
  for (const i of item) {
    await tx.itemTagihan.create({
      data: {
        fasyankes_id: fasyankesId, tagihan_id: tagihan.id, jenis: i.jenis, tarif_layanan_id: i.tarifId, kode: i.kode, nama: i.nama, harga: i.harga,
        order_penunjang_id: i.orderPenunjangId, jumlah: i.jumlah ?? 1, item_resep_id: i.itemResepId ?? null, harga_acuan: i.harga, dibuat_oleh: oleh,
      },
    });
  }
  const semua = await tx.itemTagihan.findMany({ where: { tagihan_id: tagihan.id }, select: { harga: true } });
  await tx.tagihan.update({ where: { id: tagihan.id }, data: { status_tagihan: statusTagihanDari(semua.map((x) => x.harga)) } });
  return tagihan.id;
}

type BarisItem = {
  id: number; jenis: ItemTagihanDto['jenis']; kode: string; nama: string; jumlah: number; harga: number | null; order_penunjang_id: number | null; manual?: boolean;
  tindakan_sumber?: boolean; harga_acuan?: number | null; alasan_ubah_harga?: string | null;
};
export const keItemDto = (i: BarisItem): ItemTagihanDto => ({
  id: i.id, jenis: i.jenis, kode: i.kode, nama: i.nama, jumlah: i.jumlah, harga: i.harga, order_penunjang_id: i.order_penunjang_id, manual: i.manual ?? false,
  tindakan_sumber: i.tindakan_sumber ?? false, harga_acuan: i.harga_acuan ?? null, alasan_ubah_harga: i.alasan_ubah_harga ?? null,
});

// ---- Item tagihan dari pencatatan tindakan dokter (P5) ----
export type TarifTindakan = { id: number; kode: string; nama: string; harga_umum: number | null; harga_jkn: number | null };
export type TindakanTercatat = { kode: string; nama: string; tarif_layanan_id?: number | null; jumlah?: number | null };
/** Item tagihan tindakan yang sudah ada (sumber pencatatan), untuk mempertahankan harga yang diisi atau diubah kasir. */
export type ItemTindakanLama = { tarif_layanan_id: number | null; kode: string; nama: string; jumlah: number; harga: number | null; harga_acuan: number | null; alasan_ubah_harga: string | null };
export type RencanaItemTindakan = { tarif_layanan_id: number | null; kode: string; nama: string; jumlah: number; harga: number | null; harga_acuan: number | null; alasan_ubah_harga: string | null };

const kunciItem = (i: { tarif_layanan_id: number | null; kode: string }) => `${i.tarif_layanan_id ?? ''}|${i.kode}`;

/**
 * Rencana item tagihan tindakan dari daftar tindakan terbaru (fungsi murni). Bertarif: kode dan nama tarif, harga sesuai cara bayar
 * (JKN pakai harga JKN bila ada, selain itu harga umum; null bila tanpa harga). Dari kamus: kode dan nama ICD-9-CM, harga null.
 * Harga yang sudah diubah kasir (beralasan) atau dilengkapi kasir (tarif tanpa harga) pada item yang sama dipertahankan.
 */
export function rencanaItemTindakan(item: readonly TindakanTercatat[], tarif: ReadonlyMap<number, TarifTindakan>, cara: CaraPembayaran, lama: readonly ItemTindakanLama[]): RencanaItemTindakan[] {
  const peta = new Map(lama.map((l) => [kunciItem(l), l]));
  return item.map((t) => {
    const tr = t.tarif_layanan_id ? tarif.get(t.tarif_layanan_id) : undefined;
    const dasar = tr
      ? { tarif_layanan_id: tr.id, kode: tr.kode, nama: tr.nama, harga: hargaTarif(tr, cara) }
      : { tarif_layanan_id: null, kode: t.kode, nama: t.nama, harga: null };
    const l = peta.get(kunciItem(dasar));
    const jumlah = t.jumlah ?? 1;
    if (l?.alasan_ubah_harga) return { ...dasar, jumlah, harga: l.harga, harga_acuan: l.harga_acuan, alasan_ubah_harga: l.alasan_ubah_harga };
    if (dasar.harga === null && l && l.harga !== null) return { ...dasar, jumlah, harga: l.harga, harga_acuan: l.harga_acuan, alasan_ubah_harga: null };
    return { ...dasar, jumlah, harga_acuan: dasar.harga, alasan_ubah_harga: null };
  });
}

const samaRencana = (a: readonly RencanaItemTindakan[], b: readonly ItemTindakanLama[]): boolean =>
  a.length === b.length && a.every((x, i) => kunciItem(x) === kunciItem(b[i]) && x.nama === b[i].nama && x.jumlah === b[i].jumlah && x.harga === b[i].harga);

/**
 * Sinkronkan item tagihan tindakan dari pencatatan dengan daftar tindakan terbaru (dalam transaksi pemanggil, kunci baris tagihan).
 * Item manual kasir dan item lain tidak tersentuh. `terkunci` bila perlu berubah tetapi tagihan sudah ada pembayaran atau kunjungan ditutup.
 */
export async function sinkronItemTindakanDalam(tx: Prisma.TransactionClient, fasyankesId: number, kunjunganId: number, oleh: number, item: readonly TindakanTercatat[]): Promise<SinkronTagihanTindakan> {
  const kunci = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM tagihan WHERE kunjungan_id = ${kunjunganId} AND fasyankes_id = ${fasyankesId} FOR UPDATE`;
  const k = await tx.kunjungan.findFirst({ where: { id: kunjunganId, fasyankes_id: fasyankesId }, select: { tahap_layanan: true, cara_pembayaran: true } });
  if (!k) return 'tidak_perlu';
  const tagihanId = kunci[0]?.id ?? null;
  const lama = tagihanId === null ? [] : await tx.itemTagihan.findMany({ where: { tagihan_id: tagihanId, tindakan_sumber: true }, orderBy: { id: 'asc' } });
  const ids = [...new Set(item.flatMap((t) => (t.tarif_layanan_id ? [t.tarif_layanan_id] : [])))];
  const tarif = ids.length ? await tx.tarifLayanan.findMany({ where: { id: { in: ids }, fasyankes_id: fasyankesId, jenis: 'tindakan' } }) : [];
  const rencana = rencanaItemTindakan(item, new Map(tarif.map((t) => [t.id, t])), k.cara_pembayaran, lama);
  if (samaRencana(rencana, lama)) return 'tidak_perlu';
  if (k.tahap_layanan === 'ditutup') return 'terkunci';
  if (tagihanId !== null && (await tx.pembayaran.count({ where: { tagihan_id: tagihanId } }))) return 'terkunci';
  const id = tagihanId ?? (await tx.tagihan.create({ data: { fasyankes_id: fasyankesId, kunjungan_id: kunjunganId, dibuat_oleh: oleh } })).id;
  await tx.itemTagihan.deleteMany({ where: { tagihan_id: id, tindakan_sumber: true } });
  if (rencana.length) {
    await tx.itemTagihan.createMany({
      data: rencana.map((r) => ({
        fasyankes_id: fasyankesId, tagihan_id: id, jenis: 'tindakan' as const, tarif_layanan_id: r.tarif_layanan_id, kode: r.kode.slice(0, 50), nama: r.nama.slice(0, 200), jumlah: r.jumlah,
        harga: r.harga, harga_acuan: r.harga_acuan, alasan_ubah_harga: r.alasan_ubah_harga, tindakan_sumber: true, dibuat_oleh: oleh,
      })),
    });
  }
  const semua = await tx.itemTagihan.findMany({ where: { tagihan_id: id }, select: { harga: true } });
  await tx.tagihan.update({ where: { id }, data: { status_tagihan: statusTagihanDari(semua.map((x) => x.harga)) } });
  return 'disinkron';
}

export const totalTagihan = (item: readonly { jumlah: number; harga: number | null }[]): number => item.reduce((s, i) => s + (i.harga ?? 0) * i.jumlah, 0);

export class RepositoriTagihanPrisma implements RepositoriTagihan {
  async kunjunganAda(fasyankesId: number, kunjunganId: number): Promise<boolean> {
    return (await prisma.kunjungan.count({ where: { id: kunjunganId, fasyankes_id: fasyankesId } })) > 0;
  }

  async ambil(fasyankesId: number, kunjunganId: number): Promise<TagihanDto | null> {
    const t = await prisma.tagihan.findFirst({ where: { kunjungan_id: kunjunganId, fasyankes_id: fasyankesId }, include: { item: { orderBy: { id: 'asc' } } } });
    if (!t) return null;
    return {
      id: t.id, kunjungan_id: t.kunjungan_id, status_tagihan: t.status_tagihan, status_pembayaran: t.status_pembayaran, total: totalTagihan(t.item), item: t.item.map(keItemDto),
    };
  }
}
