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
  it('akun tanpa akses rekam medis ke Beranda tugas dan tidak boleh ke Daftar pasien', () => {
    const admin = { ...dasar, halaman_awal: '/beranda' };
    expect(putuskanRute('/pasien', admin)).toEqual({ tipe: 'alihkan', ke: '/beranda' });
    expect(putuskanRute('/beranda', admin)).toEqual({ tipe: 'tampil' });
  });
});
