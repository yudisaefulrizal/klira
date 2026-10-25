export type IzinAwal = { fitur: string; aksi: 'input' | 'perbaikan' | 'lihat'; cakupan: 'unit' | 'layanan' };

const FITUR = [
  'pendaftaran', 'kunjungan', 'klinis', 'resep', 'farmasi', 'penunjang', 'kasir', 'klaim',
  'rekam-medis', 'akses', 'satusehat', 'pdp', 'audit',
];

/** Katalog izin awal: fitur x aksi x cakupan. */
export const IZIN_AWAL: IzinAwal[] = FITUR.flatMap((fitur) =>
  (['input', 'perbaikan', 'lihat'] as const).flatMap((aksi) =>
    (['unit', 'layanan'] as const).map((cakupan) => ({ fitur, aksi, cakupan })),
  ),
);

/** Paket awal jenis akun (contoh; setelah dibuat menjadi milik klinik). */
export const JENIS_AKUN_AWAL: { nama: string; syarat_profesi?: string; fitur: string[] }[] = [
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
