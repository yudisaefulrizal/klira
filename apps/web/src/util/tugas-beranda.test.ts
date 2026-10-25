import { tugasPdp } from './tugas-beranda';

const nol = { hak_aktif: 0, hak_terlambat: 0, insiden_belum_notifikasi: 0, insiden_terlambat: 0, dpia_jatuh_tempo: 0, pemusnahan_terlambat: 0 };

describe('tugas Beranda PDP', () => {
  it('kosong bila semua nol', () => {
    expect(tugasPdp(nol)).toEqual([]);
  });
  it('yang lewat batas mendesak dan didahulukan; sisa yang belum lewat tidak ganda', () => {
    const t = tugasPdp({ hak_aktif: 5, hak_terlambat: 2, insiden_belum_notifikasi: 1, insiden_terlambat: 1, dpia_jatuh_tempo: 3, pemusnahan_terlambat: 0 });
    expect(t.map((x) => x.kunci)).toEqual(['hak_terlambat', 'insiden_terlambat', 'dpia_jatuh_tempo', 'hak_aktif']);
    expect(t.filter((x) => x.mendesak)).toHaveLength(3);
    expect(t.find((x) => x.kunci === 'hak_aktif')?.teks).toContain('3 permintaan');
    expect(t.find((x) => x.kunci === 'hak_aktif')?.tab).toBe('hak');
  });
});
