import { awalSerah, bentukSerah, galatSerah } from './keadaan-farmasi';
import { awalBayar, awalShift, bisaTutup, daftarSyarat, diterapkan, galatBayar, galatBukaShift, galatTutupShift, kembalian, selisihShift } from './keadaan-kasir';

const gambaran = (syarat: Partial<{ tahap_kasir: boolean; tagihan_lengkap: boolean; resep_diserahkan: boolean; lunas: boolean }> = {}) =>
  ({ syarat: { tahap_kasir: true, tagihan_lengkap: true, resep_diserahkan: true, lunas: true, ...syarat } }) as never;

describe('pembayaran', () => {
  it('awal memakai sisa tagihan; jumlah wajib bilangan bulat positif dan metode sah', () => {
    expect(awalBayar(80_000)).toEqual({ metode: 'tunai', jumlah: '80000' });
    expect(awalBayar(0).jumlah).toBe('');
    expect(galatBayar({ metode: 'tunai', jumlah: '' }).jumlah).toBeTruthy();
    expect(galatBayar({ metode: 'tunai', jumlah: '0' }).jumlah).toBeTruthy();
    expect(galatBayar({ metode: 'tunai', jumlah: '1,5' }).jumlah).toBeTruthy();
    expect(galatBayar({ metode: 'qris', jumlah: '5000' })).toEqual({});
  });
  it('kembalian dan jumlah terapan dibatasi sisa', () => {
    expect(kembalian({ metode: 'tunai', jumlah: '100000' }, 80_000)).toBe(20_000);
    expect(kembalian({ metode: 'tunai', jumlah: '50000' }, 80_000)).toBe(0);
    expect(kembalian({ metode: 'tunai', jumlah: 'abc' }, 80_000)).toBe(0);
    expect(diterapkan({ metode: 'tunai', jumlah: '100000' }, 80_000)).toBe(80_000);
    expect(diterapkan({ metode: 'tunai', jumlah: '30000' }, 80_000)).toBe(30_000);
    expect(diterapkan({ metode: 'tunai', jumlah: '' }, 80_000)).toBe(0);
  });
});

describe('serah terima', () => {
  it('stok kurang hanya lanjut dengan alasan; tanpa izin tidak mengirim apa pun', () => {
    expect(bentukSerah(awalSerah())).toEqual({});
    expect(galatSerah({ izinkan: true, alasan: '' })).toBeTruthy();
    expect(galatSerah({ izinkan: true, alasan: 'stok fisik ada' })).toBeNull();
    expect(bentukSerah({ izinkan: true, alasan: 'stok fisik ada' })).toEqual({ izinkan_stok_kurang: true, alasan: 'stok fisik ada' });
  });
});

describe('syarat tutup kunjungan', () => {
  it('tahap, tagihan lengkap, dan resep diserahkan wajib; belum lunas butuh alasan', () => {
    expect(daftarSyarat(gambaran()).map((s) => s.kunci)).toEqual(['tahap', 'tagihan', 'resep', 'lunas']);
    expect(bisaTutup(gambaran(), '')).toBe(true);
    expect(bisaTutup(gambaran({ tahap_kasir: false }), '')).toBe(false);
    expect(bisaTutup(gambaran({ tagihan_lengkap: false }), 'alasan')).toBe(false);
    expect(bisaTutup(gambaran({ resep_diserahkan: false }), 'alasan')).toBe(false);
    expect(bisaTutup(gambaran({ lunas: false }), '')).toBe(false);
    expect(bisaTutup(gambaran({ lunas: false }), 'akan melunasi besok')).toBe(true);
  });
});

describe('shift', () => {
  it('kas awal wajib dan tidak negatif; tutup butuh alasan bila ada selisih', () => {
    expect(galatBukaShift(awalShift()).kas).toBeTruthy();
    expect(galatBukaShift({ kas: '-5', alasan: '' }).kas).toBeTruthy();
    expect(galatBukaShift({ kas: '100000', alasan: '' })).toEqual({});
    expect(galatTutupShift({ kas: '', alasan: '' }, 150_000).kas).toBeTruthy();
    expect(galatTutupShift({ kas: '150000', alasan: '' }, 150_000)).toEqual({});
    expect(galatTutupShift({ kas: '149500', alasan: '' }, 150_000).alasan).toBeTruthy();
    expect(galatTutupShift({ kas: '149500', alasan: 'uang kembalian' }, 150_000)).toEqual({});
    expect(selisihShift({ kas: '149500', alasan: '' }, 150_000)).toBe(-500);
    expect(selisihShift(awalShift(), 150_000)).toBeNull();
  });
});
