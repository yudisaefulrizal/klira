# Ringkasan pembangunan

Semua butir yang bisa dikerjakan sudah dibangun dan dicentang di `dokumen/progres.md` (66 butir ✔), dengan 608 uji lolos dan lint bersih.

## Sudah dibangun
Fondasi, Daftar pasien, registrasi, kunjungan, pemeriksaan klinis, penunjang, persetujuan tindakan, farmasi, kasir, rekam medis (perbaikan, pengkodean, arsip, resume dan surat, pembukaan, penyampaian, laporan), rawat inap, klaim JKN/BPJS, pelindungan data pribadi, dan Beranda tugas.

## Belum dikerjakan (menunggu pihak ketiga)
- Master terminologi resmi (ICD-10, ICD-9 CM, LOINC, SNOMED, UCUM): saat ini hanya data contoh.
- SATUSEHAT: halaman, konfigurasi, kirim otomatis dan antrean, sinkronisasi master dan KFA, KYC, registrasi sistem.
- Order tindakan dan pemberian obat rawat inap.

## Catatan
- Centang ✔ berarti lolos uji otomatis; pemeriksaan kode independen (Tahap B) belum dijalankan.
- Keputusan agent ada di `dokumen/laporan/pertanyaan.md`. Penghapusan data fisik saat pemusnahan sengaja tidak diotomatisasi (aplikasi hanya mencatat prosedur dan berita acara); mohon diputuskan.

## Pembaruan hasil presentasi 10 November 2026

Rencana: `dokumen/renca-update-hasil-persentasi/rencana-perubahan.md`. Kelima butir dibangun (tahap A), diperiksa independen (tahap B), temuan diperbaiki (tahap C), dan dicentang:

- P1 Pilih dokter saat pendaftaran (dokter terfilter poli, server menolak dokter tanpa jadwal di poli itu).
- P4 Satu tagihan dibayar 1–3 metode dalam satu transaksi; kembalian hanya dari tunai.
- P2 Cara bayar Umum/JKN/Asuransi lain; data penjamin (nomor kartu JKN, nama asuransi, nomor polis); kelas hak JKN dan FKTP terdaftar dihapus.
- P5 Tarif tindakan berkode ICD-9-CM (harga boleh kosong, kode TND otomatis), tindakan dokter otomatis menjadi item tagihan, kasir dapat mengubah harga per kunjungan dengan alasan.
- P3 Dokter menulis resep teks bebas; apoteker mengisi item obat saat telaah dan tagihan obat dibuat saat itu.

Migrasi baru: `20261111090000_penjamin_asuransi`, `20261111110000_tindakan_klinik`, `20261111130000_resep_teks` (sudah diterapkan ke klira_dev).

Catatan:
- Uji integrasi database dilewati (tanpa `DATABASE_URL_UJI`); belum diuji di peramban.
- Kegagalan bawaan yang belum disentuh: lint 19 galat (daftar-pasien.tsx:80, require() di output/*.cjs), uji gagal penyaring-pasien.test.ts (3) dan keadaan-lab.test.ts (1).
- `dokumen/panduan-klira.pdf` dan skrip `output/pembayaran-farmasi/periksa.cjs` belum mengikuti perubahan.
- Rekam medis, resume, dan cetak dokumen RM belum menampilkan resep (sebelumnya juga tidak).
- Pilihan default agent tercatat di `dokumen/laporan/pertanyaan.md`.

## Rekam medis mengikuti formulir klinik (12 November 2026)

Rencana: bagian P6–P8 di `dokumen/renca-update-hasil-persentasi/rencana-perubahan.md`. Dikerjakan langsung (tanpa sub agent), dicek terarah pada berkas yang diubah (typecheck, lint, uji berkas terkait) dan diuji ujung ke ujung lewat pengisian ulang data demo setelah basis data dev di-reset.
- P6 Skrining keperawatan: bagian `keperawatan` (kajian, riwayat pengobatan, alergi, obat, skrining nyeri, risiko jatuh, gizi, visual) dengan default keadaan baik; alergi pindah dari anamnesis.
- P7 Isian dokter mengikuti formulir: langkah Anamnesa → Pemeriksaan fisik (35 bidang per organ, default keadaan baik, penanda "diubah", Semua normal, odontogram) → Pemeriksaan penunjang → Kesimpulan (diagnosa medis/tambahan/banding, KIE) → Terapi (tindakan, obat di poli, resep) → Tindak lanjut. SOAPIE dihapus bersih dari kode, teks, migrasi, data demo, dan dokumen.
- P8 Cetak rekam medis: endpoint `GET /api/kunjungan/:id/rekam-medis-cetak` (dicatat audit) dan lembar A4 sesuai formulir dengan pengesahan elektronik per blok; tombol "Cetak rekam medis" di detail kunjungan (riwayat dan resume).
- Uji yang gagal sejak sebelum pekerjaan ini (tidak disentuh): `keadaan-lab.test.ts` (tarif master pemeriksaan) dan `penyaring-pasien.test.ts`; lint `pengguna` tak terpakai di `daftar-pasien.tsx`. Uji integrasi API dilewati oleh `skrip/dengan-env.mjs` (DATABASE_URL_UJI dihapus).
