/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { AddressInfo } from 'net';
import { PrismaClient } from '@prisma/client';

const urlUji = process.env.DATABASE_URL_UJI;
const d = urlUji ? describe : describe.skip;

d('API pengguna terhadap klira_uji', () => {
  const prisma = new PrismaClient({ datasourceUrl: urlUji });
  const kode = `UJI-PGN-${Date.now()}`;
  let server: any;
  let fas = 0;
  let jenisPimpinan = 0;
  const id: Record<string, number> = {};
  const cookie: Record<string, string> = {};
  const url = (p: string) => `http://127.0.0.1:${(server.address() as AddressInfo).port}/api${p}`;
  const panggil = async (metode: string, p: string, siapa: string, badan?: unknown) => {
    const res = await fetch(url(p), {
      method: metode,
      headers: { 'content-type': 'application/json', cookie: cookie[siapa] ?? '' },
      body: badan === undefined ? undefined : JSON.stringify(badan),
    });
    const teks = await res.text();
    let json: any = null;
    try { json = JSON.parse(teks); } catch { /* bukan JSON */ }
    return { status: res.status, badan: json };
  };

  async function buatPengguna(kunci: string, nik: string, izin: [string, string, string][], opsi: { jenis?: number } = {}) {
    const { hashKataSandi } = require('@klira/db');
    const u = await prisma.pengguna.create({
      data: { fasyankes_id: fas, nama: `Nama ${kunci}`, nik, username: `${kode}-${kunci}`, kata_sandi_hash: await hashKataSandi('sandi-uji-1'), wajib_ganti_kredensial: false },
    });
    id[kunci] = u.id;
    let jenisId = opsi.jenis;
    if (!jenisId) {
      const j = await prisma.jenisAkun.create({ data: { fasyankes_id: fas, nama: `${kode}-${kunci}` } });
      jenisId = j.id;
      for (const [fitur, aksi, cakupan] of izin) {
        const r = await prisma.izin.upsert({ where: { fitur_aksi_cakupan: { fitur, aksi: aksi as 'lihat', cakupan: cakupan as 'unit' } }, update: {}, create: { fitur, aksi: aksi as 'lihat', cakupan: cakupan as 'unit' } });
        await prisma.izinJenisAkun.create({ data: { fasyankes_id: fas, jenis_akun_id: j.id, izin_id: r.id } });
      }
    }
    await prisma.penugasanJenis.create({ data: { fasyankes_id: fas, pengguna_id: u.id, jenis_akun_id: jenisId, mulai: new Date(Date.now() - 86_400_000) } });
    const res = await fetch(url('/masuk'), {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: `${kode}-${kunci}`, kata_sandi: 'sandi-uji-1' }),
    });
    expect(res.status).toBe(200);
    cookie[kunci] = res.headers.get('set-cookie')!.split(';')[0];
    return jenisId;
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = urlUji;
    const f = await prisma.fasyankes.create({ data: { fasyankes_id: -5, nama: 'Uji Pengguna', jenis: 'klinik_pratama_rawat_jalan', kode_registrasi: kode } });
    fas = f.id;
    await prisma.fasyankes.update({ where: { id: fas }, data: { fasyankes_id: fas } });
    const { buatApp } = require('../../app');
    server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
    jenisPimpinan = await buatPengguna('pimpinan', '9930000000000001', [['akses', 'lihat', 'unit'], ['akses', 'perbaikan', 'unit']]);
    await buatPengguna('pelihat', '9930000000000002', [['akses', 'lihat', 'unit']]);
    await buatPengguna('biasa', '9930000000000003', [['klinis', 'input', 'unit']]);
    await buatPengguna('rekan', '9930000000000004', [], { jenis: jenisPimpinan });
    // izin tambahan aktif dan peringatan terbuka untuk 'rekan'
    const izinKasir = await prisma.izin.upsert({ where: { fitur_aksi_cakupan: { fitur: 'kasir', aksi: 'input', cakupan: 'unit' } }, update: {}, create: { fitur: 'kasir', aksi: 'input', cakupan: 'unit' } });
    await prisma.izinPerAkun.create({ data: { fasyankes_id: fas, pengguna_id: id.rekan, izin_id: izinKasir.id, tipe: 'tambah', alasan: 'uji', mulai: new Date(Date.now() - 1000) } });
    await prisma.peringatanIzin.create({ data: { fasyankes_id: fas, pengguna_id: id.rekan, jenis_peringatan: 'izin_klinis_non_dokter', alasan_pimpinan: 'uji' } });
  });

  afterAll(async () => {
    server?.close();
    const where = { fasyankes_id: fas };
    await prisma.logAudit.deleteMany({ where });
    await prisma.peringatanIzin.deleteMany({ where });
    await prisma.izinPerAkun.deleteMany({ where });
    await prisma.sesi.deleteMany({ where: { pengguna_id: { in: Object.values(id) } } });
    await prisma.penugasanJenis.deleteMany({ where });
    await prisma.izinJenisAkun.deleteMany({ where });
    await prisma.jenisAkun.deleteMany({ where });
    await prisma.pengguna.deleteMany({ where });
    await prisma.fasyankes.deleteMany({ where: { id: fas } });
    await prisma.$disconnect();
  });

  it('tanpa sesi 401, tanpa izin akses lihat 403', async () => {
    expect((await panggil('GET', '/pengguna', 'tamu')).status).toBe(401);
    expect((await panggil('GET', '/pengguna', 'biasa')).status).toBe(403);
  });

  it('daftar memuat jenis akun aktif, izin tambahan, peringatan terbuka, dan hanya fasyankes sendiri', async () => {
    const r = await panggil('GET', '/pengguna', 'pelihat');
    expect(r.status).toBe(200);
    expect(r.badan.data.total).toBe(4);
    const rekan = r.badan.data.data.find((x: any) => x.id === id.rekan);
    expect(rekan).toMatchObject({ aktif: true, jenis_akun_aktif: [`${kode}-pimpinan`], jumlah_izin_tambahan: 1, jumlah_peringatan_terbuka: 1 });
    expect(rekan.kata_sandi_hash).toBeUndefined();
  });

  it('filter cari, status, jenis akun, dan paginasi', async () => {
    expect((await panggil('GET', '/pengguna?cari=Nama%20rekan', 'pelihat')).badan.data.total).toBe(1);
    expect((await panggil('GET', `/pengguna?cari=${kode}-biasa`, 'pelihat')).badan.data.total).toBe(1);
    expect((await panggil('GET', `/pengguna?jenis_akun_id=${jenisPimpinan}`, 'pelihat')).badan.data.total).toBe(2);
    expect((await panggil('GET', '/pengguna?status=nonaktif', 'pelihat')).badan.data.total).toBe(0);
    const h = (await panggil('GET', '/pengguna?ukuran=2&halaman=2', 'pelihat')).badan.data;
    expect(h.data).toHaveLength(2);
    expect((await panggil('GET', '/pengguna?status=x', 'pelihat')).status).toBe(400);
  });

  it('nonaktifkan dan aktifkan lewat PATCH, tercatat di audit; sesi akun nonaktif tak berlaku', async () => {
    expect((await panggil('PATCH', `/pengguna/${id.biasa}`, 'pelihat', { aktif: false })).status).toBe(403);
    const r = await panggil('PATCH', `/pengguna/${id.biasa}`, 'pimpinan', { aktif: false });
    expect(r).toMatchObject({ status: 200, badan: { data: { id: id.biasa, aktif: false } } });
    expect((await panggil('GET', '/saya', 'biasa')).status).toBe(401);
    expect((await panggil('GET', '/pengguna?status=nonaktif', 'pelihat')).badan.data.total).toBe(1);
    expect((await panggil('PATCH', `/pengguna/${id.biasa}`, 'pimpinan', { aktif: true })).status).toBe(200);
    const log = await prisma.logAudit.findMany({ where: { fasyankes_id: fas, entitas: 'pengguna', aksi: 'perbaikan' } });
    expect(log).toHaveLength(2);
    expect(log.every((l) => l.entitas_id === id.biasa && l.pengguna_id === id.pimpinan)).toBe(true);
    expect(await prisma.pengguna.count({ where: { fasyankes_id: fas } })).toBe(4);
  });

  it('admin tidak bisa menonaktifkan akunnya sendiri; id asing 404; badan salah 400', async () => {
    const r = await panggil('PATCH', `/pengguna/${id.pimpinan}`, 'pimpinan', { aktif: false });
    expect(r.status).toBe(409);
    expect((await prisma.pengguna.findUniqueOrThrow({ where: { id: id.pimpinan } })).aktif).toBe(true);
    expect((await panggil('PATCH', '/pengguna/999999999', 'pimpinan', { aktif: false })).status).toBe(404);
    expect((await panggil('PATCH', `/pengguna/${id.rekan}`, 'pimpinan', { aktif: 'x' })).status).toBe(400);
  });
});
