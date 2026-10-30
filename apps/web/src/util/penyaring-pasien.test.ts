import type { PasienBarisDto } from '@klira/shared';
import { adalahPintasanCari, aksiBaris, keadaanPasienDariQuery, lamaMenunggu, queryPasien, ubahKeadaanPasien } from './penyaring-pasien';
import { queryDaftarPasien } from '../api-klien/pasien';

describe('satu daftar pasien', () => {
  it('mengabaikan tahap pada tautan lama agar seluruh pasien tetap terlihat', () => {
    for (const tahap of ['kasir', 'resep', 'batal', 'ditutup', 'pemeriksaan']) {
      const k = keadaanPasienDariQuery(`?tahap=${tahap}&cari=%20Siti%20&halaman=3&tanggal=2026-10-30`);
      expect(k).toEqual({ cari: 'Siti', halaman: 3, tanggal: '2026-10-30' });
      expect(queryPasien(k)).toBe('?tanggal=2026-10-30&cari=Siti&halaman=3');
    }
  });
  it('alamat kosong dan halaman tidak sah memakai daftar pertama', () => {
    expect(keadaanPasienDariQuery('')).toEqual({ cari: '', halaman: 1 });
    expect(keadaanPasienDariQuery('?halaman=-2')).toEqual({ cari: '', halaman: 1 });
    expect(queryPasien({ cari: '', halaman: 1 })).toBe('');
  });
  it('pencarian dan tanggal mereset halaman, sedangkan paginasi mempertahankannya', () => {
    const k = { cari: 'Budi', tanggal: '2026-10-30', halaman: 3 };
    expect(ubahKeadaanPasien(k, { cari: 'Siti' })).toEqual({ ...k, cari: 'Siti', halaman: 1 });
    expect(ubahKeadaanPasien(k, { tanggal: '2026-10-29' }).halaman).toBe(1);
    expect(ubahKeadaanPasien(k, { halaman: 4 })).toEqual({ ...k, halaman: 4 });
    expect(keadaanPasienDariQuery(queryPasien(k))).toEqual(k);
    expect(queryDaftarPasien({ ...k, tahap: 'semua', ukuran: 20 })).not.toContain('tahap=');
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
    expect(jenis(baris(kunj('dipanggil')))).toEqual(['panggil', 'batal', 'skrining', 'buka', 'riwayat', 'keluarga']);
    expect(jenis(baris(kunj('dilayani')))).toEqual(['skrining', 'buka', 'riwayat', 'keluarga']);
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
  it('penyerahan obat terpisah dari pembayaran dan hanya tersedia bagi farmasi pada tahap kasir', () => {
    const k = { ...kunj(null)!, tahap_layanan: 'kasir' as const };
    const farmasi = jenis(baris(k), (f, a) => f === 'farmasi' && a === 'input');
    expect(farmasi).toEqual(['serah_obat']);
    expect(jenis(baris(k), (f, a) => f === 'kasir' && a === 'input')).toEqual(['bayar']);
    expect(jenis(baris({ ...k, tahap_layanan: 'ditutup' }), semua)).not.toContain('serah_obat');
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
