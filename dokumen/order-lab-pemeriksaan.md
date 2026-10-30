# Order lab dari pemeriksaan

Di P — Plan, Lab awalnya tidak dicentang. Centang Lab, cari pemeriksaan, lalu pilih hasil yang diperlukan. Pilihan, prioritas, dan catatan lab ikut draf pemeriksaan di server serta tetap tersedia saat berpindah langkah. Melepas centang Lab menunda pengirimannya tanpa membuang pilihan draf.

Tidak ada tombol Pesan Lab di dalam pemeriksaan. Ringkasan menampilkan jumlah pemeriksaan lab yang akan dipesan. Simpan dan sahkan memvalidasi pilihan, menyimpan bagian catatan yang berubah, mengirim order lab, kemudian meneruskan tahap pemeriksaan bila dipilih. Order dan item tagihan tetap dibuat bersama oleh API lab yang sudah ada. Modal Order Lab terpisah tetap memiliki pengiriman sendiri.

Jika salah satu tahap gagal, modal menampilkan galat. Pilihan dipertahankan jika pengiriman lab gagal. Setelah respons order sukses, pilihan lab dibersihkan agar percobaan ulang akibat kegagalan tahap berikutnya tidak memesan ulang. Order yang sudah dipesan tetap terlihat di ringkasan order tersimpan. Seluruh rangkaian Simpan bukan satu transaksi lintas API: bagian catatan atau order yang sudah berhasil tetap tersimpan jika tahap berikutnya gagal. Respons jaringan yang hilang setelah server menerima order tetap memerlukan pemeriksaan daftar order sebelum mengulang.

## Resep melalui Simpan yang sama

Tombol Ajukan Resep di P — Plan juga dihapus. Obat, jumlah, aturan pakai, bentuk, dan rute ikut draf pemeriksaan. Baris awal tanpa isian bukan resep dan tidak dikirim. Isian sebagian harus dilengkapi; seluruh pilihan resep dan lab divalidasi sebelum mulai menyimpan.

Sesudah catatan dan lab, Simpan mengajukan resep, lalu meneruskan pemeriksaan. Resep yang belum ditelaah/siap mengarahkan pasien ke tahap farmasi. Jika pengajuan resep gagal, drafnya tetap ada. Setelah respons pengajuan sukses, draf resep dibersihkan sehingga kegagalan tahap berikutnya tidak membuatnya diajukan ulang. Layar hasil memakai satu konfirmasi: pemeriksaan tersimpan dan disahkan. Ringkasan hanya menampilkan isi resep dan lab; tidak ada konfirmasi pengajuan resep atau pemesanan lab yang terpisah. Resep yang baru tersimpan ditampilkan sebagai menunggu farmasi di dalam pemeriksaan.

## Baris obat

Obat dicari langsung di kolom Obat (nama tampil, nama KFA, atau kode KFA). Hasil kosong sebelum mengetik dan dapat dipilih melalui klik atau tombol panah/Enter. Seluruh halaman master obat aktif dimuat agar obat di luar halaman pertama tetap dapat ditemukan.

Tombol + menambahkan baris dan memfokuskan pencarian baru. Tiap baris memuat obat, jumlah dengan satuan master, aturan pakai, serta ikon hapus. Harga per satuan dan total tidak ditampilkan dalam formulir pemeriksaan; biaya dilihat pada kasir/tagihan. Bentuk sediaan dan cara pemberian diambil dari referensi KFA bila tersedia, tanpa menebak data yang kosong, tanpa dropdown Detail obat atau isian tambahan di formulir pemeriksaan. Mengganti obat membersihkan data bentuk/rute obat sebelumnya.


## Tampilan lab ringkas

P–Plan hanya menampilkan pencarian pemeriksaan, pilihan pemeriksaan dan catatan opsional. Prioritas tidak ditanyakan terpisah di P–Plan; kebutuhan khusus ditulis pada catatan untuk laboratorium. Petunjuk berulang, daftar order tersimpan, jumlah pilihan, serta informasi biaya dihilangkan dari formulir klinis. Resep dan lab tersimpan tetap tersedia pada Ringkasan; hasil lab tersedia di Objective. Modal Order Lab terpisah tetap menampilkan rincian biayanya.

## Ringkasan pemeriksaan

Ringkasan selalu menampilkan keenam bagian SOAPIE; bagian tanpa isi diberi tanda —. Rincian mencakup tindak lanjut sebelum narasi rencana, rincian tiap obat (nama, jumlah/satuan, aturan pakai), dan pemeriksaan lab beserta catatan. Baris kosong, rincian rujukan yang tidak berlaku, daftar status bagian yang berulang, serta pesan kosong resep/lab tidak ditampilkan. Resep/lab yang sudah tersimpan ditampilkan terpisah dari pilihan baru sebelum konfirmasi Simpan dan sahkan. Tidak ada harga atau pilihan prioritas pada ringkasan pilihan baru.
