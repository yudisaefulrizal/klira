import type { ResepDto } from '@klira/shared';
import { barisResepKosong } from './keadaan-farmasi';
import { bentukTelaah, galatIsianTelaah, simpanSeluruhTelaah } from './simpan-telaah';
const resep = (id: number, status: ResepDto['status'] = 'diajukan') => ({ id, status }) as ResepDto;
const baris = (p: Partial<ReturnType<typeof barisResepKosong>> = {}) => ({ ...barisResepKosong(), master_obat_id: '1', aturan_pakai: '3 x 1', ...p });
const isian = (siap: boolean, item = [baris()]) => ({ administratif: true, farmasetik: true, klinis: true, catatan: '', siap, item });
test('satu simpan mencatat semua telaah beserta item dan hanya menyiapkan resep yang dicentang', async () => {
  const urutan: string[] = [];
  const kiriman: unknown[] = [];
  const api = {
    telaah: jest.fn(async (id: number, m: unknown) => { urutan.push(`telaah ${id}`); kiriman.push(m); return resep(id, 'ditelaah'); }),
    siapkan: jest.fn(async (id: number) => { urutan.push(`siap ${id}`); return { resep: resep(id, 'siap'), kekurangan: [], tahap_kunjungan: 'resep' }; }),
    tersimpan: jest.fn(), kekurangan: jest.fn(), selesaiResep: jest.fn(),
  };
  await simpanSeluruhTelaah([resep(1), resep(2), resep(3, 'siap')], { 1: isian(false), 2: isian(true) }, api);
  expect(urutan).toEqual(['telaah 1', 'telaah 2', 'siap 2']);
  expect(kiriman[0]).toEqual({ administratif: true, farmasetik: true, klinis: true, catatan: '', item: [{ master_obat_id: 1, jumlah: '1', aturan_pakai: '3 x 1', bentuk: null, rute: 'Oral' }] });
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
test('tandai siap mensyaratkan ketiga telaah dan minimal satu item; obat sama boleh dua kali', () => {
  expect(galatIsianTelaah(isian(true))).toEqual({});
  expect(galatIsianTelaah(isian(true, [])).siap).toBeTruthy();
  expect(galatIsianTelaah(isian(false, []))).toEqual({});
  expect(galatIsianTelaah({ ...isian(true), klinis: false, catatan: 'cek' }).siap).toBeTruthy();
  expect(galatIsianTelaah(isian(false, [baris(), baris({ bentuk: 'puyer', jumlah: '5' })]))).toEqual({});
  expect(galatIsianTelaah(isian(false, [baris({ jumlah: '0' })]))['item.0.jumlah']).toBeTruthy();
  expect(galatIsianTelaah(isian(false, [baris({ jumlah: '1.5' })]))['item.0.jumlah']).toBeTruthy();
  expect(galatIsianTelaah(isian(false, [baris({ aturan_pakai: ' ' })]))['item.0.aturan_pakai']).toBeTruthy();
  expect(galatIsianTelaah(isian(false, [baris({ master_obat_id: '' })]))['item.0.master_obat_id']).toBeTruthy();
  expect(bentukTelaah(isian(false, [baris({ rute: ' oral ' })])).item).toEqual([{ master_obat_id: 1, jumlah: '1', aturan_pakai: '3 x 1', bentuk: null, rute: 'oral' }]);
});
