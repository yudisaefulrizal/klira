import { randomUUID } from 'node:crypto';
import * as db from '@klira/db';
import { gagal } from '../../../umum/hasil.js';
import { petakanKiaKeFhir, petakanOdontogramKeFhir, petakanUgdKeFhir } from './mapper-klinis.js';

const LOINC_TTV = [
    ['suhu', '8310-5', 'Body temperature', 'Cel', 'Cel'],
    ['tensi_sistol', '8480-6', 'Systolic blood pressure', 'mm[Hg]', 'mmHg'],
    ['tensi_diastol', '8462-4', 'Diastolic blood pressure', 'mm[Hg]', 'mmHg'],
    ['nadi', '8867-4', 'Heart rate', '/min', 'beats/minute'],
    ['respirasi', '9279-1', 'Respiratory rate', '/min', 'breaths/minute'],
];

const iso = (d) => new Date(d).toISOString();

/**
 * Pengirim data klinis kunjungan ke SATUSEHAT (Encounter, Condition, Observation TTV, Procedure, dan ekstensi Poli Gigi/UGD/KIA)
 * dalam satu FHIR Transaction Bundle. Otomatis menyinkronkan IHS Patient, Practitioner, dan Location bila belum terisi.
 */
export function buatLayananKirimSatusehat({ klienAktif, audit, repo = db, sekarang = () => new Date() }) {
    const sedangDikirim = new Map();
    const ekstrakIhs = (res) => (typeof res === 'string' ? res : res?.ditemukan ? res.id : null);

    async function pastikanPasienIhs(kunj, klien) {
        if (kunj.pasien_ihs)
            return kunj.pasien_ihs;
        if (!kunj.pasien_nik)
            return null;
        const ihs = ekstrakIhs(await klien.cariPasienNik(kunj.pasien_nik));
        if (ihs)
            await repo.simpanIhsPasien(kunj.pasien_id, ihs);
        return ihs;
    }

    async function pastikanNakesIhs(kunj, klien) {
        if (kunj.ihs_practitioner_id)
            return kunj.ihs_practitioner_id;
        if (!kunj.dokter_id || !kunj.dokter_nik)
            return null;
        const ihs = ekstrakIhs(await klien.cariNakesNik(kunj.dokter_nik));
        if (ihs)
            await repo.catatIhsPractitioner(kunj.dokter_id, ihs);
        return ihs;
    }

    async function pastikanLokasiIhs(kunj, klien, organizationId) {
        if (kunj.ihs_location_id)
            return kunj.ihs_location_id;
        if (!kunj.lokasi_id)
            return null;
        const loc = await klien.buat({
            resourceType: 'Location',
            status: 'active',
            name: kunj.lokasi_nama || 'Poliklinik',
            managingOrganization: { reference: `Organization/${organizationId}` },
        });
        if (loc?.id)
            await repo.catatIhsLocation(kunj.lokasi_id, loc.id);
        return loc?.id ?? null;
    }

    return {
        async kirimKunjungan(p, kunjunganId, alamat = null) {
            const aktifKirim = sedangDikirim.get(kunjunganId);
            if (aktifKirim)
                return aktifKirim;
            const janji = (async () => {
                const kunj = await repo.ambilKunjunganUntukSatusehat(kunjunganId);
            if (!kunj)
                return gagal('tidak_ditemukan', 'Kunjungan tidak ditemukan.');
            if (kunj.encounter_id)
                return { ok: true, data: { kunjungan_id: kunjunganId, encounter_id: kunj.encounter_id, sudah_ada: true } };

            const aktif = await klienAktif();
            if (!aktif)
                return gagal('belum_lengkap', 'Kredensial SATUSEHAT belum diaktifkan.');
            const { klien, organizationId } = aktif;

            try {
                const [patientIhs, practitionerIhs, locationIhs] = await Promise.all([
                    pastikanPasienIhs(kunj, klien),
                    pastikanNakesIhs(kunj, klien),
                    pastikanLokasiIhs(kunj, klien, organizationId),
                ]);

                if (!patientIhs)
                    return gagal('belum_lengkap', 'IHS Number pasien belum tersedia (NIK pasien tidak ditemukan di SATUSEHAT).');
                if (!practitionerIhs)
                    return gagal('belum_lengkap', 'IHS Practitioner dokter belum tersedia (NIK dokter tidak ditemukan di SATUSEHAT).');
                if (!locationIhs)
                    return gagal('belum_lengkap', 'Lokasi poliklinik kunjungan belum memiliki IHS Location.');

                const encUuid = randomUUID();
                const refEnc = `urn:uuid:${encUuid}`;
                const selesai = kunj.waktu_tutup ?? kunj.selesai ?? sekarang();
                const mulai = kunj.mulai ?? selesai;

                const entry = [];
                const tambah = (resource) => {
                    const uuid = randomUUID();
                    entry.push({ fullUrl: `urn:uuid:${uuid}`, request: { method: 'POST', url: resource.resourceType }, resource });
                    return `urn:uuid:${uuid}`;
                };

                const conditionRefs = [];
                for (const d of kunj.diagnosis) {
                    const ref = tambah({
                        resourceType: 'Condition',
                        clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active', display: 'Active' }] },
                        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'encounter-diagnosis', display: 'Encounter Diagnosis' }] }],
                        code: { coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: d.kode_icd10, display: d.nama }] },
                        subject: { reference: `Patient/${patientIhs}`, display: kunj.pasien_nama },
                        encounter: { reference: refEnc },
                    });
                    conditionRefs.push({ condition: { reference: ref }, rank: conditionRefs.length + 1 });
                }

                // Encounter diletakkan di awal bundle dengan referensi ke Condition bila ada.
                entry.unshift({
                    fullUrl: refEnc,
                    request: { method: 'POST', url: 'Encounter' },
                    resource: {
                        resourceType: 'Encounter',
                        status: kunj.tahap_layanan === 'ditutup' ? 'finished' : 'in-progress',
                        class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: kunj.jenis === 'IMP' ? 'IMP' : 'AMB', display: kunj.jenis === 'IMP' ? 'inpatient encounter' : 'ambulatory' },
                        subject: { reference: `Patient/${patientIhs}`, display: kunj.pasien_nama },
                        participant: [{ type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType', code: 'ATND', display: 'attender' }] }], individual: { reference: `Practitioner/${practitionerIhs}`, display: kunj.dokter_nama } }],
                        period: { start: iso(mulai), ...(kunj.tahap_layanan === 'ditutup' ? { end: iso(selesai) } : {}) },
                        location: [{ location: { reference: `Location/${locationIhs}`, display: kunj.lokasi_nama } }],
                        serviceProvider: { reference: `Organization/${organizationId}` },
                        ...(conditionRefs.length ? { diagnosis: conditionRefs } : {}),
                        statusHistory: [{ status: 'arrived', period: { start: iso(mulai), end: iso(selesai) } }],
                    },
                });

                if (kunj.pemeriksaan) {
                    const waktuObs = iso(kunj.pemeriksaan.dibuat_pada ?? selesai);
                    for (const [kolom, code, display, unit, unitCode] of LOINC_TTV) {
                        const nilai = Number(kunj.pemeriksaan[kolom]);
                        if (!Number.isFinite(nilai) || nilai <= 0)
                            continue;
                        tambah({
                            resourceType: 'Observation',
                            status: 'final',
                            category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }] }],
                            code: { coding: [{ system: 'http://loinc.org', code, display }] },
                            subject: { reference: `Patient/${patientIhs}` },
                            encounter: { reference: refEnc },
                            effectiveDateTime: waktuObs,
                            valueQuantity: { value: nilai, unit, system: 'http://unitsofmeasure.org', code: unitCode },
                        });
                    }
                }

                for (const t of kunj.tindakan) {
                    if (!t.kode_icd9cm)
                        continue;
                    tambah({
                        resourceType: 'Procedure',
                        status: 'completed',
                        code: { coding: [{ system: 'http://hl7.org/fhir/sid/icd-9-cm', code: t.kode_icd9cm, display: t.nama }] },
                        subject: { reference: `Patient/${patientIhs}` },
                        encounter: { reference: refEnc },
                        performedPeriod: { start: iso(mulai), end: iso(selesai) },
                    });
                }

                // Ekstensi poli (Gigi, UGD, KIA) dari mapper-klinis.js
                const ekstensi = [
                    ...(kunj.odontogram ? petakanOdontogramKeFhir(kunj.odontogram, { patientIhsId: patientIhs, encounterId: undefined }) : []),
                    ...(kunj.ugd ? petakanUgdKeFhir(kunj.ugd, { patientIhsId: patientIhs, encounterId: undefined }) : []),
                    ...(kunj.kia ? petakanKiaKeFhir(kunj.kia, { patientIhsId: patientIhs, encounterId: undefined }) : []),
                ];
                for (const r of ekstensi) {
                    tambah({ ...r, encounter: { reference: refEnc } });
                }

                // AllergyIntolerance (bila ada catatan alergi pada pemeriksaan)
                const alergiTeks = String(kunj.pemeriksaan?.alergi ?? '').trim();
                if (alergiTeks && !['tidak ada', 'none', '-'].includes(alergiTeks.toLowerCase())) {
                    tambah({
                        resourceType: 'AllergyIntolerance',
                        clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active', display: 'Active' }] },
                        verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification', code: 'confirmed', display: 'Confirmed' }] },
                        category: ['medication'],
                        code: { text: alergiTeks },
                        patient: { reference: `Patient/${patientIhs}`, display: kunj.pasien_nama },
                        encounter: { reference: refEnc },
                        recordedDate: iso(kunj.pemeriksaan?.dibuat_pada ?? selesai),
                    });
                }

                // Medication, MedicationRequest, & MedicationDispense (untuk item obat dengan kode KFA sah)
                const medRefs = [];
                for (const o of kunj.obat ?? []) {
                    const kfa = String(o.kfa_kode ?? '').trim();
                    if (!/^(91|92|93)\d{6}$/.test(kfa))
                        continue;
                    const namaObat = o.kfa_nama || o.nama_tampil || kfa;
                    const medRef = tambah({
                        resourceType: 'Medication',
                        code: { coding: [{ system: 'http://sys-ids.kemkes.go.id/kfa', code: kfa, display: namaObat }] },
                        status: 'active',
                    });
                    const reqRef = tambah({
                        resourceType: 'MedicationRequest',
                        status: 'completed',
                        intent: 'order',
                        medicationReference: { reference: medRef, display: namaObat },
                        subject: { reference: `Patient/${patientIhs}`, display: kunj.pasien_nama },
                        encounter: { reference: refEnc },
                        authoredOn: iso(o.waktu_resep ?? selesai),
                        requester: { reference: `Practitioner/${practitionerIhs}`, display: kunj.dokter_nama },
                        ...(o.aturan_pakai ? { dosageInstruction: [{ text: o.aturan_pakai }] } : {}),
                    });
                    medRefs.push({ reference: reqRef });
                    if (['diserahkan', 'selesai'].includes(o.status_resep)) {
                        tambah({
                            resourceType: 'MedicationDispense',
                            status: 'completed',
                            medicationReference: { reference: medRef, display: namaObat },
                            subject: { reference: `Patient/${patientIhs}`, display: kunj.pasien_nama },
                            context: { reference: refEnc },
                            authorizingPrescription: [{ reference: reqRef }],
                            quantity: { value: Number(o.jumlah) || 1, unit: o.satuan || 'tablet' },
                            whenHandedOver: iso(o.waktu_siap ?? selesai),
                        });
                    }
                }

                // Penunjang / Lab: ServiceRequest, Specimen, Observation Hasil, & DiagnosticReport
                for (const pnj of kunj.penunjang ?? []) {
                    const loinc = String(pnj.kode_loinc ?? '').trim();
                    if (!loinc)
                        continue;
                    const srRef = tambah({
                        resourceType: 'ServiceRequest',
                        status: pnj.nilai !== null && pnj.nilai !== undefined ? 'completed' : 'active',
                        intent: 'order',
                        code: { coding: [{ system: 'http://loinc.org', code: loinc, display: pnj.nama }] },
                        subject: { reference: `Patient/${patientIhs}`, display: kunj.pasien_nama },
                        encounter: { reference: refEnc },
                        authoredOn: iso(pnj.dibuat_pada ?? mulai),
                        requester: { reference: `Practitioner/${practitionerIhs}`, display: kunj.dokter_nama },
                    });
                    if (pnj.nilai !== null && pnj.nilai !== undefined) {
                        const specRef = tambah({
                            resourceType: 'Specimen',
                            status: 'available',
                            subject: { reference: `Patient/${patientIhs}` },
                            request: [{ reference: srRef }],
                        });
                        const numNilai = Number(pnj.nilai);
                        const obsRef = tambah({
                            resourceType: 'Observation',
                            status: 'final',
                            category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }] }],
                            code: { coding: [{ system: 'http://loinc.org', code: loinc, display: pnj.nama }] },
                            subject: { reference: `Patient/${patientIhs}` },
                            encounter: { reference: refEnc },
                            specimen: { reference: specRef },
                            effectiveDateTime: iso(pnj.divalidasi_pada ?? selesai),
                            ...(Number.isFinite(numNilai)
                                ? { valueQuantity: { value: numNilai, unit: pnj.satuan || '-', system: 'http://unitsofmeasure.org', code: pnj.satuan || '-' } }
                                : { valueString: String(pnj.nilai) }),
                        });
                        tambah({
                            resourceType: 'DiagnosticReport',
                            status: 'final',
                            category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0074', code: 'LAB', display: 'Laboratory' }] }],
                            code: { coding: [{ system: 'http://loinc.org', code: loinc, display: pnj.nama }] },
                            subject: { reference: `Patient/${patientIhs}` },
                            encounter: { reference: refEnc },
                            basedOn: [{ reference: srRef }],
                            specimen: [{ reference: specRef }],
                            result: [{ reference: obsRef }],
                            effectiveDateTime: iso(pnj.divalidasi_pada ?? selesai),
                            issued: iso(pnj.divalidasi_pada ?? selesai),
                        });
                    }
                }

                // Composition (Resume Medis / Ringkasan Kunjungan)
                if (kunj.diagnosis.length || kunj.pemeriksaan) {
                    const sections = [];
                    if (conditionRefs.length)
                        sections.push({ title: 'Diagnosis', entry: conditionRefs.map((c) => c.condition) });
                    if (medRefs.length)
                        sections.push({ title: 'Terapi Obat', entry: medRefs });
                    if (!sections.length)
                        sections.push({ title: 'Ringkasan Klinis', text: { status: 'generated', div: `<div xmlns="http://www.w3.org/1999/xhtml">${kunj.pemeriksaan?.asesmen || kunj.pemeriksaan?.keluhan_utama || 'Kunjungan selesai'}</div>` } });
                    tambah({
                        resourceType: 'Composition',
                        status: 'final',
                        type: { coding: [{ system: 'http://loinc.org', code: kunj.jenis === 'IMP' ? '18842-5' : '11506-3', display: kunj.jenis === 'IMP' ? 'Discharge summary' : 'Progress note' }] },
                        subject: { reference: `Patient/${patientIhs}`, display: kunj.pasien_nama },
                        encounter: { reference: refEnc },
                        date: iso(selesai),
                        author: [{ reference: `Practitioner/${practitionerIhs}`, display: kunj.dokter_nama }],
                        title: kunj.jenis === 'IMP' ? 'Resume Medis Rawat Inap' : 'Ringkasan Kunjungan Rawat Jalan',
                        custodian: { reference: `Organization/${organizationId}` },
                        section: sections,
                    });
                }

                const hasil = await klien.kirimBundle({ resourceType: 'Bundle', type: 'transaction', entry });
                const encounterId = hasil.find((h) => h.tipe === 'Encounter')?.id ?? null;
                if (!encounterId)
                    return gagal('konflik', 'SATUSEHAT tidak mengembalikan ID Encounter.');

                await repo.catatEncounterSatusehat(kunjunganId, encounterId);
                await audit.catat({
                    pengguna_id: p?.id ?? null,
                    aksi: 'input',
                    entitas: 'satusehat_encounter',
                    entitas_id: kunjunganId,
                    keterangan: `Kunjungan ${kunjunganId} terkirim ke SATUSEHAT (Encounter/${encounterId}, ${hasil.length} resource)`,
                    alamat,
                });
                return { ok: true, data: { kunjungan_id: kunjunganId, encounter_id: encounterId, jumlah_resource: hasil.length, resources: hasil } };
            }
            catch (e) {
                return gagal('konflik', e?.message ?? 'Gagal mengirim bundle ke SATUSEHAT.');
            }
            })();
            sedangDikirim.set(kunjunganId, janji);
            try {
                return await janji;
            }
            finally {
                sedangDikirim.delete(kunjunganId);
            }
        },
    };
}
