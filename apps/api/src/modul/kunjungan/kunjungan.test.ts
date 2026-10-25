import { buatLayananKunjungan } from './layanan';
import type { RepositoriKunjungan } from './repositori';
import { statusDariDb, statusKeDb } from './pemetaan';

describe('pemetaan status kunjungan', () => {
  it('in-progress disimpan sebagai in_progress dan kembali', () => {
    expect(statusKeDb('in-progress')).toBe('in_progress');
    expect(statusDariDb('in_progress')).toBe('in-progress');
    expect(statusDariDb('arrived')).toBe('arrived');
  });
});

describe('layanan kunjungan dengan repositori tiruan', () => {
  const catatan: { entitas: string; aksi: string }[] = [];
  const saya = { id: 3, fasyankes_id: 1 };
  const kunjungan = { id: 5, antrean: { id: 8, nomor: 1, kode: 'A-001', status: 'menunggu' } };
  const dasarRepo = {
    pasienAda: async (f: number, id: number) => f === 1 && id === 10,
    poliOperasional: async (f: number, id: number) => f === 1 && id === 20,
    dpjpSah: async (f: number, id: number) => f === 1 && id === 30,
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

import { Prisma } from '@klira/db';
import { bisaDiulang } from './repositori';
describe('bisaDiulang', () => {
  const galat = (code: string) => new Prisma.PrismaClientKnownRequestError('x', { code, clientVersion: 'uji' });
  it('mengulang P2002 dan P2034 (deadlock/serialisasi), bukan galat lain', () => {
    expect(bisaDiulang(galat('P2002'))).toBe(true);
    expect(bisaDiulang(galat('P2034'))).toBe(true);
    expect(bisaDiulang(galat('P2003'))).toBe(false);
    expect(bisaDiulang(new Error('x'))).toBe(false);
  });
});
