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
