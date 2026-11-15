// Data contoh PCare. Semua fiktif; bentuk bidang mengikuti catatan p-care/03-struktur-data.md ([dugaan]).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dataApi = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'apps', 'api', 'data');

export const PROVIDER_SENDIRI = { kdProvider: '0114A026', nmProvider: 'KLINIK PRATAMA CONTOH' };

const peserta = (noKartu, nik, nama, sex, tglLahir, ekstra = {}) => ({
  noKartu,
  nama,
  hubunganKeluarga: 'Peserta',
  sex,
  tglLahir,
  tglMulaiAktif: '01-01-2014',
  tglAkhirBerlaku: '31-12-2099',
  kdProviderPst: PROVIDER_SENDIRI,
  kdProviderGigi: { kdProvider: null, nmProvider: null },
  jnsKelas: { nama: 'KELAS III', kode: '3' },
  jnsPeserta: { nama: 'PBI (APBN)', kode: '13' },
  golDarah: '-',
  noHP: '081200000000',
  noKTP: nik,
  pstProl: 'Tidak',
  pstPrb: 'Tidak',
  aktif: true,
  ketAktif: 'AKTIF',
  asuransi: { kdAsuransi: null, nmAsuransi: null, noAsuransi: null, cob: false },
  tunggakan: 0,
  ...ekstra,
});

export const PESERTA = [
  peserta('0000039043765', '3201010101800001', 'BUDI CONTOH', 'L', '01-01-1980'),
  peserta('0000039043766', '3201010202850002', 'SITI CONTOH', 'P', '02-02-1985', { pstProl: 'Prolanis DM', pstPrb: 'Tidak' }),
  peserta('0000039043767', '3201010303900003', 'AGUS NONAKTIF', 'L', '03-03-1990', {
    aktif: false,
    ketAktif: 'TIDAK AKTIF, TUNGGAKAN IURAN',
    tunggakan: 120000,
  }),
  peserta('0000039043768', '3201010404950004', 'DEWI PROVIDER LAIN', 'P', '04-04-1995', {
    kdProviderPst: { kdProvider: '0114A099', nmProvider: 'KLINIK LAIN' },
  }),
];

const diagnosaSemua = JSON.parse(readFileSync(join(dataApi, 'icd10-2010.json'), 'utf8')).kode;
// Hanya kode tiga karakter dan subkode yang lazim di FKTP; sisanya ikut bila dicari lewat kata kunci.
export function cariDiagnosa(kataKunci) {
  const k = String(kataKunci).toLowerCase();
  return diagnosaSemua
    .filter((d) => d.kode.toLowerCase().startsWith(k) || d.nama.toLowerCase().includes(k))
    .map((d) => ({ kdDiag: d.kode, nmDiag: d.nama, nonSpesialis: true }));
}

export const DOKTER = [
  { kdDokter: '123123', nmDokter: 'dr. Contoh Satu' },
  { kdDokter: '123124', nmDokter: 'dr. Contoh Dua' },
  { kdDokter: '123125', nmDokter: 'drg. Contoh Tiga' },
];

export const POLI = [
  { kdPoli: '001', nmPoli: 'Umum', poliSakit: true },
  { kdPoli: '002', nmPoli: 'Gigi', poliSakit: true },
  { kdPoli: '003', nmPoli: 'KIA', poliSakit: true },
  { kdPoli: '021', nmPoli: 'Kesehatan', poliSakit: false },
];

export const KESADARAN = [
  { kdSadar: '01', nmSadar: 'Compos mentis' },
  { kdSadar: '02', nmSadar: 'Somnolence' },
  { kdSadar: '03', nmSadar: 'Sopor' },
  { kdSadar: '04', nmSadar: 'Coma' },
];

export const PROVIDER = [
  PROVIDER_SENDIRI,
  { kdProvider: '0114A099', nmProvider: 'KLINIK LAIN' },
  { kdProvider: '0114P001', nmProvider: 'PUSKESMAS CONTOH' },
];

export const OBAT_DPHO = [
  { kdObat: '00000001', nmObat: 'Paracetamol 500 mg tablet', sedia: 100, harga: 300 },
  { kdObat: '00000002', nmObat: 'Amoxicillin 500 mg kapsul', sedia: 100, harga: 700 },
  { kdObat: '00000003', nmObat: 'Cetirizine 10 mg tablet', sedia: 100, harga: 500 },
  { kdObat: '00000004', nmObat: 'Metformin 500 mg tablet', sedia: 100, harga: 400 },
  { kdObat: '00000005', nmObat: 'Amlodipine 5 mg tablet', sedia: 100, harga: 450 },
];

export const TINDAKAN = [
  { kdTindakan: '10101', nmTindakan: 'Konsultasi dokter', maxTarif: 0, withValue: false, kdTkp: '10' },
  { kdTindakan: '10102', nmTindakan: 'Perawatan luka', maxTarif: 50000, withValue: true, kdTkp: '10' },
  { kdTindakan: '20101', nmTindakan: 'Pemeriksaan gula darah', maxTarif: 25000, withValue: true, kdTkp: '20' },
  { kdTindakan: '30101', nmTindakan: 'Penyuluhan kelompok', maxTarif: 0, withValue: false, kdTkp: '50' },
];

export const STATUS_PULANG = [
  { kdStatusPulang: '3', nmStatusPulang: 'Meninggal', rawatInap: false },
  { kdStatusPulang: '4', nmStatusPulang: 'Berobat Jalan', rawatInap: false },
  { kdStatusPulang: '6', nmStatusPulang: 'Rujuk Vertikal', rawatInap: false },
  { kdStatusPulang: '9', nmStatusPulang: 'Rujuk Lanjut', rawatInap: false },
  { kdStatusPulang: '1', nmStatusPulang: 'Pulang', rawatInap: true },
];

export const PROGNOSA = [
  { kdPrognosa: '01', nmPrognosa: 'Bonam (Baik)' },
  { kdPrognosa: '02', nmPrognosa: 'Dubia ad bonam (Cenderung baik)' },
  { kdPrognosa: '03', nmPrognosa: 'Dubia ad malam (Cenderung buruk)' },
  { kdPrognosa: '04', nmPrognosa: 'Malam (Buruk)' },
];

export const ALERGI = [
  { kdAlergi: '01', nmAlergi: 'Makanan', jenis: '01' },
  { kdAlergi: '02', nmAlergi: 'Udara', jenis: '02' },
  { kdAlergi: '03', nmAlergi: 'Obat', jenis: '03' },
];

export const SPESIALIS = [
  { kdSpesialis: 'ANA', nmSpesialis: 'Anak' },
  { kdSpesialis: 'INT', nmSpesialis: 'Penyakit Dalam' },
  { kdSpesialis: 'BED', nmSpesialis: 'Bedah' },
];

export const SUB_SPESIALIS = {
  ANA: [{ kdSubSpesialis: '26', nmSubSpesialis: 'ANAK UMUM', kdPoliRujuk: 'ANA' }],
  INT: [{ kdSubSpesialis: '03', nmSubSpesialis: 'PENYAKIT DALAM', kdPoliRujuk: 'INT' }],
  BED: [{ kdSubSpesialis: '05', nmSubSpesialis: 'BEDAH UMUM', kdPoliRujuk: 'BED' }],
};

export const SARANA = [
  { kdSarana: '1', nmSarana: 'Rumah sakit' },
  { kdSarana: '2', nmSarana: 'Klinik utama' },
];

export const KHUSUS = [
  { kdKhusus: 'THA', nmKhusus: 'Thalasemia' },
  { kdKhusus: 'HEM', nmKhusus: 'Hemofilia' },
];

export const FASKES_RUJUKAN = [
  { kdppk: '0101R001', nmppk: 'RS CONTOH UMUM', alamatPpk: 'Jl. Contoh No. 1', kelasPpk: 'B', telpPpk: '021000001', persentase: '40%', jmlRujuk: 40, kapasitas: 100, jadwal: 'Senin-Jumat 08:00-14:00' },
  { kdppk: '0101R002', nmppk: 'RS CONTOH KASIH', alamatPpk: 'Jl. Contoh No. 2', kelasPpk: 'C', telpPpk: '021000002', persentase: '70%', jmlRujuk: 70, kapasitas: 100, jadwal: 'Senin-Sabtu 08:00-13:00' },
];

export const CLUB_PROLANIS = [
  { clubId: 1, nama: 'Club Prolanis DM Contoh', kdProgram: '01', nmProgram: 'Diabetes Melitus', ketuaNama: 'Ibu Contoh', ketuaNoHP: '081200000001', jmlAnggota: 15 },
  { clubId: 2, nama: 'Club Prolanis HT Contoh', kdProgram: '02', nmProgram: 'Hipertensi', ketuaNama: 'Bapak Contoh', ketuaNoHP: '081200000002', jmlAnggota: 20 },
];

export const REKAP_SKRINING = [
  { kdPenyakit: 'DM', nmPenyakit: 'Diabetes Melitus', jmlPeserta: 120, jmlBerisiko: 18 },
  { kdPenyakit: 'HT', nmPenyakit: 'Hipertensi', jmlPeserta: 150, jmlBerisiko: 32 },
];
