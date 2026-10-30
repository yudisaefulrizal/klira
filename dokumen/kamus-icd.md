# Kamus ICD pada pemeriksaan

Diagnosis memiliki tombol Kamus ICD-10 dan tindakan memiliki tombol Kamus ICD-9-CM. Membuka kamus langsung menampilkan referensi aktif yang tersimpan di aplikasi, berurutan menurut kode, tanpa isian pencarian. Indeks huruf/angka membatasi awalan kode; tombol Sebelumnya/Berikutnya menjelajah halaman berikutnya. Pilihan langsung masuk ke daftar diagnosis atau tindakan dan menutup panel. Pencarian cepat pada formulir utama tetap terpisah.

API GET /api/terminologi/kamus menerima sistem, halaman, ukuran (maksimal 50), dan awalan opsional satu huruf/angka. Izin membacanya mengikuti terminologi klinis yang sudah ada. ICD-10 dan ICD-9-CM dibaca dari JSON statis hasil konversi referensi primer SATUSEHAT. Kamus dan pencarian ICD memakai sumber yang sama, tanpa query tabel kode_terminologi. Kode contoh dalam database tidak digunakan untuk hasil ICD; sistem terminologi selain ICD tetap mengikuti master database. Bagian tanpa referensi menampilkan keadaan kosong.


## Referensi primer lokal

Salinan resmi ICD-10 dan ICD-9-CM yang ditautkan SATUSEHAT telah disimpan dalam folder `dokumen/referensi primer`. Lihat [catatan sumber dan verifikasi](<referensi primer/icd-satusehat-2010.md>) serta [manifest unduhan](<referensi primer/manifest-icd-satusehat-2010.json>). Salinan 30 Oktober 2026 memuat 18.542 kode ICD-10 dan 4.626 kode ICD-9-CM versi 2010. Berkas ini menjadi acuan primer untuk pengolahan referensi kamus berikutnya.


## JSON statis untuk aplikasi

- `apps/api/src/modul/klinis/data/icd10-2010.json`: 18.542 kode.
- `apps/api/src/modul/klinis/data/icd9cm-2010.json`: 4.626 kode.
- `apps/api/src/modul/klinis/terminologi-icd.ts`: pemuatan sekali, penjelajahan/paginasi, serta pencarian kode/nama tanpa database untuk kedua sistem ICD.

JSON memuat versi, tautan sumber, nama berkas primer, checksum SHA-256 berkas primer, jumlah kode, dan pasangan kode/nama. Nama dipertahankan sesuai sumber bahasa Inggris; tidak ada terjemahan atau definisi tambahan buatan. Kode termasuk kategori dan rincian sebagaimana tercantum dalam berkas sumber; penyimpanan sebagai string mempertahankan titik dan nol di depan.

Untuk memperbarui JSON dari salinan primer yang sudah diverifikasi, jalankan `python3 skrip/buat-json-icd.py` (memerlukan `openpyxl`). Skrip menolak sumber dengan checksum yang berbeda dari manifest, memeriksa kolom/versi/keunikan, lalu menulis JSON berurutan menurut kode. `resolveJsonModule` memastikan `tsc` mengemas salinan JSON ke `apps/api/dist/modul/klinis/data`; aplikasi tidak memerlukan XLSX atau Python saat berjalan. API tetap dipakai untuk izin dan pengiriman halaman; berkas lengkap tidak dimuat ke browser.

Perubahan ini tidak memigrasikan atau menghapus data rekam medis maupun tabel terminologi. Pembaruan versi referensi dilakukan lewat penggantian sumber primer/manifest secara sengaja dan regenerasi JSON.
