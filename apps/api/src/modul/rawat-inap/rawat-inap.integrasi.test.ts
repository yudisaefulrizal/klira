/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { AddressInfo } from 'net';
import { PrismaClient } from '@prisma/client';

const urlUji = process.env.DATABASE_URL_UJI;
const d = urlUji ? describe : describe.skip;

d('rawat inap (admisi, penempatan, CPPT, pemulangan) terhadap klira_uji', () => {
  const prisma = new PrismaClient({ datasourceUrl: urlUji });
  const kode = `UJI-RI-${Date.now()}`;
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
  const buatLokasi = (fasId: number, nama: string, jenis: 'ruang' | 'bed', indukId: number | null = null) => prisma.lokasi.create({ data: { fasyankes_id: fasId, nama, jenis: jenis as any, induk_id: indukId } });
  let ruang = 0;
  const bedBaru = async (nama: string) => (await buatLokasi(fas, `${kode}-${nama}`, 'bed', ruang)).id;
  let nomor = 0;
  const pasienBaru = async (fasId = fas) => {
    nomor += 1;
    return (await prisma.pasien.create({ data: { fasyankes_id: fasId, nomor_rm: `${kode}-${nomor}`, nama: `Pasien ${nomor}`, tanggal_lahir: new Date('1980-01-01'), jenis_kelamin: 'perempuan' } })).id;
  };
  let tarifId = 0;
  const KLINIS: [string, string][] = [['klinis', 'lihat'], ['klinis', 'input'], ['pasien', 'lihat']];
  const admisi = (pasienId: number, extra: Record<string, unknown> = {}, siapa = 'dokter') => panggil('POST', '/rawat-inap/admisi', siapa, { pasien_id: pasienId, kelas: 'dua', dpjp_id: id.dokter, ...extra });
  const ringkasanPulang = { disposisi: 'home', kondisi_pulang: 'Membaik', diagnosis_akhir: 'I10 Hipertensi', ringkasan: 'Dirawat 2 hari, tekanan darah terkendali.', tindak_lanjut: 'Kontrol 1 minggu', terapi: 'Amlodipin' };

  beforeAll(async () => {
    process.env.DATABASE_URL = urlUji;
    fas = await buatFasyankes(kode, 'Uji Rawat Inap');
    fasLain = await buatFasyankes(`${kode}-LAIN`, 'Uji RI Lain');
    const { buatApp } = require('../../app');
    server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
    await buatPengguna('dokter', '9962000000000001', KLINIS);
    await buatPengguna('dokter2', '9962000000000002', KLINIS);
    await buatPengguna('kasir', '9962000000000005', [['kasir', 'lihat']]);
    await buatPengguna('lainDokter', '9962000000000007', KLINIS, fasLain);
    for (const k of ['dokter', 'dokter2']) await prisma.profilProfesi.create({ data: { fasyankes_id: fas, pengguna_id: id[k], profesi: 'Dokter umum' } });
    for (const k of ['dokter', 'dokter2', 'kasir', 'lainDokter']) await login(k);
    ruang = (await buatLokasi(fas, `${kode}-Ruang Mawar`, 'ruang')).id;
    tarifId = (await prisma.tarifLayanan.create({ data: { fasyankes_id: fas, kode: `KAMAR-${kode}`, nama: 'Kamar kelas 2', jenis: 'kamar', harga_umum: 150_000, harga_jkn: 100_000 } })).id;
  });

  afterAll(async () => {
    server?.close();
    const where = { fasyankes_id: { in: [fas, fasLain] } };
    await prisma.logAudit.deleteMany({ where });
    await prisma.sesi.deleteMany({ where: { pengguna_id: { in: Object.values(id) } } });
    await prisma.itemTagihan.deleteMany({ where });
    await prisma.pembayaran.deleteMany({ where });
    await prisma.shiftKasir.deleteMany({ where });
    await prisma.tagihan.deleteMany({ where });
    for (const m of [prisma.penempatan, prisma.catatanHarian, prisma.pemulangan, prisma.resumeMedis, prisma.versiCatatan, prisma.pengesahanCatatan, prisma.pesertaKunjungan, prisma.peringatanIzin, prisma.izinPerAkun, prisma.antrean] as any[]) await m.deleteMany({ where });
    await prisma.kunjungan.updateMany({ where, data: { kunjungan_asal_id: null } });
    await prisma.kunjungan.deleteMany({ where });
    await prisma.tarifLayanan.deleteMany({ where });
    await prisma.lokasi.deleteMany({ where: { ...where, jenis: 'bed' as any } });
    await prisma.lokasi.deleteMany({ where });
    await prisma.pasien.deleteMany({ where });
    await prisma.profilProfesi.deleteMany({ where });
    await prisma.penugasanJenis.deleteMany({ where });
    await prisma.izinJenisAkun.deleteMany({ where });
    await prisma.jenisAkun.deleteMany({ where });
    await prisma.pengguna.deleteMany({ where });
    await prisma.fasyankes.deleteMany({ where: { id: { in: [fas, fasLain] } } });
    await prisma.$disconnect();
  });

  it('admisi langsung: bed terisi, DPJP tercatat, validasi dan izin, bed tidak terisi dua pasien', async () => {
    const bed = await bedBaru('A1');
    const p1 = await pasienBaru();
    expect((await admisi(p1, { bed_id: bed }, 'kasir')).status).toBe(403);
    expect((await admisi(p1, { bed_id: bed, kelas: 'salah' })).status).toBe(400);
    expect((await admisi(p1, { bed_id: bed, dpjp_bersama: [id.dokter] })).status).toBe(400);
    expect((await admisi(p1, { bed_id: bed, dpjp_id: id.kasir })).status).toBe(400);
    expect((await admisi(99999999, { bed_id: bed })).status).toBe(404);
    expect((await admisi(p1, { bed_id: bed, dpjp_bersama: [id.dokter2], spri: 'SPRI-1' })).status).toBe(201);
    const papan = await panggil('GET', '/rawat-inap/papan', 'dokter');
    const b = papan.badan.data.bed.find((x: any) => x.id === bed);
    expect(b.status).toBe('terisi');
    expect(b.penghuni.pasien_id).toBe(p1);
    expect((await prisma.lokasi.findUniqueOrThrow({ where: { id: bed } })).status_operasional).toBe('U');
    expect((await admisi(p1, { bed_id: await bedBaru('A2') })).status).toBe(409);
    const p2 = await pasienBaru();
    expect((await admisi(p2, { bed_id: bed })).status).toBe(409);
    expect((await panggil('GET', '/rawat-inap/papan', 'lainDokter')).badan.data.bed).toHaveLength(0);
  });

  it('dua admisi serempak ke bed yang sama: hanya satu berhasil', async () => {
    const bed = await bedBaru('B1');
    const [a, b] = await Promise.all([admisi(await pasienBaru(), { bed_id: bed }), admisi(await pasienBaru(), { bed_id: bed })]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect(await prisma.penempatan.count({ where: { lokasi_id: bed, selesai: null } })).toBe(1);
  });

  it('admisi tanpa bed menunggu ruangan, lalu ubah penempatan menempatkannya', async () => {
    const p = await pasienBaru();
    const h = await admisi(p);
    expect(h.badan.data.menunggu_ruangan).toBe(true);
    const kid = h.badan.data.kunjungan_id;
    expect((await panggil('GET', '/rawat-inap/papan', 'dokter')).badan.data.menunggu.some((x: any) => x.kunjungan_id === kid)).toBe(true);
    const bed = await bedBaru('C1');
    const ubah = (badan: Record<string, unknown>, siapa = 'dokter') => panggil('PUT', `/kunjungan/${kid}/penempatan`, siapa, { kelas: 'dua', dpjp_id: id.dokter, ...badan });
    expect((await ubah({ bed_id: bed }, 'kasir')).status).toBe(403);
    const r = await ubah({ bed_id: bed, tarif_id: tarifId });
    expect(r.status).toBe(200);
    expect(r.badan.data.kunjungan.status).toBe('in-progress');
    expect(r.badan.data.penempatan).toHaveLength(1);
    // pindah butuh alasan; setelah pindah bed lama kosong dan riwayat bertambah
    const bed2 = await bedBaru('C2');
    expect((await ubah({ bed_id: bed2, tarif_id: tarifId })).status).toBe(400);
    const pindah = await ubah({ bed_id: bed2, kelas: 'vip', indikator: 'naik_kelas', tarif_id: tarifId, alasan: 'Permintaan keluarga' });
    expect(pindah.status).toBe(200);
    expect(pindah.badan.data.penempatan).toHaveLength(2);
    expect(pindah.badan.data.penempatan[0].selesai).not.toBeNull();
    expect((await prisma.lokasi.findUniqueOrThrow({ where: { id: bed } })).status_operasional).toBe('O');
    expect((await prisma.lokasi.findUniqueOrThrow({ where: { id: bed2 } })).status_operasional).toBe('U');
    // ganti DPJP utama dan bersama
    const g = await ubah({ kelas: 'vip', indikator: 'naik_kelas', tarif_id: tarifId, dpjp_id: id.dokter2, dpjp_bersama: [id.dokter] });
    expect(g.status).toBe(200);
    expect(g.badan.data.dpjp.find((x: any) => x.tipe === 'ATND').id).toBe(id.dokter2);
    expect(g.badan.data.dpjp.find((x: any) => x.tipe === 'SPRF').id).toBe(id.dokter);
    expect(g.badan.data.penempatan).toHaveLength(2);
    // bed terisi pasien lain ditolak
    const lain = await pasienBaru();
    const bed3 = await bedBaru('C3');
    expect((await admisi(lain, { bed_id: bed3 })).status).toBe(201);
    expect((await ubah({ bed_id: bed3, kelas: 'dua', alasan: 'x' })).status).toBe(409);
  });

  it('CPPT: tiap catatan disahkan, terverifikasi, dibatasi izin, ditutup setelah pemulangan', async () => {
    const p = await pasienBaru();
    const kid = (await admisi(p, { bed_id: await bedBaru('D1') })).badan.data.kunjungan_id;
    const catatan = { subjektif: 'Pusing berkurang', objektif: 'TD 130/80', asesmen: 'Hipertensi terkontrol', rencana: 'Lanjut obat', instruksi: 'Cek TD tiap shift', tanda_vital: { sistolik: 130, diastolik: 80 } };
    expect((await panggil('POST', `/kunjungan/${kid}/cppt`, 'kasir', catatan)).status).toBe(403);
    expect((await panggil('POST', `/kunjungan/${kid}/cppt`, 'dokter', { ...catatan, subjektif: '' })).status).toBe(400);
    expect((await panggil('POST', `/kunjungan/${kid}/cppt`, 'dokter', catatan)).status).toBe(201);
    expect((await panggil('POST', `/kunjungan/${kid}/cppt`, 'dokter2', { ...catatan, tanda_vital: null, instruksi: '' })).status).toBe(201);
    const l = await panggil('GET', `/kunjungan/${kid}/cppt`, 'dokter');
    expect(l.badan.data).toHaveLength(2);
    expect(l.badan.data.every((c: any) => c.verifikasi === 'sah' && c.pengesahan.versi === 1)).toBe(true);
    expect(l.badan.data[1].tanda_vital.sistolik).toBe(130);
    expect((await panggil('GET', `/kunjungan/${kid}/cppt`, 'lainDokter')).status).toBe(404);
    expect((await panggil('POST', `/kunjungan/${kid}/pemulangan`, 'dokter', ringkasanPulang)).status).toBe(201);
    expect((await panggil('POST', `/kunjungan/${kid}/cppt`, 'dokter', catatan)).status).toBe(409);
  });

  it('pemulangan: bed kosong, biaya kamar masuk tagihan, resume dibuat, lanjut ke kasir, tidak ganda', async () => {
    const p = await pasienBaru();
    const bed = await bedBaru('E1');
    const kid = (await admisi(p, { bed_id: bed, tarif_id: tarifId })).badan.data.kunjungan_id;
    await prisma.penempatan.updateMany({ where: { kunjungan_id: kid }, data: { mulai: new Date(Date.now() - 2.5 * 86_400_000) } });
    expect((await panggil('POST', `/kunjungan/${kid}/pemulangan`, 'dokter', { ...ringkasanPulang, disposisi: 'salah' })).status).toBe(400);
    expect((await panggil('POST', `/kunjungan/${kid}/pemulangan`, 'kasir', ringkasanPulang)).status).toBe(403);
    const r = await panggil('POST', `/kunjungan/${kid}/pemulangan`, 'dokter', ringkasanPulang);
    expect(r.status).toBe(201);
    expect(r.badan.data.resume_dibuat).toBe(true);
    expect(r.badan.data.tagihan_kamar).toBe(1);
    const k = await prisma.kunjungan.findUniqueOrThrow({ where: { id: kid } });
    expect(k.tahap_layanan).toBe('kasir');
    expect(k.status).toBe('finished');
    expect((await prisma.lokasi.findUniqueOrThrow({ where: { id: bed } })).status_operasional).toBe('O');
    expect(await prisma.penempatan.count({ where: { kunjungan_id: kid, selesai: null } })).toBe(0);
    const item = await prisma.itemTagihan.findFirstOrThrow({ where: { tagihan: { kunjungan_id: kid }, jenis: 'kamar' } });
    expect(item.jumlah).toBe(3);
    expect(item.harga).toBe(150_000);
    expect(await prisma.resumeMedis.count({ where: { kunjungan_id: kid } })).toBe(1);
    expect((await panggil('POST', `/kunjungan/${kid}/pemulangan`, 'dokter', ringkasanPulang)).status).toBe(409);
    expect((await panggil('PUT', `/kunjungan/${kid}/penempatan`, 'dokter', { kelas: 'dua', dpjp_id: id.dokter })).status).toBe(409);
    expect((await panggil('GET', `/kunjungan/${kid}/rawat-inap`, 'dokter')).badan.data.pemulangan.disposisi).toBe('home');
  });

  it('admisi dari rawat jalan: kunjungan asal ditutup, tagihan dan resep digabung; ada pembayaran ditolak', async () => {
    const p = await pasienBaru();
    const asal = await prisma.kunjungan.create({ data: { fasyankes_id: fas, pasien_id: p, jenis: 'AMB', tahap_layanan: 'pemeriksaan', status: 'in_progress' } });
    const tagihan = await prisma.tagihan.create({ data: { fasyankes_id: fas, kunjungan_id: asal.id } });
    await prisma.itemTagihan.create({ data: { fasyankes_id: fas, tagihan_id: tagihan.id, jenis: 'konsultasi', kode: 'K1', nama: 'Konsultasi', harga: 50_000 } });
    const info = await panggil('GET', `/rawat-inap/asal?pasien_id=${p}`, 'dokter');
    expect(info.badan.data.asal.kunjungan_id).toBe(asal.id);
    expect(info.badan.data.ada_pembayaran).toBe(false);
    const shift = await prisma.shiftKasir.create({ data: { fasyankes_id: fas, kasir_id: id.kasir, kas_awal: 0 } });
    await prisma.pembayaran.create({ data: { fasyankes_id: fas, tagihan_id: tagihan.id, shift_id: shift.id, metode: 'tunai', jumlah: 10_000, kasir_id: id.kasir } });
    expect((await admisi(p, { bed_id: await bedBaru('F0') })).status).toBe(409);
    expect((await panggil('GET', `/rawat-inap/asal?pasien_id=${p}`, 'dokter')).badan.data.ada_pembayaran).toBe(true);
    await prisma.pembayaran.deleteMany({ where: { tagihan_id: tagihan.id } });
    await prisma.shiftKasir.deleteMany({ where: { id: shift.id } });
    const h = await admisi(p, { bed_id: await bedBaru('F1') });
    expect(h.status).toBe(201);
    const lama = await prisma.kunjungan.findUniqueOrThrow({ where: { id: asal.id } });
    expect(lama.tahap_layanan).toBe('ditutup');
    expect(lama.waktu_tutup).not.toBeNull();
    const baru = await prisma.kunjungan.findUniqueOrThrow({ where: { id: h.badan.data.kunjungan_id } });
    expect(baru.kunjungan_asal_id).toBe(asal.id);
    expect(await prisma.itemTagihan.count({ where: { tagihan: { kunjungan_id: baru.id } } })).toBe(1);
    expect(await prisma.itemTagihan.count({ where: { tagihan_id: tagihan.id } })).toBe(0);
  });
});
