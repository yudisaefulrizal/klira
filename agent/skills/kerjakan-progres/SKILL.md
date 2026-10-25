---
name: kerjakan-progres
description: Menjalankan siklus bangun-periksa untuk butir di dokumen/progres.md sampai semua butir yang bisa dikerjakan selesai. Gunakan saat diminta membangun aplikasi klira dari progres.
---

Alur otomatis. Tidak perlu meminta persetujuan di tengah jalan; pengguna hanya meninjau hasil akhir.

Awal: bila folder proyek belum repositori git, jalankan `git init -b main`. Hanya satu cabang, `main`; jangan membuat cabang lain.

Ulangi:
1. Baca dokumen/progres.md. Pilih butir pertama yang Statusnya belum ✔ dan siap: kesiapan "Bisa dikerjakan", atau "Menunggu bagian lain" yang semua dependensinya sudah ✔ (butir yang lebih dulu di tabel dan induknya di kolom "Sub dari"). Lewati "Menunggu pihak ketiga".
2. Panggil agent pembuat-kode dengan butir itu.
3. Panggil agent pemeriksa-kode (konteks baru) dengan butir itu.
4. Bila LULUS: commit semua perubahan (kode, uji, progres.md) dengan pesan `<jenis>: <nama butir>`, lalu push ke remote bila ada (`git push -u origin main`); tanpa remote, lewati push. Lanjut ke butir berikutnya.
5. Bila TOLAK: kirim daftar masalah ke pembuat-kode untuk perbaikan, lalu periksa lagi. Maksimal 3 putaran per butir. Bila masih ditolak, tulis ke dokumen/laporan/ditolak.md (butir, masalah terakhir) lalu commit dengan pesan `[ditolak] <nama butir>` agar kondisinya terlacak, dan lanjut ke butir lain tanpa mencentang.

Berhenti bila tidak ada butir yang siap lagi. Lalu tulis ringkasan akhir ke dokumen/laporan/ringkasan.md: butir selesai, butir ditolak, butir yang dilewati karena menunggu pihak ketiga, dan pertanyaan dari dokumen/laporan/pertanyaan.md.

Aturan:
- Butir dikerjakan satu per satu, berurutan; jangan melompati dependensi.
- Hanya pemeriksa yang mengubah progres.md.
- Commit dan push diizinkan penuh dan dianjurkan satu commit per butir agar mudah dilacak dan dikembalikan. Akhiri pesan commit dengan baris `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Jangan `git push --force` dan jangan mengubah riwayat yang sudah di-push.
- Pembuat dan pemeriksa tidak boleh menghapus di luar proyek atau memasang paket di luar bagian 8.1 rancangan.
- Jangan menambah atau mengubah isi rancangan tanpa dicatat di dokumen/laporan/pertanyaan.md.
