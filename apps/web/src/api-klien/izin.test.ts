import { DAFTAR_PERINGATAN } from '@klira/shared';
import { daftarPeringatan } from './izin';

describe('daftarPeringatan', () => {
  afterEach(() => jest.restoreAllMocks());

  function balas(badan: unknown) {
    return jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(badan), { status: 200 }));
  }

  it.each([{ data: [] }, { data: [{ id: 1 }] }])('membaca objek halaman dengan data $data', async ({ data }) => {
    const halaman = { data, halaman: 1, ukuran: 20, total: data.length };
    const ambil = balas({ data: halaman });
    await expect(daftarPeringatan({ halaman: 1, ukuran: 20 })).resolves.toEqual(halaman);
    expect(ambil).toHaveBeenCalledWith('/api/peringatan-izin?halaman=1&ukuran=20', expect.objectContaining({ method: 'GET' }));
  });

  it.each([
    { data: [], halaman: 1, ukuran: 20, total: 0 }, // Format API lama: klien hanya menerima array.
    { data: { halaman: 1, ukuran: 20, total: 0 } },
    { data: { data: [], halaman: 1, ukuran: 0, total: 0 } },
    {},
  ])('menolak respons tidak sesuai agar tab menampilkan galat: %j', async (respons) => {
    balas(respons);
    await expect(daftarPeringatan({ halaman: 1, ukuran: 20 })).rejects.toMatchObject({
      message: DAFTAR_PERINGATAN.gagalMuat,
    });
  });
});
