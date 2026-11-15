// Data awal SATUSEHAT tiruan. Pengenal pasien dan NIK Practitioner sandbox diambil dari
// OAuth2Client.php (patient_dev, practitioner_dev); NIK dan nama sengaja fiktif.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dataApi = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'apps', 'api', 'data');
const baca = (nama) => JSON.parse(readFileSync(join(dataApi, nama), 'utf8'));

export const ICD10 = new Map(baca('icd10-2010.json').kode.map((d) => [d.kode, d.nama]));
export const ICD9CM = new Map(baca('icd9cm-2010.json').kode.map((d) => [d.kode, d.nama]));
export const KFA = baca('kfa.json').produk;
export const KFA_PER_KODE = new Map(KFA.map((p) => [p.kode, p]));
const loinc = baca('loinc.json');
// loinc.json menyimpan baris berbentuk [kode, nama, kelas, urut].
export const LOINC = new Map(loinc.kode.map((r) => [r[0], r[1]]));
// Kode tanda vital dari Observation.php; tidak ada di loinc.json karena berkas itu hanya memuat kelas laboratorium.
for (const [kode, nama] of [
  ['8480-6', 'Systolic blood pressure'],
  ['8462-4', 'Diastolic blood pressure'],
  ['8867-4', 'Heart rate'],
  ['8310-5', 'Body temperature'],
  ['9279-1', 'Respiratory rate'],
]) LOINC.set(kode, nama);

export const ID_PASIEN = ['P02478375538', 'P02428473601', 'P03647103112', 'P01058967035', 'P01836748436', 'P01654557057', 'P00805884304', 'P00883356749', 'P00912894463'];
export const ID_NAKES = ['10009880728', '10006926841', '10001354453', '10010910332', '10018180913', '10002074224', '10012572188', '10018452434', '10014058550', '10001915884'];

const nama = ['Budi Contoh', 'Siti Contoh', 'Agus Contoh', 'Dewi Contoh', 'Eko Contoh', 'Fitri Contoh', 'Gita Contoh', 'Hadi Contoh', 'Indah Contoh'];
const namaNakes = ['dr. Contoh Satu', 'dr. Contoh Dua', 'drg. Contoh Tiga', 'dr. Contoh Empat', 'dr. Contoh Lima', 'dr. Contoh Enam', 'dr. Contoh Tujuh', 'dr. Contoh Delapan', 'dr. Contoh Sembilan', 'dr. Contoh Sepuluh'];

export const buatPasien = (id, nik, nm, gender = 'male', lahir = '1990-01-01') => ({
  resourceType: 'Patient',
  id,
  meta: { profile: ['https://fhir.kemkes.go.id/r4/StructureDefinition/Patient'] },
  identifier: [{ use: 'official', system: 'https://fhir.kemkes.go.id/id/nik', value: nik }],
  active: true,
  name: [{ use: 'official', text: nm }],
  gender,
  birthDate: lahir,
  deceasedBoolean: false,
  telecom: [{ system: 'phone', value: '081200000000', use: 'mobile' }],
  address: [{ use: 'home', line: ['Jl. Contoh No. 1'], city: 'Jakarta', country: 'ID' }],
  multipleBirthInteger: 0,
});

export const buatNakes = (id, nik, nm, gender = 'male') => ({
  resourceType: 'Practitioner',
  id,
  identifier: [
    { use: 'official', system: 'https://fhir.kemkes.go.id/id/nik', value: nik },
    { use: 'official', system: 'https://fhir.kemkes.go.id/id/nakes-his-number', value: `HIS-${id}` },
  ],
  active: true,
  name: [{ use: 'official', text: nm }],
  gender,
  birthDate: '1980-01-01',
  address: [{ use: 'home', line: ['Jl. Dokter No. 1'], city: 'Jakarta', country: 'ID' }],
  qualification: [{ code: { coding: [{ system: 'http://terminology.kemkes.go.id/CodeSystem/clinical-speciality', code: 'STR-DUMMY', display: 'Dokter umum' }] } }],
});

/** Isi awal: pasien, nakes, Organization fasyankes, satu Location. */
export function isiAwal(organizationId) {
  const toko = new Map();
  const taruh = (r) => {
    if (!toko.has(r.resourceType)) toko.set(r.resourceType, new Map());
    toko.get(r.resourceType).set(r.id, r);
  };
  ID_PASIEN.forEach((id, i) => taruh(buatPasien(id, `9999${String(i + 1).padStart(12, '0')}`, nama[i], i % 2 ? 'female' : 'male')));
  ID_NAKES.forEach((id, i) => taruh(buatNakes(id, `8888${String(i + 1).padStart(12, '0')}`, namaNakes[i], i % 2 ? 'female' : 'male')));
  taruh({
    resourceType: 'Organization',
    id: organizationId,
    identifier: [{ use: 'official', system: `http://sys-ids.kemkes.go.id/organization/${organizationId}`, value: 'KLINIK-CONTOH' }],
    active: true,
    type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/organization-type', code: 'prov', display: 'Healthcare Provider' }] }],
    name: 'Klinik Pratama Contoh',
  });
  taruh({
    resourceType: 'Location',
    id: 'b017aa54-f1df-4ec2-9d84-8823815d7228',
    identifier: [{ system: `http://sys-ids.kemkes.go.id/location/${organizationId}`, value: 'R-POLI-UMUM' }],
    status: 'active',
    name: 'Poli Umum',
    mode: 'instance',
    managingOrganization: { reference: `Organization/${organizationId}` },
  });
  return toko;
}
