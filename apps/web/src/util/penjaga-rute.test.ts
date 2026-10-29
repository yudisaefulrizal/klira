import type { PenggunaSaya } from '@klira/shared';
import { putuskanRute } from './penjaga-rute';

const dasar: PenggunaSaya = {
  id: 1, nama: 'A', username: 'a', fasyankes_id: 1, wajib_ganti_kredensial: false,
  jenis_akun: [], fitur: [], izin: [], halaman_awal: '/pasien',
};

describe('penjaga rute', () => {
  it('belum masuk: semua alamat ke /masuk, /masuk tampil', () => {
    expect(putuskanRute('/pasien', null)).toEqual({ tipe: 'alihkan', ke: '/masuk' });
    expect(putuskanRute('/', null)).toEqual({ tipe: 'alihkan', ke: '/masuk' });
    expect(putuskanRute('/masuk', null)).toEqual({ tipe: 'tampil' });
  });
  it('sudah masuk: /masuk dan alamat asing ke halaman awal', () => {
    expect(putuskanRute('/masuk', dasar)).toEqual({ tipe: 'alihkan', ke: '/pasien' });
    expect(putuskanRute('/', dasar)).toEqual({ tipe: 'alihkan', ke: '/pasien' });
    expect(putuskanRute('/pasien', dasar)).toEqual({ tipe: 'tampil' });
  });
  it('wajib ganti kredensial: semua alamat ke layar Ganti kredensial, termasuk halaman awal dan /masuk', () => {
    const awal = { ...dasar, wajib_ganti_kredensial: true };
    for (const p of ['/pasien', '/beranda', '/masuk', '/', '/apa-saja']) {
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
    expect(putuskanRute('/pengaturan', kasir)).toEqual({ tipe: 'alihkan', ke: '/pasien' });
    expect(putuskanRute('/pengaturan', { ...kasir, fitur: ['akses'] })).toEqual({ tipe: 'tampil' });
  });
});

describe('rute pengelolaan master kontekstual', () => {
  const rute = ['/pasien/layanan', '/rawat-inap/ruangan', '/kasir-klaim/tarif'];
  it('pemegang izin master dapat mengelola data tanpa memperoleh akses ke data klinis', () => {
    const admin: PenggunaSaya = { ...dasar, halaman_awal: '/beranda', fitur: ['master'], izin: [{ fitur: 'master', aksi: 'lihat', cakupan: 'unit' }] };
    for (const path of rute) expect(putuskanRute(path, admin)).toEqual({ tipe: 'tampil' });
    for (const path of ['/pasien', '/rawat-inap', '/kasir-klaim']) expect(putuskanRute(path, admin)).toEqual({ tipe: 'alihkan', ke: '/beranda' });
  });
  it('fitur klinis atau kasir saja tidak memberikan izin pengelolaan master', () => {
    const klinis = { ...dasar, fitur: ['pendaftaran', 'klinis', 'kasir'], izin: [] };
    for (const path of rute) expect(putuskanRute(path, klinis)).toEqual({ tipe: 'alihkan', ke: '/pasien' });
  });
  it('sesi dan kewajiban ganti kredensial tetap berlaku untuk alamat master baru', () => {
    for (const path of rute) {
      expect(putuskanRute(path, null)).toEqual({ tipe: 'alihkan', ke: '/masuk' });
      expect(putuskanRute(path, { ...dasar, wajib_ganti_kredensial: true, izin: [{ fitur: 'master', aksi: 'lihat', cakupan: 'unit' }] })).toEqual({ tipe: 'alihkan', ke: '/ganti-kredensial' });
    }
  });
});
