import { PrismaClient } from '@prisma/client';
import { IZIN_AWAL, JENIS_AKUN_AWAL } from '../izin-awal';

/** Seed minimal: katalog izin dan satu fasyankes contoh dengan paket jenis akun awal. Idempoten. */
export async function jalankanSeed(prisma: PrismaClient): Promise<void> {
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
}

if (require.main === module) {
  const prisma = new PrismaClient();
  jalankanSeed(prisma)
    .then(() => prisma.$disconnect())
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
}
