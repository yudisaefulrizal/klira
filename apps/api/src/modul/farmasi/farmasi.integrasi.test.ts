/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { AddressInfo } from 'net';
import { PrismaClient } from '@prisma/client';

const urlUji = process.env.DATABASE_URL_UJI;
const d = urlUji ? describe : describe.skip;

d('farmasi (master obat, stok, resep, telaah) terhadap klira_uji', () => {
  const prisma = new PrismaClient({ datasourceUrl: urlUji });
  const kode = `UJI-FRM-${Date.now()}`;
  let server: any;
  let fas = 0;
  let fasLain = 0;
  let kunjA = 0;
  let kunjB = 0;
  let kunjTutup = 0;
  let kunjLain = 0;
  let kfa1 = 0;
  let kfa2 = 0;
  let kfaMati = 0;
  const id: Record<string, number> = {};
  const ids: Record<string, number> = {};
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
  const buatKunjungan = async (fasId: number, rm: string, tahap: 'pemeriksaan' | 'resep' | 'kasir' | 'ditutup' = 'pemeriksaan') => {
    const p = await prisma.pasien.create({ data: { fasyankes_id: fasId, nomor_rm: rm, nama: `Pasien ${rm}`, tanggal_lahir: new Date('1980-01-01'), jenis_kelamin: 'perempuan' } });
    return (await prisma.kunjungan.create({ data: { fasyankes_id: fasId, pasien_id: p.id, jenis: 'AMB', tahap_layanan: tahap } })).id;
  };
  const tambahObat = (kfaId: number, ekstra: object = {}, siapa = 'apoteker') =>
    panggil('POST', '/farmasi/master', siapa, { kfa_id: kfaId, nama_tampil: 'Obat Uji', satuan: 'tablet', harga: 1000, ...ekstra });
  const mutasi = (obatId: number, ekstra: object, siapa = 'apoteker') => panggil('POST', '/farmasi/mutasi', siapa, { master_obat_id: obatId, ...ekstra });
  const telaahLengkap = { administratif: true, farmasetik: true, klinis: true };

  const APOTEKER: [string, string][] = [['farmasi', 'lihat'], ['farmasi', 'input'], ['farmasi', 'perbaikan']];
  const DOKTER: [string, string][] = [['resep', 'lihat'], ['resep', 'input'], ['klinis', 'lihat']];

  beforeAll(async () => {
    process.env.DATABASE_URL = urlUji;
    fas = await buatFasyankes(kode, 'Uji Farmasi');
    fasLain = await buatFasyankes(`${kode}-LAIN`, 'Uji Farmasi Lain');
    const { buatApp } = require('../../app');
    server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
    await buatPengguna('apoteker', '9980000000000001', APOTEKER);
    await buatPengguna('dokter', '9980000000000002', DOKTER);
    await buatPengguna('perawat', '9980000000000003', [['klinis', 'lihat']]);
    await buatPengguna('lainApoteker', '9980000000000004', APOTEKER, fasLain);
    await buatPengguna('lainDokter', '9980000000000005', DOKTER, fasLain);
    kunjA = await buatKunjungan(fas, `${kode}-A`);
    kunjB = await buatKunjungan(fas, `${kode}-B`);
    kunjTutup = await buatKunjungan(fas, `${kode}-T`, 'ditutup');
    kunjLain = await buatKunjungan(fasLain, `${kode}-L`);
    kfa1 = (await prisma.referensiKfa.create({ data: { kode: `${kode}-1`, tingkat: 92, nama: `Uji parasetamol ${kode} tablet`, satuan: 'tablet', contoh: true } })).id;
    kfa2 = (await prisma.referensiKfa.create({ data: { kode: `${kode}-2`, tingkat: 92, nama: `Uji amoksisilin ${kode} kapsul`, satuan: 'kapsul', contoh: true } })).id;
    kfaMati = (await prisma.referensiKfa.create({ data: { kode: `${kode}-3`, tingkat: 92, nama: `Uji tidak aktif ${kode}`, status: 'tidak_aktif', contoh: true } })).id;
    for (const k of ['apoteker', 'dokter', 'perawat', 'lainApoteker', 'lainDokter']) await login(k);
  });

  afterAll(async () => {
    server?.close();
    const where = { fasyankes_id: { in: [fas, fasLain] } };
    await prisma.logAudit.deleteMany({ where });
    await prisma.sesi.deleteMany({ where: { pengguna_id: { in: Object.values(id) } } });
    for (const m of [prisma.peringatanIzin, prisma.izinPerAkun, prisma.pesertaKunjungan, prisma.draf, prisma.mutasiStok, prisma.stokObat, prisma.telaahResep, prisma.itemTagihan, prisma.itemResep, prisma.tagihan, prisma.resep, prisma.masterObat] as any[]) await m.deleteMany({ where });
    await prisma.referensiKfa.deleteMany({ where: { kode: { startsWith: kode } } });
    await prisma.kunjungan.deleteMany({ where });
    await prisma.pasien.deleteMany({ where });
    await prisma.penugasanJenis.deleteMany({ where });
    await prisma.izinJenisAkun.deleteMany({ where });
    await prisma.jenisAkun.deleteMany({ where });
    await prisma.pengguna.deleteMany({ where });
    await prisma.fasyankes.deleteMany({ where: { id: { in: [fas, fasLain] } } });
    await prisma.$disconnect();
  });

  it('pencarian KFA butuh izin farmasi input, minimal dua huruf, dan mengembalikan tingkat serta penanda contoh', async () => {
    expect((await panggil('GET', `/farmasi/kfa?cari=${kode}`, null)).status).toBe(401);
    expect((await panggil('GET', `/farmasi/kfa?cari=${kode}`, 'dokter')).status).toBe(403);
    expect((await panggil('GET', '/farmasi/kfa?cari=a', 'apoteker')).status).toBe(400);
    const h = await panggil('GET', `/farmasi/kfa?cari=${kode}`, 'apoteker');
    expect(h.status).toBe(200);
    expect(h.badan.data.length).toBe(3);
    expect(h.badan.data[0]).toMatchObject({ tingkat: 92, contoh: true });
  });

  it('master obat: apoteker menambah dari KFA, KFA ganda atau tidak aktif ditolak, dokter hanya membaca, ubah dan nonaktif tercatat', async () => {
    expect((await tambahObat(kfa1, {}, 'dokter')).status).toBe(403);
    expect((await tambahObat(99_999_999)).status).toBe(400);
    expect((await tambahObat(kfaMati)).status).toBe(400);
    expect((await tambahObat(kfa1, { harga: -5 })).status).toBe(400);
    expect((await tambahObat(kfa1, { satuan: '' })).status).toBe(400);
    const a = await tambahObat(kfa1, { nama_tampil: 'Parasetamol 500', satuan: 'tablet', harga: 500 });
    expect(a.status).toBe(201);
    expect(a.badan.data).toMatchObject({ kfa_kode: `${kode}-1`, harga: 500, aktif: true, stok_total: 0, status_stok: 'habis', kfa_contoh: true });
    expect((await tambahObat(kfa1)).status).toBe(409);
    const b = await tambahObat(kfa2, { nama_tampil: 'Amoksisilin 500', satuan: 'kapsul', harga: 1500 });
    expect(b.status).toBe(201);
    ids.obat1 = a.badan.data.id;
    ids.obat2 = b.badan.data.id;
    const daftarDokter = await panggil('GET', '/farmasi/master?aktif=true', 'dokter');
    expect(daftarDokter.status).toBe(200);
    expect(daftarDokter.badan.data.data.length).toBe(2);
    expect((await panggil('GET', '/farmasi/master', 'perawat')).status).toBe(403);
    expect((await panggil('PATCH', `/farmasi/master/${ids.obat1}`, 'dokter', { harga: 1 })).status).toBe(403);
    expect((await panggil('PATCH', `/farmasi/master/${ids.obat1}`, 'apoteker', {})).status).toBe(400);
    const u = await panggil('PATCH', `/farmasi/master/${ids.obat1}`, 'apoteker', { harga: 600 });
    expect(u.status).toBe(200);
    expect(u.badan.data.harga).toBe(600);
    expect((await panggil('PATCH', `/farmasi/master/${ids.obat1}`, 'lainApoteker', { harga: 1 })).status).toBe(404);
    const cari = await panggil('GET', '/farmasi/master?cari=amoksisilin', 'apoteker');
    expect(cari.badan.data.data.map((x: any) => x.nama_tampil)).toEqual(['Amoksisilin 500']);
    const audit = await prisma.logAudit.findMany({ where: { fasyankes_id: fas, entitas: 'master_obat' } });
    expect(audit.map((x) => x.aksi).sort()).toEqual(['input', 'input', 'perbaikan']);
  });

  it('mutasi stok: terima membuat batch, keluar tidak boleh melebihi stok dan butuh alasan, koreksi menyetel jumlah, riwayat bertanda', async () => {
    const besok = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
    const jauh = new Date(Date.now() + 400 * 86_400_000).toISOString().slice(0, 10);
    expect((await mutasi(ids.obat1, { jenis: 'terima', batch: 'B1', kedaluwarsa: jauh, jumlah: 100 }, 'dokter')).status).toBe(403);
    expect((await mutasi(ids.obat1, { jenis: 'terima', batch: 'B1', jumlah: 100 })).status).toBe(400); // kedaluwarsa wajib
    expect((await mutasi(ids.obat1, { jenis: 'terima', batch: 'B1', kedaluwarsa: jauh, jumlah: 0 })).status).toBe(400);
    expect((await mutasi(ids.obat1, { jenis: 'keluar', batch: 'B1', jumlah: 1 })).status).toBe(400); // alasan wajib
    expect((await mutasi(99_999_999, { jenis: 'terima', batch: 'B1', kedaluwarsa: jauh, jumlah: 1 })).status).toBe(404);
    expect((await mutasi(ids.obat1, { jenis: 'terima', batch: 'B1', kedaluwarsa: jauh, jumlah: 100 })).badan.data.jumlah).toBe(100);
    expect((await mutasi(ids.obat1, { jenis: 'terima', batch: 'B1', kedaluwarsa: jauh, jumlah: 20 })).badan.data.jumlah).toBe(120);
    expect((await mutasi(ids.obat1, { jenis: 'terima', batch: 'B2', kedaluwarsa: besok, jumlah: 10 })).status).toBe(201);
    expect((await mutasi(ids.obat1, { jenis: 'keluar', batch: 'B1', jumlah: 500, alasan: 'rusak' })).status).toBe(409);
    expect((await mutasi(ids.obat1, { jenis: 'keluar', batch: 'ZZ', jumlah: 1, alasan: 'rusak' })).status).toBe(400);
    expect((await mutasi(ids.obat1, { jenis: 'keluar', batch: 'B1', jumlah: 20, alasan: 'rusak' })).badan.data.jumlah).toBe(100);
    expect((await mutasi(ids.obat1, { jenis: 'koreksi', batch: 'B1', jumlah: 90, alasan: 'stok opname' })).badan.data.jumlah).toBe(90);
    const stok = await panggil('GET', `/farmasi/master/${ids.obat1}/stok`, 'apoteker');
    expect(stok.status).toBe(200);
    expect(stok.badan.data.stok.map((s: any) => [s.batch, s.jumlah])).toEqual([['B2', 10], ['B1', 90]]);
    expect(stok.badan.data.mutasi.map((m: any) => [m.jenis, m.jumlah])).toEqual([['koreksi', -10], ['keluar', -20], ['terima', 10], ['terima', 20], ['terima', 100]]);
    const m = await panggil('GET', '/farmasi/master?cari=Parasetamol', 'apoteker');
    expect(m.badan.data.data[0]).toMatchObject({ stok_total: 100, status_stok: 'kedaluwarsa_dekat' });
    expect((await panggil('GET', `/farmasi/master/${ids.obat1}/stok`, 'lainApoteker')).status).toBe(404);
    expect((await mutasi(ids.obat1, { jenis: 'terima', batch: 'BX', kedaluwarsa: jauh, jumlah: 5 }, 'lainApoteker')).status).toBe(404);
  });

  it('resep: dokter mengajukan, biaya masuk tagihan, nomor berurutan, validasi dan lintas klinik ditolak', async () => {
    const item = [{ master_obat_id: ids.obat1, aturan_pakai: '3 x 1 sesudah makan', jumlah: 10 }, { master_obat_id: ids.obat2, aturan_pakai: '3 x 1', bentuk: 'kapsul', jumlah: 15 }];
    expect((await panggil('POST', `/kunjungan/${kunjA}/resep`, 'apoteker', { item })).status).toBe(403);
    expect((await panggil('POST', `/kunjungan/${kunjA}/resep`, 'dokter', { item: [] })).status).toBe(400);
    expect((await panggil('POST', `/kunjungan/${kunjA}/resep`, 'dokter', { item: [{ ...item[0], aturan_pakai: '' }] })).status).toBe(400);
    expect((await panggil('POST', `/kunjungan/${kunjA}/resep`, 'dokter', { item: [{ ...item[0], jumlah: 0 }] })).status).toBe(400);
    expect((await panggil('POST', `/kunjungan/${kunjA}/resep`, 'dokter', { item: [item[0], item[0]] })).status).toBe(400); // obat ganda
    expect((await panggil('POST', `/kunjungan/${kunjTutup}/resep`, 'dokter', { item })).status).toBe(409);
    expect((await panggil('POST', `/kunjungan/${kunjLain}/resep`, 'dokter', { item })).status).toBe(404);
    expect((await panggil('POST', `/kunjungan/${kunjLain}/resep`, 'lainDokter', { item })).status).toBe(400); // obat milik klinik lain
    await panggil('PATCH', `/farmasi/master/${ids.obat2}`, 'apoteker', { aktif: false });
    expect((await panggil('POST', `/kunjungan/${kunjA}/resep`, 'dokter', { item })).status).toBe(400); // obat nonaktif
    await panggil('PATCH', `/farmasi/master/${ids.obat2}`, 'apoteker', { aktif: true });
    const r = await panggil('POST', `/kunjungan/${kunjA}/resep`, 'dokter', { item });
    expect(r.status).toBe(201);
    expect(r.badan.data.resep).toMatchObject({ status: 'diajukan', jenis_pembiayaan: 'umum' });
    expect(r.badan.data.resep.nomor_resep).toMatch(/^R-\d{8}-\d{3}$/);
    expect(r.badan.data.resep.item.map((i: any) => [i.nama, i.jumlah, i.harga])).toEqual([['Parasetamol 500', 10, 600], ['Amoksisilin 500', 15, 1500]]);
    expect(r.badan.data.tagihan).toMatchObject({ status_tagihan: 'lengkap', status_pembayaran: 'belum', total: 10 * 600 + 15 * 1500 });
    ids.resepA = r.badan.data.resep.id;
    const item2 = await prisma.itemTagihan.findMany({ where: { fasyankes_id: fas, item_resep_id: { not: null } } });
    expect(item2.length).toBe(2);
    expect(item2.every((i) => i.jenis === 'obat')).toBe(true);
    const r2 = await panggil('POST', `/kunjungan/${kunjB}/resep`, 'dokter', { item: [item[0]] });
    expect(r2.badan.data.resep.nomor_resep).not.toBe(r.badan.data.resep.nomor_resep);
    ids.resepB = r2.badan.data.resep.id;
    const daftar = await panggil('GET', `/kunjungan/${kunjA}/resep`, 'dokter');
    expect(daftar.badan.data.length).toBe(1);
    expect((await panggil('GET', `/kunjungan/${kunjA}/resep`, 'perawat')).status).toBe(200);
    expect((await panggil('GET', `/kunjungan/${kunjA}/resep`, 'lainDokter')).status).toBe(404);
  });

  it('resep serempak mendapat nomor unik', async () => {
    const k = await buatKunjungan(fas, `${kode}-S`);
    const hasil = await Promise.all([1, 2, 3, 4].map(() => panggil('POST', `/kunjungan/${k}/resep`, 'dokter', { item: [{ master_obat_id: ids.obat1, aturan_pakai: '1 x 1', jumlah: 1 }] })));
    expect(hasil.map((h) => h.status)).toEqual([201, 201, 201, 201]);
    expect(new Set(hasil.map((h) => h.badan.data.resep.nomor_resep)).size).toBe(4);
  });

  it('telaah dan siap: telaah belum lengkap butuh catatan, siap hanya setelah ditelaah, kekurangan stok dilaporkan, tahap maju ke kasir saat semua resep siap', async () => {
    await prisma.kunjungan.update({ where: { id: kunjA }, data: { tahap_layanan: 'resep' } });
    expect((await panggil('POST', `/resep/${ids.resepA}/telaah`, 'dokter', telaahLengkap)).status).toBe(403);
    expect((await panggil('POST', `/resep/${ids.resepA}/siap`, 'apoteker')).status).toBe(409); // belum ditelaah
    expect((await panggil('POST', `/resep/${ids.resepA}/telaah`, 'apoteker', { ...telaahLengkap, klinis: false })).status).toBe(400); // catatan wajib
    const sebagian = await panggil('POST', `/resep/${ids.resepA}/telaah`, 'apoteker', { ...telaahLengkap, klinis: false, catatan: 'Cek alergi pasien' });
    expect(sebagian.status).toBe(200);
    expect(sebagian.badan.data.status).toBe('diajukan');
    expect((await panggil('POST', `/resep/${ids.resepA}/siap`, 'apoteker')).status).toBe(409);
    const lengkap = await panggil('POST', `/resep/${ids.resepA}/telaah`, 'apoteker', telaahLengkap);
    expect(lengkap.badan.data).toMatchObject({ status: 'ditelaah', telaah: { administratif: true, klinis: true } });
    expect((await panggil('POST', `/resep/${ids.resepA}/telaah`, 'lainApoteker', telaahLengkap)).status).toBe(404);
    const siap = await panggil('POST', `/resep/${ids.resepA}/siap`, 'apoteker');
    expect(siap.status).toBe(200);
    expect(siap.badan.data.resep.status).toBe('siap');
    // obat2 tidak punya stok: kekurangan dilaporkan, tidak memblokir
    expect(siap.badan.data.kekurangan.map((x: any) => [x.nama, x.butuh, x.tersedia])).toEqual([['Amoksisilin 500', 15, 0]]);
    expect(siap.badan.data.tahap_kunjungan).toBe('kasir');
    expect((await prisma.kunjungan.findUnique({ where: { id: kunjA } }))?.tahap_layanan).toBe('kasir');
    expect((await panggil('POST', `/resep/${ids.resepA}/siap`, 'apoteker')).status).toBe(409);
    expect((await panggil('POST', `/resep/${ids.resepA}/telaah`, 'apoteker', telaahLengkap)).status).toBe(409);
    // dua resep pada satu kunjungan: tahap baru maju setelah semuanya siap
    await prisma.kunjungan.update({ where: { id: kunjB }, data: { tahap_layanan: 'resep' } });
    const tambahan = await panggil('POST', `/kunjungan/${kunjB}/resep`, 'dokter', { item: [{ master_obat_id: ids.obat1, aturan_pakai: '2 x 1', jumlah: 2 }] });
    await panggil('POST', `/resep/${ids.resepB}/telaah`, 'apoteker', telaahLengkap);
    const s1 = await panggil('POST', `/resep/${ids.resepB}/siap`, 'apoteker');
    expect(s1.badan.data.tahap_kunjungan).toBe('resep');
    await panggil('POST', `/resep/${tambahan.badan.data.resep.id}/telaah`, 'apoteker', telaahLengkap);
    const s2 = await panggil('POST', `/resep/${tambahan.badan.data.resep.id}/siap`, 'apoteker');
    expect(s2.badan.data.tahap_kunjungan).toBe('kasir');
  });

  it('riwayat obat: filter status dan tanggal, hanya klinik sendiri, butuh izin farmasi lihat', async () => {
    expect((await panggil('GET', '/farmasi/riwayat', 'dokter')).status).toBe(403);
    expect((await panggil('GET', '/farmasi/riwayat?status=salah', 'apoteker')).status).toBe(400);
    const semua = await panggil('GET', '/farmasi/riwayat', 'apoteker');
    expect(semua.status).toBe(200);
    expect(semua.badan.data.total).toBeGreaterThanOrEqual(7);
    const siap = await panggil('GET', '/farmasi/riwayat?status=siap', 'apoteker');
    expect(siap.badan.data.data.every((r: any) => r.status === 'siap')).toBe(true);
    expect(siap.badan.data.data[0]).toHaveProperty('pasien_nama');
    const lain = await panggil('GET', '/farmasi/riwayat', 'lainApoteker');
    expect(lain.badan.data.total).toBe(0);
    const hariIni = new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
    const rentang = await panggil('GET', `/farmasi/riwayat?dari=${hariIni}&sampai=${hariIni}`, 'apoteker');
    expect(rentang.badan.data.total).toBe(semua.badan.data.total);
    const lalu = await panggil('GET', '/farmasi/riwayat?dari=2020-01-01&sampai=2020-01-02', 'apoteker');
    expect(lalu.badan.data.total).toBe(0);
  });

  it('audit mencatat master, mutasi, resep, telaah, dan penyiapan tanpa isi sensitif', async () => {
    const audit = await prisma.logAudit.findMany({ where: { fasyankes_id: fas, entitas: { in: ['mutasi_stok', 'resep', 'telaah_resep'] } } });
    const entitas = new Set(audit.map((a) => a.entitas));
    expect(entitas).toEqual(new Set(['mutasi_stok', 'resep', 'telaah_resep']));
    expect(audit.some((a) => a.aksi === 'perbaikan' && a.entitas === 'resep')).toBe(true);
    expect(JSON.stringify(audit)).not.toMatch(/aturan_pakai|3 x 1/);
  });
});
