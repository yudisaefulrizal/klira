/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { AddressInfo } from 'net';
import { PrismaClient } from '@prisma/client';

const urlUji = process.env.DATABASE_URL_UJI;
const d = urlUji ? describe : describe.skip;

d('master data dan profil klinik terhadap klira_uji', () => {
  const prisma = new PrismaClient({ datasourceUrl: urlUji });
  const kode = `UJI-MST-${Date.now()}`;
  let server: any;
  let fas = 0;
  let fasLain = 0;
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
    const j = await prisma.jenisAkun.create({ data: { fasyankes_id: fasId, nama: `${kode}-${kunci}` } });
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
  const SEMUA: [string, string][] = [['master', 'lihat'], ['master', 'input'], ['master', 'perbaikan'], ['profil-klinik', 'lihat'], ['profil-klinik', 'perbaikan']];

  beforeAll(async () => {
    process.env.DATABASE_URL = urlUji;
    fas = await buatFasyankes(kode, 'Uji Master');
    fasLain = await buatFasyankes(`${kode}-LAIN`, 'Uji Master Lain');
    const { buatApp } = require('../../app');
    server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
    await buatPengguna('pimpinan', '9940000000000001', SEMUA);
    await buatPengguna('pelihat', '9940000000000002', [['master', 'lihat'], ['profil-klinik', 'lihat']]);
    await buatPengguna('biasa', '9940000000000003', [['klinis', 'input']]);
    await buatPengguna('dokter', '9940000000000004', []);
    await buatPengguna('dokter2', '9940000000000005', []);
    await buatPengguna('lain', '9940000000000006', SEMUA, fasLain);
    await login('pimpinan');
    await login('pelihat');
    await login('biasa');
    await login('lain');
  });

  afterAll(async () => {
    server?.close();
    const where = { fasyankes_id: { in: [fas, fasLain] } };
    await prisma.logAudit.deleteMany({ where });
    await prisma.sesi.deleteMany({ where: { pengguna_id: { in: Object.values(id) } } });
    await prisma.peringatanIzin.deleteMany({ where });
    await prisma.jadwalPraktik.deleteMany({ where });
    await prisma.tarifLayanan.deleteMany({ where });
    await prisma.riwayatProfil.deleteMany({ where });
    await prisma.profilProfesi.deleteMany({ where });
    await prisma.lokasi.updateMany({ where, data: { induk_id: null } });
    await prisma.lokasi.deleteMany({ where });
    await prisma.penugasanJenis.deleteMany({ where });
    await prisma.izinJenisAkun.deleteMany({ where });
    await prisma.jenisAkun.deleteMany({ where });
    await prisma.pengguna.deleteMany({ where });
    await prisma.fasyankes.deleteMany({ where: { id: { in: [fas, fasLain] } } });
    await prisma.$disconnect();
  });

  it('izin: tanpa fitur master ditolak, pelihat hanya membaca', async () => {
    expect((await panggil('GET', '/master/poli', 'biasa')).status).toBe(403);
    expect((await panggil('GET', '/fasyankes/profil', 'biasa')).status).toBe(403);
    expect((await panggil('GET', '/master/poli', 'pelihat')).status).toBe(200);
    expect((await panggil('POST', '/master/poli', 'pelihat', { nama: 'X' })).status).toBe(403);
    expect((await panggil('PATCH', '/fasyankes/profil', 'pelihat', { nama: 'X', jenis: 'klinik_pratama_rawat_jalan' })).status).toBe(403);
    expect((await panggil('GET', '/master/poli', null)).status).toBe(401);
  });

  it('poli, ruang, bed: tambah, validasi induk, ubah, cari, aktif/nonaktif, dan audit', async () => {
    expect((await panggil('POST', '/master/poli', 'pimpinan', { nama: '' })).status).toBe(400);
    const poli = await panggil('POST', '/master/poli', 'pimpinan', { nama: 'Poli Umum', ihs_location_id: 'IHS-1' });
    expect(poli.status).toBe(201);
    expect(poli.badan.data).toMatchObject({ nama: 'Poli Umum', aktif: true, status_operasional: 'O' });
    const poliId = poli.badan.data.id;

    // Bed wajib induk ruang; ruang induk harus poli milik klinik sendiri.
    expect((await panggil('POST', '/master/bed', 'pimpinan', { nama: 'Bed 1' })).status).toBe(400);
    const lain = await panggil('POST', '/master/poli', 'lain', { nama: 'Poli Lain' });
    const tolak = await panggil('POST', '/master/ruang', 'pimpinan', { nama: 'Ruang X', induk_id: lain.badan.data.id });
    expect(tolak.status).toBe(400);
    expect(tolak.badan.galat.rincian[0].jalur).toBe('induk_id');

    const ruang = await panggil('POST', '/master/ruang', 'pimpinan', { nama: 'Ruang Mawar', induk_id: poliId });
    expect(ruang.status).toBe(201);
    expect(ruang.badan.data.induk_nama).toBe('Poli Umum');
    expect((await panggil('POST', '/master/bed', 'pimpinan', { nama: 'Bed 1', induk_id: poliId })).status).toBe(400); // induk bed harus ruang
    const bed = await panggil('POST', '/master/bed', 'pimpinan', { nama: 'Bed 1', induk_id: ruang.badan.data.id });
    expect(bed.status).toBe(201);

    const ubah = await panggil('PATCH', `/master/poli/${poliId}`, 'pimpinan', { nama: 'Poli Umum 2', status_operasional: 'O' });
    expect(ubah.badan.data.nama).toBe('Poli Umum 2');
    const cari = await panggil('GET', '/master/ruang?cari=mawar', 'pelihat');
    expect(cari.badan.data.total).toBe(1);

    const non = await panggil('PATCH', `/master/ruang/${ruang.badan.data.id}/aktif`, 'pimpinan', { aktif: false });
    expect(non.badan.data).toMatchObject({ aktif: false, status_operasional: 'U' });
    expect((await panggil('GET', '/master/ruang?status=aktif', 'pelihat')).badan.data.total).toBe(0);
    expect((await panggil('GET', '/master/ruang?status=nonaktif', 'pelihat')).badan.data.total).toBe(1);
    expect((await prisma.lokasi.count({ where: { fasyankes_id: fas } }))).toBe(3); // tidak ada hapus permanen

    const audit = await prisma.logAudit.findMany({ where: { fasyankes_id: fas, entitas: 'lokasi' }, orderBy: { id: 'asc' } });
    expect(audit.map((a) => a.aksi)).toEqual(['input', 'input', 'input', 'perbaikan', 'perbaikan']);
    expect(audit.every((a) => a.pengguna_id === id.pimpinan)).toBe(true);
  });

  it('lintas fasyankes: ubah, nonaktifkan, dan baca milik klinik lain ditolak', async () => {
    const poliLain = await prisma.lokasi.findFirstOrThrow({ where: { fasyankes_id: fasLain, nama: 'Poli Lain' } });
    expect((await panggil('PATCH', `/master/poli/${poliLain.id}`, 'pimpinan', { nama: 'Dibajak' })).status).toBe(404);
    expect((await panggil('PATCH', `/master/poli/${poliLain.id}/aktif`, 'pimpinan', { aktif: false })).status).toBe(404);
    expect((await panggil('PATCH', `/master/ruang/${poliLain.id}`, 'pimpinan', { nama: 'x' })).status).toBe(404);
    expect((await prisma.lokasi.findUniqueOrThrow({ where: { id: poliLain.id } })).nama).toBe('Poli Lain');
    const daftar = await panggil('GET', '/master/poli', 'pimpinan');
    expect(daftar.badan.data.data.map((p: any) => p.nama)).not.toContain('Poli Lain');
  });

  it('praktisi: tambah profil untuk pengguna yang ada, ubah SIP dengan riwayat, nonaktifkan', async () => {
    const opsi = await panggil('GET', '/master/opsi/pengguna-tanpa-profil', 'pelihat');
    expect(opsi.badan.data.map((o: any) => o.nilai)).toContain(String(id.dokter));
    expect(opsi.badan.data.map((o: any) => o.nilai)).not.toContain(String(id.lain));
    expect((await panggil('POST', '/master/praktisi', 'pimpinan', { pengguna_id: id.lain, profesi: 'Dokter' })).status).toBe(400);
    const baru = await panggil('POST', '/master/praktisi', 'pimpinan', { pengguna_id: id.dokter, profesi: 'Dokter', nomor_sip: 'SIP-1', masa_berlaku_sip: '2027-05-06', ihs_practitioner_id: 'N10' });
    expect(baru.status).toBe(201);
    expect(baru.badan.data).toMatchObject({ pengguna_nama: 'Nama dokter', nomor_sip: 'SIP-1', masa_berlaku_sip: '2027-05-06' });
    expect((await panggil('POST', '/master/praktisi', 'pimpinan', { pengguna_id: id.dokter, profesi: 'Dokter' })).status).toBe(409);
    const ubah = await panggil('PATCH', `/master/praktisi/${baru.badan.data.id}`, 'pimpinan', { profesi: 'Dokter', nomor_sip: 'SIP-2', masa_berlaku_sip: '2028-05-06' });
    expect(ubah.badan.data.nomor_sip).toBe('SIP-2');
    expect(await prisma.profilProfesi.count({ where: { fasyankes_id: fas } })).toBe(1); // tidak membuat akun atau profil baru
    const riwayat = await panggil('GET', '/fasyankes/riwayat-profil', 'pelihat');
    expect(riwayat.badan.data.data.filter((r: any) => r.jenis === 'sip')).toHaveLength(2);
    expect(riwayat.badan.data.data[0].ringkasan).toContain('SIP-1 menjadi SIP-2');
    expect((await panggil('PATCH', `/master/praktisi/${baru.badan.data.id}/aktif`, 'pimpinan', { aktif: false })).badan.data.aktif).toBe(false);
  });

  it('jadwal praktik: validasi jam dan rujukan, ubah, nonaktif', async () => {
    await panggil('PATCH', `/master/praktisi/${(await prisma.profilProfesi.findFirstOrThrow({ where: { fasyankes_id: fas } })).id}/aktif`, 'pimpinan', { aktif: true });
    const poli = await prisma.lokasi.findFirstOrThrow({ where: { fasyankes_id: fas, jenis: 'poli' } });
    const dasar = { pengguna_id: id.dokter, lokasi_id: poli.id, hari: 2, jam_mulai: '08:00', jam_selesai: '12:00', kuota: 20, berlaku_dari: '2026-01-01' };
    expect((await panggil('POST', '/master/jadwal', 'pimpinan', { ...dasar, jam_selesai: '07:00' })).status).toBe(400);
    expect((await panggil('POST', '/master/jadwal', 'pimpinan', { ...dasar, kuota: 0 })).status).toBe(400);
    expect((await panggil('POST', '/master/jadwal', 'pimpinan', { ...dasar, berlaku_sampai: '2025-01-01' })).status).toBe(400);
    expect((await panggil('POST', '/master/jadwal', 'pimpinan', { ...dasar, pengguna_id: id.dokter2 })).status).toBe(400); // tanpa profil
    expect((await panggil('POST', '/master/jadwal', 'lain', dasar)).status).toBe(400); // rujukan klinik lain
    const j = await panggil('POST', '/master/jadwal', 'pimpinan', dasar);
    expect(j.status).toBe(201);
    expect(j.badan.data).toMatchObject({ hari: 2, jam_mulai: '08:00', lokasi_nama: 'Poli Umum 2', berlaku_dari: '2026-01-01', berlaku_sampai: null });
    expect((await panggil('PATCH', `/master/jadwal/${j.badan.data.id}`, 'pimpinan', { ...dasar, kuota: 30, berlaku_sampai: '2026-12-31' })).badan.data).toMatchObject({ kuota: 30, berlaku_sampai: '2026-12-31' });
    expect((await panggil('PATCH', `/master/jadwal/${j.badan.data.id}/aktif`, 'pimpinan', { aktif: false })).badan.data.aktif).toBe(false);
    expect((await panggil('GET', '/master/jadwal?cari=nama%20dokter', 'pelihat')).badan.data.total).toBe(1);
  });

  it('tarif layanan: kode unik per klinik, harga JKN opsional, nonaktif', async () => {
    const t = await panggil('POST', '/master/tarif', 'pimpinan', { kode: 'KON-01', nama: 'Konsultasi dokter umum', jenis: 'konsultasi', harga_umum: 50000 });
    expect(t.status).toBe(201);
    expect(t.badan.data).toMatchObject({ harga_umum: 50000, harga_jkn: null, aktif: true });
    expect((await panggil('POST', '/master/tarif', 'pimpinan', { kode: 'KON-01', nama: 'Dobel', jenis: 'tindakan', harga_umum: 1 })).status).toBe(409);
    expect((await panggil('POST', '/master/tarif', 'lain', { kode: 'KON-01', nama: 'Klinik lain', jenis: 'lab', harga_umum: 1, harga_jkn: 2 })).status).toBe(201);
    expect((await panggil('POST', '/master/tarif', 'pimpinan', { kode: 'X', nama: 'Negatif', jenis: 'lab', harga_umum: -1 })).status).toBe(400);
    expect((await panggil('POST', '/master/tarif', 'pimpinan', { kode: 'X', nama: 'Jenis salah', jenis: 'lainnya', harga_umum: 1 })).status).toBe(400);
    const u = await panggil('PATCH', `/master/tarif/${t.badan.data.id}`, 'pimpinan', { kode: 'KON-01', nama: 'Konsultasi', jenis: 'konsultasi', harga_umum: 60000, harga_jkn: 40000 });
    expect(u.badan.data).toMatchObject({ harga_umum: 60000, harga_jkn: 40000 });
    expect((await panggil('PATCH', `/master/tarif/${t.badan.data.id}/aktif`, 'pimpinan', { aktif: false })).badan.data.aktif).toBe(false);
    expect((await panggil('GET', '/master/tarif?cari=KON', 'pimpinan')).badan.data.total).toBe(1);
  });

  it('wilayah: hanya baca, dapat dicari dan disaring tingkat; jenis tak dikenal ditolak', async () => {
    const w = await panggil('GET', '/master/wilayah?cari=Aceh&tingkat=provinsi', 'pelihat');
    expect(w.badan.data.data[0]).toMatchObject({ kode: '11', nama: 'Aceh', contoh: false });
    expect((await panggil('GET', '/master/wilayah?tingkat=kecamatan&cari=tidak-ada-wilayah-ini', 'pelihat')).badan.data.total).toBe(0);
    expect((await panggil('POST', '/master/wilayah', 'pimpinan', { nama: 'x' })).status).toBe(405);
    expect((await panggil('PATCH', '/master/wilayah/1', 'pimpinan', { nama: 'x' })).status).toBe(405);
    expect((await panggil('GET', '/master/obat', 'pelihat')).status).toBe(400);
  });

  it('profil klinik: baca, validasi, simpan dengan riwayat dan audit, kode registrasi unik', async () => {
    const awal = await panggil('GET', '/fasyankes/profil', 'pelihat');
    expect(awal.badan.data).toMatchObject({ id: fas, nama: 'Uji Master', kode_registrasi: kode });
    expect((await panggil('PATCH', '/fasyankes/profil', 'pimpinan', { nama: '', jenis: 'klinik_pratama_rawat_jalan' })).status).toBe(400);
    expect((await panggil('PATCH', '/fasyankes/profil', 'pimpinan', { nama: 'X', jenis: 'rumah_sakit' })).status).toBe(400);
    expect((await panggil('PATCH', '/fasyankes/profil', 'pimpinan', { nama: 'X', jenis: 'klinik_pratama_rawat_jalan', kode_registrasi: `${kode}-LAIN` })).status).toBe(409);
    const badan = {
      nama: 'Uji Master Baru', jenis: 'klinik_pratama_rawat_inap', bentuk_usaha: 'PT', kode_registrasi: kode, organization_id: 'ORG-1',
      status_akreditasi: 'Madya', tanggal_akreditasi: '2025-03-04', puskesmas_wilayah: 'Puskesmas Contoh',
    };
    const s = await panggil('PATCH', '/fasyankes/profil', 'pimpinan', badan);
    expect(s.status).toBe(200);
    expect(s.badan.data).toMatchObject({ nama: 'Uji Master Baru', jenis: 'klinik_pratama_rawat_inap', tanggal_akreditasi: '2025-03-04', organization_id: 'ORG-1' });
    expect((await panggil('GET', '/fasyankes/profil', 'pelihat')).badan.data.status_akreditasi).toBe('Madya');
    // Simpan ulang tanpa perubahan: tidak menambah riwayat.
    expect((await panggil('PATCH', '/fasyankes/profil', 'pimpinan', badan)).status).toBe(200);
    const r = (await panggil('GET', '/fasyankes/riwayat-profil', 'pelihat')).badan.data.data.filter((x: any) => x.jenis !== 'sip');
    expect(r.map((x: any) => x.jenis).sort()).toEqual(['akreditasi', 'profil']);
    expect(r.find((x: any) => x.jenis === 'akreditasi').ringkasan).toContain('Madya');
    expect(r[0].dibuat_oleh_nama).toBe('Nama pimpinan');
    expect(await prisma.logAudit.count({ where: { fasyankes_id: fas, entitas: 'fasyankes', aksi: 'perbaikan' } })).toBe(1);
    // Klinik lain tidak melihat atau mengubah profil ini.
    expect((await panggil('GET', '/fasyankes/profil', 'lain')).badan.data.id).toBe(fasLain);
    expect((await panggil('GET', '/fasyankes/riwayat-profil', 'lain')).badan.data.total).toBe(0);
  });
});
