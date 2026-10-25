/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { AddressInfo } from 'net';
import { PrismaClient } from '@prisma/client';

const urlUji = process.env.DATABASE_URL_UJI;
const d = urlUji ? describe : describe.skip;

d('rekam medis (perbaikan, pengkodean, arsip, berkas) terhadap klira_uji', () => {
  const prisma = new PrismaClient({ datasourceUrl: urlUji });
  const kode = `UJI-RM-${Date.now()}`;
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
  const diagnosis = (...item: [string, string, 'utama' | 'penyerta'][]) => ({ item: item.map(([kodeIcd, nama, peran]) => ({ kode: kodeIcd, nama, peran })) });
  const catatDiagnosis = (kunj: number, isi: unknown, siapa = 'dokter', alasan?: string) => panggil('PUT', `/kunjungan/${kunj}/klinis/diagnosis`, siapa, { isi, ...(alasan ? { alasan } : {}) });
  /** Kunjungan dengan diagnosis tersahkan oleh dokter, lalu ditutup. */
  async function kunjunganSahTutup(waktuTutup = new Date()) {
    const k = await kunjunganBaru('pemeriksaan');
    expect((await catatDiagnosis(k, diagnosis(['I10', 'Hipertensi esensial', 'utama']))).status).toBe(200);
    await prisma.kunjungan.update({ where: { id: k }, data: { tahap_layanan: 'ditutup', waktu_tutup: waktuTutup } });
    return k;
  }
  /** Kode diagnosis versi terakhir (penyimpanan berversi: baris lama tetap ada). */
  const kodeSekarang = async (kunj: number) => {
    const baris = await prisma.diagnosis.findMany({ where: { kunjungan_id: kunj }, orderBy: [{ versi: 'desc' }, { urutan: 'asc' }] });
    return baris.filter((x) => x.versi === baris[0].versi).map((x) => x.kode_icd10);
  };
  const kunoKan = (kunj: number, jam = 72) => prisma.pengesahanCatatan.updateMany({ where: { entitas: 'diagnosis', entitas_id: kunj }, data: { waktu: new Date(Date.now() - jam * 3_600_000) } });

  const DOKTER: [string, string][] = [['klinis', 'lihat'], ['klinis', 'input'], ['klinis', 'perbaikan'], ['pasien', 'lihat']];
  const PEREKAM: [string, string][] = [['rekam-medis', 'lihat'], ['rekam-medis', 'input'], ['rekam-medis', 'perbaikan'], ['pasien', 'lihat']];

  beforeAll(async () => {
    process.env.DATABASE_URL = urlUji;
    fas = await buatFasyankes(kode, 'Uji Rekam Medis');
    fasLain = await buatFasyankes(`${kode}-LAIN`, 'Uji RM Lain');
    const { buatApp } = require('../../app');
    server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
    await buatPengguna('dokter', '9960000000000001', DOKTER);
    await buatPengguna('dokter2', '9960000000000002', DOKTER);
    await buatPengguna('perekam', '9960000000000003', PEREKAM);
    await buatPengguna('perekam2', '9960000000000004', PEREKAM);
    await buatPengguna('kasir', '9960000000000005', [['kasir', 'lihat']]);
    await buatPengguna('lainPerekam', '9960000000000006', PEREKAM, fasLain);
    await buatPengguna('lainDokter', '9960000000000007', DOKTER, fasLain);
    for (const k of ['dokter', 'dokter2', 'perekam', 'perekam2', 'kasir', 'lainPerekam', 'lainDokter']) await login(k);
  });

  afterAll(async () => {
    server?.close();
    const where = { fasyankes_id: { in: [fas, fasLain] } };
    await prisma.logAudit.deleteMany({ where });
    await prisma.sesi.deleteMany({ where: { pengguna_id: { in: Object.values(id) } } });
    for (const m of [prisma.permintaanPerbaikan, prisma.pengkodean, prisma.versiCatatan, prisma.pengesahanCatatan, prisma.diagnosis, prisma.draf, prisma.peringatanIzin, prisma.izinPerAkun] as any[]) await m.deleteMany({ where });
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

  it('perbaikan: pembuat dalam 2x24 jam langsung menerapkan, bagian belum disahkan atau isi tak sah ditolak', async () => {
    const k = await kunjunganBaru();
    const perbaiki = (isi: unknown, siapa = 'dokter', bagian = 'diagnosis', alasan = 'salah kode') => panggil('POST', `/kunjungan/${k}/perbaikan`, siapa, { bagian, isi, alasan });
    expect((await perbaiki(diagnosis(['I10', 'A', 'utama']))).status).toBe(409); // belum disahkan
    await catatDiagnosis(k, diagnosis(['I10', 'Hipertensi', 'utama']));
    expect((await perbaiki(diagnosis(['I10', 'A', 'utama']), 'perekam')).status).toBe(403); // tanpa izin klinis perbaikan
    expect((await perbaiki(diagnosis(['I10', 'A', 'utama']), 'kasir')).status).toBe(403);
    expect((await perbaiki(diagnosis(['salah', 'A', 'utama']))).status).toBe(400);
    expect((await perbaiki({ item: [] })).status).toBe(400);
    expect((await panggil('POST', `/kunjungan/${k}/perbaikan`, 'dokter', { bagian: 'diagnosis', isi: diagnosis(['E11.9', 'DM', 'utama']), alasan: '' })).status).toBe(400);
    expect((await panggil('POST', `/kunjungan/${k}/perbaikan`, 'dokter', { bagian: 'lainnya', isi: {}, alasan: 'x' })).status).toBe(400);
    const h = await perbaiki(diagnosis(['E11.9', 'Diabetes melitus tipe 2', 'utama']));
    expect(h.status).toBe(201);
    expect(h.badan.data).toMatchObject({ jenis: 'diterapkan', permintaan: null });
    expect(await kodeSekarang(k)).toEqual(['E11.9']);
    expect(await prisma.versiCatatan.count({ where: { entitas: 'diagnosis', entitas_id: k } })).toBe(1);
    expect((await perbaiki(diagnosis(['E11.9', 'DM', 'utama']), 'lainDokter')).status).toBe(404);
  });

  it('perbaikan lewat 2x24 jam atau bukan pembuat diajukan; satu permintaan menunggu per bagian; kunjungan ditutup tetap bisa', async () => {
    const k = await kunjunganSahTutup();
    await kunoKan(k, 72);
    const ajukan = (isi: unknown, siapa = 'dokter') => panggil('POST', `/kunjungan/${k}/perbaikan`, siapa, { bagian: 'diagnosis', isi, alasan: 'koreksi kode' });
    const baru = diagnosis(['J06.9', 'ISPA', 'utama']);
    const h = await ajukan(baru);
    expect(h.status).toBe(201);
    expect(h.badan.data.jenis).toBe('diajukan');
    expect(h.badan.data.permintaan).toMatchObject({ status: 'diajukan', bagian: 'diagnosis', alasan: 'koreksi kode', pemohon_nama: 'Nama dokter' });
    expect((await ajukan(baru, 'dokter2')).status).toBe(409); // sudah ada yang menunggu
    expect(await kodeSekarang(k)).toEqual(['I10']); // belum berubah
    id.permintaan1 = h.badan.data.permintaan.id;
    // bukan pembuat, dalam 2x24 jam: tetap diajukan
    const k2 = await kunjunganSahTutup();
    const b = await panggil('POST', `/kunjungan/${k2}/perbaikan`, 'dokter2', { bagian: 'diagnosis', isi: diagnosis(['K29.7', 'Gastritis', 'utama']), alasan: 'koreksi' });
    expect(b.badan.data.jenis).toBe('diajukan');
    id.permintaan2 = b.badan.data.permintaan.id;
    id.kunjPermintaan2 = k2;
  });

  it('antrean perbaikan: butuh izin rekam medis; tinjau menolak (catatan wajib) atau menyetujui (penyetuju orang lain, versi lama mencatat penyetuju)', async () => {
    expect((await panggil('GET', '/rekam-medis/perbaikan', 'dokter')).status).toBe(403);
    expect((await panggil('GET', '/rekam-medis/perbaikan', 'lainPerekam')).badan.data.total).toBe(0);
    const daftar = await panggil('GET', '/rekam-medis/perbaikan?status=diajukan', 'perekam');
    expect(daftar.status).toBe(200);
    expect(daftar.badan.data.menunggu).toBe(2);
    const baris = daftar.badan.data.data.find((x: any) => x.id === id.permintaan1);
    expect(baris).toMatchObject({ pemohon_nama: 'Nama dokter', status: 'diajukan' });
    expect(baris.isi_sekarang.item[0].kode).toBe('I10');
    expect(baris.isi_baru.item[0].kode).toBe('J06.9');
    const putus = (idP: number, badan: unknown, siapa = 'perekam') => panggil('POST', `/rekam-medis/perbaikan/${idP}/keputusan`, siapa, badan);
    expect((await putus(id.permintaan1, { keputusan: 'setujui' }, 'dokter')).status).toBe(403);
    expect((await putus(id.permintaan1, { keputusan: 'setujui' }, 'lainPerekam')).status).toBe(404);
    expect((await putus(id.permintaan1, { keputusan: 'tolak' })).status).toBe(400); // catatan wajib
    expect((await putus(id.permintaan1, { keputusan: 'mungkin' })).status).toBe(400);
    expect((await putus(99_999_999, { keputusan: 'setujui' })).status).toBe(404);
    const tolak = await putus(id.permintaan2, { keputusan: 'tolak', catatan: 'kode awal sudah tepat' });
    expect(tolak.status).toBe(200);
    expect(tolak.badan.data).toMatchObject({ status: 'ditolak', catatan_keputusan: 'kode awal sudah tepat', penyetuju_nama: 'Nama perekam' });
    expect((await putus(id.permintaan2, { keputusan: 'setujui' })).status).toBe(409); // sudah diputuskan
    const setuju = await putus(id.permintaan1, { keputusan: 'setujui', catatan: 'sesuai rekam' });
    expect(setuju.status).toBe(200);
    expect(setuju.badan.data.status).toBe('disetujui');
    const kunj = (await prisma.permintaanPerbaikan.findUnique({ where: { id: id.permintaan1 } }))!.kunjungan_id;
    expect(await kodeSekarang(kunj)).toEqual(['J06.9']);
    const versi = await prisma.versiCatatan.findFirst({ where: { entitas: 'diagnosis', entitas_id: kunj } });
    expect(versi).toMatchObject({ alasan: 'koreksi kode', disetujui_oleh: id.perekam });
    const sah = await prisma.pengesahanCatatan.findMany({ where: { entitas: 'diagnosis', entitas_id: kunj }, orderBy: { versi: 'asc' } });
    expect(sah.map((x) => [x.versi, x.pengguna_id])).toEqual([[1, id.dokter], [2, id.dokter]]); // pengesahan atas nama pemohon
    expect((await panggil('GET', '/rekam-medis/perbaikan', 'perekam')).badan.data.menunggu).toBe(0);
  });

  it('pemohon tidak boleh menyetujui permintaannya sendiri', async () => {
    const k = await kunjunganSahTutup();
    await kunoKan(k, 72);
    const p = await panggil('POST', `/kunjungan/${k}/perbaikan`, 'perekam', { bagian: 'diagnosis', isi: diagnosis(['A09', 'Diare', 'utama']), alasan: 'x' });
    expect(p.status).toBe(403); // perekam tanpa izin klinis perbaikan
    await prisma.izinJenisAkun.create({ data: { fasyankes_id: fas, jenis_akun_id: (await prisma.penugasanJenis.findFirstOrThrow({ where: { pengguna_id: id.perekam } })).jenis_akun_id, izin_id: (await prisma.izin.findFirstOrThrow({ where: { fitur: 'klinis', aksi: 'perbaikan' } })).id } });
    const q = await panggil('POST', `/kunjungan/${k}/perbaikan`, 'perekam', { bagian: 'diagnosis', isi: diagnosis(['A09', 'Diare', 'utama']), alasan: 'x' });
    expect(q.badan.data.jenis).toBe('diajukan');
    const putus = await panggil('POST', `/rekam-medis/perbaikan/${q.badan.data.permintaan.id}/keputusan`, 'perekam', { keputusan: 'setujui' });
    expect(putus.status).toBe(409);
    expect((await panggil('POST', `/rekam-medis/perbaikan/${q.badan.data.permintaan.id}/keputusan`, 'perekam2', { keputusan: 'setujui' })).status).toBe(200);
  });

  it('pengkodean: setelah kunjungan ditutup, tepat satu diagnosis utama, kode sah dan unik; arsip dan retensi 25 tahun mengikuti; ubah butuh catatan dan membentuk versi', async () => {
    const belumTutup = await kunjunganBaru('pemeriksaan');
    const simpan = (kunj: number, badan: unknown, siapa = 'perekam') => panggil('PUT', `/kunjungan/${kunj}/pengkodean`, siapa, badan);
    const dasar = { diagnosis: [{ kode: 'i10', nama: 'Hipertensi esensial', peran: 'utama' }, { kode: 'E78.0', nama: 'Hiperkolesterolemia', peran: 'penyerta' }], tindakan: [{ kode: '89.52', nama: 'Elektrokardiogram' }] };
    expect((await simpan(belumTutup, dasar)).status).toBe(409);
    const tutup = new Date('2026-02-28T03:00:00.000Z');
    const k = await kunjunganSahTutup(tutup);
    expect((await simpan(k, dasar, 'dokter')).status).toBe(403);
    expect((await simpan(k, dasar, 'lainPerekam')).status).toBe(404);
    expect((await simpan(k, { ...dasar, diagnosis: [] })).status).toBe(400);
    expect((await simpan(k, { ...dasar, diagnosis: [{ ...dasar.diagnosis[0], peran: 'penyerta' }] })).status).toBe(400);
    expect((await simpan(k, { ...dasar, diagnosis: [dasar.diagnosis[0], { ...dasar.diagnosis[1], peran: 'utama' }] })).status).toBe(400);
    expect((await simpan(k, { ...dasar, diagnosis: [dasar.diagnosis[0], { ...dasar.diagnosis[1], kode: 'I10' }] })).status).toBe(400);
    expect((await simpan(k, { ...dasar, diagnosis: [{ ...dasar.diagnosis[0], kode: 'XYZ' }] })).status).toBe(400);
    expect((await simpan(k, { ...dasar, tindakan: [{ kode: '8952', nama: 'x' }] })).status).toBe(400);
    const awal = await panggil('GET', `/kunjungan/${k}/pengkodean`, 'perekam');
    expect(awal.badan.data).toMatchObject({ final: null, versi: null, diarsipkan_pada: null });
    expect(awal.badan.data.dokter.diagnosis[0]).toMatchObject({ kode: 'I10', peran: 'utama' });
    const h = await simpan(k, dasar);
    expect(h.status).toBe(200);
    expect(h.badan.data).toMatchObject({ versi: 1, pengode_nama: 'Nama perekam' });
    expect(h.badan.data.final.diagnosis[0].kode).toBe('I10'); // dinormalkan huruf besar
    expect(h.badan.data.diarsipkan_pada).not.toBeNull();
    expect(h.badan.data.retensi_sampai).toBe('2051-02-28');
    const arsipAwal = (await prisma.kunjungan.findUnique({ where: { id: k } }))!.diarsipkan_pada!;
    expect((await simpan(k, dasar)).badan.data.versi).toBe(1); // isi sama: tanpa versi baru
    const ubah = { ...dasar, diagnosis: [dasar.diagnosis[0]] };
    expect((await simpan(k, ubah)).status).toBe(400); // memperbaiki butuh catatan sebagai alasan
    const v2 = await simpan(k, { ...ubah, catatan: 'kode penyerta dihapus' });
    expect(v2.status).toBe(200);
    expect(v2.badan.data.versi).toBe(2);
    expect((await prisma.kunjungan.findUnique({ where: { id: k } }))!.diarsipkan_pada).toEqual(arsipAwal); // arsip tidak berubah
    expect(await prisma.versiCatatan.count({ where: { entitas: 'pengkodean', entitas_id: k } })).toBe(1);
    expect((await panggil('GET', `/kunjungan/${k}/pengkodean`, 'lainPerekam')).status).toBe(404);
    // 29 Februari: retensi tidak lebih dari 25 tahun
    const kabisat = await kunjunganSahTutup(new Date('2028-02-29T03:00:00.000Z'));
    expect((await simpan(kabisat, dasar)).badan.data.retensi_sampai).toBe('2053-02-28');
  });

  it('daftar berkas: kunjungan ditutup dengan status kode, diagnosis, arsip, dan perbaikan menunggu; filter dan klinik sendiri', async () => {
    expect((await panggil('GET', '/rekam-medis/berkas', 'kasir')).status).toBe(403);
    const semua = await panggil('GET', '/rekam-medis/berkas', 'perekam');
    expect(semua.status).toBe(200);
    expect(semua.badan.data.total).toBeGreaterThanOrEqual(5);
    const sudah = await panggil('GET', '/rekam-medis/berkas?kode=sudah', 'perekam');
    expect(sudah.badan.data.data.every((b: any) => b.status_kode === 'sudah' && b.diarsipkan_pada && b.retensi_sampai)).toBe(true);
    expect(sudah.badan.data.data[0].diagnosis_final).toMatch(/^I10 /);
    const belum = await panggil('GET', '/rekam-medis/berkas?kode=belum', 'dokter');
    expect(belum.status).toBe(200);
    expect(belum.badan.data.data.every((b: any) => b.status_kode === 'belum' && b.diarsipkan_pada === null)).toBe(true);
    expect(belum.badan.data.data[0].diagnosis_dokter).toBeTruthy();
    const nama = belum.badan.data.data[0].pasien_nama as string;
    const cari = await panggil('GET', `/rekam-medis/berkas?cari=${encodeURIComponent(nama)}`, 'perekam');
    expect(cari.badan.data.data.map((b: any) => b.pasien_nama)).toEqual([nama]);
    expect((await panggil('GET', '/rekam-medis/berkas?kode=salah', 'perekam')).status).toBe(400);
    expect((await panggil('GET', '/rekam-medis/berkas?dari=2020-01-01&sampai=2020-01-02', 'perekam')).badan.data.total).toBe(0);
    expect((await panggil('GET', '/rekam-medis/berkas', 'lainPerekam')).badan.data.total).toBe(0);
  });

  it('audit mencatat permintaan, keputusan, dan pengkodean', async () => {
    const audit = await prisma.logAudit.findMany({ where: { fasyankes_id: fas, entitas: { in: ['permintaan_perbaikan', 'pengkodean'] } } });
    expect(new Set(audit.map((a) => a.entitas))).toEqual(new Set(['permintaan_perbaikan', 'pengkodean']));
    expect(audit.some((a) => a.entitas === 'pengkodean' && a.aksi === 'perbaikan')).toBe(true);
  });
});
