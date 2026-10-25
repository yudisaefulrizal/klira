/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { AddressInfo } from 'net';
import { PrismaClient } from '@prisma/client';

const urlUji = process.env.DATABASE_URL_UJI;
const d = urlUji ? describe : describe.skip;

d('klinis, pengesahan, dan pendamping terhadap klira_uji', () => {
  const prisma = new PrismaClient({ datasourceUrl: urlUji });
  const kode = `UJI-KLN-${Date.now()}`;
  const awalan = `ZU${String(Date.now()).slice(-5)}`;
  let server: any;
  let fas = 0;
  let fasLain = 0;
  let pasienA = 0;
  let pasienB = 0;
  let kunjA1 = 0;
  let kunjA2 = 0;
  let kunjLain = 0;
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
  async function buatPengguna(kunci: string, nik: string, izin: [string, string][], fasId = fas) {
    const { hashKataSandi } = require('@klira/db');
    const u = await prisma.pengguna.create({
      data: { fasyankes_id: fasId, nama: `Nama ${kunci}`, nik, username: `${kode}-${kunci}`, kata_sandi_hash: await hashKataSandi('sandi-uji-1'), wajib_ganti_kredensial: false },
    });
    id[kunci] = u.id;
    if (!izin.length) return;
    const j = await prisma.jenisAkun.create({ data: { fasyankes_id: fasId, nama: `Jenis ${kunci}` } });
    for (const [fitur, aksi] of izin) {
      const r = await prisma.izin.upsert({ where: { fitur_aksi_cakupan: { fitur, aksi: aksi as 'lihat', cakupan: 'unit' } }, update: {}, create: { fitur, aksi: aksi as 'lihat', cakupan: 'unit' } });
      await prisma.izinJenisAkun.create({ data: { fasyankes_id: fasId, jenis_akun_id: j.id, izin_id: r.id } });
    }
    await prisma.penugasanJenis.create({ data: { fasyankes_id: fasId, pengguna_id: u.id, jenis_akun_id: j.id, mulai: new Date(Date.now() - 86_400_000) } });
  }
  async function login(kunci: string) {
    const res = await fetch(url('/masuk'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: `${kode}-${kunci}`, kata_sandi: 'sandi-uji-1' }) });
    expect(res.status).toBe(200);
    cookie[kunci] = res.headers.get('set-cookie')!.split(';')[0];
  }
  const buatFasyankes = async (kodeReg: string, nama: string) => {
    const f = await prisma.fasyankes.create({ data: { fasyankes_id: -8, nama, jenis: 'klinik_pratama_rawat_jalan', kode_registrasi: kodeReg } });
    await prisma.fasyankes.update({ where: { id: f.id }, data: { fasyankes_id: f.id } });
    return f.id;
  };
  const buatPasien = (fasId: number, rm: string, nama: string) =>
    prisma.pasien.create({ data: { fasyankes_id: fasId, nomor_rm: rm, nama, tanggal_lahir: new Date('1980-01-01'), jenis_kelamin: 'perempuan' } }).then((p) => p.id);
  const buatKunjungan = (fasId: number, pasienId: number, tahap: 'menunggu_skrining' | 'pemeriksaan' | 'ditutup' = 'menunggu_skrining') =>
    prisma.kunjungan.create({ data: { fasyankes_id: fasId, pasien_id: pasienId, jenis: 'AMB', tahap_layanan: tahap } }).then((k) => k.id);
  const klinis = (idK: number, bagian: string) => `/kunjungan/${idK}/klinis/${bagian}`;
  const ambilBagian = async (idK: number, bagian: string) => (await panggil('GET', `/kunjungan/${idK}/klinis`, 'dokter')).badan.data.bagian[bagian];

  const DOKTER: [string, string][] = [['klinis', 'lihat'], ['klinis', 'input'], ['klinis', 'perbaikan'], ['kunjungan', 'perbaikan'], ['pasien', 'lihat']];
  const diagnosis = { item: [{ kode: 'I10', nama: 'Hipertensi esensial', peran: 'utama' }, { kode: 'E11.9', nama: 'DM tipe 2', peran: 'penyerta' }] };

  beforeAll(async () => {
    process.env.DATABASE_URL = urlUji;
    fas = await buatFasyankes(kode, 'Uji Klinis');
    fasLain = await buatFasyankes(`${kode}-LAIN`, 'Uji Klinis Lain');
    const { buatApp } = require('../../app');
    server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
    await buatPengguna('dokter', '9960000000000001', DOKTER);
    await buatPengguna('dokter2', '9960000000000002', DOKTER);
    await buatPengguna('perekam', '9960000000000003', [['rekam-medis', 'lihat']]);
    await buatPengguna('biasa', '9960000000000004', [['kunjungan', 'lihat']]);
    await buatPengguna('lain', '9960000000000005', DOKTER, fasLain);
    pasienA = await buatPasien(fas, `${kode}-A`, 'Budi Santoso');
    pasienB = await buatPasien(fas, `${kode}-B`, 'Ani Santoso');
    const pasienLain = await buatPasien(fasLain, `${kode}-L`, 'Pasien Lain');
    kunjA1 = await buatKunjungan(fas, pasienA);
    kunjLain = await buatKunjungan(fasLain, pasienLain);
    await prisma.kodeTerminologi.createMany({
      data: [
        { sistem: 'icd10', kode: `${awalan}.1`, nama: 'Kode uji satu', contoh: true }, { sistem: 'icd10', kode: `${awalan}.2`, nama: 'Kode uji dua', contoh: true },
        { sistem: 'icd10', kode: `${awalan}.3`, nama: `Nama memuat ${awalan}`, contoh: true }, { sistem: 'icd10', kode: `${awalan}.4`, nama: 'Nonaktif', aktif: false, contoh: true },
      ],
    });
    for (const k of ['dokter', 'dokter2', 'perekam', 'biasa', 'lain']) await login(k);
  });

  afterAll(async () => {
    server?.close();
    const where = { fasyankes_id: { in: [fas, fasLain] } };
    await prisma.logAudit.deleteMany({ where });
    await prisma.sesi.deleteMany({ where: { pengguna_id: { in: Object.values(id) } } });
    await prisma.peringatanIzin.deleteMany({ where });
    for (const m of [prisma.anamnesis, prisma.observasi, prisma.diagnosis, prisma.tindakan, prisma.tindakLanjut, prisma.versiCatatan, prisma.pengesahanCatatan, prisma.favoritDokter, prisma.templatCatatan, prisma.keluargaPasien, prisma.draf] as any[]) {
      await m.deleteMany({ where });
    }
    await prisma.kodeTerminologi.deleteMany({ where: { kode: { startsWith: awalan } } });
    await prisma.antrean.deleteMany({ where });
    await prisma.kunjungan.deleteMany({ where });
    await prisma.pasien.deleteMany({ where });
    await prisma.penugasanJenis.deleteMany({ where });
    await prisma.izinJenisAkun.deleteMany({ where });
    await prisma.jenisAkun.deleteMany({ where });
    await prisma.pengguna.deleteMany({ where });
    await prisma.fasyankes.deleteMany({ where: { id: { in: [fas, fasLain] } } });
    await prisma.$disconnect();
  });

  it('izin dan batas fasyankes: tanpa izin 403, tanpa sesi 401, kunjungan fasyankes lain 404, tidak ada rute hapus', async () => {
    expect((await panggil('GET', `/kunjungan/${kunjA1}/klinis`, null)).status).toBe(401);
    expect((await panggil('GET', `/kunjungan/${kunjA1}/klinis`, 'biasa')).status).toBe(403);
    expect((await panggil('PUT', klinis(kunjA1, 'anamnesis'), 'perekam', { isi: { keluhan_utama: 'x' } })).status).toBe(403);
    expect((await panggil('GET', `/kunjungan/${kunjLain}/klinis`, 'dokter')).status).toBe(404);
    expect((await panggil('PUT', klinis(kunjLain, 'anamnesis'), 'dokter', { isi: { keluhan_utama: 'x' } })).status).toBe(404);
    expect((await panggil('GET', `/kunjungan/${kunjA1}/konteks-klinis`, 'lain')).status).toBe(404);
    expect((await panggil('DELETE', klinis(kunjA1, 'anamnesis'), 'dokter')).status).toBe(404);
    expect((await panggil('PUT', klinis(kunjA1, 'bukan-bagian'), 'dokter', { isi: {} })).status).toBe(404);
    // perekam medis boleh melihat catatan (rekam-medis lihat)
    expect((await panggil('GET', `/kunjungan/${kunjA1}/klinis`, 'perekam')).status).toBe(200);
  });

  it('skrining: tanda vital disimpan, disahkan, dan tahap maju ke pemeriksaan', async () => {
    const tidakSah = await panggil('PUT', klinis(kunjA1, 'tanda_vital'), 'dokter', { isi: { suhu: 80 } });
    expect(tidakSah.status).toBe(400);
    expect(tidakSah.badan.galat.rincian[0].jalur).toMatch(/^isi\./);
    const r = await panggil('PUT', klinis(kunjA1, 'tanda_vital'), 'dokter', { isi: { sistolik: 150, diastolik: '95', suhu: '36,7' } });
    expect(r.status).toBe(200);
    expect(r.badan.data).toMatchObject({
      tersimpan: true, kunjungan: { tahap_layanan: 'pemeriksaan' },
      bagian: { isi: { sistolik: 150, diastolik: 95, suhu: 36.7, nadi: null }, verifikasi: 'sah', pengesahan: { versi: 1, pengguna_id: id.dokter, jenis_akun: 'Jenis dokter' } },
    });
    expect(r.badan.data.bagian.pengesahan.hash).toMatch(/^[0-9a-f]{64}$/);
    // kode LOINC dan satuan UCUM tersimpan pada baris observasi
    const baris = await prisma.observasi.findFirstOrThrow({ where: { kunjungan_id: kunjA1, bidang: 'sistolik' } });
    expect(baris).toMatchObject({ kode_loinc: '8480-6', satuan_ucum: 'mm[Hg]', nilai: '150', kelompok: 'tanda_vital', versi: 1 });
  });

  it('API verifikasi: sah, lalu berubah setelah isi diubah langsung di basis data', async () => {
    expect((await panggil('GET', `/pengesahan/tanda_vital/${kunjA1}`, 'dokter')).badan.data).toMatchObject({ status: 'sah', versi: 1 });
    expect((await panggil('GET', `/pengesahan/anamnesis/${kunjA1}`, 'dokter')).badan.data).toMatchObject({ status: 'belum_disahkan', versi: null });
    expect((await panggil('GET', `/pengesahan/tidak-dikenal/${kunjA1}`, 'dokter')).status).toBe(404);
    expect((await panggil('GET', `/pengesahan/tanda_vital/${kunjA1}`, 'biasa')).status).toBe(403);
    await prisma.observasi.updateMany({ where: { kunjungan_id: kunjA1, bidang: 'sistolik' }, data: { nilai: '110' } });
    expect((await panggil('GET', `/pengesahan/tanda_vital/${kunjA1}`, 'perekam')).badan.data).toMatchObject({ status: 'berubah' });
    expect((await ambilBagian(kunjA1, 'tanda_vital')).verifikasi).toBe('berubah');
    // memulihkan: simpan isi yang disahkan lagi butuh alasan karena isi tersimpan tidak lagi sama
    await prisma.observasi.updateMany({ where: { kunjungan_id: kunjA1, bidang: 'sistolik' }, data: { nilai: '150' } });
    expect((await panggil('GET', `/pengesahan/tanda_vital/${kunjA1}`, 'dokter')).badan.data.status).toBe('sah');
  });

  it('anamnesis, perbaikan berversi: alasan wajib, versi catatan, hanya pembuat dalam 2x24 jam', async () => {
    expect((await panggil('PUT', klinis(kunjA1, 'anamnesis'), 'dokter', { isi: { keluhan_utama: 'Batuk 3 hari', alergi: 'Penisilin' } })).status).toBe(200);
    const sama = await panggil('PUT', klinis(kunjA1, 'anamnesis'), 'dokter', { isi: { keluhan_utama: 'Batuk 3 hari', alergi: 'Penisilin' } });
    expect(sama.badan.data.tersimpan).toBe(false);
    const tanpaAlasan = await panggil('PUT', klinis(kunjA1, 'anamnesis'), 'dokter', { isi: { keluhan_utama: 'Batuk 4 hari', alergi: 'Penisilin' } });
    expect(tanpaAlasan.status).toBe(400);
    const lain = await panggil('PUT', klinis(kunjA1, 'anamnesis'), 'dokter2', { isi: { keluhan_utama: 'Batuk 4 hari' }, alasan: 'Koreksi' });
    expect(lain.status).toBe(409);
    const ok = await panggil('PUT', klinis(kunjA1, 'anamnesis'), 'dokter', { isi: { keluhan_utama: 'Batuk 4 hari', alergi: 'Penisilin' }, alasan: 'Durasi salah' });
    expect(ok.status).toBe(200);
    expect(ok.badan.data.bagian).toMatchObject({ pengesahan: { versi: 2 }, verifikasi: 'sah', isi: { keluhan_utama: 'Batuk 4 hari' } });
    const versi = await prisma.versiCatatan.findMany({ where: { entitas: 'anamnesis', entitas_id: kunjA1 } });
    expect(versi).toHaveLength(1);
    expect(versi[0]).toMatchObject({ versi: 1, alasan: 'Durasi salah', disetujui_oleh: null });
    expect((versi[0].isi_lama as any).keluhan_utama).toBe('Batuk 3 hari');
    // baris lama tetap ada (tanpa DELETE)
    expect(await prisma.anamnesis.count({ where: { kunjungan_id: kunjA1 } })).toBe(2);
    expect((await panggil('GET', `/pengesahan/anamnesis/${kunjA1}/versi`, 'dokter')).badan.data).toHaveLength(1);
    // setelah lewat 2x24 jam pembuat pun tidak boleh memperbaiki sendiri
    await prisma.pengesahanCatatan.updateMany({ where: { entitas: 'anamnesis', entitas_id: kunjA1 }, data: { waktu: new Date(Date.now() - 49 * 3_600_000) } });
    const lewat = await panggil('PUT', klinis(kunjA1, 'anamnesis'), 'dokter', { isi: { keluhan_utama: 'Batuk 5 hari' }, alasan: 'Lagi' });
    expect(lewat.status).toBe(409);
  });

  it('pemeriksaan, diagnosis, tindakan, dan tindak lanjut tersimpan dan terbaca kembali sah', async () => {
    expect((await panggil('PUT', klinis(kunjA1, 'pemeriksaan'), 'dokter', { isi: { keadaan_umum: 'Baik', abdomen: 'Supel' } })).status).toBe(200);
    const salah = await panggil('PUT', klinis(kunjA1, 'diagnosis'), 'dokter', { isi: { item: [{ kode: 'I10', nama: 'x', peran: 'penyerta' }] } });
    expect(salah.status).toBe(400);
    expect((await panggil('PUT', klinis(kunjA1, 'diagnosis'), 'dokter', { isi: diagnosis })).status).toBe(200);
    const tindakan = await panggil('PUT', klinis(kunjA1, 'tindakan'), 'dokter', { isi: { item: [{ kode: '89.52', nama: 'EKG', mulai: '2026-10-25T01:00:00Z' }] } });
    expect(tindakan.badan.data.bagian.isi.item[0]).toMatchObject({ kode: '89.52', performer_id: id.dokter, selesai: null });
    const luar = await panggil('PUT', klinis(kunjA1, 'tindakan'), 'dokter', { isi: { item: [{ kode: '89.52', nama: 'EKG', mulai: '2026-10-25T01:00:00Z', performer_id: id.lain }] } });
    expect(luar.status).toBe(400);
    expect((await panggil('PUT', klinis(kunjA1, 'tindak_lanjut'), 'dokter', { isi: { jenis: 'rujuk' } })).status).toBe(400);
    expect((await panggil('PUT', klinis(kunjA1, 'tindak_lanjut'), 'dokter', { isi: { jenis: 'rujuk', tujuan: 'RS Umum' } })).status).toBe(200);
    const semua = (await panggil('GET', `/kunjungan/${kunjA1}/klinis`, 'dokter')).badan.data;
    for (const b of ['anamnesis', 'tanda_vital', 'pemeriksaan', 'diagnosis', 'tindakan', 'tindak_lanjut']) expect(semua.bagian[b].verifikasi).toBe('sah');
    expect(semua.bagian.diagnosis.isi.item.map((i: any) => i.kode)).toEqual(['I10', 'E11.9']);
  });

  it('konteks klinis: alergi, diagnosis aktif, dan tanda vital terakhir', async () => {
    const r = await panggil('GET', `/kunjungan/${kunjA1}/konteks-klinis`, 'dokter');
    expect(r.status).toBe(200);
    expect(r.badan.data).toMatchObject({
      pasien: { id: pasienA, nama: 'Budi Santoso', umur_tahun: expect.any(Number) }, kunjungan: { id: kunjA1, tahap_layanan: 'pemeriksaan' }, alergi: 'Penisilin',
      diagnosis_aktif: [{ kode: 'I10' }, { kode: 'E11.9' }], tanda_vital_terakhir: { sistolik: 150, suhu: 36.7 },
    });
  });

  it('draf server: satu draf per pengguna, izin, lintas fasyankes 404, tanpa audit isi, dihapus saat selesai', async () => {
    const adr = `/kunjungan/${kunjA1}/draf/pemeriksaan-klinis`;
    expect((await panggil('GET', adr, null)).status).toBe(401);
    expect((await panggil('GET', adr, 'perekam')).status).toBe(403);
    expect((await panggil('PUT', adr, 'biasa', { langkah: 0, isi: {} })).status).toBe(403);
    expect((await panggil('GET', adr, 'lain')).status).toBe(404);
    expect((await panggil('PUT', `/kunjungan/${kunjLain}/draf/pemeriksaan-klinis`, 'dokter', { langkah: 0, isi: {} })).status).toBe(404);
    expect((await panggil('GET', `/kunjungan/${kunjA1}/draf/bukan-alur`, 'dokter')).status).toBe(404);
    expect((await panggil('GET', adr, 'dokter')).badan.data).toBeNull();
    expect((await panggil('PUT', adr, 'dokter', { langkah: 99, isi: {} })).status).toBe(400);
    expect((await panggil('PUT', adr, 'dokter', { langkah: 1, isi: 'teks' })).status).toBe(400);
    expect((await panggil('PUT', adr, 'dokter', { langkah: 1, isi: { besar: 'x'.repeat(90_000) } })).status).toBe(400);

    const rahasia = 'KELUHAN-RAHASIA-UJI';
    const a = await panggil('PUT', adr, 'dokter', { langkah: 2, isi: { anamnesis: { keluhan_utama: rahasia } } });
    expect(a.status).toBe(200);
    const b = await panggil('PUT', adr, 'dokter', { langkah: 3, isi: { anamnesis: { keluhan_utama: `${rahasia} 2` } } });
    expect(b.badan.data).toMatchObject({ alur: 'pemeriksaan-klinis', kunjungan_id: kunjA1, langkah: 3 });
    expect(await prisma.draf.count({ where: { pengguna_id: id.dokter, kunjungan_id: kunjA1 } })).toBe(1);
    expect(await prisma.draf.findFirstOrThrow({ where: { pengguna_id: id.dokter } })).toMatchObject({ fasyankes_id: fas, pasien_id: pasienA, alur: 'pemeriksaan-klinis' });
    // draf milik pengguna lain tidak terlihat
    expect((await panggil('GET', adr, 'dokter2')).badan.data).toBeNull();
    const milikDokter = await panggil('GET', adr, 'dokter');
    expect(milikDokter.badan.data).toMatchObject({ langkah: 3, isi: { anamnesis: { keluhan_utama: `${rahasia} 2` } } });
    // alur skrining terpisah
    expect((await panggil('GET', `/kunjungan/${kunjA1}/draf/skrining`, 'dokter')).badan.data).toBeNull();
    // isi draf tidak masuk audit
    const audit = await prisma.logAudit.findMany({ where: { fasyankes_id: fas } });
    expect(JSON.stringify(audit)).not.toContain(rahasia);
    // kedaluwarsa dibuang saat dibaca
    await prisma.draf.updateMany({ where: { pengguna_id: id.dokter }, data: { diperbarui_pada: new Date(Date.now() - 13 * 3_600_000) } });
    expect((await panggil('GET', adr, 'dokter')).badan.data).toBeNull();
    expect(await prisma.draf.count({ where: { pengguna_id: id.dokter } })).toBe(0);
    // hapus
    await panggil('PUT', adr, 'dokter', { langkah: 1, isi: { a: 1 } });
    expect((await panggil('DELETE', adr, 'dokter')).status).toBe(200);
    expect((await panggil('GET', adr, 'dokter')).badan.data).toBeNull();
    // dihapus saat pemeriksaan selesai (semua pengguna untuk kunjungan itu)
    await panggil('PUT', adr, 'dokter', { langkah: 1, isi: { a: 1 } });
    await panggil('PUT', adr, 'dokter2', { langkah: 1, isi: { a: 2 } });
  });

  it('selesaikan pemeriksaan: maju ke kasir, draf terhapus, lalu catatan baru ditolak', async () => {
    const r = await panggil('POST', `/kunjungan/${kunjA1}/klinis/selesai`, 'dokter', { tahap: 'kasir' });
    expect(r.status).toBe(200);
    expect(r.badan.data.tahap_layanan).toBe('kasir');
    expect(await prisma.draf.count({ where: { kunjungan_id: kunjA1 } })).toBe(0);
    expect((await panggil('PUT', `/kunjungan/${kunjA1}/draf/pemeriksaan-klinis`, 'dokter', { langkah: 1, isi: {} })).status).toBe(409);
    expect((await panggil('POST', `/kunjungan/${kunjA1}/klinis/selesai`, 'dokter', {})).status).toBe(409);
    expect((await panggil('PUT', klinis(kunjA1, 'pemeriksaan'), 'dokter', { isi: { catatan: 'Terlambat' } })).status).toBe(409);
  });

  it('riwayat dan salin dari kunjungan sebelumnya (draf, pasien sama saja)', async () => {
    await prisma.kunjungan.update({ where: { id: kunjA1 }, data: { tahap_layanan: 'ditutup' } });
    kunjA2 = await buatKunjungan(fas, pasienA);
    const kunjB = await buatKunjungan(fas, pasienB);
    const riwayat = await panggil('GET', `/pasien/${pasienA}/riwayat-kunjungan?kecuali=${kunjA2}`, 'dokter');
    expect(riwayat.badan.data).toHaveLength(1);
    expect(riwayat.badan.data[0]).toMatchObject({ id: kunjA1, keluhan_utama: 'Batuk 4 hari', tindak_lanjut: 'rujuk', diagnosis: [{ kode: 'I10', peran: 'utama' }, { kode: 'E11.9', peran: 'penyerta' }] });
    expect((await panggil('GET', `/pasien/${pasienA}/riwayat-kunjungan`, 'lain')).status).toBe(404);
    const salin = await panggil('GET', `/kunjungan/${kunjA2}/salinan/${kunjA1}`, 'dokter');
    expect(salin.status).toBe(200);
    expect(salin.badan.data).toMatchObject({ sumber: { id: kunjA1 }, anamnesis: { keluhan_utama: 'Batuk 4 hari' }, diagnosis: { item: [{ kode: 'I10' }, { kode: 'E11.9' }] }, tindakan: { item: [{ kode: '89.52' }] } });
    // hanya draf: tidak ada yang tersimpan di kunjungan tujuan
    expect(await prisma.anamnesis.count({ where: { kunjungan_id: kunjA2 } })).toBe(0);
    expect((await panggil('GET', `/kunjungan/${kunjB}/salinan/${kunjA1}`, 'dokter')).status).toBe(400);
    expect((await panggil('GET', `/kunjungan/${kunjA2}/salinan/${kunjA2}`, 'dokter')).status).toBe(400);
    expect((await panggil('GET', `/kunjungan/${kunjA2}/salinan/${kunjLain}`, 'dokter')).status).toBe(404);
  });

  it('pencarian terminologi: saran berurutan, dibatasi, tanpa kode nonaktif', async () => {
    const r = await panggil('GET', `/terminologi?sistem=icd10&q=${awalan}&batas=10`, 'dokter');
    expect(r.status).toBe(200);
    expect(r.badan.data.map((x: any) => x.kode)).toEqual([`${awalan}.1`, `${awalan}.2`, `${awalan}.3`]);
    expect((await panggil('GET', `/terminologi?sistem=icd10&q=${awalan}&batas=2`, 'dokter')).badan.data).toHaveLength(2);
    expect((await panggil('GET', `/terminologi?sistem=icd10&q=uji%20dua`, 'dokter')).badan.data.map((x: any) => x.kode)).toEqual([`${awalan}.2`]);
    expect((await panggil('GET', `/terminologi?sistem=icd10`, 'dokter')).status).toBe(400);
    expect((await panggil('GET', `/terminologi?sistem=icd10&q=a&batas=999`, 'dokter')).status).toBe(400);
    expect((await panggil('GET', `/terminologi?sistem=icd10&q=${awalan}`, 'biasa')).status).toBe(403);
  });

  it('favorit per dokter: tambah, ganda ditolak, urutan, terpisah antarpengguna, hapus; templat', async () => {
    const a = await panggil('POST', '/favorit', 'dokter', { jenis: 'diagnosis', kode: 'J06.9', nama: 'ISPA' });
    expect(a.status).toBe(201);
    const b = await panggil('POST', '/favorit', 'dokter', { jenis: 'diagnosis', kode: 'K29.7', nama: 'Gastritis' });
    expect(b.badan.data.urutan).toBe(1);
    expect((await panggil('POST', '/favorit', 'dokter', { jenis: 'diagnosis', kode: 'J06.9', nama: 'ISPA' })).status).toBe(409);
    expect((await panggil('PATCH', `/favorit/${b.badan.data.id}`, 'dokter', { urutan: 0 })).status).toBe(200);
    expect((await panggil('GET', '/favorit?jenis=diagnosis', 'dokter')).badan.data.map((f: any) => f.kode)).toEqual(['J06.9', 'K29.7']);
    expect((await panggil('GET', '/favorit', 'dokter2')).badan.data).toEqual([]);
    expect((await panggil('DELETE', `/favorit/${a.badan.data.id}`, 'dokter2')).status).toBe(404);
    expect((await panggil('DELETE', `/favorit/${a.badan.data.id}`, 'dokter')).status).toBe(200);
    expect((await panggil('GET', '/favorit', 'dokter')).badan.data).toHaveLength(1);
    expect((await panggil('POST', '/favorit', 'dokter', { jenis: 'bukan', kode: 'x', nama: 'y' })).status).toBe(400);

    const t = await panggil('POST', '/templat-catatan', 'dokter', { bagian: 'anamnesis', nama: 'Batuk pilek', isi: { keluhan_utama: 'Batuk dan pilek', penyerta: 'Demam' } });
    expect(t.status).toBe(201);
    expect((await panggil('GET', '/templat-catatan?bagian=anamnesis', 'dokter')).badan.data[0]).toMatchObject({ nama: 'Batuk pilek', isi: { keluhan_utama: 'Batuk dan pilek', penyerta: 'Demam' } });
    expect((await panggil('GET', '/templat-catatan', 'dokter2')).badan.data).toEqual([]);
    expect((await panggil('DELETE', `/templat-catatan/${t.badan.data.id}`, 'dokter')).status).toBe(200);
  });

  it('family folder: tautan anggota, penanda privasi menyembunyikan identitas, ganda dan diri sendiri ditolak', async () => {
    const t = await panggil('POST', `/pasien/${pasienA}/keluarga`, 'dokter', { anggota_pasien_id: pasienB, hubungan: 'Istri' });
    expect(t.status).toBe(201);
    expect(t.badan.data).toMatchObject({ hubungan: 'Istri', dibatasi: false, pasien: { id: pasienB, nama: 'Ani Santoso' } });
    expect((await panggil('POST', `/pasien/${pasienA}/keluarga`, 'dokter', { anggota_pasien_id: pasienB, hubungan: 'Istri' })).status).toBe(409);
    expect((await panggil('POST', `/pasien/${pasienA}/keluarga`, 'dokter', { anggota_pasien_id: pasienA, hubungan: 'Diri' })).status).toBe(400);
    expect((await panggil('POST', `/pasien/${pasienA}/keluarga`, 'dokter', { anggota_pasien_id: 999999999, hubungan: 'X' })).status).toBe(404);
    expect((await panggil('POST', `/pasien/${pasienA}/keluarga`, 'biasa', { anggota_pasien_id: pasienB, hubungan: 'Istri' })).status).toBe(403);
    const batasi = await panggil('PATCH', `/pasien/${pasienA}/keluarga/${t.badan.data.id}`, 'dokter', { dibatasi: true });
    expect(batasi.badan.data).toMatchObject({ dibatasi: true, pasien: null });
    const folder = await panggil('GET', `/pasien/${pasienA}/keluarga`, 'dokter');
    expect(folder.badan.data.anggota).toEqual([{ id: t.badan.data.id, hubungan: 'Istri', dibatasi: true, pasien: null }]);
    expect(JSON.stringify(folder.badan)).not.toContain('Ani Santoso');
    expect((await panggil('PATCH', `/pasien/${pasienA}/keluarga/${t.badan.data.id}`, 'dokter', {})).status).toBe(400);
    expect((await panggil('GET', `/pasien/${pasienA}/keluarga`, 'lain')).status).toBe(404);
  });

  it('audit mencatat input, perbaikan, dan lihat catatan klinis', async () => {
    const baris = await prisma.logAudit.findMany({ where: { fasyankes_id: fas, entitas: { in: ['anamnesis', 'tanda_vital', 'catatan_klinis', 'pengesahan_catatan', 'pasien', 'keluarga_pasien'] } } });
    const aksiUntuk = (entitas: string) => new Set(baris.filter((b) => b.entitas === entitas).map((b) => b.aksi));
    expect(aksiUntuk('anamnesis')).toEqual(new Set(['input', 'perbaikan']));
    expect(aksiUntuk('tanda_vital').has('input')).toBe(true);
    expect(aksiUntuk('catatan_klinis').has('lihat')).toBe(true);
    expect(aksiUntuk('pengesahan_catatan').has('lihat')).toBe(true);
    expect(aksiUntuk('keluarga_pasien')).toEqual(new Set(['input', 'perbaikan']));
    // pengubahan tahap tercatat sebagai perbaikan kunjungan
    expect(baris.length).toBeGreaterThan(0);
    expect(await prisma.logAudit.count({ where: { fasyankes_id: fas, entitas: 'kunjungan', aksi: 'perbaikan' } })).toBeGreaterThanOrEqual(2);
  });
});
