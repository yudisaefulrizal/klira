import { keadaanDariQuery, queryDariKeadaan, ubahKeadaan } from './penyaring-daftar';

describe('penyaring daftar pengguna', () => {
  it('keadaan dari alamat: bawaan, nilai tak valid diabaikan', () => {
    expect(keadaanDariQuery('')).toEqual({ cari: '', status: 'semua', halaman: 1 });
    expect(keadaanDariQuery('?cari=%20sari&status=aktif&halaman=3')).toEqual({ cari: 'sari', status: 'aktif', halaman: 3 });
    expect(keadaanDariQuery('?status=x&halaman=-2')).toEqual({ cari: '', status: 'semua', halaman: 1 });
  });
  it('query hanya memuat nilai non-bawaan dan bolak-balik sama', () => {
    expect(queryDariKeadaan({ cari: '', status: 'semua', halaman: 1 })).toBe('');
    expect(queryDariKeadaan({ cari: '', status: 'semua', halaman: 1 }, { tab: 'pengguna' })).toBe('?tab=pengguna');
    const k = { cari: 'a b', status: 'nonaktif' as const, halaman: 2 };
    expect(keadaanDariQuery(queryDariKeadaan(k, { tab: 'pengguna' }))).toEqual(k);
  });
  it('mengubah pencarian atau status kembali ke halaman 1, ganti halaman tidak', () => {
    const k = { cari: 'a', status: 'semua' as const, halaman: 4 };
    expect(ubahKeadaan(k, { cari: 'ab' }).halaman).toBe(1);
    expect(ubahKeadaan(k, { status: 'aktif' }).halaman).toBe(1);
    expect(ubahKeadaan(k, { halaman: 5 })).toEqual({ ...k, halaman: 5 });
    expect(ubahKeadaan(k, { cari: 'a' }).halaman).toBe(4);
  });
});
