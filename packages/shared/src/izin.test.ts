import { HALAMAN_MENU, halamanMenuDiizinkan, punyaIzin } from './izin';

describe('punyaIzin', () => {
  const p = { izin: [{ fitur: 'akses', aksi: 'lihat' as const, cakupan: 'unit' as const }] };
  it('cocok pada fitur x aksi, cakupan opsional', () => {
    expect(punyaIzin(p, 'akses', 'lihat')).toBe(true);
    expect(punyaIzin(p, 'akses', 'lihat', 'unit')).toBe(true);
    expect(punyaIzin(p, 'akses', 'lihat', 'layanan')).toBe(false);
    expect(punyaIzin(p, 'akses', 'input')).toBe(false);
    expect(punyaIzin(p, 'klinis', 'lihat')).toBe(false);
  });
});

describe('halamanMenuDiizinkan', () => {
  const path = (f: string[]) => halamanMenuDiizinkan(f).map((h) => h.path);
  it('tanpa fitur hanya Beranda tugas', () => {
    expect(path([])).toEqual(['/beranda']);
  });
  it('menu memuat hanya halaman yang diizinkan', () => {
    expect(path(['kasir'])).toEqual(['/pasien', '/kasir-klaim', '/beranda']);
    expect(path(['pdp'])).toEqual(['/pelindungan-data', '/beranda']);
    expect(path(['akses', 'audit', 'rekam-medis'])).toContain('/pengaturan');
  });
  it('semua halaman bila semua fitur', () => {
    const semua = HALAMAN_MENU.flatMap((h) => h.fitur ?? []);
    expect(path(semua)).toHaveLength(HALAMAN_MENU.length);
  });
});
