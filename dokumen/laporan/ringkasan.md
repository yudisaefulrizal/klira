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
