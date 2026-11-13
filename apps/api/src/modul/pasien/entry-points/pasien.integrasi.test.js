import { jest } from '@jest/globals';

const uji = await import("@klira/db/uji");
const kliraRequired0 = await import("@klira/db");
const kliraRequired1 = await import("../../../app.js");
const kliraRequired2 = await import("../../kunjungan/data-access/repositori.js");
const kliraRequired3 = await import("../data-access/repositori.js");
const kliraRequired4 = await import("../domain/layanan.js");

const urlUji = (process.env.KLIRA_UJI_DB === '1' ? process.env.DATABASE_URL : undefined);

const d = urlUji ? describe : describe.skip;

d('pasien, kunjungan, dan antrean terhadap database pengujian', () => {
    const kode = `UJI-PSN-${Date.now()}`;
    let server;
    let fas = 0;
    let fasLain = 0;
    let poliA = 0;
    let poliB = 0;
    let teksId = 0;
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
    const PETUGAS = [['pasien', 'lihat'], ['pasien', 'input'], ['kunjungan', 'lihat'], ['kunjungan', 'input'], ['kunjungan', 'perbaikan']];
    let nikSeq = 0;
    const nikBaru = () => `99${String(Date.now()).slice(-8)}${String(nikSeq++).padStart(6, '0')}`;
    const persetujuan = (o = {}) => ({ teks_persetujuan_id: teksId, bentuk: 'tertulis', penandatangan: 'pasien', setuju: true, ...o });
    const registrasi = (o = {}) => ({
        nama: 'Siti Rahmawati', tanggal_lahir: '1990-05-01', jenis_kelamin: 'perempuan', nik: nikBaru(), ibu_kandung: 'Rina', persetujuan: persetujuan(), ...o,
    });
    const daftarPasien = async (o = {}, siapa = 'petugas') => {
        const r = await panggil('POST', '/pasien', siapa, registrasi(o));
        expect(r.status).toBe(201);
        return r.badan.data;
    };
    beforeAll(async () => {
        const { seedTeksPersetujuan } = kliraRequired0;
        await seedTeksPersetujuan(uji.pool);
        fas = await buatFasyankes(kode, 'Uji Pasien');
        fasLain = await buatFasyankes(`${kode}-LAIN`, 'Uji Pasien Lain');
        const { buatApp } = kliraRequired1;
        server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
        await buatPengguna('petugas', '9950000000000001', PETUGAS);
        await buatPengguna('pelihat', '9950000000000002', [['pasien', 'lihat']]);
        await buatPengguna('rekam', '9950000000000007', [['rekam-medis', 'lihat']]);
        await buatPengguna('biasa', '9950000000000003', [['klinis', 'input']]);
        await buatPengguna('dokter', '9950000000000004', []);
        await buatPengguna('lain', '9950000000000006', PETUGAS, fasLain);
        await buatPengguna('dokterlain', '9950000000000008', [], fasLain);
        for (const [k, f] of [['dokter', fas], ['dokterlain', fasLain]]) {
            await uji.tambahProfilProfesiUntukPasienPasienIntegrasiTest(f, id[k], 'Dokter umum');
        }
        poliA = (await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahLokasiUntukKlinisKlinisIntegrasiTest(fas, 'Poli Umum', 'poli', koneksiBaru); return uji.tambahLokasiUntukKlinisKlinisIntegrasiTestHasil(_hasil.id, koneksiBaru); })).id;
        poliB = (await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahLokasiUntukKlinisKlinisIntegrasiTest(fas, 'Poli Anak', 'poli', koneksiBaru); return uji.tambahLokasiUntukKlinisKlinisIntegrasiTestHasil(_hasil.id, koneksiBaru); })).id;
        await uji.tambahLokasiUntukPasienPasienIntegrasiTest3(fas, 'Poli Tutup', 'poli', 'U');
        await uji.tambahJadwalPraktikUntukPasienPasienIntegrasiTest(fas, id.dokter, poliA, 1, '08:00', '12:00', 10, new Date('2026-01-01'));
        const teks = await uji.wajibTeksPersetujuanUntukPasienPasienIntegrasiTest(null, 'general', 1);
        teksId = teks.id;
        for (const k of ['petugas', 'pelihat', 'rekam', 'biasa', 'lain'])
            await login(k);
    });
    afterAll(async () => {
        server?.close();
        await uji.hapusLogAuditUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusSesiUntukAksesIzinIntegrasiTest(Object.values(id));
        await uji.hapusPeringatanIzinUntukKlinisKlinisIntegrasiTest([fas, fasLain]);
        await uji.hapusAntreanUntukKlinisKlinisIntegrasiTest([fas, fasLain]);
        await uji.hapusPesertaKunjunganUntukPasienPasienIntegrasiTest([fas, fasLain]);
        await uji.hapusPersetujuanUntukPasienPasienIntegrasiTest([fas, fasLain]);
        await uji.hapusKunjunganUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusWaliKeluargaUntukPasienPasienIntegrasiTest([fas, fasLain]);
        await uji.hapusPasienUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusUrutanNomorRmUntukPasienPasienIntegrasiTest([fas, fasLain]);
        await uji.hapusTeksPersetujuanUntukPasienPasienIntegrasiTest([fas, fasLain]);
        await uji.hapusJadwalPraktikUntukMasterMasterIntegrasiTest([fas, fasLain]);
        await uji.hapusProfilProfesiUntukMasterMasterIntegrasiTest([fas, fasLain]);
        await uji.hapusLokasiUntukKlinisKlinisIntegrasiTest([fas, fasLain]);
        await uji.hapusPenugasanJenisUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusIzinJenisAkunUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusJenisAkunUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusPenggunaUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusEventPanggilanFasyankesUji([fas, fasLain]);
        await uji.hapusFasyankesUntukAksesRepositoriIntegrasiTest([fas, fasLain]);
        await uji.tutupPool();
    });
    it('izin: tanpa akses ditolak, pelihat hanya melihat, rekam medis boleh melihat daftar', async () => {
        expect((await panggil('GET', '/pasien', null)).status).toBe(401);
        expect((await panggil('GET', '/pasien', 'biasa')).status).toBe(403);
        expect((await panggil('POST', '/pasien', 'biasa', registrasi())).status).toBe(403);
        expect((await panggil('GET', '/pasien', 'pelihat')).status).toBe(200);
        expect((await panggil('GET', '/pasien', 'rekam')).status).toBe(200);
        expect((await panggil('POST', '/pasien', 'pelihat', registrasi())).status).toBe(403);
        expect((await panggil('POST', '/pasien/cek-duplikat', 'pelihat', {})).status).toBe(403);
        expect((await panggil('GET', '/pasien/teks-persetujuan', 'pelihat')).status).toBe(403);
        expect((await panggil('POST', '/kunjungan', 'pelihat', { pasien_id: 1, jenis: 'IMP' })).status).toBe(403);
        expect((await panggil('POST', '/antrean/1/panggil', 'pelihat')).status).toBe(403);
        expect((await panggil('GET', '/kunjungan/opsi', 'biasa')).status).toBe(403);
    });
    it('teks general consent: teks klinik didahulukan dari teks bawaan', async () => {
        const bawaan = await panggil('GET', '/pasien/teks-persetujuan', 'petugas');
        expect(bawaan.status).toBe(200);
        expect(bawaan.badan.data).toMatchObject({ id: teksId, versi: 1, jenis: 'general' });
        const khusus = await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahTeksPersetujuanUntukPasienPasienIntegrasiTest(fas, 'general', 5, 'GC klinik', 'T', 'Isi klinik', koneksiBaru); return uji.tambahTeksPersetujuanUntukPasienPasienIntegrasiTestHasil(_hasil.id, koneksiBaru); });
        expect((await panggil('GET', '/pasien/teks-persetujuan', 'petugas')).badan.data).toMatchObject({ id: khusus.id, versi: 5 });
        await uji.ubahTeksPersetujuanUntukPasienPasienIntegrasiTest(false, khusus.id);
        expect((await panggil('GET', '/pasien/teks-persetujuan', 'petugas')).badan.data.id).toBe(teksId);
    });
    it('registrasi: validasi, nomor RM berurutan per fasyankes, wali dan general consent satu transaksi', async () => {
        const buruk = await panggil('POST', '/pasien', 'petugas', registrasi({ nik: '123', persetujuan: persetujuan({ setuju: false }) }));
        expect(buruk.status).toBe(400);
        expect(buruk.badan.galat.rincian.map((r) => r.jalur)).toEqual(expect.arrayContaining(['nik', 'persetujuan.setuju']));
        expect(await uji.hitungPasienUntukPasienPasienIntegrasiTest(fas)).toBe(0);
        const a = await daftarPasien();
        const b = await daftarPasien({ nama: 'Budi', ibu_kandung: 'Ani' });
        expect(a.nomor_rm).toBe('00-00-001');
        expect(b.nomor_rm).toBe('00-00-002');
        const lain = await panggil('POST', '/pasien', 'lain', registrasi());
        expect(lain.badan.data.nomor_rm).toBe('00-00-001');
        const anak = await panggil('POST', '/pasien', 'petugas', registrasi({
            nama: 'Anak Kecil', tanggal_lahir: '2020-01-01', tidak_cakap: true, nik: undefined, jalur_identitas: 'tanpa_identitas', ibu_kandung: 'Rina',
            wali: [{ hubungan: 'Ibu', nama: 'Rina Wati', kontak: '0812' }, { hubungan: 'Ayah', nama: 'Joko' }],
            persetujuan: persetujuan({ penandatangan: 'wali', wali_ke: 1 }),
        }));
        expect(anak.status).toBe(201);
        expect(anak.badan.data).toMatchObject({ nomor_rm: '00-00-003', status_identitas: 'sementara' });
        const baris = await uji.wajibPasienUntukPasienPasienIntegrasiTest(anak.badan.data.id);
        expect(baris).toMatchObject({ nik: null, status_identitas: 'sementara', jalur_identitas: 'tanpa_identitas', tidak_cakap: true });
        expect(baris.wali_keluarga.map((w) => w.nama).sort()).toEqual(['Joko', 'Rina Wati']);
        expect(baris.persetujuan).toHaveLength(1);
        const p = baris.persetujuan[0];
        expect(p).toMatchObject({ jenis: 'general', versi_teks: 1, penandatangan: 'wali', penandatangan_nama: 'Joko', teks_persetujuan_id: teksId, status: 'diberikan', bentuk: 'tertulis' });
        expect(p.wali_id).toBe(baris.wali_keluarga.find((w) => w.nama === 'Joko').id);
        expect(p.penjelasan).toContain('rekam medis');
        // Teks persetujuan yang tidak ada ditolak tanpa menyimpan pasien.
        const sebelum = await uji.hitungPasienUntukPasienPasienIntegrasiTest(fas);
        expect((await panggil('POST', '/pasien', 'petugas', registrasi({ persetujuan: persetujuan({ teks_persetujuan_id: 99999999 }) }))).status).toBe(400);
        expect(await uji.hitungPasienUntukPasienPasienIntegrasiTest(fas)).toBe(sebelum);
        const audit = await uji.daftarLogAuditUntukPasienPasienIntegrasiTest(fas, 'input', ['pasien', 'persetujuan']);
        expect(audit.filter((x) => x.entitas === 'pasien').length).toBeGreaterThanOrEqual(3);
        expect(audit.filter((x) => x.entitas === 'persetujuan').length).toBeGreaterThanOrEqual(3);
        expect(audit.every((x) => !(x.keterangan ?? '').includes('Anak Kecil'))).toBe(true);
    });
    it('registrasi serempak menghasilkan nomor RM unik dan berurutan', async () => {
        const hasil = await Promise.all(Array.from({ length: 5 }, (_, i) => panggil('POST', '/pasien', 'lain', registrasi({ nama: `Serempak ${i}`, ibu_kandung: `Ibu ${i}` }))));
        expect(hasil.map((h) => h.status)).toEqual([201, 201, 201, 201, 201]);
        const nomor = hasil.map((h) => h.badan.data.nomor_rm).sort();
        expect(new Set(nomor).size).toBe(5);
        const semua = (await uji.daftarPasienUntukPasienPasienIntegrasiTest(fasLain)).map((p) => p.nomor_rm).sort();
        expect(semua).toEqual(['00-00-001', '00-00-002', '00-00-003', '00-00-004', '00-00-005', '00-00-006']);
    });
    it('cek duplikat dan penolakan: NIK ganda ditolak, nama-lahir-ibu ganda butuh konfirmasi', async () => {
        const nik = nikBaru();
        const asli = await daftarPasien({ nama: 'Dewi Lestari', tanggal_lahir: '1985-03-04', ibu_kandung: 'Sri', nik });
        const sama = await panggil('POST', '/pasien/cek-duplikat', 'petugas', { nik });
        expect(sama.badan.data).toEqual([{ id: asli.id, nomor_rm: asli.nomor_rm, nama: 'Dewi Lestari', tanggal_lahir: '1985-03-04', alasan: 'nik' }]);
        const nama = await panggil('POST', '/pasien/cek-duplikat', 'petugas', { nama: 'dewi lestari', tanggal_lahir: '1985-03-04', ibu_kandung: 'Sri' });
        expect(nama.badan.data).toHaveLength(1);
        expect(nama.badan.data[0].alasan).toBe('nama_lahir_ibu');
        expect((await panggil('POST', '/pasien/cek-duplikat', 'petugas', { nama: 'Dewi Lestari' })).badan.data).toEqual([]);
        expect((await panggil('POST', '/pasien/cek-duplikat', 'lain', { nik })).badan.data).toEqual([]);
        const kembarNik = await panggil('POST', '/pasien', 'petugas', registrasi({ nik, nama: 'Lain Nama', ibu_kandung: 'X', konfirmasi_duplikat: true }));
        expect(kembarNik.status).toBe(409);
        const tanpaKonfirmasi = await panggil('POST', '/pasien', 'petugas', registrasi({ nama: 'Dewi Lestari', tanggal_lahir: '1985-03-04', ibu_kandung: 'Sri' }));
        expect(tanpaKonfirmasi.status).toBe(409);
        expect(tanpaKonfirmasi.badan.galat.kode).toBe('konflik');
        const konfirmasi = await panggil('POST', '/pasien', 'petugas', registrasi({ nama: 'Dewi Lestari', tanggal_lahir: '1985-03-04', ibu_kandung: 'Sri', konfirmasi_duplikat: true }));
        expect(konfirmasi.status).toBe(201);
        expect((await panggil('POST', '/pasien', 'lain', registrasi({ nik, nama: 'Nama Lain Klinik' }))).status).toBe(201); // NIK sama di klinik lain boleh
    });
    it('daftar pasien: pencarian nama, nomor RM, NIK; hanya data minimal; terbatas fasyankes', async () => {
        const nik = nikBaru();
        const p = await daftarPasien({ nama: 'Zulkifli Unik', tanggal_lahir: '1970-01-01', nik });
        const sama = async (cari, siapa = 'pelihat') => (await panggil('GET', `/pasien?cari=${encodeURIComponent(cari)}`, siapa)).badan.data;
        const nama = await sama('zulkifli');
        expect(nama.total).toBe(1);
        expect(Object.keys(nama.data[0]).sort()).toEqual(['id', 'jenis_kelamin', 'kunjungan', 'nama', 'nomor_rm', 'status_identitas', 'umur_tahun']);
        expect(nama.data[0]).toMatchObject({ id: p.id, nomor_rm: p.nomor_rm, status_identitas: 'lengkap', kunjungan: null });
        expect(JSON.stringify(nama)).not.toContain(nik);
        expect((await sama(p.nomor_rm)).data.map((x) => x.id)).toContain(p.id);
        expect((await sama(nik.slice(0, 10))).data.map((x) => x.id)).toEqual([p.id]);
        expect((await sama('zulkifli', 'lain')).total).toBe(0);
        expect((await panggil('GET', '/pasien?tahap=salah', 'pelihat')).status).toBe(400);
        // Tanpa pencarian hanya pasien dengan kunjungan berjalan (belum ada).
        expect((await panggil('GET', '/pasien', 'pelihat')).badan.data.total).toBe(0);
    });
    it('detail: dicatat lihat di audit, lintas fasyankes 404 tanpa catatan', async () => {
        const p = await daftarPasien({ nama: 'Pasien Detail', alamat: 'Jl. Contoh 1', jkn_nomor_kartu: '000123' });
        const sebelum = await uji.hitungLogAuditUntukPasienPasienIntegrasiTest(fas, 'lihat', 'pasien', p.id);
        const r = await panggil('GET', `/pasien/${p.id}`, 'pelihat');
        expect(r.status).toBe(200);
        expect(r.badan.data).toMatchObject({ nama: 'Pasien Detail', alamat: 'Jl. Contoh 1', jkn_nomor_kartu: '000123', wali: [], status_identitas: 'lengkap' });
        expect(await uji.hitungLogAuditUntukPasienPasienIntegrasiTest2(fas, 'lihat', 'pasien', p.id, id.pelihat)).toBe(sebelum + 1);
        expect((await panggil('GET', `/pasien/${p.id}`, 'lain')).status).toBe(404);
        expect(await uji.hitungLogAuditUntukPasienPasienIntegrasiTest3(fasLain, 'pasien', p.id)).toBe(0);
        expect((await panggil('GET', '/pasien/abc', 'pelihat')).status).toBe(404);
        expect((await panggil('GET', `/pasien/${p.id}`, 'biasa')).status).toBe(403);
    });
    it('alur registrasi, kunjungan, lalu antrean per poli', async () => {
        const opsi = await panggil('GET', '/kunjungan/opsi', 'petugas');
        expect(opsi.badan.data.poli.map((x) => x.nama)).toEqual(['Poli Anak', 'Poli Umum']);
        expect(opsi.badan.data.dpjp).toEqual([{ id: id.dokter, nama: 'Nama dokter', profesi: 'Dokter umum', poli_ids: [poliA] }]);
        const p1 = await daftarPasien({ nama: 'Alur Satu', ibu_kandung: 'A1' });
        const p2 = await daftarPasien({ nama: 'Alur Dua', ibu_kandung: 'A2' });
        const p3 = await daftarPasien({ nama: 'Alur Tiga', ibu_kandung: 'A3' });
        const p4 = await daftarPasien({ nama: 'Alur Empat', ibu_kandung: 'A4' });
        const k1 = await panggil('POST', '/kunjungan', 'petugas', { pasien_id: p1.id, jenis: 'AMB', lokasi_id: poliA, dpjp_id: id.dokter, cara_pembayaran: 'jkn', keluhan_singkat: 'Demam' });
        expect(k1.status).toBe(201);
        expect(k1.badan.data).toMatchObject({ jenis: 'AMB', status: 'arrived', tahap_layanan: 'menunggu_skrining', cara_pembayaran: 'jkn', nomor_sep: null, dpjp_id: id.dokter, antrean: { nomor: 1, kode: 'A-001', status: 'menunggu' } });
        const k2 = await panggil('POST', '/kunjungan', 'petugas', { pasien_id: p2.id, jenis: 'AMB', lokasi_id: poliA });
        expect(k2.badan.data.antrean.kode).toBe('A-002');
        const k3 = await panggil('POST', '/kunjungan', 'petugas', { pasien_id: p3.id, jenis: 'AMB', lokasi_id: poliB, cara_pembayaran: 'jkn', nomor_sep: '0301R0010101V000001' });
        expect(k3.badan.data).toMatchObject({ nomor_sep: '0301R0010101V000001', antrean: { kode: 'A-001' } });
        const k4 = await panggil('POST', '/kunjungan', 'petugas', { pasien_id: p4.id, jenis: 'IMP', dpjp_id: id.dokter });
        expect(k4.status).toBe(201);
        expect(k4.badan.data).toMatchObject({ jenis: 'IMP', lokasi_id: null, antrean: null });
        // Peserta kunjungan: DPJP tercatat ATND.
        const peserta = await uji.daftarPesertaKunjunganUntukPasienPasienIntegrasiTest(k1.badan.data.id);
        expect(peserta).toMatchObject([{ pengguna_id: id.dokter, tipe: 'ATND', fasyankes_id: fas }]);
        // Penolakan.
        expect((await panggil('POST', '/kunjungan', 'petugas', { pasien_id: p1.id, jenis: 'AMB', lokasi_id: poliA })).status).toBe(409);
        const p5 = await daftarPasien({ nama: 'Alur Lima', ibu_kandung: 'A5' });
        expect((await panggil('POST', '/kunjungan', 'petugas', { pasien_id: p5.id, jenis: 'AMB' })).status).toBe(400);
        expect((await panggil('POST', '/kunjungan', 'petugas', { pasien_id: p5.id, jenis: 'AMB', lokasi_id: poliA, nomor_sep: 'X' })).status).toBe(400);
        const tutup = await uji.wajibLokasiUntukMasterMasterIntegrasiTest(fas, 'Poli Tutup');
        expect((await panggil('POST', '/kunjungan', 'petugas', { pasien_id: p5.id, jenis: 'AMB', lokasi_id: tutup.id })).status).toBe(400);
        expect((await panggil('POST', '/kunjungan', 'petugas', { pasien_id: p5.id, jenis: 'AMB', lokasi_id: poliA, dpjp_id: id.dokterlain })).status).toBe(400);
        expect((await panggil('POST', '/kunjungan', 'petugas', { pasien_id: p5.id, jenis: 'AMB', lokasi_id: poliB, dpjp_id: id.dokter })).status).toBe(400); // dokter tidak bertugas di poli B
        expect((await panggil('POST', '/kunjungan', 'lain', { pasien_id: p5.id, jenis: 'IMP' })).status).toBe(404); // pasien klinik lain
        const lokasiLain = await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahLokasiUntukKlinisKlinisIntegrasiTest(fasLain, 'Poli Lain', 'poli', koneksiBaru); return uji.tambahLokasiUntukKlinisKlinisIntegrasiTestHasil(_hasil.id, koneksiBaru); });
        expect((await panggil('POST', '/kunjungan', 'petugas', { pasien_id: p5.id, jenis: 'AMB', lokasi_id: lokasiLain.id })).status).toBe(400);
        expect(await uji.hitungKunjunganUntukPasienPasienIntegrasiTest(p5.id)).toBe(0);
        // Daftar menampilkan kunjungan berjalan dengan nomor antrean, poli, dan DPJP.
        const daftar = await panggil('GET', '/pasien', 'petugas');
        expect(daftar.badan.data.jumlah_tahap).toMatchObject({ menunggu_skrining: 4, pemeriksaan: 0 });
        const baris1 = daftar.badan.data.data.find((x) => x.id === p1.id);
        expect(baris1.kunjungan).toMatchObject({ jenis: 'AMB', tahap_layanan: 'menunggu_skrining', poli_nama: 'Poli Umum', dpjp_nama: 'Nama dokter', cara_pembayaran: 'jkn', antrean: { kode: 'A-001', status: 'menunggu' } });
        expect(daftar.badan.data.data.map((x) => x.id)).toEqual([p1.id, p2.id, p3.id, p4.id]);
        expect((await panggil('GET', '/pasien?tahap=pemeriksaan', 'petugas')).badan.data.total).toBe(0);
        expect((await panggil('GET', '/pasien?tahap=menunggu_skrining', 'lain')).badan.data.total).toBe(0);
        // Antrean: panggil, mulai, selesai; urutan tidak sah ditolak.
        const a1 = k1.badan.data.antrean.id;
        expect((await panggil('POST', `/antrean/${a1}/mulai`, 'petugas')).status).toBe(409);
        expect((await panggil('POST', `/antrean/${a1}/selesai`, 'petugas')).status).toBe(409);
        const panggilAwal = await panggil('POST', `/antrean/${a1}/panggil`, 'petugas');
        expect(panggilAwal.badan.data).toMatchObject({ kode: 'A-001', status: 'dipanggil', pasien_nama: 'Alur Satu', poli_nama: 'Poli Umum' });
        expect(panggilAwal.badan.data.waktu_panggil).not.toBeNull();
        expect((await panggil('POST', `/antrean/${a1}/panggil`, 'petugas')).status).toBe(200); // panggil ulang
        const mulai = await panggil('POST', `/antrean/${a1}/mulai`, 'petugas');
        expect(mulai.badan.data.status).toBe('dilayani');
        expect((await uji.tambahKunjunganUntukBuatKunjunganHasil(k1.badan.data.id)).status).toBe('in-progress');
        expect((await panggil('POST', `/antrean/${a1}/batal`, 'petugas')).status).toBe(409);
        expect((await panggil('POST', `/antrean/${a1}/selesai`, 'petugas')).badan.data.status).toBe('selesai');
        expect((await panggil('POST', `/antrean/${a1}/panggil`, 'petugas')).status).toBe(409);
        expect((await panggil('POST', `/antrean/${a1}/terbang`, 'petugas')).status).toBe(404);
        expect((await panggil('POST', `/antrean/${a1}/panggil`, 'lain')).status).toBe(404); // lintas fasyankes
        const batal = await panggil('POST', `/antrean/${k2.badan.data.antrean.id}/batal`, 'petugas');
        expect(batal.badan.data.status).toBe('batal');
        const dibatalkan = await panggil('GET', '/pasien?tahap=batal', 'petugas');
        expect(dibatalkan.status).toBe(200);
        expect(dibatalkan.badan.data.data.map((x) => x.id)).toEqual([p2.id]);
        expect(dibatalkan.badan.data.jumlah_tahap.batal).toBe(1);
        const aktif = await panggil('GET', '/pasien', 'petugas');
        expect(aktif.badan.data.data.map((x) => x.id)).toContain(p2.id);
        const hariIni = await panggil('GET', '/antrean', 'petugas');
        expect(hariIni.badan.data.data.map((x) => `${x.poli_nama}:${x.kode}:${x.status}`)).toEqual(['Poli Umum:A-001:selesai', 'Poli Umum:A-002:batal', 'Poli Anak:A-001:menunggu']);
        expect((await panggil('GET', `/antrean?lokasi_id=${poliB}&status=menunggu`, 'petugas')).badan.data.total).toBe(1);
        expect((await panggil('GET', '/antrean', 'lain')).badan.data.total).toBe(0);
        expect((await panggil('GET', '/antrean', 'pelihat')).status).toBe(403);
        // Tahap layanan: maju satu tahap; mundur dan penutupan langsung ditolak.
        const kid = k1.badan.data.id;
        expect((await panggil('PATCH', `/kunjungan/${kid}/tahap`, 'petugas', { tahap: 'kasir' })).status).toBe(409);
        const maju = await panggil('PATCH', `/kunjungan/${kid}/tahap`, 'petugas', { tahap: 'pemeriksaan' });
        expect(maju.badan.data.tahap_layanan).toBe('pemeriksaan');
        expect((await panggil('PATCH', `/kunjungan/${kid}/tahap`, 'petugas', { tahap: 'menunggu_skrining' })).status).toBe(409);
        expect((await panggil('PATCH', `/kunjungan/${kid}/tahap`, 'petugas', { tahap: 'ditutup' })).status).toBe(409);
        expect((await panggil('PATCH', `/kunjungan/${kid}/tahap`, 'petugas', { tahap: 'ngawur' })).status).toBe(400);
        expect((await panggil('PATCH', `/kunjungan/${kid}/tahap`, 'lain', { tahap: 'resep' })).status).toBe(404);
        expect((await panggil('PATCH', `/kunjungan/${kid}/tahap`, 'pelihat', { tahap: 'resep' })).status).toBe(403);
        const periksa = await panggil('GET', '/pasien?tahap=pemeriksaan', 'petugas');
        expect(periksa.badan.data.data.map((x) => x.id)).toEqual([p1.id]);
        expect(periksa.badan.data.jumlah_tahap).toMatchObject({ menunggu_skrining: 2, pemeriksaan: 1, batal: 1 });
        expect((await panggil('GET', '/pasien?cari=Alur&tahap=pemeriksaan', 'petugas')).badan.data.data.map((x) => x.id)).toEqual([p1.id]);
        const cari = await panggil('GET', '/pasien?cari=Alur%20Lima', 'petugas');
        expect(cari.badan.data.data[0]).toMatchObject({ id: p5.id, kunjungan: null });
        const auditUbah = await uji.daftarLogAuditUntukFarmasiFarmasiIntegrasiTest2(fas, ['kunjungan', 'antrean']);
        expect(auditUbah.some((x) => x.aksi === 'input' && x.entitas === 'kunjungan')).toBe(true);
        expect(auditUbah.some((x) => x.aksi === 'perbaikan' && x.entitas === 'antrean')).toBe(true);
        expect(auditUbah.some((x) => x.aksi === 'perbaikan' && x.entitas === 'kunjungan' && (x.keterangan ?? '').includes('pemeriksaan'))).toBe(true);
    });
    it('nomor antrean mulai dari 1 lagi tiap hari dan tidak ganda saat serempak', async () => {
        const { RepositoriKunjunganMysql } = kliraRequired2;
        const repo = new RepositoriKunjunganMysql();
        const pasien = await Promise.all(Array.from({ length: 6 }, (_, i) => daftarPasien({ nama: `Hari ${i}`, ibu_kandung: `H${i}` })));
        const data = (pasien_id) => ({ pasien_id, jenis: 'AMB', lokasi_id: poliB, dpjp_id: null, cara_pembayaran: 'umum', nomor_sep: null, keluhan_singkat: null });
        const hariPertama = new Date('2031-03-10T10:00:00Z');
        const serempak = await Promise.all(pasien.slice(0, 4).map((p) => repo.daftarkan(fas, id.petugas, data(p.id), hariPertama)));
        expect(serempak.map((k) => k.antrean.nomor).sort()).toEqual([1, 2, 3, 4]);
        // 17:30 UTC adalah 00:30 keesokan harinya di Asia/Jakarta.
        const hariKedua = await repo.daftarkan(fas, id.petugas, data(pasien[4].id), new Date('2031-03-10T17:30:00Z'));
        expect(hariKedua.antrean.nomor).toBe(1);
        const masihHariPertama = await repo.daftarkan(fas, id.petugas, data(pasien[5].id), new Date('2031-03-10T16:30:00Z'));
        expect(masihHariPertama.antrean.nomor).toBe(5);
    });
    it('registrasi gagal di tengah transaksi: pasien, wali, persetujuan, dan kenaikan nomor RM ikut batal', async () => {
        const { RepositoriPasienMysql } = kliraRequired3;
        const { normalkanRegistrasi } = kliraRequired4;
        const repo = new RepositoriPasienMysql();
        const teks = await uji.tambahTeksPersetujuanUntukPasienPasienIntegrasiTestHasil(teksId);
        const masukan = { ...registrasi({ nama: 'Batal Total', wali: [{ hubungan: 'ibu', nama: 'Wali Batal' }] }), jalur_identitas: 'nik', wali: [{ hubungan: 'ibu', nama: 'Wali Batal' }], tidak_cakap: false };
        const dasar = normalkanRegistrasi({ ...masukan, persetujuan: { ...persetujuan(), wali_ke: undefined } }, teks);
        // Teks persetujuan tidak ada: pembuatan persetujuan gagal (FK) setelah pasien, wali, dan kenaikan urutan.
        const rusak = { ...dasar, persetujuan: { ...dasar.persetujuan, teks: { ...dasar.persetujuan.teks, id: 2_000_000_000 } } };
        const hitung = async () => ({
            pasien: await uji.hitungPasienUntukPasienPasienIntegrasiTest(fas),
            wali: await uji.hitungWaliKeluargaUntukHitung(fas),
            persetujuan: await uji.hitungPersetujuanUntukHitung(fas),
            urutan: (await uji.ambilUrutanNomorRmUntukHitung(fas))?.terakhir ?? 0,
        });
        const sebelum = await hitung();
        await expect(repo.daftarkan(fas, id.petugas, rusak)).rejects.toBeDefined();
        expect(await hitung()).toEqual(sebelum);
    });
    it('pendaftaran kunjungan serempak untuk pasien yang sama: hanya satu berhasil', async () => {
        const { RepositoriKunjunganMysql, KunjunganBerjalanError } = kliraRequired2;
        const repo = new RepositoriKunjunganMysql();
        const p = await daftarPasien({ nama: 'Serempak Kunjungan', ibu_kandung: 'SK' });
        const data = { pasien_id: p.id, jenis: 'AMB', lokasi_id: poliA, dpjp_id: null, cara_pembayaran: 'umum', nomor_sep: null, keluhan_singkat: null };
        const hasil = await Promise.allSettled(Array.from({ length: 4 }, () => repo.daftarkan(fas, id.petugas, data, new Date('2032-03-10T03:00:00Z'))));
        expect(hasil.filter((h) => h.status === 'fulfilled')).toHaveLength(1);
        for (const h of hasil.filter((x) => x.status === 'rejected'))
            expect(h.reason).toBeInstanceOf(KunjunganBerjalanError);
        expect(await uji.hitungKunjunganUntukPasienPasienIntegrasiTest2(fas, p.id)).toBe(1);
    });
    it('pasien batal bisa daftar ulang besok dengan RM yang sama dan riwayat batal tetap utuh', async () => {
        const { RepositoriKunjunganMysql } = kliraRequired2;
        const repo = new RepositoriKunjunganMysql();
        const p = await daftarPasien({ nama: 'Daftar Ulang Batal', ibu_kandung: 'DUB' });
        const data = { pasien_id: p.id, jenis: 'AMB', lokasi_id: poliA, cara_pembayaran: 'umum', nomor_sep: null, keluhan_singkat: null };
        const lama = await repo.daftarkan(fas, id.petugas, data, new Date('2032-03-11T03:00:00Z'));
        await repo.ubahAntrean(fas, lama.antrean.id, 'batal', ['menunggu'], 'batal', new Date('2032-03-11T04:00:00Z'));
        expect(await repo.kunjunganBerjalan(fas, p.id)).toBe(false);
        const baru = await repo.daftarkan(fas, id.petugas, data, new Date('2032-03-12T03:00:00Z'));
        expect(baru.id).not.toBe(lama.id);
        expect(baru.pasien_id).toBe(p.id);
        expect(baru.antrean.id).not.toBe(lama.antrean.id);
        expect(baru.antrean.status).toBe('menunggu');
        expect(await repo.kunjunganBerjalan(fas, p.id)).toBe(true);
        expect(await uji.wajibAntreanUntukPasienPasienIntegrasiTest(lama.antrean.id)).toMatchObject({ status: 'batal', kunjungan_id: lama.id });
        expect(await uji.tambahPasienUntukBuatKunjunganHasil(p.id)).toMatchObject({ nomor_rm: p.nomor_rm });
        expect(await uji.hitungKunjunganUntukPasienPasienIntegrasiTest(p.id)).toBe(2);
    });
});