/**
 * Pengisi data dummy skala ribuan untuk uji performa tabel `pemeriksaan`, daftar pasien, histori, dan CPPT.
 * Jalankan: `node skrip/dengan-env.mjs node skrip/data-performa.mjs`
 * Bersihkan: `node skrip/dengan-env.mjs node skrip/data-performa.mjs --bersih`
 */
import crypto from 'node:crypto';
import { formatNomorRm } from '@klira/shared';
import { pool, baca, tulis } from '../packages/db/src/koneksi.js';
import { buatProfilPasienNyata } from './data-referensi/pasien-nyata.js';

const JUMLAH_PASIEN = Number(process.env.PERF_PASIEN ?? 1000);
const JUMLAH_KUNJUNGAN = Number(process.env.PERF_KUNJUNGAN ?? 0);
const UKURAN_BATCH = 500;

const KELUHAN = ['Demam 2 hari disertai batuk', 'Nyeri ulu hati sejak kemarin', 'Kontrol tekanan darah tinggi', 'Pusing dan lemas', 'Batuk berdahak 4 hari'];
const DIAGNOSA = [
  ['I10', 'Essential (primary) hypertension'],
  ['J06.9', 'Acute upper respiratory infection, unspecified'],
  ['K29.7', 'Gastritis, unspecified'],
  ['E11.9', 'Type 2 diabetes mellitus without complications'],
];

function buatDataPasienNyata(i, urutanRm, dokterId) {
  const p = buatProfilPasienNyata(i);
  return [
    formatNomorRm(urutanRm), p.nik, p.nama, p.nomor_hp, p.tanggal_lahir, p.jenis_kelamin,
    p.tempat_lahir, p.pekerjaan, p.agama, p.bahasa, p.status_kawin, p.pendidikan, p.alamat, p.jkn_nomor_kartu,
    'lengkap', 'nik', 0, dokterId,
  ];
}

async function sisipBatch(tabel, kolom, baris) {
  for (let i = 0; i < baris.length; i += UKURAN_BATCH) {
    const potong = baris.slice(i, i + UKURAN_BATCH);
    const daftarKolom = kolom.map((k) => `\`${k}\``).join(', ');
    await tulis(`INSERT INTO \`${tabel}\` (${daftarKolom}) VALUES ?`, [potong]);
  }
}

const SYARAT_PASIEN_PERF = "(nomor_rm LIKE 'PF-%' OR (nomor_rm REGEXP '^[0-9]{2}-[0-9]{2}-[0-9]{3}$' AND CAST(REPLACE(nomor_rm, '-', '') AS UNSIGNED) > 13))";

async function bersihkan() {
  const kIds = (await baca("SELECT id FROM kunjungan WHERE id_layanan LIKE 'PERF-%'")).map((r) => r.id);
  if (kIds.length) {
    for (let i = 0; i < kIds.length; i += 1000) {
      const slice = kIds.slice(i, i + 1000);
      await tulis('DELETE FROM pengesahan_catatan WHERE entitas_id IN (?)', [slice]);
      await tulis('DELETE FROM diagnosis WHERE kunjungan_id IN (?)', [slice]);
      await tulis('DELETE FROM pemeriksaan WHERE kunjungan_id IN (?)', [slice]);
      await tulis('DELETE FROM kunjungan WHERE id IN (?)', [slice]);
    }
  }
  await tulis(`DELETE FROM pasien WHERE ${SYARAT_PASIEN_PERF}`);
  await tulis("UPDATE urutan_nomor_rm SET terakhir = COALESCE((SELECT MAX(CAST(REPLACE(nomor_rm, '-', '') AS UNSIGNED)) FROM pasien WHERE nomor_rm REGEXP '^[0-9]{2}-[0-9]{2}-[0-9]{3}$'), 0)");
  console.log(`Data performa dibersihkan (${kIds.length} kunjungan).`);
}

async function jalankan() {
  if (process.argv.includes('--bersih')) {
    await bersihkan();
    return;
  }

  const t0 = performance.now();
  const ada = await baca(`SELECT COUNT(*) AS c FROM pasien WHERE ${SYARAT_PASIEN_PERF}`);
  if (Number(ada[0].c) > 0) {
    console.log(`Data performa sudah ada (${ada[0].c} pasien). Jalankan dengan --bersih dulu jika ingin mengulang.`);
    return;
  }

  const pengguna = await baca('SELECT id FROM pengguna ORDER BY id ASC LIMIT 1');
  const poli = await baca("SELECT id FROM lokasi WHERE jenis = 'poli' ORDER BY id ASC LIMIT 1");
  const dokterId = pengguna[0]?.id ?? 1;
  const poliId = poli[0]?.id ?? null;

  const urutRows = await baca('SELECT terakhir FROM urutan_nomor_rm LIMIT 1');
  let awalUrutan = Number(urutRows[0]?.terakhir ?? 0);
  if (!urutRows.length) {
    const maks = await baca("SELECT COALESCE(MAX(CAST(REPLACE(nomor_rm, '-', '') AS UNSIGNED)), 0) AS m FROM pasien WHERE nomor_rm REGEXP '^[0-9]{2}-[0-9]{2}-[0-9]{3}$'");
    awalUrutan = Number(maks[0]?.m ?? 0);
    await tulis('INSERT INTO urutan_nomor_rm (terakhir) VALUES (?)', [awalUrutan]);
  }

  // 1. Pasien
  const pasienBaris = [];
  for (let i = 1; i <= JUMLAH_PASIEN; i++)
    pasienBaris.push(buatDataPasienNyata(i, awalUrutan + i, dokterId));
  await sisipBatch(
    'pasien',
    [
      'nomor_rm', 'nik', 'nama', 'nomor_hp', 'tanggal_lahir', 'jenis_kelamin',
      'tempat_lahir', 'pekerjaan', 'agama', 'bahasa', 'status_kawin', 'pendidikan', 'alamat', 'jkn_nomor_kartu',
      'status_identitas', 'jalur_identitas', 'tidak_cakap', 'dibuat_oleh',
    ],
    pasienBaris,
  );
  await tulis('UPDATE urutan_nomor_rm SET terakhir = ?', [awalUrutan + JUMLAH_PASIEN]);
  const pasienIds = (await baca(`SELECT id FROM pasien WHERE ${SYARAT_PASIEN_PERF} ORDER BY id ASC`)).map((r) => r.id);

  if (JUMLAH_KUNJUNGAN <= 0) {
    console.log(`Selesai dalam ${Math.round(performance.now() - t0)} ms: ${JUMLAH_PASIEN} pasien siap.`);
    return;
  }

  // 2. Kunjungan (90% AMB ditutup historis, 10% IMP in-progress/finished)
  const sekarang = Date.now();
  const kunjunganBaris = [];
  for (let i = 1; i <= JUMLAH_KUNJUNGAN; i++) {
    const pId = pasienIds[(i - 1) % pasienIds.length];
    const imp = i % 10 === 0;
    const tgl = new Date(sekarang - (1 + (i % 180)) * 86_400_000);
    const selesai = new Date(tgl.getTime() + 1_800_000);
    kunjunganBaris.push([
      `PERF-${String(i).padStart(6, '0')}`, pId,
      imp ? 'IMP' : 'AMB', 'finished', 'ditutup',
      poliId, i % 3 === 0 ? 'jkn' : 'umum', KELUHAN[i % KELUHAN.length],
      tgl, selesai, selesai, dokterId,
    ]);
  }
  await sisipBatch(
    'kunjungan',
    ['id_layanan', 'pasien_id', 'jenis', 'status', 'tahap_layanan', 'lokasi_id', 'cara_pembayaran', 'keluhan_singkat', 'mulai', 'selesai', 'waktu_tutup', 'dibuat_oleh'],
    kunjunganBaris,
  );
  const kunjRows = await baca("SELECT id, jenis, mulai FROM kunjungan WHERE id_layanan LIKE 'PERF-%' ORDER BY id ASC");

  // 3. Pemeriksaan (4 baris per AMB: anamnesis, tanda_vital, keperawatan, subjek; +2 cppt per IMP), Diagnosis, Pengesahan
  const periksaBaris = [];
  const dxBaris = [];
  const sahBaris = [];
  const dummyHash = crypto.createHash('sha256').update('perf').digest('hex');

  for (let idx = 0; idx < kunjRows.length; idx++) {
    const k = kunjRows[idx];
    const [kodeDx, namaDx] = DIAGNOSA[idx % DIAGNOSA.length];
    const keluhan = KELUHAN[idx % KELUHAN.length];

    // anamnesis
    periksaBaris.push([
      k.id, 'ralan', 'anamnesis', 1,
      null, null, null, null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null,
      keluhan, null, `${keluhan} sejak 2 hari`, 'Tidak ada', 'Tidak ada', 'Aktif bekerja',
      null, null, null, null, null,
      null, null, null, null, null, null, null, null, dokterId, k.mulai,
    ]);
    // tanda_vital
    periksaBaris.push([
      k.id, 'ralan', 'tanda_vital', 1,
      36.5 + (idx % 15) * 0.1, 110 + (idx % 40), 70 + (idx % 25), 76 + (idx % 20), 18 + (idx % 6),
      155 + (idx % 25), 50 + (idx % 35), 72 + (idx % 25), 97 + (idx % 3), 15, 'compos_mentis',
      null, null, null, null, null, null, null,
      null, null, null, null, null, null,
      null, null, null, null, null,
      null, null, null, null, null, null, null, null, dokterId, k.mulai,
    ]);
    // keperawatan
    periksaBaris.push([
      k.id, 'ralan', 'keperawatan', 1,
      null, null, null, null, null, null, null, null, null, null, null,
      idx % 5 === 0 ? 'Debu' : 'Tidak Ada', null, null, null, null, null, null,
      null, null, null, null, null, null,
      'Belum diobati', null, 'Keadaan umum baik', 'Nyeri akut ringan', 'Edukasi istirahat dan minum cukup',
      'tidak', null, null, null, null, null, 0, 0, dokterId, k.mulai,
    ]);
    // subjek SOAPIE
    periksaBaris.push([
      k.id, 'ralan', 'subjek', 1,
      null, null, null, null, null, null, null, null, null, null, null,
      null, keluhan, null, null, null, null, null,
      null, null, null, null, null, null,
      null, null, null, null, null,
      null, null, null, null, null, null, null, null, dokterId, k.mulai,
    ]);

    if (k.jenis === 'IMP') {
      periksaBaris.push([
        k.id, 'cppt', 'cppt', 1,
        37.2, 120, 80, 84, 20, 165, 65, 80, 98, 15, 'compos_mentis',
        null, 'Keluhan membaik', 'Keadaan umum sedang', namaDx, 'Lanjut terapi rawat inap', 'Monitor TTV tiap shift', null,
        null, null, null, null, null, null,
        null, null, null, null, null,
        null, null, null, null, null, null, null, null, dokterId, k.mulai,
      ]);
    }

    dxBaris.push([k.id, 1, kodeDx, namaDx, null, 'utama', 0, dokterId, k.mulai]);
    for (const bag of ['anamnesis', 'tanda_vital', 'keperawatan', 'subjek', 'diagnosis']) {
      sahBaris.push([bag, k.id, 1, dokterId, null, 'Dokter/DPJP', k.mulai, dummyHash, dokterId, k.mulai]);
    }
  }

  await sisipBatch(
    'pemeriksaan',
    [
      'kunjungan_id', 'jenis', 'bagian', 'versi',
      'suhu', 'tensi_sistol', 'tensi_diastol', 'nadi', 'respirasi',
      'tinggi', 'berat', 'lingkar_perut', 'spo2', 'gcs', 'kesadaran',
      'alergi', 'subjek', 'objek', 'asesmen', 'plan', 'instruksi', 'evaluasi',
      'keluhan_utama', 'penyerta', 'riwayat_sekarang', 'riwayat_pribadi', 'riwayat_keluarga', 'kajian_sosial',
      'telah_diobati', 'obat_dikonsumsi', 'kajian_keperawatan', 'diagnosa_keperawatan', 'rencana_asuhan',
      'nyeri_jenis', 'nyeri_skala', 'nyeri_lokasi', 'nyeri_durasi', 'nyeri_frekuensi', 'nyeri_hilang_bila',
      'gizi_bb_turun', 'gizi_asupan_kurang', 'dibuat_oleh', 'dibuat_pada',
    ],
    periksaBaris,
  );
  await sisipBatch(
    'diagnosis',
    ['kunjungan_id', 'versi', 'kode_icd10', 'nama', 'kode_snomed', 'peran', 'urutan', 'dibuat_oleh', 'dibuat_pada'],
    dxBaris,
  );
  await sisipBatch(
    'pengesahan_catatan',
    ['entitas', 'entitas_id', 'versi', 'pengguna_id', 'jenis_akun_id', 'jenis_akun_nama', 'waktu', 'hash', 'dibuat_oleh', 'dibuat_pada'],
    sahBaris,
  );

  const ms = Math.round(performance.now() - t0);
  console.log(`Selesai dalam ${ms} ms: ${pasienBaris.length} pasien, ${kunjunganBaris.length} kunjungan, ${periksaBaris.length} baris pemeriksaan, ${dxBaris.length} diagnosis, ${sahBaris.length} pengesahan.`);
}

try {
  await jalankan();
} finally {
  await pool.end();
}
