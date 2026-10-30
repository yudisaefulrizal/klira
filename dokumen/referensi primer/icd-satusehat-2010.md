# Referensi primer ICD — SATUSEHAT versi 2010

Dokumen ini menetapkan dua berkas di bawah sebagai referensi primer kode ICD proyek Klira. Berkas diunduh melalui tombol **Unduh** pada dokumentasi resmi SATUSEHAT Kementerian Kesehatan RI, bukan dari kumpulan kode pihak ketiga.

Tanggal pengambilan: **30 Oktober 2026 (Asia/Jakarta)**. Berkas XLSX disimpan sebagaimana dihasilkan tautan unduh sumber, tanpa mengubah isi atau menerjemahkan nama kodenya.

| Referensi | Berkas lokal | Lembar | Jumlah kode unik | Versi pada berkas |
|---|---|---|---:|---|
| ICD-10 | [icd-10-2010-satusehat.xlsx](icd-10-2010-satusehat.xlsx) | ICD10 | 18,542 | ICD10_2010 |
| ICD-9-CM | [icd-9-cm-2010-satusehat.xlsx](icd-9-cm-2010-satusehat.xlsx) | ICD9 CM | 4,626 | ICD9CM_2010 |

## Jejak sumber

### ICD-10

- [Halaman resmi SATUSEHAT](https://satusehat.kemkes.go.id/platform/docs/id/terminology/icd/icd-10/).
- [Dokumen yang ditautkan oleh SATUSEHAT](https://docs.google.com/spreadsheets/d/12_72PvHRLWny3VEwodEI6TRDc7QqWdiF/edit?gid=0).
- [Tautan unduh XLSX](https://docs.google.com/spreadsheets/d/12_72PvHRLWny3VEwodEI6TRDc7QqWdiF/export?format=xlsx).
- SHA-256: `306c8860feb562014de48e894e9254b08aa492770cd04ea29de6707d7e51e150`.

### ICD-9-CM

- [Halaman resmi SATUSEHAT](https://satusehat.kemkes.go.id/platform/docs/id/terminology/icd/icd-9-cm/).
- [Dokumen yang ditautkan oleh SATUSEHAT](https://docs.google.com/spreadsheets/d/1uw9aEzM61rsp7PVt7dRHt2eATg64qQB_/edit?gid=0).
- [Tautan unduh XLSX](https://docs.google.com/spreadsheets/d/1uw9aEzM61rsp7PVt7dRHt2eATg64qQB_/export?format=xlsx).
- SHA-256: `af94244dffa652ba11be26b9843c04989e3bfaaead9d5be5bc0e7ca7fd2c99c5`.

## Pemeriksaan berkas

Kedua berkas lulus pemeriksaan integritas ZIP/XLSX dan dapat dibuka sebagai workbook. Kolom sumber adalah `CODE`, `DISPLAY`, dan `VERSION`. Semua kode unik pada masing-masing berkas; kode dan nama dibaca sebagai teks. Pada ICD-9-CM terdapat 443 kode berawalan nol, yang tetap utuh dalam berkas.

Saat diproses, pertahankan `CODE` sebagai teks, termasuk titik dan nol di depan. Gunakan `DISPLAY` sesuai sumber dan simpan `VERSION` untuk jejak versi. Jumlah di atas adalah jumlah kode pada salinan unduhan ini, bukan klaim kesetaraan dengan semua edisi ICD lain.

Rincian ukuran, versi, jumlah baris, URL sumber dan checksum tersedia di [manifest unduhan](manifest-icd-satusehat-2010.json).
