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
export const GANTI_KREDENSIAL = {
  judul: 'Ganti kredensial',
  keterangan: 'Ini masuk pertama dengan kredensial awal. Ganti nama pengguna dan kata sandi sebelum memakai fitur lain.',
  usernameBaru: 'Nama pengguna baru',
  kataSandiLama: 'Kata sandi lama',
  kataSandiBaru: 'Kata sandi baru',
  konfirmasi: 'Ulangi kata sandi baru',
  petunjukKataSandi: 'Kata sandi minimal 8 karakter, memuat huruf dan angka.',
  tombol: 'Simpan kredensial',
  tombolProses: 'Menyimpan...',
  usernameFormat: 'Nama pengguna 3 sampai 100 karakter: huruf, angka, titik, garis bawah, atau tanda hubung.',
  kataSandiPendek: 'Kata sandi minimal 8 karakter.',
  kataSandiLemah: 'Kata sandi harus memuat huruf dan angka.',
  konfirmasiBeda: 'Konfirmasi kata sandi tidak sama.',
  kataSandiSamaUsername: 'Kata sandi tidak boleh sama dengan nama pengguna.',
  kataSandiLamaSalah: 'Kata sandi lama salah.',
  usernameSamaAwal: 'Nama pengguna baru tidak boleh sama dengan nama pengguna awal.',
  usernameDipakai: 'Nama pengguna sudah dipakai.',
  kataSandiSamaLama: 'Kata sandi baru tidak boleh sama dengan kata sandi lama.',
  kataSandiSamaAwal: 'Kata sandi baru tidak boleh sama dengan kata sandi awal.',
  wajib: 'Ganti nama pengguna dan kata sandi awal terlebih dahulu sebelum memakai fitur lain.',
} as const;

export const TEKS = { tombol: TOMBOL, galat: GALAT, masuk: MASUK, gantiKredensial: GANTI_KREDENSIAL } as const;
