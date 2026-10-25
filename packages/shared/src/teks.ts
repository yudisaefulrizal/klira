/** Teks antarmuka berulang (bagian 5.2f). */
export const TOMBOL = {
  simpan: 'Simpan',
  batal: 'Batal',
  kembali: 'Kembali',
  lanjut: 'Lanjut',
  tutup: 'Tutup',
  hapus: 'Nonaktifkan',
  ubah: 'Ubah',
  tambah: 'Tambah',
  cari: 'Cari',
  konfirmasi: 'Ya, lanjutkan',
  muatUlang: 'Muat ulang',
} as const;

export const GALAT = {
  umum: 'Terjadi kesalahan. Coba lagi.',
  jaringan: 'Tidak dapat terhubung ke server.',
  tidakTerautentikasi: 'Silakan masuk terlebih dahulu.',
  tidakBerizin: 'Anda tidak memiliki izin untuk tindakan ini.',
  tidakDitemukan: 'Data tidak ditemukan.',
  tidakValid: 'Isian tidak valid.',
  wajibDiisi: 'Wajib diisi.',
  nik: 'NIK harus 16 digit angka.',
  tanggal: 'Tanggal tidak boleh sebelum 3 Juni 2014.',
  alasanWajib: 'Alasan wajib diisi.',
} as const;

export const TEKS = { tombol: TOMBOL, galat: GALAT } as const;
