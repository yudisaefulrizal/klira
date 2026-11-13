import * as uji from '@klira/db/uji';
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { AddressInfo } from 'net';

const urlUji = (process.env.KLIRA_UJI_DB === '1' ? process.env.DATABASE_URL : undefined);
const d = urlUji ? describe : describe.skip;

d('API pengguna terhadap database pengujian', () => {

  const kode = `UJI-PGN-${Date.now()}`;
  let server: any;
  let fas = 0;
  let jenisPimpinan = 0;
  const id: Record<string, number> = {};
  const cookie: Record<string, string> = {};
  const url = (p: string) => `http://127.0.0.1:${(server.address() as AddressInfo).port}/api${p}`;
  const panggil = async (metode: string, p: string, siapa: string, badan?: unknown) => {
    const res = await fetch(url(p), {
      method: metode,
      headers: { 'content-type': 'application/json', cookie: cookie[siapa] ?? '' },
      body: badan === undefined ? undefined : JSON.stringify(badan),
    });
    const teks = await res.text();
    let json: any = null;
    try { json = JSON.parse(teks); } catch { /* bukan JSON */ }
    return { status: res.status, badan: json };
  };

  async function buatPengguna(kunci: string, nik: string, izin: [string, string, string][], opsi: { jenis?: number } = {}) {
    const { hashKataSandi } = require('@klira/db');
    const u = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahPenggunaUntukBuatPengguna(fas, `Nama ${kunci}`, nik, `${kode}-${kunci}`, await hashKataSandi('sandi-uji-1'), false, koneksiBaru); return uji.tambahPenggunaUntukBuatPenggunaHasil(_hasil.id, koneksiBaru); });
    id[kunci] = u.id;
    let jenisId = opsi.jenis;
    if (!jenisId) {
      const j = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahJenisAkunUntukBuatPengguna(fas, `${kode}-${kunci}`, koneksiBaru); return uji.tambahJenisAkunUntukJenisPaketHasil(_hasil.id, koneksiBaru); });
      jenisId = j.id;
      for (const [fitur, aksi, cakupan] of izin) {
        const r = await uji.transaksi(async koneksiBaru => { await uji.simpanIzinUntukAksesIzinIntegrasiTest(fitur, aksi as 'lihat', cakupan as 'unit', koneksiBaru); return uji.simpanIzinUntukAksesIzinIntegrasiTestHasil(fitur, aksi as 'lihat', cakupan as 'unit', koneksiBaru); });
        await uji.tambahIzinJenisAkunUntukBuatPengguna(fas, j.id, r.id);
      }
    }
    await uji.tambahPenugasanJenisUntukAksesIzinIntegrasiTest(fas, u.id, jenisId, new Date(Date.now() - 86_400_000));
    const res = await fetch(url('/masuk'), {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: `${kode}-${kunci}`, kata_sandi: 'sandi-uji-1' }),
    });
    expect(res.status).toBe(200);
    cookie[kunci] = res.headers.get('set-cookie')!.split(';')[0];
    return jenisId;
  }

  beforeAll(async () => {
    const f = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahFasyankesUntukAksesIzinIntegrasiTest(-5, 'Uji Pengguna', 'klinik_pratama_rawat_jalan', kode, koneksiBaru); return uji.tambahFasyankesUntukAksesIzinIntegrasiTestHasil(_hasil.id, koneksiBaru); });
    fas = f.id;
    await uji.ubahFasyankesUntukAksesIzinIntegrasiTest(fas);
    const { buatApp } = require('../../../app');
    server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
    jenisPimpinan = await buatPengguna('pimpinan', '9930000000000001', [['akses', 'lihat', 'unit'], ['akses', 'perbaikan', 'unit']]);
    await buatPengguna('pelihat', '9930000000000002', [['akses', 'lihat', 'unit']]);
    await buatPengguna('biasa', '9930000000000003', [['klinis', 'input', 'unit']]);
    await buatPengguna('rekan', '9930000000000004', [], { jenis: jenisPimpinan });
    // izin tambahan aktif dan peringatan terbuka untuk 'rekan'
    const izinKasir = await uji.transaksi(async koneksiBaru => { await uji.simpanIzinUntukAksesIzinIntegrasiTest('kasir', 'input', 'unit', koneksiBaru); return uji.simpanIzinUntukAksesIzinIntegrasiTestHasil('kasir', 'input', 'unit', koneksiBaru); });
    await uji.tambahIzinPerAkunUntukPenggunaPenggunaIntegrasiTest(fas, id.rekan, izinKasir.id, 'tambah', 'uji', new Date(Date.now() - 1000));
    await uji.tambahPeringatanIzinUntukPenggunaPenggunaIntegrasiTest(fas, id.rekan, 'izin_klinis_non_dokter', 'uji');
  });

  afterAll(async () => {
    server?.close();

    await uji.hapusLogAuditUntukAksesIzinIntegrasiTest(fas);
    await uji.hapusPeringatanIzinUntukAksesIzinIntegrasiTest(fas);
    await uji.hapusIzinPerAkunUntukAksesIzinIntegrasiTest(fas);
    await uji.hapusSesiUntukAksesIzinIntegrasiTest(Object.values(id));
    await uji.hapusPenugasanJenisUntukAksesIzinIntegrasiTest(fas);
    await uji.hapusIzinJenisAkunUntukAksesIzinIntegrasiTest(fas);
    await uji.hapusJenisAkunUntukAksesIzinIntegrasiTest(fas);
    await uji.hapusPenggunaUntukAksesIzinIntegrasiTest(fas);
    await uji.hapusFasyankesUntukAksesIzinIntegrasiTest(fas);
    await uji.tutupPool();
  });

  it('tanpa sesi 401, tanpa izin akses lihat 403', async () => {
    expect((await panggil('GET', '/pengguna', 'tamu')).status).toBe(401);
    expect((await panggil('GET', '/pengguna', 'biasa')).status).toBe(403);
  });

  it('daftar memuat jenis akun aktif, izin tambahan, peringatan terbuka, dan hanya fasyankes sendiri', async () => {
    const r = await panggil('GET', '/pengguna', 'pelihat');
    expect(r.status).toBe(200);
    expect(r.badan.data.total).toBe(4);
    const rekan = r.badan.data.data.find((x: any) => x.id === id.rekan);
    expect(rekan).toMatchObject({ aktif: true, jenis_akun_aktif: [`${kode}-pimpinan`], jumlah_izin_tambahan: 1, jumlah_peringatan_terbuka: 1 });
    expect(rekan.kata_sandi_hash).toBeUndefined();
  });

  it('filter cari, status, jenis akun, dan paginasi', async () => {
    expect((await panggil('GET', '/pengguna?cari=Nama%20rekan', 'pelihat')).badan.data.total).toBe(1);
    expect((await panggil('GET', `/pengguna?cari=${kode}-biasa`, 'pelihat')).badan.data.total).toBe(1);
    expect((await panggil('GET', `/pengguna?jenis_akun_id=${jenisPimpinan}`, 'pelihat')).badan.data.total).toBe(2);
    expect((await panggil('GET', '/pengguna?status=nonaktif', 'pelihat')).badan.data.total).toBe(0);
    const h = (await panggil('GET', '/pengguna?ukuran=2&halaman=2', 'pelihat')).badan.data;
    expect(h.data).toHaveLength(2);
    expect((await panggil('GET', '/pengguna?status=x', 'pelihat')).status).toBe(400);
  });

  it('nonaktifkan dan aktifkan lewat PATCH, tercatat di audit; sesi akun nonaktif tak berlaku', async () => {
    expect((await panggil('PATCH', `/pengguna/${id.biasa}`, 'pelihat', { aktif: false })).status).toBe(403);
    const r = await panggil('PATCH', `/pengguna/${id.biasa}`, 'pimpinan', { aktif: false });
    expect(r).toMatchObject({ status: 200, badan: { data: { id: id.biasa, aktif: false } } });
    expect((await panggil('GET', '/saya', 'biasa')).status).toBe(401);
    expect((await panggil('GET', '/pengguna?status=nonaktif', 'pelihat')).badan.data.total).toBe(1);
    expect((await panggil('PATCH', `/pengguna/${id.biasa}`, 'pimpinan', { aktif: true })).status).toBe(200);
    const log = await uji.daftarLogAuditUntukPenggunaPenggunaIntegrasiTest(fas, 'pengguna', 'perbaikan');
    expect(log).toHaveLength(2);
    expect(log.every((l) => l.entitas_id === id.biasa && l.pengguna_id === id.pimpinan)).toBe(true);
    expect(await uji.hitungPenggunaUntukPenggunaPenggunaIntegrasiTest(fas)).toBe(4);
  });

  it('admin tidak bisa menonaktifkan akunnya sendiri; id asing 404; badan salah 400', async () => {
    const r = await panggil('PATCH', `/pengguna/${id.pimpinan}`, 'pimpinan', { aktif: false });
    expect(r.status).toBe(409);
    expect((await uji.tambahPenggunaUntukBuatPenggunaHasil(id.pimpinan)).aktif).toBe(true);
    expect((await panggil('PATCH', '/pengguna/999999999', 'pimpinan', { aktif: false })).status).toBe(404);
    expect((await panggil('PATCH', `/pengguna/${id.rekan}`, 'pimpinan', { aktif: 'x' })).status).toBe(400);
  });
});
