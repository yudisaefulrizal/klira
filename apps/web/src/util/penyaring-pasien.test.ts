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
  it('tanggal bertahan saat ganti tahap dan mereset halaman', () => {
    const k = keadaanPasienDariQuery('?tanggal=2026-10-28&tahap=batal&halaman=3', 'semua');
    expect(ubahKeadaanPasien(k, { tanggal: '2026-10-29' }).halaman).toBe(1);
    expect(queryPasien(ubahKeadaanPasien(k, { tahap: 'ditutup' }))).toContain('tanggal=2026-10-28');
    expect(queryDaftarPasien({ ...k, ukuran: 20 })).toContain('tanggal=2026-10-28');
  });
  it('filter batal dapat diteruskan ke API', () => {
    const k = keadaanPasienDariQuery('?tahap=batal', 'semua');
    expect(k.tahap).toBe('batal');
    expect(queryDaftarPasien({ ...k, ukuran: 20 })).toContain('tahap=batal');
  });
  it('filter selesai dapat dipilih dan diteruskan ke API', () => {
    const k = keadaanPasienDariQuery('?tahap=ditutup', 'semua');
    expect(k.tahap).toBe('ditutup');
    expect(queryPasien(k)).toBe('?tahap=ditutup');
    expect(queryDaftarPasien({ ...k, ukuran: 20 })).toContain('tahap=ditutup');
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
    antrean: status ? { id: 9, kode: 'A-001', status } : null, lab: { perlu_spesimen: 0, perlu_hasil: 0 },
  });
  type Boleh = (f: string, a: string) => boolean;
  const semua: Boleh = () => true;
  const jenis = (b: PasienBarisDto, boleh: Boleh = semua) => aksiBaris(b, boleh).map((a) => a.jenis);

  it('tanpa kunjungan: daftarkan, buka, lalu panel pendamping', () => {
    expect(jenis(baris(null))).toEqual(['daftarkan', 'buka', 'riwayat', 'keluarga']);
  });
  it('antrean batal dapat didaftarkan ulang tanpa tindakan pelayanan', () => {
    expect(jenis(baris(kunj('batal')))).toEqual(['daftarkan', 'buka', 'riwayat', 'keluarga']);
  });
  it('antrean mengikuti status, diikuti tombol tahap dan panel pendamping', () => {
    expect(jenis(baris(kunj('menunggu')))).toEqual(['panggil', 'batal', 'skrining', 'buka', 'riwayat', 'keluarga']);
    expect(jenis(baris(kunj('dipanggil')))).toEqual(['panggil', 'mulai', 'batal', 'skrining', 'buka', 'riwayat', 'keluarga']);
    expect(jenis(baris(kunj('dilayani')))).toEqual(['selesai', 'skrining', 'buka', 'riwayat', 'keluarga']);
    expect(jenis(baris(kunj('selesai')))).toEqual(['skrining', 'buka', 'riwayat', 'keluarga']);
    expect(jenis(baris(kunj(null)))).toEqual(['skrining', 'buka', 'riwayat', 'keluarga']);
  });
  it('Skrining hanya pada tahap menunggu skrining, Periksa hanya pada tahap pemeriksaan, keduanya butuh izin klinis input', () => {
    const tahap = (t: 'menunggu_skrining' | 'pemeriksaan' | 'resep' | 'kasir') => ({ ...kunj(null)!, tahap_layanan: t });
    const nama = (t: 'menunggu_skrining' | 'pemeriksaan' | 'resep' | 'kasir', boleh: Boleh = semua) => jenis(baris(tahap(t)), boleh).filter((j) => j === 'skrining' || j === 'periksa');
    expect(nama('menunggu_skrining')).toEqual(['skrining']);
    expect(nama('pemeriksaan')).toEqual(['periksa']);
    expect(nama('resep')).toEqual([]);
    expect(nama('kasir')).toEqual([]);
    const tanpaInput: Boleh = (f, a) => f === 'klinis' && a === 'lihat';
    expect(nama('pemeriksaan', tanpaInput)).toEqual([]);
    expect(nama('menunggu_skrining', tanpaInput)).toEqual([]);
  });
  it('Persetujuan tindakan, Order lab, Ambil spesimen, dan Hasil lab hanya pada kunjungan berjalan sesuai izin', () => {
    const tahap = (t: 'menunggu_skrining' | 'pemeriksaan' | 'ditutup') => ({ ...kunj(null)!, tahap_layanan: t });
    const lab = (t: 'menunggu_skrining' | 'pemeriksaan' | 'ditutup', boleh: Boleh = semua) => jenis(baris(tahap(t)), boleh).filter((j) => ['persetujuan', 'order_lab', 'spesimen', 'hasil_lab'].includes(j));
    expect(lab('pemeriksaan')).toEqual(['persetujuan', 'order_lab', 'spesimen', 'hasil_lab']);
    expect(lab('menunggu_skrining')).toEqual([]);
    expect(lab('ditutup')).toEqual([]);
    expect(lab('pemeriksaan', (f, a) => f === 'penunjang' && a === 'input')).toEqual(['spesimen', 'hasil_lab']);
    expect(lab('pemeriksaan', (f, a) => f === 'klinis' && a === 'input')).toEqual(['order_lab']);
    expect(lab('pemeriksaan', (f, a) => f === 'persetujuan' && a === 'input')).toEqual(['persetujuan']);
  });
  it('Telaah resep hanya pada tahap resep dan untuk pemegang izin farmasi input', () => {
    const tahap = (t: 'pemeriksaan' | 'resep' | 'kasir') => ({ ...kunj(null)!, tahap_layanan: t });
    const telaah = (t: 'pemeriksaan' | 'resep' | 'kasir', boleh: Boleh = semua) => jenis(baris(tahap(t)), boleh).filter((j) => j === 'telaah');
    expect(telaah('resep')).toEqual(['telaah']);
    expect(telaah('pemeriksaan')).toEqual([]);
    expect(telaah('kasir')).toEqual([]);
    expect(telaah('resep', (f, a) => f === 'farmasi' && a === 'lihat')).toEqual([]);
  });
  it('Pembayaran dan Tutup kunjungan hanya pada tahap kasir sesuai izin kasir', () => {
    const tahap = (t: 'pemeriksaan' | 'resep' | 'kasir' | 'ditutup') => ({ ...kunj(null)!, tahap_layanan: t });
    const kasir = (t: 'pemeriksaan' | 'resep' | 'kasir' | 'ditutup', boleh: Boleh = semua) => jenis(baris(tahap(t)), boleh).filter((j) => j === 'bayar' || j === 'tutup_kunjungan');
    expect(kasir('kasir')).toEqual(['bayar', 'tutup_kunjungan']);
    expect(kasir('resep')).toEqual([]);
    expect(kasir('ditutup')).toEqual([]);
    expect(kasir('kasir', (f, a) => f === 'kasir' && a === 'input')).toEqual(['bayar']);
    expect(kasir('kasir', (f, a) => f === 'kasir' && a === 'perbaikan')).toEqual(['tutup_kunjungan']);
    expect(kasir('kasir', (f, a) => f === 'kasir' && a === 'lihat')).toEqual([]);
  });
  it('tombol tanpa izin tidak ditampilkan', () => {
    const hanyaLihat = (f: string, a: string) => f === 'pasien' && a === 'lihat';
    expect(jenis(baris(null), hanyaLihat)).toEqual(['buka', 'keluarga']);
    expect(jenis(baris(kunj('menunggu')), hanyaLihat)).toEqual(['buka', 'keluarga']);
    expect(jenis(baris(kunj('menunggu')), () => false)).toEqual([]);
    expect(jenis(baris(kunj('menunggu')), (f, a) => f === 'rekam-medis' && a === 'lihat')).toEqual(['buka', 'riwayat', 'keluarga']);
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
