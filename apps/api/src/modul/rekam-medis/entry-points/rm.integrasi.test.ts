import * as uji from '@klira/db/uji';
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { AddressInfo } from 'net';

const urlUji = (process.env.KLIRA_UJI_DB === '1' ? process.env.DATABASE_URL : undefined);
const d = urlUji ? describe : describe.skip;

d('rekam medis (perbaikan, berkas) terhadap database pengujian', () => {

  const kode = `UJI-RM-${Date.now()}`;
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
  const kunjunganBaru = async (tahap: 'pemeriksaan' | 'ditutup' = 'pemeriksaan', fasId = fas, waktuTutup: Date | null = null) => {
    nomor += 1;
    const p = await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahPasienUntukBuatKunjungan(fasId, `${kode}-${nomor}`, `Pasien ${nomor}`, new Date('1980-01-01'), 'perempuan', koneksiBaru); return uji.tambahPasienUntukBuatKunjunganHasil(_hasil.id, koneksiBaru); });
    return (await uji.transaksi(async koneksiBaru => { const _hasil = await uji.tambahKunjunganUntukKunjunganBaru2(fasId, p.id, 'AMB', tahap, (waktuTutup) ? (waktuTutup) : (undefined), koneksiBaru); return uji.tambahKunjunganUntukBuatKunjunganHasil(_hasil.id, koneksiBaru); })).id;
  };
  const diagnosis = (...item: [string, string, 'utama' | 'penyerta'][]) => ({ item: item.map(([kodeIcd, nama, peran]) => ({ kode: kodeIcd, nama, peran })) });
  const catatDiagnosis = (kunj: number, isi: unknown, siapa = 'dokter', alasan?: string) => panggil('PUT', `/kunjungan/${kunj}/klinis/diagnosis`, siapa, { isi, ...(alasan ? { alasan } : {}) });
  /** Kunjungan dengan diagnosis tersahkan oleh dokter, lalu ditutup. */
  async function kunjunganSahTutup(waktuTutup = new Date()) {
    const k = await kunjunganBaru('pemeriksaan');
    expect((await catatDiagnosis(k, diagnosis(['I10', 'Hipertensi esensial', 'utama']))).status).toBe(200);
    await uji.ubahKunjunganUntukKunjunganSahTutup('ditutup', waktuTutup, k);
    return k;
  }
  /** Kode diagnosis versi terakhir (penyimpanan berversi: baris lama tetap ada). */
  const kodeSekarang = async (kunj: number) => {
    const baris = await uji.daftarDiagnosisUntukKodeSekarang(kunj);
    return baris.filter((x) => x.versi === baris[0].versi).map((x) => x.kode_icd10);
  };
  const kunoKan = (kunj: number, jam = 72) => uji.ubahPengesahanCatatanUntukKlinisKlinisIntegrasiTest(new Date(Date.now() - jam * 3_600_000), 'diagnosis', kunj);

  const DOKTER: [string, string][] = [['klinis', 'lihat'], ['klinis', 'input'], ['klinis', 'perbaikan'], ['pasien', 'lihat']];
  const PEREKAM: [string, string][] = [['rekam-medis', 'lihat'], ['rekam-medis', 'input'], ['rekam-medis', 'perbaikan'], ['pasien', 'lihat']];

  beforeAll(async () => {
    fas = await buatFasyankes(kode, 'Uji Rekam Medis');
    fasLain = await buatFasyankes(`${kode}-LAIN`, 'Uji RM Lain');
    const { buatApp } = require('../../../app');
    server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
    await buatPengguna('dokter', '9960000000000001', DOKTER);
    await buatPengguna('dokter2', '9960000000000002', DOKTER);
    await buatPengguna('perekam', '9960000000000003', PEREKAM);
    await buatPengguna('perekam2', '9960000000000004', PEREKAM);
    await buatPengguna('kasir', '9960000000000005', [['kasir', 'lihat']]);
    await buatPengguna('lainPerekam', '9960000000000006', PEREKAM, fasLain);
    await buatPengguna('lainDokter', '9960000000000007', DOKTER, fasLain);
    for (const k of ['dokter', 'dokter2', 'perekam', 'perekam2', 'kasir', 'lainPerekam', 'lainDokter']) await login(k);
  });

  afterAll(async () => {
    server?.close();
    const where = { fasyankes_id: { in: [fas, fasLain] } };
    await uji.hapusLogAuditUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
    await uji.hapusSesiUntukAksesIzinIntegrasiTest(Object.values(id));
    for (const m of [uji.hapusPermintaanPerbaikanFasyankesUji, uji.hapusVersiCatatanFasyankesUji, uji.hapusPengesahanCatatanFasyankesUji, uji.hapusDiagnosisFasyankesUji, uji.hapusDrafFasyankesUji, uji.hapusPeringatanIzinFasyankesUji, uji.hapusIzinPerAkunFasyankesUji]) await m(where.fasyankes_id.in);
    await uji.hapusAntreanUntukKlinisKlinisIntegrasiTest([fas, fasLain]);
    await uji.hapusKunjunganUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
    await uji.hapusPasienUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
    await uji.hapusPenugasanJenisUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
    await uji.hapusIzinJenisAkunUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
    await uji.hapusJenisAkunUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
    await uji.hapusPenggunaUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
    await uji.hapusFasyankesUntukAksesRepositoriIntegrasiTest([fas, fasLain]);
    await uji.tutupPool();
  });

  it('perbaikan: pembuat dalam 2x24 jam langsung menerapkan, bagian belum disahkan atau isi tak sah ditolak', async () => {
    const k = await kunjunganBaru();
    const perbaiki = (isi: unknown, siapa = 'dokter', bagian = 'diagnosis', alasan = 'salah kode') => panggil('POST', `/kunjungan/${k}/perbaikan`, siapa, { bagian, isi, alasan });
    expect((await perbaiki(diagnosis(['I10', 'A', 'utama']))).status).toBe(409); // belum disahkan
    await catatDiagnosis(k, diagnosis(['I10', 'Hipertensi', 'utama']));
    expect((await perbaiki(diagnosis(['I10', 'A', 'utama']), 'perekam')).status).toBe(403); // tanpa izin klinis perbaikan
    expect((await perbaiki(diagnosis(['I10', 'A', 'utama']), 'kasir')).status).toBe(403);
    expect((await perbaiki(diagnosis(['salah', 'A', 'utama']))).status).toBe(400);
    expect((await perbaiki({ item: [] })).status).toBe(400);
    expect((await panggil('POST', `/kunjungan/${k}/perbaikan`, 'dokter', { bagian: 'diagnosis', isi: diagnosis(['E11.9', 'DM', 'utama']), alasan: '' })).status).toBe(400);
    expect((await panggil('POST', `/kunjungan/${k}/perbaikan`, 'dokter', { bagian: 'lainnya', isi: {}, alasan: 'x' })).status).toBe(400);
    const h = await perbaiki(diagnosis(['E11.9', 'Diabetes melitus tipe 2', 'utama']));
    expect(h.status).toBe(201);
    expect(h.badan.data).toMatchObject({ jenis: 'diterapkan', permintaan: null });
    expect(await kodeSekarang(k)).toEqual(['E11.9']);
    expect(await uji.hitungVersiCatatanUntukRekamMedisDokumenIntegrasiTest('diagnosis', k)).toBe(1);
    expect((await perbaiki(diagnosis(['E11.9', 'DM', 'utama']), 'lainDokter')).status).toBe(404);
  });

  it('perbaikan lewat 2x24 jam atau bukan pembuat diajukan; satu permintaan menunggu per bagian; kunjungan ditutup tetap bisa', async () => {
    const k = await kunjunganSahTutup();
    await kunoKan(k, 72);
    const ajukan = (isi: unknown, siapa = 'dokter') => panggil('POST', `/kunjungan/${k}/perbaikan`, siapa, { bagian: 'diagnosis', isi, alasan: 'koreksi kode' });
    const baru = diagnosis(['J06.9', 'ISPA', 'utama']);
    const h = await ajukan(baru);
    expect(h.status).toBe(201);
    expect(h.badan.data.jenis).toBe('diajukan');
    expect(h.badan.data.permintaan).toMatchObject({ status: 'diajukan', bagian: 'diagnosis', alasan: 'koreksi kode', pemohon_nama: 'Nama dokter' });
    expect((await ajukan(baru, 'dokter2')).status).toBe(409); // sudah ada yang menunggu
    expect(await kodeSekarang(k)).toEqual(['I10']); // belum berubah
    id.permintaan1 = h.badan.data.permintaan.id;
    // bukan pembuat, dalam 2x24 jam: tetap diajukan
    const k2 = await kunjunganSahTutup();
    const b = await panggil('POST', `/kunjungan/${k2}/perbaikan`, 'dokter2', { bagian: 'diagnosis', isi: diagnosis(['K29.7', 'Gastritis', 'utama']), alasan: 'koreksi' });
    expect(b.badan.data.jenis).toBe('diajukan');
    id.permintaan2 = b.badan.data.permintaan.id;
    id.kunjPermintaan2 = k2;
  });

  it('antrean perbaikan: butuh izin rekam medis; tinjau menolak (catatan wajib) atau menyetujui (penyetuju orang lain, versi lama mencatat penyetuju)', async () => {
    expect((await panggil('GET', '/rekam-medis/perbaikan', 'dokter')).status).toBe(403);
    expect((await panggil('GET', '/rekam-medis/perbaikan', 'lainPerekam')).badan.data.total).toBe(0);
    const daftar = await panggil('GET', '/rekam-medis/perbaikan?status=diajukan', 'perekam');
    expect(daftar.status).toBe(200);
    expect(daftar.badan.data.menunggu).toBe(2);
    const baris = daftar.badan.data.data.find((x: any) => x.id === id.permintaan1);
    expect(baris).toMatchObject({ pemohon_nama: 'Nama dokter', status: 'diajukan' });
    expect(baris.isi_sekarang.item[0].kode).toBe('I10');
    expect(baris.isi_baru.item[0].kode).toBe('J06.9');
    const putus = (idP: number, badan: unknown, siapa = 'perekam') => panggil('POST', `/rekam-medis/perbaikan/${idP}/keputusan`, siapa, badan);
    expect((await putus(id.permintaan1, { keputusan: 'setujui' }, 'dokter')).status).toBe(403);
    expect((await putus(id.permintaan1, { keputusan: 'setujui' }, 'lainPerekam')).status).toBe(404);
    expect((await putus(id.permintaan1, { keputusan: 'tolak' })).status).toBe(400); // catatan wajib
    expect((await putus(id.permintaan1, { keputusan: 'mungkin' })).status).toBe(400);
    expect((await putus(99_999_999, { keputusan: 'setujui' })).status).toBe(404);
    const tolak = await putus(id.permintaan2, { keputusan: 'tolak', catatan: 'kode awal sudah tepat' });
    expect(tolak.status).toBe(200);
    expect(tolak.badan.data).toMatchObject({ status: 'ditolak', catatan_keputusan: 'kode awal sudah tepat', penyetuju_nama: 'Nama perekam' });
    expect((await putus(id.permintaan2, { keputusan: 'setujui' })).status).toBe(409); // sudah diputuskan
    const setuju = await putus(id.permintaan1, { keputusan: 'setujui', catatan: 'sesuai rekam' });
    expect(setuju.status).toBe(200);
    expect(setuju.badan.data.status).toBe('disetujui');
    const kunj = (await uji.ambilPermintaanPerbaikanUntukRekamMedisRmIntegrasiTest(id.permintaan1))!.kunjungan_id;
    expect(await kodeSekarang(kunj)).toEqual(['J06.9']);
    const versi = await uji.cariVersiCatatanUntukRekamMedisRmIntegrasiTest('diagnosis', kunj);
    expect(versi).toMatchObject({ alasan: 'koreksi kode', disetujui_oleh: id.perekam });
    const sah = await uji.daftarPengesahanCatatanUntukRekamMedisRmIntegrasiTest('diagnosis', kunj);
    expect(sah.map((x) => [x.versi, x.pengguna_id])).toEqual([[1, id.dokter], [2, id.dokter]]); // pengesahan atas nama pemohon
    expect((await panggil('GET', '/rekam-medis/perbaikan', 'perekam')).badan.data.menunggu).toBe(0);
  });

  it('pemohon tidak boleh menyetujui permintaannya sendiri', async () => {
    const k = await kunjunganSahTutup();
    await kunoKan(k, 72);
    const p = await panggil('POST', `/kunjungan/${k}/perbaikan`, 'perekam', { bagian: 'diagnosis', isi: diagnosis(['A09', 'Diare', 'utama']), alasan: 'x' });
    expect(p.status).toBe(403); // perekam tanpa izin klinis perbaikan
    await uji.tambahIzinJenisAkunUntukBuatPengguna(fas, (await uji.wajibPenugasanJenisUntukRekamMedisRmIntegrasiTest(id.perekam)).jenis_akun_id, (await uji.wajibIzinUntukRekamMedisRmIntegrasiTest('klinis', 'perbaikan')).id);
    const q = await panggil('POST', `/kunjungan/${k}/perbaikan`, 'perekam', { bagian: 'diagnosis', isi: diagnosis(['A09', 'Diare', 'utama']), alasan: 'x' });
    expect(q.badan.data.jenis).toBe('diajukan');
    const putus = await panggil('POST', `/rekam-medis/perbaikan/${q.badan.data.permintaan.id}/keputusan`, 'perekam', { keputusan: 'setujui' });
    expect(putus.status).toBe(409);
    expect((await panggil('POST', `/rekam-medis/perbaikan/${q.badan.data.permintaan.id}/keputusan`, 'perekam2', { keputusan: 'setujui' })).status).toBe(200);
  });

  it('daftar berkas: kunjungan ditutup dengan diagnosis dokter, arsip, dan perbaikan menunggu; cari dan klinik sendiri', async () => {
    expect((await panggil('GET', '/rekam-medis/berkas', 'kasir')).status).toBe(403);
    const semua = await panggil('GET', '/rekam-medis/berkas', 'perekam');
    expect(semua.status).toBe(200);
    expect(semua.badan.data.total).toBeGreaterThanOrEqual(1);
    const dokter = await panggil('GET', '/rekam-medis/berkas', 'dokter');
    expect(dokter.status).toBe(200);
    expect(dokter.badan.data.data[0].diagnosis_dokter).toBeTruthy();
    const nama = dokter.badan.data.data[0].pasien_nama as string;
    const cari = await panggil('GET', `/rekam-medis/berkas?cari=${encodeURIComponent(nama)}`, 'perekam');
    expect(cari.badan.data.data.map((b: any) => b.pasien_nama)).toEqual([nama]);
    expect((await panggil('GET', '/rekam-medis/berkas?dari=2020-01-01&sampai=2020-01-02', 'perekam')).badan.data.total).toBe(0);
    expect((await panggil('GET', '/rekam-medis/berkas', 'lainPerekam')).badan.data.total).toBe(0);
  });

  it('audit mencatat permintaan dan keputusan perbaikan', async () => {
    const audit = await uji.daftarLogAuditUntukFarmasiFarmasiIntegrasiTest(fas, 'permintaan_perbaikan');
    expect(audit.length).toBeGreaterThan(0);
  });
});
