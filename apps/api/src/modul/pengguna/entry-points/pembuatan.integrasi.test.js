import { jest } from '@jest/globals';

const uji = await import("@klira/db/uji");
const kliraRequired0 = await import("@klira/db");
const kliraRequired1 = await import("../../../app.js");
const kliraRequired2 = await import("../data-access/repositori-baru.js");

const urlUji = (process.env.KLIRA_UJI_DB === '1' ? process.env.DATABASE_URL : undefined);

const d = urlUji ? describe : describe.skip;

d('POST /api/pengguna terhadap database pengujian', () => {
    const kode = `UJI-BUAT-${Date.now()}`;
    let server;
    let fas = 0;
    let jenisDokter = 0;
    let jenisDaftar = 0;
    let izinLihat = 0;
    const id = {};
    const cookie = {};
    const url = (p) => `http://127.0.0.1:${server.address().port}/api${p}`;
    const panggil = async (metode, p, siapa, badan) => {
        const res = await fetch(url(p), {
            method: metode,
            headers: { 'content-type': 'application/json', cookie: cookie[siapa] ?? '' },
            body: badan === undefined ? undefined : JSON.stringify(badan),
        });
        const teks = await res.text();
        let json = null;
        try {
            json = JSON.parse(teks);
        }
        catch { /* bukan JSON */ }
        return { status: res.status, badan: json, teks, header: res.headers };
    };
    const izin = (fitur, aksi) => uji.transaksi(async (koneksiBaru) => { await uji.simpanIzinUntukAksesIzinIntegrasiTest(fitur, aksi, 'unit', koneksiBaru); return uji.simpanIzinUntukAksesIzinIntegrasiTestHasil(fitur, aksi, 'unit', koneksiBaru); });
    async function akun(kunci, nik, izinJenis) {
        const { hashKataSandi } = kliraRequired0;
        const u = await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahPenggunaUntukBuatPengguna(fas, `Nama ${kunci}`, nik, `${kode}-${kunci}`, await hashKataSandi('sandi-uji-1'), false, koneksiBaru); return uji.tambahPenggunaUntukBuatPenggunaHasil(_hasil.id, koneksiBaru); });
        id[kunci] = u.id;
        const j = await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahJenisAkunUntukBuatPengguna(fas, `${kode}-${kunci}`, koneksiBaru); return uji.tambahJenisAkunUntukJenisPaketHasil(_hasil.id, koneksiBaru); });
        for (const [fitur, aksi] of izinJenis) {
            const r = await izin(fitur, aksi);
            await uji.tambahIzinJenisAkunUntukBuatPengguna(fas, j.id, r.id);
        }
        await uji.tambahPenugasanJenisUntukAksesIzinIntegrasiTest(fas, u.id, j.id, new Date(Date.now() - 86_400_000));
        const res = await fetch(url('/masuk'), {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ username: `${kode}-${kunci}`, kata_sandi: 'sandi-uji-1' }),
        });
        expect(res.status).toBe(200);
        cookie[kunci] = res.headers.get('set-cookie').split(';')[0];
    }
    const badanDasar = (sufiks, ekstra = {}) => ({
        nama: `Baru ${sufiks}`, nik: `99400000${sufiks.padStart(8, '0')}`, username: `${kode}-b${sufiks}`,
        penugasan: [{ jenis_akun_id: jenisDaftar, mulai: '2026-01-01' }], ...ekstra,
    });
    beforeAll(async () => {
        const f = await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahFasyankesUntukAksesIzinIntegrasiTest(-6, 'Uji Buat Akun', 'klinik_pratama_rawat_jalan', kode, koneksiBaru); return uji.tambahFasyankesUntukAksesIzinIntegrasiTestHasil(_hasil.id, koneksiBaru); });
        fas = f.id;
        await uji.ubahFasyankesUntukAksesIzinIntegrasiTest(fas);
        const { buatApp } = kliraRequired1;
        server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
        await akun('pimpinan', '9930000000000011', [['akses', 'lihat'], ['akses', 'input']]);
        await akun('pelihat', '9930000000000012', [['akses', 'lihat']]);
        jenisDokter = (await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahJenisAkunUntukJenisPaket(fas, `${kode}-dokter`, 'dokter ber-SIP', koneksiBaru); return uji.tambahJenisAkunUntukJenisPaketHasil(_hasil.id, koneksiBaru); })).id;
        await uji.tambahIzinJenisAkunUntukBuatPengguna(fas, jenisDokter, (await izin('resep', 'input')).id);
        jenisDaftar = (await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahJenisAkunUntukBuatPengguna(fas, `${kode}-daftar`, koneksiBaru); return uji.tambahJenisAkunUntukJenisPaketHasil(_hasil.id, koneksiBaru); })).id;
        izinLihat = (await izin('pendaftaran', 'lihat')).id;
        await uji.tambahIzinJenisAkunUntukBuatPengguna(fas, jenisDaftar, izinLihat);
    });
    afterAll(async () => {
        server?.close();
        await uji.hapusLogAuditUntukAksesIzinIntegrasiTest(fas);
        await uji.hapusPeringatanIzinUntukAksesIzinIntegrasiTest(fas);
        await uji.hapusIzinPerAkunUntukAksesIzinIntegrasiTest(fas);
        await uji.hapusProfilProfesiUntukAksesIzinIntegrasiTest(fas);
        await uji.hapusSesiUntukPenggunaPembuatanIntegrasiTest(fas);
        await uji.hapusPenugasanJenisUntukAksesIzinIntegrasiTest(fas);
        await uji.hapusIzinJenisAkunUntukAksesIzinIntegrasiTest(fas);
        await uji.hapusJenisAkunUntukAksesIzinIntegrasiTest(fas);
        await uji.hapusPenggunaUntukAksesIzinIntegrasiTest(fas);
        await uji.hapusFasyankesUntukAksesIzinIntegrasiTest(fas);
        await uji.tutupPool();
    });
    it('tanpa sesi 401, tanpa izin akses input 403, badan tidak valid 400', async () => {
        expect((await panggil('POST', '/pengguna', 'tamu', badanDasar('1'))).status).toBe(401);
        expect((await panggil('POST', '/pengguna', 'pelihat', badanDasar('1'))).status).toBe(403);
        const r = await panggil('POST', '/pengguna', 'pimpinan', { ...badanDasar('1'), nik: '12' });
        expect(r.status).toBe(400);
        expect(r.badan.galat.rincian.map((x) => x.jalur)).toContain('nik');
        expect(await uji.hitungPenggunaUntukPenggunaPembuatanIntegrasiTest(`${kode}-b1`)).toBe(0);
    });
    it('membuat akun lengkap dalam satu transaksi: hash tersimpan, wajib ganti, kata sandi dikembalikan sekali', async () => {
        const r = await panggil('POST', '/pengguna', 'pimpinan', badanDasar('2', {
            profil: { profesi: 'Perawat', nomor_sip: 'SIP-22', masa_berlaku_sip: '2030-01-01', ihs_practitioner_id: 'N10000001' },
            izin_akun: [{ izin_id: izinLihat, tipe: 'kurang', alasan: 'Tidak perlu melihat pendaftaran', mulai: '2026-01-01' }],
        }));
        expect(r.status).toBe(201);
        expect(r.header.get('cache-control')).toBe('no-store');
        const sandi = r.badan.data.kata_sandi_awal;
        expect(sandi).toMatch(/^(?=.*[A-Za-z])(?=.*\d).{12}$/);
        const baru = await uji.wajibPenggunaUntukPenggunaPembuatanIntegrasiTest(r.badan.data.id);
        expect(baru).toMatchObject({ fasyankes_id: fas, aktif: true, wajib_ganti_kredensial: true, dibuat_oleh: id.pimpinan });
        expect(baru.kata_sandi_hash).toMatch(/^scrypt\$/);
        expect(baru.kata_sandi_hash).not.toContain(sandi);
        expect(baru.profil_profesi).toHaveLength(1);
        expect(baru.profil_profesi[0]).toMatchObject({ nomor_sip: 'SIP-22', ihs_practitioner_id: 'N10000001' });
        expect(baru.penugasan_jenis).toHaveLength(1);
        expect(baru.izin_per_akun[0]).toMatchObject({ tipe: 'kurang', izin_id: izinLihat });
        // login dengan kata sandi awal berhasil dan menuntut ganti kredensial
        const m = await panggil('POST', '/masuk', 'tamu', { username: baru.username, kata_sandi: sandi });
        expect(m.status).toBe(200);
        expect(m.badan.data.wajib_ganti_kredensial).toBe(true);
    });
    it('audit tercatat tanpa kata sandi dan tanpa NIK', async () => {
        const baru = await uji.wajibPenggunaUntukPenggunaPembuatanIntegrasiTest2(`${kode}-b2`);
        const log = await uji.daftarLogAuditUntukPenggunaPembuatanIntegrasiTest(fas, id.pimpinan, 'input');
        const ent = log.map((l) => l.entitas);
        expect(ent).toEqual(expect.arrayContaining(['pengguna', 'profil_profesi', 'penugasan_jenis', 'izin_per_akun']));
        expect(log.find((l) => l.entitas === 'pengguna')).toMatchObject({ entitas_id: baru.id });
        expect(JSON.stringify(log)).not.toContain(baru.nik);
    });
    it('peringatan: 409 tanpa menyimpan, lalu lolos dengan alasan dan tercatat di peringatan_izin dan audit', async () => {
        const badan = badanDasar('3', { penugasan: [{ jenis_akun_id: jenisDokter, mulai: '2026-01-01' }], profil: { profesi: 'Perawat' } });
        const r1 = await panggil('POST', '/pengguna', 'pimpinan', badan);
        expect(r1.status).toBe(409);
        expect(r1.badan.galat.kode).toBe('perlu_konfirmasi_peringatan');
        expect(r1.badan.galat.peringatan.map((w) => w.jenis)).toContain('izin_klinis_non_dokter');
        expect(await uji.hitungPenggunaUntukPenggunaPembuatanIntegrasiTest(`${kode}-b3`)).toBe(0);
        const r2 = await panggil('POST', '/pengguna', 'pimpinan', { ...badan, konfirmasi_peringatan: { alasan: 'Perawat senior diberi resep sementara', terima_untuk_akun: true } });
        expect(r2.status).toBe(201);
        expect(r2.badan.data.peringatan.length).toBeGreaterThan(0);
        const baris = await uji.daftarPeringatanIzinUntukPenggunaPembuatanIntegrasiTest(r2.badan.data.id);
        expect(baris.every((b) => b.alasan_pimpinan === 'Perawat senior diberi resep sementara' && b.diterima_untuk_akun && b.ditetapkan_oleh === id.pimpinan)).toBe(true);
        expect(await uji.hitungLogAuditUntukPenggunaPembuatanIntegrasiTest(fas, 'peringatan_izin', baris.map((b) => b.id))).toBe(baris.length);
    });
    it('username atau NIK ganda 409 konflik; jenis akun nonaktif atau asing 400', async () => {
        expect((await panggil('POST', '/pengguna', 'pimpinan', { ...badanDasar('4'), username: `${kode}-b2` })).status).toBe(409);
        expect((await panggil('POST', '/pengguna', 'pimpinan', { ...badanDasar('4'), nik: badanDasar('2').nik })).status).toBe(409);
        expect((await panggil('POST', '/pengguna', 'pimpinan', { ...badanDasar('4'), penugasan: [{ jenis_akun_id: 999999999, mulai: '2026-01-01' }] })).status).toBe(400);
        expect(await uji.hitungPenggunaUntukPenggunaPembuatanIntegrasiTest(`${kode}-b4`)).toBe(0);
    });
    it('kegagalan di tengah transaksi membatalkan semuanya', async () => {
        const { RepositoriAkunBaruMysql } = kliraRequired2;
        await expect(new RepositoriAkunBaruMysql().buatAkun({
            fasyankes_id: fas, oleh: id.pimpinan, nama: 'Gagal', nik: '9950000000000001', username: `${kode}-gagal`, kata_sandi_hash: 'x',
            profil: { profesi: 'Perawat', nomor_sip: null, masa_berlaku_sip: null, ihs_practitioner_id: null },
            penugasan: [{ jenis_akun_id: jenisDaftar, mulai: new Date(), selesai: null }],
            izin_akun: [{ izin_id: 999999999, tipe: 'tambah', alasan: 'x', mulai: new Date(), selesai: null }],
            peringatan: [],
        })).rejects.toBeDefined();
        expect(await uji.hitungPenggunaUntukPenggunaPembuatanIntegrasiTest(`${kode}-gagal`)).toBe(0);
        expect(await uji.hitungProfilProfesiUntukPenggunaPembuatanIntegrasiTest(fas, `${kode}-gagal`)).toBe(0);
    });
    it('galat unik dari basis data: NIK ganda dikenali sebagai NIK, username ganda sebagai username', async () => {
        const { RepositoriAkunBaruMysql, KonflikAkun } = kliraRequired2;
        const dasar = {
            fasyankes_id: fas, oleh: id.pimpinan, kata_sandi_hash: 'x', profil: null,
            penugasan: [{ jenis_akun_id: jenisDaftar, mulai: new Date(), selesai: null }], izin_akun: [], peringatan: [],
        };
        const repo = new RepositoriAkunBaruMysql();
        const galatNik = await repo.buatAkun({ ...dasar, nama: 'Dup NIK', nik: '9930000000000011', username: `${kode}-dupnik` }).catch((e) => e);
        expect(galatNik).toBeInstanceOf(KonflikAkun);
        expect(galatNik.bidang).toBe('nik');
        const galatUser = await repo.buatAkun({ ...dasar, nama: 'Dup User', nik: '9960000000000001', username: `${kode}-pimpinan` }).catch((e) => e);
        expect(galatUser).toBeInstanceOf(KonflikAkun);
        expect(galatUser.bidang).toBe('username');
    });
});