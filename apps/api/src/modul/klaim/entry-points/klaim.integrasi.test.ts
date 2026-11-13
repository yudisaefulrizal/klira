import * as uji from '@klira/db/uji';
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { AddressInfo } from 'net';

const urlUji = (process.env.KLIRA_UJI_DB === '1' ? process.env.DATABASE_URL : undefined);
const d = urlUji ? describe : describe.skip;

d('klaim JKN/BPJS terhadap database pengujian', () => {

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
  type Opsi = { jenis?: 'AMB' | 'IMP'; cara?: 'umum' | 'jkn'; tahap?: 'pemeriksaan' | 'ditutup'; fasId?: number; waktuTutup?: Date; kode?: [string, string][] };
  /** Kunjungan dengan diagnosis utama dokter; bawaan JKN rawat jalan yang sudah ditutup sekarang. */
  async function kunjunganBaru(o: Opsi = {}) {
    nomor += 1;
    const fasId = o.fasId ?? fas;
    const tahap = o.tahap ?? 'ditutup';
    const p = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahPasienUntukBuatKunjungan(fasId, `${kode}-${nomor}`, `Pasien ${nomor}`, new Date('1980-01-01'), 'perempuan', koneksiBaru); return uji.tambahPasienUntukBuatKunjunganHasil(_hasil.id, koneksiBaru); });
    const k = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahKunjunganUntukKunjunganBaru(fasId, p.id, o.jenis ?? 'AMB', tahap, o.cara ?? 'jkn', (tahap === 'ditutup') ? (o.waktuTutup ?? new Date()) : (undefined), koneksiBaru); return uji.tambahKunjunganUntukBuatKunjunganHasil(_hasil.id, koneksiBaru); });
    await uji.tambahBanyakDiagnosisUntukKunjunganBaru((o.kode ?? [['I10', 'Hipertensi esensial']]).map(([kd, nama], i) => ({ fasyankes_id: fasId, kunjungan_id: k.id, versi: 1, kode_icd10: kd, nama, peran: (i === 0 ? 'utama' : 'penyerta') as 'utama', urutan: i + 1 })));
    await uji.tambahPengesahanCatatanUntukKunjunganBaru(fasId, 'diagnosis', k.id, 1, id.petugas, 'a'.repeat(64));
    return k.id;
  }
  const BERKAS_RJ = ['fpk', 'rekapitulasi', 'kuitansi', 'surat_tanggung_jawab'];
  const KLAIM: [string, string][] = [['klaim', 'lihat'], ['klaim', 'input'], ['klaim', 'perbaikan']];
  const siapkan = (kunjungan_id: number, extra: Record<string, unknown> = {}, siapa = 'petugas') => panggil('POST', '/klaim', siapa, { kunjungan_id, ...extra });
  const ubah = (id: number, badan: Record<string, unknown>, siapa = 'petugas') => panggil('POST', `/klaim/${id}/status`, siapa, badan);

  beforeAll(async () => {
    fas = await buatFasyankes(kode, 'Uji Klaim');
    fasLain = await buatFasyankes(`${kode}-LAIN`, 'Uji Klaim Lain');
    const { buatApp } = require('../../../app');
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
    await uji.hapusLogAuditUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
    await uji.hapusSesiUntukAksesIzinIntegrasiTest(Object.values(id));
    for (const m of [uji.hapusRiwayatKlaimFasyankesUji, uji.hapusKlaimFasyankesUji, uji.hapusResumeMedisFasyankesUji, uji.hapusPengesahanCatatanFasyankesUji, uji.hapusNarasiKlinisFasyankesUji, uji.hapusDiagnosisFasyankesUji, uji.hapusPeringatanIzinFasyankesUji, uji.hapusIzinPerAkunFasyankesUji]) await m(where.fasyankes_id.in);
    await uji.hapusKunjunganUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
    await uji.hapusPasienUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
    await uji.hapusPenugasanJenisUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
    await uji.hapusIzinJenisAkunUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
    await uji.hapusJenisAkunUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
    await uji.hapusPenggunaUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
    await uji.hapusFasyankesUntukAksesRepositoriIntegrasiTest([fas, fasLain]);
    await uji.tutupPool();
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
    // Diagnosa banding (narasi P7) tidak ikut kode klaim walau berisi kode.
    await uji.tambahNarasiKlinisUntukKlaimKlaimIntegrasiTest(fas, k, 'diagnosis_banding', 'I15.0 Hipertensi renovaskular', 1);
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
    expect(await uji.hitungRiwayatKlaimUntukKlaimKlaimIntegrasiTest(id, 'diajukan')).toBe(1);
  });

  it('lewat batas waktu: status efektif, filter, ringkasan; tidak bisa diajukan atau diubah', async () => {
    const id = (await siapkan(await kunjunganBaru(), { nomor_sep: 'S6', berkas: BERKAS_RJ })).badan.data.id;
    await uji.ubahKlaimUntukKlaimKlaimIntegrasiTest(new Date(Date.now() - 86_400_000), id);
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
    await uji.ubahKlaimUntukKlaimKlaimIntegrasiTest2(new Date(Date.now() - 1000), id);
    expect((await panggil('GET', `/klaim/${id}`, 'petugas')).badan.data.status).toBe('lewat_batas_waktu');
    expect((await ubah(id, { aksi: 'ajukan_ulang' })).status).toBe(409);
  });

  it('rawat inap: butuh SPRI, ringkasan RM, dan resume medis; kode berbeda dari rekam medis ditandai', async () => {
    const k = await kunjunganBaru({ jenis: 'IMP' });
    const semua = [...BERKAS_RJ, 'spri', 'ringkasan_rm'];
    const a = await siapkan(k, { nomor_sep: 'S9', berkas: semua });
    expect(a.badan.data.status).toBe('menunggu_sep');
    expect(a.badan.data.resume_ada).toBe(false);
    await uji.tambahResumeMedisUntukKlaimKlaimIntegrasiTest(fas, k, { ringkasan: 'r' });
    const b = await panggil('PUT', `/klaim/${a.badan.data.id}/berkas`, 'petugas', { nomor_sep: 'S9', berkas: semua });
    expect(b.badan.data.status).toBe('siap_diajukan');
    expect(b.badan.data.kode_beda).toBe(false);
    await uji.tambahDiagnosisUntukKlaimKlaimIntegrasiTest(fas, k, 2, 'E11.9', 'DM', 'utama', 1);
    await uji.tambahPengesahanCatatanUntukKunjunganBaru(fas, 'diagnosis', k, 2, id.petugas, 'b'.repeat(64));
    expect((await panggil('GET', `/klaim/${a.badan.data.id}`, 'petugas')).badan.data.kode_beda).toBe(true);
    expect((await panggil('GET', `/klaim/${a.badan.data.id}`, 'lainPetugas')).status).toBe(404);
    expect(await uji.hitungLogAuditUntukKlaimKlaimIntegrasiTest(fas, 'klaim', 'lihat')).toBeGreaterThan(0);
  });
});
