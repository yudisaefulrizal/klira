import { jest } from '@jest/globals';
import { buatAplikasiPcare, KONFIG_PCARE_BAWAAN } from '../../../../../../dummy-intergrasi/p-care/pcare.js';
import { mulaiDummy, tutupDummy, PORT_PCARE, URL_PCARE } from '../../../../../../dummy-intergrasi/uji-bantu.js';
import { buatKlienPcare } from '@klira/integrasi';
import { buatLayananPelayananPcare } from './pelayanan.js';

const K = KONFIG_PCARE_BAWAAN;
let server;
beforeAll(async () => { server = await mulaiDummy(buatAplikasiPcare(), PORT_PCARE); });
afterAll(() => tutupDummy(server));

const P = { id: 1 };
const klien = () => buatKlienPcare({ baseUrl: URL_PCARE, serviceName: K.serviceName, consId: K.consId, secretKey: K.secretKey, userKey: K.userKey, username: K.username, password: K.password, appCode: K.appCode });

function buatMock(kunjOverride = {}) {
    const tersimpan = [];
    const repo = {
        ambilKunjunganUntukPcare: jest.fn(async () => ({
            id: 10, jenis: 'AMB', tahap_layanan: 'ditutup', cara_pembayaran: 'jkn', keluhan_singkat: 'Demam',
            mulai: new Date('2026-11-24T03:00:00.000Z'), selesai: new Date('2026-11-24T04:00:00.000Z'), waktu_tutup: new Date('2026-11-24T04:00:00.000Z'),
            pcare_no_kunjungan: null, pcare_status: null, pcare_pesan: null, pcare_rujuk_lanjut: null, non_kapitasi: true,
            pasien_id: 2, pasien_nama: 'BUDI CONTOH', pasien_nik: '3201010101800001', jkn_nomor_kartu: '0000039043765',
            jenis_poli: 'Umum', pcare_no_urut: null, dokter_id: 7,
            pemeriksaan: { tensi_sistol: 120, tensi_diastol: 80, nadi: 80, respirasi: 20, tinggi: 170, berat: 65, lingkar_perut: 80, kesadaran: 'compos_mentis', keluhan_utama: 'Demam 2 hari' },
            diagnosis: [{ kode_icd10: 'J06.9', nama: 'Acute upper respiratory infection', peran: 'utama' }],
            tindakan: [{ id: 1, kode_icd9cm: '89.0', nama: 'Perawatan luka', tarif_layanan_id: 55, jumlah: 1 }],
            obat: [{ id: 1, master_obat_id: 99, nama_obat: 'Paracetamol', jumlah: 10 }],
            ...kunjOverride,
        })),
        daftarPemetaanBpjs: jest.fn(async () => [
            { jenis: 'poli', kunci: 'Umum', kode: '001', nama: 'Poli Umum' },
            { jenis: 'dokter', kunci: '7', kode: '123123', nama: 'dr. Contoh Satu' },
            { jenis: 'tindakan', kunci: '55', kode: '10102', nama: 'Perawatan luka' },
            { jenis: 'obat', kunci: '99', kode: '00000001', nama: 'Paracetamol 500 mg tablet' },
        ]),
        catatHasilKirimPcare: jest.fn(async (id, data) => { tersimpan.push({ id, ...data }); }),
        ubahAtributPcareKunjungan: jest.fn(async () => ({ count: 1 })),
        simpanPemetaanBpjsSatuan: jest.fn(async () => ({ count: 1 })),
        hapusPemetaanBpjsSatuan: jest.fn(async () => ({ count: 1 })),
    };
    const audit = { catat: jest.fn(async () => {}) };
    const layananPcare = { klienAktif: async () => ({ environment: 'sandbox', klien: klien() }) };
    const layanan = buatLayananPelayananPcare({ layananPcare, audit, repo, sekarang: () => new Date('2026-11-24T05:00:00.000Z') });
    return { layanan, repo, tersimpan, audit };
}

describe('layanan pelayanan PCare', () => {
    it('cekPeserta mengembalikan data peserta aktif dari PCare', async () => {
        const { layanan } = buatMock();
        const h = await layanan.cekPeserta('0000039043765', 'noka');
        expect(h.ok).toBe(true);
        expect(h.data.aktif).toBe(true);
        expect(h.data.nama).toBe('BUDI CONTOH');
    });

    it('kirimKunjungan mengirim Pendaftaran -> Kunjungan -> Tindakan -> Obat dan menyimpan noKunjungan', async () => {
        const { layanan, tersimpan } = buatMock();
        const h = await layanan.kirimKunjungan(P, 10);
        expect(h.ok).toBe(true);
        expect(h.data.no_kunjungan).toMatch(/Y\d{6}$/);
        expect(h.data.tindakan_terkirim).toBe(1);
        expect(h.data.obat_terkirim).toBe(1);
        expect(tersimpan[0]).toMatchObject({ id: 10, pcare_status: 'terkirim', pcare_no_kunjungan: h.data.no_kunjungan });
    });

    it('kirimKunjungan menolak jika poli atau dokter belum dipetakan', async () => {
        const { layanan } = buatMock({ jenis_poli: 'Poli Tidak Ada' });
        const h = await layanan.kirimKunjungan(P, 10);
        expect(h.ok).toBe(false);
        expect(h.kode).toBe('belum_lengkap');
    });

    it('idempoten item & in-flight lock: tidak mengirim ulang tindakan/obat yang sudah terkirim dan menggabungkan klik serentak', async () => {
        const { layanan, repo } = buatMock({
            pcare_no_kunjungan: '0114A0262411Y000099',
            pcare_item_terkirim: { tindakan: { 1: '101' }, obat: { 1: '201' } },
        });
        const [a, b] = await Promise.all([layanan.kirimKunjungan(P, 10), layanan.kirimKunjungan(P, 10)]);
        expect(a).toEqual(b);
        expect(a.ok).toBe(true);
        expect(a.data.tindakan_terkirim).toBe(0);
        expect(a.data.obat_terkirim).toBe(0);
        expect(repo.ambilKunjunganUntukPcare).toHaveBeenCalledTimes(1);
    });

    it('mendukung pengiriman terpisah per tahap: pendaftaran -> kunjungan -> tindakan -> obat', async () => {
        const { layanan } = buatMock({ mulai: new Date('2026-11-25T03:00:00.000Z'), waktu_tutup: new Date('2026-11-25T04:00:00.000Z') });
        const d = await layanan.kirimKunjungan(P, 10, { tahap: 'pendaftaran' });
        expect(d.ok).toBe(true);
        expect(d.data.no_urut).toBeTruthy();

        const k = await layanan.kirimKunjungan(P, 10, { tahap: 'kunjungan' });
        expect(k.ok).toBe(true);
        expect(k.data.no_kunjungan).toMatch(/Y\d{6}$/);
        expect(k.data.tindakan_terkirim).toBe(0);
        expect(k.data.obat_terkirim).toBe(0);
    });
});
