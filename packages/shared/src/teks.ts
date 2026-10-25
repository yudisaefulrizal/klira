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



export const MASUK = {
  judul: 'klira',
  keterangan: 'Sistem rekam medis elektronik untuk klinik.',
  judulForm: 'Masuk',
  username: 'Nama pengguna',
  kataSandi: 'Kata sandi',
  tombol: 'Masuk',
  tombolProses: 'Memproses...',
  catatanGanti: 'Akun awal klinik wajib mengganti nama pengguna dan kata sandi saat masuk pertama kali.',
  gagal: 'Nama pengguna atau kata sandi salah.',
  terlaluBanyak: 'Terlalu banyak percobaan masuk. Coba lagi beberapa menit lagi.',
  keluar: 'Keluar',
} as const;
export const TEKS = { tombol: TOMBOL, galat: GALAT, masuk: MASUK } as const;
