import { AKSI_AUDIT, eksporAudit, filterAudit } from './skema/audit';

describe('skema audit', () => {
  it('memuat aksi standar', () => {
    for (const a of ['masuk', 'masuk_gagal', 'keluar', 'ganti_kredensial', 'izin_ditolak', 'input', 'perbaikan', 'lihat', 'ekspor', 'pemusnahan']) {
      expect(AKSI_AUDIT).toContain(a);
    }
  });
  it('filter: bawaan paginasi, string kosong diabaikan, aksi tak dikenal ditolak, rentang terbalik ditolak', () => {
    expect(filterAudit.parse({})).toMatchObject({ halaman: 1, ukuran: 20 });
    expect(filterAudit.parse({ aksi: '', entitas: '', pengguna_id: '' })).toMatchObject({ halaman: 1 });
    expect(filterAudit.parse({ pengguna_id: '5', aksi: 'lihat', ukuran: '50' })).toMatchObject({ pengguna_id: 5, aksi: 'lihat', ukuran: 50 });
    expect(filterAudit.safeParse({ aksi: 'hapus' }).success).toBe(false);
    expect(filterAudit.safeParse({ ukuran: 1000 }).success).toBe(false);
    expect(eksporAudit.safeParse({ dari: '2026-02-01', sampai: '2026-01-01' }).success).toBe(false);
  });
});
