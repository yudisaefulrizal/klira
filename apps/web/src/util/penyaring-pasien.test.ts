import type { PasienBarisDto } from '@klira/shared';
import { adalahPintasanCari, aksiBaris, keadaanPasienDariQuery, lamaMenunggu, queryPasien, tahapBawaan, ubahKeadaanPasien } from './penyaring-pasien';
import { queryDaftarPasien } from '../api-klien/pasien';

describe('filter bawaan per pekerjaan', () => {
  it('dokter, perawat, apoteker, kasir, lainnya', () => {
    expect(tahapBawaan(['pasien', 'klinis', 'resep', 'kunjungan'])).toBe('pemeriksaan');
    expect(tahapBawaan(['pasien', 'klinis', 'kunjungan'])).toBe('menunggu_skrining');
    expect(tahapBawaan(['pasien', 'farmasi'])).toBe('resep');
    expect(tahapBawaan(['pasien', 'kasir', 'klaim'])).toBe('kasir');
    expect(tahapBawaan(['pasien', 'pendaftaran', 'kunjungan'])).toBe('semua');
    expect(tahapBawaan([])).toBe('semua');
  });
});

describe('keadaan di alamat', () => {
  it('tahap dari alamat menang atas bawaan; tahap salah memakai bawaan', () => {
    expect(keadaanPasienDariQuery('?tahap=kasir&cari=%20Siti%20&halaman=3', 'pemeriksaan')).toEqual({ cari: 'Siti', tahap: 'kasir', halaman: 3 });
    expect(keadaanPasienDariQuery('', 'pemeriksaan')).toEqual({ cari: '', tahap: 'pemeriksaan', halaman: 1 });
    expect(keadaanPasienDariQuery('?tahap=ngawur&halaman=-2', 'resep')).toEqual({ cari: '', tahap: 'resep', halaman: 1 });
  });
  it('query selalu memuat tahap, pilihan semua tidak tertukar bawaan', () => {
    expect(queryPasien({ cari: '', tahap: 'semua', halaman: 1 })).toBe('?tahap=semua');
    expect(queryPasien({ cari: ' Budi ', tahap: 'pemeriksaan', halaman: 2 })).toBe('?tahap=pemeriksaan&cari=Budi&halaman=2');
    const k = { cari: 'Budi', tahap: 'resep' as const, halaman: 4 };
    expect(keadaanPasienDariQuery(queryPasien(k), 'semua')).toEqual(k);
  });
  it('mengubah penyaring kembali ke halaman 1, ganti halaman mempertahankannya', () => {
    const k = { cari: 'a', tahap: 'semua' as const, halaman: 3 };
    expect(ubahKeadaanPasien(k, { tahap: 'kasir' }).halaman).toBe(1);
    expect(ubahKeadaanPasien(k, { cari: 'b' }).halaman).toBe(1);
    expect(ubahKeadaanPasien(k, { halaman: 4 }).halaman).toBe(4);
    expect(ubahKeadaanPasien(k, { cari: 'a' }).halaman).toBe(3);
  });
  it('query API: tahap semua dan cari kosong tidak dikirim', () => {
    expect(queryDaftarPasien({ cari: ' ', tahap: 'semua', halaman: 1, ukuran: 20 })).toBe('halaman=1&ukuran=20');
    expect(queryDaftarPasien({ cari: 'Siti', tahap: 'resep', halaman: 2, ukuran: 20 })).toBe('halaman=2&ukuran=20&cari=Siti&tahap=resep');
  });
});

describe('tindakan per baris', () => {
  const baris = (kunjungan: PasienBarisDto['kunjungan']): PasienBarisDto => ({ id: 1, nomor_rm: 'X', nama: 'N', jenis_kelamin: 'perempuan', umur_tahun: 3, status_identitas: 'lengkap', kunjungan });
  const kunj = (status: 'menunggu' | 'dipanggil' | 'dilayani' | 'selesai' | 'batal' | null): PasienBarisDto['kunjungan'] => ({
    id: 5, jenis: 'AMB', status: 'arrived', tahap_layanan: 'menunggu_skrining', cara_pembayaran: 'umum', poli_nama: 'Umum', dpjp_nama: null, mulai: '2026-10-25T01:00:00Z',
    antrean: status ? { id: 9, kode: 'A-001', status } : null,
  });
  type Boleh = (f: string, a: string) => boolean;
  const semua: Boleh = () => true;
  const jenis = (b: PasienBarisDto, boleh: Boleh = semua) => aksiBaris(b, boleh).map((a) => a.jenis);

  it('tanpa kunjungan: daftarkan lalu buka', () => {
    expect(jenis(baris(null))).toEqual(['daftarkan', 'buka']);
  });
  it('antrean mengikuti status; tombol pemeriksaan/skrining belum ada', () => {
    expect(jenis(baris(kunj('menunggu')))).toEqual(['panggil', 'batal', 'buka']);
    expect(jenis(baris(kunj('dipanggil')))).toEqual(['panggil', 'mulai', 'batal', 'buka']);
    expect(jenis(baris(kunj('dilayani')))).toEqual(['selesai', 'buka']);
    expect(jenis(baris(kunj('selesai')))).toEqual(['buka']);
    expect(jenis(baris(kunj(null)))).toEqual(['buka']);
  });
  it('tombol tanpa izin tidak ditampilkan', () => {
    const hanyaLihat = (f: string, a: string) => f === 'pasien' && a === 'lihat';
    expect(jenis(baris(null), hanyaLihat)).toEqual(['buka']);
    expect(jenis(baris(kunj('menunggu')), hanyaLihat)).toEqual(['buka']);
    expect(jenis(baris(kunj('menunggu')), () => false)).toEqual([]);
    expect(jenis(baris(kunj('menunggu')), (f, a) => f === 'rekam-medis' && a === 'lihat')).toEqual(['buka']);
  });
});

describe('lama menunggu dan pintasan', () => {
  it('jam dan menit utuh, tidak negatif', () => {
    const sekarang = new Date('2026-10-25T03:30:00Z');
    expect(lamaMenunggu('2026-10-25T03:26:10Z', sekarang)).toEqual({ jam: 0, menit: 3 });
    expect(lamaMenunggu('2026-10-25T01:05:00Z', sekarang)).toEqual({ jam: 2, menit: 25 });
    expect(lamaMenunggu('2026-10-25T05:00:00Z', sekarang)).toEqual({ jam: 0, menit: 0 });
  });
  it('"/" memfokuskan pencarian kecuali saat mengetik', () => {
    expect(adalahPintasanCari({ key: '/', target: { tagName: 'BODY' } })).toBe(true);
    expect(adalahPintasanCari({ key: '/', target: { tagName: 'INPUT' } })).toBe(false);
    expect(adalahPintasanCari({ key: '/', target: { tagName: 'DIV', isContentEditable: true } })).toBe(false);
    expect(adalahPintasanCari({ key: '/', ctrlKey: true, target: null })).toBe(false);
    expect(adalahPintasanCari({ key: 'a', target: null })).toBe(false);
  });
});
