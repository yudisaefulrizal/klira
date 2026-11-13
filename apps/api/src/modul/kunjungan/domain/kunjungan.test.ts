import { REGISTRASI } from '@klira/shared';
import { buatLayananKunjungan } from './layanan';
import type { RepositoriKunjungan } from '../data-access/repositori';

describe('layanan kunjungan dengan repositori tiruan', () => {
  const catatan: { entitas: string; aksi: string }[] = [];
  const saya = { id: 3, fasyankes_id: 1 };
  const kunjungan = { id: 5, antrean: { id: 8, nomor: 1, kode: 'A-001', status: 'menunggu' } };
  const dasarRepo = {
    pasienAda: async (f: number, id: number) => f === 1 && id === 10,
    poliOperasional: async (f: number, id: number) => f === 1 && id === 20,
    dpjpSah: async (f: number, id: number) => f === 1 && (id === 30 || id === 32),
    dokterDiPoli: async (f: number, id: number, lokasi: number) => f === 1 && id === 30 && lokasi === 20,
    kunjunganBerjalan: async () => false,
    daftarkan: jest.fn(async () => kunjungan),
    tahapSekarang: async (f: number, id: number) => (f === 1 && id === 5 ? 'pemeriksaan' : null),
    ubahTahap: jest.fn(async () => kunjungan),
    statusAntrean: async (f: number, id: number) => (f === 1 && id === 8 ? 'menunggu' : null),
    ubahAntrean: jest.fn(async () => ({ id: 8, kode: 'A-001' })),
  };
  const buat = (sisa: object = {}) =>
    buatLayananKunjungan({ repo: { ...dasarRepo, ...sisa } as unknown as RepositoriKunjungan, audit: { catat: async (e) => void catatan.push(e) }, sekarang: () => new Date('2026-10-25T01:00:00Z') });
  beforeEach(() => {
    catatan.length = 0;
    jest.clearAllMocks();
  });
  const masukan = { pasien_id: 10, jenis: 'AMB' as const, lokasi_id: 20, dpjp_id: 30, cara_pembayaran: 'jkn' as const, nomor_sep: ' ', keluhan_singkat: ' batuk ' };

  it('mendaftarkan dengan nilai dinormalkan dan mencatat audit input', async () => {
    const h = await buat().daftarkan(saya, masukan);
    expect(h).toMatchObject({ ok: true });
    expect(dasarRepo.daftarkan).toHaveBeenCalledWith(1, 3, expect.objectContaining({ nomor_sep: null, keluhan_singkat: 'batuk' }), new Date('2026-10-25T01:00:00Z'));
    expect(catatan).toEqual([expect.objectContaining({ aksi: 'input', entitas: 'kunjungan' })]);
  });
  it('menolak dokter yang tidak bertugas di poli terpilih; dokter boleh kosong', async () => {
    const l = buat();
    expect(await l.daftarkan(saya, { ...masukan, dpjp_id: 32 })).toMatchObject({ ok: false, kode: 'tidak_valid', pesan: REGISTRASI.galat.dokterBukanPoli });
    expect(dasarRepo.daftarkan).not.toHaveBeenCalled();
    expect(await l.daftarkan(saya, { ...masukan, dpjp_id: undefined })).toMatchObject({ ok: true });
    // Rawat inap langsung tanpa poli: tidak ada pemeriksaan poli dokter.
    expect(await l.daftarkan(saya, { ...masukan, jenis: 'IMP', lokasi_id: undefined, dpjp_id: 32 })).toMatchObject({ ok: true });
  });
  it('menolak pasien, poli, atau DPJP di luar fasyankes dan kunjungan berjalan tanpa menyimpan', async () => {
    const l = buat();
    expect(await l.daftarkan({ id: 3, fasyankes_id: 2 }, masukan)).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
    expect(await l.daftarkan(saya, { ...masukan, lokasi_id: 21 })).toMatchObject({ ok: false, kode: 'tidak_valid' });
    expect(await l.daftarkan(saya, { ...masukan, dpjp_id: 31 })).toMatchObject({ ok: false, kode: 'tidak_valid' });
    expect(await buat({ kunjunganBerjalan: async () => true }).daftarkan(saya, masukan)).toMatchObject({ ok: false, kode: 'konflik' });
    expect(dasarRepo.daftarkan).not.toHaveBeenCalled();
    expect(catatan).toHaveLength(0);
  });
  it('tahap: hanya maju; kasir ke ditutup dan mundur ditolak', async () => {
    const l = buat();
    expect(await l.ubahTahap(saya, 5, 'resep')).toMatchObject({ ok: true });
    expect(await l.ubahTahap(saya, 5, 'menunggu_skrining')).toMatchObject({ ok: false, kode: 'konflik' });
    expect(await l.ubahTahap(saya, 5, 'ditutup')).toMatchObject({ ok: false, kode: 'konflik' });
    expect(await l.ubahTahap(saya, 6, 'resep')).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
    expect(dasarRepo.ubahTahap).toHaveBeenCalledTimes(1);
  });
  it('tahap: balapan (sudah berubah) menjadi konflik', async () => {
    expect(await buat({ ubahTahap: async () => null }).ubahTahap(saya, 5, 'resep')).toMatchObject({ ok: false, kode: 'konflik' });
  });
  it('antrean: aksi sesuai status; mulai dari menunggu ditolak', async () => {
    const l = buat();
    expect(await l.aksiAntrean(saya, 8, 'panggil')).toMatchObject({ ok: true });
    expect(dasarRepo.ubahAntrean).toHaveBeenCalledWith(1, 8, 'panggil', ['menunggu', 'dipanggil'], 'dipanggil', expect.any(Date));
    expect(await l.aksiAntrean(saya, 8, 'mulai')).toMatchObject({ ok: false, kode: 'konflik' });
    expect(await l.aksiAntrean({ id: 3, fasyankes_id: 2 }, 8, 'panggil')).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
  });
  it('daftar antrean memakai hari ini menurut Asia/Jakarta bila tanggal kosong', async () => {
    const daftarAntrean = jest.fn(async () => ({ total: 0, baris: [] }));
    await buat({ daftarAntrean }).daftarAntrean(saya, { halaman: 1, ukuran: 50 });
    expect(daftarAntrean).toHaveBeenCalledWith(1, expect.objectContaining({ tanggal: '2026-10-25' }));
  });
});

import { bisaDiulang } from '../data-access/repositori';
describe('bisaDiulang', () => {
  const galat = (code: string) => Object.assign(new Error('x'), { code });
  it('mengulang ER_DUP_ENTRY dan ER_LOCK_DEADLOCK (deadlock/serialisasi), bukan galat lain', () => {
    expect(bisaDiulang(galat('ER_DUP_ENTRY'))).toBe(true);
    expect(bisaDiulang(galat('ER_LOCK_DEADLOCK'))).toBe(true);
    expect(bisaDiulang(galat('ER_NO_REFERENCED_ROW_2'))).toBe(false);
    expect(bisaDiulang(new Error('x'))).toBe(false);
  });
});
