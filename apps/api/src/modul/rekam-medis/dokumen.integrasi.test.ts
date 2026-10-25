/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { AddressInfo } from 'net';
import { PrismaClient } from '@prisma/client';

const urlUji = process.env.DATABASE_URL_UJI;
const d = urlUji ? describe : describe.skip;

d('rekam medis (resume, surat, pembukaan, penyampaian, laporan) terhadap klira_uji', () => {
  const prisma = new PrismaClient({ datasourceUrl: urlUji });
  const kode = `UJI-DOK-${Date.now()}`;
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
  const kunjunganBaru = async (tahap: 'pemeriksaan' | 'ditutup' = 'pemeriksaan', fasId = fas, waktuTutup: Date | null = null) => {
    nomor += 1;
    const p = await prisma.pasien.create({ data: { fasyankes_id: fasId, nomor_rm: `${kode}-${nomor}`, nama: `Pasien ${nomor}`, tanggal_lahir: new Date('1980-01-01'), jenis_kelamin: 'perempuan' } });
    return (await prisma.kunjungan.create({ data: { fasyankes_id: fasId, pasien_id: p.id, jenis: 'AMB', tahap_layanan: tahap, ...(waktuTutup ? { waktu_tutup: waktuTutup } : {}) } })).id;
  };
  async function kunjunganTutup(tahap: 'pemeriksaan' | 'ditutup' = 'ditutup', fasId = fas, lokasiId: number | null = null) {
    const k = await kunjunganBaru(tahap, fasId, tahap === 'ditutup' ? new Date() : null);
    if (lokasiId) await prisma.kunjungan.update({ where: { id: k }, data: { lokasi_id: lokasiId } });
    return k;
  }
  const DOKTER: [string, string][] = [['klinis', 'lihat'], ['klinis', 'input'], ['pasien', 'lihat']];
  const PEREKAM: [string, string][] = [['rekam-medis', 'lihat'], ['rekam-medis', 'input'], ['rekam-medis', 'perbaikan'], ['pasien', 'lihat']];
  const resume = { ringkasan: 'Pasien datang dengan pusing, tekanan darah tinggi, diberi obat.', diagnosis_akhir: 'I10 Hipertensi esensial', terapi: 'Amlodipin 5 mg', kondisi_pulang: 'Membaik', anjuran: 'Kontrol 1 minggu' };

  beforeAll(async () => {
    process.env.DATABASE_URL = urlUji;
    fas = await buatFasyankes(kode, 'Uji Dokumen RM');
    fasLain = await buatFasyankes(`${kode}-LAIN`, 'Uji Dokumen Lain');
    const { buatApp } = require('../../app');
    server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
    await buatPengguna('dokter', '9961000000000001', DOKTER);
    await buatPengguna('perekam', '9961000000000003', PEREKAM);
    await buatPengguna('perekam2', '9961000000000004', PEREKAM);
    await buatPengguna('kasir', '9961000000000005', [['kasir', 'lihat']]);
    await buatPengguna('lainDokter', '9961000000000007', DOKTER, fasLain);
    for (const k of ['dokter', 'perekam', 'perekam2', 'kasir', 'lainDokter']) await login(k);
  });

  afterAll(async () => {
    server?.close();
    const where = { fasyankes_id: { in: [fas, fasLain] } };
    await prisma.logAudit.deleteMany({ where });
    await prisma.sesi.deleteMany({ where: { pengguna_id: { in: Object.values(id) } } });
    for (const m of [prisma.resumeMedis, prisma.surat, prisma.pembukaanRm, prisma.penyampaianRm, prisma.pengkodean, prisma.versiCatatan, prisma.pengesahanCatatan, prisma.peringatanIzin, prisma.izinPerAkun] as any[]) await m.deleteMany({ where });
    await (prisma.diagnosis as any).deleteMany({ where });
    await prisma.antrean.deleteMany({ where });
    await prisma.kunjungan.deleteMany({ where });
    await prisma.lokasi.deleteMany({ where });
    await prisma.pasien.deleteMany({ where });
    await prisma.penugasanJenis.deleteMany({ where });
    await prisma.izinJenisAkun.deleteMany({ where });
    await prisma.jenisAkun.deleteMany({ where });
    await prisma.pengguna.deleteMany({ where });
    await prisma.fasyankes.deleteMany({ where: { id: { in: [fas, fasLain] } } });
    await prisma.$disconnect();
  });

  it('resume: hanya setelah tutup, ubah butuh alasan, versi lama tersimpan, izin dan fasyankes dibatasi', async () => {
    const buka = await kunjunganTutup('pemeriksaan');
    expect((await panggil('PUT', `/kunjungan/${buka}/resume`, 'dokter', resume)).status).toBe(409);
    const k = await kunjunganTutup();
    expect((await panggil('PUT', `/kunjungan/${k}/resume`, 'kasir', resume)).status).toBe(403);
    expect((await panggil('PUT', `/kunjungan/${k}/resume`, 'lainDokter', resume)).status).toBe(404);
    expect((await panggil('PUT', `/kunjungan/${k}/resume`, 'dokter', { ...resume, ringkasan: '' })).status).toBe(400);
    const a = await panggil('PUT', `/kunjungan/${k}/resume`, 'dokter', resume);
    expect(a.status).toBe(200);
    expect(a.badan.data.resume.versi).toBe(1);
    expect(a.badan.data.resume.verifikasi).toBe('sah');
    expect((await panggil('PUT', `/kunjungan/${k}/resume`, 'dokter', { ...resume, anjuran: 'Kontrol 2 minggu' })).status).toBe(400);
    const b = await panggil('PUT', `/kunjungan/${k}/resume`, 'dokter', { ...resume, anjuran: 'Kontrol 2 minggu', alasan: 'Koreksi jadwal' });
    expect(b.status).toBe(200);
    expect(b.badan.data.resume.versi).toBe(2);
    expect(await prisma.versiCatatan.count({ where: { entitas: 'resume_medis', entitas_id: k } })).toBe(1);
    expect((await panggil('GET', `/kunjungan/${k}/dokumen`, 'lainDokter')).status).toBe(404);
  });

  it('surat: nomor berurutan, rujukan butuh tujuan', async () => {
    const k = await kunjunganTutup();
    expect((await panggil('POST', `/kunjungan/${k}/surat`, 'dokter', { jenis: 'rujukan', isi: 'Mohon tindak lanjut' })).status).toBe(400);
    const s1 = await panggil('POST', `/kunjungan/${k}/surat`, 'dokter', { jenis: 'rujukan', tujuan: 'RSUD Kota', isi: 'Mohon tindak lanjut' });
    const s2 = await panggil('POST', `/kunjungan/${k}/surat`, 'dokter', { jenis: 'keterangan_sakit', isi: 'Istirahat 2 hari' });
    expect(s1.status).toBe(201);
    expect(s1.badan.data.nomor_surat).toMatch(/^S-\d{8}-\d{3}$/);
    expect(s2.badan.data.nomor_surat).not.toBe(s1.badan.data.nomor_surat);
    const d = await panggil('GET', `/kunjungan/${k}/dokumen`, 'dokter');
    expect(d.badan.data.surat).toHaveLength(2);
    expect(d.badan.data.saran).toBeDefined();
  });

  it('pembukaan: dasar hukum butuh alasan, penyetuju bukan pemohon, keputusan sekali', async () => {
    const k = await kunjunganTutup();
    const pasienId = (await prisma.kunjungan.findUniqueOrThrow({ where: { id: k } })).pasien_id;
    const dasar = { pasien_id: pasienId, pemohon_nama: 'Penyidik A', pemohon_instansi: 'Polres', dasar: 'hukum', dasar_rinci: 'Surat perintah 12/2026', cakupan: 'Resume kunjungan terakhir' };
    expect((await panggil('POST', '/rekam-medis/pembukaan', 'perekam', dasar)).status).toBe(400);
    expect((await panggil('POST', '/rekam-medis/pembukaan', 'kasir', { ...dasar, alasan_hukum: 'penegakan_hukum' })).status).toBe(403);
    const a = await panggil('POST', '/rekam-medis/pembukaan', 'perekam', { ...dasar, alasan_hukum: 'penegakan_hukum' });
    expect(a.status).toBe(201);
    const idP = a.badan.data.id;
    expect((await panggil('POST', `/rekam-medis/pembukaan/${idP}/keputusan`, 'perekam', { keputusan: 'setujui' })).status).toBe(409);
    expect((await panggil('POST', `/rekam-medis/pembukaan/${idP}/keputusan`, 'perekam2', { keputusan: 'tolak' })).status).toBe(400);
    const s = await panggil('POST', `/rekam-medis/pembukaan/${idP}/keputusan`, 'perekam2', { keputusan: 'setujui', catatan: 'Sesuai surat' });
    expect(s.status).toBe(200);
    expect(s.badan.data.status).toBe('disetujui');
    expect(s.badan.data.identitas_disamarkan).toBe(true);
    expect((await panggil('POST', `/rekam-medis/pembukaan/${idP}/keputusan`, 'perekam2', { keputusan: 'tolak', catatan: 'x' })).status).toBe(409);
    const l = await panggil('GET', '/rekam-medis/pembukaan?status=disetujui', 'perekam');
    expect(l.badan.data.data.some((x: any) => x.id === idP)).toBe(true);
    expect((await panggil('GET', '/rekam-medis/pembukaan', 'lainDokter')).status).toBe(403);
  });

  it('penyampaian: keluarga dan pihak lain butuh bukti persetujuan, tercatat di audit', async () => {
    const k = await kunjunganTutup();
    const pasienId = (await prisma.kunjungan.findUniqueOrThrow({ where: { id: k } })).pasien_id;
    const dasar = { pasien_id: pasienId, kunjungan_id: k, penerima_nama: 'Ibu Budi', hubungan: 'keluarga', bentuk: 'cetak' };
    expect((await panggil('POST', '/rekam-medis/penyampaian', 'perekam', dasar)).status).toBe(400);
    expect((await panggil('POST', '/rekam-medis/penyampaian', 'perekam', { ...dasar, bukti_persetujuan: 'Surat kuasa 3/2026' })).status).toBe(201);
    expect((await panggil('POST', '/rekam-medis/penyampaian', 'perekam', { ...dasar, hubungan: 'pasien', penerima_nama: 'Pasien' })).status).toBe(201);
    expect((await panggil('POST', '/rekam-medis/penyampaian', 'perekam', { ...dasar, bukti_persetujuan: 'Surat kuasa', pasien_id: 999999999 })).status).toBe(404);
    const l = await panggil('GET', `/rekam-medis/penyampaian?cari=${encodeURIComponent('Ibu Budi')}`, 'perekam');
    expect(l.badan.data.total).toBe(1);
    expect(await prisma.logAudit.count({ where: { fasyankes_id: fas, entitas: 'penyampaian_rm' } })).toBe(2);
  });

  it('laporan: per poli, diagnosis terbanyak, status pengkodean, CSV, rentang terbalik ditolak', async () => {
    const poli = await prisma.lokasi.create({ data: { fasyankes_id: fas, nama: 'Poli Umum', jenis: 'poli' as any } });
    const k1 = await kunjunganTutup('ditutup', fas, poli.id);
    const k2 = await kunjunganTutup('ditutup', fas, poli.id);
    await prisma.diagnosis.createMany({ data: [k1, k2].map((kunjungan_id) => ({ fasyankes_id: fas, kunjungan_id, versi: 1, kode_icd10: 'I10', nama: 'Hipertensi esensial', peran: 'utama' as const, urutan: 1 })) });
    const poliLap = await panggil('GET', '/rekam-medis/laporan?jenis=kunjungan_per_poli', 'perekam');
    expect(poliLap.status).toBe(200);
    expect(poliLap.badan.data.baris.find((b: any) => b[0] === 'Poli Umum')[1]).toBe(2);
    const diag = await panggil('GET', '/rekam-medis/laporan?jenis=diagnosis_terbanyak', 'perekam');
    expect(diag.badan.data.baris[0]).toEqual(['I10', 'Hipertensi esensial', 2]);
    const kod = await panggil('GET', '/rekam-medis/laporan?jenis=status_pengkodean', 'perekam');
    expect(kod.badan.data.total).toBeGreaterThanOrEqual(2);
    const csv = await fetch(url('/rekam-medis/laporan?jenis=kunjungan_per_poli&format=csv'), { headers: { cookie: cookie.perekam } });
    expect(csv.headers.get('content-type')).toContain('text/csv');
    expect((await csv.text()).split('\n')[0]).toBe('Poli,Kunjungan');
    expect((await panggil('GET', '/rekam-medis/laporan?jenis=kunjungan_per_poli&dari=2026-02-01&sampai=2026-01-01', 'perekam')).status).toBe(400);
    expect((await panggil('GET', '/rekam-medis/laporan?jenis=kunjungan_per_poli', 'kasir')).status).toBe(403);
  });
});
