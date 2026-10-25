import { bentukKeamanan, formDariPengaturan, galatKeamanan, keamananBerubah } from './keadaan-keamanan';

const sah = { masa_sesi_jam: '12', batas_percobaan_masuk: '5', panjang_minimum_kata_sandi: '8' };

describe('keadaan keamanan', () => {
  it('membentuk isian dari pengaturan dan kembali ke angka', () => {
    const f = formDariPengaturan({ masa_sesi_jam: 8, batas_percobaan_masuk: 4, panjang_minimum_kata_sandi: 10 });
    expect(f).toEqual({ masa_sesi_jam: '8', batas_percobaan_masuk: '4', panjang_minimum_kata_sandi: '10' });
    expect(bentukKeamanan(f)).toEqual({ masa_sesi_jam: 8, batas_percobaan_masuk: 4, panjang_minimum_kata_sandi: 10 });
  });

  it('menerima nilai dalam batas dan menolak kosong, huruf, pecahan, serta di luar batas', () => {
    expect(galatKeamanan(sah)).toEqual({});
    expect(galatKeamanan({ ...sah, masa_sesi_jam: '' }).masa_sesi_jam).toBeDefined();
    expect(galatKeamanan({ ...sah, masa_sesi_jam: 'abc' }).masa_sesi_jam).toBeDefined();
    expect(galatKeamanan({ ...sah, batas_percobaan_masuk: '2' }).batas_percobaan_masuk).toBeDefined();
    expect(galatKeamanan({ ...sah, batas_percobaan_masuk: '5.5' }).batas_percobaan_masuk).toBeDefined();
    expect(galatKeamanan({ ...sah, panjang_minimum_kata_sandi: '7' }).panjang_minimum_kata_sandi).toBeDefined();
    expect(galatKeamanan({ ...sah, masa_sesi_jam: '1000' }).masa_sesi_jam).toBeDefined();
  });

  it('mendeteksi perubahan', () => {
    expect(keamananBerubah(sah, { ...sah })).toBe(false);
    expect(keamananBerubah(sah, { ...sah, masa_sesi_jam: '10' })).toBe(true);
  });
});
