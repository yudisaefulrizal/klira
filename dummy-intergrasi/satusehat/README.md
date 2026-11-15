# SATUSEHAT (Kemenkes, FHIR R4): dummy

Platform integrasi data kesehatan nasional. RME klinik wajib terhubung (lihat `dokumen/regulasi.md` bagian F).

Sumber: https://github.com/ivanwilliammd/satusehat-integration (`src/OAuth2Client.php`, `src/FHIR/*`, `src/Terminology/*`, `src/KYC.php`). Struktur request di sini **[repo]**; isi respons sukses mengikuti FHIR R4 standar dan format SATUSEHAT yang diketahui, ditandai bila dugaan.

## Isi

1. [01-autentikasi.md](01-autentikasi.md): lingkungan, token OAuth2, KFA, KYC
2. [02-daftar-endpoint.md](02-daftar-endpoint.md): jalur, metode, bentuk respons dan galat
3. [03-struktur-resource.md](03-struktur-resource.md): JSON per resource FHIR
4. [04-kode-sistem.md](04-kode-sistem.md): URL `system` dan pola identifier

## Ringkasan alur minimal (sasaran uji sandbox, `dokumen/regulasi.md` baris 93)

1. Ambil token.
2. Cari Patient menurut NIK, atau buat bila belum ada.
3. Cari Practitioner menurut NIK.
4. Pastikan Organization dan Location fasyankes.
5. Kirim Bundle transaksi berisi Encounter dan Condition (diagnosis).
6. Tambah resource lanjutan: Observation (tanda vital), Procedure, Medication, MedicationRequest, MedicationDispense, ServiceRequest, Specimen, DiagnosticReport, dan seterusnya.

## Catatan

- Repo menyediakan builder untuk sekitar 50 resource FHIR. Yang dicatat terinci di sini hanyalah yang relevan bagi klinik rawat jalan; sisanya cukup disebut.
- Kemampuan GET hanya ada untuk Patient dan Practitioner (pencarian NIK) dan baca per id; resource lain hanya POST/PUT di sisi klien **[repo]**.
