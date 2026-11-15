import { generateKeyPairSync } from 'node:crypto';
import { buatAplikasiSatusehat, dekripsiKyc, enkripsiKyc, KONFIG_SATUSEHAT_BAWAAN } from './satusehat.js';
import { mulaiDummy, tutupDummy, PORT_SATUSEHAT, URL_SATUSEHAT } from '../uji-bantu.js';

const K = KONFIG_SATUSEHAT_BAWAAN;
const ORG = K.organizationId;
const LOKASI = 'b017aa54-f1df-4ec2-9d84-8823815d7228';
const PASIEN = 'P02478375538';
const NAKES = '10009880728';
let app;
let server;
const basis = URL_SATUSEHAT;
let token;

beforeAll(async () => {
  app = buatAplikasiSatusehat();
  server = await mulaiDummy(app, PORT_SATUSEHAT);
  const res = await fetch(`${basis}/oauth2/v1/accesstoken?grant_type=client_credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: K.clientId, client_secret: K.clientSecret }),
  });
  token = (await res.json()).access_token;
});
afterAll(() => tutupDummy(server));

async function fhir(metode, jalur, body, { tanpaToken = false } = {}) {
  const res = await fetch(`${basis}/fhir-r4/v1${jalur}`, {
    method: metode,
    headers: { 'Content-Type': 'application/json', ...(tanpaToken ? {} : { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

const encounterBaku = (ekstra = {}) => ({
  resourceType: 'Encounter',
  identifier: [{ system: `http://sys-ids.kemkes.go.id/encounter/${ORG}`, value: 'REG-0001' }],
  status: 'finished',
  class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
  subject: { reference: `Patient/${PASIEN}`, display: 'Budi Contoh' },
  participant: [{ type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType', code: 'ATND', display: 'attender' }] }], individual: { reference: `Practitioner/${NAKES}`, display: 'dr. Contoh Satu' } }],
  period: { start: '2026-11-14T08:00:00+07:00', end: '2026-11-14T08:45:00+07:00' },
  location: [{ location: { reference: `Location/${LOKASI}`, display: 'Poli Umum' } }],
  serviceProvider: { reference: `Organization/${ORG}` },
  ...ekstra,
});
const conditionBaku = (encounterRef, kode = 'A01.0') => ({
  resourceType: 'Condition',
  clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active', display: 'Active' }] },
  category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'encounter-diagnosis', display: 'Encounter Diagnosis' }] }],
  code: { coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: kode, display: 'Typhoid fever' }] },
  subject: { reference: `Patient/${PASIEN}`, display: 'Budi Contoh' },
  encounter: { reference: encounterRef, display: 'Kunjungan' },
});

describe('token OAuth2', () => {
  const minta = (body, grant = 'client_credentials') =>
    fetch(`${basis}/oauth2/v1/accesstoken?grant_type=${grant}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body) });

  it('memberi access_token dan expires_in', async () => {
    const res = await minta({ client_id: K.clientId, client_secret: K.clientSecret });
    const b = await res.json();
    expect(res.status).toBe(200);
    expect(b.access_token).toMatch(/^[0-9a-f]{48}$/);
    expect(b.expires_in).toBe('3599');
    expect(b.token_type).toBe('BearerToken');
  });

  it('kredensial salah memberi OperationOutcome dengan issue[0].details.text', async () => {
    const res = await minta({ client_id: K.clientId, client_secret: 'salah' });
    const b = await res.json();
    expect(res.status).toBe(401);
    expect(b.resourceType).toBe('OperationOutcome');
    expect(b.issue[0].details.text).toMatch(/Invalid client/);
  });

  it('grant_type selain client_credentials ditolak', async () => {
    expect((await minta({ client_id: K.clientId, client_secret: K.clientSecret }, 'password')).status).toBe(400);
  });

  it('FHIR menolak tanpa token dan token palsu', async () => {
    expect((await fhir('GET', `/Patient/${PASIEN}`, undefined, { tanpaToken: true })).status).toBe(401);
    const res = await fetch(`${basis}/fhir-r4/v1/Patient/${PASIEN}`, { headers: { Authorization: 'Bearer palsu' } });
    expect(res.status).toBe(401);
  });
});

describe('baca dan cari', () => {
  it('baca Patient per id dan Practitioner', async () => {
    const p = await fhir('GET', `/Patient/${PASIEN}`);
    expect(p.status).toBe(200);
    expect(p.body.resourceType).toBe('Patient');
    expect((await fhir('GET', `/Practitioner/${NAKES}`)).body.name[0].text).toBe('dr. Contoh Satu');
  });

  it('id tidak ada memberi 404 OperationOutcome', async () => {
    const r = await fhir('GET', '/Patient/tidak-ada');
    expect(r.status).toBe(404);
    expect(r.body.resourceType).toBe('OperationOutcome');
  });

  it('cari menurut NIK memberi Bundle searchset', async () => {
    const r = await fhir('GET', '/Patient?identifier=https://fhir.kemkes.go.id/id/nik|9999000000000001');
    expect(r.body).toMatchObject({ resourceType: 'Bundle', type: 'searchset', total: 1 });
    expect(r.body.entry[0].resource.id).toBe(PASIEN);
  });

  it('NIK tidak ada memberi total 0 tanpa entry', async () => {
    const r = await fhir('GET', '/Patient?identifier=https://fhir.kemkes.go.id/id/nik|1111111111111111');
    expect(r.body.total).toBe(0);
    expect(r.body.entry).toBeUndefined();
  });

  it('pencarian tanpa parameter ditolak', async () => {
    expect((await fhir('GET', '/Patient')).status).toBe(400);
  });
});

describe('buat Patient', () => {
  const baru = (nik) => ({
    resourceType: 'Patient',
    meta: { profile: ['https://fhir.kemkes.go.id/r4/StructureDefinition/Patient'] },
    identifier: [{ use: 'official', system: 'https://fhir.kemkes.go.id/id/nik', value: nik }],
    name: [{ use: 'official', text: 'Pasien Baru' }],
    telecom: [{ system: 'phone', value: '0812', use: 'mobile' }],
    gender: 'female',
    birthDate: '2000-01-01',
    address: [{ use: 'home', line: ['Jl. X'], city: 'Bandung', country: 'ID' }],
    multipleBirthInteger: 0,
  });

  it('mengembalikan {success, data.patient_id} lalu dapat dicari', async () => {
    const r = await fhir('POST', '/Patient', baru('3273010101000001'));
    expect(r.status).toBe(201);
    expect(r.body.success).toBe(true);
    const id = r.body.data.patient_id;
    expect(id).toMatch(/^P\d{11}$/);
    expect((await fhir('GET', `/Patient/${id}`)).body.name[0].text).toBe('Pasien Baru');
    expect((await fhir('POST', '/Patient', baru('3273010101000001'))).status).toBe(400);
  });

  it('menolak NIK bukan 16 digit dan field wajib kosong', async () => {
    const buruk = await fhir('POST', '/Patient', baru('123'));
    expect(buruk.body.issue[0].details.text).toMatch(/16 digit/);
    const kosong = await fhir('POST', '/Patient', { resourceType: 'Patient' });
    expect(kosong.body.issue.length).toBeGreaterThanOrEqual(4);
  });
});

describe('Encounter dan Condition tunggal', () => {
  it('membuat Encounter dengan id dan meta, bisa dibaca, dan diubah lewat PUT', async () => {
    const r = await fhir('POST', '/Encounter', encounterBaku());
    expect(r.status).toBe(201);
    expect(r.body.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(r.body.meta.versionId).toBe('1');
    const put = await fhir('PUT', `/Encounter/${r.body.id}`, { ...r.body, status: 'cancelled' });
    expect(put.status).toBe(200);
    expect(put.body.status).toBe('cancelled');
    expect(put.body.meta.versionId).toBe('2');
    expect((await fhir('PUT', `/Encounter/${r.body.id}`, { ...r.body, id: 'lain' })).status).toBe(400);
    expect((await fhir('PUT', '/Encounter/tidak-ada', { ...r.body, id: 'tidak-ada' })).status).toBe(404);
  });

  it('menolak referensi tak ada, status salah, dan serviceProvider lain', async () => {
    const r = await fhir('POST', '/Encounter', encounterBaku({
      status: 'selesai',
      subject: { reference: 'Patient/tidak-ada' },
      serviceProvider: { reference: 'Organization/lain' },
    }));
    const pesan = r.body.issue.map((i) => i.details.text).join(' | ');
    expect(r.status).toBe(400);
    expect(pesan).toMatch(/status selesai/);
    expect(pesan).toMatch(/Patient\/tidak-ada tidak ditemukan/);
    expect(pesan).toMatch(/serviceProvider/);
  });

  it('Condition menolak kode ICD-10 asing dan Encounter tak ada', async () => {
    const e = await fhir('POST', '/Encounter', encounterBaku());
    const bagus = await fhir('POST', '/Condition', conditionBaku(`Encounter/${e.body.id}`));
    expect(bagus.status).toBe(201);
    const asing = await fhir('POST', '/Condition', conditionBaku(`Encounter/${e.body.id}`, 'ZZZ99'));
    expect(asing.body.issue[0].details.text).toMatch(/ZZZ99/);
    const tanpaE = await fhir('POST', '/Condition', conditionBaku('Encounter/tidak-ada'));
    expect(tanpaE.body.issue[0].code).toBe('not-found');
  });

  it('resourceType pada badan harus sama dengan jalur', async () => {
    expect((await fhir('POST', '/Condition', encounterBaku())).status).toBe(400);
  });
});

describe('Bundle transaksi', () => {
  const bundel = (kode = 'A01.0') => {
    const e = 'e0c4a4a2-3b6c-4d9a-8f3b-111111111111';
    const c = 'c0c4a4a2-3b6c-4d9a-8f3b-222222222222';
    const enc = encounterBaku({ diagnosis: [{ condition: { reference: `urn:uuid:${c}`, display: 'Typhoid fever' }, use: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/diagnosis-role', code: 'DD', display: 'Discharge diagnosis' }] }, rank: 1 }] });
    return {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [
        { fullUrl: `urn:uuid:${e}`, resource: enc, request: { method: 'POST', url: 'Encounter' } },
        { fullUrl: `urn:uuid:${c}`, resource: conditionBaku(`urn:uuid:${e}`, kode), request: { method: 'POST', url: 'Condition' } },
      ],
    };
  };

  it('menyimpan Encounter dan Condition dan mengganti urn:uuid dengan id nyata', async () => {
    const r = await fhir('POST', '/', bundel());
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ resourceType: 'Bundle', type: 'transaction-response' });
    expect(r.body.entry).toHaveLength(2);
    expect(r.body.entry[0].response.status).toBe('201 Created');
    const [, encId] = /Encounter\/([^/]+)\/_history/.exec(r.body.entry[0].response.location);
    const [, condId] = /Condition\/([^/]+)\/_history/.exec(r.body.entry[1].response.location);
    const enc = (await fhir('GET', `/Encounter/${encId}`)).body;
    const cond = (await fhir('GET', `/Condition/${condId}`)).body;
    expect(enc.diagnosis[0].condition.reference).toBe(`Condition/${condId}`);
    expect(cond.encounter.reference).toBe(`Encounter/${encId}`);
    const cariCondition = await fhir('GET', `/Condition?encounter=${encId}`);
    expect(cariCondition.body.total).toBe(1);
  });

  it('semua atau tidak sama sekali: entri rusak membatalkan seluruh Bundle', async () => {
    const sebelum = (await fhir('GET', `/Encounter?subject=${PASIEN}`)).body.total;
    const r = await fhir('POST', '/', bundel('ZZZ99'));
    expect(r.status).toBe(400);
    expect(r.body.issue[0].details.text).toMatch(/^entry\[1\]/);
    expect((await fhir('GET', `/Encounter?subject=${PASIEN}`)).body.total).toBe(sebelum);
  });

  it('menolak Bundle bukan transaction atau method bukan POST', async () => {
    expect((await fhir('POST', '/', { resourceType: 'Bundle', type: 'collection', entry: [] })).status).toBe(400);
    const b = bundel();
    b.entry[0].request.method = 'PUT';
    expect((await fhir('POST', '/', b)).status).toBe(400);
  });
});

describe('resource klinis lain', () => {
  let enc;
  beforeAll(async () => {
    enc = (await fhir('POST', '/Encounter', encounterBaku())).body.id;
  });
  const ref = (tipe, id) => ({ reference: `${tipe}/${id}` });

  it('Observation tanda vital: kode LOINC divalidasi', async () => {
    const obs = (kode) => ({
      resourceType: 'Observation', status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }] }],
      code: { coding: [{ system: 'http://loinc.org', code: kode, display: 'x' }] },
      subject: ref('Patient', PASIEN), encounter: ref('Encounter', enc),
      valueQuantity: { value: 120, unit: 'mm[Hg]', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' },
    });
    expect((await fhir('POST', '/Observation', obs('8480-6'))).status).toBe(201);
    expect((await fhir('POST', '/Observation', obs('0000-0'))).status).toBe(400);
  });

  it('Procedure memeriksa ICD-9-CM', async () => {
    const prc = (kode) => ({
      resourceType: 'Procedure', status: 'completed',
      code: { coding: [{ system: 'http://hl7.org/fhir/sid/icd-9-cm', code: kode, display: 'x' }] },
      subject: ref('Patient', PASIEN), encounter: ref('Encounter', enc),
    });
    expect((await fhir('POST', '/Procedure', prc('89.03'))).status).toBe(201);
    expect((await fhir('POST', '/Procedure', prc('00.00.00'))).status).toBe(400);
  });

  it('Medication, MedicationRequest, MedicationDispense saling merujuk', async () => {
    const med = await fhir('POST', '/Medication', {
      resourceType: 'Medication',
      code: { coding: [{ system: 'http://sys-ids.kemkes.go.id/kfa', code: '93000108', display: 'Gemcitabine' }] },
      status: 'active',
    });
    expect(med.status).toBe(201);
    expect((await fhir('POST', '/Medication', { resourceType: 'Medication', code: { coding: [{ system: 'http://sys-ids.kemkes.go.id/kfa', code: '93999999' }] } })).status).toBe(400);
    const req = await fhir('POST', '/MedicationRequest', {
      resourceType: 'MedicationRequest', status: 'completed', intent: 'order',
      medicationReference: ref('Medication', med.body.id), subject: ref('Patient', PASIEN), encounter: ref('Encounter', enc), requester: ref('Practitioner', NAKES),
    });
    expect(req.status).toBe(201);
    const disp = await fhir('POST', '/MedicationDispense', {
      resourceType: 'MedicationDispense', status: 'completed',
      medicationReference: ref('Medication', med.body.id), subject: ref('Patient', PASIEN), context: ref('Encounter', enc),
    });
    expect(disp.status).toBe(201);
  });

  it('ServiceRequest, Specimen, DiagnosticReport', async () => {
    expect((await fhir('POST', '/ServiceRequest', { resourceType: 'ServiceRequest', status: 'active', intent: 'original-order', code: { coding: [{ system: 'http://loinc.org', code: '2345-7' }] }, subject: ref('Patient', PASIEN), encounter: ref('Encounter', enc) })).status).toBe(201);
    expect((await fhir('POST', '/Specimen', { resourceType: 'Specimen', status: 'available', subject: ref('Patient', PASIEN) })).status).toBe(201);
    expect((await fhir('POST', '/DiagnosticReport', { resourceType: 'DiagnosticReport', status: 'final', code: { coding: [{ system: 'http://loinc.org', code: '2345-7' }] }, subject: ref('Patient', PASIEN), encounter: ref('Encounter', enc) })).status).toBe(201);
  });

  it('resourceType yang tidak didukung ditolak', async () => {
    expect((await fhir('POST', '/Bukan', { resourceType: 'Bukan' })).status).toBe(400);
    expect((await fhir('GET', '/Bukan?_id=1')).status).toBe(404);
  });
});

describe('KFA v2', () => {
  const kfa = async (jalur) => (await fetch(`${basis}/kfa-v2/${jalur}`, { headers: { Authorization: `Bearer ${token}` } })).json();

  it('detail produk menurut kode KFA', async () => {
    const b = await kfa('products?identifier=kfa&code=93000108');
    expect(b.result.kfa_code).toBe('93000108');
    expect(b.result.name).toMatch(/Gemcitabine/);
  });

  it('kode tidak ada memberi result null', async () => {
    expect((await kfa('products?identifier=kfa&code=00000000')).result).toBeNull();
  });

  it('daftar produk dengan halaman dan kata kunci', async () => {
    const b = await kfa('products/all?page=1&size=3&keyword=gemcitabine');
    expect(b.total).toBeGreaterThan(0);
    expect(b.items.data.length).toBeLessThanOrEqual(3);
    expect(b.items.data.every((p) => /gemcitabine/i.test(p.name))).toBe(true);
  });

  it('butuh token', async () => {
    expect((await fetch(`${basis}/kfa-v2/products/all`)).status).toBe(401);
  });
});

describe('KYC generate-url', () => {
  const kyc = (teks, pakaiToken = true) =>
    fetch(`${basis}/kyc/v1/generate-url`, { method: 'POST', headers: { 'Content-Type': 'text/plain', ...(pakaiToken ? { Authorization: `Bearer ${token}` } : {}) }, body: teks });

  it('enkripsi RSA+AES-GCM bolak-balik antara klien dan server', async () => {
    const klien = generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
    const pesan = enkripsiKyc(JSON.stringify({ agent_name: 'Petugas Contoh', agent_nik: '3201010101800001', public_key: klien.publicKey }), app.kunciPublikKyc);
    expect(pesan.startsWith('-----BEGIN ENCRYPTED MESSAGE-----\r\n')).toBe(true);
    const res = await kyc(pesan);
    expect(res.status).toBe(200);
    const isi = JSON.parse(dekripsiKyc(await res.text(), klien.privateKey));
    expect(isi.success).toBe(true);
    expect(isi.data.url).toMatch(/^https:\/\/dummy\.satusehat\.invalid\/kyc\/validasi\//);
  });

  it('NIK agen salah memberi success=false terenkripsi', async () => {
    const klien = generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
    const res = await kyc(enkripsiKyc(JSON.stringify({ agent_name: 'A', agent_nik: '1', public_key: klien.publicKey }), app.kunciPublikKyc));
    expect(res.status).toBe(400);
    expect(JSON.parse(dekripsiKyc(await res.text(), klien.privateKey)).success).toBe(false);
  });

  it('pesan rusak ditolak dan token wajib', async () => {
    expect((await kyc('bukan pesan terenkripsi')).status).toBe(400);
    expect((await kyc('x', false)).status).toBe(401);
  });

  it('kunci publik server tersedia untuk klien', async () => {
    const res = await fetch(`${basis}/kyc/v1/public-key`);
    expect(await res.text()).toMatch(/BEGIN PUBLIC KEY/);
  });
});
