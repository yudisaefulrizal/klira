/**
 * Mapper murni (pure functions) untuk menerjemahkan data terstruktur Poli Gigi (`odontogram_pasien`),
 * UGD (`ugd_kunjungan`), dan Poli KIA (`kia_kunjungan`) ke resource FHIR R4 SATUSEHAT Kemenkes.
 */

const SYSTEM_LOINC = 'http://loinc.org';
const SYSTEM_SNOMED = 'http://snomed.info/sct';
const SYSTEM_KFA = 'http://sys-ids.kemkes.go.id/kfa';
const SYSTEM_TRIASE = 'http://terminology.kemkes.go.id/CodeSystem/triage-category';

const PETA_KONDISI_GIGI = {
    car: { code: '80967001', display: 'Dental caries' },
    cof: { code: '234947003', display: 'Dental composite restoration' },
    amf: { code: '234947003', display: 'Dental amalgam restoration' },
    rrx: { code: '109686009', display: 'Retained dental root' },
    mis: { code: '35646002', display: 'Missing tooth' },
    non: { code: '278658009', display: 'Unerupted tooth' },
    imx: { code: '38932005', display: 'Impacted tooth' },
    poc: { code: '257263004', display: 'Dental crown' },
    prd: { code: '257265006', display: 'Denture' },
    goyang: { code: '8422000', display: 'Tooth mobility' },
};

const PETA_TRIASE_FHIR = {
    merah: { code: 'red', display: 'Merah - Resusitasi' },
    kuning: { code: 'yellow', display: 'Kuning - Urgent' },
    hijau: { code: 'green', display: 'Hijau - Non-Urgent' },
    hitam: { code: 'black', display: 'Hitam - Meninggal / DOA' },
};

const refPasien = (patientIhsId, nama) => ({
    reference: `Patient/${patientIhsId}`,
    ...(nama ? { display: nama } : {}),
});

const refEncounter = (encounterId) => (encounterId ? { reference: `Encounter/${encounterId}` } : undefined);

/** Petakan `odontogram_pasien` (gigi FDI + intraoral) menjadi daftar resource FHIR `Condition` & `Observation`. */
export function petakanOdontogramKeFhir(odontogram, { patientIhsId, patientNama, encounterId, effectiveDateTime } = {}) {
    if (!odontogram || !patientIhsId) return [];
    const hasil = [];
    const waktu = effectiveDateTime ?? new Date().toISOString();
    const subject = refPasien(patientIhsId, patientNama);
    const encounter = refEncounter(encounterId);

    for (const [nomorGigi, entri] of Object.entries(odontogram.gigi ?? {})) {
        if (!entri?.kondisi || entri.kondisi === 'sou') continue;
        const snomed = PETA_KONDISI_GIGI[entri.kondisi];
        if (!snomed) continue;
        hasil.push({
            resourceType: 'Condition',
            clinicalStatus: {
                coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active', display: 'Active' }],
            },
            category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'encounter-diagnosis', display: 'Encounter Diagnosis' }] }],
            code: { coding: [{ system: SYSTEM_SNOMED, code: snomed.code, display: snomed.display }] },
            bodySite: [{ coding: [{ system: SYSTEM_SNOMED, code: `FDI-${nomorGigi}`, display: `Gigi FDI ${nomorGigi}` }] }],
            subject,
            ...(encounter ? { encounter } : {}),
            recordedDate: waktu,
            ...(entri.catatan ? { note: [{ text: entri.catatan }] } : {}),
        });
    }

    const intraoralTerisi = Object.entries(odontogram.intraoral ?? {}).filter(([, v]) => Boolean(v));
    if (intraoralTerisi.length) {
        hasil.push({
            resourceType: 'Observation',
            status: 'final',
            category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'exam', display: 'Exam' }] }],
            code: { coding: [{ system: SYSTEM_LOINC, code: '10201-2', display: 'Physical findings of Mouth and Throat and Teeth' }] },
            subject,
            ...(encounter ? { encounter } : {}),
            effectiveDateTime: waktu,
            valueString: intraoralTerisi.map(([k, v]) => `${k}: ${v}`).join('; '),
        });
    }
    return hasil;
}

/** Petakan `ugd_kunjungan` menjadi resource FHIR `Observation` Triase + Survei Primer ABCDE. */
export function petakanUgdKeFhir(ugd, { patientIhsId, patientNama, encounterId } = {}) {
    if (!ugd || !patientIhsId) return [];
    const kodeTriase = PETA_TRIASE_FHIR[ugd.triase ?? 'hijau'] ?? PETA_TRIASE_FHIR.hijau;
    const d = ugd.data ?? {};
    const komponen = [
        d.airway && { code: { text: 'Airway' }, valueString: d.airway },
        d.breathing && { code: { text: 'Breathing' }, valueString: d.breathing },
        d.circulation && { code: { text: 'Circulation' }, valueString: d.circulation },
        d.disability && { code: { text: 'Disability (AVPU)' }, valueString: d.disability },
        d.zona && { code: { text: 'Zona Penempatan' }, valueString: d.zona },
        d.cara_datang && { code: { text: 'Cara Datang' }, valueString: d.cara_datang },
        d.jenis_kasus && { code: { text: 'Jenis Kasus' }, valueString: d.jenis_kasus },
        d.temuan_trauma && { code: { text: 'Temuan Trauma' }, valueString: d.temuan_trauma },
    ].filter(Boolean);

    return [{
        resourceType: 'Observation',
        status: 'final',
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'survey', display: 'Survey' }] }],
        code: { coding: [{ system: SYSTEM_LOINC, code: '54094-8', display: 'Hospital emergency department triage note' }] },
        subject: refPasien(patientIhsId, patientNama),
        ...(encounterId ? { encounter: refEncounter(encounterId) } : {}),
        effectiveDateTime: ugd.waktu_triase ?? new Date().toISOString(),
        valueCodeableConcept: { coding: [{ system: SYSTEM_TRIASE, code: kodeTriase.code, display: kodeTriase.display }] },
        ...(komponen.length ? { component: komponen } : {}),
        ...(d.catatan ? { note: [{ text: d.catatan }] } : {}),
    }];
}

const obsNumerik = (code, display, nilai, unit, subject, encounter, waktu) => ({
    resourceType: 'Observation',
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'exam', display: 'Exam' }] }],
    code: { coding: [{ system: SYSTEM_LOINC, code, display }] },
    subject,
    ...(encounter ? { encounter } : {}),
    effectiveDateTime: waktu,
    valueQuantity: { value: Number(nilai), unit, system: 'http://unitsofmeasure.org', code: unit },
});

/** Petakan `kia_kunjungan` (`anc`, `kb`, `anak`) menjadi resource FHIR `Observation` dan/atau `Immunization`. */
export function petakanKiaKeFhir(kia, { patientIhsId, patientNama, encounterId, effectiveDateTime } = {}) {
    if (!kia || !patientIhsId) return [];
    const d = kia.data ?? {};
    const waktu = effectiveDateTime ?? new Date().toISOString();
    const subject = refPasien(patientIhsId, patientNama);
    const encounter = refEncounter(encounterId);
    const hasil = [];

    if (kia.layanan === 'anc') {
        if (d.hpht) {
            hasil.push({
                resourceType: 'Observation',
                status: 'final',
                code: { coding: [{ system: SYSTEM_LOINC, code: '8665-2', display: 'Last menstrual period start date' }] },
                subject,
                ...(encounter ? { encounter } : {}),
                effectiveDateTime: waktu,
                valueDateTime: d.hpht,
            });
        }
        if (d.tfu && !Number.isNaN(Number(d.tfu))) {
            hasil.push(obsNumerik('11881-0', 'Uterus Fundal height Tape measure', d.tfu, 'cm', subject, encounter, waktu));
        }
        if (d.djj && !Number.isNaN(Number(d.djj))) {
            hasil.push(obsNumerik('55283-6', 'Fetal Heart rate', d.djj, '/min', subject, encounter, waktu));
        }
        if (d.lila && !Number.isNaN(Number(d.lila))) {
            hasil.push(obsNumerik('56072-2', 'Circumference Mid upper arm', d.lila, 'cm', subject, encounter, waktu));
        }
        return hasil;
    }

    if (kia.layanan === 'kb') {
        if (d.metode_kb) {
            hasil.push({
                resourceType: 'Observation',
                status: 'final',
                code: { coding: [{ system: SYSTEM_LOINC, code: '86653-3', display: 'Contraception method' }] },
                subject,
                ...(encounter ? { encounter } : {}),
                effectiveDateTime: waktu,
                valueString: [d.metode_kb, d.status_kb && `Status: ${d.status_kb}`, d.kontrol_kb && `Kontrol: ${d.kontrol_kb}`].filter(Boolean).join(' · '),
            });
        }
        return hasil;
    }

    // Layanan Anak / Imunisasi
    if (d.lk && !Number.isNaN(Number(d.lk))) {
        hasil.push(obsNumerik('9843-4', 'Head Occipital-frontal circumference', d.lk, 'cm', subject, encounter, waktu));
    }
    if (d.vaksin || d.vaksin_kfa) {
        hasil.push({
            resourceType: 'Immunization',
            status: 'completed',
            vaccineCode: {
                coding: [{
                    system: SYSTEM_KFA,
                    ...(d.vaksin_kfa ? { code: d.vaksin_kfa } : {}),
                    display: d.vaksin || d.vaksin_kfa,
                }],
            },
            patient: subject,
            ...(encounter ? { encounter } : {}),
            occurrenceDateTime: waktu,
            ...(d.batch_vaksin ? { lotNumber: d.batch_vaksin } : {}),
            ...(d.dosis_vaksin ? { note: [{ text: d.dosis_vaksin }] } : {}),
        });
    }
    return hasil;
}
