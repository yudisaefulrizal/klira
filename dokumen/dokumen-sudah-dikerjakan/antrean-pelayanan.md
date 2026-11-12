# Antrean mengikuti pelayanan

Daftar Pasien memakai satu tabel untuk seluruh tahap, tanpa tab tahap atau filter bawaan per pekerjaan. Pencarian, tanggal kunjungan, dan paginasi tetap tersedia. Tautan lama dengan parameter tahap dinormalisasi agar tidak menyembunyikan pasien. Tombol tindakan mengikuti izin akun dan tahap pelayanan masing-masing pasien.

Di Daftar Pasien, petugas memakai Panggil/Panggil Ulang dan Batal sesuai status antrean. Mulai dan Selesai tidak lagi menjadi tindakan manual di daftar.

- Penyimpanan dan pengesahan catatan klinis pertama pada tahap skrining/pemeriksaan mengubah antrean menunggu/dipanggil menjadi dilayani dan kunjungan menjadi sedang berlangsung. Menyimpan draf atau membuka formulir belum memulai pelayanan.
- Penyelesaian pemeriksaan menuju resep atau kasir menyelesaikan antrean poli. Kunjungan tetap berjalan untuk farmasi dan pembayaran.
- Penutupan kunjungan atau penerusan rawat jalan ke rawat inap menyelesaikan antrean yang masih aktif. Antrean batal tetap batal.
- Waktu mulai dan selesai hanya diisi bila belum tercatat. Penyimpanan ulang dan perbaikan catatan tidak membuka kembali antrean selesai/batal.

Perubahan status antrean dan pelayanan dilakukan dalam transaksi yang sama. Layar panggilan diberi pemberitahuan setelah penyimpanan berhasil. Status data lama tidak diubah massal; antrean aktifnya diselaraskan saat pelayanan berikutnya atau penutupan kunjungan.

Validasi: uji unit antrean otomatis dan tindakan Daftar Pasien; uji integrasi klinis memeriksa awal/akhir antrean jika database uji disediakan. Skrip pengujian standar proyek melewati uji database.
