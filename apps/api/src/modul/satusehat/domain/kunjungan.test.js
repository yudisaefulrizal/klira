import { jest } from '@jest/globals';
import { buatAplikasiSatusehat, KONFIG_SATUSEHAT_BAWAAN } from '../../../../../../dummy-intergrasi/satusehat/satusehat.js';
import { mulaiDummy, tutupDummy, PORT_SATUSEHAT, URL_SATUSEHAT } from '../../../../../../dummy-intergrasi/uji-bantu.js';
import { buatKlienSatusehat } from '@klira/integrasi';
import { buatLayananKirimSatusehat } from './kunjungan.js';

const K = KONFIG_SATUSEHAT_BAWAAN;
let server;
beforeAll(async () => { server = await mulaiDummy(buatAplikasiSatusehat(), PORT_SATUSEHAT); });
afterAll(() => tutupDummy(server));

const klien = () => buatKlienSatusehat({ baseUrl: URL_SATUSEHAT, clientId: K.clientId, clientSecret: K.clientSecret, organizationId: K.organizationId });

function buatMock(kunjOverride = {}) {
    const tersimpan = { encounter: [], practitioner: [], location: [] };
    const repo = {
        ambilKunjunganUntukSatusehat: jest.fn(async () => ({
            id: 10, jenis: 'AMB', status: 'finished', tahap_layanan: 'ditutup',
            mulai: new Date('2026-11-24T03:00:00.000Z'), selesai: new Date('2026-11-24T04:00:00.000Z'), waktu_tutup: new Date('2026-11-24T04:00:00.000Z'),
            encounter_id: null, lokasi_id: 1, lokasi_nama: 'Poli Umum 1', ihs_location_id: null,
            pasien_id: 2, pasien_nama: 'BUDI SANTOSO', pasien_nik: '3201010101800001', pasien_ihs: 'P02478375538',
            dokter_id: 3, dokter_nama: 'dr. Ahmad', dokter_nik: '3201010101750001', ihs_practitioner_id: '10009880728',
            pemeriksaan: { suhu: 36.8, tensi_sistol: 120, tensi_diastol: 80, nadi: 80, respirasi: 20, dibuat_pada: new Date('2026-11-24T03:30:00.000Z') },
            diagnosis: [{ kode_icd10: 'A09', nama: 'Diarrhoea and gastroenteritis of presumed infectious origin', peran: 'utama', urutan: 1 }],
            tindakan: [],
            obat: [],
            penunjang: [],
            odontogram: null,
            ugd: null,
            kia: null,
            ...kunjOverride,
        })),
        simpanIhsPasien: jest.fn(async () => {}),
        catatEncounterSatusehat: jest.fn(async (id, encId) => { tersimpan.encounter.push({ id, encId }); }),
        catatIhsPractitioner: jest.fn(async (id, ihs) => { tersimpan.practitioner.push({ id, ihs }); }),
        catatIhsLocation: jest.fn(async (id, ihs) => { tersimpan.location.push({ id, ihs }); }),
    };
    const audit = { catat: jest.fn(async () => {}) };
    const layanan = buatLayananKirimSatusehat({ klienAktif: async () => ({ environment: 'sandbox', organizationId: K.organizationId, klien: klien() }), audit, repo });
    return { layanan, repo, tersimpan };
}

describe('layanan kirim SATUSEHAT', () => {
    it('membuat Location otomatis bila belum ada, lalu mengirim Bundle Encounter + Condition + Observation TTV + Composition', async () => {
        const { layanan, tersimpan } = buatMock();
        const h = await layanan.kirimKunjungan({ id: 1 }, 10);
        expect(h.ok).toBe(true);
        expect(h.data.encounter_id).toBeTruthy();
        expect(h.data.jumlah_resource).toBe(8); // 1 Encounter + 1 Condition + 5 Observation TTV + 1 Composition
        expect(tersimpan.location).toHaveLength(1);
        expect(tersimpan.encounter[0]).toEqual({ id: 10, encId: h.data.encounter_id });
    });

    it('mengirim AllergyIntolerance, Medication/Request/Dispense (KFA), dan Lab (ServiceRequest/Specimen/Observation/DiagnosticReport)', async () => {
        const { layanan } = buatMock({
            pemeriksaan: { suhu: 37.2, alergi: 'Penisilin', dibuat_pada: new Date('2026-11-24T03:30:00.000Z') },
            obat: [{ id: 1, status_resep: 'diserahkan', waktu_resep: new Date('2026-11-24T03:40:00.000Z'), waktu_siap: new Date('2026-11-24T03:50:00.000Z'), aturan_pakai: '3x1', jumlah: 10, kfa_kode: '91000001', kfa_nama: 'Paracetamol 500 mg', nama_tampil: 'Paracetamol', satuan: 'tablet' }],
            penunjang: [{ id: 1, jenis: 'lab', kode_loinc: '718-7', nama: 'Hemoglobin', status: 'selesai', dibuat_pada: new Date('2026-11-24T03:20:00.000Z'), nilai: '13.5', satuan: 'g/dL', divalidasi_pada: new Date('2026-11-24T03:45:00.000Z') }],
        });
        const h = await layanan.kirimKunjungan({ id: 1 }, 10);
        expect(h.ok).toBe(true);
        const tipe = h.data.resources.map((r) => r.tipe);
        expect(tipe).toEqual(expect.arrayContaining([
            'Encounter', 'Condition', 'AllergyIntolerance',
            'Medication', 'MedicationRequest', 'MedicationDispense',
            'ServiceRequest', 'Specimen', 'Observation', 'DiagnosticReport',
            'Composition',
        ]));
    });

    it('idempoten jika encounter_id sudah ada', async () => {
        const { layanan, tersimpan } = buatMock({ encounter_id: 'ENC-SUDAH-ADA' });
        const h = await layanan.kirimKunjungan({ id: 1 }, 10);
        expect(h).toEqual({ ok: true, data: { kunjungan_id: 10, encounter_id: 'ENC-SUDAH-ADA', sudah_ada: true } });
        expect(tersimpan.encounter).toHaveLength(0);
    });

    it('in-flight lock: klik serentak pada kunjungan yang sama hanya mengirim satu Bundle', async () => {
        const { layanan, repo } = buatMock();
        const [a, b] = await Promise.all([layanan.kirimKunjungan({ id: 1 }, 10), layanan.kirimKunjungan({ id: 1 }, 10)]);
        expect(a).toEqual(b);
        expect(a.ok).toBe(true);
        expect(repo.ambilKunjunganUntukSatusehat).toHaveBeenCalledTimes(1);
    });
});
