import { jest } from '@jest/globals';

const uji = await import("@klira/db/uji");
const kliraRequired0 = await import("@klira/db");
const kliraRequired1 = await import("../../../app.js");

const urlUji = (process.env.KLIRA_UJI_DB === '1' ? process.env.DATABASE_URL : undefined);

const d = urlUji ? describe : describe.skip;

d('master data dan profil klinik terhadap database pengujian', () => {
    const kode = `UJI-MST-${Date.now()}`;
    let server;
    let fas = 0;
    let fasLain = 0;
    const id = {};
    const cookie = {};
    const url = (p) => `http://127.0.0.1:${server.address().port}/api${p}`;
    const panggil = async (metode, p, siapa, badan) => {
        const res = await fetch(url(p), {
            method: metode,
            headers: { 'content-type': 'application/json', ...(siapa ? { cookie: cookie[siapa] } : {}) },
            body: badan === undefined ? undefined : JSON.stringify(badan),
        });
        return { status: res.status, badan: (await res.json().catch(() => null)) };
    };
    async function buatPengguna(kunci, nik, izin, fasId = fas) {
        const { hashKataSandi } = kliraRequired0;
        const u = await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahPenggunaUntukBuatPengguna(fasId, `Nama ${kunci}`, nik, `${kode}-${kunci}`, await hashKataSandi('sandi-uji-1'), false, koneksiBaru); return uji.tambahPenggunaUntukBuatPenggunaHasil(_hasil.id, koneksiBaru); });
        id[kunci] = u.id;
        if (!izin.length)
            return;
        const j = await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahJenisAkunUntukBuatPengguna(fasId, `${kode}-${kunci}`, koneksiBaru); return uji.tambahJenisAkunUntukJenisPaketHasil(_hasil.id, koneksiBaru); });
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
    const SEMUA = [['master', 'lihat'], ['master', 'input'], ['master', 'perbaikan'], ['profil-klinik', 'lihat'], ['profil-klinik', 'perbaikan']];
    beforeAll(async () => {
        fas = await buatFasyankes(kode, 'Uji Master');
        fasLain = await buatFasyankes(`${kode}-LAIN`, 'Uji Master Lain');
        const { buatApp } = kliraRequired1;
        server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
        await buatPengguna('pimpinan', '9940000000000001', SEMUA);
        await buatPengguna('pelihat', '9940000000000002', [['master', 'lihat'], ['profil-klinik', 'lihat']]);
        await buatPengguna('biasa', '9940000000000003', [['klinis', 'input']]);
        await buatPengguna('dokter', '9940000000000004', []);
        await buatPengguna('dokter2', '9940000000000005', []);
        await buatPengguna('lain', '9940000000000006', SEMUA, fasLain);
        await login('pimpinan');
        await login('pelihat');
        await login('biasa');
        await login('lain');
    });
    afterAll(async () => {
        server?.close();
        await uji.hapusLogAuditUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusSesiUntukAksesIzinIntegrasiTest(Object.values(id));
        await uji.hapusPeringatanIzinUntukKlinisKlinisIntegrasiTest([fas, fasLain]);
        await uji.hapusJadwalPraktikUntukMasterMasterIntegrasiTest([fas, fasLain]);
        await uji.hapusTarifLayananUntukMasterMasterIntegrasiTest([fas, fasLain]);
        await uji.hapusRiwayatProfilUntukMasterMasterIntegrasiTest([fas, fasLain]);
        await uji.hapusProfilProfesiUntukMasterMasterIntegrasiTest([fas, fasLain]);
        await uji.ubahLokasiUntukMasterMasterIntegrasiTest(null, [fas, fasLain]);
        await uji.hapusLokasiUntukKlinisKlinisIntegrasiTest([fas, fasLain]);
        await uji.hapusPenugasanJenisUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusIzinJenisAkunUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusJenisAkunUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusPenggunaUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusFasyankesUntukAksesRepositoriIntegrasiTest([fas, fasLain]);
        await uji.tutupPool();
    });
    it('izin: tanpa fitur master ditolak, pelihat hanya membaca', async () => {
        expect((await panggil('GET', '/master/poli', 'biasa')).status).toBe(403);
        expect((await panggil('GET', '/fasyankes/profil', 'biasa')).status).toBe(403);
        expect((await panggil('GET', '/master/poli', 'pelihat')).status).toBe(200);
        expect((await panggil('POST', '/master/poli', 'pelihat', { nama: 'X' })).status).toBe(403);
        expect((await panggil('PATCH', '/fasyankes/profil', 'pelihat', { nama: 'X', jenis: 'klinik_pratama_rawat_jalan' })).status).toBe(403);
        expect((await panggil('GET', '/master/poli', null)).status).toBe(401);
    });
    it('poli, ruang, bed: tambah, validasi induk, ubah, cari, aktif/nonaktif, dan audit', async () => {
        expect((await panggil('POST', '/master/poli', 'pimpinan', { nama: '' })).status).toBe(400);
        const poli = await panggil('POST', '/master/poli', 'pimpinan', { nama: 'Poli Umum', ihs_location_id: 'IHS-1' });
        expect(poli.status).toBe(201);
        expect(poli.badan.data).toMatchObject({ nama: 'Poli Umum', aktif: true, status_operasional: 'O' });
        const poliId = poli.badan.data.id;
        // Bed wajib induk ruang; ruang induk harus poli milik klinik sendiri.
        expect((await panggil('POST', '/master/bed', 'pimpinan', { nama: 'Bed 1' })).status).toBe(400);
        const lain = await panggil('POST', '/master/poli', 'lain', { nama: 'Poli Lain' });
        const tolak = await panggil('POST', '/master/ruang', 'pimpinan', { nama: 'Ruang X', induk_id: lain.badan.data.id });
        expect(tolak.status).toBe(400);
        expect(tolak.badan.galat.rincian[0].jalur).toBe('induk_id');
        const ruang = await panggil('POST', '/master/ruang', 'pimpinan', { nama: 'Ruang Mawar', induk_id: poliId });
        expect(ruang.status).toBe(201);
        expect(ruang.badan.data.induk_nama).toBe('Poli Umum');
        expect((await panggil('POST', '/master/bed', 'pimpinan', { nama: 'Bed 1', induk_id: poliId })).status).toBe(400); // induk bed harus ruang
        const bed = await panggil('POST', '/master/bed', 'pimpinan', { nama: 'Bed 1', induk_id: ruang.badan.data.id });
        expect(bed.status).toBe(201);
        const ubah = await panggil('PATCH', `/master/poli/${poliId}`, 'pimpinan', { nama: 'Poli Umum 2', status_operasional: 'O' });
        expect(ubah.badan.data.nama).toBe('Poli Umum 2');
        const cari = await panggil('GET', '/master/ruang?cari=mawar', 'pelihat');
        expect(cari.badan.data.total).toBe(1);
        const non = await panggil('PATCH', `/master/ruang/${ruang.badan.data.id}/aktif`, 'pimpinan', { aktif: false });
        expect(non.badan.data).toMatchObject({ aktif: false, status_operasional: 'U' });
        expect((await panggil('GET', '/master/ruang?status=aktif', 'pelihat')).badan.data.total).toBe(0);
        expect((await panggil('GET', '/master/ruang?status=nonaktif', 'pelihat')).badan.data.total).toBe(1);
        expect((await uji.hitungLokasiUntukMasterMasterIntegrasiTest(fas))).toBe(3); // tidak ada hapus permanen
        const audit = await uji.daftarLogAuditUntukMasterMasterIntegrasiTest(fas, 'lokasi');
        expect(audit.map((a) => a.aksi)).toEqual(['input', 'input', 'input', 'perbaikan', 'perbaikan']);
        expect(audit.every((a) => a.pengguna_id === id.pimpinan)).toBe(true);
    });
    it('lintas fasyankes: ubah, nonaktifkan, dan baca milik klinik lain ditolak', async () => {
        const poliLain = await uji.wajibLokasiUntukMasterMasterIntegrasiTest(fasLain, 'Poli Lain');
        expect((await panggil('PATCH', `/master/poli/${poliLain.id}`, 'pimpinan', { nama: 'Dibajak' })).status).toBe(404);
        expect((await panggil('PATCH', `/master/poli/${poliLain.id}/aktif`, 'pimpinan', { aktif: false })).status).toBe(404);
        expect((await panggil('PATCH', `/master/ruang/${poliLain.id}`, 'pimpinan', { nama: 'x' })).status).toBe(404);
        expect((await uji.tambahLokasiUntukKlinisKlinisIntegrasiTestHasil(poliLain.id)).nama).toBe('Poli Lain');
        const daftar = await panggil('GET', '/master/poli', 'pimpinan');
        expect(daftar.badan.data.data.map((p) => p.nama)).not.toContain('Poli Lain');
    });
    it('praktisi: tambah profil untuk pengguna yang ada, ubah SIP dengan riwayat, nonaktifkan', async () => {
        const opsi = await panggil('GET', '/master/opsi/pengguna-tanpa-profil', 'pelihat');
        expect(opsi.badan.data.map((o) => o.nilai)).toContain(String(id.dokter));
        expect(opsi.badan.data.map((o) => o.nilai)).not.toContain(String(id.lain));
        expect((await panggil('POST', '/master/praktisi', 'pimpinan', { pengguna_id: id.lain, profesi: 'Dokter' })).status).toBe(400);
        const baru = await panggil('POST', '/master/praktisi', 'pimpinan', { pengguna_id: id.dokter, profesi: 'Dokter', nomor_sip: 'SIP-1', masa_berlaku_sip: '2027-05-06', ihs_practitioner_id: 'N10' });
        expect(baru.status).toBe(201);
        expect(baru.badan.data).toMatchObject({ pengguna_nama: 'Nama dokter', nomor_sip: 'SIP-1', masa_berlaku_sip: '2027-05-06' });
        expect((await panggil('POST', '/master/praktisi', 'pimpinan', { pengguna_id: id.dokter, profesi: 'Dokter' })).status).toBe(409);
        const ubah = await panggil('PATCH', `/master/praktisi/${baru.badan.data.id}`, 'pimpinan', { profesi: 'Dokter', nomor_sip: 'SIP-2', masa_berlaku_sip: '2028-05-06' });
        expect(ubah.badan.data.nomor_sip).toBe('SIP-2');
        expect(await uji.hitungProfilProfesiUntukMasterMasterIntegrasiTest(fas)).toBe(1); // tidak membuat akun atau profil baru
        const riwayat = await panggil('GET', '/fasyankes/riwayat-profil', 'pelihat');
        expect(riwayat.badan.data.data.filter((r) => r.jenis === 'sip')).toHaveLength(2);
        expect(riwayat.badan.data.data[0].ringkasan).toContain('SIP-1 menjadi SIP-2');
        expect((await panggil('PATCH', `/master/praktisi/${baru.badan.data.id}/aktif`, 'pimpinan', { aktif: false })).badan.data.aktif).toBe(false);
    });
    it('jadwal praktik: validasi jam dan rujukan, ubah, nonaktif', async () => {
        await panggil('PATCH', `/master/praktisi/${(await uji.wajibProfilProfesiUntukMasterMasterIntegrasiTest(fas)).id}/aktif`, 'pimpinan', { aktif: true });
        const poli = await uji.wajibLokasiUntukMasterMasterIntegrasiTest3(fas, 'poli');
        const dasar = { pengguna_id: id.dokter, lokasi_id: poli.id, hari: 2, jam_mulai: '08:00', jam_selesai: '12:00', kuota: 20, berlaku_dari: '2026-01-01' };
        expect((await panggil('POST', '/master/jadwal', 'pimpinan', { ...dasar, jam_selesai: '07:00' })).status).toBe(400);
        expect((await panggil('POST', '/master/jadwal', 'pimpinan', { ...dasar, kuota: 0 })).status).toBe(400);
        expect((await panggil('POST', '/master/jadwal', 'pimpinan', { ...dasar, berlaku_sampai: '2025-01-01' })).status).toBe(400);
        expect((await panggil('POST', '/master/jadwal', 'pimpinan', { ...dasar, pengguna_id: id.dokter2 })).status).toBe(400); // tanpa profil
        expect((await panggil('POST', '/master/jadwal', 'lain', dasar)).status).toBe(400); // rujukan klinik lain
        const j = await panggil('POST', '/master/jadwal', 'pimpinan', dasar);
        expect(j.status).toBe(201);
        expect(j.badan.data).toMatchObject({ hari: 2, jam_mulai: '08:00', lokasi_nama: 'Poli Umum 2', berlaku_dari: '2026-01-01', berlaku_sampai: null });
        expect((await panggil('PATCH', `/master/jadwal/${j.badan.data.id}`, 'pimpinan', { ...dasar, kuota: 30, berlaku_sampai: '2026-12-31' })).badan.data).toMatchObject({ kuota: 30, berlaku_sampai: '2026-12-31' });
        expect((await panggil('PATCH', `/master/jadwal/${j.badan.data.id}/aktif`, 'pimpinan', { aktif: false })).badan.data.aktif).toBe(false);
        expect((await panggil('GET', '/master/jadwal?cari=nama%20dokter', 'pelihat')).badan.data.total).toBe(1);
    });
    it('tarif layanan: kode unik per klinik, harga JKN opsional, nonaktif', async () => {
        const t = await panggil('POST', '/master/tarif', 'pimpinan', { kode: 'KON-01', nama: 'Konsultasi dokter umum', jenis: 'konsultasi', harga_umum: 50000 });
        expect(t.status).toBe(201);
        expect(t.badan.data).toMatchObject({ harga_umum: 50000, harga_jkn: null, aktif: true });
        expect((await panggil('POST', '/master/tarif', 'pimpinan', { kode: 'KON-01', nama: 'Dobel', jenis: 'tindakan', harga_umum: 1, kode_icd9cm: '86.59' })).status).toBe(409);
        // Tindakan: ICD-9-CM wajib dan harus ada di kamus; tanpa kode tarif dibuat TND-nnn; harga boleh kosong; satu kode ICD untuk beberapa tarif.
        expect((await panggil('POST', '/master/tarif', 'pimpinan', { nama: 'Tanpa ICD', jenis: 'tindakan' })).status).toBe(400);
        expect((await panggil('POST', '/master/tarif', 'pimpinan', { nama: 'ICD palsu', jenis: 'tindakan', kode_icd9cm: '99.999' })).status).toBe(400);
        const j1 = await panggil('POST', '/master/tarif', 'pimpinan', { nama: 'Jahit luka kecil', jenis: 'tindakan', kode_icd9cm: '86.59', harga_umum: 75000 });
        const j2 = await panggil('POST', '/master/tarif', 'pimpinan', { nama: 'Jahit luka besar', jenis: 'tindakan', kode_icd9cm: '86.59' });
        expect(j1.badan.data).toMatchObject({ kode: 'TND-001', kode_icd9cm: '86.59', harga_umum: 75000 });
        expect(j2.badan.data).toMatchObject({ kode: 'TND-002', kode_icd9cm: '86.59', harga_umum: null });
        expect((await panggil('POST', '/master/tarif', 'lain', { kode: 'KON-01', nama: 'Klinik lain', jenis: 'lab', harga_umum: 1, harga_jkn: 2 })).status).toBe(201);
        expect((await panggil('POST', '/master/tarif', 'pimpinan', { kode: 'X', nama: 'Negatif', jenis: 'lab', harga_umum: -1 })).status).toBe(400);
        expect((await panggil('POST', '/master/tarif', 'pimpinan', { kode: 'X', nama: 'Jenis salah', jenis: 'lainnya', harga_umum: 1 })).status).toBe(400);
        const u = await panggil('PATCH', `/master/tarif/${t.badan.data.id}`, 'pimpinan', { kode: 'KON-01', nama: 'Konsultasi', jenis: 'konsultasi', harga_umum: 60000, harga_jkn: 40000 });
        expect(u.badan.data).toMatchObject({ harga_umum: 60000, harga_jkn: 40000 });
        expect((await panggil('PATCH', `/master/tarif/${t.badan.data.id}/aktif`, 'pimpinan', { aktif: false })).badan.data.aktif).toBe(false);
        expect((await panggil('GET', '/master/tarif?cari=KON', 'pimpinan')).badan.data.total).toBe(1);
    });
    it('wilayah: hanya baca, dapat dicari dan disaring tingkat; jenis tak dikenal ditolak', async () => {
        const w = await panggil('GET', '/master/wilayah?cari=Aceh&tingkat=provinsi', 'pelihat');
        expect(w.badan.data.data[0]).toMatchObject({ kode: '11', nama: 'Aceh', contoh: false });
        expect((await panggil('GET', '/master/wilayah?tingkat=kecamatan&cari=tidak-ada-wilayah-ini', 'pelihat')).badan.data.total).toBe(0);
        expect((await panggil('POST', '/master/wilayah', 'pimpinan', { nama: 'x' })).status).toBe(405);
        expect((await panggil('PATCH', '/master/wilayah/1', 'pimpinan', { nama: 'x' })).status).toBe(405);
        expect((await panggil('GET', '/master/obat', 'pelihat')).status).toBe(400);
    });
    it('profil klinik: baca, validasi, simpan dengan riwayat dan audit, kode registrasi unik', async () => {
        const awal = await panggil('GET', '/fasyankes/profil', 'pelihat');
        expect(awal.badan.data).toMatchObject({ id: fas, nama: 'Uji Master', kode_registrasi: kode });
        expect((await panggil('PATCH', '/fasyankes/profil', 'pimpinan', { nama: '', jenis: 'klinik_pratama_rawat_jalan' })).status).toBe(400);
        expect((await panggil('PATCH', '/fasyankes/profil', 'pimpinan', { nama: 'X', jenis: 'rumah_sakit' })).status).toBe(400);
        expect((await panggil('PATCH', '/fasyankes/profil', 'pimpinan', { nama: 'X', jenis: 'klinik_pratama_rawat_jalan', kode_registrasi: `${kode}-LAIN` })).status).toBe(409);
        const badan = {
            nama: 'Uji Master Baru', jenis: 'klinik_pratama_rawat_inap', bentuk_usaha: 'PT', kode_registrasi: kode, organization_id: 'ORG-1',
            status_akreditasi: 'Madya', tanggal_akreditasi: '2025-03-04', puskesmas_wilayah: 'Puskesmas Contoh',
        };
        const s = await panggil('PATCH', '/fasyankes/profil', 'pimpinan', badan);
        expect(s.status).toBe(200);
        expect(s.badan.data).toMatchObject({ nama: 'Uji Master Baru', jenis: 'klinik_pratama_rawat_inap', tanggal_akreditasi: '2025-03-04', organization_id: 'ORG-1' });
        expect((await panggil('GET', '/fasyankes/profil', 'pelihat')).badan.data.status_akreditasi).toBe('Madya');
        // Simpan ulang tanpa perubahan: tidak menambah riwayat.
        expect((await panggil('PATCH', '/fasyankes/profil', 'pimpinan', badan)).status).toBe(200);
        const r = (await panggil('GET', '/fasyankes/riwayat-profil', 'pelihat')).badan.data.data.filter((x) => x.jenis !== 'sip');
        expect(r.map((x) => x.jenis).sort()).toEqual(['akreditasi', 'profil']);
        expect(r.find((x) => x.jenis === 'akreditasi').ringkasan).toContain('Madya');
        expect(r[0].dibuat_oleh_nama).toBe('Nama pimpinan');
        expect(await uji.hitungLogAuditUntukKlaimKlaimIntegrasiTest(fas, 'fasyankes', 'perbaikan')).toBe(1);
        // Klinik lain tidak melihat atau mengubah profil ini.
        expect((await panggil('GET', '/fasyankes/profil', 'lain')).badan.data.id).toBe(fasLain);
        expect((await panggil('GET', '/fasyankes/riwayat-profil', 'lain')).badan.data.total).toBe(0);
    });
});