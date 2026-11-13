import * as uji from '@klira/db/uji';
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { AddressInfo } from 'net';

const urlUji = (process.env.KLIRA_UJI_DB === '1' ? process.env.DATABASE_URL : undefined);
const d = urlUji ? describe : describe.skip;

d('kasir (shift, pembayaran, serah terima obat, tutup kunjungan) terhadap database pengujian', () => {

  const kode = `UJI-KSR-${Date.now()}`;
  let server: any;
  let fas = 0;
  let fasLain = 0;
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
    const u = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahPenggunaUntukBuatPengguna(fasId, `Nama ${kunci}`, nik, `${kode}-${kunci}`, await hashKataSandi('sandi-uji-1'), false, koneksiBaru); return uji.tambahPenggunaUntukBuatPenggunaHasil(_hasil.id, koneksiBaru); });
    id[kunci] = u.id;
    const j = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahJenisAkunUntukBuatPengguna(fasId, `Jenis ${kunci}`, koneksiBaru); return uji.tambahJenisAkunUntukJenisPaketHasil(_hasil.id, koneksiBaru); });
    for (const [fitur, aksi] of izin) {
      const r = await uji.transaksi(async koneksiBaru => { await uji.simpanIzinUntukAksesIzinIntegrasiTest(fitur, aksi as 'lihat', 'unit', koneksiBaru); return uji.simpanIzinUntukAksesIzinIntegrasiTestHasil(fitur, aksi as 'lihat', 'unit', koneksiBaru); });
      await uji.tambahIzinJenisAkunUntukBuatPengguna(fasId, j.id, r.id);
    }
    await uji.tambahPenugasanJenisUntukAksesIzinIntegrasiTest(fasId, u.id, j.id, new Date(Date.now() - 86_400_000));
  }
  async function login(kunci: string) {
    const res = await fetch(url('/masuk'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: `${kode}-${kunci}`, kata_sandi: 'sandi-uji-1' }) });
    expect(res.status).toBe(200);
    cookie[kunci] = res.headers.get('set-cookie')!.split(';')[0];
  }
  const buatFasyankes = async (kodeReg: string, nama: string) => {
    const f = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahFasyankesUntukAksesIzinIntegrasiTest(-8, nama, 'klinik_pratama_rawat_jalan', kodeReg, koneksiBaru); return uji.tambahFasyankesUntukAksesIzinIntegrasiTestHasil(_hasil.id, koneksiBaru); });
    await uji.ubahFasyankesUntukAksesIzinIntegrasiTest(f.id);
    return f.id;
  };
  let nomor = 0;
  /** Kunjungan di tahap kasir dengan tagihan (konsultasi + obat) dan, bila diminta, resep dengan status tertentu. */
  async function siapkan(opsi: { tahap?: 'kasir' | 'pemeriksaan' | 'ditutup'; harga?: (number | null)[]; resep?: 'diajukan' | 'siap' | 'diserahkan' | null; jumlahObat?: number; fasId?: number } = {}) {
    const fasId = opsi.fasId ?? fas;
    nomor += 1;
    const p = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahPasienUntukBuatKunjungan(fasId, `${kode}-${nomor}`, `Pasien ${nomor}`, new Date('1980-01-01'), 'perempuan', koneksiBaru); return uji.tambahPasienUntukBuatKunjunganHasil(_hasil.id, koneksiBaru); });
    const k = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahKunjunganUntukBuatKunjungan(fasId, p.id, 'AMB', opsi.tahap ?? 'kasir', koneksiBaru); return uji.tambahKunjunganUntukBuatKunjunganHasil(_hasil.id, koneksiBaru); });
    const harga = opsi.harga ?? [50_000];
    if (harga.length) {
      const t = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahTagihanUntukSiapkan(fasId, k.id, harga.every((h) => h !== null) ? 'lengkap' : 'belum_lengkap', koneksiBaru); return uji.tambahTagihanUntukSiapkanHasil(_hasil.id, koneksiBaru); });
      for (const [n, h] of harga.entries()) await uji.tambahItemTagihanUntukSiapkan(fasId, t.id, 'konsultasi', `K${n}`, `Item ${n}`, 1, h);
    }
    let resepId = 0;
    if (opsi.resep) {
      const r = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahResepUntukSiapkan(fasId, k.id, id.kasir, `${kode}-R${nomor}`, 'R/ Parasetamol 500 mg No. X', opsi.resep!, koneksiBaru); return uji.tambahResepUntukSiapkanHasil(_hasil.id, koneksiBaru); });
      resepId = r.id;
      await uji.tambahItemResepUntukSiapkan(fasId, r.id, obatId, '3 x 1', opsi.jumlahObat ?? 10);
    }
    return { kunj: k.id, resepId };
  }
  const bukaShift = (siapa = 'kasir', kasAwal = 100_000) => panggil('POST', '/kasir/shift/buka', siapa, { kas_awal: kasAwal });
  /** Satu baris pembayaran dibungkus bentuk beberapa metode; `bayarBanyak` mengirim badan apa adanya. */
  const bayarBanyak = (kunj: number, badan: unknown, siapa = 'kasir') => panggil('POST', `/kunjungan/${kunj}/pembayaran`, siapa, badan);
  const bayar = (kunj: number, baris: unknown, siapa = 'kasir') => bayarBanyak(kunj, { pembayaran: [baris] }, siapa);
  const stokBatch = async (batch: string) => (await uji.cariStokObatUntukStokBatch(obatId, batch))!.jumlah;

  const KASIR: [string, string][] = [['kasir', 'lihat'], ['kasir', 'input'], ['kasir', 'perbaikan']];

  beforeAll(async () => {
    fas = await buatFasyankes(kode, 'Uji Kasir');
    fasLain = await buatFasyankes(`${kode}-LAIN`, 'Uji Kasir Lain');
    const { buatApp } = require('../../../app');
    server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
    await buatPengguna('kasir', '9990000000000001', KASIR);
    await buatPengguna('kasir2', '9990000000000002', KASIR);
    await buatPengguna('dokter', '9990000000000003', [['klinis', 'lihat'], ['resep', 'input']]);
    await buatPengguna('apoteker', '9990000000000005', [['farmasi', 'lihat'], ['farmasi', 'input']]);
    await buatPengguna('lainApoteker', '9990000000000006', [['farmasi', 'lihat'], ['farmasi', 'input']], fasLain);
    await buatPengguna('lainKasir', '9990000000000004', KASIR, fasLain);
    obatId = (await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahMasterObatUntukKasirKasirIntegrasiTest(fas, `${kode}-K`, `Uji obat ${kode}`, 'Obat Kasir', 'tablet', 1000, koneksiBaru); return uji.tambahMasterObatUntukKasirKasirIntegrasiTestHasil(_hasil.id, koneksiBaru); })).id;
    const jauh = (hari: number) => new Date(Date.now() + hari * 86_400_000);
    await uji.tambahStokObatUntukKasirKasirIntegrasiTest(fas, obatId, 'B-DEKAT', jauh(60), 6);
    await uji.tambahStokObatUntukKasirKasirIntegrasiTest(fas, obatId, 'B-JAUH', jauh(400), 20);
    await uji.tambahStokObatUntukKasirKasirIntegrasiTest(fas, obatId, 'B-LEWAT', jauh(-5), 100);
    for (const k of ['kasir', 'kasir2', 'dokter', 'lainKasir', 'apoteker', 'lainApoteker']) await login(k);
  });

  afterAll(async () => {
    server?.close();
    const where = { fasyankes_id: { in: [fas, fasLain] } };
    await uji.hapusLogAuditUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
    await uji.hapusSesiUntukAksesIzinIntegrasiTest(Object.values(id));
    for (const m of [uji.hapusPembayaranFasyankesUji, uji.hapusShiftKasirFasyankesUji, uji.hapusPengeluaranObatFasyankesUji, uji.hapusMutasiStokFasyankesUji, uji.hapusStokObatFasyankesUji, uji.hapusItemTagihanFasyankesUji, uji.hapusTagihanFasyankesUji, uji.hapusItemResepFasyankesUji, uji.hapusResepFasyankesUji, uji.hapusMasterObatFasyankesUji, uji.hapusPeringatanIzinFasyankesUji, uji.hapusIzinPerAkunFasyankesUji]) await m(where.fasyankes_id.in);
    await uji.hapusKunjunganUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
    await uji.hapusPasienUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
    await uji.hapusPenugasanJenisUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
    await uji.hapusIzinJenisAkunUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
    await uji.hapusJenisAkunUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
    await uji.hapusPenggunaUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
    await uji.hapusFasyankesUntukAksesRepositoriIntegrasiTest([fas, fasLain]);
    await uji.tutupPool();
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
    expect(lunas.badan.data.pembayaran.map((p: any) => p.jumlah)).toEqual([50_000]);
    expect(lunas.badan.data).toMatchObject({ kembalian: 50_000, tagihan: { sisa: 0, status_pembayaran: 'lunas', dibayar: 80_000 } });
    expect((await bayar(s.kunj, { metode: 'tunai', jumlah: 1 })).status).toBe(409);
    expect(await uji.hitungPembayaranUntukKasirKasirIntegrasiTest(fas)).toBeGreaterThanOrEqual(2);
  });

  it('pembayaran beberapa metode: satu transaksi, satu baris per metode, kembalian hanya tunai, non-tunai tidak boleh melebihi sisa', async () => {
    const s = await siapkan({ harga: [60_000, 40_000] });
    expect((await bayarBanyak(s.kunj, { pembayaran: [{ metode: 'qris', jumlah: 1000 }, { metode: 'qris', jumlah: 1000 }] })).status).toBe(400);
    expect((await bayarBanyak(s.kunj, { pembayaran: [] })).status).toBe(400);
    const lebih = await bayarBanyak(s.kunj, { pembayaran: [{ metode: 'transfer', jumlah: 70_000 }, { metode: 'qris', jumlah: 40_000 }] });
    expect(lebih.status).toBe(400);
    expect(await uji.hitungPembayaranUntukKasirKasirIntegrasiTest2(s.kunj)).toBe(0);
    const sebagian = await bayarBanyak(s.kunj, { pembayaran: [{ metode: 'transfer', jumlah: 20_000 }, { metode: 'tunai', jumlah: 10_000 }] });
    expect(sebagian.status).toBe(201);
    expect(sebagian.badan.data).toMatchObject({ diterima: 30_000, diterapkan: 30_000, kembalian: 0, tagihan: { sisa: 70_000, status_pembayaran: 'sebagian' } });
    const h = await bayarBanyak(s.kunj, { pembayaran: [{ metode: 'transfer', jumlah: 30_000 }, { metode: 'qris', jumlah: 20_000 }, { metode: 'tunai', jumlah: 50_000 }] });
    expect(h.status).toBe(201);
    expect(h.badan.data.pembayaran.map((p: any) => [p.metode, p.jumlah])).toEqual([['transfer', 30_000], ['qris', 20_000], ['tunai', 20_000]]);
    expect(h.badan.data).toMatchObject({ diterima: 100_000, diterapkan: 70_000, kembalian: 30_000, tagihan: { sisa: 0, dibayar: 100_000, status_pembayaran: 'lunas' } });
    expect(await uji.hitungPembayaranUntukKasirKasirIntegrasiTest2(s.kunj)).toBe(5);
    const audit = await uji.daftarLogAuditUntukKasirKasirIntegrasiTest(fas, 'pembayaran', h.badan.data.pembayaran[0].id);
    expect(audit.length).toBe(1);
  });

  it('pembayaran serempak tidak melebihi tagihan', async () => {
    const s = await siapkan({ harga: [10_000] });
    const hasil = await Promise.all([1, 2, 3, 4].map(() => bayar(s.kunj, { metode: 'tunai', jumlah: 10_000 })));
    expect(hasil.filter((h) => h.status === 201).length).toBe(1);
    expect(hasil.filter((h) => h.status === 409).length).toBe(3);
    const t = await uji.ringkasanPembayaranUntukKasirKasirIntegrasiTest(fas, s.kunj);
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
    const pembayaranSebelum = await uji.hitungPembayaranUntukKasirKasirIntegrasiTest(fas);
    const h = await panggil('POST', `/kunjungan/${s.kunj}/serah-terima-obat`, 'apoteker', {});
    expect(await uji.hitungPembayaranUntukKasirKasirIntegrasiTest(fas)).toBe(pembayaranSebelum);
    expect(h.status).toBe(200);
    expect(h.badan.data.kekurangan).toEqual([]);
    expect(h.badan.data.resep[0].status).toBe('diserahkan');
    expect(await stokBatch('B-DEKAT')).toBe(0); // 6 dari batch terdekat
    expect(await stokBatch('B-JAUH')).toBe(16); // 4 sisanya
    expect(await stokBatch('B-LEWAT')).toBe(100); // kedaluwarsa tidak disentuh
    const keluar = await uji.daftarMutasiStokUntukKasirKasirIntegrasiTest(fas, 'keluar');
    expect(keluar.map((m) => m.jumlah)).toEqual([-6, -4]);
    const p = await uji.daftarPengeluaranObatUntukKasirKasirIntegrasiTest(s.resepId);
    expect(p).toMatchObject([{ jumlah: 10, harga: 1000, stok_kurang: false }]);
    expect((await panggil('POST', `/kunjungan/${s.kunj}/serah-terima-obat`, 'apoteker', {})).status).toBe(409); // sudah diserahkan
    // stok kurang: sisa 16, butuh 30
    const kurang = await siapkan({ resep: 'siap', jumlahObat: 30 });
    const tolak = await panggil('POST', `/kunjungan/${kurang.kunj}/serah-terima-obat`, 'apoteker', {});
    expect(tolak.status).toBe(409);
    expect(tolak.badan.galat.rincian[0].pesan).toMatch(/butuh 30, tersedia 16/);
    expect(await stokBatch('B-JAUH')).toBe(16); // tidak ada perubahan saat ditolak
    expect((await uji.ambilResepUntukKasirKasirIntegrasiTest(kurang.resepId))?.status).toBe('siap');
    const lanjut = await panggil('POST', `/kunjungan/${kurang.kunj}/serah-terima-obat`, 'apoteker', { izinkan_stok_kurang: true, alasan: 'stok fisik masih ada di rak' });
    expect(lanjut.status).toBe(200);
    expect(lanjut.badan.data.kekurangan[0]).toMatchObject({ butuh: 30, tersedia: 16 });
    expect(await stokBatch('B-JAUH')).toBe(0);
    expect(await uji.cariPengeluaranObatUntukKasirKasirIntegrasiTest(kurang.resepId)).toMatchObject({ jumlah: 30, stok_kurang: true, alasan: 'stok fisik masih ada di rak' });
  });

  it('serah terima serempak hanya menyerahkan sekali dan stok berkurang sekali', async () => {
    await uji.ubahStokObatUntukKasirKasirIntegrasiTest(20, obatId, 'B-JAUH');
    const sebelum = await stokBatch('B-JAUH');
    const s = await siapkan({ resep: 'siap', jumlahObat: 1 });
    const hasil = await Promise.all([1, 2, 3].map(() => panggil('POST', `/kunjungan/${s.kunj}/serah-terima-obat`, 'apoteker', {})));
    expect(hasil.filter((h) => h.status === 200).length).toBe(1);
    expect(hasil.filter((h) => h.status === 409).length).toBe(2);
    expect(await stokBatch('B-JAUH')).toBe(sebelum - 1);
    expect(await uji.hitungPengeluaranObatUntukKasirKasirIntegrasiTest(s.resepId)).toBe(1);
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
    const k = await uji.ambilKunjunganUntukFarmasiFarmasiIntegrasiTest(belumLunas.kunj);
    expect(k).toMatchObject({ tahap_layanan: 'ditutup', status: 'finished' });
    expect(k?.waktu_tutup).not.toBeNull();
    expect((await uji.ambilTagihanUntukKasirKasirIntegrasiTest(belumLunas.kunj))?.alasan_tutup_belum_lunas).toBe('pasien akan melunasi besok');
    expect((await tutup(belumLunas.kunj, { alasan: 'lagi' })).status).toBe(409); // sudah ditutup
    expect((await bayar(belumLunas.kunj, { metode: 'tunai', jumlah: 100 })).status).toBe(409); // terkunci
    const lunas = await siapkan({ harga: [15_000], resep: 'diserahkan' });
    await bayar(lunas.kunj, { metode: 'tunai', jumlah: 15_000 });
    expect((await tutup(lunas.kunj)).status).toBe(200);
    const kosong = await siapkan({ harga: [] });
    expect((await tutup(kosong.kunj)).status).toBe(200); // tanpa tagihan: lunas
  });

  it('melengkapi harga item: hanya item tanpa harga, butuh izin perbaikan, tagihan jadi lengkap, tercatat di audit, tidak untuk kunjungan ditutup atau klinik lain', async () => {
    const harga = (kunj: number, itemId: number, badan: unknown, siapa = 'kasir') => panggil('POST', `/kunjungan/${kunj}/tagihan/item/${itemId}/harga`, siapa, badan);
    const s = await siapkan({ harga: [40_000, null] });
    const item = await uji.daftarItemTagihanUntukKasirKasirIntegrasiTest(s.kunj);
    const [berharga, kosong] = [item[0].id, item[1].id];
    expect((await harga(s.kunj, kosong, { harga: 25_000 }, 'dokter')).status).toBe(403);
    expect((await harga(s.kunj, kosong, { harga: 'abc' })).status).toBe(400);
    expect((await harga(s.kunj, kosong, { harga: -5 })).status).toBe(400);
    expect((await harga(s.kunj, kosong, { harga: 25_000 }, 'lainKasir')).status).toBe(404);
    const tertukar = await siapkan({ harga: [null] });
    expect((await harga(s.kunj, (await uji.wajibItemTagihanUntukKasirKasirIntegrasiTest(tertukar.kunj)).id, { harga: 1 })).status).toBe(404); // item milik kunjungan lain
    const sudah = await harga(s.kunj, berharga, { harga: 1 });
    expect(sudah.status).toBe(409); // harga yang sudah terisi tidak diubah
    expect((await uji.wajibItemTagihanUntukKasirKasirIntegrasiTest2(berharga)).harga).toBe(40_000);
    const ok = await harga(s.kunj, kosong, { harga: 25_000 });
    expect(ok.status).toBe(200);
    expect(ok.badan.data.tagihan).toMatchObject({ status_tagihan: 'lengkap', total: 65_000 });
    expect(ok.badan.data.syarat.tagihan_lengkap).toBe(true);
    expect((await uji.wajibTagihanUntukKasirKasirIntegrasiTest(s.kunj)).status_tagihan).toBe('lengkap');
    expect(await uji.hitungLogAuditUntukKasirKasirIntegrasiTest(fas, 'item_tagihan', kosong, 'perbaikan')).toBe(1);
    expect((await harga(s.kunj, kosong, { harga: 30_000 })).status).toBe(409);
    const ditutup = await siapkan({ tahap: 'ditutup', harga: [null] });
    const itemTutup = await uji.wajibItemTagihanUntukKasirKasirIntegrasiTest(ditutup.kunj);
    expect((await harga(ditutup.kunj, itemTutup.id, { harga: 5_000 })).status).toBe(409);
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
    expect(rekap.badan.data.per_metode.qris).toBe(50_000);
    expect(rekap.badan.data.per_metode.tunai).toBeGreaterThan(0);
    expect(rekap.badan.data.total).toBe(rekap.badan.data.per_metode.tunai + rekap.badan.data.per_metode.transfer + rekap.badan.data.per_metode.qris);
    expect(rekap.badan.data.shift.length).toBeGreaterThanOrEqual(2);
    const lain = await panggil('GET', '/kasir/rekap', 'lainKasir');
    expect(lain.badan.data.total).toBe(0);
    const lalu = await panggil('GET', '/kasir/rekap?tanggal=2020-01-01', 'kasir');
    expect(lalu.badan.data.total).toBe(0);
  });

  it('audit mencatat shift, pembayaran, serah terima, dan tutup tanpa isi sensitif', async () => {
    const audit = await uji.daftarLogAuditUntukFarmasiFarmasiIntegrasiTest2(fas, ['shift_kasir', 'pembayaran', 'pengeluaran_obat', 'kunjungan']);
    expect(new Set(audit.map((a) => a.entitas))).toEqual(new Set(['shift_kasir', 'pembayaran', 'pengeluaran_obat', 'kunjungan']));
    expect(audit.some((a) => a.entitas === 'kunjungan' && a.aksi === 'perbaikan')).toBe(true);
  });
});
