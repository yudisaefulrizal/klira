import { filterPengguna } from '@klira/shared';
import type { EntriAudit } from '../../middleware/audit';
import { buatLayananPengguna } from './layanan';
import type { RepositoriPengguna } from './repositori';

function siapkan(aktifAwal = true) {
  const audit: EntriAudit[] = [];
  const repo: RepositoriPengguna = {
    daftar: async () => ({ total: 1, baris: [{ id: 2, nama: 'B', username: 'b', aktif: true, jenis_akun_aktif: [], jumlah_izin_tambahan: 0, jumlah_peringatan_terbuka: 0 }] }),
    ubahAktif: async (_f, id, aktif) => (id === 99 ? null : { id, nama: 'B', aktif, aktifSebelumnya: aktifAwal }),
  };
  const layanan = buatLayananPengguna({ repo, audit: { catat: async (e) => void audit.push(e) } });
  return { layanan, audit };
}
const pelaku = { id: 1, fasyankes_id: 7 };

describe('layanan pengguna', () => {
  it('daftar membungkus paginasi', async () => {
    const { layanan } = siapkan();
    const h = await layanan.daftar(pelaku, filterPengguna.parse({ halaman: '2', ukuran: '5' }));
    expect(h).toMatchObject({ halaman: 2, ukuran: 5, total: 1 });
  });
  it('tidak bisa menonaktifkan akun sendiri, tidak tercatat', async () => {
    const { layanan, audit } = siapkan();
    const h = await layanan.ubah(pelaku, 1, { aktif: false });
    expect(h).toMatchObject({ ok: false, kode: 'konflik' });
    expect(audit).toHaveLength(0);
  });
  it('menonaktifkan akun lain tercatat di audit', async () => {
    const { layanan, audit } = siapkan();
    expect(await layanan.ubah(pelaku, 2, { aktif: false })).toEqual({ ok: true, data: { id: 2, aktif: false } });
    expect(audit).toEqual([expect.objectContaining({ aksi: 'perbaikan', entitas: 'pengguna', entitas_id: 2, pengguna_id: 1 })]);
  });
  it('tanpa perubahan tidak mencatat; pengguna asing 404', async () => {
    const a = siapkan(false);
    await a.layanan.ubah(pelaku, 2, { aktif: false });
    expect(a.audit).toHaveLength(0);
    expect(await a.layanan.ubah(pelaku, 99, { aktif: true })).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
  });
  it('filter: string kosong diabaikan, status tak dikenal ditolak', () => {
    expect(filterPengguna.parse({ cari: '', status: '', jenis_akun_id: '' })).toMatchObject({ status: 'semua', halaman: 1, ukuran: 20 });
    expect(filterPengguna.safeParse({ status: 'x' }).success).toBe(false);
  });
});
