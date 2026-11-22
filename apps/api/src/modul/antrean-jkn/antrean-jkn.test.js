import { jest } from '@jest/globals';

// Layar panggilan memakai kanal di memori proses; tidak relevan untuk uji ini.
jest.unstable_mockModule('../layar-panggilan/domain/kanal.js', () => ({ kabarkanLayarPanggilan: () => { } }));
const { default: express } = await import('express');
const { buatKlienPcare } = await import('@klira/integrasi');
const { pengaturanAntreanJknMasukan, ANTREAN_JKN: A } = await import('@klira/shared');
const { buatLayananKunjungan } = await import('../kunjungan/domain/layanan.js');
const { buatLayananAntreanJkn, JEDA_TARIK_MS } = await import('./domain/layanan.js');
const { buatSinkronAntreanBpjs } = await import('./domain/sinkron-bpjs.js');
const { buatRuteAntreanJkn } = await import('./entry-points/rute.js');
const { buatAplikasiPcare, KONFIG_PCARE_BAWAAN: K } = await import('../../../../../dummy-intergrasi/p-care/pcare.js');
const { buatMemori, jembatan, TANGGAL } = await import('./uji-bantu.js');
const { panggilTanpaPort } = await import('../../umum/panggil-tanpa-port.js');

const PETUGAS = { fasyankes_id: 1, id: 9 };
const BUDI = '0000039043765';
const SITI = '0000039043766';

/** Rakit klira (antrean JKN, kunjungan, sinkron BPJS) dan service-dummy PCare; klira memanggil dummy lewat jembatan di memori, tanpa port. */
async function rakit({ aktif = true, pcare = true, jam } = {}) {
    const mem = buatMemori();
    const audit = { catat: jest.fn(async () => { }) };
    const dummy = buatAplikasiPcare();
    const waktu = { geser: 0 };
    const sekarang = jam ?? (() => new Date(Date.now() + waktu.geser));
    const klienPcare = async (_f, tambahan = {}) => (pcare ? {
        environment: 'sandbox',
        klien: buatKlienPcare({ baseUrl: 'http://dummy.uji', serviceName: K.serviceName, consId: K.consId, secretKey: K.secretKey, userKey: K.userKey, username: K.username, password: K.password, appCode: K.appCode, ...tambahan, fetchFn: jembatan(dummy) }),
    } : null);
    const antreanBpjs = buatSinkronAntreanBpjs({ repo: mem.repoJkn, klienPcare, dekripsi: (t) => t.replace(/^enc\((.*)\)$/, '$1'), sekarang });
    const kunjungan = buatLayananKunjungan({ repo: mem.repoKunjungan, audit, antreanBpjs, sekarang });
    const layanan = buatLayananAntreanJkn({
        repo: mem.repoJkn, audit, kunjungan, klienPcare, sekarang, enkripsi: (t) => `enc(${t})`,
        opsiKunjungan: async () => ({ jenis_poli: mem.s.poli.map((p) => ({ nilai: p.jenis_poli, label: p.jenis_poli, awalan: p.awalan })), dpjp: mem.s.dokter.map((d) => ({ id: d.id, nama: d.nama })) }),
        jenisPoliOperasional: mem.repoKunjungan.jenisPoliOperasional,
    });
    const simpan = await layanan.simpan(PETUGAS, pengaturanAntreanJknMasukan.parse({
        aktif, service_name: K.antreanServiceName, poli: [{ jenis_poli: 'Umum', kode: '001' }, { jenis_poli: 'Gigi', kode: '' }], dokter: [{ pengguna_id: 21, kode: '123123' }],
    }), '127.0.0.1');
    expect(simpan.ok).toBe(true);
    /** HP peserta (simulator Mobile JKN di dummy). */
    const hp = async (jalur, badan) => (await panggilTanpaPort(dummy, { metode: badan === undefined ? 'GET' : 'POST', url: `/mobile-jkn/api/${jalur}`, badan })).json();
    const tarik = () => layanan.tarik(1, { paksa: true });
    return { mem, layanan, kunjungan, dummy, hp, tarik, audit, waktu };
}
const pasienSiti = (mem) => { mem.s.pasien.push({ id: mem.s.pasien.length + 1, nomor_rm: 'RM-000900', nik: '3201010202850002', nama: 'SITI CONTOH', jkn_nomor_kartu: SITI, nomor_hp: '0812' }); return mem.s.pasien.at(-1); };

describe('pengaturan antrean online', () => {
    it('menyimpan pemetaan, tidak mengembalikan user key, dan kode kosong tidak dipetakan', async () => {
        const { layanan, mem } = await rakit();
        await layanan.simpan(PETUGAS, pengaturanAntreanJknMasukan.parse({ aktif: true, user_key: 'kunci-antrean', poli: [{ jenis_poli: 'Umum', kode: '001' }], dokter: [{ pengguna_id: 21, kode: '123123' }] }), '');
        const d = await layanan.ambil(PETUGAS);
        expect(d).toMatchObject({ aktif: true, service_name: 'antreanfktp', user_key_terisi: true, tarik_terakhir: null });
        expect(JSON.stringify(d)).not.toContain('kunci-antrean');
        expect(d.poli).toEqual([{ jenis_poli: 'Umum', kode: '001' }, { jenis_poli: 'Gigi', kode: '' }]);
        expect(d.dokter).toEqual([{ pengguna_id: 21, nama: 'dr. Satu', kode: '123123' }]);
        expect(mem.s.atur.user_key_terenkripsi).toBe('enc(kunci-antrean)');
        // User key kosong saat menyimpan ulang mempertahankan yang lama.
        await layanan.simpan(PETUGAS, pengaturanAntreanJknMasukan.parse({ aktif: true }), '');
        expect(mem.s.atur.user_key_terenkripsi).toBe('enc(kunci-antrean)');
    });
    it('menolak kode poli ganda', async () => {
        const { layanan } = await rakit();
        const ganda = await layanan.simpan(PETUGAS, pengaturanAntreanJknMasukan.parse({ aktif: true, poli: [{ jenis_poli: 'Umum', kode: '001' }, { jenis_poli: 'Gigi', kode: '001' }] }), '');
        expect(ganda).toMatchObject({ ok: false, kode: 'tidak_valid', bidang: 'poli' });
    });
});

describe('menarik pendaftaran Mobile JKN dari PCare', () => {
    it('peserta baru: pasien dibuat dari data PCare dan antrean memakai penomoran jenis poli', async () => {
        const r = await rakit();
        expect((await r.hp('ambil', { noKartu: BUDI, kodepoli: '001', keluhan: 'Demam' })).metadata.code).toBe(200);
        expect(await r.tarik()).toMatchObject({ status: 'ok', baru: 1, batal: 0, dilewati: [] });
        expect(r.mem.s.pasien[0]).toMatchObject({ nama: 'BUDI CONTOH', nik: '3201010101800001', jkn_nomor_kartu: BUDI, jenis_kelamin: 'laki_laki', tanggal_lahir: '1980-01-01' });
        expect(r.mem.s.kunjungan[0]).toMatchObject({ jenis: 'AMB', cara_pembayaran: 'jkn' });
        expect(r.mem.s.antrean[0]).toMatchObject({ jenis_poli: 'Umum', awalan: 'U', nomor: 1, sumber: 'mobile_jkn', pcare_no_urut: '001', status: 'menunggu', bpjs_status: null });
        // Penarikan berikutnya tidak menggandakan.
        expect(await r.tarik()).toMatchObject({ status: 'ok', baru: 0 });
        expect(r.mem.s.antrean).toHaveLength(1);
        expect((await r.layanan.ambil(PETUGAS)).tarik_terakhir).toMatchObject({ status: 'ok', pesan: A.tarik.ringkas(0, 0) });
    });
    it('nomor berbagi urutan dengan loket, dan peserta yang sudah didaftarkan di loket tidak digandakan', async () => {
        const r = await rakit();
        const siti = pasienSiti(r.mem);
        const loket = await r.kunjungan.daftarkan(PETUGAS, { pasien_id: siti.id, jenis: 'AMB', jenis_poli: 'Umum', cara_pembayaran: 'umum' }, '');
        expect(loket.data.antrean.kode).toBe('U-001');
        await r.hp('ambil', { noKartu: SITI, kodepoli: '001' });
        await r.hp('ambil', { noKartu: BUDI, kodepoli: '001' });
        expect(await r.tarik()).toMatchObject({ baru: 1 });
        expect(r.mem.s.antrean.map((a) => [a.nomor, a.sumber, a.pcare_no_urut])).toEqual([[1, 'loket', '001'], [2, 'mobile_jkn', '002']]);
    });
    it('pendaftaran untuk besok tidak ditarik hari ini', async () => {
        const r = await rakit();
        expect((await r.hp('ambil', { noKartu: BUDI, kodepoli: '001', tanggal: 'besok' })).metadata.code).toBe(200);
        expect(await r.tarik()).toMatchObject({ status: 'ok', baru: 0 });
        expect(r.mem.s.antrean).toHaveLength(0);
    });
    it('peserta membatalkan di HP: antrean yang masih menunggu ikut batal tanpa kabar balik ke BPJS; yang sudah dipanggil dibiarkan', async () => {
        const r = await rakit();
        await r.hp('ambil', { noKartu: BUDI, kodepoli: '001' });
        await r.hp('ambil', { noKartu: SITI, kodepoli: '001' });
        await r.tarik();
        await r.kunjungan.aksiAntrean(PETUGAS, r.mem.s.antrean[1].id, 'panggil', '');
        for (const noKartu of [BUDI, SITI])
            expect((await r.hp('batal', { noKartu, kodepoli: '001', tanggalperiksa: TANGGAL })).metadata.code).toBe(200);
        expect(await r.tarik()).toMatchObject({ status: 'ok', baru: 0, batal: 1 });
        expect(r.mem.s.antrean.map((a) => a.status)).toEqual(['batal', 'dipanggil']);
        expect(r.mem.s.antrean[0].bpjs_status).toBeNull();
        // Nomor urut PCare yang dilepas tidak menutupi pendaftaran peserta yang sama bila ia mendaftar lagi.
        await r.hp('ambil', { noKartu: BUDI, kodepoli: '001' });
        expect(await r.tarik()).toMatchObject({ baru: 1 });
        expect(r.mem.s.antrean.at(-1)).toMatchObject({ nomor: 3, pcare_no_urut: '003', status: 'menunggu' });
    });
    it('poli yang belum dipetakan dilewati dengan keterangan, sisanya tetap masuk', async () => {
        const r = await rakit();
        await r.hp('ambil', { noKartu: BUDI, kodepoli: '002' });
        await r.hp('ambil', { noKartu: SITI, kodepoli: '001' });
        const h = await r.tarik();
        expect(h).toMatchObject({ status: 'ok', baru: 1, dilewati: [A.tarik.poliBelumDipetakan('001', 'Gigi')] });
        expect(r.mem.s.antrean).toHaveLength(1);
    });
    it('nonaktif atau PCare belum dikonfigurasi: tidak menarik dan tidak melempar galat', async () => {
        const mati = await rakit({ aktif: false });
        await mati.hp('ambil', { noKartu: BUDI, kodepoli: '001' });
        expect(await mati.tarik()).toMatchObject({ status: 'nonaktif', baru: 0 });
        expect(mati.dummy.store.tarikanPendaftaran).toBeNull();
        const tanpa = await rakit({ pcare: false });
        expect(await tanpa.tarik()).toMatchObject({ status: 'gagal', pesan: A.galat.pcareBelum });
        await mati.layanan.tarikSemua();
        expect(mati.mem.s.antrean).toHaveLength(0);
    });
    it('penarikan berkala dibatasi jaraknya; paksa selalu menarik', async () => {
        const r = await rakit();
        await r.layanan.tarikSemua();
        const pertama = r.dummy.store.tarikanPendaftaran.waktu;
        await r.hp('ambil', { noKartu: BUDI, kodepoli: '001' });
        await r.layanan.tarikSemua();
        expect(r.mem.s.antrean).toHaveLength(0);
        expect(r.dummy.store.tarikanPendaftaran.waktu).toBe(pertama);
        r.waktu.geser = JEDA_TARIK_MS + 1;
        await r.layanan.tarikSemua();
        expect(r.mem.s.antrean).toHaveLength(1);
    });
    it('rute: tarik butuh izin pendaftaran kunjungan', async () => {
        const r = await rakit();
        const app = express();
        app.use(express.json());
        const akses = { saya: async (id) => (id ? { id: 9, fasyankes_id: 1 } : null) };
        const izin = { boleh: async () => false };
        app.use(buatRuteAntreanJkn(akses, izin, r.layanan));
        expect((await panggilTanpaPort(app, { metode: 'POST', url: '/antrean-jkn/tarik', badan: {} })).status).toBe(401);
    });
});

describe('klinik mengabarkan antrean ke BPJS', () => {
    it('antrean dari Mobile JKN tidak ditambahkan lagi, tetapi panggilan klinik sampai ke HP peserta', async () => {
        const r = await rakit();
        await r.hp('ambil', { noKartu: BUDI, kodepoli: '001' });
        await r.tarik();
        expect(r.dummy.store.antrean).toHaveLength(1);
        expect((await r.kunjungan.aksiAntrean(PETUGAS, r.mem.s.antrean[0].id, 'panggil', '')).data.antrean_bpjs.status).toBe('terkirim');
        expect((await r.hp('keadaan')).antrean[0]).toMatchObject({ nomorantrean: '001', sumber: 'mobile_jkn', status: 'dipanggil' });
    });
    it('daftar di loket (JKN) menambah antrean di BPJS; panggil dan batal ikut terkirim', async () => {
        const r = await rakit();
        const siti = pasienSiti(r.mem);
        const h = await r.kunjungan.daftarkan(PETUGAS, { pasien_id: siti.id, jenis: 'AMB', jenis_poli: 'Umum', dpjp_id: 21, cara_pembayaran: 'jkn' }, '');
        expect(h.data.antrean_bpjs).toEqual({ status: 'terkirim', pesan: '' });
        expect(r.dummy.store.antrean[0]).toMatchObject({ nomorkartu: SITI, kodepoli: '001', namapoli: 'Umum', norm: 'RM-000900', tanggalperiksa: TANGGAL, kodedokter: 123123, namadokter: 'dr. Satu', nomorantrean: 'U-001', angkaantrean: 1, sumber: 'faskes', status: 'menunggu' });
        expect((await r.kunjungan.aksiAntrean(PETUGAS, h.data.antrean.id, 'panggil', '')).data.antrean_bpjs.status).toBe('terkirim');
        expect(r.dummy.store.antrean[0].status).toBe('dipanggil');
        expect((await r.kunjungan.aksiAntrean(PETUGAS, h.data.antrean.id, 'batal', '')).data.antrean_bpjs.status).toBe('terkirim');
        expect(r.dummy.store.antrean[0].status).toBe('batal');
        expect(r.mem.s.antrean[0].bpjs_status).toBe('terkirim');
    });
    it('dilewati dikabarkan sebagai tidak hadir (status 2); dipanggil lagi kembali hadir', async () => {
        const r = await rakit();
        const siti = pasienSiti(r.mem);
        const h = await r.kunjungan.daftarkan(PETUGAS, { pasien_id: siti.id, jenis: 'AMB', jenis_poli: 'Umum', dpjp_id: 21, cara_pembayaran: 'jkn' }, '');
        await r.kunjungan.aksiAntrean(PETUGAS, h.data.antrean.id, 'panggil', '');
        expect((await r.kunjungan.aksiAntrean(PETUGAS, h.data.antrean.id, 'lewati', '')).data.antrean_bpjs.status).toBe('terkirim');
        expect(r.dummy.store.antrean[0].status).toBe('tidak_hadir');
        expect((await r.kunjungan.aksiAntrean(PETUGAS, h.data.antrean.id, 'panggil', '')).data.antrean_bpjs.status).toBe('terkirim');
        expect(r.dummy.store.antrean[0].status).toBe('dipanggil');
    });
    it('pasien umum dan antrean online nonaktif tidak dikirim', async () => {
        const r = await rakit();
        const siti = pasienSiti(r.mem);
        expect((await r.kunjungan.daftarkan(PETUGAS, { pasien_id: siti.id, jenis: 'AMB', jenis_poli: 'Umum', cara_pembayaran: 'umum' }, '')).data.antrean_bpjs.status).toBe('dilewati');
        const mati = await rakit({ aktif: false });
        const siti2 = pasienSiti(mati.mem);
        expect((await mati.kunjungan.daftarkan(PETUGAS, { pasien_id: siti2.id, jenis: 'AMB', jenis_poli: 'Umum', cara_pembayaran: 'jkn' }, '')).data.antrean_bpjs.status).toBe('dilewati');
        expect(r.dummy.store.antrean).toHaveLength(0);
        expect(mati.dummy.store.antrean).toHaveLength(0);
    });
    it('gagal kirim tidak menggagalkan pendaftaran dan alasannya tercatat di antrean', async () => {
        const r = await rakit();
        const siti = pasienSiti(r.mem);
        const gigi = await r.kunjungan.daftarkan(PETUGAS, { pasien_id: siti.id, jenis: 'AMB', jenis_poli: 'Gigi', cara_pembayaran: 'jkn' }, '');
        expect(gigi).toMatchObject({ ok: true, data: { antrean_bpjs: { status: 'gagal', pesan: A.galat.poliBelumDipetakan('Gigi') } } });
        expect(r.mem.s.antrean[0]).toMatchObject({ bpjs_status: 'gagal', bpjs_pesan: A.galat.poliBelumDipetakan('Gigi') });
        const tanpaPcare = await rakit({ pcare: false });
        const siti2 = pasienSiti(tanpaPcare.mem);
        expect((await tanpaPcare.kunjungan.daftarkan(PETUGAS, { pasien_id: siti2.id, jenis: 'AMB', jenis_poli: 'Umum', cara_pembayaran: 'jkn' }, '')).data.antrean_bpjs).toEqual({ status: 'gagal', pesan: A.galat.pcareBelum });
        // BPJS menolak (peserta tidak dikenal dummy): pesan BPJS ikut tercatat.
        const asing = await rakit();
        asing.mem.s.pasien.push({ id: 1, nomor_rm: 'RM-1', nik: null, nama: 'X', jkn_nomor_kartu: '9999999999999' });
        const d = await asing.kunjungan.daftarkan(PETUGAS, { pasien_id: 1, jenis: 'AMB', jenis_poli: 'Umum', cara_pembayaran: 'jkn' }, '');
        expect(d.data.antrean_bpjs).toEqual({ status: 'gagal', pesan: A.galat.ditolak('Peserta tidak ditemukan') });
    });
    it('saat sesi antrean ditutup, pendaftaran Mobile JKN masuk ke antrean sementara (bukan antrean aktif)', async () => {
        const r = await rakit();
        const sementara = [];
        r.mem.repoJkn.sesiAntreanAktif = async () => null;
        r.mem.repoJkn.daftarSementaraJkn = async () => sementara;
        r.mem.repoJkn.cariSementaraJkn = async (_f, jp, no, nk) => sementara.find((x) => x.jenis_poli === jp && x.pcare_no_urut === no && x.jkn_nomor_kartu === nk) ?? null;
        r.mem.repoJkn.tambahSementaraJkn = async (d) => { sementara.push({ id: sementara.length + 1, ...d }); return { id: sementara.length, count: 1 }; };
        await r.hp('ambil', { noKartu: BUDI, kodepoli: '001' });
        const h = await r.tarik();
        expect(h).toMatchObject({ status: 'ok', baru: 1 });
        expect(r.mem.s.antrean).toHaveLength(0);
        expect(sementara).toHaveLength(1);
        expect(sementara[0]).toMatchObject({ jenis_poli: 'Umum', pcare_no_urut: '001', jkn_nomor_kartu: BUDI });
    });
});
