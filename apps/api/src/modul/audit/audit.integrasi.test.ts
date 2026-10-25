/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { AddressInfo } from 'net';
import { PrismaClient } from '@prisma/client';

const urlUji = process.env.DATABASE_URL_UJI;
const d = urlUji ? describe : describe.skip;

d('log audit terhadap klira_uji', () => {
  const prisma = new PrismaClient({ datasourceUrl: urlUji });
  const kode = `UJI-AUD-${Date.now()}`;
  let server: any;
  let fas = 0;
  const id: Record<string, number> = {};
  const cookie: Record<string, string> = {};
  const url = (p: string) => `http://127.0.0.1:${(server.address() as AddressInfo).port}/api${p}`;
  const panggil = async (metode: string, p: string, siapa: string, badan?: unknown) => {
    const res = await fetch(url(p), {
      method: metode,
      headers: { 'content-type': 'application/json', cookie: cookie[siapa] },
      body: badan === undefined ? undefined : JSON.stringify(badan),
    });
    const teks = await res.text();
    let json: any = null;
    try { json = JSON.parse(teks); } catch { /* bukan JSON */ }
    return { status: res.status, badan: json, teks, tipe: res.headers.get('content-type') };
  };

  async function buatPengguna(kunci: string, nik: string, izin: [string, string, string][]) {
    const { hashKataSandi } = require('@klira/db');
    const u = await prisma.pengguna.create({
      data: { fasyankes_id: fas, nama: `Nama ${kunci}`, nik, username: `${kode}-${kunci}`, kata_sandi_hash: await hashKataSandi('sandi-uji-1'), wajib_ganti_kredensial: false },
    });
    id[kunci] = u.id;
    const j = await prisma.jenisAkun.create({ data: { fasyankes_id: fas, nama: `${kode}-${kunci}` } });
    for (const [fitur, aksi, cakupan] of izin) {
      const r = await prisma.izin.upsert({ where: { fitur_aksi_cakupan: { fitur, aksi: aksi as 'lihat', cakupan: cakupan as 'unit' } }, update: {}, create: { fitur, aksi: aksi as 'lihat', cakupan: cakupan as 'unit' } });
      await prisma.izinJenisAkun.create({ data: { fasyankes_id: fas, jenis_akun_id: j.id, izin_id: r.id } });
    }
    await prisma.penugasanJenis.create({ data: { fasyankes_id: fas, pengguna_id: u.id, jenis_akun_id: j.id, mulai: new Date(Date.now() - 86_400_000) } });
    const res = await fetch(url('/masuk'), {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: `${kode}-${kunci}`, kata_sandi: 'sandi-uji-1' }),
    });
    expect(res.status).toBe(200);
    cookie[kunci] = res.headers.get('set-cookie')!.split(';')[0];
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = urlUji;
    const f = await prisma.fasyankes.create({ data: { fasyankes_id: -4, nama: 'Uji Audit', jenis: 'klinik_pratama_rawat_jalan', kode_registrasi: kode } });
    fas = f.id;
    await prisma.fasyankes.update({ where: { id: fas }, data: { fasyankes_id: fas } });
    const { buatApp } = require('../../app');
    server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
    // pengguna dibuat setelah server hidup karena masuk memakai API
    await buatPengguna('auditor', '9920000000000001', [['audit', 'lihat', 'unit']]);
    await buatPengguna('biasa', '9920000000000002', [['klinis', 'input', 'unit']]);
  });

  afterAll(async () => {
    server?.close();
    const where = { fasyankes_id: fas };
    await prisma.logAudit.deleteMany({ where });
    await prisma.sesi.deleteMany({ where: { pengguna_id: { in: Object.values(id) } } });
    await prisma.penugasanJenis.deleteMany({ where });
    await prisma.izinJenisAkun.deleteMany({ where });
    await prisma.jenisAkun.deleteMany({ where });
    await prisma.pengguna.deleteMany({ where });
    await prisma.fasyankes.deleteMany({ where: { id: fas } });
    await prisma.$disconnect();
  });

  it('masuk tercatat dengan waktu UTC, alamat, dan fasyankes', async () => {
    const a = await prisma.logAudit.findMany({ where: { aksi: 'masuk', pengguna_id: id.auditor } });
    expect(a).toHaveLength(1);
    expect(a[0].fasyankes_id).toBe(fas);
    expect(a[0].alamat).toBeTruthy();
    expect(Math.abs(a[0].waktu.getTime() - Date.now())).toBeLessThan(120_000);
  });

  it('403 tanpa izin audit dan penolakan tercatat sebagai izin_ditolak', async () => {
    for (const [m, p] of [['GET', '/audit'], ['GET', '/audit/1'], ['POST', '/audit/ekspor']] as const) {
      expect((await panggil(m, p, 'biasa', m === 'POST' ? {} : undefined)).status).toBe(403);
    }
    const t = await prisma.logAudit.findMany({ where: { aksi: 'izin_ditolak', pengguna_id: id.biasa, entitas: 'audit' } });
    expect(t.length).toBe(3);
  });

  it('401 tanpa sesi', async () => {
    const r = await fetch(url('/audit'));
    expect(r.status).toBe(401);
  });

  it('daftar: filter aksi, pengguna, entitas, rentang waktu, dan paginasi', async () => {
    const dasar = { fasyankes_id: fas, pengguna_id: id.auditor, entitas: 'pasien', alamat: '10.0.0.1' };
    for (let i = 1; i <= 5; i++) {
      await prisma.logAudit.create({ data: { ...dasar, aksi: 'lihat', entitas_id: i, waktu: new Date(Date.UTC(2026, 0, i, 12)) } });
    }
    await prisma.logAudit.create({ data: { ...dasar, aksi: 'input', entitas_id: 99, waktu: new Date(Date.UTC(2026, 0, 3, 13)) } });
    const q = `entitas=pasien&pengguna_id=${id.auditor}`;
    const semua = await panggil('GET', `/audit?${q}&ukuran=2&halaman=2`, 'auditor');
    expect(semua.status).toBe(200);
    expect(semua.badan.data).toMatchObject({ halaman: 2, ukuran: 2, total: 6 });
    expect(semua.badan.data.data).toHaveLength(2);
    expect(semua.badan.data.data[0].pengguna_nama).toBe('Nama auditor');
    // urut terbaru dulu: 5,4 | 3 (input 13:00 lebih baru dari lihat 3) ...
    const lihat = await panggil('GET', `/audit?${q}&aksi=lihat`, 'auditor');
    expect(lihat.badan.data.total).toBe(5);
    const rentang = await panggil('GET', `/audit?${q}&dari=2026-01-02T00:00:00Z&sampai=2026-01-03T23:59:59Z`, 'auditor');
    expect(rentang.badan.data.total).toBe(3);
    expect((await panggil('GET', '/audit?aksi=tidak-ada', 'auditor')).status).toBe(400);
    expect((await panggil('GET', '/audit?dari=2026-02-01&sampai=2026-01-01', 'auditor')).status).toBe(400);
  });

  it('detail: ada dan tidak ada, tidak lintas fasyankes', async () => {
    const c = await prisma.logAudit.findFirstOrThrow({ where: { fasyankes_id: fas, aksi: 'input', entitas_id: 99 } });
    const ok = await panggil('GET', `/audit/${c.id}`, 'auditor');
    expect(ok.status).toBe(200);
    expect(ok.badan.data).toMatchObject({ id: c.id, aksi: 'input', entitas: 'pasien', entitas_id: 99 });
    expect((await panggil('GET', '/audit/999999999', 'auditor')).status).toBe(404);
    expect((await panggil('GET', '/audit/abc', 'auditor')).status).toBe(400);
    const lain = await prisma.logAudit.create({ data: { fasyankes_id: fas + 100000, aksi: 'lihat', entitas: 'pasien' } });
    expect((await panggil('GET', `/audit/${lain.id}`, 'auditor')).status).toBe(404);
    await prisma.logAudit.delete({ where: { id: lain.id } });
  });

  it('ekspor CSV mengikuti filter dan tercatat sebagai aksi ekspor', async () => {
    const r = await panggil('POST', '/audit/ekspor', 'auditor', { entitas: 'pasien', aksi: 'lihat', pengguna_id: id.auditor });
    expect(r.status).toBe(200);
    expect(r.tipe).toContain('text/csv');
    const baris = r.teks.trim().split('\r\n');
    expect(baris[0]).toBe('id,waktu_utc,pengguna_id,pengguna_nama,aksi,entitas,entitas_id,alamat,keterangan');
    expect(baris).toHaveLength(6);
    const e = await prisma.logAudit.findMany({ where: { aksi: 'ekspor', pengguna_id: id.auditor } });
    expect(e).toHaveLength(1);
    expect(e[0]).toMatchObject({ entitas: 'log_audit', fasyankes_id: fas });
    expect(e[0].keterangan).toContain('5 baris');
  });

  it('aksi akun tercatat: masuk_gagal tanpa username mentah, keluar', async () => {
    const res = await fetch(url('/masuk'), {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: `${kode}-biasa`, kata_sandi: 'salah-sandi-xyz' }),
    });
    expect(res.status).toBe(401);
    const g = await prisma.logAudit.findMany({ where: { aksi: 'masuk_gagal', pengguna_id: id.biasa } });
    expect(g).toHaveLength(1);
    expect(JSON.stringify(g)).not.toMatch(/salah-sandi-xyz/);
    const k = await panggil('POST', '/keluar', 'biasa');
    expect(k.status).toBeLessThan(300);
    expect(await prisma.logAudit.count({ where: { aksi: 'keluar', pengguna_id: id.biasa } })).toBe(1);
  });

  it('tidak ada isi sensitif: tidak ada kata sandi, hash, atau NIK pada log fasyankes uji', async () => {
    const semua = JSON.stringify(await prisma.logAudit.findMany({ where: { fasyankes_id: fas } }));
    expect(semua).not.toMatch(/sandi-uji-1|argon|\$2[aby]\$|9920000000000001|9920000000000002/);
  });
});
