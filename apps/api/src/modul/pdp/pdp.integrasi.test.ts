/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
import type { AddressInfo } from 'net';
import { PrismaClient } from '@prisma/client';

const urlUji = process.env.DATABASE_URL_UJI;
const d = urlUji ? describe : describe.skip;

d('pelindungan data pribadi terhadap klira_uji', () => {
  const prisma = new PrismaClient({ datasourceUrl: urlUji });
  const kode = `UJI-PDP-${Date.now()}`;
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
  let nomor = 0;
  const pasienBaru = async (fasId = fas) => {
    nomor += 1;
    return (await prisma.pasien.create({ data: { fasyankes_id: fasId, nomor_rm: `${kode}-${nomor}`, nama: `Pasien ${nomor}`, tanggal_lahir: new Date('1980-01-01'), jenis_kelamin: 'perempuan' } })).id;
  };
  const PDP: [string, string][] = [['pdp', 'lihat'], ['pdp', 'input'], ['pdp', 'perbaikan']];
  const jam = (n: number) => new Date(Date.now() + n * 3_600_000);
  const tanggalLokal = (n: number) => new Date(Date.now() + 7 * 3_600_000 + n * 86_400_000).toISOString().slice(0, 10);
  const hakBaru = (pasien_id: number, extra: Record<string, unknown> = {}, siapa = 'petugas') => panggil('POST', '/pdp/hak', siapa, { pasien_id, jenis: 'akses', saluran: 'langsung', pemohon_nama: 'Pasien sendiri', pemohon_hubungan: 'pasien', verifikasi: 'KTP dicocokkan', ...extra });
  const proses = (id: number, badan: Record<string, unknown>, siapa = 'petugas') => panggil('POST', `/pdp/hak/${id}/proses`, siapa, badan);
  const ropaIsi = { nama_kegiatan: 'Pendaftaran pasien', ppdp_nama: 'Budi', sumber_tujuan: 'Pasien ke klinik', dasar: 'persetujuan', tujuan: 'Pelayanan kesehatan', jenis_data: 'Identitas, kontak', kategori_subjek: 'Pasien', pihak_akses: 'Petugas pendaftaran', pemenuhan_hak: 'Lewat petugas PDP', aliran: 'Aplikasi ke basis data', masa_retensi: '25 tahun', pengamanan: 'Enkripsi, kontrol akses', transfer: 'Tidak ada' };
  const prosesorIsi = { nama: 'Hosting Nusantara', layanan: 'Hosting aplikasi', lokasi_data: 'Jakarta', nomor_perjanjian: 'P-01', butir_perjanjian: ['objek_jangka', 'kerahasiaan'], sub_prosesor: [], sla_lapor_jam: 24 };

  beforeAll(async () => {
    process.env.DATABASE_URL = urlUji;
    fas = await buatFasyankes(kode, 'Uji PDP');
    fasLain = await buatFasyankes(`${kode}-LAIN`, 'Uji PDP Lain');
    const { buatApp } = require('../../app');
    server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
    await buatPengguna('petugas', '9964000000000001', PDP);
    await buatPengguna('lihatSaja', '9964000000000002', [['pdp', 'lihat']]);
    await buatPengguna('kasir', '9964000000000005', [['kasir', 'lihat']]);
    await buatPengguna('lainPetugas', '9964000000000007', PDP, fasLain);
    for (const k of ['petugas', 'lihatSaja', 'kasir', 'lainPetugas']) await login(k);
  });

  afterAll(async () => {
    server?.close();
    const where = { fasyankes_id: { in: [fas, fasLain] } };
    await prisma.logAudit.deleteMany({ where });
    await prisma.sesi.deleteMany({ where: { pengguna_id: { in: Object.values(id) } } });
    for (const m of [prisma.permintaanHak, prisma.penarikanPersetujuan, prisma.persetujuan, prisma.teksPersetujuan, prisma.ropa, prisma.dpia, prisma.insidenPasien, prisma.insidenData, prisma.kebijakanRetensi, prisma.pemusnahan, prisma.prosesorData, prisma.peringatanIzin, prisma.izinPerAkun] as any[]) await m.deleteMany({ where });
    await prisma.pasien.deleteMany({ where });
    await prisma.penugasanJenis.deleteMany({ where });
    await prisma.izinJenisAkun.deleteMany({ where });
    await prisma.jenisAkun.deleteMany({ where });
    await prisma.pengguna.deleteMany({ where });
    await prisma.fasyankes.deleteMany({ where: { id: { in: [fas, fasLain] } } });
    await prisma.$disconnect();
  });

  it('permintaan hak: batas 3x24 jam, validasi, izin, daftar dan terlambat', async () => {
    const p = await pasienBaru();
    expect((await hakBaru(p, {}, 'lihatSaja')).status).toBe(403);
    expect((await hakBaru(p, { verifikasi: '' })).status).toBe(400);
    expect((await hakBaru(p, { jenis: 'salah' })).status).toBe(400);
    expect((await hakBaru(99999999)).status).toBe(404);
    const a = await hakBaru(p, { jenis: 'koreksi' });
    expect(a.status).toBe(201);
    expect(a.badan.data.status).toBe('diterima');
    expect(a.badan.data.tahap_berikut).toBe('keputusan');
    expect(new Date(a.badan.data.batas_waktu).getTime() - new Date(a.badan.data.diterima_pada).getTime()).toBe(72 * 3_600_000);
    expect(a.badan.data.terlambat).toBe(false);
    await prisma.permintaanHak.update({ where: { id: a.badan.data.id }, data: { batas_waktu: jam(-5) } });
    const l = await panggil('GET', '/pdp/hak?status=diterima', 'lihatSaja');
    const baris = l.badan.data.data.find((x: any) => x.id === a.badan.data.id);
    expect(baris.terlambat).toBe(true);
    expect(baris.sisa_jam).toBeLessThan(0);
    expect(l.badan.data.terlambat).toBeGreaterThanOrEqual(1);
    expect((await panggil('GET', '/pdp/hak', 'kasir')).status).toBe(403);
    expect((await panggil('GET', '/pdp/hak', 'lainPetugas')).badan.data.data.some((x: any) => x.id === a.badan.data.id)).toBe(false);
  });

  it('proses hak: keputusan, pelaksanaan, notifikasi berurutan; ditolak langsung ke notifikasi', async () => {
    const p = await pasienBaru();
    const id1 = (await hakBaru(p)).badan.data.id;
    expect((await proses(id1, { tahap: 'pelaksanaan', pelaksanaan: 'x' })).status).toBe(409);
    expect((await proses(id1, { tahap: 'notifikasi' })).status).toBe(409);
    expect((await proses(id1, { tahap: 'keputusan', keputusan: 'setujui' }, 'lihatSaja')).status).toBe(403);
    expect((await proses(id1, { tahap: 'keputusan', keputusan: 'tolak' })).status).toBe(400);
    expect((await proses(id1, { tahap: 'keputusan', keputusan: 'setujui' })).badan.data.status).toBe('disetujui');
    expect((await proses(id1, { tahap: 'keputusan', keputusan: 'tolak', alasan: 'x' })).status).toBe(409);
    expect((await proses(id1, { tahap: 'pelaksanaan' })).status).toBe(400);
    expect((await proses(id1, { tahap: 'pelaksanaan', pelaksanaan: 'Salinan diberikan, prosesor diberi tahu' })).badan.data.status).toBe('dilaksanakan');
    const selesai = await proses(id1, { tahap: 'notifikasi', catatan: 'Diberi tahu langsung' });
    expect(selesai.badan.data.status).toBe('selesai');
    expect(selesai.badan.data.tahap_berikut).toBeNull();
    expect(selesai.badan.data.terlambat).toBe(false);
    expect((await proses(id1, { tahap: 'notifikasi' })).status).toBe(409);
    const id2 = (await hakBaru(p, { jenis: 'hapus' })).badan.data.id;
    const tolak = await proses(id2, { tahap: 'keputusan', keputusan: 'tolak', alasan: 'Masih dalam masa retensi 25 tahun' });
    expect(tolak.badan.data.status).toBe('ditolak');
    expect(tolak.badan.data.tahap_berikut).toBe('notifikasi');
    expect((await proses(id2, { tahap: 'pelaksanaan', pelaksanaan: 'x' })).status).toBe(409);
    expect((await proses(id2, { tahap: 'notifikasi' })).badan.data.status).toBe('selesai');
    expect((await proses(id2, { tahap: 'keputusan', keputusan: 'setujui' }, 'lainPetugas')).status).toBe(404);
  });

  it('dua keputusan serempak atas satu permintaan: hanya satu berhasil', async () => {
    const id1 = (await hakBaru(await pasienBaru())).badan.data.id;
    const [a, b] = await Promise.all([proses(id1, { tahap: 'keputusan', keputusan: 'setujui' }), proses(id1, { tahap: 'keputusan', keputusan: 'tolak', alasan: 'x' })]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
  });

  it('teks pemberitahuan berversi: versi baru menggantikan yang berlaku, lama tetap tersimpan', async () => {
    const baru = (n: number, siapa = 'petugas') => panggil('POST', '/pdp/pemberitahuan', siapa, { judul: `Pemberitahuan ${n}`, tujuan: 'Pelayanan', isi: `Isi ${n}` });
    expect((await baru(1, 'lihatSaja')).status).toBe(403);
    expect((await panggil('POST', '/pdp/pemberitahuan', 'petugas', { judul: '', tujuan: 'x', isi: 'x' })).status).toBe(400);
    expect((await baru(1)).status).toBe(201);
    expect((await baru(2)).status).toBe(201);
    const l = await panggil('GET', '/pdp/pemberitahuan', 'lihatSaja');
    expect(l.badan.data.map((x: any) => [x.versi, x.aktif])).toEqual([[2, true], [1, false]]);
    expect((await panggil('GET', '/pdp/pemberitahuan', 'lainPetugas')).badan.data).toHaveLength(0);
  });

  it('tarik persetujuan: status ditarik, batas henti 3x24 jam, tidak ganda, jenis tindakan ditolak', async () => {
    const p = await pasienBaru();
    const buat = (jenis: 'general' | 'tindakan' | 'PDP') => prisma.persetujuan.create({ data: { fasyankes_id: fas, pasien_id: p, jenis, versi_teks: 1, tujuan: 'Pelayanan', bentuk: 'tertulis', penandatangan: 'pasien', penandatangan_nama: 'Pasien' } });
    const g = await buat('general');
    const t = await buat('tindakan');
    expect((await panggil('POST', '/pdp/persetujuan/tarik', 'lihatSaja', { persetujuan_id: g.id, alasan: 'x' })).status).toBe(403);
    expect((await panggil('POST', '/pdp/persetujuan/tarik', 'petugas', { persetujuan_id: g.id, alasan: '' })).status).toBe(400);
    expect((await panggil('POST', '/pdp/persetujuan/tarik', 'petugas', { persetujuan_id: t.id, alasan: 'x' })).status).toBe(400);
    expect((await panggil('POST', '/pdp/persetujuan/tarik', 'lainPetugas', { persetujuan_id: g.id, alasan: 'x' })).status).toBe(404);
    const r = await panggil('POST', '/pdp/persetujuan/tarik', 'petugas', { persetujuan_id: g.id, alasan: 'Tidak mau datanya dipakai' });
    expect(r.status).toBe(200);
    expect(new Date(r.badan.data.batas_henti).getTime() - Date.now()).toBeGreaterThan(71 * 3_600_000);
    expect((await panggil('POST', '/pdp/persetujuan/tarik', 'petugas', { persetujuan_id: g.id, alasan: 'lagi' })).status).toBe(409);
    expect((await prisma.persetujuan.findUniqueOrThrow({ where: { id: g.id } })).status).toBe('ditarik');
    const l = await panggil('GET', '/pdp/persetujuan?status=ditarik', 'petugas');
    const baris = l.badan.data.data.find((x: any) => x.id === g.id);
    expect(baris.penarikan.alasan).toBe('Tidak mau datanya dipakai');
    expect(l.badan.data.data.some((x: any) => x.id === t.id)).toBe(false);
  });

  it('ROPA: 13 butir wajib, ubah, ekspor CSV dinetralkan, dibatasi fasyankes', async () => {
    expect((await panggil('POST', '/pdp/ropa', 'petugas', { ...ropaIsi, tujuan: '' })).status).toBe(400);
    expect((await panggil('POST', '/pdp/ropa', 'petugas', { ...ropaIsi, dasar: 'salah' })).status).toBe(400);
    expect((await panggil('POST', '/pdp/ropa', 'lihatSaja', ropaIsi)).status).toBe(403);
    const a = await panggil('POST', '/pdp/ropa', 'petugas', { ...ropaIsi, nama_kegiatan: '=HYPERLINK("x")' });
    expect(a.status).toBe(201);
    expect((await panggil('PUT', `/pdp/ropa/${a.badan.data.id}`, 'petugas', { ...ropaIsi, nama_kegiatan: 'Pendaftaran', masa_retensi: '25 tahun sejak tutup' })).status).toBe(200);
    expect((await panggil('PUT', `/pdp/ropa/${a.badan.data.id}`, 'lainPetugas', ropaIsi)).status).toBe(404);
    await panggil('POST', '/pdp/ropa', 'petugas', { ...ropaIsi, nama_kegiatan: '=cmd|calc' });
    const csv = await fetch(url('/pdp/ropa?format=csv'), { headers: { cookie: cookie.petugas } });
    expect(csv.headers.get('content-type')).toContain('text/csv');
    const teks = await csv.text();
    expect(teks.split('\n')[0]).toContain('Nama kegiatan');
    expect(teks).toContain("'=cmd|calc");
    expect(teks).not.toContain(',=cmd');
    const l = await panggil('GET', '/pdp/ropa', 'lihatSaja');
    expect(l.badan.data.total).toBe(2);
    expect((await panggil('GET', '/pdp/ropa', 'lainPetugas')).badan.data.total).toBe(0);
  });

  it('DPIA: terkait ROPA, tanggal tinjau ulang, jatuh tempo, tandai ditinjau', async () => {
    const ropa = (await panggil('POST', '/pdp/ropa', 'petugas', ropaIsi)).badan.data.id;
    const isi = { pemrosesan: 'Pengiriman SATUSEHAT', risiko: 'Data bocor saat kirim', mitigasi: 'Enkripsi TLS', tinjau_ulang_pada: tanggalLokal(30) };
    expect((await panggil('POST', '/pdp/dpia', 'petugas', { ...isi, ropa_id: 99999999 })).status).toBe(400);
    expect((await panggil('POST', '/pdp/dpia', 'petugas', { ...isi, tinjau_ulang_pada: '30-12-2026' })).status).toBe(400);
    expect((await panggil('POST', '/pdp/dpia', 'lihatSaja', isi)).status).toBe(403);
    const a = await panggil('POST', '/pdp/dpia', 'petugas', { ...isi, ropa_id: ropa });
    expect(a.status).toBe(201);
    let l = await panggil('GET', '/pdp/dpia', 'petugas');
    let d = l.badan.data.data.find((x: any) => x.id === a.badan.data.id);
    expect(d.ropa_nama).toBe('Pendaftaran pasien');
    expect(d.jatuh_tempo).toBe(false);
    expect(d.ditinjau_pada).toBeNull();
    const u = await panggil('PUT', `/pdp/dpia/${a.badan.data.id}`, 'petugas', { ...isi, tinjau_ulang_pada: tanggalLokal(-2), saran_ppdp: 'Tambah audit', tandai_ditinjau: true });
    expect(u.status).toBe(200);
    l = await panggil('GET', '/pdp/dpia', 'petugas');
    d = l.badan.data.data.find((x: any) => x.id === a.badan.data.id);
    expect(d.jatuh_tempo).toBe(true);
    expect(d.ditinjau_pada).not.toBeNull();
    expect(d.saran_ppdp).toBe('Tambah audit');
    expect((await panggil('PUT', `/pdp/dpia/${a.badan.data.id}`, 'lainPetugas', isi)).status).toBe(404);
  });

  it('insiden: batas notifikasi 3x24 jam, terlambat, pasien terdampak, validasi', async () => {
    const [p1, p2] = [await pasienBaru(), await pasienBaru()];
    const lain = await pasienBaru(fasLain);
    const waktu = (n: number) => new Date(Date.now() + n * 3_600_000).toISOString();
    const isi = { waktu_diketahui: waktu(-100), siber: true, uraian: 'Laptop petugas hilang', data_terungkap: 'Nama dan nomor RM', pasien_ids: [p1, p2] };
    expect((await panggil('POST', '/pdp/insiden', 'petugas', { ...isi, waktu_kejadian: waktu(-1) })).status).toBe(400);
    expect((await panggil('POST', '/pdp/insiden', 'petugas', { ...isi, pasien_ids: [lain] })).status).toBe(400);
    expect((await panggil('POST', '/pdp/insiden', 'petugas', { ...isi, uraian: '' })).status).toBe(400);
    expect((await panggil('POST', '/pdp/insiden', 'lihatSaja', isi)).status).toBe(403);
    const a = await panggil('POST', '/pdp/insiden', 'petugas', isi);
    expect(a.status).toBe(201);
    expect(a.badan.data.jumlah_terdampak).toBe(2);
    expect(new Date(a.badan.data.batas_notifikasi).getTime() - new Date(a.badan.data.waktu_diketahui).getTime()).toBe(72 * 3_600_000);
    expect(a.badan.data.terlambat).toBe(true);
    const u = await panggil('PUT', `/pdp/insiden/${a.badan.data.id}`, 'petugas', { ...isi, penanganan: 'Akun dikunci', pemulihan: 'Data dipulihkan', kontak_ppdp: 'ppdp@klinik.id', notifikasi_pasien_pada: waktu(-1), notifikasi_lembaga_pada: waktu(-1) });
    expect(u.status).toBe(200);
    expect(u.badan.data.terlambat).toBe(false);
    expect(u.badan.data.penanganan).toBe('Akun dikunci');
    const baru = await panggil('POST', '/pdp/insiden', 'petugas', { ...isi, waktu_diketahui: waktu(-2), pasien_ids: [] });
    expect(baru.badan.data.terlambat).toBe(false);
    expect(baru.badan.data.sisa_jam).toBeGreaterThan(60);
    const l = await panggil('GET', '/pdp/insiden', 'lihatSaja');
    expect(l.badan.data.total).toBe(2);
    expect((await panggil('PUT', `/pdp/insiden/${a.badan.data.id}`, 'lainPetugas', { ...isi, pasien_ids: [] })).status).toBe(404);
  });

  it('prosesor: perjanjian 11 butir, sub-prosesor wajib persetujuan, SLA 1 sampai 72 jam', async () => {
    expect((await panggil('POST', '/pdp/prosesor', 'petugas', { ...prosesorIsi, sla_lapor_jam: 100 })).status).toBe(400);
    expect((await panggil('POST', '/pdp/prosesor', 'petugas', { ...prosesorIsi, butir_perjanjian: ['salah'] })).status).toBe(400);
    expect((await panggil('POST', '/pdp/prosesor', 'petugas', { ...prosesorIsi, sub_prosesor: [{ nama: 'Cloud X', layanan: 'Penyimpanan', persetujuan_pada: '' }] })).status).toBe(400);
    expect((await panggil('POST', '/pdp/prosesor', 'lihatSaja', prosesorIsi)).status).toBe(403);
    const a = await panggil('POST', '/pdp/prosesor', 'petugas', { ...prosesorIsi, sub_prosesor: [{ nama: 'Cloud X', layanan: 'Penyimpanan', persetujuan_pada: '2026-10-01' }] });
    expect(a.status).toBe(201);
    let l = await panggil('GET', '/pdp/prosesor', 'lihatSaja');
    const d = l.badan.data.data.find((x: any) => x.id === a.badan.data.id);
    expect(d.butir_kurang).toHaveLength(9);
    expect(d.sub_prosesor[0].nama).toBe('Cloud X');
    expect((await panggil('PUT', `/pdp/prosesor/${a.badan.data.id}`, 'petugas', { ...prosesorIsi, aktif: false })).status).toBe(200);
    expect((await panggil('GET', '/pdp/prosesor/opsi', 'petugas')).badan.data.some((x: any) => x.id === a.badan.data.id)).toBe(false);
    expect((await panggil('PUT', `/pdp/prosesor/${a.badan.data.id}`, 'lainPetugas', prosesorIsi)).status).toBe(404);
    l = await panggil('GET', '/pdp/prosesor', 'lainPetugas');
    expect(l.badan.data.total).toBe(0);
  });

  it('pemusnahan: berurutan perintah ke prosesor, pelaksanaan (cadangan wajib), berita acara; kebijakan retensi bawaan', async () => {
    const k = await panggil('GET', '/pdp/retensi', 'lihatSaja');
    expect(k.badan.data[0]).toMatchObject({ jenis_data: 'Rekam medis elektronik', periode_tahun: 25 });
    const pr = (await panggil('POST', '/pdp/prosesor', 'petugas', { ...prosesorIsi, nama: 'Backup Nusantara' })).badan.data.id;
    const p = await pasienBaru();
    const rencana = { cakupan: 'Data kunjungan pasien X', dasar: 'permintaan_hak', pasien_id: p, jadwal: tanggalLokal(-1) };
    expect((await panggil('POST', '/pdp/pemusnahan', 'petugas', { ...rencana, jadwal: 'besok' })).status).toBe(400);
    expect((await panggil('POST', '/pdp/pemusnahan', 'petugas', { ...rencana, permintaan_hak_id: 99999999 })).status).toBe(404);
    expect((await panggil('POST', '/pdp/pemusnahan', 'lihatSaja', rencana)).status).toBe(403);
    const a = await panggil('POST', '/pdp/pemusnahan', 'petugas', rencana);
    expect(a.status).toBe(201);
    expect(a.badan.data.status).toBe('direncanakan');
    expect(a.badan.data.tahap_berikut).toBe('perintah');
    expect(a.badan.data.terlambat).toBe(true);
    const id = a.badan.data.id;
    const musnah = (badan: Record<string, unknown>, siapa = 'petugas') => panggil('POST', `/pdp/pemusnahan/${id}/proses`, siapa, badan);
    expect((await musnah({ tahap: 'pelaksanaan', pelaksana: 'Admin', metode: 'Hapus aman', mencakup_cadangan: true })).status).toBe(409);
    expect((await musnah({ tahap: 'berita_acara', berita_acara: 'x' })).status).toBe(409);
    expect((await musnah({ tahap: 'perintah', prosesor_id: 99999999, nomor_perintah: 'PRT-1' })).status).toBe(400);
    expect((await musnah({ tahap: 'perintah', prosesor_id: pr, nomor_perintah: 'PRT-1' }, 'lihatSaja')).status).toBe(403);
    const perintah = await musnah({ tahap: 'perintah', prosesor_id: pr, nomor_perintah: 'PRT-1' });
    expect(perintah.badan.data.status).toBe('diperintahkan');
    expect(perintah.badan.data.prosesor_nama).toBe('Backup Nusantara');
    expect((await musnah({ tahap: 'perintah', prosesor_id: pr, nomor_perintah: 'PRT-2' })).status).toBe(409);
    expect((await musnah({ tahap: 'pelaksanaan', pelaksana: 'Admin', metode: 'Hapus aman', mencakup_cadangan: false })).status).toBe(400);
    expect((await musnah({ tahap: 'pelaksanaan', pelaksana: 'Admin', metode: 'Hapus aman', mencakup_cadangan: true })).badan.data.status).toBe('dilaksanakan');
    const selesai = await musnah({ tahap: 'berita_acara', berita_acara: 'Data dimusnahkan pada sistem, cadangan, dan prosesor.' });
    expect(selesai.badan.data.status).toBe('selesai');
    expect(selesai.badan.data.terlambat).toBe(false);
    expect((await musnah({ tahap: 'berita_acara', berita_acara: 'lagi' })).status).toBe(409);
    expect((await musnah({ tahap: 'berita_acara', berita_acara: 'x' }, 'lainPetugas')).status).toBe(404);
    expect(await prisma.logAudit.count({ where: { fasyankes_id: fas, entitas: 'pemusnahan' } })).toBe(4);
  });
});
