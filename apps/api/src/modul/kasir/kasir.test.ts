import { statusTagihanDari, totalTagihan, tambahItemTagihanDalam } from './repositori';

describe('tagihan dasar', () => {
  it('status tagihan lengkap hanya bila semua item berharga', () => {
    expect(statusTagihanDari([50_000, 0])).toBe('lengkap');
    expect(statusTagihanDari([50_000, null])).toBe('belum_lengkap');
    expect(statusTagihanDari([])).toBe('lengkap');
  });
  it('total menjumlah harga x jumlah, item tanpa harga dihitung nol', () => {
    expect(totalTagihan([{ jumlah: 2, harga: 10_000 }, { jumlah: 1, harga: null }, { jumlah: 1, harga: 5_000 }])).toBe(25_000);
  });
  it('item ditambahkan ke tagihan kunjungan (dibuat bila belum ada) dan status dihitung ulang dalam transaksi yang sama', async () => {
    const dibuat: unknown[] = [];
    let status = '';
    const tx = {
      tagihan: {
        upsert: async () => ({ id: 9 }),
        update: async ({ data }: { data: { status_tagihan: string } }) => void (status = data.status_tagihan),
      },
      itemTagihan: {
        create: async ({ data }: { data: unknown }) => void dibuat.push(data),
        findMany: async () => [{ harga: 30_000 }, { harga: null }],
      },
    };
    const id = await tambahItemTagihanDalam(tx as never, 1, 5, 7, [
      { jenis: 'lab', tarifId: 2, kode: 'LAB-HB', nama: 'Hemoglobin', harga: 30_000, orderPenunjangId: 10 },
      { jenis: 'lab', tarifId: null, kode: 'X', nama: 'Tanpa tarif', harga: null, orderPenunjangId: 11 },
    ]);
    expect(id).toBe(9);
    expect(dibuat).toHaveLength(2);
    expect(dibuat[0]).toMatchObject({ tagihan_id: 9, order_penunjang_id: 10, harga: 30_000, jenis: 'lab' });
    expect(status).toBe('belum_lengkap');
  });
});
