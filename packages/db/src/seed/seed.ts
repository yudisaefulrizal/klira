import { PrismaClient } from '@prisma/client';
import { IZIN_AWAL, JENIS_AKUN_AWAL } from '@klira/shared';
import { hashKataSandi } from '../kata-sandi';

/** Kredensial awal statis yang sama untuk semua klinik (2.4); wajib diganti saat masuk pertama. */
const USERNAME_AWAL_BAWAAN = 'pimpinan';
const KATA_SANDI_AWAL_BAWAAN = 'klira-awal-2026';

/** Seed minimal: katalog izin dan satu fasyankes contoh dengan paket jenis akun awal. Idempoten. */
export async function jalankanSeed(prisma: PrismaClient, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  for (const izin of IZIN_AWAL) {
    await prisma.izin.upsert({
      where: { fitur_aksi_cakupan: izin },
      update: {},
      create: izin,
    });
  }
  let fas = await prisma.fasyankes.findUnique({ where: { kode_registrasi: 'KLINIK-CONTOH' } });
  if (!fas) {
    const baru = await prisma.fasyankes.create({
      data: { fasyankes_id: 0, nama: 'Klinik Contoh', jenis: 'klinik_pratama_rawat_jalan', kode_registrasi: 'KLINIK-CONTOH' },
    });
    fas = await prisma.fasyankes.update({ where: { id: baru.id }, data: { fasyankes_id: baru.id } });
  }
  for (const j of JENIS_AKUN_AWAL) {
    const jenis = await prisma.jenisAkun.upsert({
      where: { fasyankes_id_nama: { fasyankes_id: fas.id, nama: j.nama } },
      update: {},
      create: { fasyankes_id: fas.id, nama: j.nama, syarat_profesi: j.syarat_profesi },
    });
    const daftar = await prisma.izin.findMany({ where: { fitur: { in: j.fitur } } });
    await prisma.izinJenisAkun.createMany({
      data: daftar.map((i) => ({ fasyankes_id: fas.id, jenis_akun_id: jenis.id, izin_id: i.id })),
      skipDuplicates: true,
    });
  }
  await seedPimpinanPertama(prisma, fas.id, env);
}

/** Akun Pimpinan pertama dengan kredensial awal statis; idempoten (tidak menimpa akun yang sudah ada). */
async function seedPimpinanPertama(prisma: PrismaClient, fasyankesId: number, env: NodeJS.ProcessEnv): Promise<void> {
  const username = env.USERNAME_AWAL?.trim() || USERNAME_AWAL_BAWAAN;
  const kataSandi = env.KATA_SANDI_AWAL || KATA_SANDI_AWAL_BAWAAN;
  // Bila klinik sudah punya akun (termasuk setelah kredensial awal diganti), tidak membuat ulang kredensial awal.
  if ((await prisma.pengguna.count({ where: { fasyankes_id: fasyankesId } })) > 0) return;
  const pengguna = await prisma.pengguna.create({
    data: {
      fasyankes_id: fasyankesId,
      nama: 'Pimpinan Pertama',
      nik: '0000000000000000',
      username,
      kata_sandi_hash: await hashKataSandi(kataSandi),
      wajib_ganti_kredensial: true,
    },
  });
  const jenis = await prisma.jenisAkun.findUniqueOrThrow({
    where: { fasyankes_id_nama: { fasyankes_id: fasyankesId, nama: 'Pimpinan fasyankes' } },
  });
  await prisma.penugasanJenis.create({
    data: { fasyankes_id: fasyankesId, pengguna_id: pengguna.id, jenis_akun_id: jenis.id, mulai: new Date() },
  });
  await prisma.logAudit.create({
    data: { fasyankes_id: fasyankesId, pengguna_id: pengguna.id, aksi: 'input', entitas: 'pengguna', entitas_id: pengguna.id, keterangan: 'Akun Pimpinan pertama dibuat (seed)' },
  });
}

if (require.main === module) {
  const prisma = new PrismaClient();
  jalankanSeed(prisma)
    .then(() => prisma.$disconnect())
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
}
