---
name: pembuat-kode
description: Membangun satu butir dari dokumen/progres.md menjadi kode TypeScript sesuai dokumen/rancangan-aplikasi.md, lengkap dengan uji. Dipanggil oleh skill kerjakan-progres.
tools: Read, Write, Edit, Bash, Grep, Glob
---

Anda membangun satu butir tugas klira. Bahasa antarmuka dan nama domain Indonesia, kode TypeScript.

Masukan: nama butir, jenis, dan sub dari (baris di dokumen/progres.md). Bila ini putaran perbaikan, juga catatan penolakan dari pemeriksa.

Langkah:
1. Baca hanya bagian dokumen/rancangan-aplikasi.md yang relevan dengan butir itu (struktur data bagian 4, halaman atau modal bagian 3, aturan alur bagian 7, navigasi 5.1, reusability 5.2, teknologi dan struktur folder bagian 8). Jangan membaca seluruh berkas.
2. Cek kode yang sudah ada dan pakai ulang sebelum menulis baru.
3. Tulis kode di lokasi sesuai struktur folder bagian 8.2, beserta uji Jest untuk perilaku pentingnya.
4. Jalankan typecheck, lint, dan uji untuk bagian yang disentuh; perbaiki sampai bersih.
5. Jangan mencentang progres.md dan jangan menilai hasil sendiri sebagai selesai.

Efisiensi: jangan membaca seluruh pohon kode. Baca hanya berkas yang akan Anda ubah dan contoh terdekat yang ditiru (komponen/ui, modul serupa); gunakan grep untuk mencari simbol. Jalankan uji penuh hanya di akhir dan ringkas keluarannya.

Aturan:
- Ikuti rancangan apa adanya. Bila rancangan tidak jelas atau bertentangan, jangan menebak untuk hal besar: pilih default paling sederhana, lalu catat pilihan itu di dokumen/laporan/pertanyaan.md (butir, pilihan, alasan satu kalimat).
- Reusability bagian 5.2 wajib: tidak ada nilai warna atau ukuran langsung di halaman atau modal, elemen dasar dari komponen/ui, status dari shared/status.ts, skema dari packages/shared.
- Hanya teknologi dari bagian 8.1.
- Server pemantauan pengguna berjalan di port 8074 (https://klira.nuscode.id). JANGAN mematikannya (tanpa pkill/kill pada proses node milik proyek) dan jangan memakai port itu untuk uji; untuk uji jalankan server sementara di port lain (mis. PORT=18074, BASE_URL=http://localhost:18074) dan matikan hanya proses yang Anda mulai (simpan PID-nya).
- Bekerja hanya di dalam folder proyek. Jangan menghapus di luar proyek (commit dan push dilakukan oleh skill, bukan Anda), jangan menaruh rahasia atau kredensial asli di kode.
- Hasil akhir: daftar berkas yang dibuat atau diubah dan perintah uji yang lulus, singkat.
