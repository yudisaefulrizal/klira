// Katalog endpoint yang boleh dicoba dari halaman Test endpoint. Server hanya mengirim permintaan yang ada di katalog ini
// (tidak ada alamat bebas), sehingga alat uji tidak bisa dipakai untuk menembak alamat lain. Contoh badan mengikuti
// dummy-intergrasi/ (SATUSEHAT) dan catatan struktur PCare; bagian PCare masih dugaan sampai dicocokkan dengan katalog resmi BPJS.

const ID_PASIEN = 'P02478375538';
const ID_NAKES = '10009880728';
const ID_LOKASI = 'b017aa54-f1df-4ec2-9d84-8823815d7228';
const ORG = '{{organization_id}}';

export const LAYANAN_UJI = ['satusehat', 'pcare'];
export const METODE_UJI = ['GET', 'POST', 'PUT', 'DELETE'];
export const BATAS_PARAMETER = 200;

const TGL = { pola: '^\\d{2}-\\d{2}-\\d{4}$', pesanPola: 'Format dd-MM-yyyy, contoh 14-11-2026.' };
const ANGKA = { pola: '^\\d{1,6}$', pesanPola: 'Harus angka.' };

const p = (nama, label, contoh, ekstra = {}) => ({ nama, label, contoh, wajib: true, ...ekstra });
const e = (id, kelompok, label, metode, jalur, ekstra = {}) => ({ id, kelompok, label, metode, jalur, parameter: [], ...ekstra });

const ss = (id, kelompok, label, metode, jalur, ekstra = {}) => e(`ss-${id}`, kelompok, label, metode, jalur, { layanan: 'satusehat', dasar: 'fhir', ...ekstra });
const pc = (id, kelompok, label, metode, jalur, ekstra = {}) => e(`pc-${id}`, kelompok, label, metode, jalur, { layanan: 'pcare', ...ekstra });
const hal = (jalur, ekstra = {}) => ({ jalur, paginasi: true, ...ekstra });

const kodeNoKartu = p('noKartu', 'Nomor kartu', '0000039043765');
const kodeKunjungan = p('noKunjungan', 'Nomor kunjungan', '0114A0260815Y000003');

const encounterContoh = {
  resourceType: 'Encounter', status: 'finished',
  class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
  subject: { reference: `Patient/${ID_PASIEN}`, display: 'Budi Contoh' },
  participant: [{ type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType', code: 'ATND', display: 'attender' }] }], individual: { reference: `Practitioner/${ID_NAKES}`, display: 'dr. Contoh Satu' } }],
  period: { start: '2026-11-14T08:00:00+07:00', end: '2026-11-14T08:45:00+07:00' },
  location: [{ location: { reference: `Location/${ID_LOKASI}`, display: 'Poli Umum' } }],
  serviceProvider: { reference: `Organization/${ORG}` },
};
const conditionContoh = (encounter) => ({
  resourceType: 'Condition',
  clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active', display: 'Active' }] },
  category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'encounter-diagnosis', display: 'Encounter Diagnosis' }] }],
  code: { coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: 'A01.0', display: 'Typhoid fever' }] },
  subject: { reference: `Patient/${ID_PASIEN}`, display: 'Budi Contoh' },
  encounter: { reference: encounter },
});
const pendaftaranContoh = { kdProviderPeserta: '0114A026', tglDaftar: '14-11-2026', noKartu: '0000039043765', kdPoli: '001', keluhan: 'Demam 3 hari', kunjSakit: true, sistole: 120, diastole: 80, beratBadan: 60, tinggiBadan: 165, respRate: 20, lingkarPerut: 80, heartRate: 80, rujukBalik: 0, kdTkp: '10' };
const kunjunganContoh = { noKunjungan: null, noKartu: '0000039043765', tglDaftar: '14-11-2026', kdPoli: '001', keluhan: 'Demam 3 hari', kdSadar: '01', sistole: 120, diastole: 80, beratBadan: 60, tinggiBadan: 165, respRate: 20, lingkarPerut: 80, heartRate: 80, terapi: 'Istirahat', kdStatusPulang: '4', tglPulang: '14-11-2026', kdDokter: '123123', kdDiag1: 'A01.0', kdDiag2: null, kdDiag3: null, rujukLanjut: null };

export const KATALOG_ENDPOINT = [
  /* ---------- SATUSEHAT ---------- */
  ss('pasien-nik', 'Pasien dan tenaga kesehatan', 'Cari pasien menurut NIK', 'GET', '/Patient', { query: { identifier: 'https://fhir.kemkes.go.id/id/nik|{nik}' }, parameter: [p('nik', 'NIK', '9999000000000001', { pola: '^\\d{16}$', pesanPola: 'NIK harus 16 digit.' })] }),
  ss('pasien-id', 'Pasien dan tenaga kesehatan', 'Baca pasien menurut IHS Number', 'GET', '/Patient/{id}', { parameter: [p('id', 'IHS Number', ID_PASIEN)] }),
  ss('pasien-buat', 'Pasien dan tenaga kesehatan', 'Buat pasien', 'POST', '/Patient', { badan: { resourceType: 'Patient', meta: { profile: ['https://fhir.kemkes.go.id/r4/StructureDefinition/Patient'] }, identifier: [{ use: 'official', system: 'https://fhir.kemkes.go.id/id/nik', value: '3273010101000001' }], name: [{ use: 'official', text: 'Pasien Uji' }], telecom: [{ system: 'phone', value: '081200000000', use: 'mobile' }], gender: 'female', birthDate: '2000-01-01', address: [{ use: 'home', line: ['Jl. Contoh No. 1'], city: 'Bandung', country: 'ID' }], multipleBirthInteger: 0 } }),
  ss('nakes-nik', 'Pasien dan tenaga kesehatan', 'Cari tenaga kesehatan menurut NIK', 'GET', '/Practitioner', { query: { identifier: 'https://fhir.kemkes.go.id/id/nik|{nik}' }, parameter: [p('nik', 'NIK', '8888000000000001', { pola: '^\\d{16}$', pesanPola: 'NIK harus 16 digit.' })] }),
  ss('nakes-id', 'Pasien dan tenaga kesehatan', 'Baca tenaga kesehatan menurut IHS Number', 'GET', '/Practitioner/{id}', { parameter: [p('id', 'IHS Number', ID_NAKES)] }),
  ss('organisasi-id', 'Fasyankes', 'Baca Organization', 'GET', '/Organization/{id}', { parameter: [p('id', 'Organization ID', '{{organization_id}}')] }),
  ss('lokasi-id', 'Fasyankes', 'Baca Location', 'GET', '/Location/{id}', { parameter: [p('id', 'Location ID', ID_LOKASI)] }),
  ss('encounter-id', 'Kunjungan', 'Baca Encounter', 'GET', '/Encounter/{id}', { parameter: [p('id', 'Encounter ID', '')] }),
  ss('encounter-cari', 'Kunjungan', 'Cari Encounter menurut pasien', 'GET', '/Encounter', { query: { subject: '{pasien}' }, parameter: [p('pasien', 'IHS Number pasien', ID_PASIEN)] }),
  ss('encounter-buat', 'Kunjungan', 'Buat Encounter', 'POST', '/Encounter', { badan: encounterContoh }),
  ss('encounter-ubah', 'Kunjungan', 'Ubah Encounter (PUT)', 'PUT', '/Encounter/{id}', { parameter: [p('id', 'Encounter ID', '')], badan: { ...encounterContoh, id: '{id}' } }),
  ss('condition-id', 'Kunjungan', 'Baca Condition', 'GET', '/Condition/{id}', { parameter: [p('id', 'Condition ID', '')] }),
  ss('condition-buat', 'Kunjungan', 'Buat Condition (butuh Encounter yang ada)', 'POST', '/Condition', { badan: conditionContoh('Encounter/ISI-ENCOUNTER-ID') }),
  ss('observation-buat', 'Kunjungan', 'Buat Observation tanda vital (butuh Encounter yang ada)', 'POST', '/Observation', { badan: { resourceType: 'Observation', status: 'final', category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }] }], code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] }, subject: { reference: `Patient/${ID_PASIEN}` }, encounter: { reference: 'Encounter/ISI-ENCOUNTER-ID' }, valueQuantity: { value: 120, unit: 'mm[Hg]', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' } } }),
  ss('bundle-kirim', 'Kunjungan', 'Kirim Bundle transaksi (Encounter dan Condition)', 'POST', '', { badan: { resourceType: 'Bundle', type: 'transaction', entry: [{ fullUrl: 'urn:uuid:e0c4a4a2-3b6c-4d9a-8f3b-aaaaaaaaaaaa', resource: encounterContoh, request: { method: 'POST', url: 'Encounter' } }, { fullUrl: 'urn:uuid:c0c4a4a2-3b6c-4d9a-8f3b-bbbbbbbbbbbb', resource: conditionContoh('urn:uuid:e0c4a4a2-3b6c-4d9a-8f3b-aaaaaaaaaaaa'), request: { method: 'POST', url: 'Condition' } }] } }),
  ss('kfa-kode', 'KFA (katalog obat)', 'Detail produk menurut kode KFA', 'GET', '/products', { dasar: 'kfa', query: { identifier: 'kfa', code: '{kode}' }, parameter: [p('kode', 'Kode KFA', '93000108', { pola: '^\\d{8}$', pesanPola: 'Kode KFA 8 digit.' })] }),
  ss('kfa-cari', 'KFA (katalog obat)', 'Cari produk menurut kata kunci', 'GET', '/products/all', { dasar: 'kfa', query: { page: '{halaman}', size: '{ukuran}', keyword: '{kata}' }, parameter: [p('halaman', 'Halaman', '1', ANGKA), p('ukuran', 'Ukuran', '10', ANGKA), p('kata', 'Kata kunci', 'gemcitabine')] }),

  /* ---------- PCare ---------- */
  pc('peserta-noka', 'Peserta', 'Peserta menurut nomor kartu', 'GET', '/peserta/{noKartu}', { parameter: [kodeNoKartu] }),
  pc('peserta-jenis', 'Peserta', 'Peserta menurut NIK atau noka', 'GET', '/peserta/{jenisKartu}/{nomor}', { parameter: [p('jenisKartu', 'Jenis kartu (nik atau noka)', 'nik', { pola: '^(nik|noka)$', pesanPola: 'Isi nik atau noka.' }), p('nomor', 'Nomor', '3201010101800001')] }),
  pc('daftar-tgl', 'Pendaftaran', 'Pendaftaran provider menurut tanggal', 'GET', '/pendaftaran/tglDaftar/{tgl}', hal('/pendaftaran/tglDaftar/{tgl}', { parameter: [p('tgl', 'Tanggal daftar', '14-11-2026', TGL)] })),
  pc('daftar-nourut', 'Pendaftaran', 'Pendaftaran menurut nomor urut dan tanggal', 'GET', '/pendaftaran/noUrut/{noUrut}/tglDaftar/{tgl}', { parameter: [p('noUrut', 'Nomor urut', '001'), p('tgl', 'Tanggal daftar', '14-11-2026', TGL)] }),
  pc('daftar-peserta', 'Pendaftaran', 'Pendaftaran milik peserta', 'GET', '/pendaftaran/peserta/{noKartu}', { parameter: [kodeNoKartu] }),
  pc('daftar-buat', 'Pendaftaran', 'Daftarkan peserta', 'POST', '/pendaftaran', { badan: pendaftaranContoh }),
  pc('daftar-hapus', 'Pendaftaran', 'Hapus pendaftaran', 'DELETE', '/pendaftaran/peserta/{noKartu}/tglDaftar/{tgl}/noUrut/{noUrut}/kdPoli/{kdPoli}', { parameter: [kodeNoKartu, p('tgl', 'Tanggal daftar', '14-11-2026', TGL), p('noUrut', 'Nomor urut', '001'), p('kdPoli', 'Kode poli', '001')] }),
  pc('kunjungan-riwayat', 'Kunjungan', 'Riwayat kunjungan peserta', 'GET', '/kunjungan/peserta/{noKartu}', { parameter: [kodeNoKartu] }),
  pc('kunjungan-rujukan', 'Kunjungan', 'Rujukan menurut nomor kunjungan', 'GET', '/kunjungan/rujukan/{noKunjungan}', { parameter: [kodeKunjungan] }),
  pc('kunjungan-buat', 'Kunjungan', 'Tambah kunjungan', 'POST', '/kunjungan/v1', { badan: kunjunganContoh }),
  pc('kunjungan-ubah', 'Kunjungan', 'Ubah kunjungan', 'PUT', '/kunjungan/v1', { badan: { ...kunjunganContoh, noKunjungan: '0114A0261411Y000001' } }),
  pc('kunjungan-hapus', 'Kunjungan', 'Hapus kunjungan', 'DELETE', '/kunjungan/{noKunjungan}', { parameter: [kodeKunjungan] }),
  pc('obat-kunjungan', 'Obat dan tindakan', 'Obat pada kunjungan', 'GET', '/obat/kunjungan/{noKunjungan}', { parameter: [kodeKunjungan] }),
  pc('obat-tambah', 'Obat dan tindakan', 'Tambah obat pada kunjungan', 'POST', '/obat/kunjungan', { badan: { kdKunjungan: '0114A0261411Y000001', kdObat: '00000001', jmlObat: 10, signa1: 3, signa2: 1 } }),
  pc('tindakan-kunjungan', 'Obat dan tindakan', 'Tindakan pada kunjungan', 'GET', '/tindakan/kunjungan/{noKunjungan}', { parameter: [kodeKunjungan] }),
  pc('tindakan-tambah', 'Obat dan tindakan', 'Tambah tindakan pada kunjungan', 'POST', '/tindakan/kunjungan', { badan: { kdKunjungan: '0114A0261411Y000001', kdTindakan: '10101' } }),
  pc('mcu', 'Obat dan tindakan', 'MCU pada kunjungan', 'GET', '/mcu/kunjungan/{noKunjungan}', { parameter: [kodeKunjungan] }),
  pc('ref-diagnosa', 'Referensi', 'Cari diagnosa', 'GET', '/diagnosa/{kdDiagnosa}', hal('/diagnosa/{kdDiagnosa}', { parameter: [p('kdDiagnosa', 'Kode atau nama diagnosa', 'A01')] })),
  pc('ref-dokter', 'Referensi', 'Daftar dokter', 'GET', '/dokter', hal('/dokter')),
  pc('ref-kesadaran', 'Referensi', 'Tingkat kesadaran', 'GET', '/kesadaran'),
  pc('ref-poli', 'Referensi', 'Poli FKTP', 'GET', '/poli/fktp', hal('/poli/fktp')),
  pc('ref-provider', 'Referensi', 'Provider rayonisasi', 'GET', '/provider', hal('/provider')),
  pc('ref-obat', 'Referensi', 'Cari obat DPHO', 'GET', '/obat/dpho/{keyword}', hal('/obat/dpho/{keyword}', { parameter: [p('keyword', 'Kata kunci obat', 'paracetamol')] })),
  pc('ref-tindakan', 'Referensi', 'Tindakan menurut jenis TKP', 'GET', '/tindakan/kdTkp/{kdTkp}', hal('/tindakan/kdTkp/{kdTkp}', { parameter: [p('kdTkp', 'Kode TKP', '10')] })),
  pc('ref-prognosa', 'Referensi', 'Prognosa', 'GET', '/prognosa'),
  pc('ref-alergi', 'Referensi', 'Alergi menurut jenis', 'GET', '/alergi/jenis/{jenis}', { parameter: [p('jenis', 'Jenis alergi', '01')] }),
  pc('ref-statuspulang', 'Referensi', 'Status pulang', 'GET', '/statuspulang/rawatInap/{status}', { parameter: [p('status', 'Rawat inap (true atau false)', 'false', { pola: '^(true|false)$', pesanPola: 'Isi true atau false.' })] }),
  pc('spesialis', 'Spesialis dan rujukan', 'Referensi spesialis', 'GET', '/spesialis'),
  pc('subspesialis', 'Spesialis dan rujukan', 'Sub spesialis', 'GET', '/spesialis/{kdSpesialis}/subspesialis', { parameter: [p('kdSpesialis', 'Kode spesialis', 'ANA')] }),
  pc('sarana', 'Spesialis dan rujukan', 'Referensi sarana', 'GET', '/spesialis/sarana'),
  pc('khusus', 'Spesialis dan rujukan', 'Referensi khusus (THA, HEM)', 'GET', '/spesialis/khusus'),
  pc('rujuk-sub', 'Spesialis dan rujukan', 'Faskes rujukan sub spesialis', 'GET', '/spesialis/rujuk/subspesialis/{kdSub}/sarana/{kdSarana}/tglEstRujuk/{tgl}', { parameter: [p('kdSub', 'Kode sub spesialis', '26'), p('kdSarana', 'Kode sarana', '1'), p('tgl', 'Tanggal rujuk', '20-11-2026', TGL)] }),
  pc('rujuk-khusus', 'Spesialis dan rujukan', 'Faskes rujukan khusus', 'GET', '/spesialis/rujuk/khusus/{kdKhusus}/subspesialis/{kdSub}/noKartu/{noKartu}/tglEstRujuk/{tgl}', { parameter: [p('kdKhusus', 'Kode khusus', 'THA'), p('kdSub', 'Kode sub spesialis', '26'), kodeNoKartu, p('tgl', 'Tanggal rujuk', '20-11-2026', TGL)] }),
  pc('klub', 'Kelompok (Prolanis)', 'Club menurut jenis kelompok', 'GET', '/kelompok/club/{kdJenis}', { parameter: [p('kdJenis', 'Kode jenis kelompok', '01')] }),
  pc('kegiatan', 'Kelompok (Prolanis)', 'Kegiatan kelompok menurut bulan', 'GET', '/kelompok/kegiatan/{bulan}', { parameter: [p('bulan', 'Bulan (MM-yyyy)', '11-2026', { pola: '^\\d{2}-\\d{4}$', pesanPola: 'Format MM-yyyy.' })] }),
  pc('kegiatan-peserta', 'Kelompok (Prolanis)', 'Peserta kegiatan', 'GET', '/kelompok/peserta/{eduId}', { parameter: [p('eduId', 'ID kegiatan', '1', ANGKA)] }),
  pc('kegiatan-buat', 'Kelompok (Prolanis)', 'Buat kegiatan', 'POST', '/kelompok/kegiatan', { badan: { clubId: 1, tglPelaksanaan: '10-11-2026', materi: 'Senam sehat' } }),
  pc('kegiatan-hapus', 'Kelompok (Prolanis)', 'Hapus kegiatan', 'DELETE', '/kelompok/kegiatan/{eduId}', { parameter: [p('eduId', 'ID kegiatan', '1', ANGKA)] }),
  pc('skrining-rekap', 'Skrining', 'Rekap skrining per penyakit', 'GET', '/skrinning/rekap'),
  pc('skrining-peserta', 'Skrining', 'Peserta skrining', 'GET', '/skrinning/peserta/{keyword}', hal('/skrinning/peserta/{keyword}', { parameter: [p('keyword', 'Nomor kartu atau nama', 'budi')] })),
  pc('skrining-dm', 'Skrining', 'Prolanis diabetes melitus', 'GET', '/skrinning/prolanis/dm/{keyword}', hal('/skrinning/prolanis/dm/{keyword}', { parameter: [p('keyword', 'Nomor kartu atau nama', 'siti')] })),
  pc('skrining-ht', 'Skrining', 'Prolanis hipertensi', 'GET', '/skrinning/prolanis/ht/{keyword}', hal('/skrinning/prolanis/ht/{keyword}', { parameter: [p('keyword', 'Nomor kartu atau nama', 'siti')] })),
];

export const katalogUntuk = (layanan) => KATALOG_ENDPOINT.filter((x) => x.layanan === layanan);
export const cariEndpoint = (layanan, id) => KATALOG_ENDPOINT.find((x) => x.layanan === layanan && x.id === id) ?? null;
export const butuhBadan = (endpoint) => endpoint.metode === 'POST' || endpoint.metode === 'PUT';

/** Ganti {{organization_id}} dan sejenisnya pada contoh isian dengan konteks klinik. */
export function isiKonteks(teks, konteks = {}) {
  return String(teks).replace(/\{\{(\w+)\}\}/g, (_m, k) => konteks[k] ?? '');
}

const ADA_KENDALI = /[\u0000-\u001f\u007f]/;

/**
 * Membangun jalur permintaan dari endpoint katalog dan isian pengguna. Setiap nilai dipangkas, dicek, dan di-encode,
 * sehingga isian seperti "../x" atau "a/b" tidak bisa mengubah struktur jalur.
 * Hasil: { ok: true, jalur } atau { ok: false, galat: { nama: pesan } }.
 */
export function bangunPermintaan(endpoint, nilai = {}) {
  const galat = {};
  const bersih = {};
  const semua = [...endpoint.parameter, ...(endpoint.paginasi ? [{ nama: 'start', label: 'Mulai', wajib: false, ...ANGKA }, { nama: 'limit', label: 'Jumlah', wajib: false, ...ANGKA }] : [])];
  for (const prm of semua) {
    const mentah = typeof nilai[prm.nama] === 'string' ? nilai[prm.nama].trim() : '';
    if (mentah === '') { if (prm.wajib) galat[prm.nama] = `${prm.label} wajib diisi.`; continue; }
    if (mentah.length > BATAS_PARAMETER) { galat[prm.nama] = `${prm.label} terlalu panjang.`; continue; }
    if (ADA_KENDALI.test(mentah)) { galat[prm.nama] = `${prm.label} memuat karakter yang tidak diizinkan.`; continue; }
    if (prm.pola && !new RegExp(prm.pola).test(mentah)) { galat[prm.nama] = prm.pesanPola ?? `${prm.label} tidak sah.`; continue; }
    bersih[prm.nama] = mentah;
  }
  if (endpoint.paginasi && !galat.start && !galat.limit && (bersih.start === undefined) !== (bersih.limit === undefined))
    galat[bersih.start === undefined ? 'start' : 'limit'] = 'Mulai dan Jumlah harus diisi berpasangan.';
  if (Object.keys(galat).length) return { ok: false, galat };
  const isi = (templat, ubah) => templat.replace(/\{(\w+)\}/g, (_m, k) => ubah(bersih[k] ?? ''));
  let jalur = isi(endpoint.jalur, encodeURIComponent);
  if (endpoint.paginasi && bersih.start !== undefined) jalur += `/${bersih.start}/${bersih.limit}`;
  if (endpoint.query) jalur += `?${Object.entries(endpoint.query).map(([k, t]) => `${k}=${encodeURIComponent(isi(t, (v) => v))}`).join('&')}`;
  return { ok: true, jalur };
}

/** Teks contoh badan untuk satu endpoint: konteks klinik ({{organization_id}}) dan isian parameter ({id}) diisikan. Kosong bila tanpa badan. */
export function contohBadan(endpoint, nilai = {}, konteks = {}) {
  if (!butuhBadan(endpoint) || endpoint.badan === undefined) return '';
  const teks = isiKonteks(JSON.stringify(endpoint.badan, null, 2), konteks);
  return teks.replace(/\{(\w+)\}/g, (m, k) => (typeof nilai[k] === 'string' && nilai[k].trim() !== '' ? JSON.stringify(nilai[k].trim()).slice(1, -1) : m));
}
