---
name: kerjakan-progres
description: Menjalankan siklus bangun-periksa untuk butir di dokumen/progres.md sampai semua butir yang bisa dikerjakan selesai. Gunakan saat diminta membangun aplikasi klira dari progres.
---

Alur otomatis. Tidak perlu meminta persetujuan di tengah jalan; pengguna hanya meninjau hasil akhir.

Awal: bila folder proyek belum repositori git, jalankan `git init -b main`. Hanya satu cabang, `main`; jangan membuat cabang lain.

Ulangi per KELOMPOK (sampai 10 butir yang berdekatan di tabel dan siap, mis. satu halaman beserta modal-modalnya):
1. Baca dokumen/progres.md. Kumpulkan kelompok: butir berurutan yang Statusnya belum ✔ dan siap (kesiapan "Bisa dikerjakan", atau "Menunggu bagian lain" yang dependensinya sudah ✔ atau ada di kelompok yang sama dan lebih dulu). Lewati "Menunggu pihak ketiga".
2. Panggil agent pembuat-kode untuk kelompok itu (satu instruksi lengkap per kelompok; boleh dibagi ke beberapa pembuat paralel bila butirnya independen dan tidak menyentuh berkas yang sama). Pembuat TIDAK commit dan TIDAK mencentang.
3. Setelah semua butir kelompok dibangun, panggil agent pemeriksa-kode (konteks baru; boleh beberapa pemeriksa paralel, masing-masing 3 sampai 5 butir) dengan daftar butir kelompok. Pemeriksa menilai dan mencentang tiap butir sendiri-sendiri, dengan ketelitian yang sama seperti sebelumnya (jalankan seluruh uji, cocokkan rancangan, aturan Reusability, buktikan perilaku antarmuka di Chrome headless untuk komponen interaktif baru).
4. Commit semua yang lulus dalam satu commit untuk kelompok, dengan pesan `<ringkasan kelompok>` yang menyebut butirnya, lalu push (`git push -u origin main`), terapkan migrasi baru ke klira_dev, dan bangun ulang server pengguna (skrip restart).
5. Butir yang TOLAK: kirim daftar masalah per butir ke pembuat untuk perbaikan, lalu periksa lagi hanya butir itu. Maksimal 3 putaran per butir; bila temuan berupa cacat perilaku nyata (bukan kosmetik) boleh ditambah putaran. Bila tetap ditolak, tulis ke dokumen/laporan/ditolak.md (butir, masalah terakhir), commit dengan awalan `[ditolak]`, dan lanjut tanpa mencentang.

Berhenti bila tidak ada butir yang siap lagi. Lalu tulis ringkasan akhir ke dokumen/laporan/ringkasan.md: butir selesai, butir ditolak, butir yang dilewati karena menunggu pihak ketiga, dan pertanyaan dari dokumen/laporan/pertanyaan.md.

Aturan:
- Kelompok dikerjakan berurutan; di dalam kelompok jangan melompati dependensi.
- Hanya pemeriksa yang mengubah progres.md.
- Commit dan push diizinkan penuh dan dianjurkan satu commit per butir agar mudah dilacak dan dikembalikan. Akhiri pesan commit dengan baris `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Jangan `git push --force` dan jangan mengubah riwayat yang sudah di-push.
- Pembuat dan pemeriksa tidak boleh menghapus di luar proyek atau memasang paket di luar bagian 8.1 rancangan.
- Jangan menambah atau mengubah isi rancangan tanpa dicatat di dokumen/laporan/pertanyaan.md.
