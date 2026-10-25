import { nik, tanggal, pasienMasukan, paginasi, izinPerAkunMasukan, penugasanJenisMasukan, peringatanIzinMasukan, gantiKredensial, kredensialAwal } from './skema';

describe('skema', () => {
  it('NIK 16 digit', () => {
    expect(nik.safeParse('3201010101010001').success).toBe(true);
    expect(nik.safeParse('320101010101000').success).toBe(false);
    expect(nik.safeParse('32010101010100AB').success).toBe(false);
  });
  it('tanggal tidak sebelum 2014-06-03', () => {
    expect(tanggal.safeParse('2014-06-02T00:00:00Z').success).toBe(false);
    expect(tanggal.safeParse('2014-06-03T00:00:00Z').success).toBe(true);
  });
  it('pasien masukan', () => {
    const dasar = { nomor_rm: '1', nama: 'A', tanggal_lahir: '2000-01-01', jenis_kelamin: 'perempuan' };
    expect(pasienMasukan.safeParse(dasar).success).toBe(true);
    expect(pasienMasukan.safeParse({ ...dasar, nik: '1' }).success).toBe(false);
    expect(pasienMasukan.safeParse({ ...dasar, jenis_kelamin: 'x' }).success).toBe(false);
  });
  it('paginasi bawaan', () => {
    expect(paginasi.parse({})).toMatchObject({ halaman: 1, ukuran: 20 });
    expect(paginasi.safeParse({ ukuran: 1000 }).success).toBe(false);
  });
  it('izin per akun wajib alasan dan periode urut', () => {
    const d = { izin_id: 1, tipe: 'tambah', alasan: 'perlu', mulai: '2024-01-01', selesai: '2024-02-01' };
    expect(izinPerAkunMasukan.safeParse(d).success).toBe(true);
    expect(izinPerAkunMasukan.safeParse({ ...d, alasan: ' ' }).success).toBe(false);
    expect(izinPerAkunMasukan.safeParse({ ...d, selesai: '2023-12-01' }).success).toBe(false);
  });
  it('penugasan dan peringatan', () => {
    expect(penugasanJenisMasukan.safeParse({ jenis_akun_id: 1, mulai: '2024-01-01' }).success).toBe(true);
    expect(peringatanIzinMasukan.safeParse({ jenis_peringatan: 'x', alasan_pimpinan: 'y' }).success).toBe(false);
    expect(peringatanIzinMasukan.safeParse({ izin_id: 1, jenis_peringatan: 'x', alasan_pimpinan: 'y' }).success).toBe(true);
  });

  describe('ganti kredensial', () => {
    const baik = { username: 'dr.budi', kata_sandi_lama: 'lama', kata_sandi: 'Sandi1234', konfirmasi_kata_sandi: 'Sandi1234' };
    it('menerima masukan sah', () => {
      expect(gantiKredensial.safeParse(baik).success).toBe(true);
    });
    it('menolak kata sandi lemah, pendek, atau konfirmasi beda', () => {
      const uji = (s: object) => gantiKredensial.safeParse({ ...baik, ...s }).success;
      expect(uji({ kata_sandi: 'abc1', konfirmasi_kata_sandi: 'abc1' })).toBe(false);
      expect(uji({ kata_sandi: 'hurufsaja', konfirmasi_kata_sandi: 'hurufsaja' })).toBe(false);
      expect(uji({ kata_sandi: '1234567890', konfirmasi_kata_sandi: '1234567890' })).toBe(false);
      expect(uji({ konfirmasi_kata_sandi: 'Beda12345' })).toBe(false);
    });
    it('menolak username tidak sah dan kata sandi sama dengan username', () => {
      const uji = (s: object) => gantiKredensial.safeParse({ ...baik, ...s }).success;
      expect(uji({ username: 'ab' })).toBe(false);
      expect(uji({ username: 'ada spasi' })).toBe(false);
      expect(uji({ username: 'Sandi1234' })).toBe(false);
    });
    it('kredensial awal: bawaan dan penimpaan env', () => {
      expect(kredensialAwal({})).toEqual({ username: 'pimpinan', kataSandi: 'klira-awal-2026' });
      expect(kredensialAwal({ USERNAME_AWAL: ' x ', KATA_SANDI_AWAL: 'y' })).toEqual({ username: 'x', kataSandi: 'y' });
    });
  });
});
