import { execSync } from 'node:child_process';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { jalankanSeed } from './seed/seed';

const url = process.env.DATABASE_URL_UJI;
const d = url ? describe : describe.skip;

d('skema basis data (klira_uji)', () => {
  const prisma = new PrismaClient({ datasourceUrl: url });
  async function bersihkan() {
    await prisma.$transaction([
      prisma.sesi.deleteMany(), prisma.jadwalPraktik.deleteMany(), prisma.tarifLayanan.deleteMany(), prisma.riwayatProfil.deleteMany(), prisma.wilayah.deleteMany(), prisma.peringatanIzin.deleteMany(), prisma.izinPerAkun.deleteMany(), prisma.penugasanJenis.deleteMany(),
      prisma.izinJenisAkun.deleteMany(), prisma.riwayatJenisAkun.deleteMany(), prisma.jenisAkun.deleteMany(),
      prisma.profilProfesi.deleteMany(), prisma.waliKeluarga.deleteMany(), prisma.pasien.deleteMany(),
      prisma.pengguna.deleteMany(), prisma.kredensialSatusehat.deleteMany(), prisma.lokasi.deleteMany(),
      prisma.izin.deleteMany(), prisma.fasyankes.deleteMany(),
    ]);
  }
  beforeAll(() => {
    const akar = path.resolve(__dirname, '..');
    const bin = path.resolve(akar, '../../node_modules/prisma/build/index.js');
    execSync(`node "${bin}" migrate deploy`, {
      cwd: akar, env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe',
    });
    return bersihkan();
  }, 120000);
  afterAll(() => prisma.$disconnect());

  it('seed idempoten membuat izin dan jenis akun', async () => {
    await jalankanSeed(prisma);
    await jalankanSeed(prisma);
    const fas = await prisma.fasyankes.findFirstOrThrow();
    expect(fas.fasyankes_id).toBe(fas.id);
    expect(await prisma.jenisAkun.count({ where: { fasyankes_id: fas.id } })).toBe(12);
  });

  it('seed membuat Pimpinan pertama dengan wajib ganti kredensial, hash bukan teks asli', async () => {
    await jalankanSeed(prisma);
    const p = await prisma.pengguna.findFirstOrThrow({ where: { username: 'pimpinan' } });
    expect(p.wajib_ganti_kredensial).toBe(true);
    expect(p.kata_sandi_hash).not.toContain('klira-awal-2026');
    expect(await prisma.penugasanJenis.count({ where: { pengguna_id: p.id } })).toBe(1);
  });

  it('username unik per fasyankes dan NIK unik', async () => {
    const fas = await prisma.fasyankes.findFirstOrThrow();
    const dasar = { fasyankes_id: fas.id, nama: 'A', kata_sandi_hash: 'x' };
    await prisma.pengguna.create({ data: { ...dasar, nik: '3201010101010001', username: 'a' } });
    await expect(
      prisma.pengguna.create({ data: { ...dasar, nik: '3201010101010002', username: 'a' } }),
    ).rejects.toThrow();
    await expect(
      prisma.pengguna.create({ data: { ...dasar, nik: '3201010101010001', username: 'b' } }),
    ).rejects.toThrow();
  });

  it('penugasan memakai tanggal selesai, dan klien menyimpan waktu', async () => {
    const p = await prisma.pengguna.findFirstOrThrow();
    const j = await prisma.jenisAkun.findFirstOrThrow();
    const r = await prisma.penugasanJenis.create({
      data: { fasyankes_id: p.fasyankes_id, pengguna_id: p.id, jenis_akun_id: j.id, mulai: new Date('2026-01-01T00:00:00Z') },
    });
    expect(r.selesai).toBeNull();
    expect(r.dibuat_pada).toBeInstanceOf(Date);
  });

  it('kredensial satusehat menyimpan secret terenkripsi', async () => {
    const fas = await prisma.fasyankes.findFirstOrThrow();
    const k = await prisma.kredensialSatusehat.create({
      data: { fasyankes_id: fas.id, environment: 'sandbox', client_id: 'c', client_secret_terenkripsi: 'v1:a:b:c' },
    });
    expect(k.client_secret_terenkripsi).toBe('v1:a:b:c');
  });
});
