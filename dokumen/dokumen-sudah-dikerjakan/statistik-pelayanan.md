# Statistik pelayanan

Menu **Statistik pelayanan** (`/statistik`) memakai izin lihat `kunjungan` atau `rekam-medis`. Semua kueri dibatasi fasyankes pengguna. Dashboard hanya mencakup rawat jalan; antrean batal dikecualikan. Tidak menampilkan nama pasien, isi rekam medis, maupun nominal keuangan.

## Sumber dan definisi

- Riwayat tahap ditulis oleh trigger MySQL pada INSERT kunjungan dan setiap perubahan `tahap_layanan`, dalam transaksi yang sama. Jalur skrining, pemeriksaan, farmasi, kasir, dan konversi ke rawat inap tercakup. UPDATE tanpa perubahan tahap tidak membuat riwayat baru.
- Riwayat mulai tersedia sejak migrasi `20261026090000_statistik_alur`. Waktu masuk tahap untuk data lama tidak diisi mundur. Pasien aktif tanpa riwayat tetap dihitung, dengan penanda durasi tidak tersedia.
- **Durasi tahap** = waktu keluar dikurangi waktu masuk tahap, termasuk menunggu dan pengerjaan. Sistem belum menyediakan waktu mulai pengerjaan terpisah pada setiap tahap, sehingga durasi ini tidak diberi label waktu tunggu murni.
- Median dan P90 memakai nearest rank pada tahap yang **selesai dalam periode**, termasuk kunjungan yang didaftarkan sebelum periode. Nilai tanpa sampel ditampilkan sebagai tidak tersedia.
- Jumlah aktif dan durasi terlama mencakup semua kunjungan rawat jalan yang belum ditutup, termasuk yang datang sebelum hari ini. Angka masuk/selesai memakai 60 menit terakhir; bukan rata-rata per jam sepanjang hari.
- Indikasi perlu perhatian muncul bila ada pasien aktif melewati acuan, median melebihi acuan, atau antrean aktif memiliki arus masuk lebih besar daripada arus selesai. Ini adalah sinyal operasional yang perlu ditelaah, bukan kesimpulan penyebab hambatan.
- Acuan awal: skrining 15, pemeriksaan 30, farmasi 20, pembayaran 10 menit. Acuan bersumber dari `TAHAP_STATISTIK` di `packages/shared/src/statistik.ts`; bukan standar klinis dan belum memiliki formulir pengaturan.
- Grafik penumpukan menghitung interval riwayat yang masih terbuka pada delapan titik waktu terakhir. Data sebelum pencatatan tersedia bisa kurang lengkap.
- Daftar tindak lanjut menampilkan maksimal 20 pasien dengan durasi tahap terlama di atas acuan. Nomor antrean disertai poli untuk membedakan nomor antarunit.
- Kunjungan dan pasien unik dihitung menurut waktu mulai kunjungan dalam periode. Grafik hari dan peta hari/jam memakai rata-rata berdasarkan jumlah kemunculan setiap hari dalam periode, termasuk hari tanpa kunjungan.
- Tanggal, jam, dan pergantian hari memakai Asia/Jakarta. Filter maksimal 31 hari, hingga hari ini. Filter poli berlaku pada seluruh statistik. Filter tahap menyaring daftar tindak lanjut, dengan kartu tahap terpilih ditandai.

## Aktivasi

Jalankan `npm run migrasi:terapkan -w packages/db`, lalu `npm run build` dan jalankan ulang proses aplikasi sesuai cara operasional proyek. Migrasi membutuhkan hak CREATE TRIGGER pada MySQL. Dashboard mengambil ulang data tiap 60 detik dan menyediakan tombol Perbarui. Respons API menggunakan Cache-Control: no-store.

## Verifikasi

Uji unit `hitung.test.ts` memeriksa persentil, WIB, kunjungan batal, riwayat lama, normalisasi hari, dan snapshot tahap. Uji rute `rute.test.ts` memeriksa autentikasi, izin, filter tidak valid, scope fasyankes/poli, dan hasil kosong. Trigger dapat diverifikasi melalui transaksi uji lalu rollback; tidak perlu mengubah kunjungan nyata.
