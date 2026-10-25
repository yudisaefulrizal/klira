import type { PenggunaSaya } from '@klira/shared';
import { putuskanRute } from './penjaga-rute';

const dasar: PenggunaSaya = {
  id: 1, nama: 'A', username: 'a', fasyankes_id: 1, wajib_ganti_kredensial: false,
  jenis_akun: [], fitur: [], halaman_awal: '/pasien',
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
});
