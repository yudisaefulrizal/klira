import * as uji from '@klira/db/uji';
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { AddressInfo } from 'net';

const urlUji = (process.env.KLIRA_UJI_DB === '1' ? process.env.DATABASE_URL : undefined);
const d = urlUji ? describe : describe.skip;

d('log audit terhadap database pengujian', () => {

  const kode = `UJI-AUD-${Date.now()}`;
  let server: any;
  let fas = 0;
  const id: Record<string, number> = {};
  const cookie: Record<string, string> = {};
  const url = (p: string) => `http://127.0.0.1:${(server.address() as AddressInfo).port}/api${p}`;
  const panggil = async (metode: string, p: string, siapa: string, badan?: unknown) => {
    const res = await fetch(url(p), {
      method: metode,
      headers: { 'content-type': 'application/json', cookie: cookie[siapa] },
      body: badan === undefined ? undefined : JSON.stringify(badan),
    });
    const teks = await res.text();
    let json: any = null;
    try { json = JSON.parse(teks); } catch { /* bukan JSON */ }
    return { status: res.status, badan: json, teks, tipe: res.headers.get('content-type') };
  };

  async function buatPengguna(kunci: string, nik: string, izin: [string, string, string][]) {
    const { hashKataSandi } = require('@klira/db');
    const u = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahPenggunaUntukBuatPengguna(fas, `Nama ${kunci}`, nik, `${kode}-${kunci}`, await hashKataSandi('sandi-uji-1'), false, koneksiBaru); return uji.tambahPenggunaUntukBuatPenggunaHasil(_hasil.id, koneksiBaru); });
    id[kunci] = u.id;
    const j = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahJenisAkunUntukBuatPengguna(fas, `${kode}-${kunci}`, koneksiBaru); return uji.tambahJenisAkunUntukJenisPaketHasil(_hasil.id, koneksiBaru); });
    for (const [fitur, aksi, cakupan] of izin) {
      const r = await uji.transaksi(async koneksiBaru => { await uji.simpanIzinUntukAksesIzinIntegrasiTest(fitur, aksi as 'lihat', cakupan as 'unit', koneksiBaru); return uji.simpanIzinUntukAksesIzinIntegrasiTestHasil(fitur, aksi as 'lihat', cakupan as 'unit', koneksiBaru); });
      await uji.tambahIzinJenisAkunUntukBuatPengguna(fas, j.id, r.id);
    }
    await uji.tambahPenugasanJenisUntukAksesIzinIntegrasiTest(fas, u.id, j.id, new Date(Date.now() - 86_400_000));
    const res = await fetch(url('/masuk'), {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: `${kode}-${kunci}`, kata_sandi: 'sandi-uji-1' }),
    });
    expect(res.status).toBe(200);
    cookie[kunci] = res.headers.get('set-cookie')!.split(';')[0];
  }

  beforeAll(async () => {
    const f = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahFasyankesUntukAksesIzinIntegrasiTest(-4, 'Uji Audit', 'klinik_pratama_rawat_jalan', kode, koneksiBaru); return uji.tambahFasyankesUntukAksesIzinIntegrasiTestHasil(_hasil.id, koneksiBaru); });
    fas = f.id;
    await uji.ubahFasyankesUntukAksesIzinIntegrasiTest(fas);
    const { buatApp } = require('../../../app');
    server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
    // pengguna dibuat setelah server hidup karena masuk memakai API
    await buatPengguna('auditor', '9920000000000001', [['audit', 'lihat', 'unit']]);
    await buatPengguna('biasa', '9920000000000002', [['klinis', 'input', 'unit']]);
  });

  afterAll(async () => {
    server?.close();

    await uji.hapusLogAuditUntukAksesIzinIntegrasiTest(fas);
    await uji.hapusSesiUntukAksesIzinIntegrasiTest(Object.values(id));
    await uji.hapusPenugasanJenisUntukAksesIzinIntegrasiTest(fas);
    await uji.hapusIzinJenisAkunUntukAksesIzinIntegrasiTest(fas);
    await uji.hapusJenisAkunUntukAksesIzinIntegrasiTest(fas);
    await uji.hapusPenggunaUntukAksesIzinIntegrasiTest(fas);
    await uji.hapusFasyankesUntukAksesIzinIntegrasiTest(fas);
    await uji.tutupPool();
  });

  it('masuk tercatat dengan waktu UTC, alamat, dan fasyankes', async () => {
    const a = await uji.daftarLogAuditUntukAudit('masuk', id.auditor);
    expect(a).toHaveLength(1);
    expect(a[0].fasyankes_id).toBe(fas);
    expect(a[0].alamat).toBeTruthy();
    expect(Math.abs(a[0].waktu.getTime() - Date.now())).toBeLessThan(120_000);
  });

  it('403 tanpa izin audit dan penolakan tercatat sebagai izin_ditolak', async () => {
    for (const [m, p] of [['GET', '/audit'], ['GET', '/audit/1'], ['POST', '/audit/ekspor']] as const) {
      expect((await panggil(m, p, 'biasa', m === 'POST' ? {} : undefined)).status).toBe(403);
    }
    const t = await uji.daftarLogAuditUntukAuditAuditIntegrasiTest2('izin_ditolak', id.biasa, 'audit');
    expect(t.length).toBe(3);
  });

  it('401 tanpa sesi', async () => {
    const r = await fetch(url('/audit'));
    expect(r.status).toBe(401);
  });

  it('daftar: filter aksi, pengguna, entitas, rentang waktu, dan paginasi', async () => {

    for (let i = 1; i <= 5; i++) {
      await uji.tambahLogAuditUntukAuditAuditIntegrasiTest(fas, id.auditor, 'lihat', 'pasien', i, new Date(Date.UTC(2026, 0, i, 12)), '10.0.0.1');
    }
    await uji.tambahLogAuditUntukAuditAuditIntegrasiTest(fas, id.auditor, 'input', 'pasien', 99, new Date(Date.UTC(2026, 0, 3, 13)), '10.0.0.1');
    const q = `entitas=pasien&pengguna_id=${id.auditor}`;
    const semua = await panggil('GET', `/audit?${q}&ukuran=2&halaman=2`, 'auditor');
    expect(semua.status).toBe(200);
    expect(semua.badan.data).toMatchObject({ halaman: 2, ukuran: 2, total: 6 });
    expect(semua.badan.data.data).toHaveLength(2);
    expect(semua.badan.data.data[0].pengguna_nama).toBe('Nama auditor');
    // urut terbaru dulu: 5,4 | 3 (input 13:00 lebih baru dari lihat 3) ...
    const lihat = await panggil('GET', `/audit?${q}&aksi=lihat`, 'auditor');
    expect(lihat.badan.data.total).toBe(5);
    const rentang = await panggil('GET', `/audit?${q}&dari=2026-01-02T00:00:00Z&sampai=2026-01-03T23:59:59Z`, 'auditor');
    expect(rentang.badan.data.total).toBe(3);
    expect((await panggil('GET', '/audit?aksi=tidak-ada', 'auditor')).status).toBe(400);
    expect((await panggil('GET', '/audit?dari=2026-02-01&sampai=2026-01-01', 'auditor')).status).toBe(400);
  });

  it('detail: ada dan tidak ada, tidak lintas fasyankes', async () => {
    const c = await uji.wajibLogAuditUntukAuditAuditIntegrasiTest(fas, 'input', 99);
    const ok = await panggil('GET', `/audit/${c.id}`, 'auditor');
    expect(ok.status).toBe(200);
    expect(ok.badan.data).toMatchObject({ id: c.id, aksi: 'input', entitas: 'pasien', entitas_id: 99 });
    expect((await panggil('GET', '/audit/999999999', 'auditor')).status).toBe(404);
    expect((await panggil('GET', '/audit/abc', 'auditor')).status).toBe(400);
    const lain = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahLogAuditUntukAuditAuditIntegrasiTest3(fas + 100000, 'lihat', 'pasien', koneksiBaru); return uji.tambahLogAuditUntukAuditAuditIntegrasiTest3Hasil(_hasil.id, koneksiBaru); });
    expect((await panggil('GET', `/audit/${lain.id}`, 'auditor')).status).toBe(404);
    await uji.hapusLogAuditUntukAuditAuditIntegrasiTest2(lain.id);
  });

  it('ekspor CSV mengikuti filter dan tercatat sebagai aksi ekspor', async () => {
    const r = await panggil('POST', '/audit/ekspor', 'auditor', { entitas: 'pasien', aksi: 'lihat', pengguna_id: id.auditor });
    expect(r.status).toBe(200);
    expect(r.tipe).toContain('text/csv');
    const baris = r.teks.trim().split('\r\n');
    expect(baris[0]).toBe('id,waktu_utc,pengguna_id,pengguna_nama,aksi,entitas,entitas_id,alamat,keterangan');
    expect(baris).toHaveLength(6);
    const e = await uji.daftarLogAuditUntukAudit('ekspor', id.auditor);
    expect(e).toHaveLength(1);
    expect(e[0]).toMatchObject({ entitas: 'log_audit', fasyankes_id: fas });
    expect(e[0].keterangan).toContain('5 baris');
  });

  it('aksi akun tercatat: masuk_gagal tanpa username mentah, keluar', async () => {
    const res = await fetch(url('/masuk'), {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: `${kode}-biasa`, kata_sandi: 'salah-sandi-xyz' }),
    });
    expect(res.status).toBe(401);
    const g = await uji.daftarLogAuditUntukAudit('masuk_gagal', id.biasa);
    expect(g).toHaveLength(1);
    expect(JSON.stringify(g)).not.toMatch(/salah-sandi-xyz/);
    const k = await panggil('POST', '/keluar', 'biasa');
    expect(k.status).toBeLessThan(300);
    expect(await uji.hitungLogAuditUntukAuditAuditIntegrasiTest('keluar', id.biasa)).toBe(1);
  });

  it('tidak ada isi sensitif: tidak ada kata sandi, hash, atau NIK pada log fasyankes uji', async () => {
    const semua = JSON.stringify(await uji.daftarLogAuditUntukAuditAuditIntegrasiTest5(fas));
    expect(semua).not.toMatch(/sandi-uji-1|argon|\$2[aby]\$|9920000000000001|9920000000000002/);
  });
});
