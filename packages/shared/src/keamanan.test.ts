import { BATAS_KEAMANAN, filterPeringatan, formatUkuranByte, pengaturanKeamananEfektif, pengaturanKeamananMasukan } from './index';

describe('pengaturan keamanan', () => {
  it('bawaan aman bila kosong atau di luar batas', () => {
    const bawaan = { masa_sesi_jam: 12, batas_percobaan_masuk: 5, panjang_minimum_kata_sandi: 8 };
    expect(pengaturanKeamananEfektif(null)).toEqual(bawaan);
    expect(pengaturanKeamananEfektif(undefined)).toEqual(bawaan);
    expect(pengaturanKeamananEfektif({ masa_sesi_jam: 0, batas_percobaan_masuk: 99, panjang_minimum_kata_sandi: 2 })).toEqual(bawaan);
    expect(pengaturanKeamananEfektif({ masa_sesi_jam: 4, batas_percobaan_masuk: 3, panjang_minimum_kata_sandi: 10 })).toEqual({ masa_sesi_jam: 4, batas_percobaan_masuk: 3, panjang_minimum_kata_sandi: 10 });
  });

  it('skema menerima batas tepi dan menolak di luar batas atau bukan bulat', () => {
    const b = BATAS_KEAMANAN;
    expect(pengaturanKeamananMasukan.safeParse({ masa_sesi_jam: b.masaSesiJam.min, batas_percobaan_masuk: b.batasPercobaanMasuk.maks, panjang_minimum_kata_sandi: b.panjangMinimumKataSandi.min }).success).toBe(true);
    expect(pengaturanKeamananMasukan.safeParse({ masa_sesi_jam: b.masaSesiJam.maks + 1, batas_percobaan_masuk: 5, panjang_minimum_kata_sandi: 8 }).success).toBe(false);
    expect(pengaturanKeamananMasukan.safeParse({ masa_sesi_jam: 1.5, batas_percobaan_masuk: 5, panjang_minimum_kata_sandi: 8 }).success).toBe(false);
    expect(pengaturanKeamananMasukan.safeParse({ masa_sesi_jam: '5', batas_percobaan_masuk: 5, panjang_minimum_kata_sandi: 8 }).success).toBe(false);
  });

  it('memformat ukuran berkas', () => {
    expect(formatUkuranByte(null)).toBe('-');
    expect(formatUkuranByte(512)).toBe('512 B');
    expect(formatUkuranByte(1536)).toBe('1,5 KB');
    expect(formatUkuranByte(5 * 1024 ** 3)).toBe('5,0 GB');
  });

  it('filter peringatan: kosong diabaikan, rentang terbalik ditolak', () => {
    expect(filterPeringatan.parse({ jenis_peringatan: '', dari: '', pengguna_id: '' })).toMatchObject({ halaman: 1, ukuran: 20 });
    expect(filterPeringatan.safeParse({ dari: '2026-02-01T00:00:00Z', sampai: '2026-01-01T00:00:00Z' }).success).toBe(false);
    expect(filterPeringatan.safeParse({ jenis_peringatan: 'tidak-ada' }).success).toBe(false);
  });
});
