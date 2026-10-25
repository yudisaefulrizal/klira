/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { AddressInfo } from 'net';
import { PrismaClient } from '@prisma/client';

const urlUji = process.env.DATABASE_URL_UJI;
const d = urlUji ? describe : describe.skip;

d('POST /api/pengguna terhadap klira_uji', () => {
  const prisma = new PrismaClient({ datasourceUrl: urlUji });
  const kode = `UJI-BUAT-${Date.now()}`;
  let server: any;
  let fas = 0;
  let jenisDokter = 0;
  let jenisDaftar = 0;
  let izinLihat = 0;
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
    return { status: res.status, badan: json, teks, header: res.headers };
  };
  const izin = (fitur: string, aksi: string) =>
    prisma.izin.upsert({
      where: { fitur_aksi_cakupan: { fitur, aksi: aksi as 'lihat', cakupan: 'unit' } }, update: {}, create: { fitur, aksi: aksi as 'lihat', cakupan: 'unit' },
    });
  async function akun(kunci: string, nik: string, izinJenis: [string, string][]) {
    const { hashKataSandi } = require('@klira/db');
    const u = await prisma.pengguna.create({
      data: { fasyankes_id: fas, nama: `Nama ${kunci}`, nik, username: `${kode}-${kunci}`, kata_sandi_hash: await hashKataSandi('sandi-uji-1'), wajib_ganti_kredensial: false },
    });
    id[kunci] = u.id;
    const j = await prisma.jenisAkun.create({ data: { fasyankes_id: fas, nama: `${kode}-${kunci}` } });
    for (const [fitur, aksi] of izinJenis) {
      const r = await izin(fitur, aksi);
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
  const badanDasar = (sufiks: string, ekstra: object = {}) => ({
    nama: `Baru ${sufiks}`, nik: `99400000${sufiks.padStart(8, '0')}`, username: `${kode}-b${sufiks}`,
    penugasan: [{ jenis_akun_id: jenisDaftar, mulai: '2026-01-01' }], ...ekstra,
  });

  beforeAll(async () => {
    process.env.DATABASE_URL = urlUji;
    const f = await prisma.fasyankes.create({ data: { fasyankes_id: -6, nama: 'Uji Buat Akun', jenis: 'klinik_pratama_rawat_jalan', kode_registrasi: kode } });
    fas = f.id;
    await prisma.fasyankes.update({ where: { id: fas }, data: { fasyankes_id: fas } });
    const { buatApp } = require('../../app');
    server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
    await akun('pimpinan', '9930000000000011', [['akses', 'lihat'], ['akses', 'input']]);
    await akun('pelihat', '9930000000000012', [['akses', 'lihat']]);
    jenisDokter = (await prisma.jenisAkun.create({ data: { fasyankes_id: fas, nama: `${kode}-dokter`, syarat_profesi: 'dokter ber-SIP' } })).id;
    await prisma.izinJenisAkun.create({ data: { fasyankes_id: fas, jenis_akun_id: jenisDokter, izin_id: (await izin('resep', 'input')).id } });
    jenisDaftar = (await prisma.jenisAkun.create({ data: { fasyankes_id: fas, nama: `${kode}-daftar` } })).id;
    izinLihat = (await izin('pendaftaran', 'lihat')).id;
    await prisma.izinJenisAkun.create({ data: { fasyankes_id: fas, jenis_akun_id: jenisDaftar, izin_id: izinLihat } });
  });

  afterAll(async () => {
    server?.close();
    const where = { fasyankes_id: fas };
    await prisma.logAudit.deleteMany({ where });
    await prisma.peringatanIzin.deleteMany({ where });
    await prisma.izinPerAkun.deleteMany({ where });
    await prisma.profilProfesi.deleteMany({ where });
    await prisma.sesi.deleteMany({ where: { pengguna: { fasyankes_id: fas } } });
    await prisma.penugasanJenis.deleteMany({ where });
    await prisma.izinJenisAkun.deleteMany({ where });
    await prisma.jenisAkun.deleteMany({ where });
    await prisma.pengguna.deleteMany({ where });
    await prisma.fasyankes.deleteMany({ where: { id: fas } });
    await prisma.$disconnect();
  });

  it('tanpa sesi 401, tanpa izin akses input 403, badan tidak valid 400', async () => {
    expect((await panggil('POST', '/pengguna', 'tamu', badanDasar('1'))).status).toBe(401);
    expect((await panggil('POST', '/pengguna', 'pelihat', badanDasar('1'))).status).toBe(403);
    const r = await panggil('POST', '/pengguna', 'pimpinan', { ...badanDasar('1'), nik: '12' });
    expect(r.status).toBe(400);
    expect(r.badan.galat.rincian.map((x: any) => x.jalur)).toContain('nik');
    expect(await prisma.pengguna.count({ where: { username: `${kode}-b1` } })).toBe(0);
  });

  it('membuat akun lengkap dalam satu transaksi: hash tersimpan, wajib ganti, kata sandi dikembalikan sekali', async () => {
    const r = await panggil('POST', '/pengguna', 'pimpinan', badanDasar('2', {
      profil: { profesi: 'Perawat', nomor_sip: 'SIP-22', masa_berlaku_sip: '2030-01-01', ihs_practitioner_id: 'N10000001' },
      izin_akun: [{ izin_id: izinLihat, tipe: 'kurang', alasan: 'Tidak perlu melihat pendaftaran', mulai: '2026-01-01' }],
    }));
    expect(r.status).toBe(201);
    expect(r.header.get('cache-control')).toBe('no-store');
    const sandi: string = r.badan.data.kata_sandi_awal;
    expect(sandi).toMatch(/^(?=.*[A-Za-z])(?=.*\d).{12}$/);
    const baru = await prisma.pengguna.findUniqueOrThrow({
      where: { id: r.badan.data.id }, include: { profil_profesi: true, penugasan_jenis: true, izin_per_akun: true },
    });
    expect(baru).toMatchObject({ fasyankes_id: fas, aktif: true, wajib_ganti_kredensial: true, dibuat_oleh: id.pimpinan });
    expect(baru.kata_sandi_hash).toMatch(/^scrypt\$/);
    expect(baru.kata_sandi_hash).not.toContain(sandi);
    expect(baru.profil_profesi).toHaveLength(1);
    expect(baru.profil_profesi[0]).toMatchObject({ nomor_sip: 'SIP-22', ihs_practitioner_id: 'N10000001' });
    expect(baru.penugasan_jenis).toHaveLength(1);
    expect(baru.izin_per_akun[0]).toMatchObject({ tipe: 'kurang', izin_id: izinLihat });
    // login dengan kata sandi awal berhasil dan menuntut ganti kredensial
    const m = await panggil('POST', '/masuk', 'tamu', { username: baru.username, kata_sandi: sandi });
    expect(m.status).toBe(200);
    expect(m.badan.data.wajib_ganti_kredensial).toBe(true);
  });

  it('audit tercatat tanpa kata sandi dan tanpa NIK', async () => {
    const baru = await prisma.pengguna.findFirstOrThrow({ where: { username: `${kode}-b2` } });
    const log = await prisma.logAudit.findMany({ where: { fasyankes_id: fas, pengguna_id: id.pimpinan, aksi: 'input' } });
    const ent = log.map((l) => l.entitas);
    expect(ent).toEqual(expect.arrayContaining(['pengguna', 'profil_profesi', 'penugasan_jenis', 'izin_per_akun']));
    expect(log.find((l) => l.entitas === 'pengguna')).toMatchObject({ entitas_id: baru.id });
    expect(JSON.stringify(log)).not.toContain(baru.nik);
  });

  it('peringatan: 409 tanpa menyimpan, lalu lolos dengan alasan dan tercatat di peringatan_izin dan audit', async () => {
    const badan = badanDasar('3', { penugasan: [{ jenis_akun_id: jenisDokter, mulai: '2026-01-01' }], profil: { profesi: 'Perawat' } });
    const r1 = await panggil('POST', '/pengguna', 'pimpinan', badan);
    expect(r1.status).toBe(409);
    expect(r1.badan.galat.kode).toBe('perlu_konfirmasi_peringatan');
    expect(r1.badan.galat.peringatan.map((w: any) => w.jenis)).toContain('izin_klinis_non_dokter');
    expect(await prisma.pengguna.count({ where: { username: `${kode}-b3` } })).toBe(0);

    const r2 = await panggil('POST', '/pengguna', 'pimpinan', { ...badan, konfirmasi_peringatan: { alasan: 'Perawat senior diberi resep sementara', terima_untuk_akun: true } });
    expect(r2.status).toBe(201);
    expect(r2.badan.data.peringatan.length).toBeGreaterThan(0);
    const baris = await prisma.peringatanIzin.findMany({ where: { pengguna_id: r2.badan.data.id } });
    expect(baris.every((b) => b.alasan_pimpinan === 'Perawat senior diberi resep sementara' && b.diterima_untuk_akun && b.ditetapkan_oleh === id.pimpinan)).toBe(true);
    expect(await prisma.logAudit.count({ where: { fasyankes_id: fas, aksi: 'peringatan_izin', entitas_id: { in: baris.map((b) => b.id) } } })).toBe(baris.length);
  });

  it('username atau NIK ganda 409 konflik; jenis akun nonaktif atau asing 400', async () => {
    expect((await panggil('POST', '/pengguna', 'pimpinan', { ...badanDasar('4'), username: `${kode}-b2` })).status).toBe(409);
    expect((await panggil('POST', '/pengguna', 'pimpinan', { ...badanDasar('4'), nik: badanDasar('2').nik })).status).toBe(409);
    expect((await panggil('POST', '/pengguna', 'pimpinan', { ...badanDasar('4'), penugasan: [{ jenis_akun_id: 999999999, mulai: '2026-01-01' }] })).status).toBe(400);
    expect(await prisma.pengguna.count({ where: { username: `${kode}-b4` } })).toBe(0);
  });

  it('kegagalan di tengah transaksi membatalkan semuanya', async () => {
    const { RepositoriAkunBaruPrisma } = require('./repositori-baru');
    await expect(
      new RepositoriAkunBaruPrisma().buatAkun({
        fasyankes_id: fas, oleh: id.pimpinan, nama: 'Gagal', nik: '9950000000000001', username: `${kode}-gagal`, kata_sandi_hash: 'x',
        profil: { profesi: 'Perawat', nomor_sip: null, masa_berlaku_sip: null, ihs_practitioner_id: null },
        penugasan: [{ jenis_akun_id: jenisDaftar, mulai: new Date(), selesai: null }],
        izin_akun: [{ izin_id: 999999999, tipe: 'tambah', alasan: 'x', mulai: new Date(), selesai: null }],
        peringatan: [],
      }),
    ).rejects.toBeDefined();
    expect(await prisma.pengguna.count({ where: { username: `${kode}-gagal` } })).toBe(0);
    expect(await prisma.profilProfesi.count({ where: { fasyankes_id: fas, pengguna: { username: `${kode}-gagal` } } })).toBe(0);
  });
});
