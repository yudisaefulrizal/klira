import * as db from '../data-access';
import { IZIN_AWAL, JENIS_AKUN_AWAL, kredensialAwal } from '@klira/shared';
import { hashKataSandi } from '../kata-sandi';
import { seedTerminologiContoh } from './terminologi';

/** Seed minimal: katalog izin dan satu fasyankes contoh dengan paket jenis akun awal. Idempoten. */
export async function jalankanSeed(koneksi: db.Koneksi, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  for (const izin of IZIN_AWAL) {
    await db.simpanIzinUntukJalankanSeed((izin)?.fitur, (izin)?.aksi, (izin)?.cakupan, koneksi);
  }
  let fas = await db.ambilFasyankesUntukJalankanSeed('KLINIK-CONTOH', koneksi);
  if (!fas) {
    const baru = await db.transaksi(async koneksiBaru => { const _hasil = await db.tambahFasyankesUntukJalankanSeed(0, 'Klinik Contoh', 'klinik_pratama_rawat_jalan', 'KLINIK-CONTOH', koneksiBaru); return db.tambahFasyankesUntukJalankanSeedHasil(_hasil.id, koneksiBaru); });
    fas = await db.transaksi(async koneksiBaru => { (await db.ubahFasyankesUntukJalankanSeed(baru.id, koneksiBaru)); return db.tambahFasyankesUntukJalankanSeedHasil(baru.id, koneksiBaru); });
  }
  for (const j of JENIS_AKUN_AWAL) {
    const jenis = await db.transaksi(async koneksiBaru => { (await db.simpanJenisAkunUntukJalankanSeed(fas.id, j.nama, j.syarat_profesi, koneksiBaru)); return db.simpanJenisAkunUntukJalankanSeedHasil(fas.id, j.nama, koneksiBaru); });
    const daftar = [
      ...(await db.daftarIzinUntukJalankanSeed(j.fitur, koneksi)),
      ...(j.lihat_saja?.length ? await db.daftarIzinUntukJalankanSeed2(j.lihat_saja, 'lihat', koneksi) : []),
    ];
    await db.tambahBanyakIzinJenisAkunUntukUbahJenisAkun(daftar.map((i) => ({ fasyankes_id: fas.id, jenis_akun_id: jenis.id, izin_id: i.id })), koneksi);
  }
  await seedTeksPersetujuan(koneksi);
  await seedPimpinanPertama(koneksi, fas.id, env);
  // Wilayah contoh hanya bila tabel kosong (jangan menimpa hasil impor resmi).
  // Terminologi contoh hanya bila tabel kosong (jangan menimpa hasil impor resmi).
  if ((await db.hitungKodeTerminologiUntukJalankanSeed(koneksi)) === 0) await seedTerminologiContoh(koneksi);
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

export async function seedTeksPersetujuan(koneksi: db.Koneksi): Promise<void> {
  for (const t of [TEKS_GENERAL_CONSENT_V1, TEKS_PERSETUJUAN_TINDAKAN_V1]) {
    const ada = await db.cariTeksPersetujuanUntukSeedTeksPersetujuan(null, t.jenis, t.versi, koneksi);
    if (!ada) await db.tambahTeksPersetujuanUntukSeedTeksPersetujuan((t)?.jenis, (t)?.versi, (t)?.judul, (t)?.tujuan, (t)?.isi, true, koneksi);
  }
}

/** Akun Pimpinan pertama dengan kredensial awal statis; idempoten (tidak menimpa akun yang sudah ada). */
async function seedPimpinanPertama(koneksi: db.Koneksi, fasyankesId: number, env: NodeJS.ProcessEnv): Promise<void> {
  // Kredensial awal statis yang sama untuk semua klinik (2.4); wajib diganti saat masuk pertama.
  const { username, kataSandi } = kredensialAwal(env);
  // Bila klinik sudah punya akun (termasuk setelah kredensial awal diganti), tidak membuat ulang kredensial awal.
  if ((await db.hitungPenggunaUntukSeedPimpinanPertama(fasyankesId, koneksi)) > 0) return;
  const pengguna = await db.transaksi(async koneksiBaru => { const _hasil = await db.tambahPenggunaUntukSeedPimpinanPertama(fasyankesId, 'Pimpinan Pertama', '0000000000000000', username, await hashKataSandi(kataSandi), true, koneksiBaru); return db.tambahPenggunaUntukBuatAkunHasil(_hasil.id, koneksiBaru); });
  const jenis = await db.simpanJenisAkunUntukJalankanSeedHasil(fasyankesId, 'Pimpinan fasyankes', koneksi);
  await db.tambahPenugasanJenisUntukSeedPimpinanPertama(fasyankesId, pengguna.id, jenis.id, new Date(), koneksi);
  await db.tambahLogAuditUntukSeedPimpinanPertama(fasyankesId, pengguna.id, 'input', 'pengguna', 'Akun Pimpinan pertama dibuat (seed)', koneksi);
}

if (require.main === module) {
  const koneksi = db.pool;
  jalankanSeed(koneksi)
    .then(() => db.tutupPool())
    .catch(async (e) => { console.error(e); await db.tutupPool(); process.exit(1); });
}
