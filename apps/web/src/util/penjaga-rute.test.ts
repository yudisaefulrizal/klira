import type { PenggunaSaya } from '@klira/shared';
import { putuskanRute } from './penjaga-rute';

const dasar: PenggunaSaya = {
  id: 1, nama: 'A', username: 'a', fasyankes_id: 1, wajib_ganti_kredensial: false,
  jenis_akun: [], fitur: [], izin: [], halaman_awal: '/pasien',
};

describe('penjaga rute', () => {
  it('belum masuk: semua alamat ke /masuk, /masuk tampil', () => {
    expect(putuskanRute('/pasien', null)).toEqual({ tipe: 'alihkan', ke: '/masuk' });
    expect(putuskanRute('/', null)).toEqual({ tipe: 'tampil' });
    expect(putuskanRute('/masuk', null)).toEqual({ tipe: 'tampil' });
  });
  it('sudah masuk: /masuk dan alamat asing ke halaman awal', () => {
    expect(putuskanRute('/masuk', dasar)).toEqual({ tipe: 'alihkan', ke: '/pasien' });
    expect(putuskanRute('/', dasar)).toEqual({ tipe: 'tampil' });
    expect(putuskanRute('/pasien', dasar)).toEqual({ tipe: 'tampil' });
  });
  it('wajib ganti kredensial: semua alamat ke layar Ganti kredensial, termasuk halaman awal dan /masuk', () => {
    const awal = { ...dasar, wajib_ganti_kredensial: true };
    for (const p of ['/pasien', '/beranda', '/masuk', '/apa-saja']) {
      expect(putuskanRute(p, awal)).toEqual({ tipe: 'alihkan', ke: '/ganti-kredensial' });
    }
    expect(putuskanRute('/ganti-kredensial', awal)).toEqual({ tipe: 'tampil' });
  });
  it('setelah ganti: layar Ganti kredensial dialihkan ke halaman awal sesuai jenis akun', () => {
    expect(putuskanRute('/ganti-kredensial', dasar)).toEqual({ tipe: 'alihkan', ke: '/pasien' });
    expect(putuskanRute('/ganti-kredensial', { ...dasar, halaman_awal: '/beranda' })).toEqual({ tipe: 'alihkan', ke: '/beranda' });
  });
  it('belum masuk tidak boleh membuka layar Ganti kredensial', () => {
    expect(putuskanRute('/ganti-kredensial', null)).toEqual({ tipe: 'alihkan', ke: '/masuk' });
  });
  it('akun tanpa akses rekam medis ke Beranda tugas dan tidak boleh ke Daftar pasien', () => {
    const admin = { ...dasar, halaman_awal: '/beranda' };
    expect(putuskanRute('/pasien', admin)).toEqual({ tipe: 'alihkan', ke: '/beranda' });
    expect(putuskanRute('/beranda', admin)).toEqual({ tipe: 'tampil' });
  });
  it('halaman lain hanya terbuka bila fitur efektif mengizinkan (5.1m)', () => {
    const kasir = { ...dasar, fitur: ['pendaftaran', 'kasir'] };
    expect(putuskanRute('/kasir-klaim', kasir)).toEqual({ tipe: 'tampil' });
    expect(putuskanRute('/rekam-medis', kasir)).toEqual({ tipe: 'alihkan', ke: '/pasien' });
    expect(putuskanRute('/akses', kasir)).toEqual({ tipe: 'alihkan', ke: '/pasien' });
    expect(putuskanRute('/akses', { ...kasir, fitur: ['akses'] })).toEqual({ tipe: 'tampil' });
    expect(putuskanRute('/pengaturan-klinik', { ...kasir, fitur: ['profil-klinik'] })).toEqual({ tipe: 'tampil' });
  });
});

describe('pengelolaan master sebagai tab di halaman pemiliknya', () => {
  const rute = ['/pasien', '/rawat-inap', '/kasir-klaim'];
  it('pemegang izin master dapat membuka halaman pemilik master tanpa akses ke halaman klinis lain', () => {
    const admin: PenggunaSaya = { ...dasar, halaman_awal: '/beranda', fitur: ['master'], izin: [{ fitur: 'master', aksi: 'lihat', cakupan: 'unit' }] };
    for (const path of rute) expect(putuskanRute(path, admin)).toEqual({ tipe: 'tampil' });
    for (const path of ['/farmasi', '/penunjang', '/rekam-medis']) expect(putuskanRute(path, admin)).toEqual({ tipe: 'alihkan', ke: '/beranda' });
  });
  it('tanpa izin master, halaman rawat inap dan kasir tetap menurut fitur klinis atau kasir', () => {
    const pendaftaran = { ...dasar, fitur: ['pendaftaran'], izin: [] };
    for (const path of ['/rawat-inap', '/kasir-klaim']) expect(putuskanRute(path, pendaftaran)).toEqual({ tipe: 'alihkan', ke: '/pasien' });
  });
  it('sesi dan kewajiban ganti kredensial tetap berlaku', () => {
    for (const path of rute) {
      expect(putuskanRute(path, null)).toEqual({ tipe: 'alihkan', ke: '/masuk' });
      expect(putuskanRute(path, { ...dasar, wajib_ganti_kredensial: true, izin: [{ fitur: 'master', aksi: 'lihat', cakupan: 'unit' }] })).toEqual({ tipe: 'alihkan', ke: '/ganti-kredensial' });
    }
  });
});

test('root dan halaman klinik publik terbuka tanpa sesi, termasuk saat akun wajib ganti kredensial', () => {
  for (const p of ['/', '/klinik/bhakti-rahayu']) {
    expect(putuskanRute(p, null)).toEqual({ tipe: 'tampil' });
    expect(putuskanRute(p, { ...dasar, wajib_ganti_kredensial: true })).toEqual({ tipe: 'tampil' });
  }
});
