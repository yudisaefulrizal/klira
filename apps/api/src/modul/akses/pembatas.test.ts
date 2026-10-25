import { PembatasPercobaan } from './pembatas';

describe('PembatasPercobaan', () => {
  it('membuang catatan kedaluwarsa agar memori tidak tumbuh tanpa batas', () => {
    let t = 1_000_000;
    const p = new PembatasPercobaan({ batasAkun: 5, batasAlamat: 20, jendelaMs: 1000, jedaMs: 500, maksCatatan: 100 }, () => t);
    for (let i = 0; i < 50; i++) p.catatGagal(`u${i}`, `a${i}`);
    expect(p.ukuran()).toEqual({ akun: 50, alamat: 50 });
    t += 2000;
    p.catatGagal('baru', 'alamat-baru');
    expect(p.ukuran()).toEqual({ akun: 1, alamat: 1 });
  });

  it('menyapu saat melewati batas jumlah, tanpa menghapus catatan yang masih berlaku', () => {
    let t = 1_000_000;
    const p = new PembatasPercobaan({ batasAkun: 5, batasAlamat: 20, jendelaMs: 100_000, jedaMs: 500, maksCatatan: 10 }, () => t);
    for (let i = 0; i < 10; i++) p.catatGagal(`u${i}`, 'a');
    t += 200_000;
    for (let i = 0; i < 10; i++) p.catatGagal(`v${i}`, 'a');
    expect(p.ukuran().akun).toBeLessThanOrEqual(11);
  });

  it('tidak membuang catatan yang masih terkunci', () => {
    let t = 1_000_000;
    const p = new PembatasPercobaan({ batasAkun: 2, batasAlamat: 100, jendelaMs: 1000, jedaMs: 10_000, maksCatatan: 100 }, () => t);
    p.catatGagal('x', 'a');
    p.catatGagal('x', 'a');
    t += 2000;
    p.bersihkan();
    expect(p.sisaJeda('x', 'zzz')).toBeGreaterThan(0);
  });
});
