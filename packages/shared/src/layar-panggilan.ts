/** Data publik: hanya nomor antrean dan tujuan layanan, tanpa identitas pasien. */
export type PanggilanPublik = { kode: string; waktu_panggil: string; poli_id: number; poli_nama: string; event_id?: number };
export type LayarPanggilanDto = {
  fasyankes_nama: string;
  fasyankes_logo_url?: string | null;
  tanggal: string;
  kursor: number;
  event_panggilan: PanggilanPublik[];
  ada_lanjutan: boolean;
  panggilan: PanggilanPublik | null;
  panggilan_aktif?: PanggilanPublik[];
  poli: { id: number; nama: string; sekarang: { kode: string; status: 'dipanggil' | 'dilayani' } | null; berikutnya: string | null }[];
};

export type PesanLayarPanggilan = { tipe: 'siap' | 'perubahan' | 'hidup' } | { tipe: 'layar'; jumlah: number };
