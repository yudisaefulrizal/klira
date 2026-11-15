// Server tiruan SATUSEHAT: OAuth2, FHIR R4, KFA v2, KYC.
// Bentuk request mengikuti satusehat-integration ([repo]); respons sukses mengikuti FHIR standar ([dugaan]).
import { constants, createCipheriv, createDecipheriv, generateKeyPairSync, privateDecrypt, publicEncrypt, randomBytes, randomUUID } from 'node:crypto';
import express from 'express';
import { ICD10, ICD9CM, KFA, KFA_PER_KODE, LOINC, isiAwal } from './satusehat-data.js';

export const KONFIG_SATUSEHAT_BAWAAN = {
  clientId: 'dummy-client-id',
  clientSecret: 'dummy-client-secret',
  organizationId: '2a3b4c5d-0000-4000-8000-000000000001',
  masaTokenDetik: 3599,
};

const NIK = /^\d{16}$/;
const STATUS_ENCOUNTER = ['planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled'];
const KELAS_ENCOUNTER = ['AMB', 'EMER', 'IMP', 'HH', 'TELE', 'VR', 'ACUTE', 'NONAC', 'OBSENC', 'PRENC', 'SS'];
const STATUS_OBSERVATION = ['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error', 'unknown'];
const TIPE_DIKENAL = new Set([
  'Account', 'AllergyIntolerance', 'CarePlan', 'ChargeItem', 'ChargeItemDefinition', 'Claim', 'ClaimResponse', 'ClinicalImpression',
  'Composition', 'Condition', 'Coverage', 'Device', 'DiagnosticReport', 'DocumentReference', 'Encounter', 'EpisodeOfCare',
  'FamilyMemberHistory', 'Goal', 'ImagingStudy', 'Immunization', 'Invoice', 'Location', 'Medication', 'MedicationAdministration',
  'MedicationDispense', 'MedicationRequest', 'MedicationStatement', 'NutritionOrder', 'Observation', 'Organization', 'Patient',
  'Practitioner', 'PractitionerRole', 'Procedure', 'QuestionnaireResponse', 'RelatedPerson', 'RiskAssessment', 'ServiceRequest',
  'Specimen', 'Substance', 'Task',
]);

const sekarang = () => new Date().toISOString();

export function operationOutcome(...isu) {
  return {
    resourceType: 'OperationOutcome',
    issue: isu.map((i) => ({
      severity: 'error',
      code: i.code ?? 'invalid',
      details: { text: i.teks },
      ...(i.ekspresi ? { expression: [i.ekspresi] } : {}),
    })),
  };
}
const isu = (teks, ekspresi, code = 'invalid') => ({ teks, ekspresi, code });

/* ---------- KYC: RSA-OAEP membungkus kunci AES-256-GCM (urutan byte mengikuti KYC.php) ---------- */
const AWAL = '-----BEGIN ENCRYPTED MESSAGE-----';
const AKHIR = '-----END ENCRYPTED MESSAGE-----';
const OAEP = { padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' };

export function bungkusPesan(bytes) {
  const b64 = bytes.toString('base64').match(/.{1,76}/g).join('\r\n');
  return `${AWAL}\r\n${b64}\r\n${AKHIR}`;
}
export function bukaPesan(teks) {
  const isi = teks.replace(AWAL, '').replace(AKHIR, '').replace(/\s+/g, '');
  return Buffer.from(isi, 'base64');
}
export function enkripsiKyc(teks, kunciPublikPem) {
  const aes = randomBytes(32);
  const nonce = randomBytes(12);
  const sandi = createCipheriv('aes-256-gcm', aes, nonce);
  const ct = Buffer.concat([sandi.update(teks, 'utf8'), sandi.final()]);
  const dibungkus = publicEncrypt({ key: kunciPublikPem, ...OAEP }, aes);
  return bungkusPesan(Buffer.concat([dibungkus, nonce, ct, sandi.getAuthTag()]));
}
export function dekripsiKyc(teks, kunciPrivatPem) {
  const bytes = bukaPesan(teks);
  const aes = privateDecrypt({ key: kunciPrivatPem, ...OAEP }, bytes.subarray(0, 256));
  const nonce = bytes.subarray(256, 268);
  const tag = bytes.subarray(bytes.length - 16);
  const ct = bytes.subarray(268, bytes.length - 16);
  const sandi = createDecipheriv('aes-256-gcm', aes, nonce);
  sandi.setAuthTag(tag);
  return Buffer.concat([sandi.update(ct), sandi.final()]).toString('utf8');
}

/* ---------- Validasi per resource ---------- */
function bentukValidator(toko, orgId) {
  const ada = (ref) => {
    if (typeof ref !== 'string') return false;
    const [tipe, id] = ref.split('/');
    return Boolean(tipe && id && toko.get(tipe)?.has(id));
  };
  const rujuk = (obj, jalur, tipe, salah) => {
    const ref = obj?.reference;
    if (!ref) return salah.push(isu(`${jalur} wajib diisi`, jalur, 'required'));
    if (!ref.startsWith(`${tipe}/`)) return salah.push(isu(`${jalur} harus merujuk ${tipe}`, jalur));
    if (!ada(ref)) return salah.push(isu(`${ref} tidak ditemukan`, jalur, 'not-found'));
    return undefined;
  };
  const wajib = (r, medan, salah) => {
    for (const m of medan) if (r[m] === undefined || r[m] === null || (Array.isArray(r[m]) && r[m].length === 0)) salah.push(isu(`${m} wajib diisi`, `${r.resourceType}.${m}`, 'required'));
  };
  const kode = (coding, sistem, peta, jalur, salah) => {
    const c = coding?.coding?.find((x) => x.system === sistem);
    if (!c) return salah.push(isu(`${jalur} harus memuat coding dengan system ${sistem}`, jalur, 'required'));
    if (peta && !peta.has(c.code)) return salah.push(isu(`Kode ${c.code} tidak dikenal pada ${sistem}`, jalur, 'code-invalid'));
    return undefined;
  };

  return {
    Organization(r, s) { wajib(r, ['name'], s); },
    Location(r, s) { wajib(r, ['name'], s); },
    Patient(r, s) {
      wajib(r, ['identifier', 'name', 'telecom', 'address'], s);
      if (r.multipleBirthInteger === undefined && r.multipleBirthBoolean === undefined) s.push(isu('multipleBirth wajib diisi', 'Patient.multipleBirth[x]', 'required'));
      const id = r.identifier?.[0];
      if (id?.system === 'https://fhir.kemkes.go.id/id/nik' && !NIK.test(id.value ?? '')) s.push(isu('NIK harus 16 digit', 'Patient.identifier[0].value'));
    },
    Encounter(r, s) {
      wajib(r, ['status', 'class', 'subject', 'participant', 'location'], s);
      if (r.status && !STATUS_ENCOUNTER.includes(r.status)) s.push(isu(`status ${r.status} tidak sah`, 'Encounter.status'));
      if (r.class && !KELAS_ENCOUNTER.includes(r.class.code)) s.push(isu(`class ${r.class.code} tidak sah`, 'Encounter.class'));
      if (r.subject) rujuk(r.subject, 'Encounter.subject', 'Patient', s);
      (r.participant ?? []).forEach((p, i) => rujuk(p.individual, `Encounter.participant[${i}].individual`, 'Practitioner', s));
      (r.location ?? []).forEach((l, i) => rujuk(l.location, `Encounter.location[${i}].location`, 'Location', s));
      if (r.serviceProvider && r.serviceProvider.reference !== `Organization/${orgId}`) s.push(isu('serviceProvider harus Organization fasyankes ini', 'Encounter.serviceProvider'));
      (r.diagnosis ?? []).forEach((d, i) => rujuk(d.condition, `Encounter.diagnosis[${i}].condition`, 'Condition', s));
    },
    Condition(r, s) {
      wajib(r, ['code', 'subject', 'encounter'], s);
      if (r.code) kode(r.code, 'http://hl7.org/fhir/sid/icd-10', ICD10, 'Condition.code', s);
      if (r.subject) rujuk(r.subject, 'Condition.subject', 'Patient', s);
      if (r.encounter) rujuk(r.encounter, 'Condition.encounter', 'Encounter', s);
    },
    Observation(r, s) {
      wajib(r, ['status', 'category', 'code', 'subject', 'encounter'], s);
      if (r.status && !STATUS_OBSERVATION.includes(r.status)) s.push(isu(`status ${r.status} tidak sah`, 'Observation.status'));
      if (r.code) kode(r.code, 'http://loinc.org', LOINC, 'Observation.code', s);
      if (r.subject) rujuk(r.subject, 'Observation.subject', 'Patient', s);
      if (r.encounter) rujuk(r.encounter, 'Observation.encounter', 'Encounter', s);
    },
    Procedure(r, s) {
      wajib(r, ['status', 'code', 'subject', 'encounter'], s);
      if (r.code) kode(r.code, 'http://hl7.org/fhir/sid/icd-9-cm', ICD9CM, 'Procedure.code', s);
      if (r.subject) rujuk(r.subject, 'Procedure.subject', 'Patient', s);
      if (r.encounter) rujuk(r.encounter, 'Procedure.encounter', 'Encounter', s);
    },
    Medication(r, s) {
      wajib(r, ['code'], s);
      const c = r.code?.coding?.find((x) => x.system === 'http://sys-ids.kemkes.go.id/kfa');
      if (r.code && !c) s.push(isu('code harus memuat coding KFA', 'Medication.code', 'required'));
      else if (c && !/^(91|92|93)\d{6}$/.test(c.code)) s.push(isu(`Kode KFA ${c.code} tidak sah`, 'Medication.code', 'code-invalid'));
      else if (c && c.code.startsWith('93') && !KFA_PER_KODE.has(c.code)) s.push(isu(`Kode KFA ${c.code} tidak ada di katalog`, 'Medication.code', 'code-invalid'));
    },
    MedicationRequest(r, s) {
      wajib(r, ['status', 'intent', 'medicationReference', 'subject', 'encounter', 'requester'], s);
      if (r.medicationReference) rujuk(r.medicationReference, 'MedicationRequest.medicationReference', 'Medication', s);
      if (r.subject) rujuk(r.subject, 'MedicationRequest.subject', 'Patient', s);
      if (r.encounter) rujuk(r.encounter, 'MedicationRequest.encounter', 'Encounter', s);
      if (r.requester) rujuk(r.requester, 'MedicationRequest.requester', 'Practitioner', s);
    },
    MedicationDispense(r, s) {
      wajib(r, ['status', 'medicationReference', 'subject', 'context'], s);
      if (r.medicationReference) rujuk(r.medicationReference, 'MedicationDispense.medicationReference', 'Medication', s);
      if (r.subject) rujuk(r.subject, 'MedicationDispense.subject', 'Patient', s);
      if (r.context) rujuk(r.context, 'MedicationDispense.context', 'Encounter', s);
    },
    ServiceRequest(r, s) {
      wajib(r, ['status', 'intent', 'code', 'subject', 'encounter'], s);
      if (r.subject) rujuk(r.subject, 'ServiceRequest.subject', 'Patient', s);
      if (r.encounter) rujuk(r.encounter, 'ServiceRequest.encounter', 'Encounter', s);
    },
    Specimen(r, s) {
      wajib(r, ['status', 'subject'], s);
      if (r.subject) rujuk(r.subject, 'Specimen.subject', 'Patient', s);
    },
    DiagnosticReport(r, s) {
      wajib(r, ['status', 'code', 'subject', 'encounter'], s);
      if (r.subject) rujuk(r.subject, 'DiagnosticReport.subject', 'Patient', s);
      if (r.encounter) rujuk(r.encounter, 'DiagnosticReport.encounter', 'Encounter', s);
    },
    AllergyIntolerance(r, s) {
      wajib(r, ['code', 'patient', 'encounter'], s);
      if (r.patient) rujuk(r.patient, 'AllergyIntolerance.patient', 'Patient', s);
      if (r.encounter) rujuk(r.encounter, 'AllergyIntolerance.encounter', 'Encounter', s);
    },
  };
}

/** Ganti semua `reference` bertipe urn:uuid memakai pemetaan, di seluruh pohon. */
function tulisUlangReferensi(node, peta) {
  if (Array.isArray(node)) return node.forEach((n) => tulisUlangReferensi(n, peta));
  if (node && typeof node === 'object') {
    if (typeof node.reference === 'string' && node.reference.startsWith('urn:uuid:')) {
      const target = peta.get(node.reference);
      if (target) node.reference = target;
    }
    Object.values(node).forEach((v) => tulisUlangReferensi(v, peta));
  }
  return undefined;
}

function cari(toko, tipe, q) {
  let hasil = [...(toko.get(tipe)?.values() ?? [])];
  if (q.identifier) {
    const [sistem, nilai] = String(q.identifier).split('|');
    hasil = hasil.filter((r) => (r.identifier ?? []).some((i) => i.value === nilai && (!nilai || !sistem || i.system === sistem)));
  }
  if (q._id) hasil = hasil.filter((r) => r.id === q._id);
  if (q.name) hasil = hasil.filter((r) => JSON.stringify(r.name ?? '').toLowerCase().includes(String(q.name).toLowerCase()));
  for (const param of ['subject', 'patient', 'encounter']) {
    if (q[param]) {
      const nilai = String(q[param]);
      hasil = hasil.filter((r) => {
        const ref = r[param]?.reference;
        return ref === nilai || ref?.endsWith(`/${nilai}`);
      });
    }
  }
  return hasil;
}

export function buatAplikasiSatusehat(konfigSebagian = {}) {
  const k = { ...KONFIG_SATUSEHAT_BAWAAN, ...konfigSebagian };
  const toko = isiAwal(k.organizationId);
  const token = new Map();
  const kunci = generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
  const validator = bentukValidator(toko, k.organizationId);
  const app = express();

  const perluToken = (req, res, lanjut) => {
    const m = /^Bearer (.+)$/.exec(req.get('authorization') ?? '');
    const kedaluwarsa = m ? token.get(m[1]) : undefined;
    if (!m || kedaluwarsa === undefined) return res.status(401).json(operationOutcome(isu('Unauthorized: token tidak sah', undefined, 'login')));
    if (kedaluwarsa < Date.now()) return res.status(401).json(operationOutcome(isu('Unauthorized: token kedaluwarsa', undefined, 'login')));
    return lanjut();
  };

  /* ----- Token ----- */
  app.post('/oauth2/v1/accesstoken', express.urlencoded({ extended: false }), (req, res) => {
    if (req.query.grant_type !== 'client_credentials') return res.status(400).json(operationOutcome(isu('grant_type harus client_credentials')));
    if (req.body?.client_id !== k.clientId || req.body?.client_secret !== k.clientSecret) {
      return res.status(401).json(operationOutcome(isu('Invalid client id or secret', undefined, 'processing')));
    }
    const nilai = randomBytes(24).toString('hex');
    token.set(nilai, Date.now() + k.masaTokenDetik * 1000);
    return res.json({
      refresh_token_expires_in: '0',
      api_product_list: '[satusehat-dummy]',
      api_product_list_json: ['satusehat-dummy'],
      organization_name: 'dummy',
      'developer.email': 'dummy@example.invalid',
      token_type: 'BearerToken',
      issued_at: String(Date.now()),
      client_id: k.clientId,
      access_token: nilai,
      application_name: 'dummy',
      scope: '',
      expires_in: String(k.masaTokenDetik),
      refresh_count: '0',
      status: 'approved',
    });
  });

  /* ----- FHIR ----- */
  const fhir = express.Router();
  fhir.use(perluToken);
  fhir.use(express.json({ type: ['application/json', 'application/fhir+json'], limit: '5mb' }));

  function simpan(r) {
    if (!toko.has(r.resourceType)) toko.set(r.resourceType, new Map());
    toko.get(r.resourceType).set(r.id, r);
  }
  function kumpulIsu(r) {
    const salah = [];
    if (!r || typeof r !== 'object') return [isu('Badan harus berupa resource FHIR')];
    if (!TIPE_DIKENAL.has(r.resourceType)) return [isu(`resourceType ${r.resourceType} tidak didukung`, 'resourceType')];
    validator[r.resourceType]?.(r, salah);
    return salah;
  }
  const baru = (r) => ({ ...r, id: randomUUID(), meta: { versionId: '1', lastUpdated: sekarang(), ...(r.meta ?? {}) } });

  // Bundle transaksi ke akar FHIR.
  fhir.post('/', (req, res) => {
    const b = req.body;
    if (b?.resourceType !== 'Bundle' || b.type !== 'transaction') return res.status(400).json(operationOutcome(isu('Hanya Bundle type transaction yang diterima', 'Bundle.type')));
    const entri = b.entry ?? [];
    if (entri.length === 0) return res.status(400).json(operationOutcome(isu('Bundle kosong', 'Bundle.entry', 'required')));
    const peta = new Map();
    const dibuat = entri.map((e) => {
      const r = e.resource;
      const bentuk = baru(r ?? {});
      if (e.fullUrl) peta.set(e.fullUrl, `${bentuk.resourceType}/${bentuk.id}`);
      return { e, bentuk };
    });
    dibuat.forEach(({ bentuk }) => tulisUlangReferensi(bentuk, peta));
    // Masukkan dulu ke toko sementara agar referensi maju (Encounter -> Condition) sah.
    const sebelum = new Map([...toko].map(([t, m]) => [t, new Map(m)]));
    dibuat.forEach(({ bentuk }) => simpan(bentuk));
    const semuaIsu = [];
    dibuat.forEach(({ e, bentuk }, i) => {
      if (e.request?.method !== 'POST') semuaIsu.push(isu('request.method harus POST', `Bundle.entry[${i}].request.method`, 'required'));
      kumpulIsu(bentuk).forEach((x) => semuaIsu.push({ ...x, teks: `entry[${i}]: ${x.teks}` }));
    });
    if (semuaIsu.length) {
      toko.clear();
      sebelum.forEach((m, t) => toko.set(t, m));
      return res.status(400).json(operationOutcome(...semuaIsu));
    }
    return res.status(200).json({
      resourceType: 'Bundle',
      type: 'transaction-response',
      link: [{ relation: 'self', url: `${req.protocol}://${req.get('host')}${req.baseUrl}` }],
      entry: dibuat.map(({ bentuk }) => ({
        response: { status: '201 Created', location: `${bentuk.resourceType}/${bentuk.id}/_history/1`, etag: 'W/"1"', lastModified: bentuk.meta.lastUpdated },
      })),
    });
  });

  fhir.get('/:tipe', (req, res) => {
    const { tipe } = req.params;
    if (!TIPE_DIKENAL.has(tipe)) return res.status(404).json(operationOutcome(isu(`Resource ${tipe} tidak didukung`, undefined, 'not-supported')));
    if (Object.keys(req.query).length === 0) return res.status(400).json(operationOutcome(isu('Parameter pencarian wajib', undefined, 'required')));
    const hasil = cari(toko, tipe, req.query);
    return res.json({
      resourceType: 'Bundle',
      type: 'searchset',
      total: hasil.length,
      ...(hasil.length ? { entry: hasil.map((r) => ({ fullUrl: `${req.protocol}://${req.get('host')}${req.baseUrl}/${tipe}/${r.id}`, resource: r, search: { mode: 'match' } })) } : {}),
    });
  });

  fhir.get('/:tipe/:id', (req, res) => {
    const r = toko.get(req.params.tipe)?.get(req.params.id);
    if (!r) return res.status(404).json(operationOutcome(isu(`${req.params.tipe}/${req.params.id} tidak ditemukan`, undefined, 'not-found')));
    return res.json(r);
  });

  fhir.post('/:tipe', (req, res) => {
    const { tipe } = req.params;
    const body = req.body;
    if (body?.resourceType !== tipe) return res.status(400).json(operationOutcome(isu(`resourceType harus ${tipe}`, 'resourceType')));
    const salah = kumpulIsu(body);
    if (salah.length) return res.status(400).json(operationOutcome(...salah));
    if (tipe === 'Patient') {
      const id = body.identifier[0];
      if (id.system === 'https://fhir.kemkes.go.id/id/nik' && cari(toko, 'Patient', { identifier: `${id.system}|${id.value}` }).length) {
        return res.status(400).json(operationOutcome(isu('Patient dengan NIK ini sudah ada', 'Patient.identifier[0]', 'duplicate')));
      }
      const pasien = { ...baru(body), id: `P${String(Math.floor(Math.random() * 1e11)).padStart(11, '0')}` };
      simpan(pasien);
      const bentuk = { success: true, data: { patient_id: pasien.id } };
      return res.status(201).json(id.system.endsWith('/nik-ibu') ? { create_patient: bentuk } : bentuk);
    }
    const r = baru(body);
    simpan(r);
    return res.status(201).json(r);
  });

  fhir.put('/:tipe/:id', (req, res) => {
    const { tipe, id } = req.params;
    const lama = toko.get(tipe)?.get(id);
    if (!lama) return res.status(404).json(operationOutcome(isu(`${tipe}/${id} tidak ditemukan`, undefined, 'not-found')));
    if (req.body?.resourceType !== tipe || req.body.id !== id) return res.status(400).json(operationOutcome(isu('id pada badan harus sama dengan id pada jalur', 'id')));
    const salah = kumpulIsu(req.body);
    if (salah.length) return res.status(400).json(operationOutcome(...salah));
    const versi = String(Number(lama.meta?.versionId ?? '1') + 1);
    const r = { ...req.body, meta: { ...(req.body.meta ?? {}), versionId: versi, lastUpdated: sekarang() } };
    simpan(r);
    return res.json(r);
  });
  app.use('/fhir-r4/v1', fhir);

  /* ----- KFA v2 ([dugaan] bentuk respons) ----- */
  const bentukKfa = (p) => ({ kfa_code: p.kode, name: p.nama, dosage_form: { name: p.bentuk_sediaan }, uom: { name: p.satuan }, active: p.status === 'aktif' });
  app.get('/kfa-v2/products', perluToken, (req, res) => {
    const { identifier, code } = req.query;
    if (identifier !== 'kfa' || !code) return res.status(400).json(operationOutcome(isu('identifier=kfa dan code wajib (nie dan lkpp belum didukung)')));
    const p = KFA_PER_KODE.get(String(code));
    return res.json(p ? { message: 'Product found', result: bentukKfa(p) } : { message: 'Product not found', result: null });
  });
  app.get('/kfa-v2/products/all', perluToken, (req, res) => {
    const halaman = Math.max(1, Number(req.query.page) || 1);
    const ukuran = Math.min(100, Math.max(1, Number(req.query.size) || 10));
    const kw = String(req.query.keyword ?? '').toLowerCase();
    const cocok = kw ? KFA.filter((p) => p.nama.toLowerCase().includes(kw)) : KFA;
    const data = cocok.slice((halaman - 1) * ukuran, halaman * ukuran).map(bentukKfa);
    return res.json({ page: halaman, size: ukuran, total: cocok.length, items: { data } });
  });

  /* ----- KYC ----- */
  app.get('/kyc/v1/public-key', (_req, res) => res.type('text/plain').send(kunci.publicKey));
  app.post('/kyc/v1/generate-url', perluToken, express.text({ type: '*/*' }), (req, res) => {
    let isi;
    try {
      isi = JSON.parse(dekripsiKyc(req.body, kunci.privateKey));
    } catch {
      return res.status(400).type('text/plain').send('Pesan terenkripsi tidak dapat dibuka');
    }
    if (!isi.agent_name || !NIK.test(isi.agent_nik ?? '') || !isi.public_key) {
      return res.status(400).type('text/plain').send(enkripsiKyc(JSON.stringify({ success: false, message: 'agent_name, agent_nik (16 digit), public_key wajib' }), isi.public_key ?? kunci.publicKey));
    }
    const url = `https://dummy.satusehat.invalid/kyc/validasi/${randomUUID()}`;
    return res.type('text/plain').send(enkripsiKyc(JSON.stringify({ success: true, data: { url } }), isi.public_key));
  });

  app.use((_req, res) => res.status(404).json(operationOutcome(isu('Jalur tidak ditemukan', undefined, 'not-found'))));
  app.toko = toko;
  app.konfig = k;
  app.kunciPublikKyc = kunci.publicKey;
  return app;
}
