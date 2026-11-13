import * as data from './data-access';
import { kunciPercakapanWhatsapp, pangkasPesanWhatsapp } from './retensi-whatsapp';
jest.mock('./data-access', () => ({
  kunciWaPercakapan: jest.fn(), daftarWaPesanUntukPangkasPesanWhatsapp: jest.fn(),
  daftarWaPesanUntukPangkasPesanWhatsapp2: jest.fn(), hapusWaPesanUntukPangkasPesanWhatsapp: jest.fn(),
  hapusWaMediaUntukPangkasPesanWhatsapp: jest.fn(),
}));
function buatTx() {
  let pesan = [
    ...Array.from({ length: 12 }, (_, i) => ({ id: i + 1, percakapan_id: 7, media_id: i === 0 ? 'lama' : i === 1 || i === 2 ? 'bersama' : null, status: 'terkirim' })),
    { id: 0, percakapan_id: 7, media_id: 'antre', status: 'antre' },
    { id: 13, percakapan_id: 7, media_id: 'mengirim', status: 'mengirim' },
    { id: 14, percakapan_id: 8, media_id: 'lain', status: 'diterima' },
  ];
  const tx = {} as data.Koneksi;
  jest.mocked(data.daftarWaPesanUntukPangkasPesanWhatsapp).mockImplementation(async (id, dilindungi, lewati) =>
    pesan.filter(p => p.percakapan_id === id && !dilindungi?.includes(p.status)).sort((a, b) => b.id - a.id).slice(lewati));
  jest.mocked(data.daftarWaPesanUntukPangkasPesanWhatsapp2).mockImplementation(async ids => pesan.filter(p => p.media_id && ids?.includes(p.media_id)));
  jest.mocked(data.hapusWaPesanUntukPangkasPesanWhatsapp).mockImplementation(async ids => {
    pesan = pesan.filter(p => !ids?.includes(p.id));
    return { count: ids?.length ?? 0 };
  });
  jest.mocked(data.hapusWaMediaUntukPangkasPesanWhatsapp).mockResolvedValue({ count: 1 });
  return { tx, baca: () => pesan };
}
beforeEach(() => jest.clearAllMocks());
it('menyimpan sepuluh pesan selesai terbaru, melindungi antrean dan kontak lain, membersihkan media tak terpakai', async () => {
  const { tx, baca } = buatTx();
  await kunciPercakapanWhatsapp(tx, 7);
  expect(data.kunciWaPercakapan).toHaveBeenCalledWith(7, tx);
  expect(await pangkasPesanWhatsapp(tx, 7)).toBe(2);
  expect(baca().filter(p => p.percakapan_id === 7 && !['antre', 'mengirim'].includes(p.status)).map(p => p.id)).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  for (const id of [0, 13, 14]) expect(baca().some(p => p.id === id)).toBe(true);
  expect(data.hapusWaMediaUntukPangkasPesanWhatsapp).toHaveBeenCalledWith(['lama'], tx);
});
it('pemangkasan berulang tidak menghapus ulang pesan atau lampiran', async () => {
  const { tx } = buatTx();
  await pangkasPesanWhatsapp(tx, 7);
  jest.mocked(data.hapusWaMediaUntukPangkasPesanWhatsapp).mockClear();
  expect(await pangkasPesanWhatsapp(tx, 7)).toBe(0);
  expect(data.hapusWaMediaUntukPangkasPesanWhatsapp).not.toHaveBeenCalled();
});
