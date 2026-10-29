import type { Prisma } from '@prisma/client';
import { kunciPercakapanWhatsapp, pangkasPesanWhatsapp } from './retensi-whatsapp';
jest.mock('./klien', () => ({ prisma: {} }));
function buatTx() {
  let pesan = [
    ...Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      percakapan_id: 7,
      media_id: i === 0 ? 'lama' : i === 1 || i === 2 ? 'bersama' : null,
      status: 'terkirim',
    })),
    { id: 0, percakapan_id: 7, media_id: 'antre', status: 'antre' },
    { id: 13, percakapan_id: 7, media_id: 'mengirim', status: 'mengirim' },
    { id: 14, percakapan_id: 8, media_id: 'lain', status: 'diterima' },
  ];
  const tx = {
    $queryRaw: jest.fn(async () => [{ id: 7 }]),
    waPesan: {
      findMany: jest.fn(
        async (arg: { where: { percakapan_id?: number; media_id?: { in: string[] } }; skip?: number }) =>
          arg.where.media_id
            ? pesan.filter((p) => p.media_id && arg.where.media_id!.in.includes(p.media_id))
            : pesan
                .filter((p) => p.percakapan_id === arg.where.percakapan_id && !['antre', 'mengirim'].includes(p.status))
                .sort((a, b) => b.id - a.id)
                .slice(arg.skip ?? 0),
      ),
      deleteMany: jest.fn(async (arg: { where: { id: { in: number[] } } }) => {
        pesan = pesan.filter((p) => !arg.where.id.in.includes(p.id));
        return { count: arg.where.id.in.length };
      }),
    },
    waMedia: { deleteMany: jest.fn(async () => ({ count: 1 })) },
  };
  return { tx: tx as unknown as Prisma.TransactionClient, mock: tx, baca: () => pesan };
}
it('menyimpan sepuluh pesan selesai terbaru, melindungi antrean dan kontak lain, membersihkan media tak terpakai', async () => {
  const { tx, mock, baca } = buatTx();
  await kunciPercakapanWhatsapp(tx, 7);
  expect(mock.$queryRaw).toHaveBeenCalled();
  expect(await pangkasPesanWhatsapp(tx, 7)).toBe(2);
  expect(
    baca()
      .filter((p) => p.percakapan_id === 7 && !['antre', 'mengirim'].includes(p.status))
      .map((p) => p.id),
  ).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  expect(baca().some((p) => p.id === 0)).toBe(true);
  expect(baca().some((p) => p.id === 13)).toBe(true);
  expect(baca().some((p) => p.id === 14)).toBe(true);
  expect(mock.waMedia.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['lama'] } } });
});
it('pemangkasan berulang tidak menghapus ulang pesan atau lampiran', async () => {
  const { tx, mock } = buatTx();
  await pangkasPesanWhatsapp(tx, 7);
  mock.waMedia.deleteMany.mockClear();
  expect(await pangkasPesanWhatsapp(tx, 7)).toBe(0);
  expect(mock.waMedia.deleteMany).not.toHaveBeenCalled();
});
