/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { AddressInfo } from 'net';
import { PrismaClient } from '@prisma/client';

const urlUji = process.env.DATABASE_URL_UJI;
const d = urlUji ? describe : describe.skip;

d('klaim JKN/BPJS terhadap klira_uji', () => {
  const prisma = new PrismaClient({ datasourceUrl: urlUji });
  const kode = `UJI-KLM-${Date.now()}`;
  let server: any;
  let fas = 0;
  let fasLain = 0;
  const id: Record<string, number> = {};
  const cookie: Record<string, string> = {};
  const url = (p: string) => `http://127.0.0.1:${(server.address() as AddressInfo).port}/api${p}`;
  const panggil = async (metode: string, p: string, siapa: string | null, badan?: unknown) => {
    const res = await fetch(url(p), { method: metode, headers: { 'content-type': 'application/json', ...(siapa ? { cookie: cookie[siapa] } : {}) }, body: badan === undefined ? undefined : JSON.stringify(badan) });
    return { status: res.status, badan: (await res.json().catch(() => null)) as any };
  };
  async function buatPengguna(kunci: string, nik: string, izin: [string, string][], fasId = fas) {
    const { hashKataSandi } = require('@klira/db');
    const u = await prisma.pengguna.create({ data: { fasyankes_id: fasId, nama: `Nama ${kunci}`, nik, username: `${kode}-${kunci}`, kata_sandi_hash: await hashKataSandi('sandi-uji-1'), wajib_ganti_kredensial: false } });
    id[kunci] = u.id;
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
  let nomor = 0;
  type Opsi = { jenis?: 'AMB' | 'IMP'; cara?: 'umum' | 'jkn'; tahap?: 'pemeriksaan' | 'ditutup'; fasId?: number; waktuTutup?: Date; kode?: [string, string][] };
  /** Kunjungan dengan diagnosis utama dokter; bawaan JKN rawat jalan yang sudah ditutup sekarang. */
  async function kunjunganBaru(o: Opsi = {}) {
    nomor += 1;
    const fasId = o.fasId ?? fas;
    const tahap = o.tahap ?? 'ditutup';
    const p = await prisma.pasien.create({ data: { fasyankes_id: fasId, nomor_rm: `${kode}-${nomor}`, nama: `Pasien ${nomor}`, tanggal_lahir: new Date('1980-01-01'), jenis_kelamin: 'perempuan' } });
    const k = await prisma.kunjungan.create({ data: { fasyankes_id: fasId, pasien_id: p.id, jenis: o.jenis ?? 'AMB', cara_pembayaran: o.cara ?? 'jkn', tahap_layanan: tahap, ...(tahap === 'ditutup' ? { waktu_tutup: o.waktuTutup ?? new Date() } : {}) } });
    await prisma.diagnosis.createMany({ data: (o.kode ?? [['I10', 'Hipertensi esensial']]).map(([kd, nama], i) => ({ fasyankes_id: fasId, kunjungan_id: k.id, versi: 1, kode_icd10: kd, nama, peran: (i === 0 ? 'utama' : 'penyerta') as 'utama', urutan: i + 1 })) });
    await prisma.pengesahanCatatan.create({ data: { fasyankes_id: fasId, entitas: 'diagnosis', entitas_id: k.id, versi: 1, pengguna_id: id.petugas, hash: 'a'.repeat(64) } });
    return k.id;
  }
  const BERKAS_RJ = ['fpk', 'rekapitulasi', 'kuitansi', 'surat_tanggung_jawab'];
  const KLAIM: [string, string][] = [['klaim', 'lihat'], ['klaim', 'input'], ['klaim', 'perbaikan']];
  const siapkan = (kunjungan_id: number, extra: Record<string, unknown> = {}, siapa = 'petugas') => panggil('POST', '/klaim', siapa, { kunjungan_id, ...extra });
  const ubah = (id: number, badan: Record<string, unknown>, siapa = 'petugas') => panggil('POST', `/klaim/${id}/status`, siapa, badan);

  beforeAll(async () => {
    process.env.DATABASE_URL = urlUji;
    fas = await buatFasyankes(kode, 'Uji Klaim');
    fasLain = await buatFasyankes(`${kode}-LAIN`, 'Uji Klaim Lain');
    const { buatApp } = require('../../app');
    server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
    await buatPengguna('petugas', '9963000000000001', KLAIM);
    await buatPengguna('lihatSaja', '9963000000000002', [['klaim', 'lihat']]);
    await buatPengguna('kasir', '9963000000000005', [['kasir', 'lihat']]);
    await buatPengguna('lainPetugas', '9963000000000007', KLAIM, fasLain);
    for (const k of ['petugas', 'lihatSaja', 'kasir', 'lainPetugas']) await login(k);
  });

  afterAll(async () => {
    server?.close();
    const where = { fasyankes_id: { in: [fas, fasLain] } };
    await prisma.logAudit.deleteMany({ where });
    await prisma.sesi.deleteMany({ where: { pengguna_id: { in: Object.values(id) } } });
    for (const m of [prisma.riwayatKlaim, prisma.klaim, prisma.resumeMedis, prisma.pengkodean, prisma.pengesahanCatatan, prisma.diagnosis, prisma.peringatanIzin, prisma.izinPerAkun] as any[]) await m.deleteMany({ where });
    await prisma.kunjungan.deleteMany({ where });
    await prisma.pasien.deleteMany({ where });
    await prisma.penugasanJenis.deleteMany({ where });
    await prisma.izinJenisAkun.deleteMany({ where });
    await prisma.jenisAkun.deleteMany({ where });
    await prisma.pengguna.deleteMany({ where });
    await prisma.fasyankes.deleteMany({ where: { id: { in: [fas, fasLain] } } });
    await prisma.$disconnect();
  });

  it('kandidat: hanya kunjungan JKN yang sudah ditutup dan belum diklaim; izin dibatasi', async () => {
    const jkn = await kunjunganBaru();
    const umum = await kunjunganBaru({ cara: 'umum' });
    const buka = await kunjunganBaru({ tahap: 'pemeriksaan' });
    const lain = await kunjunganBaru({ fasId: fasLain });
    const r = await panggil('GET', '/klaim/kandidat', 'petugas');
    const ids = r.badan.data.map((x: any) => x.kunjungan_id);
    expect(ids).toContain(jkn);
    for (const x of [umum, buka, lain]) expect(ids).not.toContain(x);
    expect((await panggil('GET', '/klaim/kandidat', 'kasir')).status).toBe(403);
    expect((await siapkan(jkn)).status).toBe(201);
    expect((await panggil('GET', '/klaim/kandidat', 'petugas')).badan.data.map((x: any) => x.kunjungan_id)).not.toContain(jkn);
  });

  it('siapkan: syarat kunjungan, kode disalin, batas 6 bulan, menunggu SEP sampai SEP dan berkas lengkap', async () => {
    const umum = await kunjunganBaru({ cara: 'umum' });
    const buka = await kunjunganBaru({ tahap: 'pemeriksaan' });
    expect((await siapkan(umum)).status).toBe(409);
    expect((await siapkan(buka)).status).toBe(409);
    expect((await siapkan(99999999)).status).toBe(404);
    expect((await siapkan(umum, {}, 'lihatSaja')).status).toBe(403);
    expect((await siapkan(umum, { berkas: ['salah'] })).status).toBe(400);
    const tutup = new Date('2026-08-10T05:00:00Z');
    const k = await kunjunganBaru({ waktuTutup: tutup, kode: [['I10', 'Hipertensi esensial'], ['E11.9', 'DM tipe 2']] });
    const a = await siapkan(k, { berkas: ['fpk'] });
    expect(a.status).toBe(201);
    expect(a.badan.data.status).toBe('menunggu_sep');
    expect(a.badan.data.batas_pengajuan).toBe('2027-02-10T16:59:59.999Z');
    expect(a.badan.data.diagnosis.map((x: any) => x.kode)).toEqual(['I10', 'E11.9']);
    expect(a.badan.data.berkas_kurang).toEqual(['rekapitulasi', 'kuitansi', 'surat_tanggung_jawab']);
    expect(a.badan.data.riwayat).toHaveLength(1);
    expect((await siapkan(k)).status).toBe(409);
    const lengkap = await kunjunganBaru();
    const b = await siapkan(lengkap, { nomor_sep: '0001R0010126V000001', berkas: BERKAS_RJ });
    expect(b.badan.data.status).toBe('siap_diajukan');
    expect(b.badan.data.nomor_sep).toBe('0001R0010126V000001');
  });

  it('ubah berkas: SEP dan berkas melengkapi klaim; tidak bisa setelah diajukan', async () => {
    const k = await kunjunganBaru();
    const id = (await siapkan(k)).badan.data.id;
    const u = (badan: Record<string, unknown>, siapa = 'petugas') => panggil('PUT', `/klaim/${id}/berkas`, siapa, badan);
    expect((await u({ nomor_sep: 'S1', berkas: BERKAS_RJ }, 'lihatSaja')).status).toBe(403);
    expect((await u({ nomor_sep: 'S1', berkas: BERKAS_RJ }, 'lainPetugas')).status).toBe(404);
    expect((await u({ nomor_sep: 'S1', berkas: BERKAS_RJ.slice(1) })).badan.data.status).toBe('menunggu_sep');
    const r = await u({ nomor_sep: 'S1', berkas: BERKAS_RJ, catatan: 'Lengkap' });
    expect(r.badan.data.status).toBe('siap_diajukan');
    expect(r.badan.data.riwayat.map((x: any) => x.ke)).toEqual(['menunggu_sep', 'siap_diajukan']);
    expect((await ubah(id, { aksi: 'ajukan' })).status).toBe(200);
    expect((await u({ nomor_sep: 'S2', berkas: BERKAS_RJ })).status).toBe(409);
  });

  it('siklus status: ajukan, dikembalikan, ajukan ulang, dibayar; pagar aksi dan isian wajib', async () => {
    const k = await kunjunganBaru();
    const id = (await siapkan(k, { nomor_sep: 'S3', berkas: BERKAS_RJ })).badan.data.id;
    expect((await ubah(id, { aksi: 'dibayar', jumlah_dibayar: 1000, dibayar_pada: '2026-10-25' })).status).toBe(409);
    expect((await ubah(id, { aksi: 'salah' })).status).toBe(400);
    expect((await ubah(id, { aksi: 'ajukan' }, 'lihatSaja')).status).toBe(403);
    expect((await ubah(id, { aksi: 'ajukan' })).badan.data.status).toBe('diajukan');
    expect((await ubah(id, { aksi: 'ajukan' })).status).toBe(409);
    expect((await ubah(id, { aksi: 'dikembalikan' })).status).toBe(400);
    const dik = await ubah(id, { aksi: 'dikembalikan', berita_acara: 'FPK tidak bertanda tangan' });
    expect(dik.badan.data.status).toBe('dikembalikan');
    expect(dik.badan.data.berita_acara).toBe('FPK tidak bertanda tangan');
    expect(dik.badan.data.batas_ajukan_ulang).not.toBeNull();
    expect(dik.badan.data.sisa_hari).toBeGreaterThan(0);
    expect((await ubah(id, { aksi: 'dibayar', jumlah_dibayar: 1000, dibayar_pada: '2026-10-25' })).status).toBe(409);
    expect((await ubah(id, { aksi: 'ajukan_ulang' })).badan.data.status).toBe('diajukan_ulang');
    expect((await ubah(id, { aksi: 'dibayar', jumlah_dibayar: 0, dibayar_pada: '2026-10-25' })).status).toBe(400);
    expect((await ubah(id, { aksi: 'dibayar', jumlah_dibayar: 150000 })).status).toBe(400);
    const bayar = await ubah(id, { aksi: 'dibayar', jumlah_dibayar: 150000, dibayar_pada: '2026-10-25' });
    expect(bayar.badan.data.status).toBe('dibayar');
    expect(bayar.badan.data.jumlah_dibayar).toBe(150000);
    expect((await ubah(id, { aksi: 'ditolak', alasan: 'x' })).status).toBe(409);
    expect(bayar.badan.data.riwayat.map((x: any) => x.ke)).toEqual(['siap_diajukan', 'diajukan', 'dikembalikan', 'diajukan_ulang', 'dibayar']);
    const tolak = await siapkan(await kunjunganBaru(), { nomor_sep: 'S4', berkas: BERKAS_RJ });
    await ubah(tolak.badan.data.id, { aksi: 'ajukan' });
    expect((await ubah(tolak.badan.data.id, { aksi: 'ditolak' })).status).toBe(400);
    expect((await ubah(tolak.badan.data.id, { aksi: 'ditolak', alasan: 'Peserta tidak aktif' })).badan.data.alasan).toBe('Peserta tidak aktif');
  });

  it('dua pembayaran serempak: hanya satu berhasil', async () => {
    const id = (await siapkan(await kunjunganBaru(), { nomor_sep: 'S5', berkas: BERKAS_RJ })).badan.data.id;
    await ubah(id, { aksi: 'ajukan' });
    const [a, b] = await Promise.all([ubah(id, { aksi: 'dibayar', jumlah_dibayar: 1000, dibayar_pada: '2026-10-25' }), ubah(id, { aksi: 'ditolak', alasan: 'x' })]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
    expect(await prisma.riwayatKlaim.count({ where: { klaim_id: id, dari: 'diajukan' } })).toBe(1);
  });

  it('lewat batas waktu: status efektif, filter, ringkasan; tidak bisa diajukan atau diubah', async () => {
    const id = (await siapkan(await kunjunganBaru(), { nomor_sep: 'S6', berkas: BERKAS_RJ })).badan.data.id;
    await prisma.klaim.update({ where: { id }, data: { batas_pengajuan: new Date(Date.now() - 86_400_000) } });
    const d = await panggil('GET', `/klaim/${id}`, 'petugas');
    expect(d.badan.data.status).toBe('lewat_batas_waktu');
    expect(d.badan.data.sisa_hari).toBeLessThan(0);
    expect((await ubah(id, { aksi: 'ajukan' })).status).toBe(409);
    expect((await panggil('PUT', `/klaim/${id}/berkas`, 'petugas', { nomor_sep: 'S7', berkas: BERKAS_RJ })).status).toBe(409);
    const l = await panggil('GET', '/klaim?status=lewat_batas_waktu', 'petugas');
    expect(l.badan.data.data.some((x: any) => x.id === id)).toBe(true);
    expect(l.badan.data.ringkasan.lewat_batas_waktu).toBeGreaterThanOrEqual(1);
    const siap = await panggil('GET', '/klaim?status=siap_diajukan', 'petugas');
    expect(siap.badan.data.data.some((x: any) => x.id === id)).toBe(false);
  });

  it('dikembalikan lewat batas ajukan ulang menjadi lewat batas waktu', async () => {
    const id = (await siapkan(await kunjunganBaru(), { nomor_sep: 'S8', berkas: BERKAS_RJ })).badan.data.id;
    await ubah(id, { aksi: 'ajukan' });
    await ubah(id, { aksi: 'dikembalikan', berita_acara: 'Kurang kuitansi' });
    await prisma.klaim.update({ where: { id }, data: { batas_ajukan_ulang: new Date(Date.now() - 1000) } });
    expect((await panggil('GET', `/klaim/${id}`, 'petugas')).badan.data.status).toBe('lewat_batas_waktu');
    expect((await ubah(id, { aksi: 'ajukan_ulang' })).status).toBe(409);
  });

  it('rawat inap: butuh SPRI, ringkasan RM, dan resume medis; kode berbeda dari rekam medis ditandai', async () => {
    const k = await kunjunganBaru({ jenis: 'IMP' });
    const semua = [...BERKAS_RJ, 'spri', 'ringkasan_rm'];
    const a = await siapkan(k, { nomor_sep: 'S9', berkas: semua });
    expect(a.badan.data.status).toBe('menunggu_sep');
    expect(a.badan.data.resume_ada).toBe(false);
    await prisma.resumeMedis.create({ data: { fasyankes_id: fas, kunjungan_id: k, isi: { ringkasan: 'r' } } });
    const b = await panggil('PUT', `/klaim/${a.badan.data.id}/berkas`, 'petugas', { nomor_sep: 'S9', berkas: semua });
    expect(b.badan.data.status).toBe('siap_diajukan');
    expect(b.badan.data.kode_beda).toBe(false);
    await prisma.pengkodean.create({ data: { fasyankes_id: fas, kunjungan_id: k, pengode_id: id.petugas, isi: { diagnosis: [{ kode: 'E11.9', nama: 'DM', peran: 'utama' }], tindakan: [] } } });
    expect((await panggil('GET', `/klaim/${a.badan.data.id}`, 'petugas')).badan.data.kode_beda).toBe(true);
    expect((await panggil('GET', `/klaim/${a.badan.data.id}`, 'lainPetugas')).status).toBe(404);
    expect(await prisma.logAudit.count({ where: { fasyankes_id: fas, entitas: 'klaim', aksi: 'lihat' } })).toBeGreaterThan(0);
  });
});
