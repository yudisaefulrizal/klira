# Database Klira

MySQL 8.0+ diakses melalui satu pool `mysql2` di `src/koneksi.js`. Konfigurasi dibaca dari `DATABASE_URL` atau `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, dan `DB_NAME`. Skrip npm memuat `.env` melalui `skrip/dengan-env.mjs`.

`src/data-access/` berisi fungsi SQL per tabel. Setiap fungsi menjalankan satu query dan menerima koneksi sebagai argumen terakhir, dengan pool sebagai bawaan. Nilai diikat melalui parameter `?`; aplikasi tidak menyusun SQL. Query gabungan boleh membaca relasi tabel, dengan hasil dipetakan oleh fungsi yang sama.

Operasi yang harus atomik memakai `transaksi(async koneksi => ...)` dan meneruskan koneksi tersebut ke setiap fungsi query. Pembungkus menangani commit, rollback transaksi aplikasi, dan pelepasan koneksi. Zona waktu sesi MySQL dan pembacaan tanggal driver diatur ke UTC pada pool. Perhitungan hari layanan WIB tetap dilakukan di domain aplikasi.

Komponen API disusun dalam `apps/api/src/modul/<komponen>/`:

- `data-access`: repositori dan pembacaan sumber data.
- `domain`: aturan layanan dan pemetaan hasil.
- `entry-points`: rute HTTP, webhook, dan WebSocket.

## Satu instalasi, satu fasyankes

Satu instalasi Klira (satu database) melayani tepat satu fasyankes. Klinik lain memakai instalasi dan database sendiri. Kolom `fasyankes_id` tetap ada di setiap tabel sebagai penjaga, tetapi login, koneksi WhatsApp/Instagram, serta cadangan, pemulihan, dan reset bekerja atas seluruh database, sehingga fasyankes kedua tidak boleh ada.

Aturan ini ditegakkan di dua tempat melalui `pastikanFasyankesTunggal()` (`src/fasyankes-tunggal.js`):

- Seed memakai fasyankes yang sudah ada, juga setelah kode registrasinya diganti lewat profil klinik, dan hanya membuat "Klinik Contoh" bila database masih kosong. Seed menolak database yang berisi lebih dari satu fasyankes.
- API menolak mulai bila database berisi lebih dari satu fasyankes.

Uji integrasi membuat fasyankes tambahan untuk menguji pembatasan data dan menghapusnya kembali. Bila uji terhenti di tengah dan fasyankes uji tertinggal, bangun ulang database pengembangan dengan `fresh` lalu seed.

## Cadangan dan pemulihan

```sh
npm run cadangan -w packages/db -- buat /jalur/klira-2026-11-16.sql
npm run cadangan -w packages/db -- pulihkan /jalur/klira-2026-11-16.sql --ya
```

`buat` menulis dump seluruh database ke berkas baru yang hanya bisa dibaca pemiliknya dan menolak menimpa berkas yang sudah ada. Berkas berisi data pasien: simpan terenkripsi dan di luar server. `pulihkan` menghapus seluruh data lalu memuat isi berkas, sehingga wajib ditegaskan dengan `--ya`; hentikan aplikasi lebih dulu dan mulai ulang sesudahnya. Reset ke keadaan awal dilakukan dengan `fresh` dan seed (lihat Migrasi).

Alat yang dipakai adalah `mysqldump` dan `mysql`, atau `mariadb-dump` dan `mariadb` bila yang terpasang paket MariaDB. Saat memuat dump, klien dijalankan dengan perintah pengakses sistem dimatikan (`--sandbox` pada MariaDB, `--system-command=OFF` pada MySQL), karena tanpa itu baris `\!` di dalam berkas dijalankan sebagai perintah shell di server.

Halaman Pengaturan hanya menyediakan unduhan cadangan. Pemulihan dan reset lewat web mati secara bawaan dan hanya hidup bila `KLIRA_PULIHKAN_LEWAT_WEB=1`; saat hidup, unggahan dibatasi 512 MB dan ditolak bila klien database tidak bisa mematikan perintah sistem. Setiap unduhan, pemulihan, dan reset dicatat di log audit sebelum dijalankan (entitas `cadangan`) dan di `riwayat_backup`.

## Migrasi

CLI berjalan langsung dengan Node.js:

```sh
npm run migrasi -w packages/db -- status
npm run migrasi -w packages/db -- baru tambah_kolom_pasien
npm run migrasi -w packages/db -- terapkan
```

Berkas `migrasi/0001_awal.sql` membentuk skema awal. Migrasi berikutnya memakai nomor berurutan dan nama huruf kecil dengan garis bawah. Isi berkas baru dengan SQL eksplisit yang diakhiri `;`. Untuk trigger, pemisah `DELIMITER` didukung. `baru` tidak membutuhkan koneksi database.

Tabel `_migrasi` mencatat nomor, nama, checksum SHA-256, waktu mulai, dan waktu selesai. `terapkan` hanya menjalankan berkas yang belum tercatat. Berkas yang telah diterapkan tidak boleh diubah, dihapus, atau diganti namanya; tambahkan migrasi baru untuk perubahan berikutnya. `status` menampilkan migrasi belum diterapkan, selesai, berubah, hilang, atau belum selesai.

`terapkan`, `status`, dan `fresh` menggunakan `GET_LOCK` pada koneksi yang sama selama operasi. Proses lain menunggu maksimal 30 detik. Pembuatan nomor berkas memakai pengunci lokal `.nomor-migrasi.lock`; jika proses pembuat berkas mati, periksa proses dan nomor berkas sebelum menghapus pengunci yang tertinggal.

DDL MySQL dapat melakukan commit sendiri. Jika satu pernyataan gagal, migrasi dicatat belum selesai dan proses berikutnya berhenti. Periksa perubahan yang sudah terjadi, selesaikan SQL yang tersisa secara terkontrol, lalu sesuaikan catatan setelah skema benar-benar selesai. Tidak ada `down()` atau rollback migrasi otomatis.

Untuk menghapus **seluruh tabel database yang dikonfigurasi** dan membentuk ulang skema dev:

```sh
NODE_ENV=development npm run migrasi -w packages/db -- fresh
npm run seed -w packages/db
```

`fresh` hanya berjalan dengan `NODE_ENV=development` atau `test`, dan menolak produksi maupun lingkungan yang belum ditentukan. Seeder terpisah; `terapkan` dan `fresh` tidak otomatis mengisi data contoh.

## Pengujian

`npm test` menjalankan uji tanpa mengaktifkan pengujian database. `npm run test:db` menjalankan `fresh` dan seed melalui uji skema terlebih dahulu, kemudian uji integrasi pada database yang dikonfigurasi. Perintah ini menghapus data dev dan menolak lingkungan produksi. Jangan menjalankannya bersamaan dengan aplikasi yang memakai database tersebut.

Fixture query berada di `src/uji/data-access/` dan hanya diimpor pengujian melalui `@klira/db/uji`.

## Akun demo

```sh
NODE_ENV=development npm run seed:demo -w packages/db
```

Membuat 14 akun sesuai [daftar akun demo](../../dokumen/akun-demo.pdf): `pimpinan`, `dokter`, `dokter-gigi`, `perawat`, `bidan`, `pendaftaran`, `rekam-medis`, `kasir`, `apoteker`, `lab`, `admin-it`, `pdp`, `auditor`, dan `admin-vendor`.

Kata sandi bawaan seluruh akun demo adalah `admin123`, dapat diganti melalui `KLIRA_SANDI_DEMO` saat pembuatan. Nama tampilan dan profil profesi mengikuti katalog `AKUN_DEMO` di packages/shared, yang juga dipakai skrip data demo. Akun dapat langsung dipakai tanpa pergantian kredensial awal. Seed ulang melewati akun yang sudah dibuat dan tidak mengubah kata sandinya. Seeder ini terpisah dari seed biasa dan hanya menerima lingkungan development/test. Akun Pimpinan pertama dari seed biasa tetap mengikuti konfigurasi kredensial awal.
