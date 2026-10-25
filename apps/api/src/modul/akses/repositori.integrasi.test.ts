/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@prisma/client';

const urlUji = process.env.DATABASE_URL_UJI;
const d = urlUji ? describe : describe.skip;

d('RepositoriAksesPrisma (klira_uji)', () => {
  let repo: any;
  let KonflikUsername: new () => Error;
  const prisma = new PrismaClient({ datasourceUrl: urlUji });
  let fasA = 0;
  let fasB = 0;
  let idA = 0;
  let idB = 0;
  let idC = 0;
  const kode = `UJI-REPO-${Date.now()}`;

  async function buatPengguna(fas: number, username: string, nik: string) {
    return prisma.pengguna.create({ data: { fasyankes_id: fas, nama: 'U', nik, username, kata_sandi_hash: 'h' } });
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = urlUji;
    const modul = require('./repositori');
    repo = new modul.RepositoriAksesPrisma();
    KonflikUsername = modul.KonflikUsername;
    const a = await prisma.fasyankes.create({ data: { fasyankes_id: -1, nama: 'A', jenis: 'klinik_pratama_rawat_jalan', kode_registrasi: `${kode}-A` } });
    const b = await prisma.fasyankes.create({ data: { fasyankes_id: -2, nama: 'B', jenis: 'klinik_pratama_rawat_jalan', kode_registrasi: `${kode}-B` } });
    fasA = a.id; fasB = b.id;
    await prisma.fasyankes.update({ where: { id: fasA }, data: { fasyankes_id: fasA } });
    await prisma.fasyankes.update({ where: { id: fasB }, data: { fasyankes_id: fasB } });
    idA = (await buatPengguna(fasA, 'Budi', '9900000000000001')).id;
    idB = (await buatPengguna(fasA, 'siti', '9900000000000002')).id;
    idC = (await buatPengguna(fasB, 'joko', '9900000000000003')).id;
  });
  afterAll(async () => {
    await prisma.sesi.deleteMany({ where: { pengguna_id: { in: [idA, idB, idC] } } });
    await prisma.pengguna.deleteMany({ where: { id: { in: [idA, idB, idC] } } });
    await prisma.fasyankes.deleteMany({ where: { id: { in: [fasA, fasB] } } });
    await prisma.$disconnect();
    await require('@klira/db').prisma.$disconnect();
  });

  it('usernameDipakai: beda huruf besar/kecil, lintas fasyankes, dan mengecualikan diri sendiri', async () => {
    expect(await repo.usernameDipakai('BUDI', idB)).toBe(true);
    expect(await repo.usernameDipakai('joko', idA)).toBe(true);
    expect(await repo.usernameDipakai('budi', idA)).toBe(false);
    expect(await repo.usernameDipakai('tidakada', idA)).toBe(false);
  });

  it('gantiKredensial atomik: ubah akun, cabut semua sesi lama, buat sesi baru', async () => {
    const akun = { id: idA, fasyankes_id: fasA, nama: 'U', username: 'Budi', kata_sandi_hash: 'h', aktif: true, wajib_ganti_kredensial: true };
    const kedaluwarsa = new Date(Date.now() + 3_600_000);
    await repo.buatSesi({ idHash: `${kode}-s1`, akun, kedaluwarsa });
    await repo.buatSesi({ idHash: `${kode}-s2`, akun, kedaluwarsa });
    await repo.gantiKredensial({ akun, username: 'budi.baru', kataSandiHash: 'hash-baru', sesiBaru: { idHash: `${kode}-s3`, alamat: 'x', kedaluwarsa } });
    const p = await prisma.pengguna.findUniqueOrThrow({ where: { id: idA } });
    expect([p.username, p.kata_sandi_hash, p.wajib_ganti_kredensial]).toEqual(['budi.baru', 'hash-baru', false]);
    const sesi = await prisma.sesi.findMany({ where: { pengguna_id: idA } });
    expect(sesi.map((s) => s.id_hash)).toEqual([`${kode}-s3`]);
    expect(await repo.cariSesi(`${kode}-s3`, new Date())).not.toBeNull();
    expect(await repo.cariSesi(`${kode}-s1`, new Date())).toBeNull();
  });

  it('gantiKredensial: username bentrok dalam fasyankes sama melempar KonflikUsername dan tidak mengubah sesi', async () => {
    const akun = { id: idA, fasyankes_id: fasA, nama: 'U', username: 'budi.baru', kata_sandi_hash: 'hash-baru', aktif: true, wajib_ganti_kredensial: false };
    const kedaluwarsa = new Date(Date.now() + 3_600_000);
    await expect(
      repo.gantiKredensial({ akun, username: 'siti', kataSandiHash: 'z', sesiBaru: { idHash: `${kode}-s4`, kedaluwarsa } }),
    ).rejects.toBeInstanceOf(KonflikUsername);
    const p = await prisma.pengguna.findUniqueOrThrow({ where: { id: idA } });
    expect([p.username, p.kata_sandi_hash]).toEqual(['budi.baru', 'hash-baru']);
    expect((await prisma.sesi.findMany({ where: { pengguna_id: idA } })).map((s) => s.id_hash)).toEqual([`${kode}-s3`]);
  });
});
