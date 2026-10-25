/** Nama token warna status; nilai heksnya hanya di apps/web/src/gaya. */
export type WarnaStatus = 'hijau' | 'kuning' | 'merah' | 'biru' | 'ungu' | 'abu';
export type InfoStatus = { label: string; warna: WarnaStatus };

function buat<K extends string>(peta: Record<K, InfoStatus>) {
  const nilai = Object.keys(peta) as K[];
  return {
    nilai,
    peta,
    info: (status: K): InfoStatus => peta[status],
    label: (status: K): string => peta[status].label,
    warna: (status: K): WarnaStatus => peta[status].warna,
  };
}

export const STATUS_KUNJUNGAN = buat({
  planned: { label: 'Terencana', warna: 'abu' },
  arrived: { label: 'Tiba', warna: 'biru' },
  'in-progress': { label: 'Sedang dilayani', warna: 'kuning' },
  finished: { label: 'Selesai', warna: 'hijau' },
});

export const TAHAP_LAYANAN = buat({
  menunggu_skrining: { label: 'Menunggu skrining', warna: 'abu' },
  pemeriksaan: { label: 'Pemeriksaan', warna: 'biru' },
  resep: { label: 'Resep', warna: 'ungu' },
  kasir: { label: 'Kasir', warna: 'kuning' },
  ditutup: { label: 'Ditutup', warna: 'hijau' },
});

export const STATUS_TAGIHAN = buat({
  belum_lengkap: { label: 'Belum lengkap', warna: 'kuning' },
  lengkap: { label: 'Lengkap', warna: 'hijau' },
});

export const STATUS_PEMBAYARAN = buat({
  belum: { label: 'Belum dibayar', warna: 'merah' },
  sebagian: { label: 'Dibayar sebagian', warna: 'kuning' },
  lunas: { label: 'Lunas', warna: 'hijau' },
});

export const STATUS_KLAIM = buat({
  menunggu_sep: { label: 'Menunggu SEP', warna: 'abu' },
  siap_diajukan: { label: 'Siap diajukan', warna: 'biru' },
  diajukan: { label: 'Diajukan', warna: 'ungu' },
  dikembalikan: { label: 'Dikembalikan', warna: 'kuning' },
  diajukan_ulang: { label: 'Diajukan ulang', warna: 'ungu' },
  ditolak: { label: 'Ditolak', warna: 'merah' },
  dibayar: { label: 'Dibayar', warna: 'hijau' },
  lewat_batas_waktu: { label: 'Lewat batas waktu', warna: 'merah' },
});

export const STATUS_KIRIM_SATUSEHAT = buat({
  menunggu: { label: 'Menunggu kirim', warna: 'abu' },
  dikirim: { label: 'Sedang dikirim', warna: 'biru' },
  terkirim: { label: 'Terkirim', warna: 'hijau' },
  gagal: { label: 'Gagal kirim', warna: 'merah' },
});

export const STATUS_ORDER_PENUNJANG = buat({
  dipesan: { label: 'Dipesan', warna: 'abu' },
  spesimen_diambil: { label: 'Spesimen diambil', warna: 'biru' },
  menunggu_hasil: { label: 'Menunggu hasil', warna: 'kuning' },
  divalidasi: { label: 'Divalidasi', warna: 'hijau' },
});

export const STATUS_RESEP = buat({
  diajukan: { label: 'Diajukan', warna: 'abu' },
  ditelaah: { label: 'Ditelaah', warna: 'biru' },
  siap: { label: 'Siap', warna: 'kuning' },
  diserahkan: { label: 'Diserahkan di kasir', warna: 'hijau' },
});

export const STATUS_ANTREAN = buat({
  menunggu: { label: 'Menunggu', warna: 'abu' },
  dipanggil: { label: 'Dipanggil', warna: 'kuning' },
  dilayani: { label: 'Dilayani', warna: 'biru' },
  selesai: { label: 'Selesai', warna: 'hijau' },
  batal: { label: 'Batal', warna: 'merah' },
});

export type StatusKunjungan = keyof typeof STATUS_KUNJUNGAN.peta;
export type TahapLayanan = keyof typeof TAHAP_LAYANAN.peta;
export type StatusTagihan = keyof typeof STATUS_TAGIHAN.peta;
export type StatusPembayaran = keyof typeof STATUS_PEMBAYARAN.peta;
export type StatusKlaim = keyof typeof STATUS_KLAIM.peta;
export type StatusKirimSatusehat = keyof typeof STATUS_KIRIM_SATUSEHAT.peta;
export type StatusOrderPenunjang = keyof typeof STATUS_ORDER_PENUNJANG.peta;
export type StatusResep = keyof typeof STATUS_RESEP.peta;
export type StatusAntrean = keyof typeof STATUS_ANTREAN.peta;

export const STATUS_AKUN = buat({
  aktif: { label: 'Aktif', warna: 'hijau' },
  nonaktif: { label: 'Dinonaktifkan', warna: 'abu' },
});

export const STATUS_OPERASIONAL = buat({
  O: { label: 'Operasional', warna: 'hijau' },
  U: { label: 'Tidak operasional', warna: 'abu' },
});

/** Status periode penugasan jenis akun atau izin per akun terhadap hari ini. */
export const STATUS_PERIODE = buat({
  akan_datang: { label: 'Akan datang', warna: 'biru' },
  berjalan: { label: 'Berjalan', warna: 'hijau' },
  berakhir: { label: 'Berakhir', warna: 'abu' },
});

export const STATUS_BACKUP = buat({
  berhasil: { label: 'Berhasil', warna: 'hijau' },
  gagal: { label: 'Gagal', warna: 'merah' },
  berjalan: { label: 'Berjalan', warna: 'biru' },
});

/** Status identitas pasien (4.9): lengkap, atau sementara (pasien tanpa identitas, menunggu dilengkapi). */
export const STATUS_IDENTITAS = buat({
  lengkap: { label: 'Identitas lengkap', warna: 'hijau' },
  sementara: { label: 'Identitas sementara', warna: 'kuning' },
});
export type StatusIdentitas = keyof typeof STATUS_IDENTITAS.peta;

/** Jenis kunjungan (4.2): AMB rawat jalan, IMP rawat inap. */
export const JENIS_KUNJUNGAN = buat({
  AMB: { label: 'Rawat jalan', warna: 'biru' },
  IMP: { label: 'Rawat inap', warna: 'ungu' },
});
export type JenisKunjungan = keyof typeof JENIS_KUNJUNGAN.peta;

/** Cara pembayaran kunjungan. */
export const CARA_PEMBAYARAN = buat({
  umum: { label: 'Umum', warna: 'abu' },
  jkn: { label: 'JKN', warna: 'biru' },
});
export type CaraPembayaran = keyof typeof CARA_PEMBAYARAN.peta;

/** Keadaan pengesahan catatan (4.2): belum disahkan, sah (hash isi cocok), atau berubah setelah disahkan (hash tidak cocok). */
export const STATUS_PENGESAHAN = buat({
  belum_disahkan: { label: 'Belum disahkan', warna: 'abu' },
  sah: { label: 'Disahkan', warna: 'hijau' },
  berubah: { label: 'Berubah setelah disahkan', warna: 'merah' },
});
export type StatusPengesahan = keyof typeof STATUS_PENGESAHAN.peta;

/** Peran diagnosis (4.2): tepat satu utama per kunjungan, lainnya penyerta. */
export const STATUS_PERAN_DIAGNOSIS = buat({
  utama: { label: 'Utama', warna: 'hijau' },
  penyerta: { label: 'Penyerta', warna: 'abu' },
});

/** Keadaan satu bagian catatan pada ringkasan akhir pemeriksaan klinis. */
export const STATUS_RINGKASAN_BAGIAN = buat({
  belum_diisi: { label: 'Belum diisi', warna: 'abu' },
  tanpa_perubahan: { label: 'Tanpa perubahan', warna: 'abu' },
  akan_disimpan: { label: 'Akan disimpan', warna: 'biru' },
  sudah_sah: { label: 'Sudah disahkan', warna: 'hijau' },
});

/** Prioritas order penunjang (4.3). */
export const PRIORITAS_ORDER = buat({
  rutin: { label: 'Rutin', warna: 'abu' },
  segera: { label: 'Segera (cito)', warna: 'merah' },
});
export type PrioritasOrder = keyof typeof PRIORITAS_ORDER.peta;

/** Interpretasi hasil penunjang terhadap rentang rujukan. */
export const INTERPRETASI_HASIL = buat({
  normal: { label: 'Normal', warna: 'hijau' },
  rendah: { label: 'Rendah', warna: 'kuning' },
  tinggi: { label: 'Tinggi', warna: 'kuning' },
  abnormal: { label: 'Abnormal', warna: 'kuning' },
  kritis: { label: 'Kritis', warna: 'merah' },
});
export type InterpretasiHasil = keyof typeof INTERPRETASI_HASIL.peta;

/** Bentuk persetujuan (4.4): tertulis atau lisan. */
export const LABEL_BENTUK_PERSETUJUAN = buat({
  tertulis: { label: 'Tertulis', warna: 'biru' },
  lisan: { label: 'Lisan', warna: 'ungu' },
});
export type BentukPersetujuanTindakan = keyof typeof LABEL_BENTUK_PERSETUJUAN.peta;

/** Penandatangan persetujuan (4.4): pasien sendiri atau wali. */
export const LABEL_PENANDATANGAN = buat({
  pasien: { label: 'Pasien sendiri', warna: 'abu' },
  wali: { label: 'Wali', warna: 'biru' },
});
export type PenandatanganTindakan = keyof typeof LABEL_PENANDATANGAN.peta;
