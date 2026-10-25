/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { AddressInfo } from 'net';
import { PrismaClient } from '@prisma/client';

const urlUji = process.env.DATABASE_URL_UJI;
const d = urlUji ? describe : describe.skip;

d('mesin izin terhadap klira_uji', () => {
  const prisma = new PrismaClient({ datasourceUrl: urlUji });
  const kode = `UJI-IZIN-${Date.now()}`;
  let server: ReturnType<ReturnType<typeof require>['buatApp']['listen']> | any;
  let layananIzin: any;
  let fas = 0;
  const id: Record<string, number> = {};
  const cookie: Record<string, string> = {};
  const izinId: Record<string, number> = {};
  const hari = (n: number) => new Date(Date.now() + n * 86_400_000);
  const url = (p: string) => `http://127.0.0.1:${(server.address() as AddressInfo).port}/api${p}`;
  const panggil = async (metode: string, p: string, siapa: string | null, badan?: unknown) => {
    const res = await fetch(url(p), {
      method: metode,
      headers: { 'content-type': 'application/json', ...(siapa ? { cookie: cookie[siapa] } : {}) },
      body: badan === undefined ? undefined : JSON.stringify(badan),
    });
    return { status: res.status, badan: (await res.json().catch(() => null)) as any };
  };
  const audit = (aksi: string, pengguna_id: number) => prisma.logAudit.findMany({ where: { aksi, pengguna_id } });

  async function buatPengguna(kunci: string, nik: string) {
    const { hashKataSandi } = require('@klira/db');
    const u = await prisma.pengguna.create({
      data: { fasyankes_id: fas, nama: kunci, nik, username: `${kode}-${kunci}`, kata_sandi_hash: await hashKataSandi('sandi-uji-1'), wajib_ganti_kredensial: false },
    });
    id[kunci] = u.id;
  }
  async function masuk(kunci: string) {
    const res = await fetch(url('/masuk'), {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: `${kode}-${kunci}`, kata_sandi: 'sandi-uji-1' }),
    });
    expect(res.status).toBe(200);
    cookie[kunci] = res.headers.get('set-cookie')!.split(';')[0];
  }
  const jenisPaket = async (nama: string, izin: [string, string, string][], syarat?: string) => {
    const j = await prisma.jenisAkun.create({ data: { fasyankes_id: fas, nama: `${kode}-${nama}`, syarat_profesi: syarat } });
    await prisma.izinJenisAkun.createMany({ data: izin.map((i) => ({ fasyankes_id: fas, jenis_akun_id: j.id, izin_id: izinId[i.join('|')] })) });
    return j.id;
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = urlUji;
    const { IZIN_AWAL } = require('@klira/shared');
    for (const i of IZIN_AWAL) {
      const r = await prisma.izin.upsert({ where: { fitur_aksi_cakupan: i }, update: {}, create: i });
      izinId[`${i.fitur}|${i.aksi}|${i.cakupan}`] = r.id;
    }
    const f = await prisma.fasyankes.create({ data: { fasyankes_id: -3, nama: 'Uji Izin', jenis: 'klinik_pratama_rawat_jalan', kode_registrasi: kode } });
    fas = f.id;
    await prisma.fasyankes.update({ where: { id: fas }, data: { fasyankes_id: fas } });
    for (const [k, n] of [['pimpinan', '9910000000000001'], ['perawat', '9910000000000002'], ['auditor', '9910000000000003'], ['dokter', '9910000000000004']]) {
      await buatPengguna(k, n);
    }
    await prisma.profilProfesi.create({ data: { fasyankes_id: fas, pengguna_id: id.perawat, profesi: 'Perawat', nomor_sip: null } });
    await prisma.profilProfesi.create({
      data: { fasyankes_id: fas, pengguna_id: id.dokter, profesi: 'Dokter umum', nomor_sip: 'SIP-UJI', masa_berlaku_sip: hari(30) },
    });
    const semuaAkses = (['lihat', 'input', 'perbaikan'] as const).flatMap((a) => (['unit', 'layanan'] as const).map((c) => ['akses', a, c] as [string, string, string]));
    const jPimpinan = await jenisPaket('Pimpinan', semuaAkses);
    const jAuditor = await jenisPaket('Auditor', [['audit', 'lihat', 'unit']]);
    const jPerawat = await jenisPaket('Perawat', [['klinis', 'input', 'unit']], 'nakes ber-SIP');
    for (const [u, j] of [['pimpinan', jPimpinan], ['auditor', jAuditor], ['perawat', jPerawat]] as const) {
      await prisma.penugasanJenis.create({ data: { fasyankes_id: fas, pengguna_id: id[u], jenis_akun_id: j, mulai: hari(-10) } });
    }
    id.jPimpinan = jPimpinan;
    id.jPerawat = jPerawat;
    const { buatApp } = require('../../app');
    const { buatLayananIzin } = require('./layanan-izin');
    const { RepositoriIzinPrisma } = require('./repositori-izin');
    const { PenampungAuditPrisma } = require('../../middleware/audit');
    layananIzin = buatLayananIzin({ repo: new RepositoriIzinPrisma(), audit: new PenampungAuditPrisma() });
    server = buatApp('/tidak-ada', { layananIzin, baseUrl: 'https://klira.contoh' }).listen(0);
    for (const k of ['pimpinan', 'perawat', 'auditor']) await masuk(k);
  });

  afterAll(async () => {
    server?.close();
    const where = { fasyankes_id: fas };
    const ids = Object.values(id);
    await prisma.logAudit.deleteMany({ where });
    await prisma.sesi.deleteMany({ where: { pengguna_id: { in: ids } } });
    await prisma.peringatanIzin.deleteMany({ where });
    await prisma.izinPerAkun.deleteMany({ where });
    await prisma.penugasanJenis.deleteMany({ where });
    await prisma.izinJenisAkun.deleteMany({ where });
    await prisma.riwayatJenisAkun.deleteMany({ where });
    await prisma.jenisAkun.deleteMany({ where });
    await prisma.profilProfesi.deleteMany({ where });
    await prisma.pengguna.deleteMany({ where });
    await prisma.fasyankes.deleteMany({ where: { id: fas } });
    await prisma.$disconnect();
    await require('@klira/db').prisma.$disconnect();
  });

  it('/api/saya memakai akses efektif (fitur dan halaman awal)', async () => {
    const s = await panggil('GET', '/saya', 'perawat');
    expect(s.badan.data.fitur).toEqual(['klinis']);
    expect(s.badan.data.halaman_awal).toBe('/pasien');
    expect(s.badan.data.izin).toEqual([{ fitur: 'klinis', aksi: 'input', cakupan: 'unit' }]);
    const a = await panggil('GET', '/saya', 'auditor');
    expect(a.badan.data.halaman_awal).toBe('/beranda');
  });

  it('tanpa sesi 401; tanpa izin 403 dan tercatat di audit penolakan', async () => {
    expect((await panggil('GET', '/jenis-akun', null)).status).toBe(401);
    const r = await panggil('GET', '/jenis-akun', 'perawat');
    expect(r.status).toBe(403);
    expect(r.badan.galat.kode).toBe('tidak_berizin');
    expect((await panggil('POST', '/jenis-akun', 'perawat', { nama: 'x', izin_ids: [] })).status).toBe(403);
    expect((await panggil('GET', `/pengguna/${id.pimpinan}/akses-efektif`, 'auditor')).status).toBe(403);
    expect((await audit('izin_ditolak', id.perawat)).length).toBeGreaterThanOrEqual(2);
    expect((await audit('izin_ditolak', id.auditor)).length).toBe(1);
  });

  it('CRUD jenis akun dengan riwayat, tanpa hapus permanen', async () => {
    const buat = await panggil('POST', '/jenis-akun', 'pimpinan', { nama: `${kode}-Kasir`, izin_ids: [izinId['kasir|input|unit']] });
    expect(buat.status).toBe(201);
    const jid = buat.badan.data.id;
    expect((await panggil('POST', '/jenis-akun', 'pimpinan', { nama: `${kode}-Kasir`, izin_ids: [] })).status).toBe(409);
    expect((await panggil('POST', '/jenis-akun', 'pimpinan', { nama: 'zzz', izin_ids: [99999999] })).status).toBe(400);
    expect((await panggil('PATCH', `/jenis-akun/${jid}`, 'pimpinan', { nama: 'tanpa alasan' })).status).toBe(400);
    const ubah = await panggil('PATCH', `/jenis-akun/${jid}`, 'pimpinan', {
      izin_ids: [izinId['kasir|input|unit'], izinId['klaim|lihat|unit']], alasan_perubahan: 'Tambah klaim',
    });
    expect(ubah.status).toBe(200);
    expect(ubah.badan.data.izin).toHaveLength(2);
    const non = await panggil('PATCH', `/jenis-akun/${jid}`, 'pimpinan', { aktif: false, alasan_perubahan: 'Tidak dipakai' });
    expect(non.badan.data.aktif).toBe(false);
    const riwayat = await panggil('GET', `/jenis-akun/${jid}/riwayat`, 'pimpinan');
    expect(riwayat.badan.data).toHaveLength(3);
    expect(riwayat.badan.data[0].ringkasan).toContain('dinonaktifkan');
    expect(riwayat.badan.data[1].ringkasan).toContain('izin ditambah: klaim|lihat|unit');
    expect((await panggil('DELETE', `/jenis-akun/${jid}`, 'pimpinan')).status).toBe(404);
    expect(await prisma.jenisAkun.count({ where: { id: jid } })).toBe(1);
    expect((await panggil('GET', '/jenis-akun/99999999', 'pimpinan')).status).toBe(404);
    expect((await audit('perbaikan', id.pimpinan)).length).toBeGreaterThanOrEqual(2);
    expect((await panggil('GET', '/izin', 'pimpinan')).badan.data.length).toBeGreaterThan(50);
  });

  it('jenis akun nonaktif tidak memberi akses', async () => {
    const jid = await jenisPaket('Sementara', [['pdp', 'lihat', 'unit']]);
    const p = await panggil('POST', `/pengguna/${id.auditor}/penugasan`, 'pimpinan', { jenis_akun_id: jid, mulai: '2026-01-01' });
    expect(p.status).toBe(201);
    let e = await panggil('GET', `/pengguna/${id.auditor}/akses-efektif`, 'pimpinan');
    expect(e.badan.data.fitur.sort()).toEqual(['audit', 'pdp']);
    await panggil('PATCH', `/jenis-akun/${jid}`, 'pimpinan', { aktif: false, alasan_perubahan: 'Nonaktif' });
    e = await panggil('GET', `/pengguna/${id.auditor}/akses-efektif`, 'pimpinan');
    expect(e.badan.data.fitur).toEqual(['audit']);
  });

  it('penugasan berisiko: perlu alasan, terima untuk akun, peringatan berikutnya tidak menghalangi', async () => {
    const jResep = await jenisPaket('PerawatResep', [['resep', 'input', 'unit']], 'nakes ber-SIP');
    const tanpa = await panggil('POST', `/pengguna/${id.perawat}/penugasan`, 'pimpinan', { jenis_akun_id: jResep, mulai: '2026-01-01' });
    expect(tanpa.status).toBe(409);
    expect(tanpa.badan.galat.kode).toBe('perlu_konfirmasi_peringatan');
    expect(tanpa.badan.galat.peringatan.map((w: any) => w.jenis)).toContain('izin_klinis_non_dokter');
    expect(await prisma.penugasanJenis.count({ where: { pengguna_id: id.perawat, jenis_akun_id: jResep } })).toBe(0);
    // alasan wajib
    const kosong = await panggil('POST', `/pengguna/${id.perawat}/penugasan`, 'pimpinan', {
      jenis_akun_id: jResep, mulai: '2026-01-01', konfirmasi_peringatan: { alasan: '  ' },
    });
    expect(kosong.status).toBe(400);
    const ok = await panggil('POST', `/pengguna/${id.perawat}/penugasan`, 'pimpinan', {
      jenis_akun_id: jResep, mulai: '2026-01-01', konfirmasi_peringatan: { alasan: 'Menunggu dokter', terima_untuk_akun: true },
    });
    expect(ok.status).toBe(201);
    const jenisSimpan = ok.badan.data.peringatan.map((w: any) => w.jenis_peringatan);
    // nakes_tanpa_sip sudah ada sebelum penugasan ini (izin klinis lama), jadi bukan peringatan baru.
    expect(jenisSimpan).toEqual(['izin_klinis_non_dokter']);
    // jenis peringatan yang sama untuk akun yang sudah menerima: tidak menghalangi, tercatat dengan alasan lama
    const lagi = await panggil('POST', `/pengguna/${id.perawat}/izin-akun`, 'pimpinan', {
      izin_id: izinId['farmasi|input|unit'], tipe: 'tambah', alasan: 'Bantu apotek', mulai: '2026-01-01',
    });
    expect(lagi.status).toBe(201);
    const rec = lagi.badan.data.peringatan.find((w: any) => w.jenis_peringatan === 'izin_klinis_non_dokter');
    expect(rec).toMatchObject({ alasan_pimpinan: 'Menunggu dokter', diterima_untuk_akun: true, sumber: 'pemberian' });
    expect((await audit('peringatan_izin', id.pimpinan)).length).toBeGreaterThanOrEqual(2);
  });

  it('akses efektif dengan tambahan dan pengurangan per akun, lalu diakhiri', async () => {
    let e = await panggil('GET', `/pengguna/${id.perawat}/akses-efektif`, 'pimpinan');
    expect(e.badan.data.fitur.sort()).toEqual(['farmasi', 'klinis', 'resep']);
    const kurang = await panggil('POST', `/pengguna/${id.perawat}/izin-akun`, 'pimpinan', {
      izin_id: izinId['klinis|input|unit'], tipe: 'kurang', alasan: 'Cuti', mulai: '2026-01-01',
    });
    expect(kurang.status).toBe(201);
    e = await panggil('GET', `/pengguna/${id.perawat}/akses-efektif`, 'pimpinan');
    expect(e.badan.data.fitur.sort()).toEqual(['farmasi', 'resep']);
    expect((await panggil('GET', '/saya', 'perawat')).badan.data.fitur.sort()).toEqual(['farmasi', 'resep']);
    const akhir = await panggil('PATCH', `/pengguna/${id.perawat}/izin-akun/${kurang.badan.data.izin_akun.id}`, 'pimpinan', { selesai: '2026-01-02' });
    expect(akhir.status).toBe(200);
    e = await panggil('GET', `/pengguna/${id.perawat}/akses-efektif`, 'pimpinan');
    expect(e.badan.data.fitur).toContain('klinis');
    expect((await panggil('GET', '/pengguna/99999999/akses-efektif', 'pimpinan')).status).toBe(404);
    expect((await panggil('POST', `/pengguna/${id.perawat}/izin-akun`, 'pimpinan', { izin_id: 1, tipe: 'tambah', alasan: '', mulai: '2026-01-01' })).status).toBe(400);
    const sebelumMulai = await panggil('POST', `/pengguna/${id.perawat}/izin-akun`, 'pimpinan', {
      izin_id: izinId['kasir|lihat|unit'], tipe: 'tambah', alasan: 'x', mulai: '2026-05-02', selesai: '2026-05-01',
    });
    expect(sebelumMulai.status).toBe(400);
  });

  it('penugasan melewati masa berlaku SIP dan admin IT diberi lihat rekam medis', async () => {
    const jDok = await jenisPaket('DokterT', [['klinis', 'input', 'unit']], 'dokter ber-SIP');
    const r = await panggil('POST', `/pengguna/${id.dokter}/penugasan`, 'pimpinan', { jenis_akun_id: jDok, mulai: '2026-01-01' });
    expect(r.status).toBe(409);
    expect(r.badan.galat.peringatan.map((w: any) => w.jenis)).toEqual(['penugasan_lewat_sip']);
    const dalam = await panggil('POST', `/pengguna/${id.dokter}/penugasan`, 'pimpinan', {
      jenis_akun_id: jDok, mulai: '2026-01-01', selesai: hari(10).toISOString(),
    });
    expect(dalam.status).toBe(201);
    expect(dalam.badan.data.peringatan).toEqual([]);
    const lewat = await panggil('POST', `/pengguna/${id.dokter}/penugasan`, 'pimpinan', {
      jenis_akun_id: jDok, mulai: '2026-01-01', konfirmasi_peringatan: { alasan: 'SIP diperpanjang' },
    });
    expect(lewat.status).toBe(201);
    expect(lewat.badan.data.peringatan[0]).toMatchObject({ jenis_peringatan: 'penugasan_lewat_sip', penugasan_id: lewat.badan.data.penugasan.id });
    const jIt = await jenisPaket('Admin IT fasyankes T', [['satusehat', 'lihat', 'unit']]);
    await panggil('POST', `/pengguna/${id.auditor}/penugasan`, 'pimpinan', { jenis_akun_id: jIt, mulai: '2026-01-01' });
    const rm = await panggil('POST', `/pengguna/${id.auditor}/izin-akun`, 'pimpinan', {
      izin_id: izinId['rekam-medis|lihat|unit'], tipe: 'tambah', alasan: 'Audit teknis', mulai: '2026-01-01',
    });
    expect(rm.status).toBe(409);
    expect(rm.badan.galat.peringatan.map((w: any) => w.jenis)).toContain('admin_lihat_rekam_medis');
    expect(rm.badan.galat.pesan).toBeTruthy();
  });

  it('peringatan saat tindakan: tercatat, tidak memblokir, tidak berulang dalam sehari; pembuat=penyetuju tiap kali', async () => {
    const pelaku = { id: id.perawat, fasyankes_id: fas, izin: [] };
    const a = await layananIzin.catatTindakan(pelaku, 'resep');
    expect(a.map((r: any) => r.jenis_peringatan).sort()).toEqual(['izin_klinis_non_dokter', 'nakes_tanpa_sip']);
    expect(a.find((r: any) => r.jenis_peringatan === 'izin_klinis_non_dokter')).toMatchObject({ sumber: 'tindakan', diterima_untuk_akun: true, alasan_pimpinan: 'Menunggu dokter' });
    expect(await layananIzin.catatTindakan(pelaku, 'resep')).toEqual([]);
    const k = { pembuat_id: id.perawat, penyetuju_id: id.perawat };
    const b1 = await layananIzin.catatTindakan(pelaku, 'klinis', k);
    const b2 = await layananIzin.catatTindakan(pelaku, 'klinis', k);
    expect(b1.map((r: any) => r.jenis_peringatan)).toContain('perbaikan_pembuat_penyetuju_sama');
    expect(b2.map((r: any) => r.jenis_peringatan)).toContain('perbaikan_pembuat_penyetuju_sama');
    expect((await audit('peringatan_izin', id.perawat)).length).toBeGreaterThanOrEqual(3);
  });

  it('daftar peringatan untuk pimpinan dan auditor; terima untuk akun lewat endpoint; perawat ditolak', async () => {
    const p = await panggil('GET', `/peringatan-izin?pengguna_id=${id.perawat}`, 'pimpinan');
    expect(p.status).toBe(200);
    expect(p.badan.total).toBeGreaterThanOrEqual(3);
    expect(p.badan.data.every((r: any) => r.pengguna_id === id.perawat)).toBe(true);
    const aud = await panggil('GET', '/peringatan-izin?jenis_peringatan=nakes_tanpa_sip', 'auditor');
    expect(aud.status).toBe(200);
    expect(aud.badan.data.length).toBeGreaterThan(0);
    expect((await panggil('GET', '/peringatan-izin', 'perawat')).status).toBe(403);
    expect((await panggil('GET', '/peringatan-izin?jenis_peringatan=bukan', 'pimpinan')).status).toBe(400);
    const terima = await panggil('POST', '/peringatan-izin/terima', 'pimpinan', {
      pengguna_id: id.dokter, jenis_peringatan: 'penugasan_lewat_sip', alasan: 'Perpanjangan berjalan',
    });
    expect(terima.status).toBe(201);
    expect(terima.badan.data).toMatchObject({ diterima_untuk_akun: true, sumber: 'terima' });
    expect((await panggil('POST', '/peringatan-izin/terima', 'auditor', { pengguna_id: id.dokter, jenis_peringatan: 'penugasan_lewat_sip', alasan: 'x' })).status).toBe(403);
  });

  it('periode penugasan dapat diakhiri; akses hilang setelah selesai', async () => {
    const daftar = await panggil('GET', `/pengguna/${id.perawat}/penugasan`, 'pimpinan');
    const aktif = daftar.badan.data.find((x: any) => x.jenis_akun_id === id.jPerawat);
    const akhir = await panggil('PATCH', `/pengguna/${id.perawat}/penugasan/${aktif.id}`, 'pimpinan', { selesai: hari(-1).toISOString() });
    expect(akhir.status).toBe(200);
    expect((await panggil('PATCH', `/pengguna/${id.perawat}/penugasan/${aktif.id}`, 'pimpinan', { selesai: '2020-01-01' })).status).toBe(400);
    const e = await panggil('GET', `/pengguna/${id.perawat}/akses-efektif`, 'pimpinan');
    expect(e.badan.data.jenis_akun).not.toContain(`${kode}-Perawat`);
  });
});
