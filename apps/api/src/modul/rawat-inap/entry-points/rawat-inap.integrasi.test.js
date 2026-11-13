import { jest } from '@jest/globals';

const uji = await import("@klira/db/uji");
const kliraRequired0 = await import("@klira/db");
const kliraRequired1 = await import("../../../app.js");

const urlUji = (process.env.KLIRA_UJI_DB === '1' ? process.env.DATABASE_URL : undefined);

const d = urlUji ? describe : describe.skip;

d('rawat inap (admisi, penempatan, CPPT, pemulangan) terhadap database pengujian', () => {
    const kode = `UJI-RI-${Date.now()}`;
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
    const buatLokasi = (fasId, nama, jenis, indukId = null) => uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahLokasiUntukBuatLokasi(fasId, nama, jenis, indukId, koneksiBaru); return uji.tambahLokasiUntukKlinisKlinisIntegrasiTestHasil(_hasil.id, koneksiBaru); });
    let ruang = 0;
    const bedBaru = async (nama) => (await buatLokasi(fas, `${kode}-${nama}`, 'bed', ruang)).id;
    let nomor = 0;
    const pasienBaru = async (fasId = fas) => {
        nomor += 1;
        return (await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahPasienUntukBuatKunjungan(fasId, `${kode}-${nomor}`, `Pasien ${nomor}`, new Date('1980-01-01'), 'perempuan', koneksiBaru); return uji.tambahPasienUntukBuatKunjunganHasil(_hasil.id, koneksiBaru); })).id;
    };
    let tarifId = 0;
    const KLINIS = [['klinis', 'lihat'], ['klinis', 'input'], ['pasien', 'lihat']];
    const admisi = (pasienId, extra = {}, siapa = 'dokter') => panggil('POST', '/rawat-inap/admisi', siapa, { pasien_id: pasienId, kelas: 'dua', dpjp_id: id.dokter, ...extra });
    const ringkasanPulang = { disposisi: 'home', kondisi_pulang: 'Membaik', diagnosis_akhir: 'I10 Hipertensi', ringkasan: 'Dirawat 2 hari, tekanan darah terkendali.', tindak_lanjut: 'Kontrol 1 minggu', terapi: 'Amlodipin' };
    beforeAll(async () => {
        fas = await buatFasyankes(kode, 'Uji Rawat Inap');
        fasLain = await buatFasyankes(`${kode}-LAIN`, 'Uji RI Lain');
        const { buatApp } = kliraRequired1;
        server = buatApp('/tidak-ada', { baseUrl: 'https://klira.contoh' }).listen(0);
        await buatPengguna('dokter', '9962000000000001', KLINIS);
        await buatPengguna('dokter2', '9962000000000002', KLINIS);
        await buatPengguna('kasir', '9962000000000005', [['kasir', 'lihat']]);
        await buatPengguna('lainDokter', '9962000000000007', KLINIS, fasLain);
        for (const k of ['dokter', 'dokter2'])
            await uji.tambahProfilProfesiUntukPasienPasienIntegrasiTest(fas, id[k], 'Dokter umum');
        for (const k of ['dokter', 'dokter2', 'kasir', 'lainDokter'])
            await login(k);
        ruang = (await buatLokasi(fas, `${kode}-Ruang Mawar`, 'ruang')).id;
        tarifId = (await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahTarifLayananUntukPenunjangPenunjangIntegrasiTest(fas, `KAMAR-${kode}`, 'Kamar kelas 2', 'kamar', 150_000, 100_000, koneksiBaru); return uji.tambahTarifLayananUntukPenunjangPenunjangIntegrasiTestHasil(_hasil.id, koneksiBaru); })).id;
    });
    afterAll(async () => {
        server?.close();
        const where = { fasyankes_id: { in: [fas, fasLain] } };
        await uji.hapusLogAuditUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusSesiUntukAksesIzinIntegrasiTest(Object.values(id));
        await uji.hapusItemTagihanUntukRawatInapRawatInapIntegrasiTest([fas, fasLain]);
        await uji.hapusPembayaranUntukRawatInapRawatInapIntegrasiTest([fas, fasLain]);
        await uji.hapusShiftKasirUntukRawatInapRawatInapIntegrasiTest([fas, fasLain]);
        await uji.hapusTagihanUntukRawatInapRawatInapIntegrasiTest([fas, fasLain]);
        for (const m of [uji.hapusPenempatanFasyankesUji, uji.hapusCatatanHarianFasyankesUji, uji.hapusPemulanganFasyankesUji, uji.hapusResumeMedisFasyankesUji, uji.hapusVersiCatatanFasyankesUji, uji.hapusPengesahanCatatanFasyankesUji, uji.hapusPesertaKunjunganFasyankesUji, uji.hapusPeringatanIzinFasyankesUji, uji.hapusIzinPerAkunFasyankesUji, uji.hapusAntreanFasyankesUji])
            await m(where.fasyankes_id.in);
        await uji.ubahKunjunganUntukRawatInapRawatInapIntegrasiTest(null, [fas, fasLain]);
        await uji.hapusKunjunganUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusTarifLayananUntukMasterMasterIntegrasiTest([fas, fasLain]);
        await uji.hapusLokasiUntukRawatInapRawatInapIntegrasiTest([fas, fasLain], 'bed');
        await uji.hapusLokasiUntukKlinisKlinisIntegrasiTest([fas, fasLain]);
        await uji.hapusPasienUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusProfilProfesiUntukMasterMasterIntegrasiTest([fas, fasLain]);
        await uji.hapusPenugasanJenisUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusIzinJenisAkunUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusJenisAkunUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusPenggunaUntukFarmasiFarmasiIntegrasiTest([fas, fasLain]);
        await uji.hapusFasyankesUntukAksesRepositoriIntegrasiTest([fas, fasLain]);
        await uji.tutupPool();
    });
    it('admisi langsung: bed terisi, DPJP tercatat, validasi dan izin, bed tidak terisi dua pasien', async () => {
        const bed = await bedBaru('A1');
        const p1 = await pasienBaru();
        expect((await admisi(p1, { bed_id: bed }, 'kasir')).status).toBe(403);
        expect((await admisi(p1, { bed_id: bed, kelas: 'salah' })).status).toBe(400);
        expect((await admisi(p1, { bed_id: bed, dpjp_bersama: [id.dokter] })).status).toBe(400);
        expect((await admisi(p1, { bed_id: bed, dpjp_id: id.kasir })).status).toBe(400);
        expect((await admisi(99999999, { bed_id: bed })).status).toBe(404);
        expect((await admisi(p1, { bed_id: bed, dpjp_bersama: [id.dokter2], spri: 'SPRI-1' })).status).toBe(201);
        const papan = await panggil('GET', '/rawat-inap/papan', 'dokter');
        const b = papan.badan.data.bed.find((x) => x.id === bed);
        expect(b.status).toBe('terisi');
        expect(b.penghuni.pasien_id).toBe(p1);
        expect((await uji.tambahLokasiUntukKlinisKlinisIntegrasiTestHasil(bed)).status_operasional).toBe('U');
        expect((await admisi(p1, { bed_id: await bedBaru('A2') })).status).toBe(409);
        const p2 = await pasienBaru();
        expect((await admisi(p2, { bed_id: bed })).status).toBe(409);
        expect((await panggil('GET', '/rawat-inap/papan', 'lainDokter')).badan.data.bed).toHaveLength(0);
    });
    it('dua admisi serempak ke bed yang sama: hanya satu berhasil', async () => {
        const bed = await bedBaru('B1');
        const [a, b] = await Promise.all([admisi(await pasienBaru(), { bed_id: bed }), admisi(await pasienBaru(), { bed_id: bed })]);
        expect([a.status, b.status].sort()).toEqual([201, 409]);
        expect(await uji.hitungPenempatanUntukRawatInapRawatInapIntegrasiTest(bed, null)).toBe(1);
    });
    it('admisi tanpa bed menunggu ruangan, lalu ubah penempatan menempatkannya', async () => {
        const p = await pasienBaru();
        const h = await admisi(p);
        expect(h.badan.data.menunggu_ruangan).toBe(true);
        const kid = h.badan.data.kunjungan_id;
        expect((await panggil('GET', '/rawat-inap/papan', 'dokter')).badan.data.menunggu.some((x) => x.kunjungan_id === kid)).toBe(true);
        const bed = await bedBaru('C1');
        const ubah = (badan, siapa = 'dokter') => panggil('PUT', `/kunjungan/${kid}/penempatan`, siapa, { kelas: 'dua', dpjp_id: id.dokter, ...badan });
        expect((await ubah({ bed_id: bed }, 'kasir')).status).toBe(403);
        const r = await ubah({ bed_id: bed, tarif_id: tarifId });
        expect(r.status).toBe(200);
        expect(r.badan.data.kunjungan.status).toBe('in-progress');
        expect(r.badan.data.penempatan).toHaveLength(1);
        // pindah butuh alasan; setelah pindah bed lama kosong dan riwayat bertambah
        const bed2 = await bedBaru('C2');
        expect((await ubah({ bed_id: bed2, tarif_id: tarifId })).status).toBe(400);
        const pindah = await ubah({ bed_id: bed2, kelas: 'vip', indikator: 'naik_kelas', tarif_id: tarifId, alasan: 'Permintaan keluarga' });
        expect(pindah.status).toBe(200);
        expect(pindah.badan.data.penempatan).toHaveLength(2);
        expect(pindah.badan.data.penempatan[0].selesai).not.toBeNull();
        expect((await uji.tambahLokasiUntukKlinisKlinisIntegrasiTestHasil(bed)).status_operasional).toBe('O');
        expect((await uji.tambahLokasiUntukKlinisKlinisIntegrasiTestHasil(bed2)).status_operasional).toBe('U');
        // ganti DPJP utama dan bersama
        const g = await ubah({ kelas: 'vip', indikator: 'naik_kelas', tarif_id: tarifId, dpjp_id: id.dokter2, dpjp_bersama: [id.dokter] });
        expect(g.status).toBe(200);
        expect(g.badan.data.dpjp.find((x) => x.tipe === 'ATND').id).toBe(id.dokter2);
        expect(g.badan.data.dpjp.find((x) => x.tipe === 'SPRF').id).toBe(id.dokter);
        expect(g.badan.data.penempatan).toHaveLength(2);
        // bed terisi pasien lain ditolak
        const lain = await pasienBaru();
        const bed3 = await bedBaru('C3');
        expect((await admisi(lain, { bed_id: bed3 })).status).toBe(201);
        expect((await ubah({ bed_id: bed3, kelas: 'dua', alasan: 'x' })).status).toBe(409);
    });
    it('CPPT: tiap catatan disahkan, terverifikasi, dibatasi izin, ditutup setelah pemulangan', async () => {
        const p = await pasienBaru();
        const kid = (await admisi(p, { bed_id: await bedBaru('D1') })).badan.data.kunjungan_id;
        const catatan = { subjektif: 'Pusing berkurang', objektif: 'TD 130/80', asesmen: 'Hipertensi terkontrol', rencana: 'Lanjut obat', instruksi: 'Cek TD tiap shift', tanda_vital: { sistolik: 130, diastolik: 80 } };
        expect((await panggil('POST', `/kunjungan/${kid}/cppt`, 'kasir', catatan)).status).toBe(403);
        expect((await panggil('POST', `/kunjungan/${kid}/cppt`, 'dokter', { ...catatan, subjektif: '' })).status).toBe(400);
        expect((await panggil('POST', `/kunjungan/${kid}/cppt`, 'dokter', catatan)).status).toBe(201);
        expect((await panggil('POST', `/kunjungan/${kid}/cppt`, 'dokter2', { ...catatan, tanda_vital: null, instruksi: '' })).status).toBe(201);
        const l = await panggil('GET', `/kunjungan/${kid}/cppt`, 'dokter');
        expect(l.badan.data).toHaveLength(2);
        expect(l.badan.data.every((c) => c.verifikasi === 'sah' && c.pengesahan.versi === 1)).toBe(true);
        expect(l.badan.data[1].tanda_vital.sistolik).toBe(130);
        expect((await panggil('GET', `/kunjungan/${kid}/cppt`, 'lainDokter')).status).toBe(404);
        expect((await panggil('POST', `/kunjungan/${kid}/pemulangan`, 'dokter', ringkasanPulang)).status).toBe(201);
        expect((await panggil('POST', `/kunjungan/${kid}/cppt`, 'dokter', catatan)).status).toBe(409);
    });
    it('pemulangan: bed kosong, biaya kamar masuk tagihan, resume dibuat, lanjut ke kasir, tidak ganda', async () => {
        const p = await pasienBaru();
        const bed = await bedBaru('E1');
        const kid = (await admisi(p, { bed_id: bed, tarif_id: tarifId })).badan.data.kunjungan_id;
        await uji.ubahPenempatanUntukRawatInapRawatInapIntegrasiTest(new Date(Date.now() - 2.5 * 86_400_000), kid);
        expect((await panggil('POST', `/kunjungan/${kid}/pemulangan`, 'dokter', { ...ringkasanPulang, disposisi: 'salah' })).status).toBe(400);
        expect((await panggil('POST', `/kunjungan/${kid}/pemulangan`, 'kasir', ringkasanPulang)).status).toBe(403);
        const r = await panggil('POST', `/kunjungan/${kid}/pemulangan`, 'dokter', ringkasanPulang);
        expect(r.status).toBe(201);
        expect(r.badan.data.resume_dibuat).toBe(true);
        expect(r.badan.data.tagihan_kamar).toBe(1);
        const k = await uji.tambahKunjunganUntukBuatKunjunganHasil(kid);
        expect(k.tahap_layanan).toBe('kasir');
        expect(k.status).toBe('finished');
        expect((await uji.tambahLokasiUntukKlinisKlinisIntegrasiTestHasil(bed)).status_operasional).toBe('O');
        expect(await uji.hitungPenempatanUntukRawatInapRawatInapIntegrasiTest2(kid, null)).toBe(0);
        const item = await uji.wajibItemTagihanUntukRawatInapRawatInapIntegrasiTest(kid, 'kamar');
        expect(item.jumlah).toBe(3);
        expect(item.harga).toBe(150_000);
        expect(await uji.hitungResumeMedisUntukRawatInapRawatInapIntegrasiTest(kid)).toBe(1);
        expect((await panggil('POST', `/kunjungan/${kid}/pemulangan`, 'dokter', ringkasanPulang)).status).toBe(409);
        expect((await panggil('PUT', `/kunjungan/${kid}/penempatan`, 'dokter', { kelas: 'dua', dpjp_id: id.dokter })).status).toBe(409);
        expect((await panggil('GET', `/kunjungan/${kid}/rawat-inap`, 'dokter')).badan.data.pemulangan.disposisi).toBe('home');
    });
    it('admisi dari rawat jalan: kunjungan asal ditutup, tagihan dan resep digabung; ada pembayaran ditolak', async () => {
        const p = await pasienBaru();
        const asal = await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahKunjunganUntukRawatInapRawatInapIntegrasiTest(fas, p, 'AMB', 'in-progress', 'pemeriksaan', koneksiBaru); return uji.tambahKunjunganUntukBuatKunjunganHasil(_hasil.id, koneksiBaru); });
        const tagihan = await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahTagihanUntukRawatInapRawatInapIntegrasiTest(fas, asal.id, koneksiBaru); return uji.tambahTagihanUntukSiapkanHasil(_hasil.id, koneksiBaru); });
        await uji.tambahItemTagihanUntukRawatInapRawatInapIntegrasiTest(fas, tagihan.id, 'konsultasi', 'K1', 'Konsultasi', 50_000);
        const info = await panggil('GET', `/rawat-inap/asal?pasien_id=${p}`, 'dokter');
        expect(info.badan.data.asal.kunjungan_id).toBe(asal.id);
        expect(info.badan.data.ada_pembayaran).toBe(false);
        const shift = await uji.transaksi(async (koneksiBaru) => { const _hasil = await uji.tambahShiftKasirUntukRawatInapRawatInapIntegrasiTest(fas, id.kasir, 0, koneksiBaru); return uji.tambahShiftKasirUntukRawatInapRawatInapIntegrasiTestHasil(_hasil.id, koneksiBaru); });
        await uji.tambahPembayaranUntukRawatInapRawatInapIntegrasiTest(fas, tagihan.id, shift.id, 'tunai', 10_000, id.kasir);
        expect((await admisi(p, { bed_id: await bedBaru('F0') })).status).toBe(409);
        expect((await panggil('GET', `/rawat-inap/asal?pasien_id=${p}`, 'dokter')).badan.data.ada_pembayaran).toBe(true);
        await uji.hapusPembayaranUntukRawatInapRawatInapIntegrasiTest2(tagihan.id);
        await uji.hapusShiftKasirUntukRawatInapRawatInapIntegrasiTest2(shift.id);
        const h = await admisi(p, { bed_id: await bedBaru('F1') });
        expect(h.status).toBe(201);
        const lama = await uji.tambahKunjunganUntukBuatKunjunganHasil(asal.id);
        expect(lama.tahap_layanan).toBe('ditutup');
        expect(lama.waktu_tutup).not.toBeNull();
        const baru = await uji.tambahKunjunganUntukBuatKunjunganHasil(h.badan.data.kunjungan_id);
        expect(baru.kunjungan_asal_id).toBe(asal.id);
        expect(await uji.hitungItemTagihanUntukRawatInapRawatInapIntegrasiTest(baru.id)).toBe(1);
        expect(await uji.hitungItemTagihanUntukRawatInapRawatInapIntegrasiTest2(tagihan.id)).toBe(0);
    });
});