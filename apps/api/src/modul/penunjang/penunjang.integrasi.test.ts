/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { AddressInfo } from 'net';
import { PrismaClient } from '@prisma/client';

const urlUji = process.env.DATABASE_URL_UJI;
const d = urlUji ? describe : describe.skip;

d('penunjang, addendum, tagihan, dan persetujuan terhadap klira_uji', () => {
  const prisma = new PrismaClient({ datasourceUrl: urlUji });
  const kode = `UJI-PNJ-${Date.now()}`;
  let server: any;
  let fas = 0;
  let fasLain = 0;
  let pasienA = 0;
  let pasienB = 0;
  let kunjA = 0;
  let kunjB = 0;
  let kunjTutup = 0;
  let kunjLain = 0;
  let m1 = 0;
  let m2 = 0;
  let mNonaktif = 0;
  let tarifId = 0;
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
  async function buatPengguna(kunci: string, nik: string, izin: [string, string][], fasId = fas, profesi = false) {
    const { hashKataSandi } = require('@klira/db');
    const u = await prisma.pengguna.create({
      data: { fasyankes_id: fasId, nama: `Nama ${kunci}`, nik, username: `${kode}-${kunci}`, kata_sandi_hash: await hashKataSandi('sandi-uji-1'), wajib_ganti_kredensial: false },
    });
    id[kunci] = u.id;
    if (profesi) await prisma.profilProfesi.create({ data: { fasyankes_id: fasId, pengguna_id: u.id, profesi: 'Perawat' } });
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
  const buatPasien = (fasId: number, rm: string, nama: string, ekstra: object = {}) =>
    prisma.pasien.create({ data: { fasyankes_id: fasId, nomor_rm: rm, nama, tanggal_lahir: new Date('1980-01-01'), jenis_kelamin: 'perempuan', ...ekstra } }).then((p) => p.id);
  const buatKunjungan = (fasId: number, pasienId: number, tahap: 'menunggu_skrining' | 'pemeriksaan' | 'ditutup' = 'pemeriksaan', cara: 'umum' | 'jkn' = 'umum') =>
    prisma.kunjungan.create({ data: { fasyankes_id: fasId, pasien_id: pasienId, jenis: 'AMB', tahap_layanan: tahap, cara_pembayaran: cara } }).then((k) => k.id);
  const pesan = (kunj: number, ids: number[], siapa = 'dokter', ekstra: object = {}) => panggil('POST', `/kunjungan/${kunj}/penunjang/order`, siapa, { pemeriksaan_ids: ids, ...ekstra });
  const spesimen = (idOrder: number, siapa = 'analis') => panggil('POST', `/penunjang/order/${idOrder}/spesimen`, siapa, { asal: 'Darah vena', waktu_ambil: new Date().toISOString() });
  const hasil = (idOrder: number, nilai = '14', siapa = 'analis') => panggil('PUT', `/penunjang/order/${idOrder}/hasil`, siapa, { nilai, interpretasi: 'normal' });
  const validasi = (idOrder: number, siapa = 'analis') => panggil('POST', `/penunjang/order/${idOrder}/validasi`, siapa);
  const orders = async (kunj: number, siapa = 'dokter') => (await panggil('GET', `/kunjungan/${kunj}/penunjang/order`, siapa)).badan.data as any[];
  const hariIni = () => new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);

  const DOKTER: [string, string][] = [['klinis', 'lihat'], ['klinis', 'input'], ['klinis', 'perbaikan'], ['kunjungan', 'perbaikan'], ['pasien', 'lihat'], ['penunjang', 'lihat'], ['persetujuan', 'input']];
  const ANALIS: [string, string][] = [['penunjang', 'lihat'], ['penunjang', 'input'], ['penunjang', 'perbaikan'], ['pasien', 'lihat']];

  beforeAll(async () => {
    process.env.DATABASE_URL = urlUji;
    fas = await buatFasyankes(kode, 'Uji Penunjang');
    fasLain = await buatFasyankes(`${kode}-LAIN`, 'Uji Penunjang Lain');
    const { buatApp } = require('../../app');
    server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
    await buatPengguna('dokter', '9970000000000001', DOKTER, fas, true);
    await buatPengguna('analis', '9970000000000002', ANALIS, fas, true);
    await buatPengguna('kasir', '9970000000000003', [['kasir', 'lihat']]);
    await buatPengguna('biasa', '9970000000000004', [['kunjungan', 'lihat']]);
    await buatPengguna('tanpaProfesi', '9970000000000005', [['klinis', 'lihat']]);
    await buatPengguna('lainAnalis', '9970000000000006', ANALIS, fasLain);
    await buatPengguna('lainDokter', '9970000000000007', DOKTER, fasLain);
    pasienA = await buatPasien(fas, `${kode}-A`, 'Budi Penunjang');
    pasienB = await buatPasien(fas, `${kode}-B`, 'Anak Penunjang', { tidak_cakap: true });
    const pasienLain = await buatPasien(fasLain, `${kode}-L`, 'Pasien Lain');
    kunjA = await buatKunjungan(fas, pasienA);
    kunjB = await buatKunjungan(fas, pasienB);
    kunjTutup = await buatKunjungan(fas, await buatPasien(fas, `${kode}-T`, 'Pasien Tutup'), 'ditutup');
    kunjLain = await buatKunjungan(fasLain, pasienLain);
    const tarif = await prisma.tarifLayanan.create({ data: { fasyankes_id: fas, kode: `${kode}-HB`, nama: 'Tarif Hb uji', jenis: 'lab', harga_umum: 30_000, harga_jkn: 20_000 } });
    tarifId = tarif.id;
    for (const k of ['dokter', 'analis', 'kasir', 'biasa', 'tanpaProfesi', 'lainAnalis', 'lainDokter']) await login(k);
  });

  afterAll(async () => {
    server?.close();
    const where = { fasyankes_id: { in: [fas, fasLain] } };
    await prisma.logAudit.deleteMany({ where });
    await prisma.sesi.deleteMany({ where: { pengguna_id: { in: Object.values(id) } } });
    await prisma.peringatanIzin.deleteMany({ where });
    for (const m of [
      prisma.hasilPenunjang, prisma.spesimen, prisma.itemTagihan, prisma.orderPenunjang, prisma.tagihan, prisma.addendum, prisma.masterPemeriksaan, prisma.tarifLayanan, prisma.persetujuan,
      prisma.waliKeluarga, prisma.diagnosis, prisma.versiCatatan, prisma.pengesahanCatatan, prisma.draf, prisma.profilProfesi,
    ] as any[]) {
      await m.deleteMany({ where });
    }
    await prisma.teksPersetujuan.deleteMany({ where: { fasyankes_id: { in: [fas, fasLain] } } });
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

  it('master pemeriksaan: analis membuat dan mengubah, dokter hanya membaca, kode ganda dan tarif luar klinik ditolak', async () => {
    const tarifLain = await prisma.tarifLayanan.create({ data: { fasyankes_id: fasLain, kode: `${kode}-X`, nama: 'Tarif lain', jenis: 'lab', harga_umum: 1 } });
    const dasar = { kode: 'HB', nama: 'Hemoglobin', kode_loinc: '718-7', satuan: 'g/dL', rujukan_min: '12,0', rujukan_maks: 16, jenis_spesimen: 'Darah vena', tarif_layanan_id: tarifId };
    expect((await panggil('POST', '/penunjang/master', null, dasar)).status).toBe(401);
    expect((await panggil('POST', '/penunjang/master', 'dokter', dasar)).status).toBe(403);
    expect((await panggil('POST', '/penunjang/master', 'analis', { ...dasar, kode_loinc: 'salah' })).status).toBe(400);
    expect((await panggil('POST', '/penunjang/master', 'analis', { ...dasar, rujukan_min: 20 })).status).toBe(400);
    expect((await panggil('POST', '/penunjang/master', 'analis', { ...dasar, tarif_layanan_id: tarifLain.id })).status).toBe(400);
    const a = await panggil('POST', '/penunjang/master', 'analis', dasar);
    expect(a.status).toBe(201);
    expect(a.badan.data).toMatchObject({ kode: 'HB', rujukan_min: 12, rujukan_maks: 16, loinc_contoh: false, aktif: true, tarif: { harga_umum: 30_000, harga_jkn: 20_000 } });
    m1 = a.badan.data.id;
    expect((await panggil('POST', '/penunjang/master', 'analis', dasar)).status).toBe(409);
    m2 = (await panggil('POST', '/penunjang/master', 'analis', { kode: 'GDS', nama: 'Glukosa sewaktu', satuan: 'mg/dL', rujukan_maks: 200 })).badan.data.id;
    mNonaktif = (await panggil('POST', '/penunjang/master', 'analis', { kode: 'LAMA', nama: 'Pemeriksaan lama' })).badan.data.id;
    expect((await panggil('PATCH', `/penunjang/master/${mNonaktif}`, 'analis', { aktif: false })).badan.data.aktif).toBe(false);
    expect((await panggil('PATCH', `/penunjang/master/${m2}`, 'analis', { rujukan_min: 300 })).status).toBe(400); // melebihi maksimum tersimpan
    expect((await panggil('PATCH', `/penunjang/master/${m2}`, 'analis', {})).status).toBe(400);
    expect((await panggil('PATCH', `/penunjang/master/${m2}`, 'dokter', { nama: 'x' })).status).toBe(403);
    expect((await panggil('PATCH', `/penunjang/master/${m2}`, 'lainAnalis', { nama: 'x' })).status).toBe(404);
    expect((await panggil('DELETE', `/penunjang/master/${m2}`, 'analis')).status).toBe(404);
    const daftar = await panggil('GET', '/penunjang/master?aktif=true', 'dokter');
    expect(daftar.status).toBe(200);
    expect(daftar.badan.data.map((x: any) => x.kode).sort()).toEqual(['GDS', 'HB']);
    expect((await panggil('GET', '/penunjang/master', 'lainAnalis')).badan.data).toEqual([]);
    expect((await panggil('GET', '/penunjang/master', 'biasa')).status).toBe(403);
  });

  it('order lab: hanya pemilik izin klinis input, satu order per pemeriksaan, tagihan item dibuat saat order dari tarif', async () => {
    expect((await pesan(kunjA, [m1], 'analis')).status).toBe(403);
    expect((await pesan(kunjA, [m1], 'biasa')).status).toBe(403);
    expect((await pesan(kunjLain, [m1])).status).toBe(404);
    expect((await pesan(kunjA, [])).status).toBe(400);
    expect((await pesan(kunjA, [mNonaktif])).status).toBe(400);
    expect((await pesan(kunjA, [999999999])).status).toBe(400);
    expect((await pesan(kunjTutup, [m1])).status).toBe(409);
    const r = await pesan(kunjA, [m1, m2], 'dokter', { prioritas: 'segera', catatan: 'puasa' });
    expect(r.status).toBe(201);
    expect(r.badan.data.order.map((o: any) => [o.nama, o.status, o.prioritas, o.catatan])).toEqual([['Hemoglobin', 'dipesan', 'segera', 'puasa'], ['Glukosa sewaktu', 'dipesan', 'segera', 'puasa']]);
    // tagihan: Hb bertarif, glukosa tanpa tarif -> tagihan belum lengkap
    expect(r.badan.data.tagihan).toMatchObject({ status_tagihan: 'belum_lengkap', status_pembayaran: 'belum', total: 30_000 });
    const t = await panggil('GET', `/kunjungan/${kunjA}/tagihan`, 'kasir');
    expect(t.status).toBe(200);
    expect(t.badan.data.item).toHaveLength(2);
    expect(t.badan.data.item.find((i: any) => i.nama === 'Hemoglobin')).toMatchObject({ jenis: 'lab', harga: 30_000, jumlah: 1 });
    expect(t.badan.data.item.find((i: any) => i.nama === 'Glukosa sewaktu').harga).toBeNull();
    expect((await panggil('GET', `/kunjungan/${kunjA}/tagihan`, 'lainAnalis')).status).toBe(403);
    expect((await panggil('GET', `/kunjungan/${kunjA}/tagihan`, 'lainDokter')).status).toBe(404);
    // harga JKN dipakai untuk kunjungan JKN; tagihan satu per kunjungan
    const kunjJkn = await buatKunjungan(fas, await buatPasien(fas, `${kode}-J`, 'Pasien JKN'), 'pemeriksaan', 'jkn');
    const j = await pesan(kunjJkn, [m1]);
    expect(j.badan.data.tagihan).toMatchObject({ status_tagihan: 'lengkap', total: 20_000 });
    expect(await prisma.tagihan.count({ where: { kunjungan_id: kunjA } })).toBe(1);
    // tambah order kemudian memakai tagihan yang sama (lab tidak menunggu tutup kunjungan)
    const tambah = await pesan(kunjA, [m1]);
    expect(tambah.status).toBe(201);
    expect(tambah.badan.data.tagihan.total).toBe(60_000);
    expect(await prisma.tagihan.count({ where: { kunjungan_id: kunjA } })).toBe(1);
    expect((await panggil('GET', `/kunjungan/${kunjA}/tagihan`, 'kasir')).badan.data.item).toHaveLength(3);
  });

  it('Daftar pasien memuat jumlah order yang menunggu spesimen dan hasil', async () => {
    const r = await panggil('GET', `/pasien?cari=${encodeURIComponent('Budi Penunjang')}&tahap=semua`, 'dokter');
    expect(r.status).toBe(200);
    expect(r.badan.data.data[0].kunjungan.lab).toEqual({ perlu_spesimen: 3, perlu_hasil: 0 });
  });

  it('urutan status maju-saja: hasil sebelum spesimen ditolak, spesimen sekali, hasil boleh diulang, validasi sekali', async () => {
    const [hb] = (await orders(kunjA)).filter((o) => o.nama === 'Hemoglobin');
    expect((await hasil(hb.id)).status).toBe(409);
    expect((await validasi(hb.id)).status).toBe(409);
    expect((await spesimen(hb.id, 'dokter')).status).toBe(403);
    expect((await spesimen(hb.id, 'lainAnalis')).status).toBe(404);
    expect((await panggil('POST', `/penunjang/order/${hb.id}/spesimen`, 'analis', { asal: ' ', waktu_ambil: new Date().toISOString() })).status).toBe(400);
    expect((await panggil('POST', `/penunjang/order/${hb.id}/spesimen`, 'analis', { asal: 'Darah', waktu_ambil: new Date().toISOString(), petugas_id: 999999999 })).status).toBe(400);
    const s = await spesimen(hb.id);
    expect(s.status).toBe(200);
    expect(s.badan.data).toMatchObject({ status: 'spesimen_diambil', spesimen: { asal: 'Darah vena', petugas_id: id.analis } });
    expect((await spesimen(hb.id)).status).toBe(409);
    expect((await validasi(hb.id)).status).toBe(409); // belum ada hasil
    expect((await panggil('PUT', `/penunjang/order/${hb.id}/hasil`, 'analis', { nilai: '', interpretasi: 'normal' })).status).toBe(400);
    expect((await panggil('PUT', `/penunjang/order/${hb.id}/hasil`, 'analis', { nilai: '14', interpretasi: 'aneh' })).status).toBe(400);
    const h1 = await hasil(hb.id, '9,5');
    expect(h1.badan.data).toMatchObject({ status: 'menunggu_hasil', hasil: { nilai: '9,5', satuan: 'g/dL', rujukan_teks: '12 - 16 g/dL', validator_nama: null } });
    expect((await hasil(hb.id, '14')).badan.data.hasil.nilai).toBe('14'); // boleh diisi ulang sebelum validasi
    expect((await validasi(hb.id, 'dokter')).status).toBe(403);
    const v = await validasi(hb.id);
    expect(v.status).toBe(200);
    expect(v.badan.data).toMatchObject({ status: 'divalidasi', verifikasi: 'sah', hasil: { validator_nama: 'Nama analis' }, pengesahan: { versi: 1, pengguna_id: id.analis, jenis_akun: 'Jenis analis' }, addendum: [] });
    expect(v.badan.data.pengesahan.hash).toMatch(/^[0-9a-f]{64}$/);
    expect((await validasi(hb.id)).status).toBe(409);
    expect((await hasil(hb.id, '15')).status).toBe(409);
    expect((await spesimen(hb.id)).status).toBe(409);
    // hasil sebelum catatan disahkan: bukan addendum, dokter melihatnya di pemeriksaan
    expect(await prisma.addendum.count({ where: { fasyankes_id: fas } })).toBe(0);
    const lihat = (await orders(kunjA, 'dokter')).find((o) => o.id === hb.id);
    expect(lihat).toMatchObject({ status: 'divalidasi', hasil: { nilai: '14', interpretasi: 'normal' } });
  });

  it('verifikasi hasil: perubahan langsung di basis data terdeteksi', async () => {
    const [hb] = (await orders(kunjA)).filter((o) => o.status === 'divalidasi');
    const v = await panggil('GET', `/pengesahan/hasil_penunjang/${hb.id}`, 'dokter');
    expect(v.badan.data).toMatchObject({ status: 'sah', versi: 1 });
    await prisma.hasilPenunjang.update({ where: { order_id: hb.id }, data: { nilai: '99' } });
    expect((await panggil('GET', `/pengesahan/hasil_penunjang/${hb.id}`, 'dokter')).badan.data.status).toBe('berubah');
    expect((await orders(kunjA)).find((o) => o.id === hb.id).verifikasi).toBe('berubah');
    await prisma.hasilPenunjang.update({ where: { order_id: hb.id }, data: { nilai: '14' } });
    expect((await panggil('GET', `/pengesahan/hasil_penunjang/${hb.id}`, 'dokter')).badan.data.status).toBe('sah');
  });

  it('hasil setelah catatan disahkan menjadi addendum: versi catatan, pengesahan baru, penanda kirim ulang, catatan lama tidak berubah', async () => {
    const diag = await panggil('PUT', `/kunjungan/${kunjA}/klinis/diagnosis`, 'dokter', { isi: { item: [{ kode: 'E11.9', nama: 'DM tipe 2', peran: 'utama' }] } });
    expect(diag.status).toBe(200);
    const hashDiagnosis = diag.badan.data.bagian.pengesahan.hash;
    const gds = (await orders(kunjA)).find((o) => o.nama === 'Glukosa sewaktu');
    await spesimen(gds.id);
    await panggil('PUT', `/penunjang/order/${gds.id}/hasil`, 'analis', { nilai: '250', interpretasi: 'tinggi', catatan: 'perlu kontrol' });
    const v = await validasi(gds.id);
    expect(v.status).toBe(200);
    expect(v.badan.data.addendum).toHaveLength(1);
    expect(v.badan.data.addendum[0]).toMatchObject({
      entitas: 'hasil_penunjang', entitas_id: gds.id, versi: 1, perlu_kirim_ulang: true, dikirim_pada: null, verifikasi: 'sah', dibuat_oleh_nama: 'Nama analis',
      isi: { pemeriksaan: 'Glukosa sewaktu', nilai: '250', interpretasi: 'tinggi', satuan: 'mg/dL' }, pengesahan: { versi: 1, pengguna_id: id.analis },
    });
    // catatan klinis yang sudah disahkan tidak tersentuh
    const klinis = (await panggil('GET', `/kunjungan/${kunjA}/klinis`, 'dokter')).badan.data.bagian.diagnosis;
    expect(klinis).toMatchObject({ verifikasi: 'sah', pengesahan: { versi: 1, hash: hashDiagnosis } });
    // versi catatan kunjungan bertambah, pengesahan baru ada untuk addendum
    const versi = await prisma.versiCatatan.findMany({ where: { entitas: 'kunjungan', entitas_id: kunjA } });
    expect(versi).toHaveLength(1);
    expect(versi[0]).toMatchObject({ versi: 1, disetujui_oleh: null });
    expect(await prisma.pengesahanCatatan.count({ where: { entitas: 'addendum', entitas_id: v.badan.data.addendum[0].id } })).toBe(1);
    // daftar addendum kunjungan
    const daftar = await panggil('GET', `/kunjungan/${kunjA}/addendum`, 'dokter');
    expect(daftar.status).toBe(200);
    expect(daftar.badan.data).toHaveLength(1);
    expect((await panggil('GET', `/kunjungan/${kunjA}/addendum`, 'lainDokter')).status).toBe(404);
    expect((await panggil('GET', `/kunjungan/${kunjA}/addendum`, 'biasa')).status).toBe(403);
    expect((await panggil('DELETE', `/kunjungan/${kunjA}/addendum`, 'dokter')).status).toBe(404);
    // isi addendum diubah diam-diam: terdeteksi
    await prisma.addendum.update({ where: { id: daftar.badan.data[0].id }, data: { isi: { palsu: true } } });
    expect((await panggil('GET', `/kunjungan/${kunjA}/addendum`, 'dokter')).badan.data[0].verifikasi).toBe('berubah');
  });

  it('hasil setelah pemeriksaan selesai (kasir) juga menjadi addendum; hasil sebelum disahkan tidak', async () => {
    const kasirKunj = await buatKunjungan(fas, await buatPasien(fas, `${kode}-K`, 'Pasien Kasir'), 'kasir');
    const o = (await pesan(kasirKunj, [m1])).badan.data.order[0];
    await spesimen(o.id);
    await hasil(o.id, '13');
    const v = await validasi(o.id);
    expect(v.badan.data.addendum).toHaveLength(1);
    const awal = await buatKunjungan(fas, await buatPasien(fas, `${kode}-M`, 'Pasien Awal'), 'menunggu_skrining');
    const o2 = (await pesan(awal, [m1])).badan.data.order[0];
    await spesimen(o2.id);
    await hasil(o2.id, '13');
    expect((await validasi(o2.id)).badan.data.addendum).toEqual([]);
  });

  it('rekap lab: filter status dan tanggal, jumlah per status, terbatas fasyankes sendiri', async () => {
    const semua = await panggil('GET', '/penunjang/rekap', 'analis');
    expect(semua.status).toBe(200);
    expect(semua.badan.data.total).toBeGreaterThanOrEqual(6);
    expect(semua.badan.data.jumlah_status.divalidasi).toBeGreaterThanOrEqual(3);
    const dipesan = await panggil('GET', '/penunjang/rekap?status=dipesan', 'analis');
    expect(dipesan.badan.data.data.every((b: any) => b.status === 'dipesan')).toBe(true);
    expect(dipesan.badan.data.data[0]).toMatchObject({ pasien_nama: expect.any(String), pasien_nomor_rm: expect.any(String) });
    const validasiHasil = await panggil('GET', '/penunjang/rekap?status=divalidasi', 'dokter');
    expect(validasiHasil.badan.data.data.some((b: any) => b.nama === 'Hemoglobin' && b.hasil_singkat === '14 g/dL')).toBe(true);
    expect((await panggil('GET', `/penunjang/rekap?dari=${hariIni()}&sampai=${hariIni()}`, 'analis')).badan.data.total).toBe(semua.badan.data.total);
    expect((await panggil('GET', '/penunjang/rekap?dari=2020-01-01&sampai=2020-01-02', 'analis')).badan.data.total).toBe(0);
    expect((await panggil('GET', '/penunjang/rekap?status=salah', 'analis')).status).toBe(400);
    expect((await panggil('GET', '/penunjang/rekap', 'lainAnalis')).badan.data.total).toBe(0);
    expect((await panggil('GET', '/penunjang/rekap', 'biasa')).status).toBe(403);
  });

  it('draf hasil lab disimpan di server per pengguna dan tidak ikut terhapus saat pemeriksaan selesai', async () => {
    expect((await panggil('PUT', `/kunjungan/${kunjA}/draf/hasil-lab`, 'analis', { langkah: 1, isi: { nilai: { 1: '12' } } })).status).toBe(200);
    expect((await panggil('GET', `/kunjungan/${kunjA}/draf/hasil-lab`, 'analis')).badan.data).toMatchObject({ langkah: 1, alur: 'hasil-lab' });
    expect((await panggil('GET', `/kunjungan/${kunjA}/draf/hasil-lab`, 'dokter')).badan.data).toBeNull();
    expect((await panggil('GET', `/kunjungan/${kunjA}/draf/hasil-lab`, 'biasa')).status).toBe(403);
    expect((await panggil('PUT', `/kunjungan/${kunjTutup}/draf/hasil-lab`, 'analis', { langkah: 0, isi: {} })).status).toBe(409);
    expect((await panggil('DELETE', `/kunjungan/${kunjA}/draf/hasil-lab`, 'analis')).status).toBe(200);
  });

  it('persetujuan tindakan: teks berversi, penandatangan pasien atau wali, saksi nakes, tidak cakap wajib wali', async () => {
    const teks = await prisma.teksPersetujuan.create({ data: { fasyankes_id: fas, jenis: 'tindakan', versi: 1, judul: 'Teks uji', tujuan: 'Tujuan uji', isi: 'Isi uji', aktif: true } });
    const wali = await prisma.waliKeluarga.create({ data: { fasyankes_id: fas, pasien_id: pasienB, hubungan: 'Ibu', nama: 'Ibu Anak' } });
    const dasar = { tindakan_nama: 'Insisi abses', tindakan_kode: '86.04', penjelasan: 'Risiko, alternatif, dan prognosis dijelaskan.', bentuk: 'tertulis', penandatangan: 'pasien', saksi_pengguna_id: id.analis, teks_persetujuan_id: teks.id };
    expect((await panggil('GET', `/kunjungan/${kunjA}/persetujuan-tindakan/siap`, 'analis')).status).toBe(403);
    expect((await panggil('GET', `/kunjungan/${kunjLain}/persetujuan-tindakan/siap`, 'dokter')).status).toBe(404);
    const siap = await panggil('GET', `/kunjungan/${kunjA}/persetujuan-tindakan/siap`, 'dokter');
    expect(siap.status).toBe(200);
    expect(siap.badan.data.teks).toMatchObject({ id: teks.id, versi: 1 });
    expect(siap.badan.data.saksi.map((s: any) => s.id).sort()).toEqual([id.analis, id.dokter].sort());
    expect(siap.badan.data.saksi.some((s: any) => s.id === id.tanpaProfesi)).toBe(false);
    expect((await panggil('POST', `/kunjungan/${kunjA}/persetujuan-tindakan`, 'analis', dasar)).status).toBe(403);
    expect((await panggil('POST', `/kunjungan/${kunjA}/persetujuan-tindakan`, 'dokter', { ...dasar, penjelasan: ' ' })).status).toBe(400);
    expect((await panggil('POST', `/kunjungan/${kunjA}/persetujuan-tindakan`, 'dokter', { ...dasar, saksi_pengguna_id: id.tanpaProfesi })).status).toBe(400);
    expect((await panggil('POST', `/kunjungan/${kunjA}/persetujuan-tindakan`, 'dokter', { ...dasar, saksi_pengguna_id: id.lainDokter })).status).toBe(400);
    expect((await panggil('POST', `/kunjungan/${kunjLain}/persetujuan-tindakan`, 'dokter', dasar)).status).toBe(404);
    const ok = await panggil('POST', `/kunjungan/${kunjA}/persetujuan-tindakan`, 'dokter', dasar);
    expect(ok.status).toBe(201);
    expect(ok.badan.data).toMatchObject({ tindakan_nama: 'Insisi abses', versi_teks: 1, bentuk: 'tertulis', penandatangan: 'pasien', penandatangan_nama: 'Budi Penunjang', saksi_nama: 'Nama analis', status: 'diberikan' });
    const baris = await prisma.persetujuan.findFirstOrThrow({ where: { id: ok.badan.data.id } });
    expect(baris).toMatchObject({ jenis: 'tindakan', kunjungan_id: kunjA, pasien_id: pasienA, teks_persetujuan_id: teks.id, saksi_pengguna_id: id.analis, dibuat_oleh: id.dokter });
    // pasien tidak cakap: wajib wali dan wali harus milik pasien
    expect((await panggil('POST', `/kunjungan/${kunjB}/persetujuan-tindakan`, 'dokter', dasar)).status).toBe(400);
    expect((await panggil('POST', `/kunjungan/${kunjB}/persetujuan-tindakan`, 'dokter', { ...dasar, penandatangan: 'wali' })).status).toBe(400);
    const dariWali = await panggil('POST', `/kunjungan/${kunjB}/persetujuan-tindakan`, 'dokter', { ...dasar, penandatangan: 'wali', wali_id: wali.id, bentuk: 'lisan' });
    expect(dariWali.status).toBe(201);
    expect(dariWali.badan.data).toMatchObject({ penandatangan: 'wali', penandatangan_nama: 'Ibu Anak', bentuk: 'lisan' });
    expect((await panggil('POST', `/kunjungan/${kunjA}/persetujuan-tindakan`, 'dokter', { ...dasar, penandatangan: 'wali', wali_id: wali.id })).status).toBe(400);
    expect((await panggil('POST', `/kunjungan/${kunjTutup}/persetujuan-tindakan`, 'dokter', dasar)).status).toBe(409);
    // daftar dan tidak ada ubah atau hapus
    const daftar = await panggil('GET', `/kunjungan/${kunjA}/persetujuan-tindakan`, 'dokter');
    expect(daftar.badan.data).toHaveLength(1);
    expect((await panggil('GET', `/kunjungan/${kunjA}/persetujuan-tindakan`, 'biasa')).status).toBe(403);
    expect((await panggil('DELETE', `/kunjungan/${kunjA}/persetujuan-tindakan/${ok.badan.data.id}`, 'dokter')).status).toBe(404);
    expect((await panggil('PUT', `/kunjungan/${kunjA}/persetujuan-tindakan/${ok.badan.data.id}`, 'dokter', dasar)).status).toBe(404);
  });

  it('audit mencatat order, spesimen, hasil, validasi, persetujuan, dan pembukaan data', async () => {
    const aksiUntuk = async (entitas: string) => new Set((await prisma.logAudit.findMany({ where: { fasyankes_id: fas, entitas } })).map((b) => b.aksi));
    expect((await aksiUntuk('order_penunjang')).has('input')).toBe(true);
    expect((await aksiUntuk('order_penunjang')).has('lihat')).toBe(true);
    expect((await aksiUntuk('spesimen')).has('input')).toBe(true);
    expect(await aksiUntuk('hasil_penunjang')).toEqual(new Set(['input', 'perbaikan']));
    expect((await aksiUntuk('master_pemeriksaan'))).toEqual(new Set(['input', 'perbaikan']));
    expect((await aksiUntuk('persetujuan')).has('input')).toBe(true);
    expect((await aksiUntuk('addendum')).has('lihat')).toBe(true);
    expect((await aksiUntuk('tagihan')).has('lihat')).toBe(true);
  });
});
