import type { ResepDto } from '@klira/shared';
import { simpanSeluruhTelaah } from './simpan-telaah';
const resep = (id: number, status: ResepDto['status'] = 'diajukan') => ({ id, status }) as ResepDto;
const isian = (siap: boolean) => ({ administratif: true, farmasetik: true, klinis: true, catatan: '', siap });
test('satu simpan mencatat semua telaah dan hanya menyiapkan resep yang dicentang', async () => {
  const urutan: string[] = [];
  const api = {
    telaah: jest.fn(async (id: number) => { urutan.push(`telaah ${id}`); return resep(id, 'ditelaah'); }),
    siapkan: jest.fn(async (id: number) => { urutan.push(`siap ${id}`); return { resep: resep(id, 'siap'), kekurangan: [], tahap_kunjungan: 'resep' }; }),
    tersimpan: jest.fn(), kekurangan: jest.fn(), selesaiResep: jest.fn(),
  };
  await simpanSeluruhTelaah([resep(1), resep(2), resep(3, 'siap')], { 1: isian(false), 2: isian(true) }, api);
  expect(urutan).toEqual(['telaah 1', 'telaah 2', 'siap 2']);
  expect(api.telaah.mock.calls[0]).toHaveLength(2);
  expect(api.selesaiResep).toHaveBeenCalledTimes(2);
});
test('kegagalan penyiapan tetap mengabarkan telaah yang berhasil dan menghentikan resep berikutnya', async () => {
  const api = {
    telaah: jest.fn(async (id: number) => resep(id, 'ditelaah')),
    siapkan: jest.fn(async () => { throw new Error('koneksi'); }),
    tersimpan: jest.fn(), kekurangan: jest.fn(), selesaiResep: jest.fn(),
  };
  await expect(simpanSeluruhTelaah([resep(1), resep(2)], { 1: isian(true), 2: isian(false) }, api)).rejects.toThrow('koneksi');
  expect(api.tersimpan).toHaveBeenCalledWith(resep(1, 'ditelaah'));
  expect(api.telaah).toHaveBeenCalledTimes(1);
  expect(api.selesaiResep).not.toHaveBeenCalled();
});
