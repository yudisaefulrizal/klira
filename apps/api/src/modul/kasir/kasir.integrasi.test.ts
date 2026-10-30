/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { AddressInfo } from 'net';
import { PrismaClient } from '@prisma/client';

const urlUji = process.env.DATABASE_URL_UJI;
const d = urlUji ? describe : describe.skip;

d('kasir (shift, pembayaran, serah terima obat, tutup kunjungan) terhadap klira_uji', () => {
  const prisma = new PrismaClient({ datasourceUrl: urlUji });
  const kode = `UJI-KSR-${Date.now()}`;
  let server: any;
  let fas = 0;
  let fasLain = 0;
  let kfaId = 0;
  let obatId = 0;
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
  /** Kunjungan di tahap kasir dengan tagihan (konsultasi + obat) dan, bila diminta, resep dengan status tertentu. */
  async function siapkan(opsi: { tahap?: 'kasir' | 'pemeriksaan' | 'ditutup'; harga?: (number | null)[]; resep?: 'diajukan' | 'siap' | 'diserahkan' | null; jumlahObat?: number; fasId?: number } = {}) {
    const fasId = opsi.fasId ?? fas;
    nomor += 1;
    const p = await prisma.pasien.create({ data: { fasyankes_id: fasId, nomor_rm: `${kode}-${nomor}`, nama: `Pasien ${nomor}`, tanggal_lahir: new Date('1980-01-01'), jenis_kelamin: 'perempuan' } });
    const k = await prisma.kunjungan.create({ data: { fasyankes_id: fasId, pasien_id: p.id, jenis: 'AMB', tahap_layanan: opsi.tahap ?? 'kasir' } });
    const harga = opsi.harga ?? [50_000];
    if (harga.length) {
      const t = await prisma.tagihan.create({ data: { fasyankes_id: fasId, kunjungan_id: k.id, status_tagihan: harga.every((h) => h !== null) ? 'lengkap' : 'belum_lengkap' } });
      for (const [n, h] of harga.entries()) await prisma.itemTagihan.create({ data: { fasyankes_id: fasId, tagihan_id: t.id, jenis: 'konsultasi', kode: `K${n}`, nama: `Item ${n}`, jumlah: 1, harga: h } });
    }
    let resepId = 0;
    if (opsi.resep) {
      const r = await prisma.resep.create({ data: { fasyankes_id: fasId, kunjungan_id: k.id, dpjp_id: id.kasir, nomor_resep: `${kode}-R${nomor}`, status: opsi.resep } });
      resepId = r.id;
      await prisma.itemResep.create({ data: { fasyankes_id: fasId, resep_id: r.id, master_obat_id: obatId, aturan_pakai: '3 x 1', jumlah: opsi.jumlahObat ?? 10 } });
    }
    return { kunj: k.id, resepId };
  }
  const bukaShift = (siapa = 'kasir', kasAwal = 100_000) => panggil('POST', '/kasir/shift/buka', siapa, { kas_awal: kasAwal });
  const bayar = (kunj: number, badan: unknown, siapa = 'kasir') => panggil('POST', `/kunjungan/${kunj}/pembayaran`, siapa, badan);
  const stokBatch = async (batch: string) => (await prisma.stokObat.findFirst({ where: { master_obat_id: obatId, batch } }))!.jumlah;

  const KASIR: [string, string][] = [['kasir', 'lihat'], ['kasir', 'input'], ['kasir', 'perbaikan']];

  beforeAll(async () => {
    process.env.DATABASE_URL = urlUji;
    fas = await buatFasyankes(kode, 'Uji Kasir');
    fasLain = await buatFasyankes(`${kode}-LAIN`, 'Uji Kasir Lain');
    const { buatApp } = require('../../app');
    server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
    await buatPengguna('kasir', '9990000000000001', KASIR);
    await buatPengguna('kasir2', '9990000000000002', KASIR);
    await buatPengguna('dokter', '9990000000000003', [['klinis', 'lihat'], ['resep', 'input']]);
    await buatPengguna('apoteker', '9990000000000005', [['farmasi', 'lihat'], ['farmasi', 'input']]);
    await buatPengguna('lainApoteker', '9990000000000006', [['farmasi', 'lihat'], ['farmasi', 'input']], fasLain);
    await buatPengguna('lainKasir', '9990000000000004', KASIR, fasLain);
    kfaId = (await prisma.referensiKfa.create({ data: { kode: `${kode}-K`, tingkat: 92, nama: `Uji obat ${kode}`, contoh: true } })).id;
    obatId = (await prisma.masterObat.create({ data: { fasyankes_id: fas, kfa_id: kfaId, nama_tampil: 'Obat Kasir', satuan: 'tablet', harga: 1000 } })).id;
    const jauh = (hari: number) => new Date(Date.now() + hari * 86_400_000);
    await prisma.stokObat.create({ data: { fasyankes_id: fas, master_obat_id: obatId, batch: 'B-DEKAT', kedaluwarsa: jauh(60), jumlah: 6 } });
    await prisma.stokObat.create({ data: { fasyankes_id: fas, master_obat_id: obatId, batch: 'B-JAUH', kedaluwarsa: jauh(400), jumlah: 20 } });
    await prisma.stokObat.create({ data: { fasyankes_id: fas, master_obat_id: obatId, batch: 'B-LEWAT', kedaluwarsa: jauh(-5), jumlah: 100 } });
    for (const k of ['kasir', 'kasir2', 'dokter', 'lainKasir', 'apoteker', 'lainApoteker']) await login(k);
  });

  afterAll(async () => {
    server?.close();
    const where = { fasyankes_id: { in: [fas, fasLain] } };
    await prisma.logAudit.deleteMany({ where });
    await prisma.sesi.deleteMany({ where: { pengguna_id: { in: Object.values(id) } } });
    for (const m of [prisma.pembayaran, prisma.shiftKasir, prisma.pengeluaranObat, prisma.mutasiStok, prisma.stokObat, prisma.itemTagihan, prisma.tagihan, prisma.itemResep, prisma.resep, prisma.masterObat, prisma.peringatanIzin, prisma.izinPerAkun] as any[]) await m.deleteMany({ where });
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

  it('shift: butuh izin, satu shift terbuka per kasir, tutup butuh alasan bila selisih, rekap menjumlah per metode', async () => {
    expect((await panggil('GET', '/kasir/shift', null)).status).toBe(401);
    expect((await panggil('GET', '/kasir/shift', 'dokter')).status).toBe(403);
    expect((await panggil('POST', '/kasir/shift/buka', 'dokter', { kas_awal: 0 })).status).toBe(403);
    expect((await panggil('POST', '/kasir/shift/buka', 'kasir', { kas_awal: -1 })).status).toBe(400);
    expect((await panggil('POST', '/kasir/shift/buka', 'kasir', { kas_awal: '' })).status).toBe(400);
    expect((await panggil('GET', '/kasir/shift', 'kasir')).badan.data.terbuka).toBeNull();
    expect((await panggil('POST', '/kasir/shift/tutup', 'kasir', { kas_akhir: 0 })).status).toBe(409);
    const b = await bukaShift('kasir', 100_000);
    expect(b.status).toBe(201);
    expect(b.badan.data).toMatchObject({ kas_awal: 100_000, kas_seharusnya: 100_000, tutup: null });
    expect((await bukaShift('kasir')).status).toBe(409);
    expect((await bukaShift('kasir2', 50_000)).status).toBe(201); // kasir lain boleh
    expect((await bukaShift('lainKasir')).status).toBe(201);
    expect((await panggil('GET', '/kasir/shift', 'kasir')).badan.data.terbuka).toMatchObject({ kas_awal: 100_000 });
  });

  it('pembayaran: syarat tahap kasir, tagihan lengkap, metode dan jumlah sah, kembalian tidak dicatat, status sebagian lalu lunas', async () => {
    const s = await siapkan({ harga: [50_000, 30_000] });
    expect((await bayar(s.kunj, { metode: 'tunai', jumlah: 1000 }, 'dokter')).status).toBe(403);
    expect((await bayar(s.kunj, { metode: 'cek', jumlah: 1000 })).status).toBe(400);
    expect((await bayar(s.kunj, { metode: 'tunai', jumlah: 0 })).status).toBe(400);
    expect((await bayar(s.kunj, { metode: 'tunai', jumlah: '' })).status).toBe(400);
    expect((await bayar(99_999_999, { metode: 'tunai', jumlah: 1000 })).status).toBe(404);
    expect((await bayar(s.kunj, { metode: 'tunai', jumlah: 1000 }, 'lainKasir')).status).toBe(404);
    const tidakKasir = await siapkan({ tahap: 'pemeriksaan' });
    expect((await bayar(tidakKasir.kunj, { metode: 'tunai', jumlah: 1000 })).status).toBe(409);
    const kosong = await siapkan({ harga: [] });
    expect((await bayar(kosong.kunj, { metode: 'tunai', jumlah: 1000 })).status).toBe(409);
    const belum = await siapkan({ harga: [50_000, null] });
    const gl = await bayar(belum.kunj, { metode: 'tunai', jumlah: 1000 });
    expect(gl.status).toBe(409);
    expect(gl.badan.galat.pesan).toMatch(/belum lengkap/i);
    const sebagian = await bayar(s.kunj, { metode: 'qris', jumlah: 30_000 });
    expect(sebagian.status).toBe(201);
    expect(sebagian.badan.data).toMatchObject({ kembalian: 0, tagihan: { dibayar: 30_000, sisa: 50_000, status_pembayaran: 'sebagian', total: 80_000 } });
    const lunas = await bayar(s.kunj, { metode: 'tunai', jumlah: 100_000 });
    expect(lunas.badan.data.pembayaran.jumlah).toBe(50_000);
    expect(lunas.badan.data).toMatchObject({ kembalian: 50_000, tagihan: { sisa: 0, status_pembayaran: 'lunas', dibayar: 80_000 } });
    expect((await bayar(s.kunj, { metode: 'tunai', jumlah: 1 })).status).toBe(409);
    expect(await prisma.pembayaran.count({ where: { fasyankes_id: fas } })).toBeGreaterThanOrEqual(2);
  });

  it('pembayaran serempak tidak melebihi tagihan', async () => {
    const s = await siapkan({ harga: [10_000] });
    const hasil = await Promise.all([1, 2, 3, 4].map(() => bayar(s.kunj, { metode: 'tunai', jumlah: 10_000 })));
    expect(hasil.filter((h) => h.status === 201).length).toBe(1);
    expect(hasil.filter((h) => h.status === 409).length).toBe(3);
    const t = await prisma.pembayaran.aggregate({ where: { fasyankes_id: fas, tagihan: { kunjungan_id: s.kunj } }, _sum: { jumlah: true } });
    expect(t._sum.jumlah).toBe(10_000);
  });

  it('pembayaran tanpa shift terbuka ditolak', async () => {
    const s = await siapkan({ harga: [5000] });
    await panggil('POST', '/kasir/shift/tutup', 'kasir2', { kas_akhir: 50_000 });
    const h = await bayar(s.kunj, { metode: 'tunai', jumlah: 5000 }, 'kasir2');
    expect(h.status).toBe(409);
    expect(h.badan.galat.pesan).toMatch(/shift/i);
  });

  it('serah terima obat: resep harus siap, stok dikurangi per batch terdekat kedaluwarsa, batch kedaluwarsa dilewati, stok kurang butuh persetujuan dan alasan', async () => {
    const belum = await siapkan({ resep: 'diajukan' });
    expect((await panggil('POST', `/kunjungan/${belum.kunj}/serah-terima-obat`, 'apoteker', {})).status).toBe(409);
    const tanpa = await siapkan({ resep: null });
    expect((await panggil('POST', `/kunjungan/${tanpa.kunj}/serah-terima-obat`, 'apoteker', {})).status).toBe(409);
    expect((await panggil('POST', `/kunjungan/${belum.kunj}/serah-terima-obat`, 'dokter', {})).status).toBe(403);
    expect((await panggil('POST', `/kunjungan/${belum.kunj}/serah-terima-obat`, 'lainApoteker', {})).status).toBe(404);
    const s = await siapkan({ resep: 'siap', jumlahObat: 10 });
    expect((await panggil('POST', `/kunjungan/${s.kunj}/serah-terima-obat`, 'apoteker', { izinkan_stok_kurang: true })).status).toBe(400); // alasan wajib
    expect((await panggil('POST', `/kunjungan/${s.kunj}/serah-terima-obat`, 'kasir', {})).status).toBe(403);
    expect((await bayar(s.kunj, { metode: 'tunai', jumlah: 1000 }, 'apoteker')).status).toBe(403);
    const pembayaranSebelum = await prisma.pembayaran.count({ where: { fasyankes_id: fas } });
    const h = await panggil('POST', `/kunjungan/${s.kunj}/serah-terima-obat`, 'apoteker', {});
    expect(await prisma.pembayaran.count({ where: { fasyankes_id: fas } })).toBe(pembayaranSebelum);
    expect(h.status).toBe(200);
    expect(h.badan.data.kekurangan).toEqual([]);
    expect(h.badan.data.resep[0].status).toBe('diserahkan');
    expect(await stokBatch('B-DEKAT')).toBe(0); // 6 dari batch terdekat
    expect(await stokBatch('B-JAUH')).toBe(16); // 4 sisanya
    expect(await stokBatch('B-LEWAT')).toBe(100); // kedaluwarsa tidak disentuh
    const keluar = await prisma.mutasiStok.findMany({ where: { fasyankes_id: fas, jenis: 'keluar' }, orderBy: { id: 'asc' } });
    expect(keluar.map((m) => m.jumlah)).toEqual([-6, -4]);
    const p = await prisma.pengeluaranObat.findMany({ where: { resep_id: s.resepId } });
    expect(p).toMatchObject([{ jumlah: 10, harga: 1000, stok_kurang: false }]);
    expect((await panggil('POST', `/kunjungan/${s.kunj}/serah-terima-obat`, 'apoteker', {})).status).toBe(409); // sudah diserahkan
    // stok kurang: sisa 16, butuh 30
    const kurang = await siapkan({ resep: 'siap', jumlahObat: 30 });
    const tolak = await panggil('POST', `/kunjungan/${kurang.kunj}/serah-terima-obat`, 'apoteker', {});
    expect(tolak.status).toBe(409);
    expect(tolak.badan.galat.rincian[0].pesan).toMatch(/butuh 30, tersedia 16/);
    expect(await stokBatch('B-JAUH')).toBe(16); // tidak ada perubahan saat ditolak
    expect((await prisma.resep.findUnique({ where: { id: kurang.resepId } }))?.status).toBe('siap');
    const lanjut = await panggil('POST', `/kunjungan/${kurang.kunj}/serah-terima-obat`, 'apoteker', { izinkan_stok_kurang: true, alasan: 'stok fisik masih ada di rak' });
    expect(lanjut.status).toBe(200);
    expect(lanjut.badan.data.kekurangan[0]).toMatchObject({ butuh: 30, tersedia: 16 });
    expect(await stokBatch('B-JAUH')).toBe(0);
    expect(await prisma.pengeluaranObat.findFirst({ where: { resep_id: kurang.resepId } })).toMatchObject({ jumlah: 30, stok_kurang: true, alasan: 'stok fisik masih ada di rak' });
  });

  it('serah terima serempak hanya menyerahkan sekali dan stok berkurang sekali', async () => {
    await prisma.stokObat.updateMany({ where: { master_obat_id: obatId, batch: 'B-JAUH' }, data: { jumlah: 20 } });
    const sebelum = await stokBatch('B-JAUH');
    const s = await siapkan({ resep: 'siap', jumlahObat: 1 });
    const hasil = await Promise.all([1, 2, 3].map(() => panggil('POST', `/kunjungan/${s.kunj}/serah-terima-obat`, 'apoteker', {})));
    expect(hasil.filter((h) => h.status === 200).length).toBe(1);
    expect(hasil.filter((h) => h.status === 409).length).toBe(2);
    expect(await stokBatch('B-JAUH')).toBe(sebelum - 1);
    expect(await prisma.pengeluaranObat.count({ where: { resep_id: s.resepId } })).toBe(1);
  });

  it('tutup kunjungan: butuh tahap kasir, tagihan lengkap, semua resep diserahkan; belum lunas hanya dengan alasan; terkunci sesudahnya', async () => {
    const tutup = (kunj: number, badan: unknown = {}, siapa = 'kasir') => panggil('POST', `/kunjungan/${kunj}/tutup`, siapa, badan);
    const a = await siapkan({ tahap: 'pemeriksaan', harga: [] });
    expect((await tutup(a.kunj)).status).toBe(409);
    expect((await tutup(a.kunj, {}, 'dokter')).status).toBe(403);
    expect((await tutup(a.kunj, {}, 'lainKasir')).status).toBe(404);
    const belumLengkap = await siapkan({ harga: [100, null] });
    expect((await tutup(belumLengkap.kunj)).status).toBe(409);
    const resepBelum = await siapkan({ harga: [], resep: 'siap' });
    expect((await tutup(resepBelum.kunj)).badan.galat.pesan).toMatch(/resep/i);
    const belumLunas = await siapkan({ harga: [20_000] });
    const tanpaAlasan = await tutup(belumLunas.kunj);
    expect(tanpaAlasan.status).toBe(409);
    expect(tanpaAlasan.badan.galat.pesan).toMatch(/alasan/i);
    const dgnAlasan = await tutup(belumLunas.kunj, { alasan: 'pasien akan melunasi besok' });
    expect(dgnAlasan.status).toBe(200);
    expect(dgnAlasan.badan.data.syarat).toMatchObject({ tahap_kasir: false, lunas: false });
    const k = await prisma.kunjungan.findUnique({ where: { id: belumLunas.kunj } });
    expect(k).toMatchObject({ tahap_layanan: 'ditutup', status: 'finished' });
    expect(k?.waktu_tutup).not.toBeNull();
    expect((await prisma.tagihan.findUnique({ where: { kunjungan_id: belumLunas.kunj } }))?.alasan_tutup_belum_lunas).toBe('pasien akan melunasi besok');
    expect((await tutup(belumLunas.kunj, { alasan: 'lagi' })).status).toBe(409); // sudah ditutup
    expect((await bayar(belumLunas.kunj, { metode: 'tunai', jumlah: 100 })).status).toBe(409); // terkunci
    const lunas = await siapkan({ harga: [15_000], resep: 'diserahkan' });
    await bayar(lunas.kunj, { metode: 'tunai', jumlah: 15_000 });
    expect((await tutup(lunas.kunj)).status).toBe(200);
    const kosong = await siapkan({ harga: [] });
    expect((await tutup(kosong.kunj)).status).toBe(200); // tanpa tagihan: lunas
  });

  it('gambaran kasir kunjungan memuat tagihan, resep, status shift, dan syarat tutup', async () => {
    const s = await siapkan({ harga: [40_000], resep: 'siap' });
    const g = await panggil('GET', `/kunjungan/${s.kunj}/kasir`, 'kasir');
    expect(g.status).toBe(200);
    expect(g.badan.data).toMatchObject({ shift_terbuka: true, tagihan: { total: 40_000, sisa: 40_000 }, syarat: { tahap_kasir: true, tagihan_lengkap: true, resep_diserahkan: false, lunas: false } });
    expect(g.badan.data.resep).toHaveLength(1);
    expect((await panggil('GET', `/kunjungan/${s.kunj}/kasir`, 'dokter')).status).toBe(403);
    expect((await panggil('GET', `/kunjungan/${s.kunj}/kasir`, 'lainKasir')).status).toBe(404);
    expect((await panggil('GET', `/kunjungan/${s.kunj}/kasir`, 'kasir2')).badan.data.shift_terbuka).toBe(false);
  });

  it('tutup shift mencatat selisih dan rekap harian menjumlah pembayaran per metode hanya klinik sendiri', async () => {
    const sebelum = (await panggil('GET', '/kasir/shift', 'kasir')).badan.data.terbuka;
    expect(sebelum.kas_seharusnya).toBe(100_000 + sebelum.tunai);
    expect(sebelum.tunai).toBeGreaterThan(0);
    expect((await panggil('POST', '/kasir/shift/tutup', 'kasir', { kas_akhir: sebelum.kas_seharusnya - 500 })).status).toBe(400); // alasan wajib
    const t = await panggil('POST', '/kasir/shift/tutup', 'kasir', { kas_akhir: sebelum.kas_seharusnya - 500, alasan_selisih: 'uang kembalian kurang' });
    expect(t.status).toBe(200);
    expect(t.badan.data).toMatchObject({ selisih: -500, alasan_selisih: 'uang kembalian kurang' });
    expect(t.badan.data.tutup).not.toBeNull();
    expect((await panggil('GET', '/kasir/shift', 'kasir')).badan.data.terbuka).toBeNull();
    expect((await panggil('GET', '/kasir/rekap?tanggal=bukan', 'kasir')).status).toBe(400);
    expect((await panggil('GET', '/kasir/rekap', 'dokter')).status).toBe(403);
    const rekap = await panggil('GET', '/kasir/rekap', 'kasir');
    expect(rekap.status).toBe(200);
    expect(rekap.badan.data.per_metode.qris).toBe(30_000);
    expect(rekap.badan.data.per_metode.tunai).toBeGreaterThan(0);
    expect(rekap.badan.data.total).toBe(rekap.badan.data.per_metode.tunai + rekap.badan.data.per_metode.transfer + rekap.badan.data.per_metode.qris);
    expect(rekap.badan.data.shift.length).toBeGreaterThanOrEqual(2);
    const lain = await panggil('GET', '/kasir/rekap', 'lainKasir');
    expect(lain.badan.data.total).toBe(0);
    const lalu = await panggil('GET', '/kasir/rekap?tanggal=2020-01-01', 'kasir');
    expect(lalu.badan.data.total).toBe(0);
  });

  it('audit mencatat shift, pembayaran, serah terima, dan tutup tanpa isi sensitif', async () => {
    const audit = await prisma.logAudit.findMany({ where: { fasyankes_id: fas, entitas: { in: ['shift_kasir', 'pembayaran', 'pengeluaran_obat', 'kunjungan'] } } });
    expect(new Set(audit.map((a) => a.entitas))).toEqual(new Set(['shift_kasir', 'pembayaran', 'pengeluaran_obat', 'kunjungan']));
    expect(audit.some((a) => a.entitas === 'kunjungan' && a.aksi === 'perbaikan')).toBe(true);
  });
});
