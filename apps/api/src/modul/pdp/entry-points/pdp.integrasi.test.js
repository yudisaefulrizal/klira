import { jest } from '@jest/globals';

const uji = await import("@klira/db/uji");
const kliraRequired0 = await import("@klira/db");
const kliraRequired1 = await import("../../../app.js");

const urlUji = (process.env.KLIRA_UJI_DB === '1' ? process.env.DATABASE_URL : undefined);

const d = urlUji ? describe : describe.skip;

d('pelindungan data pribadi terhadap database pengujian', () => {
    const kode = `UJI-PDP-${Date.now()}`;
    let server;
    let fas = 0;
    let fasLain = 0;
    const id = {};
    const cookie = {};
    const url = (p) => `http://127.0.0.1:${server.address().port}/api${p}`;
    const panggil = async (metode, p, siapa, badan) => {
        const res = await fetch(url(p), { method: metode, headers: { 'content-type': 'application/json', ...(siapa ? { cookie: cookie[siapa] } : {}) }, body: badan === undefined ? undefined : JSON.stringify(badan) });
        return { status: res.status, badan: (await res.json().catch(() => null)) };
    };
    async function buatPengguna(kunci, nik, izin, fasId = fas) {
        const { hashKataSandi } = kliraRequired0;
        const u = await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahPenggunaUntukBuatPengguna(fasId, `Nama ${kunci}`, nik, `${kode}-${kunci}`, await hashKataSandi('sandi-uji-1'), false, koneksiBaru); return uji.tambahPenggunaUntukBuatPenggunaHasil(_hasil.id, koneksiBaru); });
        id[kunci] = u.id;
        const j = await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahJenisAkunUntukBuatPengguna(fasId, `Jenis ${kunci}`, koneksiBaru); return uji.tambahJenisAkunUntukJenisPaketHasil(_hasil.id, koneksiBaru); });
        for (const [fitur, aksi] of izin) {
            const r = await uji.transaksi(async (koneksiBaru) => { await uji.simpanIzinUntukAksesIzinIntegrasiTest(fitur, aksi, 'unit', koneksiBaru); return uji.simpanIzinUntukAksesIzinIntegrasiTestHasil(fitur, aksi, 'unit', koneksiBaru); });
            await uji.tambahIzinJenisAkunUntukBuatPengguna(fasId, j.id, r.id);
        }
        await uji.tambahPenugasanJenisUntukAksesIzinIntegrasiTest(fasId, u.id, j.id, new Date(Date.now() - 86_400_000));
    }
    async function login(kunci) {
        const res = await fetch(url('/masuk'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: `${kode}-${kunci}`, kata_sandi: 'sandi-uji-1' }) });
        expect(res.status).toBe(200);
        cookie[kunci] = res.headers.get('set-cookie').split(';')[0];
    }
    const buatFasyankes = async (kodeReg, nama) => {
        const f = await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahFasyankesUntukAksesIzinIntegrasiTest(-8, nama, 'klinik_pratama_rawat_jalan', kodeReg, koneksiBaru); return uji.tambahFasyankesUntukAksesIzinIntegrasiTestHasil(_hasil.id, koneksiBaru); });
        await uji.ubahFasyankesUntukAksesIzinIntegrasiTest(f.id);
        return f.id;
    };
    let nomor = 0;
    const pasienBaru = async (fasId = fas) => {
        nomor += 1;
        return (await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahPasienUntukBuatKunjungan(fasId, `${kode}-${nomor}`, `Pasien ${nomor}`, new Date('1980-01-01'), 'perempuan', koneksiBaru); return uji.tambahPasienUntukBuatKunjunganHasil(_hasil.id, koneksiBaru); })).id;
    };
    const PDP = [['pdp', 'lihat'], ['pdp', 'input'], ['pdp', 'perbaikan']];
    const jam = (n) => new Date(Date.now() + n * 3_600_000);
    const tanggalLokal = (n) => new Date(Date.now() + 7 * 3_600_000 + n * 86_400_000).toISOString().slice(0, 10);
    const hakBaru = (pasien_id, extra = {}, siapa = 'petugas') => panggil('POST', '/pdp/hak', siapa, { pasien_id, jenis: 'akses', saluran: 'langsung', pemohon_nama: 'Pasien sendiri', pemohon_hubungan: 'pasien', verifikasi: 'KTP dicocokkan', ...extra });
    const proses = (id, badan, siapa = 'petugas') => panggil('POST', `/pdp/hak/${id}/proses`, siapa, badan);
    const ropaIsi = { nama_kegiatan: 'Pendaftaran pasien', ppdp_nama: 'Budi', sumber_tujuan: 'Pasien ke klinik', dasar: 'persetujuan', tujuan: 'Pelayanan kesehatan', jenis_data: 'Identitas, kontak', kategori_subjek: 'Pasien', pihak_akses: 'Petugas pendaftaran', pemenuhan_hak: 'Lewat petugas PDP', aliran: 'Aplikasi ke basis data', masa_retensi: '25 tahun', pengamanan: 'Enkripsi, kontrol akses', transfer: 'Tidak ada' };
    const prosesorIsi = { nama: 'Hosting Nusantara', layanan: 'Hosting aplikasi', lokasi_data: 'Jakarta', nomor_perjanjian: 'P-01', butir_perjanjian: ['objek_jangka', 'kerahasiaan'], sub_prosesor: [], sla_lapor_jam: 24 };
    beforeAll(async () => {
        fas = await buatFasyankes(kode, 'Uji PDP');
        fasLain = await buatFasyankes(`${kode}-LAIN`, 'Uji PDP Lain');
        const { buatApp } = kliraRequired1;
        server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
        await buatPengguna('petugas', '9964000000000001', PDP);
        await buatPengguna('lihatSaja', '9964000000000002', [['pdp', 'lihat']]);
        await buatPengguna('kasir', '9964000000000005', [['kasir', 'lihat']]);
        await buatPengguna('lainPetugas', '9964000000000007', PDP, fasLain);
        for (const k of ['petugas', 'lihatSaja', 'kasir', 'lainPetugas'])
            await login(k);
    });
    afterAll(async () => {
        server?.close();
        const where = { fasyankes_id: { in: [fas, fasLain] } };
        await uji.hapusLogAuditUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusSesiUntukAksesIzinIntegrasiTest(Object.values(id));
        for (const m of [uji.hapusPermintaanHakFasyankesUji, uji.hapusPenarikanPersetujuanFasyankesUji, uji.hapusPersetujuanFasyankesUji, uji.hapusTeksPersetujuanFasyankesUji, uji.hapusRopaFasyankesUji, uji.hapusDpiaFasyankesUji, uji.hapusInsidenPasienFasyankesUji, uji.hapusInsidenDataFasyankesUji, uji.hapusKebijakanRetensiFasyankesUji, uji.hapusPemusnahanFasyankesUji, uji.hapusProsesorDataFasyankesUji, uji.hapusPeringatanIzinFasyankesUji, uji.hapusIzinPerAkunFasyankesUji])
            await m(where.fasyankes_id.in);
        await uji.hapusPasienUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusPenugasanJenisUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusIzinJenisAkunUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusJenisAkunUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusPenggunaUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusFasyankesUntukAksesRepositoriIntegrasiTest([fas, fasLain]);
        await uji.tutupPool();
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
        await uji.ubahPermintaanHakUntukPdpPdpIntegrasiTest(jam(-5), a.badan.data.id);
        const l = await panggil('GET', '/pdp/hak?status=diterima', 'lihatSaja');
        const baris = l.badan.data.data.find((x) => x.id === a.badan.data.id);
        expect(baris.terlambat).toBe(true);
        expect(baris.sisa_jam).toBeLessThan(0);
        expect(l.badan.data.terlambat).toBeGreaterThanOrEqual(1);
        expect((await panggil('GET', '/pdp/hak', 'kasir')).status).toBe(403);
        expect((await panggil('GET', '/pdp/hak', 'lainPetugas')).badan.data.data.some((x) => x.id === a.badan.data.id)).toBe(false);
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
        const baru = (n, siapa = 'petugas') => panggil('POST', '/pdp/pemberitahuan', siapa, { judul: `Pemberitahuan ${n}`, tujuan: 'Pelayanan', isi: `Isi ${n}` });
        expect((await baru(1, 'lihatSaja')).status).toBe(403);
        expect((await panggil('POST', '/pdp/pemberitahuan', 'petugas', { judul: '', tujuan: 'x', isi: 'x' })).status).toBe(400);
        expect((await baru(1)).status).toBe(201);
        expect((await baru(2)).status).toBe(201);
        const l = await panggil('GET', '/pdp/pemberitahuan', 'lihatSaja');
        expect(l.badan.data.map((x) => [x.versi, x.aktif])).toEqual([[2, true], [1, false]]);
        expect((await panggil('GET', '/pdp/pemberitahuan', 'lainPetugas')).badan.data).toHaveLength(0);
    });
    it('tarik persetujuan: status ditarik, batas henti 3x24 jam, tidak ganda, jenis tindakan ditolak', async () => {
        const p = await pasienBaru();
        const buat = (jenis) => uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahPersetujuanUntukBuat(fas, p, jenis, 1, 'Pelayanan', 'tertulis', 'pasien', 'Pasien', koneksiBaru); return uji.tambahPersetujuanUntukBuatHasil(_hasil.id, koneksiBaru); });
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
        expect((await uji.tambahPersetujuanUntukBuatHasil(g.id)).status).toBe('ditarik');
        const l = await panggil('GET', '/pdp/persetujuan?status=ditarik', 'petugas');
        const baris = l.badan.data.data.find((x) => x.id === g.id);
        expect(baris.penarikan.alasan).toBe('Tidak mau datanya dipakai');
        expect(l.badan.data.data.some((x) => x.id === t.id)).toBe(false);
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
        let d = l.badan.data.data.find((x) => x.id === a.badan.data.id);
        expect(d.ropa_nama).toBe('Pendaftaran pasien');
        expect(d.jatuh_tempo).toBe(false);
        expect(d.ditinjau_pada).toBeNull();
        const u = await panggil('PUT', `/pdp/dpia/${a.badan.data.id}`, 'petugas', { ...isi, tinjau_ulang_pada: tanggalLokal(-2), saran_ppdp: 'Tambah audit', tandai_ditinjau: true });
        expect(u.status).toBe(200);
        l = await panggil('GET', '/pdp/dpia', 'petugas');
        d = l.badan.data.data.find((x) => x.id === a.badan.data.id);
        expect(d.jatuh_tempo).toBe(true);
        expect(d.ditinjau_pada).not.toBeNull();
        expect(d.saran_ppdp).toBe('Tambah audit');
        expect((await panggil('PUT', `/pdp/dpia/${a.badan.data.id}`, 'lainPetugas', isi)).status).toBe(404);
    });
    it('insiden: batas notifikasi 3x24 jam, terlambat, pasien terdampak, validasi', async () => {
        const [p1, p2] = [await pasienBaru(), await pasienBaru()];
        const lain = await pasienBaru(fasLain);
        const waktu = (n) => new Date(Date.now() + n * 3_600_000).toISOString();
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
        const d = l.badan.data.data.find((x) => x.id === a.badan.data.id);
        expect(d.butir_kurang).toHaveLength(9);
        expect(d.sub_prosesor[0].nama).toBe('Cloud X');
        expect((await panggil('PUT', `/pdp/prosesor/${a.badan.data.id}`, 'petugas', { ...prosesorIsi, aktif: false })).status).toBe(200);
        expect((await panggil('GET', '/pdp/prosesor/opsi', 'petugas')).badan.data.some((x) => x.id === a.badan.data.id)).toBe(false);
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
        const musnah = (badan, siapa = 'petugas') => panggil('POST', `/pdp/pemusnahan/${id}/proses`, siapa, badan);
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
        expect(await uji.hitungLogAuditUntukPdpPdpIntegrasiTest(fas, 'pemusnahan')).toBe(4);
    });
    it('ringkasan tugas: hitungan hak, insiden, DPIA, pemusnahan; butuh izin lihat', async () => {
        expect((await panggil('GET', '/pdp/ringkasan', 'kasir')).status).toBe(403);
        const r = await panggil('GET', '/pdp/ringkasan', 'lihatSaja');
        expect(r.status).toBe(200);
        expect(r.badan.data.hak_aktif).toBeGreaterThanOrEqual(1);
        expect(r.badan.data.hak_terlambat).toBeGreaterThanOrEqual(1);
        expect(r.badan.data.dpia_jatuh_tempo).toBeGreaterThanOrEqual(1);
        expect(r.badan.data.insiden_terlambat).toBeLessThanOrEqual(r.badan.data.insiden_belum_notifikasi);
        const lain = await panggil('GET', '/pdp/ringkasan', 'lainPetugas');
        expect(lain.badan.data).toEqual({ hak_aktif: 0, hak_terlambat: 0, insiden_belum_notifikasi: 0, insiden_terlambat: 0, dpia_jatuh_tempo: 0, pemusnahan_terlambat: 0 });
    });
});