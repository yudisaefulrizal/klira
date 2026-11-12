# Website publik klinik

Halaman `/` adalah website publik. `/masuk` dan alamat operasional tetap memakai sesi dan izin aplikasi. Halaman publik tidak membaca sesi petugas, memuat panel pesan, ataupun membuka data pasien. Modul operasional dimuat terpisah agar kunjungan publik lebih ringan.

## Pengelolaan

Buka **Pengaturan → Profil klinik → Website publik klinik**. Hak baca memakai `profil-klinik/lihat`, penyimpanan memakai `profil-klinik/perbaikan`. Isian mencakup publikasi, slug, domain, judul, pengantar, tentang klinik, warna, URL logo/gambar utama, alamat, WhatsApp, telepon, email, jam operasional, serta pilihan publikasi jadwal dan nama praktisi.

Nama klinik mengikuti Profil klinik. Layanan mengikuti master poli operasional. Jadwal mengikuti master jadwal aktif, masa berlaku, praktisi aktif dengan profil profesi aktif, dan poli operasional di fasilitas yang sama. Hari 1–7 berarti Senin–Minggu dan waktu mengikuti konvensi WIB aplikasi. Nama praktisi disembunyikan secara bawaan; pengelola dapat mengaktifkannya secara eksplisit. Tidak ada nomor SIP, akun, nomor rekam medis, pasien, atau penghuni bed pada DTO publik.

Bagian tentang, jadwal, lokasi, dan kontak hanya muncul bila datanya ada. Tombol menghubungi klinik memakai WhatsApp, kemudian telepon, kemudian email. Nomor WhatsApp dengan awalan 0 dinormalisasi ke 62. Jadwal dapat disaring berdasarkan hari dan layanan. Peta memuat alamat publik melalui Google Maps saat pengunjung mendekati bagian lokasi; petunjuk arah juga tersedia melalui tautan.

Ilustrasi bawaan menampilkan dokter dan pasien berhijab tanpa detail wajah. Alternatif ruang konsultasi tanpa orang tersedia lewat tombol pemilihan gambar. Keduanya merupakan ilustrasi, bukan dokumentasi fasilitas/staf nyata. Gambar dan logo khusus dapat memakai URL HTTPS atau aset `/asset/…` milik aplikasi. Pengunggahan berkas belum disertakan.

## Banyak klinik dan domain

- `/klinik/:slug` menampilkan satu profil yang dipublikasikan. Slug dan domain unik antar-fasilitas.
- `/` memilih profil aktif dengan domain yang sesuai hostname permintaan.
- Jika belum ada domain terpasang, root dapat memakai tepat satu website aktif tanpa domain pada instalasi tersebut. Jika beberapa website aktif, root tanpa pemetaan domain menghasilkan 404; sistem tidak menebak klinik.
- Domain perlu terlebih dahulu diarahkan ke hosting/server Klira beserta HTTPS di luar aplikasi. Menyimpan domain pada formulir tidak mengubah DNS atau sertifikat.
- Profil yang tidak diterbitkan tidak tersedia melalui API/slug/domain. Pengaturan selalu dibaca dan ditulis berdasarkan fasilitas dalam sesi, bukan ID masukan klien.

## Endpoint dan HTML awal

`GET /api/publik/klinik` dan `GET /api/publik/klinik/:slug` membaca DTO publik tanpa login. `GET /api/fasyankes/website` dan `PUT /api/fasyankes/website` mengelola konfigurasi dengan izin profil klinik. Domain/slug kembar menghasilkan 409, masukan tidak valid menghasilkan 400. Penyimpanan dan ringkasan riwayat profil memakai transaksi; audit dicatat melalui penampung audit aplikasi.

Pada build produksi, HTML awal root/slug berisi title, description, Open Graph, JSON-LD MedicalClinic, bootstrap data publik, serta informasi dasar untuk pengunjung tanpa JavaScript. Seluruh masukan di-escape dan karakter `<` dalam JSON diubah menjadi unicode escape untuk mencegah injeksi script. Halaman yang belum tersedia mendapat status HTTP 404 dan meta noindex. Respons publik memakai Cache-Control no-store.

## Migrasi dan kondisi awal

Migrasi `20261029120000_website_klinik` menambahkan konfigurasi per fasilitas. Fasilitas yang sudah ada mendapat konfigurasi awal dengan slug `klinik-ID`. Jika saat migrasi hanya ada satu fasilitas, websitenya langsung aktif; jika banyak fasilitas, publikasi dilakukan masing-masing oleh pengelola. Fasilitas yang dibuat setelahnya memiliki bawaan belum aktif hingga disimpan dari formulir.

Profil aktif menggunakan nama **Klinik Bhakti Rahayu** dan logo dari aset resmi klinik. Nama dan logo tetap dikelola per fasilitas. Kontak, alamat, serta jadwal mengikuti data yang diisi pengelola; tidak ada nomor kontak, nama dokter, jam, rating, atau testimoni yang dikarang.

## Verifikasi

Pengujian mencakup validasi konfigurasi/URL, pemilihan domain/slug, isolasi fasilitas, masa berlaku jadwal, pilihan publikasi nama, hak akses penyimpanan, penghindaran injeksi HTML/JSON, dan rute publik/internal. Pemeriksaan browser memakai database asli untuk root, serta fixture browser untuk tampilan lengkap dan formulir tanpa menulis data klinik. Screenshot fixture berisi data contoh dan bukan bukti data klinik sudah diisi.
