// Data awal SATUSEHAT tiruan. Pengenal pasien dan NIK Practitioner sandbox diambil dari
// OAuth2Client.php (patient_dev, practitioner_dev); NIK dan nama sengaja fiktif.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { daftarPasienNyata } from '../../skrip/data-referensi/pasien-nyata.js';

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

const PASIEN_DEMO = [
  ['P32730100001', '3273015501800101', 'Siti Aminah', 'female', '1980-01-15'],
  ['P32730100002', '3273011006750102', 'Bambang Supriyadi', 'male', '1975-06-10'],
  ['P32730100003', '3273016203920103', 'Nur Halimah', 'female', '1992-03-22'],
  ['P32730100004', '3273010911880104', 'Yohanes Saputra', 'male', '1988-11-09'],
  ['P32730100005', '3273014408600105', 'Ratna Sari Dewi', 'female', '1960-08-04'],
  ['P32730100006', '3273012512010106', 'Rizky Ramadhan', 'male', '2001-12-25'],
  ['P32730100007', '3273015707950107', 'Putu Ayu Lestari', 'female', '1995-07-17'],
  ['P32730100008', '3273010302680108', 'Hasan Basri', 'male', '1968-02-03'],
  ['P32730100009', '3273014110990109', 'Melati Kusuma', 'female', '1999-10-01'],
  ['P32730100010', '3273011504830110', 'Teguh Wibowo', 'male', '1983-04-15'],
  ['P32730100011', '3273016612970111', 'Anisa Fitriani', 'female', '1997-12-26'],
  ['P32730100012', '3273010707550112', 'Darmawan Hadi', 'male', '1955-07-07'],
  ['P32730100013', '3273010505200113', 'Kevin Pratama', 'male', '2020-05-05'],
];

const NAKES_DEMO = [
  ['N32730100001', '3273011203850001', 'dr. Ahmad', 'male'],
  ['N32730100002', '3273014507880002', 'drg. Mahmud', 'male'],
  ['N32730100003', '3273016108920003', 'Ns. Rina', 'female'],
  ['N32730100004', '3273015203900004', 'Bd. Dewi', 'female'],
];

/** Isi awal: pasien, nakes, Organization fasyankes, satu Location. */
export function isiAwal(organizationId) {
  const toko = new Map();
  const taruh = (r) => {
    if (!toko.has(r.resourceType)) toko.set(r.resourceType, new Map());
    toko.get(r.resourceType).set(r.id, r);
  };
  ID_PASIEN.forEach((id, i) => taruh(buatPasien(id, `9999${String(i + 1).padStart(12, '0')}`, nama[i], i % 2 ? 'female' : 'male')));
  ID_NAKES.forEach((id, i) => taruh(buatNakes(id, `8888${String(i + 1).padStart(12, '0')}`, namaNakes[i], i % 2 ? 'female' : 'male')));
  for (const [id, nik, nm, gender, lahir] of PASIEN_DEMO)
    taruh(buatPasien(id, nik, nm, gender, lahir));
  for (const p of daftarPasienNyata(1000))
    taruh(buatPasien(p.ihs_id, p.nik, p.nama, p.gender_fhir, p.tanggal_lahir));
  for (const [id, nik, nm, gender] of NAKES_DEMO)
    taruh(buatNakes(id, nik, nm, gender));
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
