---
name: kerjakan-progres
description: Menjalankan siklus bangun-periksa untuk butir di dokumen/progres.md sampai semua butir yang bisa dikerjakan selesai. Gunakan saat diminta membangun aplikasi klira dari progres.
---

Alur otomatis. Tidak perlu meminta persetujuan di tengah jalan; pengguna hanya meninjau hasil akhir.

Awal: bila folder proyek belum repositori git, jalankan `git init -b main`. Hanya satu cabang, `main`; jangan membuat cabang lain.

Tahap A, BANGUN SEMUA dulu (tanpa pemeriksa di tengah jalan). Ulangi per kelompok (sampai 10 butir berdekatan yang siap, mis. satu halaman beserta modal-modalnya):
1. Baca dokumen/progres.md. Kumpulkan kelompok: butir berurutan yang Statusnya belum ✔ dan siap (kesiapan "Bisa dikerjakan", atau "Menunggu bagian lain" yang dependensinya sudah dibangun atau ada di kelompok yang sama dan lebih dulu; butir yang sudah dibangun tetapi belum dicentang dihitung terbangun). Lewati "Menunggu pihak ketiga".
2. Panggil agent pembuat-kode untuk kelompok itu (boleh paralel bila independen dan tidak menyentuh berkas yang sama). Pembuat wajib menjalankan typecheck, lint, seluruh uji, dan build sampai bersih sebelum selesai. Pembuat TIDAK mencentang progres.md.
3. Commit kelompok (satu commit, pesan menyebut butirnya, awalan `bangun:`), push, terapkan migrasi baru ke klira_dev, bangun ulang server pengguna (skrip restart). Lanjut ke kelompok berikutnya tanpa pemeriksaan.

Tahap B, PERIKSA kode yang dibuat (sekali di akhir, setelah semua butir yang siap dibangun):
4. Panggil agent pemeriksa-kode (boleh beberapa paralel per domain). Cukup membaca kode yang dibuat (git diff dari commit awal tahap A) dan mencocokkannya dengan rancangan dan aturan Reusability; tidak perlu menjalankan uji/build atau peramban (pembuat sudah menjalankannya). Hasil: daftar temuan per butir (file, masalah) dan butir yang tidak bermasalah dicentang di progres.md.

Tahap C, PERBAIKI kode yang dibuat:
5. Panggil pembuat-kode untuk memperbaiki semua temuan tahap B. Tanpa pemeriksaan ulang dan tanpa batas putaran. Lalu commit dan push (pesan `perbaiki: <ringkasan>`) dan bangun ulang server. Butir yang diperbaiki dicentang oleh skill setelah perbaikan selesai.

Berhenti bila tidak ada butir yang siap lagi. Lalu tulis ringkasan akhir ke dokumen/laporan/ringkasan.md: butir selesai, butir ditolak, butir yang dilewati karena menunggu pihak ketiga, dan pertanyaan dari dokumen/laporan/pertanyaan.md.

Aturan:
- Kelompok dikerjakan berurutan; di dalam kelompok jangan melompati dependensi. Centang oleh pemeriksa (tahap B) atau oleh skill setelah perbaikan (tahap C).
- Commit dan push diizinkan penuh dan dianjurkan satu commit per butir agar mudah dilacak dan dikembalikan. Akhiri pesan commit dengan baris `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Jangan `git push --force` dan jangan mengubah riwayat yang sudah di-push.
- Pembuat dan pemeriksa tidak boleh menghapus di luar proyek atau memasang paket di luar bagian 8.1 rancangan.
- Jangan menambah atau mengubah isi rancangan tanpa dicatat di dokumen/laporan/pertanyaan.md.
