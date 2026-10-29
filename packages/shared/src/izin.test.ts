import { IZIN_AWAL, JENIS_AKUN_AWAL, HALAMAN_MENU, halamanMenuDiizinkan, punyaIzin } from './izin';

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

describe('paket awal: izin pasien', () => {
  it('fitur pasien utuh (input) hanya untuk Petugas pendaftaran dan Perekam medis; peran lain hanya lihat', () => {
    const penuh = JENIS_AKUN_AWAL.filter((j) => j.fitur.includes('pasien')).map((j) => j.nama).sort();
    expect(penuh).toEqual(['Perekam Medis dan Informasi Kesehatan', 'Petugas pendaftaran']);
    const lihat = JENIS_AKUN_AWAL.filter((j) => j.lihat_saja?.includes('pasien')).map((j) => j.nama);
    expect(lihat).toEqual(expect.arrayContaining(['Dokter/DPJP', 'Perawat/Bidan/Nakes lain', 'Petugas klaim/kasir', 'Apoteker/tenaga kefarmasian', 'Analis lab']));
  });
});

describe('paket awal: penunjang dan persetujuan', () => {
  it('Analis lab memegang penunjang utuh; Dokter hanya melihat penunjang dan memegang persetujuan utuh', () => {
    const jenis = (nama: string) => JENIS_AKUN_AWAL.find((j) => j.nama === nama)!;
    expect(jenis('Analis lab').fitur).toEqual(['penunjang']);
    expect(jenis('Dokter/DPJP').fitur).toContain('persetujuan');
    expect(jenis('Dokter/DPJP').fitur).not.toContain('penunjang');
    expect(jenis('Dokter/DPJP').lihat_saja).toContain('penunjang');
  });
  it('persetujuan tidak diberi ke peran lain kecuali lihat untuk Perekam medis', () => {
    const penuh = JENIS_AKUN_AWAL.filter((j) => j.fitur.includes('persetujuan')).map((j) => j.nama);
    expect(penuh).toEqual(['Dokter/DPJP']);
    expect(JENIS_AKUN_AWAL.filter((j) => j.lihat_saja?.includes('persetujuan')).map((j) => j.nama)).toEqual(['Perekam Medis dan Informasi Kesehatan']);
  });
});

describe('izin WhatsApp tunggal', () => {
  it('hanya menawarkan satu pilihan WhatsApp dan membuka kedua menu terkait', () => {
    expect(IZIN_AWAL.filter(i => i.fitur === 'whatsapp')).toEqual([{ fitur: 'whatsapp', aksi: 'lihat', cakupan: 'unit' }]);
    expect(IZIN_AWAL.some(i => i.fitur === 'pesan')).toBe(false);
    const paths = halamanMenuDiizinkan(['whatsapp']).map(h => h.path);
    expect(paths).toEqual(expect.arrayContaining(['/pesan', '/pengaturan']));
  });
});
