import { jest } from '@jest/globals';

const uji = await import("@klira/db/uji");
const kliraRequired0 = await import("@klira/db");
const kliraRequired1 = await import("../../../app.js");

const urlUji = (process.env.KLIRA_UJI_DB === '1' ? process.env.DATABASE_URL : undefined);

const d = urlUji ? describe : describe.skip;

d('rekam medis (resume, surat, pembukaan, penyampaian, laporan) terhadap database pengujian', () => {
    const kode = `UJI-DOK-${Date.now()}`;
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
    const kunjunganBaru = async (tahap = 'pemeriksaan', fasId = fas, waktuTutup = null) => {
        nomor += 1;
        const p = await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahPasienUntukBuatKunjungan(fasId, `${kode}-${nomor}`, `Pasien ${nomor}`, new Date('1980-01-01'), 'perempuan', koneksiBaru); return uji.tambahPasienUntukBuatKunjunganHasil(_hasil.id, koneksiBaru); });
        return (await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahKunjunganUntukKunjunganBaru2(fasId, p.id, 'AMB', tahap, (waktuTutup) ? (waktuTutup) : (undefined), koneksiBaru); return uji.tambahKunjunganUntukBuatKunjunganHasil(_hasil.id, koneksiBaru); })).id;
    };
    async function kunjunganTutup(tahap = 'ditutup', fasId = fas, lokasiId = null) {
        const k = await kunjunganBaru(tahap, fasId, tahap === 'ditutup' ? new Date() : null);
        if (lokasiId)
            await uji.ubahKunjunganUntukKunjunganTutup(lokasiId, k);
        return k;
    }
    const DOKTER = [['klinis', 'lihat'], ['klinis', 'input'], ['pasien', 'lihat']];
    const PEREKAM = [['rekam-medis', 'lihat'], ['rekam-medis', 'input'], ['rekam-medis', 'perbaikan'], ['pasien', 'lihat']];
    const resume = { ringkasan: 'Pasien datang dengan pusing, tekanan darah tinggi, diberi obat.', diagnosis_akhir: 'I10 Hipertensi esensial', terapi: 'Amlodipin 5 mg', kondisi_pulang: 'Membaik', anjuran: 'Kontrol 1 minggu' };
    beforeAll(async () => {
        fas = await buatFasyankes(kode, 'Uji Dokumen RM');
        fasLain = await buatFasyankes(`${kode}-LAIN`, 'Uji Dokumen Lain');
        const { buatApp } = kliraRequired1;
        server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
        await buatPengguna('dokter', '9961000000000001', DOKTER);
        await buatPengguna('perekam', '9961000000000003', PEREKAM);
        await buatPengguna('perekam2', '9961000000000004', PEREKAM);
        await buatPengguna('kasir', '9961000000000005', [['kasir', 'lihat']]);
        await buatPengguna('lainDokter', '9961000000000007', DOKTER, fasLain);
        for (const k of ['dokter', 'perekam', 'perekam2', 'kasir', 'lainDokter'])
            await login(k);
    });
    afterAll(async () => {
        server?.close();
        const where = { fasyankes_id: { in: [fas, fasLain] } };
        await uji.hapusLogAuditUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusSesiUntukAksesIzinIntegrasiTest(Object.values(id));
        for (const m of [uji.hapusResumeMedisFasyankesUji, uji.hapusSuratFasyankesUji, uji.hapusPembukaanRmFasyankesUji, uji.hapusPenyampaianRmFasyankesUji, uji.hapusVersiCatatanFasyankesUji, uji.hapusPengesahanCatatanFasyankesUji, uji.hapusPeringatanIzinFasyankesUji, uji.hapusIzinPerAkunFasyankesUji])
            await m(where.fasyankes_id.in);
        await uji.hapusDiagnosisFasyankesUji(where.fasyankes_id.in);
        await uji.hapusAntreanUntukKlinisKlinisIntegrasiTest([fas, fasLain]);
        await uji.hapusKunjunganUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusLokasiUntukKlinisKlinisIntegrasiTest([fas, fasLain]);
        await uji.hapusPasienUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusPenugasanJenisUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusIzinJenisAkunUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusJenisAkunUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusPenggunaUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusFasyankesUntukAksesRepositoriIntegrasiTest([fas, fasLain]);
        await uji.tutupPool();
    });
    it('resume: hanya setelah tutup, ubah butuh alasan, versi lama tersimpan, izin dan fasyankes dibatasi', async () => {
        const buka = await kunjunganTutup('pemeriksaan');
        expect((await panggil('PUT', `/kunjungan/${buka}/resume`, 'dokter', resume)).status).toBe(409);
        const k = await kunjunganTutup();
        expect((await panggil('PUT', `/kunjungan/${k}/resume`, 'kasir', resume)).status).toBe(403);
        expect((await panggil('PUT', `/kunjungan/${k}/resume`, 'lainDokter', resume)).status).toBe(404);
        expect((await panggil('PUT', `/kunjungan/${k}/resume`, 'dokter', { ...resume, ringkasan: '' })).status).toBe(400);
        const a = await panggil('PUT', `/kunjungan/${k}/resume`, 'dokter', resume);
        expect(a.status).toBe(200);
        expect(a.badan.data.resume.versi).toBe(1);
        expect(a.badan.data.resume.verifikasi).toBe('sah');
        expect((await panggil('PUT', `/kunjungan/${k}/resume`, 'dokter', { ...resume, anjuran: 'Kontrol 2 minggu' })).status).toBe(400);
        const b = await panggil('PUT', `/kunjungan/${k}/resume`, 'dokter', { ...resume, anjuran: 'Kontrol 2 minggu', alasan: 'Koreksi jadwal' });
        expect(b.status).toBe(200);
        expect(b.badan.data.resume.versi).toBe(2);
        expect(await uji.hitungVersiCatatanUntukRekamMedisDokumenIntegrasiTest('resume_medis', k)).toBe(1);
        expect((await panggil('GET', `/kunjungan/${k}/dokumen`, 'lainDokter')).status).toBe(404);
    });
    it('surat: nomor berurutan, rujukan butuh tujuan', async () => {
        const k = await kunjunganTutup();
        expect((await panggil('POST', `/kunjungan/${k}/surat`, 'dokter', { jenis: 'rujukan', isi: 'Mohon tindak lanjut' })).status).toBe(400);
        const s1 = await panggil('POST', `/kunjungan/${k}/surat`, 'dokter', { jenis: 'rujukan', tujuan: 'RSUD Kota', isi: 'Mohon tindak lanjut' });
        const s2 = await panggil('POST', `/kunjungan/${k}/surat`, 'dokter', { jenis: 'keterangan_sakit', isi: 'Istirahat 2 hari' });
        expect(s1.status).toBe(201);
        expect(s1.badan.data.nomor_surat).toMatch(/^S-\d{8}-\d{3}$/);
        expect(s2.badan.data.nomor_surat).not.toBe(s1.badan.data.nomor_surat);
        const d = await panggil('GET', `/kunjungan/${k}/dokumen`, 'dokter');
        expect(d.badan.data.surat).toHaveLength(2);
        expect(d.badan.data.saran).toBeDefined();
    });
    it('pembukaan: dasar hukum butuh alasan, penyetuju bukan pemohon, keputusan sekali', async () => {
        const k = await kunjunganTutup();
        const pasienId = (await uji.tambahKunjunganUntukBuatKunjunganHasil(k)).pasien_id;
        const dasar = { pasien_id: pasienId, pemohon_nama: 'Penyidik A', pemohon_instansi: 'Polres', dasar: 'hukum', dasar_rinci: 'Surat perintah 12/2026', cakupan: 'Resume kunjungan terakhir' };
        expect((await panggil('POST', '/rekam-medis/pembukaan', 'perekam', dasar)).status).toBe(400);
        expect((await panggil('POST', '/rekam-medis/pembukaan', 'kasir', { ...dasar, alasan_hukum: 'penegakan_hukum' })).status).toBe(403);
        const a = await panggil('POST', '/rekam-medis/pembukaan', 'perekam', { ...dasar, alasan_hukum: 'penegakan_hukum' });
        expect(a.status).toBe(201);
        const idP = a.badan.data.id;
        expect((await panggil('POST', `/rekam-medis/pembukaan/${idP}/keputusan`, 'perekam', { keputusan: 'setujui' })).status).toBe(409);
        expect((await panggil('POST', `/rekam-medis/pembukaan/${idP}/keputusan`, 'perekam2', { keputusan: 'tolak' })).status).toBe(400);
        const s = await panggil('POST', `/rekam-medis/pembukaan/${idP}/keputusan`, 'perekam2', { keputusan: 'setujui', catatan: 'Sesuai surat' });
        expect(s.status).toBe(200);
        expect(s.badan.data.status).toBe('disetujui');
        expect(s.badan.data.identitas_disamarkan).toBe(true);
        expect((await panggil('POST', `/rekam-medis/pembukaan/${idP}/keputusan`, 'perekam2', { keputusan: 'tolak', catatan: 'x' })).status).toBe(409);
        const l = await panggil('GET', '/rekam-medis/pembukaan?status=disetujui', 'perekam');
        expect(l.badan.data.data.some((x) => x.id === idP)).toBe(true);
        expect((await panggil('GET', '/rekam-medis/pembukaan', 'lainDokter')).status).toBe(403);
    });
    it('penyampaian: keluarga dan pihak lain butuh bukti persetujuan, tercatat di audit', async () => {
        const k = await kunjunganTutup();
        const pasienId = (await uji.tambahKunjunganUntukBuatKunjunganHasil(k)).pasien_id;
        const dasar = { pasien_id: pasienId, kunjungan_id: k, penerima_nama: 'Ibu Budi', hubungan: 'keluarga', bentuk: 'cetak' };
        expect((await panggil('POST', '/rekam-medis/penyampaian', 'perekam', dasar)).status).toBe(400);
        expect((await panggil('POST', '/rekam-medis/penyampaian', 'perekam', { ...dasar, bukti_persetujuan: 'Surat kuasa 3/2026' })).status).toBe(201);
        expect((await panggil('POST', '/rekam-medis/penyampaian', 'perekam', { ...dasar, hubungan: 'pasien', penerima_nama: 'Pasien' })).status).toBe(201);
        expect((await panggil('POST', '/rekam-medis/penyampaian', 'perekam', { ...dasar, bukti_persetujuan: 'Surat kuasa', pasien_id: 999999999 })).status).toBe(404);
        const l = await panggil('GET', `/rekam-medis/penyampaian?cari=${encodeURIComponent('Ibu Budi')}`, 'perekam');
        expect(l.badan.data.total).toBe(1);
        expect(await uji.hitungLogAuditUntukPdpPdpIntegrasiTest(fas, 'penyampaian_rm')).toBe(2);
    });
    it('laporan: per poli, diagnosis terbanyak, CSV, rentang terbalik ditolak', async () => {
        const poli = await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahLokasiUntukKlinisKlinisIntegrasiTest(fas, 'Poli Umum', 'poli', koneksiBaru); return uji.tambahLokasiUntukKlinisKlinisIntegrasiTestHasil(_hasil.id, koneksiBaru); });
        const k1 = await kunjunganTutup('ditutup', fas, poli.id);
        const k2 = await kunjunganTutup('ditutup', fas, poli.id);
        await uji.tambahBanyakDiagnosisUntukKunjunganBaru([k1, k2].map((kunjungan_id) => ({ fasyankes_id: fas, kunjungan_id, versi: 1, kode_icd10: 'I10', nama: 'Hipertensi esensial', peran: 'utama', urutan: 1 })));
        const poliLap = await panggil('GET', '/rekam-medis/laporan?jenis=kunjungan_per_poli', 'perekam');
        expect(poliLap.status).toBe(200);
        expect(poliLap.badan.data.baris.find((b) => b[0] === 'Poli Umum')[1]).toBe(2);
        const diag = await panggil('GET', '/rekam-medis/laporan?jenis=diagnosis_terbanyak', 'perekam');
        expect(diag.badan.data.baris[0]).toEqual(['I10', 'Hipertensi esensial', 2]);
        expect((await panggil('GET', '/rekam-medis/laporan?jenis=status_pengkodean', 'perekam')).status).toBe(400);
        const csv = await fetch(url('/rekam-medis/laporan?jenis=kunjungan_per_poli&format=csv'), { headers: { cookie: cookie.perekam } });
        expect(csv.headers.get('content-type')).toContain('text/csv');
        expect((await csv.text()).split('\n')[0]).toBe('Poli,Kunjungan');
        expect((await panggil('GET', '/rekam-medis/laporan?jenis=kunjungan_per_poli&dari=2026-02-01&sampai=2026-01-01', 'perekam')).status).toBe(400);
        expect((await panggil('GET', '/rekam-medis/laporan?jenis=kunjungan_per_poli', 'kasir')).status).toBe(403);
    });
});