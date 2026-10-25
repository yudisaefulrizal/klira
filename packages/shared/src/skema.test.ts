import { nik, tanggal, pasienMasukan, paginasi, izinPerAkunMasukan, penugasanJenisMasukan, peringatanIzinMasukan } from './skema';

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
});
