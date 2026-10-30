# Pembayaran dan farmasi

Pembayaran dan penyerahan obat adalah proses terpisah. Biaya obat tetap menjadi item tagihan kunjungan yang sama; mencatat pembayaran tidak menyerahkan obat atau mengurangi stok.

- Kasir: aksi **Pembayaran** pada daftar pasien, dengan izin `kasir.input`, tagihan lengkap dan shift terbuka. Modal hanya memuat rincian tagihan dan pembayaran. Tombol Catat pembayaran dan Enter menggunakan satu form; pembayaran sebagian tetap membuka modal dan memperbarui sisa dari respons server.
- Farmasi: aksi **Serahkan obat** pada daftar pasien tahap kasir atau halaman Farmasi → Riwayat obat (resep siap). Pembacaan resep dan penyerahan memakai layanan farmasi; POST `/kunjungan/:id/serah-terima-obat` mewajibkan `farmasi.input`, tanpa izin/shift kasir. Izin kasir saja ditolak.
- Penyerahan memakai transaksi farmasi yang memeriksa resep siap, mengunci resep dan stok, mengambil batch dengan kedaluwarsa terdekat, mencatat mutasi/pengeluaran dan status diserahkan. Permintaan ulang tidak mengurangi stok lagi. Stok kurang memerlukan persetujuan eksplisit dan alasan seperti sebelumnya.
- Tutup kunjungan tetap aksi tersendiri. Syarat tagihan lengkap dan resep diserahkan tetap diperiksa server.

Tidak ada pemecahan tagihan atau perubahan pembayaran/stok lama. Akun yang mengerjakan kasir dan penyerahan obat harus memiliki kedua izin tersebut.

Validasi: tes rute membuktikan isolasi izin kasir/farmasi, penolakan tanpa sesi dan validasi alasan. Skenario integrasi database mencakup penyerahan oleh akun apoteker tanpa shift, transaksi stok, penyerahan serempak, dan pembayaran yang tidak berubah karena penyerahan. Tes browser dengan API simulasi memeriksa pengiriman pembayaran lewat Enter, pembayaran sebagian/pelunasan, kembalian dan aksi terpisah tanpa menulis data klinik.
