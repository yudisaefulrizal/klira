export const AKSI_IZIN = ['input', 'perbaikan', 'lihat'] as const;
export const CAKUPAN_IZIN = ['unit', 'layanan'] as const;
export const FITUR_IZIN = [
  'pendaftaran', 'kunjungan', 'klinis', 'resep', 'farmasi', 'penunjang', 'kasir', 'klaim',
  'rekam-medis', 'akses', 'satusehat', 'pdp', 'audit',
] as const;

export type AksiIzin = (typeof AKSI_IZIN)[number];
export type CakupanIzin = (typeof CAKUPAN_IZIN)[number];
export type FiturIzin = (typeof FITUR_IZIN)[number];
export type IzinAwal = { fitur: FiturIzin; aksi: AksiIzin; cakupan: CakupanIzin };

/** Katalog izin: fitur x aksi x cakupan. */
export const IZIN_AWAL: IzinAwal[] = FITUR_IZIN.flatMap((fitur) =>
  AKSI_IZIN.flatMap((aksi) => CAKUPAN_IZIN.map((cakupan) => ({ fitur, aksi, cakupan }))),
);

export type JenisAkunAwal = { nama: string; syarat_profesi?: string; fitur: FiturIzin[] };

/** Paket awal 12 jenis akun (bagian 2.1; contoh, setelah dibuat menjadi milik klinik). */
export const JENIS_AKUN_AWAL: JenisAkunAwal[] = [
  { nama: 'Admin vendor', fitur: ['akses', 'satusehat'] },
  { nama: 'Pimpinan fasyankes', fitur: ['akses', 'audit', 'rekam-medis'] },
  { nama: 'Dokter/DPJP', syarat_profesi: 'dokter ber-SIP', fitur: ['klinis', 'resep', 'kunjungan'] },
  { nama: 'Perawat/Bidan/Nakes lain', syarat_profesi: 'nakes ber-SIP', fitur: ['klinis', 'kunjungan'] },
  { nama: 'Perekam Medis dan Informasi Kesehatan', fitur: ['rekam-medis', 'pendaftaran'] },
  { nama: 'Petugas pendaftaran', fitur: ['pendaftaran'] },
  { nama: 'Petugas klaim/kasir', fitur: ['kasir', 'klaim'] },
  { nama: 'Apoteker/tenaga kefarmasian', syarat_profesi: 'tenaga kefarmasian', fitur: ['farmasi'] },
  { nama: 'Analis lab', fitur: ['penunjang'] },
  { nama: 'Admin IT fasyankes', fitur: ['satusehat'] },
  { nama: 'Petugas PDP (PPDP)', fitur: ['pdp'] },
  { nama: 'Auditor', fitur: ['audit'] },
];
