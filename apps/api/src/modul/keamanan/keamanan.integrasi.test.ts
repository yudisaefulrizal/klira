/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { AddressInfo } from 'net';
import { PrismaClient } from '@prisma/client';

const urlUji = process.env.DATABASE_URL_UJI;
const d = urlUji ? describe : describe.skip;

d('keamanan, peringatan, dan jenis akun terhadap klira_uji', () => {
  const prisma = new PrismaClient({ datasourceUrl: urlUji });
  const kode = `UJI-KEAM-${Date.now()}`;
  let server: any;
  let fas = 0;
  const id: Record<string, number> = {};
  const cookie: Record<string, string> = {};
  const url = (p: string) => `http://127.0.0.1:${(server.address() as AddressInfo).port}/api${p}`;
  const panggil = async (metode: string, p: string, siapa: string | null, badan?: unknown) => {
    const res = await fetch(url(p), {
      method: metode,
      headers: { 'content-type': 'application/json', ...(siapa ? { cookie: cookie[siapa] } : {}) },
      body: badan === undefined ? undefined : JSON.stringify(badan),
    });
    return { status: res.status, badan: (await res.json().catch(() => null)) as any };
  };
  const masuk = (kunci: string, sandi = 'sandi-uji-1') =>
    fetch(url('/masuk'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: `${kode}-${kunci}`, kata_sandi: sandi }) });

  async function buatPengguna(kunci: string, nik: string, izin: [string, string, string][], wajibGanti = false) {
    const { hashKataSandi } = require('@klira/db');
    const u = await prisma.pengguna.create({
      data: { fasyankes_id: fas, nama: `Nama ${kunci}`, nik, username: `${kode}-${kunci}`, kata_sandi_hash: await hashKataSandi('sandi-uji-1'), wajib_ganti_kredensial: wajibGanti },
    });
    id[kunci] = u.id;
    if (!izin.length) return;
    const j = await prisma.jenisAkun.create({ data: { fasyankes_id: fas, nama: `${kode}-${kunci}` } });
    for (const [fitur, aksi, cakupan] of izin) {
      const r = await prisma.izin.upsert({ where: { fitur_aksi_cakupan: { fitur, aksi: aksi as 'lihat', cakupan: cakupan as 'unit' } }, update: {}, create: { fitur, aksi: aksi as 'lihat', cakupan: cakupan as 'unit' } });
      await prisma.izinJenisAkun.create({ data: { fasyankes_id: fas, jenis_akun_id: j.id, izin_id: r.id } });
    }
    await prisma.penugasanJenis.create({ data: { fasyankes_id: fas, pengguna_id: u.id, jenis_akun_id: j.id, mulai: new Date(Date.now() - 86_400_000) } });
  }
  async function login(kunci: string) {
    const res = await masuk(kunci);
    expect(res.status).toBe(200);
    cookie[kunci] = res.headers.get('set-cookie')!.split(';')[0];
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = urlUji;
    const f = await prisma.fasyankes.create({ data: { fasyankes_id: -7, nama: 'Uji Keamanan', jenis: 'klinik_pratama_rawat_jalan', kode_registrasi: kode } });
    fas = f.id;
    await prisma.fasyankes.update({ where: { id: fas }, data: { fasyankes_id: fas } });
    const { buatApp } = require('../../app');
    server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
    await buatPengguna('pimpinan', '9930000000000001', [['akses', 'lihat', 'unit'], ['akses', 'input', 'unit'], ['akses', 'perbaikan', 'unit']]);
    await buatPengguna('auditor', '9930000000000002', [['audit', 'lihat', 'unit']]);
    await buatPengguna('biasa', '9930000000000003', [['klinis', 'input', 'unit']]);
    await buatPengguna('terkunci', '9930000000000004', []);
    await buatPengguna('awal', '9930000000000005', [], true);
    await login('pimpinan');
    await login('auditor');
    await login('biasa');
  });

  afterAll(async () => {
    server?.close();
    const where = { fasyankes_id: fas };
    await prisma.logAudit.deleteMany({ where });
    await prisma.sesi.deleteMany({ where: { pengguna_id: { in: Object.values(id) } } });
    await prisma.peringatanIzin.deleteMany({ where });
    await prisma.riwayatBackup.deleteMany({ where });
    await prisma.pengaturanKeamanan.deleteMany({ where });
    await prisma.penugasanJenis.deleteMany({ where });
    await prisma.izinJenisAkun.deleteMany({ where });
    await prisma.riwayatJenisAkun.deleteMany({ where });
    await prisma.jenisAkun.deleteMany({ where });
    await prisma.pengguna.deleteMany({ where });
    await prisma.fasyankes.deleteMany({ where: { id: fas } });
    await prisma.$disconnect();
  });

  it('pengaturan keamanan: bawaan, validasi, simpan, audit, dan izin', async () => {
    const awal = await panggil('GET', '/pengaturan-keamanan', 'pimpinan');
    expect(awal.badan.data).toMatchObject({ masa_sesi_jam: 12, batas_percobaan_masuk: 5, panjang_minimum_kata_sandi: 8, bawaan: true });
    expect((await panggil('PATCH', '/pengaturan-keamanan', 'pimpinan', { masa_sesi_jam: 0, batas_percobaan_masuk: 5, panjang_minimum_kata_sandi: 8 })).status).toBe(400);
    expect((await panggil('PATCH', '/pengaturan-keamanan', 'pimpinan', { masa_sesi_jam: 12, batas_percobaan_masuk: 5, panjang_minimum_kata_sandi: 4 })).status).toBe(400);
    expect((await panggil('PATCH', '/pengaturan-keamanan', 'biasa', { masa_sesi_jam: 2, batas_percobaan_masuk: 3, panjang_minimum_kata_sandi: 8 })).status).toBe(403);
    expect((await panggil('GET', '/pengaturan-keamanan', 'auditor')).status).toBe(403);
    const simpan = await panggil('PATCH', '/pengaturan-keamanan', 'pimpinan', { masa_sesi_jam: 1, batas_percobaan_masuk: 3, panjang_minimum_kata_sandi: 12 });
    expect(simpan.status).toBe(200);
    expect(simpan.badan.data).toMatchObject({ masa_sesi_jam: 1, batas_percobaan_masuk: 3, panjang_minimum_kata_sandi: 12, bawaan: false });
    expect((await panggil('GET', '/pengaturan-keamanan', 'pimpinan')).badan.data.masa_sesi_jam).toBe(1);
    expect(await prisma.pengaturanKeamanan.count({ where: { fasyankes_id: fas } })).toBe(1);
    const catatan = await prisma.logAudit.findMany({ where: { aksi: 'perbaikan', entitas: 'pengaturan_keamanan', pengguna_id: id.pimpinan } });
    expect(catatan).toHaveLength(1);
  });

  it('masa sesi, batas percobaan, dan panjang kata sandi dipakai auth', async () => {
    // masa sesi 1 jam
    const res = await masuk('pimpinan');
    expect(res.status).toBe(200);
    const sesi = await prisma.sesi.findFirst({ where: { pengguna_id: id.pimpinan }, orderBy: { id: 'desc' } });
    const selisihJam = (sesi!.kedaluwarsa_pada.getTime() - Date.now()) / 3_600_000;
    expect(selisihJam).toBeGreaterThan(0.9);
    expect(selisihJam).toBeLessThan(1.01);
    // batas percobaan 3: percobaan ke-4 dengan sandi benar tetap dikunci
    for (let i = 0; i < 3; i++) expect((await masuk('terkunci', 'salah')).status).toBe(401);
    expect((await masuk('terkunci')).status).toBe(429);
    // panjang minimum 12
    await login('awal');
    const pendek = await panggil('POST', '/ganti-kredensial', 'awal', {
      username: `${kode}-awal-baru`, kata_sandi_lama: 'sandi-uji-1', kata_sandi: 'abc1234567', konfirmasi_kata_sandi: 'abc1234567',
    });
    expect(pendek.status).toBe(400);
    expect(pendek.badan.galat.pesan).toContain('12');
    const cukup = await panggil('POST', '/ganti-kredensial', 'awal', {
      username: `${kode}-awal-baru`, kata_sandi_lama: 'sandi-uji-1', kata_sandi: 'abc123456789', konfirmasi_kata_sandi: 'abc123456789',
    });
    expect(cukup.status).toBe(200);
  });

  it('riwayat backup hanya baca, terurut terbaru, dan berpaginasi', async () => {
    const dasar = Date.now();
    await prisma.riwayatBackup.createMany({
      data: [
        { fasyankes_id: fas, waktu: new Date(dasar - 3000), status: 'berhasil', ukuran_byte: BigInt(5_000_000_000), lokasi: '/backup/a.sql.gz' },
        { fasyankes_id: fas, waktu: new Date(dasar - 2000), status: 'gagal', ukuran_byte: null, lokasi: null },
        { fasyankes_id: fas, waktu: new Date(dasar - 1000), status: 'berhasil', ukuran_byte: BigInt(1024), lokasi: '/backup/c.sql.gz' },
      ],
    });
    const h1 = await panggil('GET', '/riwayat-backup?halaman=1&ukuran=2', 'pimpinan');
    expect(h1.status).toBe(200);
    expect(h1.badan.data.total).toBe(3);
    expect(h1.badan.data.data.map((b: any) => b.lokasi)).toEqual(['/backup/c.sql.gz', null]);
    expect(h1.badan.data.data[0].ukuran_byte).toBe(1024);
    const h2 = await panggil('GET', '/riwayat-backup?halaman=2&ukuran=2', 'pimpinan');
    expect(h2.badan.data.data[0].ukuran_byte).toBe(5_000_000_000);
    expect((await panggil('GET', '/riwayat-backup', 'biasa')).status).toBe(403);
    expect((await panggil('POST', '/riwayat-backup', 'pimpinan', {})).status).toBe(404);
    expect((await panggil('PATCH', '/riwayat-backup', 'pimpinan', {})).status).toBe(404);
  });

  it('daftar peringatan: filter pengguna, jenis, dan rentang waktu; nama; pimpinan dan auditor', async () => {
    const t = (hari: number) => new Date(Date.UTC(2026, 0, hari, 5, 0, 0));
    const buat = (pengguna: string, jenis: string, waktu: Date, diterima = false) =>
      prisma.peringatanIzin.create({
        data: { fasyankes_id: fas, pengguna_id: id[pengguna], jenis_peringatan: jenis, alasan_pimpinan: `alasan ${jenis}`, sumber: 'pemberian', diterima_untuk_akun: diterima, ditetapkan_oleh: id.pimpinan, waktu },
      });
    await buat('biasa', 'nakes_tanpa_sip', t(5));
    await buat('biasa', 'lihat_tak_dibatasi', t(10), true);
    await buat('auditor', 'nakes_tanpa_sip', t(15));

    const semua = await panggil('GET', '/peringatan-izin', 'auditor');
    expect(semua.status).toBe(200);
    expect(semua.badan.total).toBe(3);
    expect(semua.badan.data[0]).toMatchObject({ pengguna_nama: 'Nama auditor', ditetapkan_oleh_nama: 'Nama pimpinan', jenis_peringatan: 'nakes_tanpa_sip' });
    expect(semua.badan.data.map((x: any) => x.waktu)).toEqual([t(15), t(10), t(5)].map((x) => x.toISOString()));

    expect((await panggil('GET', '/peringatan-izin?jenis_peringatan=nakes_tanpa_sip', 'pimpinan')).badan.total).toBe(2);
    expect((await panggil('GET', `/peringatan-izin?pengguna_id=${id.biasa}`, 'pimpinan')).badan.total).toBe(2);
    expect((await panggil('GET', '/peringatan-izin?cari=Nama%20biasa', 'pimpinan')).badan.total).toBe(2);
    const rentang = await panggil('GET', `/peringatan-izin?dari=${t(8).toISOString()}&sampai=${t(12).toISOString()}`, 'pimpinan');
    expect(rentang.badan.total).toBe(1);
    expect(rentang.badan.data[0]).toMatchObject({ jenis_peringatan: 'lihat_tak_dibatasi', diterima_untuk_akun: true });
    expect((await panggil('GET', `/peringatan-izin?dari=${t(12).toISOString()}&sampai=${t(8).toISOString()}`, 'pimpinan')).status).toBe(400);
    expect((await panggil('GET', '/peringatan-izin?ukuran=2&halaman=2', 'pimpinan')).badan.data).toHaveLength(1);
    expect((await panggil('GET', '/peringatan-izin', 'biasa')).status).toBe(403);
  });

  it('daftar jenis akun memuat jumlah pemakai yang sedang berjalan', async () => {
    const jumlah = async (kunci: string) => {
      const r = await panggil('GET', '/jenis-akun', 'pimpinan');
      expect(r.status).toBe(200);
      return r.badan.data.find((x: any) => x.nama === `${kode}-${kunci}`).jumlah_pemakai;
    };
    expect(await jumlah('pimpinan')).toBe(1);
    expect(await jumlah('biasa')).toBe(1);
    await prisma.penugasanJenis.updateMany({ where: { pengguna_id: id.biasa }, data: { selesai: new Date(Date.now() - 1000) } });
    expect(await jumlah('biasa')).toBe(0);
  });
});
