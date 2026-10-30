/** Referensi aplikasi; kode wilayah tidak perlu diketik petugas. */
export type WilayahDto = { kode: string; nama: string; label: string };
export type HasilCariWilayah = { data: WilayahDto[]; lebih_banyak: boolean };
