import { petakanKiaKeFhir, petakanOdontogramKeFhir, petakanUgdKeFhir } from './mapper-klinis.js';

describe('mapper FHIR SATUSEHAT klinis (Gigi, UGD, KIA)', () => {
    const ctx = {
        patientIhsId: 'P000123456',
        patientNama: 'Pasien Uji',
        encounterId: 'ENC-001',
        effectiveDateTime: '2026-11-23T10:00:00.000Z',
    };

    it('memetakan odontogram FDI & intraoral menjadi Condition + Observation FHIR', () => {
        const res = petakanOdontogramKeFhir({
            gigi: {
                16: { kondisi: 'car', catatan: 'MO' },
                11: { kondisi: 'sou', catatan: '' },
            },
            intraoral: { oklusi: 'Normal', gingiva: 'Hiperemis', kalkulus: '' },
        }, ctx);

        expect(res).toHaveLength(2);
        expect(res[0]).toMatchObject({
            resourceType: 'Condition',
            code: { coding: [{ code: '80967001', display: 'Dental caries' }] },
            bodySite: [{ coding: [{ code: 'FDI-16' }] }],
            subject: { reference: 'Patient/P000123456' },
            encounter: { reference: 'Encounter/ENC-001' },
            note: [{ text: 'MO' }],
        });
        expect(res[1]).toMatchObject({
            resourceType: 'Observation',
            valueString: 'oklusi: Normal; gingiva: Hiperemis',
        });
    });

    it('memetakan triase UGD + ABCDE menjadi Observation FHIR', () => {
        const res = petakanUgdKeFhir({
            triase: 'merah',
            waktu_triase: '2026-11-23T10:05:00.000Z',
            data: {
                zona: 'Ruang Resusitasi',
                cara_datang: 'Ambulans',
                jenis_kasus: 'Trauma / Kecelakaan',
                airway: 'Bebas',
                breathing: 'Sesak / Takipnea',
                circulation: 'Perdarahan aktif / Syok',
                disability: 'Alert',
                temuan_trauma: 'Fraktur terbuka kruris kanan',
            },
        }, ctx);

        expect(res).toHaveLength(1);
        expect(res[0]).toMatchObject({
            resourceType: 'Observation',
            valueCodeableConcept: { coding: [{ code: 'red', display: 'Merah - Resusitasi' }] },
            effectiveDateTime: '2026-11-23T10:05:00.000Z',
        });
        expect(res[0].component.length).toBe(8);
    });

    it('memetakan KIA ANC dan Anak (Immunization dengan kode KFA + batch)', () => {
        const anc = petakanKiaKeFhir({
            layanan: 'anc',
            data: { hpht: '2026-06-01', tfu: '26', djj: '144', lila: '25' },
        }, ctx);
        expect(anc.map((r) => r.code.coding[0].code)).toEqual(['8665-2', '11881-0', '55283-6', '56072-2']);

        const anak = petakanKiaKeFhir({
            layanan: 'anak',
            data: { lk: '42', vaksin: 'DPT-HB-Hib 1', vaksin_kfa: '93001012', batch_vaksin: 'B202611A', dosis_vaksin: '0.5 ml IM' },
        }, ctx);
        expect(anak).toHaveLength(2);
        expect(anak[0].resourceType).toBe('Observation');
        expect(anak[1]).toMatchObject({
            resourceType: 'Immunization',
            status: 'completed',
            vaccineCode: { coding: [{ system: 'http://sys-ids.kemkes.go.id/kfa', code: '93001012', display: 'DPT-HB-Hib 1' }] },
            lotNumber: 'B202611A',
            patient: { reference: 'Patient/P000123456' },
            note: [{ text: '0.5 ml IM' }],
        });
    });
});
