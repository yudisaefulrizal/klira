export const AKSI_IZIN = ['input', 'perbaikan', 'lihat'] as const;
export const CAKUPAN_IZIN = ['unit', 'layanan'] as const;
export const FITUR_IZIN = [
  'pasien', 'pendaftaran', 'kunjungan', 'klinis', 'resep', 'farmasi', 'penunjang', 'persetujuan', 'kasir', 'klaim',
  'rekam-medis', 'akses', 'satusehat', 'pdp', 'audit', 'master', 'profil-klinik', 'whatsapp', 'instagram',
] as const;

export type AksiIzin = (typeof AKSI_IZIN)[number];
export type CakupanIzin = (typeof CAKUPAN_IZIN)[number];
export type FiturIzin = (typeof FITUR_IZIN)[number];
export type IzinAwal = { fitur: string; aksi: AksiIzin; cakupan: CakupanIzin };

/** Katalog izin: fitur x aksi x cakupan; WhatsApp memakai satu izin untuk seluruh fiturnya. */
export const IZIN_AWAL: IzinAwal[] = FITUR_IZIN.flatMap<IzinAwal>((fitur) =>
  (fitur === 'whatsapp' || fitur === 'instagram')
    ? [{ fitur, aksi: 'lihat' as const, cakupan: 'unit' as const }]
    : AKSI_IZIN.flatMap((aksi) => CAKUPAN_IZIN.map((cakupan) => ({ fitur, aksi, cakupan }))),
);

/** `lihat_saja`: fitur yang hanya diberi aksi lihat (mis. `pasien` untuk peran non-pendaftaran). */
export type JenisAkunAwal = { nama: string; syarat_profesi?: string; fitur: FiturIzin[]; lihat_saja?: FiturIzin[] };

/** Paket awal 12 jenis akun (bagian 2.1; contoh, setelah dibuat menjadi milik klinik). */
export const JENIS_AKUN_AWAL: JenisAkunAwal[] = [
  { nama: 'Admin vendor', fitur: ['akses', 'satusehat'] },
  { nama: 'Pimpinan fasyankes', fitur: ['whatsapp', 'akses', 'audit', 'rekam-medis', 'master', 'profil-klinik'] },
  { nama: 'Dokter/DPJP', syarat_profesi: 'dokter ber-SIP', fitur: ['klinis', 'resep', 'kunjungan', 'persetujuan'], lihat_saja: ['pasien', 'penunjang'] },
  { nama: 'Perawat/Bidan/Nakes lain', syarat_profesi: 'nakes ber-SIP', fitur: ['klinis', 'kunjungan'], lihat_saja: ['pasien'] },
  { nama: 'Perekam Medis dan Informasi Kesehatan', fitur: ['pasien', 'kunjungan', 'rekam-medis', 'pendaftaran'], lihat_saja: ['persetujuan'] },
  { nama: 'Petugas pendaftaran', fitur: ['whatsapp', 'pasien', 'kunjungan', 'pendaftaran'] },
  { nama: 'Petugas klaim/kasir', fitur: ['kasir', 'klaim'], lihat_saja: ['pasien'] },
  { nama: 'Apoteker/tenaga kefarmasian', syarat_profesi: 'tenaga kefarmasian', fitur: ['farmasi'], lihat_saja: ['pasien'] },
  { nama: 'Analis lab', fitur: ['penunjang'], lihat_saja: ['pasien'] },
  { nama: 'Admin IT fasyankes', fitur: ['satusehat'] },
  { nama: 'Petugas PDP (PPDP)', fitur: ['pdp'] },
  { nama: 'Auditor', fitur: ['audit'] },
];

/** Fitur yang menandakan akses ke pekerjaan per pasien (klinis dan administrasi); selain ini ke Beranda tugas. */
export const FITUR_AKSES_PASIEN: FiturIzin[] = [
  'pasien', 'pendaftaran', 'kunjungan', 'klinis', 'resep', 'farmasi', 'penunjang', 'kasir', 'klaim', 'rekam-medis',
];

export const HALAMAN_AWAL = { daftarPasien: '/pasien', berandaTugas: '/beranda' } as const;

/** Halaman awal setelah masuk (5.1b): Daftar pasien bila punya akses rekam medis/klinis, jika tidak Beranda tugas. */
export function halamanAwal(fitur: readonly string[]): string {
  return fitur.some((f) => (FITUR_AKSES_PASIEN as readonly string[]).includes(f))
    ? HALAMAN_AWAL.daftarPasien
    : HALAMAN_AWAL.berandaTugas;
}

/** Jenis peringatan izin (2.2); peringatan tidak memblokir. */
export const JENIS_PERINGATAN = [
  'izin_klinis_non_dokter',
  'perbaikan_pembuat_penyetuju_sama',
  'lihat_tak_dibatasi',
  'admin_lihat_rekam_medis',
  'nakes_tanpa_sip',
  'penugasan_lewat_sip',
] as const;
export type JenisPeringatan = (typeof JENIS_PERINGATAN)[number];

export const kunciIzin = (i: IzinAwal) => `${i.fitur}|${i.aksi}|${i.cakupan}`;

/** Apakah akses efektif memuat izin fitur x aksi (x cakupan bila disebut). */
export function punyaIzin(
  pengguna: { izin: readonly IzinAwal[] },
  fitur: string,
  aksi: AksiIzin,
  cakupan?: CakupanIzin,
): boolean {
  return pengguna.izin.some((i) => i.fitur === fitur && i.aksi === aksi && (cakupan === undefined || i.cakupan === cakupan));
}

export type HalamanMenu = { path: string; label: string; fitur: readonly FiturIzin[] | null };

/** Halaman menu (3.1) dan fitur yang membukanya; null = semua akun yang sudah masuk. */
export const HALAMAN_MENU: readonly HalamanMenu[] = [
  { path: HALAMAN_AWAL.daftarPasien, label: 'Daftar pasien', fitur: FITUR_AKSES_PASIEN },
  { path: '/statistik', label: 'Statistik pelayanan', fitur: ['kunjungan', 'rekam-medis'] },
  { path: '/pesan', label: 'Pesan', fitur: ['whatsapp', 'instagram'] },
  { path: '/rawat-inap', label: 'Rawat inap', fitur: ['klinis'] },
  { path: '/penunjang', label: 'Penunjang', fitur: ['penunjang'] },
  { path: '/farmasi', label: 'Farmasi', fitur: ['farmasi'] },
  { path: '/kasir-klaim', label: 'Kasir dan klaim', fitur: ['kasir', 'klaim'] },
  { path: '/rekam-medis', label: 'Rekam medis', fitur: ['rekam-medis', 'klinis'] },
  { path: '/satusehat', label: 'SATUSEHAT', fitur: ['satusehat'] },
  { path: '/pelindungan-data', label: 'Pelindungan data', fitur: ['pdp'] },
  { path: '/pengaturan', label: 'Pengaturan', fitur: ['akses', 'audit', 'satusehat', 'master', 'profil-klinik', 'whatsapp', 'instagram'] },
  { path: HALAMAN_AWAL.berandaTugas, label: 'Beranda tugas', fitur: null },
];

/** Halaman menu yang diizinkan untuk fitur efektif ini (5.1a, 5.1m). */
export function halamanMenuDiizinkan(fitur: readonly string[]): HalamanMenu[] {
  return HALAMAN_MENU.filter((h) => h.fitur === null || h.fitur.some((f) => fitur.includes(f)));
}
