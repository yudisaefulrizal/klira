import * as uji from '@klira/db/uji';
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { AddressInfo } from 'net';

const urlUji = (process.env.KLIRA_UJI_DB === '1' ? process.env.DATABASE_URL : undefined);
const d = urlUji ? describe : describe.skip;

d('keamanan, peringatan, dan jenis akun terhadap database pengujian', () => {

  const kode = `UJI-KEAM-${Date.now()}`;
  let server: any;
  let fas = 0;
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
  const masuk = (kunci: string, sandi = 'sandi-uji-1') =>
    fetch(url('/masuk'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: `${kode}-${kunci}`, kata_sandi: sandi }) });

  async function buatPengguna(kunci: string, nik: string, izin: [string, string, string][], wajibGanti = false) {
    const { hashKataSandi } = require('@klira/db');
    const u = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahPenggunaUntukBuatPengguna(fas, `Nama ${kunci}`, nik, `${kode}-${kunci}`, await hashKataSandi('sandi-uji-1'), wajibGanti, koneksiBaru); return uji.tambahPenggunaUntukBuatPenggunaHasil(_hasil.id, koneksiBaru); });
    id[kunci] = u.id;
    if (!izin.length) return;
    const j = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahJenisAkunUntukBuatPengguna(fas, `${kode}-${kunci}`, koneksiBaru); return uji.tambahJenisAkunUntukJenisPaketHasil(_hasil.id, koneksiBaru); });
    for (const [fitur, aksi, cakupan] of izin) {
      const r = await uji.transaksi(async koneksiBaru => { await uji.simpanIzinUntukAksesIzinIntegrasiTest(fitur, aksi as 'lihat', cakupan as 'unit', koneksiBaru); return uji.simpanIzinUntukAksesIzinIntegrasiTestHasil(fitur, aksi as 'lihat', cakupan as 'unit', koneksiBaru); });
      await uji.tambahIzinJenisAkunUntukBuatPengguna(fas, j.id, r.id);
    }
    await uji.tambahPenugasanJenisUntukAksesIzinIntegrasiTest(fas, u.id, j.id, new Date(Date.now() - 86_400_000));
  }
  async function login(kunci: string) {
    const res = await masuk(kunci);
    expect(res.status).toBe(200);
    cookie[kunci] = res.headers.get('set-cookie')!.split(';')[0];
  }

  beforeAll(async () => {
    const f = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahFasyankesUntukAksesIzinIntegrasiTest(-7, 'Uji Keamanan', 'klinik_pratama_rawat_jalan', kode, koneksiBaru); return uji.tambahFasyankesUntukAksesIzinIntegrasiTestHasil(_hasil.id, koneksiBaru); });
    fas = f.id;
    await uji.ubahFasyankesUntukAksesIzinIntegrasiTest(fas);
    const { buatApp } = require('../../../app');
    server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
    await buatPengguna('pimpinan', '9930000000000001', [['akses', 'lihat', 'unit'], ['akses', 'input', 'unit'], ['akses', 'perbaikan', 'unit']]);
    await buatPengguna('auditor', '9930000000000002', [['audit', 'lihat', 'unit']]);
    await buatPengguna('biasa', '9930000000000003', [['klinis', 'input', 'unit']]);
    await buatPengguna('terkunci', '9930000000000004', []);
    await buatPengguna('awal', '9930000000000005', [], true);
    await login('pimpinan');
    await login('auditor');
    await login('biasa');
  });

  afterAll(async () => {
    server?.close();

    await uji.hapusLogAuditUntukAksesIzinIntegrasiTest(fas);
    await uji.hapusSesiUntukAksesIzinIntegrasiTest(Object.values(id));
    await uji.hapusPeringatanIzinUntukAksesIzinIntegrasiTest(fas);
    await uji.hapusRiwayatBackupUntukKeamananKeamananIntegrasiTest(fas);
    await uji.hapusPengaturanKeamananUntukKeamananKeamananIntegrasiTest(fas);
    await uji.hapusPenugasanJenisUntukAksesIzinIntegrasiTest(fas);
    await uji.hapusIzinJenisAkunUntukAksesIzinIntegrasiTest(fas);
    await uji.hapusRiwayatJenisAkunUntukAksesIzinIntegrasiTest(fas);
    await uji.hapusJenisAkunUntukAksesIzinIntegrasiTest(fas);
    await uji.hapusPenggunaUntukAksesIzinIntegrasiTest(fas);
    await uji.hapusFasyankesUntukAksesIzinIntegrasiTest(fas);
    await uji.tutupPool();
  });

  it('pengaturan keamanan: bawaan, validasi, simpan, audit, dan izin', async () => {
    const awal = await panggil('GET', '/pengaturan-keamanan', 'pimpinan');
    expect(awal.badan.data).toMatchObject({ masa_sesi_jam: 12, batas_percobaan_masuk: 5, panjang_minimum_kata_sandi: 8, bawaan: true });
    expect((await panggil('PATCH', '/pengaturan-keamanan', 'pimpinan', { masa_sesi_jam: 0, batas_percobaan_masuk: 5, panjang_minimum_kata_sandi: 8 })).status).toBe(400);
    expect((await panggil('PATCH', '/pengaturan-keamanan', 'pimpinan', { masa_sesi_jam: 12, batas_percobaan_masuk: 5, panjang_minimum_kata_sandi: 4 })).status).toBe(400);
    expect((await panggil('PATCH', '/pengaturan-keamanan', 'biasa', { masa_sesi_jam: 2, batas_percobaan_masuk: 3, panjang_minimum_kata_sandi: 8 })).status).toBe(403);
    expect((await panggil('GET', '/pengaturan-keamanan', 'auditor')).status).toBe(403);
    const simpan = await panggil('PATCH', '/pengaturan-keamanan', 'pimpinan', { masa_sesi_jam: 1, batas_percobaan_masuk: 3, panjang_minimum_kata_sandi: 12 });
    expect(simpan.status).toBe(200);
    expect(simpan.badan.data).toMatchObject({ masa_sesi_jam: 1, batas_percobaan_masuk: 3, panjang_minimum_kata_sandi: 12, bawaan: false });
    expect((await panggil('GET', '/pengaturan-keamanan', 'pimpinan')).badan.data.masa_sesi_jam).toBe(1);
    expect(await uji.hitungPengaturanKeamananUntukKeamananKeamananIntegrasiTest(fas)).toBe(1);
    const catatan = await uji.daftarLogAuditUntukKeamananKeamananIntegrasiTest('perbaikan', 'pengaturan_keamanan', id.pimpinan);
    expect(catatan).toHaveLength(1);
  });

  it('masa sesi, batas percobaan, dan panjang kata sandi dipakai auth', async () => {
    // masa sesi 1 jam
    const res = await masuk('pimpinan');
    expect(res.status).toBe(200);
    const sesi = await uji.cariSesiUntukKeamananKeamananIntegrasiTest(id.pimpinan);
    const selisihJam = (sesi!.kedaluwarsa_pada.getTime() - Date.now()) / 3_600_000;
    expect(selisihJam).toBeGreaterThan(0.9);
    expect(selisihJam).toBeLessThan(1.01);
    // batas percobaan 3: percobaan ke-4 dengan sandi benar tetap dikunci
    for (let i = 0; i < 3; i++) expect((await masuk('terkunci', 'salah')).status).toBe(401);
    expect((await masuk('terkunci')).status).toBe(429);
    // panjang minimum 12
    await login('awal');
    const pendek = await panggil('POST', '/ganti-kredensial', 'awal', {
      username: `${kode}-awal-baru`, kata_sandi_lama: 'sandi-uji-1', kata_sandi: 'abc1234567', konfirmasi_kata_sandi: 'abc1234567',
    });
    expect(pendek.status).toBe(400);
    expect(pendek.badan.galat.pesan).toContain('12');
    const cukup = await panggil('POST', '/ganti-kredensial', 'awal', {
      username: `${kode}-awal-baru`, kata_sandi_lama: 'sandi-uji-1', kata_sandi: 'abc123456789', konfirmasi_kata_sandi: 'abc123456789',
    });
    expect(cukup.status).toBe(200);
  });

  it('riwayat backup hanya baca, terurut terbaru, dan berpaginasi', async () => {
    const dasar = Date.now();
    await uji.tambahBanyakRiwayatBackupUntukKeamananKeamananIntegrasiTest([
        { fasyankes_id: fas, waktu: new Date(dasar - 3000), status: 'berhasil', ukuran_byte: BigInt(5_000_000_000), lokasi: '/backup/a.sql.gz' },
        { fasyankes_id: fas, waktu: new Date(dasar - 2000), status: 'gagal', ukuran_byte: null, lokasi: null },
        { fasyankes_id: fas, waktu: new Date(dasar - 1000), status: 'berhasil', ukuran_byte: BigInt(1024), lokasi: '/backup/c.sql.gz' },
      ]);
    const h1 = await panggil('GET', '/riwayat-backup?halaman=1&ukuran=2', 'pimpinan');
    expect(h1.status).toBe(200);
    expect(h1.badan.data.total).toBe(3);
    expect(h1.badan.data.data.map((b: any) => b.lokasi)).toEqual(['/backup/c.sql.gz', null]);
    expect(h1.badan.data.data[0].ukuran_byte).toBe(1024);
    const h2 = await panggil('GET', '/riwayat-backup?halaman=2&ukuran=2', 'pimpinan');
    expect(h2.badan.data.data[0].ukuran_byte).toBe(5_000_000_000);
    expect((await panggil('GET', '/riwayat-backup', 'biasa')).status).toBe(403);
    expect((await panggil('POST', '/riwayat-backup', 'pimpinan', {})).status).toBe(404);
    expect((await panggil('PATCH', '/riwayat-backup', 'pimpinan', {})).status).toBe(404);
  });

  it('daftar peringatan: filter pengguna, jenis, dan rentang waktu; nama; pimpinan dan auditor', async () => {
    const t = (hari: number) => new Date(Date.UTC(2026, 0, hari, 5, 0, 0));
    const buat = (pengguna: string, jenis: string, waktu: Date, diterima = false) =>
      uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahPeringatanIzinUntukBuat(fas, id[pengguna], jenis, `alasan ${jenis}`, 'pemberian', diterima, id.pimpinan, waktu, koneksiBaru); return uji.tambahPeringatanIzinUntukBuatHasil(_hasil.id, koneksiBaru); });
    await buat('biasa', 'nakes_tanpa_sip', t(5));
    await buat('biasa', 'lihat_tak_dibatasi', t(10), true);
    await buat('auditor', 'nakes_tanpa_sip', t(15));

    const semua = await panggil('GET', '/peringatan-izin', 'auditor');
    expect(semua.status).toBe(200);
    expect(semua.badan.data.total).toBe(3);
    expect(semua.badan.data.data[0]).toMatchObject({ pengguna_nama: 'Nama auditor', ditetapkan_oleh_nama: 'Nama pimpinan', jenis_peringatan: 'nakes_tanpa_sip' });
    expect(semua.badan.data.data.map((x: any) => x.waktu)).toEqual([t(15), t(10), t(5)].map((x) => x.toISOString()));

    expect((await panggil('GET', '/peringatan-izin?jenis_peringatan=nakes_tanpa_sip', 'pimpinan')).badan.data.total).toBe(2);
    expect((await panggil('GET', `/peringatan-izin?pengguna_id=${id.biasa}`, 'pimpinan')).badan.data.total).toBe(2);
    expect((await panggil('GET', '/peringatan-izin?cari=Nama%20biasa', 'pimpinan')).badan.data.total).toBe(2);
    const rentang = await panggil('GET', `/peringatan-izin?dari=${t(8).toISOString()}&sampai=${t(12).toISOString()}`, 'pimpinan');
    expect(rentang.badan.data.total).toBe(1);
    expect(rentang.badan.data.data[0]).toMatchObject({ jenis_peringatan: 'lihat_tak_dibatasi', diterima_untuk_akun: true });
    expect((await panggil('GET', `/peringatan-izin?dari=${t(12).toISOString()}&sampai=${t(8).toISOString()}`, 'pimpinan')).status).toBe(400);
    expect((await panggil('GET', '/peringatan-izin?ukuran=2&halaman=2', 'pimpinan')).badan.data.data).toHaveLength(1);
    expect((await panggil('GET', '/peringatan-izin', 'biasa')).status).toBe(403);
  });

  it('daftar jenis akun memuat jumlah pemakai yang sedang berjalan', async () => {
    const jumlah = async (kunci: string) => {
      const r = await panggil('GET', '/jenis-akun', 'pimpinan');
      expect(r.status).toBe(200);
      return r.badan.data.find((x: any) => x.nama === `${kode}-${kunci}`).jumlah_pemakai;
    };
    expect(await jumlah('pimpinan')).toBe(1);
    expect(await jumlah('biasa')).toBe(1);
    await uji.ubahPenugasanJenisUntukKeamananKeamananIntegrasiTest(new Date(Date.now() - 1000), id.biasa);
    expect(await jumlah('biasa')).toBe(0);
  });
});
