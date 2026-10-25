import { batasPdp, butirKurang, BUTIR_PERJANJIAN, hakTerlambat, sisaJamPdp, tahapHakBerikut, tahapMusnahBerikut } from './pdp';

describe('batas 3x24 jam', () => {
  it('batas 72 jam dan sisa jam dibulatkan ke atas', () => {
    const t = new Date('2026-10-25T00:00:00Z');
    expect(batasPdp(t).toISOString()).toBe('2026-10-28T00:00:00.000Z');
    expect(sisaJamPdp(batasPdp(t), new Date('2026-10-27T23:30:00Z'))).toBe(1);
    expect(sisaJamPdp(batasPdp(t), new Date('2026-10-28T01:00:00Z'))).toBe(-1);
  });
  it('terlambat hanya bila belum selesai dan melewati batas', () => {
    const batas = new Date('2026-10-28T00:00:00Z');
    expect(hakTerlambat({ status: 'diterima', batas_waktu: batas }, new Date('2026-10-28T00:00:01Z'))).toBe(true);
    expect(hakTerlambat({ status: 'diterima', batas_waktu: batas }, new Date('2026-10-27T00:00:00Z'))).toBe(false);
    expect(hakTerlambat({ status: 'selesai', batas_waktu: batas }, new Date('2026-12-01T00:00:00Z'))).toBe(false);
  });
});

describe('tahap proses', () => {
  it('hak: keputusan, pelaksanaan (hanya disetujui), notifikasi (juga ditolak), lalu selesai', () => {
    expect(tahapHakBerikut('diterima')).toBe('keputusan');
    expect(tahapHakBerikut('disetujui')).toBe('pelaksanaan');
    expect(tahapHakBerikut('ditolak')).toBe('notifikasi');
    expect(tahapHakBerikut('dilaksanakan')).toBe('notifikasi');
    expect(tahapHakBerikut('selesai')).toBeNull();
  });
  it('pemusnahan: perintah ke prosesor lebih dulu, lalu pelaksanaan, lalu berita acara', () => {
    expect(tahapMusnahBerikut('direncanakan')).toBe('perintah');
    expect(tahapMusnahBerikut('diperintahkan')).toBe('pelaksanaan');
    expect(tahapMusnahBerikut('dilaksanakan')).toBe('berita_acara');
    expect(tahapMusnahBerikut('selesai')).toBeNull();
  });
  it('butir perjanjian: 11 butir dan kekurangannya', () => {
    expect(BUTIR_PERJANJIAN).toHaveLength(11);
    expect(butirKurang(BUTIR_PERJANJIAN.slice(0, 9))).toEqual(['sub_prosesor', 'pengembalian_hapus']);
    expect(butirKurang(BUTIR_PERJANJIAN)).toEqual([]);
  });
});
