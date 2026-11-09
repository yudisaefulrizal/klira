# Nama tindakan Indonesia untuk ICD-9-CM

Sumber resmi: [Lampiran Mapping Kode ICD 9 CM – KPTL SATUSEHAT](https://satusehat.kemkes.go.id/platform/docs/id/terminology/kptl/icd-9-cm-kptl/).
Unduhan XLSX: https://docs.google.com/spreadsheets/d/1nViDXYHksDadE8H7N2j22B8Dwm5qj6PKRBV6kXpT3iM/export?format=xlsx

Disalin 31 Oktober 2026. SHA-256: `aeff53051192037b6e0a0c52ae609d1c2009e9e81bf22c7ea718f9a2d56a1a69`.
Log versi di dalam XLSX menyebut v3.0, 10 Agustus 2026; ini berbeda dari keterangan versi di halaman dokumentasi. Acuan snapshot adalah isi dan checksum XLSX.

Ini pemetaan ke nama/kode KPTL, bukan terjemahan harfiah maupun pengganti nama resmi ICD. Satu kode ICD dapat memiliki beberapa nama KPTL; semuanya dipertahankan sebagai referensi terkait. Pencarian Indonesia memakai nama-nama ini; memilih hasil tetap menyimpan kode dan nama ICD asli.

`python3 skrip/buat-padanan-icd9cm.py` memverifikasi checksum, lalu mencocokkan kode dan nama Inggris terhadap JSON primer ICD9CM 2010. Perbandingan nama mengabaikan kapitalisasi dan tanda baca. Hanya kecocokan keduanya dipakai: 2.363 kode memperoleh nama KPTL. Sepuluh baris dengan kode/nama berbeda atau data tidak lengkap disimpan dalam `perlu-ditinjau.json`, tanpa diterapkan. Tidak dilakukan penerjemahan otomatis atau penarikan kesimpulan bahwa nama KPTL identik dengan cakupan kode ICD.

JSON keluaran: `apps/api/src/modul/klinis/data/icd9cm-kptl-id.json`. Runtime memeriksa ikatan checksum berkas primer sebelum memakai pemetaan. Berkas primer ICD9CM 2010 tetap menjadi sumber kode dan nama resmi; kode disimpan sebagai string untuk mempertahankan nol awal.
