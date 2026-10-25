import { BAWAAN_AUDIT, BAWAAN_PERINGATAN, bacaPenyaring, formatWaktu, penggunaIdSah, queryPenyaring, rentangIso, rentangTerbalik, saringanAudit, saringanEkspor, saringanPeringatan, totalHalaman, ubahPenyaring } from './penyaring-tab';

describe('penyaring tab', () => {
  it('membaca penyaring dari alamat dengan bawaan dan halaman sah', () => {
    expect(bacaPenyaring('?tab=audit&aksi=lihat&entitas=%20pasien%20&halaman=3&asing=x', BAWAAN_AUDIT)).toEqual({
      nilai: { pengguna: '', aksi: 'lihat', entitas: 'pasien', dari: '', sampai: '' }, halaman: 3,
    });
    expect(bacaPenyaring('?halaman=0', BAWAAN_AUDIT).halaman).toBe(1);
    expect(bacaPenyaring('?halaman=abc', BAWAAN_AUDIT).halaman).toBe(1);
  });

  it('menulis query hanya untuk nilai berbeda dari bawaan, dan bolak-balik konsisten', () => {
    const k = { nilai: { ...BAWAAN_PERINGATAN, jenis: 'nakes_tanpa_sip', cari: 'budi' }, halaman: 2 };
    const q = queryPenyaring('peringatan', k, BAWAAN_PERINGATAN);
    expect(q).toBe('?tab=peringatan&cari=budi&jenis=nakes_tanpa_sip&halaman=2');
    expect(bacaPenyaring(q, BAWAAN_PERINGATAN)).toEqual(k);
    expect(queryPenyaring('audit', { nilai: BAWAAN_AUDIT, halaman: 1 }, BAWAAN_AUDIT)).toBe('?tab=audit');
  });

  it('mengubah penyaring kembali ke halaman pertama', () => {
    expect(ubahPenyaring({ nilai: BAWAAN_AUDIT, halaman: 4 }, { aksi: 'ekspor' })).toEqual({ nilai: { ...BAWAAN_AUDIT, aksi: 'ekspor' }, halaman: 1 });
  });

  it('menghitung total halaman minimal satu', () => {
    expect(totalHalaman(0, 20)).toBe(1);
    expect(totalHalaman(41, 20)).toBe(3);
  });

  it('rentang tanggal menjadi UTC ISO dengan akhir hari inklusif, tanggal buruk diabaikan', () => {
    const r = rentangIso('2026-03-01', '2026-03-02');
    expect(new Date(r.dari!).getTime()).toBe(new Date('2026-03-01T00:00:00').getTime());
    expect(new Date(r.sampai!).getTime()).toBe(new Date('2026-03-02T23:59:59.999').getTime());
    expect(rentangIso('', 'bukan-tanggal')).toEqual({});
    expect(rentangTerbalik('2026-03-02', '2026-03-01')).toBe(true);
    expect(rentangTerbalik('2026-03-01', '2026-03-01')).toBe(false);
    expect(rentangTerbalik('', '2026-03-01')).toBe(false);
  });

  it('menyusun saringan API untuk audit, ekspor, dan peringatan', () => {
    const k = { nilai: { pengguna: '7', aksi: 'lihat', entitas: 'pasien', dari: '2026-03-01', sampai: '' }, halaman: 2 };
    const s = saringanAudit(k, 20);
    expect(s).toMatchObject({ halaman: 2, ukuran: 20, pengguna_id: 7, aksi: 'lihat', entitas: 'pasien' });
    expect(s.dari).toBeDefined();
    expect(s.sampai).toBeUndefined();
    const e = saringanEkspor(k);
    expect(e.halaman).toBeUndefined();
    expect(e.ukuran).toBeUndefined();
    expect(e.pengguna_id).toBe(7);
    expect(saringanAudit({ nilai: { ...BAWAAN_AUDIT, pengguna: 'x' }, halaman: 1 }, 20).pengguna_id).toBeUndefined();
    expect(saringanPeringatan({ nilai: { ...BAWAAN_PERINGATAN, jenis: 'nakes_tanpa_sip', cari: 'a' }, halaman: 1 }, 20)).toEqual({
      halaman: 1, ukuran: 20, cari: 'a', jenis_peringatan: 'nakes_tanpa_sip',
    });
  });

  it('memeriksa ID pengguna dan memformat waktu', () => {
    expect(['', '12'].every(penggunaIdSah)).toBe(true);
    expect(['0', '-1', '1.5', 'a'].some(penggunaIdSah)).toBe(false);
    expect(formatWaktu('2026-10-25T14:30:00.000Z', 'UTC')).toMatch(/14[.:]30/);
    expect(formatWaktu('rusak')).toBe('rusak');
  });
});
