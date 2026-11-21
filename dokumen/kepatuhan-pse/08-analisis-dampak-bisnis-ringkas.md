# Analisis Dampak Bisnis (BIA) Ringkas: Klira

Disusun: [tanggal] · Penyusun: [nama] · Dipakai sebagai data dukung penilaian mandiri kategorisasi sistem elektronik (soal 8-10, BSSN)

## 1. Sistem

Klira: sistem informasi klinik untuk petugas Klinik Bhakti Rahayu (pendaftaran, antrean, rekam medis elektronik, farmasi, penunjang, kasir dan klaim, pesan WhatsApp dan Instagram, integrasi SATUSEHAT dan BPJS PCare). Akun hanya untuk petugas klinik. Pasien tidak punya akun.

## 2. Proses dan akibat bila sistem tidak tersedia

Isi kolom `[...]` dengan kondisi sebenarnya di klinik.

| Proses | Akibat bila Klira mati | Cara kerja sementara | Batas tahan [jam] |
|---|---|---|---|
| Pendaftaran dan antrean | Pasien dicatat manual, antrean lambat | Buku register dan nomor antrean manual | [ ] |
| Pemeriksaan dan rekam medis | Riwayat pasien tidak terlihat; catatan ditulis di kertas lalu diinput | Formulir kertas cadangan | [ ] |
| Resep dan farmasi | Pengecekan riwayat alergi dan stok lebih lambat | Resep tertulis, stok dihitung manual | [ ] |
| Kasir dan klaim | Tagihan dicatat manual | Kuitansi manual | [ ] |
| Pesan WhatsApp dan Instagram | Pesan masuk tidak terbaca di Klira | Buka aplikasi langsung | [ ] |

## 3. Dampak pada soal kategorisasi

- **Soal 8 (kekritisan proses):** Layanan klinik tetap berjalan manual saat Klira mati; dampaknya pada operasional klinik, bukan pada layanan publik luas. Jawaban: *proses yang hanya berdampak pada bisnis perusahaan* [konfirmasi bahwa prosedur manual benar-benar ada].
- **Soal 9 (dampak kegagalan):** Klinik tunggal; kegagalan tidak membuat layanan publik tidak tersedia pada skala kabupaten, provinsi, atau nasional. Opsi terendah dipilih karena formulir tidak menyediakan "tidak ada dampak publik".
- **Soal 10 (potensi kerugian):** Insiden keamanan dapat menimbulkan kerugian finansial dan reputasi dan membuka data kesehatan; tidak langsung menimbulkan korban jiwa.

## 4. Target pemulihan

| Ukuran | Target | Dasar |
|---|---|---|
| RTO (waktu pulih sistem) | [ ] jam | [ ] |
| RPO (batas kehilangan data) | [ ] jam | Frekuensi cadangan manual [harian/mingguan] |

## 5. Ketergantungan

Server dan jaringan [penyedia], database MySQL/MariaDB, cadangan manual oleh operator, integrasi SATUSEHAT dan PCare, Meta (WhatsApp, Instagram), Cloudflare.

## 6. Pemeriksaan ulang

Direvisi setahun sekali atau saat ada perubahan besar sistem.
