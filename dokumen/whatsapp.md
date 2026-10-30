# WhatsApp di Klira

Implementasi awal memakai Baileys langsung dalam `apps/whatsapp`, tanpa n8n atau penyedia gateway. Satu nomor untuk satu instalasi, dimiliki fasyankes yang pertama menghubungkannya. Proyek NC-WA digunakan sebagai referensi; instalasi dan sesinya tidak diubah.

## Menjalankan

1. Jalankan migrasi dengan `npm run migrasi:terapkan -w packages/db` dan build dengan `npm run build`.
2. Pastikan `KUNCI_ENKRIPSI` yang sudah dipakai Klira tetap tersedia. Sesi, teks pesan, dan lampiran dienkripsi menggunakan kunci ini. Backup database harus disertai pengamanan kunci secara terpisah.
3. `npm run dev` dan `npm start` menjalankan API serta engine dalam proses terpisah. Untuk deployment dengan pengawas proses sendiri, jalankan `node skrip/dengan-env.mjs node apps/whatsapp/dist/main.js` dari akar proyek. Engine tidak memakai port HTTP tambahan. Pembaruan engine → API → dashboard memakai WebSocket; dashboard mengambil snapshot melalui API hanya saat dibuka, tersambung ulang, atau menerima kejadian perubahan. Tidak ada polling pesan dari halaman. Reverse proxy harus meneruskan upgrade WebSocket pada `/api/whatsapp/ws` dan kanal engine `/api/whatsapp/engine-ws`. Jangan menjalankan ulang API produksi yang sedang dipakai hanya untuk menguji engine.
4. Pada Pengaturan → Pengguna dan akses/Jenis akun, berikan satu izin **WhatsApp** ke akun yang memerlukan akses. Izin ini mencakup seluruh fitur WhatsApp: inbox, balasan, lampiran, status, penanggung jawab, QR, dan pengelolaan koneksi. Akses data pasien tetap mengikuti izin pasien. Hak WhatsApp lama disatukan oleh migrasi; periode pemberian/pengurangan izin per akun tetap dipertahankan.
5. Buka Pengaturan → WhatsApp → Hubungkan WhatsApp. Pindai QR dari menu Perangkat tertaut pada HP.

## Pemakaian

- Tombol pesan bulat melayang di kanan bawah, tetap terlihat saat halaman digulir, dan membuka jendela chat di atasnya tanpa mengunci halaman. Jendela dapat diminimalkan atau diperluas; pada ponsel chat memenuhi layar. Badge menghitung percakapan belum dibaca untuk akun masing-masing.
- Menu Pesan menampilkan inbox tiga kolom: daftar percakapan, chat utama, dan info kontak. Panel info menampilkan status/penanggung jawab, tombol selesai/buka kembali, dan tautan pasien. Penautan memerlukan izin pasien, pemilihan pasien, serta konfirmasi; tautan ke pasien lain tidak ditimpa. Pada HP, daftar, chat, dan info kontak dibuka bergantian. Pencarian dalam chat hanya mencakup 10 pesan yang tersimpan. Filter Semua, Belum dibaca, dan Belum selesai serta pencarian berlaku pada daftar yang sudah dimuat; gunakan Muat percakapan lainnya untuk daftar berikutnya.
- Pilih percakapan untuk membaca atau membalas teks, gambar, PDF, audio, dan video. Lampiran maksimal 8 MB. Gambar, video, dan audio dapat dilihat/diputar langsung. Dokumen tetap diunduh. Semua lampiran melewati API yang memeriksa sesi dan fasyankes, bukan URL publik.
- Tombol WhatsApp pada baris pasien membuka pemilihan kontak wali/keluarga atau pengisian nomor. Nomor tidak diasumsikan sebagai milik pasien dan tautan ke pasien lain tidak ditimpa.
- Draf teks bertahan ketika panel ditutup atau berpindah halaman, selama aplikasi belum dimuat ulang. Tidak dibagikan antar akun. Lampiran yang belum dikirim harus dipilih ulang jika panel ditutup.
- Kolom balasan ringkas: Enter mengirim, Shift+Enter membuat baris baru. Header menampilkan status dan penanggung jawab secara ringkas.
- Percakapan memiliki status Baru/Diproses/Selesai dan penanggung jawab. Pesan masuk baru membuka kembali percakapan yang selesai.
- Tanda belum dibaca bersifat per akun Klira. Membuka percakapan di Klira belum mengirim tanda baca ke HP lawan bicara.

## Perilaku engine

Antrean kirim disimpan di database. Engine memakai sewa kepemilikan untuk mencegah dua proses mengelola sesi bersamaan. Pesan yang sempat berstatus mengirim ketika engine mati ditandai gagal/belum terkonfirmasi, dan tidak dikirim ulang otomatis. Periksa WhatsApp sebelum mengulang untuk menghindari balasan ganda. Pengiriman yang masih berstatus antre akan dilanjutkan saat koneksi pulih. Memutuskan koneksi secara sengaja membatalkan antrean yang belum diproses.

Pesan dari HP/perangkat tertaut juga ditangkap. ID pesan WhatsApp dipakai untuk mencegah duplikasi. Riwayat penuh sebelum koneksi tidak diimpor; pesan selama engine mati tidak dijamin seluruhnya diterima kembali. Hanya percakapan pribadi yang dikelola. Pesan grup, status, broadcast, dan channel diabaikan; percakapan nonpribadi tidak muncul di inbox atau badge dan tidak dapat dibalas melalui API. Status terkirim/diterima/dibaca diperbarui jika event tersedia dari WhatsApp; penanda belum dibaca Klira terpisah dari status penyelesaian pekerjaan.

Baileys bukan API WhatsApp resmi. Perubahan protokol dapat memerlukan pembaruan engine. Versi dipatok mengikuti fondasi NC-WA yang diperiksa.

## Retensi dan pembaruan langsung

Server menyimpan 10 pesan selesai terakhir per kontak, gabungan masuk dan keluar. Ketika pesan baru disimpan, pesan paling lama yang melewati batas dihapus dalam transaksi yang sama. Lampiran yang sudah tidak dipakai ikut dihapus. Pesan antre/mengirim dilindungi sampai pengiriman selesai; antrean bukan bagian dari sepuluh riwayat selesai. Setelah status akhir tersimpan, batas diberlakukan kembali. Jumlah fisik sementara dapat melebihi 10 bila masih ada antrean yang belum selesai.

Pemangkasan juga berlaku pada riwayat lama saat engine dimulai dan saat antrean dibatalkan. Tidak ada penghapusan pesan di HP atau panggilan hapus pesan WhatsApp. Tampilan hanya menampilkan maksimal 10 pesan terakhir, tanpa memuat riwayat lebih lama. Pesan yang belum sempat dibaca tetap dapat terhapus jika melewati batas ini, sesuai fungsi Klira sebagai alat respons cepat. Riwayat lengkap tetap di HP operasional.

Engine berjalan terpisah dari browser dan tetap menyimpan pesan saat halaman ditutup, selama engine/server hidup dan koneksi WhatsApp aktif. WebSocket browser memerlukan sesi dan satu izin WhatsApp, memeriksa origin serta fasyankes, dan memeriksa ulang akses pada heartbeat. Kanal engine diautentikasi dengan token HMAC yang diturunkan dari kunci enkripsi; isi pesan tidak dikirim melalui kanal notifikasi. Saat koneksi pulih, dashboard memuat ulang snapshot terbaru secara otomatis.

## Verifikasi

Typecheck, lint, build, pengujian unit/rute, dan pemeriksaan browser dilakukan tanpa menghubungkan nomor asli. Pengujian database destruktif proyek tetap dilewati. Uji penerimaan dengan HP: pindai QR, terima pesan, balas dari Klira dan HP, cek lampiran, cek dua akun, putus jaringan lalu pulihkan, dan restart engine. Jangan menyatakan integrasi WhatsApp langsung terverifikasi sebelum langkah ini berhasil.

Foto profil kontak ditampilkan pada daftar percakapan dan header chat. Engine mengambil satu foto pada satu waktu di latar belakang melalui Baileys, termasuk kontak lama, tanpa menunda pesan. URL disegarkan setiap 24 jam. Foto kosong atau dibatasi privasi menggunakan inisial; gangguan sementara mempertahankan foto lama dan dicoba kembali setelah 15 menit. Hasil pengambilan diabaikan jika sesi, generasi koneksi, fasyankes, atau pemilik engine berubah. Migrasi `20261026160000_whatsapp_foto_profil` menambahkan URL foto serta jadwal pemeriksaan berikutnya.

Inbox menggunakan filter Semua, Belum dibaca, dan Dibaca. Status penanganan Baru/Diproses/Selesai tidak digunakan lagi. Penanda baca tetap berlaku per pengguna Klira dan diperbarui saat percakapan dibuka.


## Bersihkan pesan

Tombol **Bersihkan pesan** tersedia pada bagian koneksi WhatsApp, baik di halaman Pesan maupun panel chat. Setelah konfirmasi, seluruh percakapan, pesan, penanda baca, dan lampiran lokal kanal WhatsApp milik fasyankes pengguna dihapus. Koneksi akun, data pasien, kanal lain, dan pesan di aplikasi WhatsApp tetap tersedia.

Endpoint `DELETE /api/whatsapp/percakapan` memerlukan sesi, izin `whatsapp:lihat`, dan badan `{"konfirmasi":"whatsapp"}`. Transaksi mengunci percakapan sebelum penghapusan dan menulis audit dalam transaksi yang sama. Jika masih ada pesan berstatus antre/mengirim, endpoint mengembalikan 409 tanpa menghapus data. Pembaruan WebSocket mengosongkan percakapan aktif, draf balasan, dan penanda belum dibaca pada klien kanal tersebut. Respons daftar lama diabaikan setelah pembersihan.


### Keluar akun

Aksi **Keluar** memutus koneksi WhatsApp dan membersihkan seluruh percakapan, pesan (termasuk antrean), penanda baca, serta lampiran lokal fasyankes dalam satu transaksi dengan audit. Identitas akun lama dihapus dari konfigurasi lokal dan disembunyikan pada respons koneksi serta antarmuka saat tidak terhubung. Klien lain menerima pembaruan untuk mengosongkan inbox dan draf. Pesan di aplikasi WhatsApp tetap tersedia.

Engine memeriksa sesi dan generasi koneksi dalam transaksi sebelum menyimpan pesan masuk beserta lampirannya, sehingga pekerjaan sesi lama yang tertunda tidak mengisi kembali inbox setelah logout.
