import { PrismaClient } from '@prisma/client';
import { IZIN_AWAL, JENIS_AKUN_AWAL, kredensialAwal } from '@klira/shared';
import { hashKataSandi } from '../kata-sandi';
import { seedWilayahContoh } from './wilayah';
import { seedTerminologiContoh } from './terminologi';
import { seedKfaContoh } from './kfa';
import { seedPenunjangContoh } from './penunjang';

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
    const daftar = [
      ...(await prisma.izin.findMany({ where: { fitur: { in: j.fitur } } })),
      ...(j.lihat_saja?.length ? await prisma.izin.findMany({ where: { fitur: { in: j.lihat_saja }, aksi: 'lihat' } }) : []),
    ];
    await prisma.izinJenisAkun.createMany({
      data: daftar.map((i) => ({ fasyankes_id: fas.id, jenis_akun_id: jenis.id, izin_id: i.id })),
      skipDuplicates: true,
    });
  }
  await seedTeksPersetujuan(prisma);
  await seedPenunjangContoh(prisma, fas.id);
  await seedPimpinanPertama(prisma, fas.id, env);
  // Wilayah contoh hanya bila tabel kosong (jangan menimpa hasil impor resmi).
  if ((await prisma.wilayah.count()) === 0) await seedWilayahContoh(prisma);
  // Terminologi contoh hanya bila tabel kosong (jangan menimpa hasil impor resmi).
  if ((await prisma.kodeTerminologi.count()) === 0) await seedTerminologiContoh(prisma);
  // Referensi KFA contoh hanya bila tabel kosong.
  if ((await prisma.referensiKfa.count()) === 0) await seedKfaContoh(prisma);
}

/** Teks general consent bawaan (versi 1, semua klinik); klinik dapat menambah versi sendiri. Idempoten. */
export const TEKS_GENERAL_CONSENT_V1 = {
  jenis: 'general' as const,
  versi: 1,
  judul: 'Persetujuan umum (general consent)',
  tujuan: 'Persetujuan umum pelayanan, pengelolaan data pribadi untuk pelayanan, dan pengungkapan data kepada penjamin serta pihak berwenang sesuai peraturan.',
  isi: [
    'Saya menyetujui pemberian pelayanan kesehatan di klinik ini, termasuk pemeriksaan, perawatan, dan tindakan yang lazim diberikan.',
    'Saya memahami bahwa data identitas dan data kesehatan saya dicatat dalam rekam medis elektronik dan dipakai untuk kepentingan pelayanan, penagihan, pelaporan, dan pengiriman data ke SATUSEHAT sesuai peraturan.',
    'Saya memahami bahwa data saya dapat dibuka kepada penjamin (mis. BPJS Kesehatan) untuk klaim, dan kepada pihak berwenang sesuai ketentuan hukum.',
    'Saya berhak bertanya, meminta salinan, dan meminta perbaikan data saya melalui klinik.',
  ].join('\n'),
};

/** Teks persetujuan tindakan CONTOH (versi 1, semua klinik): harus ditinjau dan diganti klinik sesuai Permenkes 290/2008 dan SOP sendiri. */
export const TEKS_PERSETUJUAN_TINDAKAN_V1 = {
  jenis: 'tindakan' as const,
  versi: 1,
  judul: 'Persetujuan tindakan kedokteran (CONTOH, tinjau sebelum dipakai)',
  tujuan: 'Persetujuan atas tindakan kedokteran tertentu setelah mendapat penjelasan diagnosis, tata cara, risiko, alternatif, dan prognosis.',
  isi: [
    '[TEKS CONTOH] Klinik wajib meninjau dan mengganti teks ini sesuai ketentuan dan SOP klinik.',
    'Saya telah mendapat penjelasan dari dokter atau tenaga kesehatan mengenai diagnosis, tujuan dan tata cara tindakan, risiko dan komplikasi, alternatif tindakan, serta prognosis.',
    'Saya telah diberi kesempatan bertanya dan memahami penjelasan tersebut.',
    'Dengan ini saya menyetujui tindakan yang disebut pada formulir ini dan memahami bahwa persetujuan dapat ditarik sebelum tindakan dilakukan.',
  ].join('\n'),
};

export async function seedTeksPersetujuan(prisma: PrismaClient): Promise<void> {
  for (const t of [TEKS_GENERAL_CONSENT_V1, TEKS_PERSETUJUAN_TINDAKAN_V1]) {
    const ada = await prisma.teksPersetujuan.findFirst({ where: { fasyankes_id: null, jenis: t.jenis, versi: t.versi } });
    if (!ada) await prisma.teksPersetujuan.create({ data: { ...t, aktif: true } });
  }
}

/** Akun Pimpinan pertama dengan kredensial awal statis; idempoten (tidak menimpa akun yang sudah ada). */
async function seedPimpinanPertama(prisma: PrismaClient, fasyankesId: number, env: NodeJS.ProcessEnv): Promise<void> {
  // Kredensial awal statis yang sama untuk semua klinik (2.4); wajib diganti saat masuk pertama.
  const { username, kataSandi } = kredensialAwal(env);
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
