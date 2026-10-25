import { prisma } from '@klira/db';
import type { Prisma } from '@klira/db';
import type { ItemTagihanDto, TagihanDto } from '@klira/shared';

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
        order_penunjang_id: i.orderPenunjangId, jumlah: i.jumlah ?? 1, item_resep_id: i.itemResepId ?? null, dibuat_oleh: oleh,
      },
    });
  }
  const semua = await tx.itemTagihan.findMany({ where: { tagihan_id: tagihan.id }, select: { harga: true } });
  await tx.tagihan.update({ where: { id: tagihan.id }, data: { status_tagihan: statusTagihanDari(semua.map((x) => x.harga)) } });
  return tagihan.id;
}

export const keItemDto = (i: { id: number; jenis: ItemTagihanDto['jenis']; kode: string; nama: string; jumlah: number; harga: number | null; order_penunjang_id: number | null }): ItemTagihanDto => ({
  id: i.id, jenis: i.jenis, kode: i.kode, nama: i.nama, jumlah: i.jumlah, harga: i.harga, order_penunjang_id: i.order_penunjang_id,
});

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
