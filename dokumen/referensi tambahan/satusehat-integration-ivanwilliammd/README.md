# satusehat-integration (ivanwilliammd)

Repositori: https://github.com/ivanwilliammd/satusehat-integration
Lisensi kode repositori: MIT. Lisensi data di dalamnya belum diverifikasi (lihat Batas pemakaian).
Dicatat: 10 November 2026. Commit terakhir saat dicatat: `e4c3667924f707002ae4671e73d79667f6fcb084` (9 November 2026).

Pustaka integrasi SATUSEHAT (FHIR R4) dalam PHP, Node, Python, dan Go. Selain kode, repositori memuat data kamus dan terminologi berformat CSV di `database/seeders/csv/` (berekstensi `.csv.stub`, pemisah titik koma kecuali `icd9cm`). Belum ada berkas yang disalin ke proyek ini; hanya struktur dan beberapa baris pertama yang dibaca.

## Berkas data yang relevan

| Berkas | Isi | Ukuran | Status untuk Klira |
|---|---|---|---|
| `kfa_obat` | Produk obat KFA (tingkat 93), sekitar 15.700 baris. Kolom: `kfa_code`, `product_template`, `display_name`, `brand`, `uom_drug_form`, `drug_form_hl7`, `medication_form(_code)`, `drug_class`, `atc_class`, `fornas`, `izin_edar`, `manufacturer`, `status` | 3,7 MB | **Fokus saat ini** → `ReferensiKfa` |
| `kfa_bza` | Bahan zat aktif (tingkat 91, kode 91xxxxxx). Kolom: `kfa_code`, `zat_aktif`, `kekuatan`, `name`, `active`, `status` | 2,9 MB | **Fokus saat ini** → `ReferensiKfa` |
| `kfa_alkes` | Alat kesehatan (kode 82xxxxxx) | 0,7 MB | Ditunda; hanya bila alkes dikelola sebagai stok |
| `kemkesterm` | Terminologi Kemenkes untuk atribut FHIR | 0,1 MB | Kandidat → `KodeTerminologi` |
| `ucum` | Satuan UCUM | 0,1 MB | Kandidat untuk satuan master lab |
| `loinc` | LOINC, sekitar 100 ribu kode | 20 MB | **Dipakai** (hanya kode laboratorium aktif) → `apps/api/data/loinc.json` |
| `kptl_*` | Kode tindakan dan layanan KPTL | 0,4–0,8 MB | Bandingkan dengan padanan ICD-9-CM KPTL yang sudah ada |
| `icd10`, `icd9cm` | ICD-10 dan ICD-9-CM berbahasa Indonesia | 2 MB, 0,4 MB | Tidak diambil; Klira sudah punya berkas primer sendiri |

Tidak dipertimbangkan: `snomedct` (45 MB, lisensi terbatas), `kode_wilayah_indonesia` (Klira sudah punya wilayah berlisensi), `cvx` (belum ada modul imunisasi), dan dokumentasi FHIR.

## Batas pemakaian

- Asal dan tanggal pengambilan data di dalam repositori ini tidak dinyatakan. Jangan dianggap salinan resmi Kemenkes; verifikasi sampel ke [KFA Browser SATUSEHAT](https://satusehat.kemkes.go.id/kfa-browser) sebelum dipakai.
- MIT mencakup kode repositori, belum tentu data Kemenkes dan LOINC yang ada di dalamnya.
- Berkas obat hanya memuat tingkat 93; template tingkat 92 (mis. "Parasetamol 500 mg tablet") tidak ada. Keputusan tingkat yang dipilih untuk master obat perlu diambil sebelum impor.
- Beberapa baris menandai nama dengan "(tidak dipakai)"; saring atau tandai nonaktif memakai kolom `status`/`active`.
- Saat berkas disalin ke proyek, catat commit, tanggal, dan SHA-256 di README ini seperti pada `icd9cm-kptl`.

## KFA yang dipakai Klira (10 November 2026)

Diambil dari commit `e4c3667924f707002ae4671e73d79667f6fcb084`, tanpa diubah (sumber memakai ekstensi `.csv.stub`):

| Berkas | SHA-256 |
|---|---|
| `kfa_obat.csv` | `873936bd9cb5981c77a7996acb46ce207b81419d387761c752d5f4c6319492ef` |

`python3 skrip/buat-json-kfa.py` memverifikasi checksum, lalu menulis **`apps/api/data/kfa.json`** (katalog statis, dimuat sekali oleh API, dicari di memori seperti `wilayah.json`; bukan tabel database) dan `perlu-ditinjau.json`.

Hasil: **15.691 produk tingkat 93**, 63 di antaranya `nonaktif` karena nama bertanda "tidak dipakai". Nama panjang (terpanjang 637 karakter) ikut masuk. **2 baris disisihkan**: kode ganda `93022066` untuk dua produk berbeda (Hevit-C 500 dan 1000).

Pemetaan: `kfa_code`→`kode`, `display_name`→`nama`, `medication_form`→`bentuk_sediaan`, `uom_drug_form`→`satuan`. Sengaja tidak dipetakan: `manufacturer` (isinya "lokal"/"import", bukan produsen), `izin_edar` (hanya tulisan "NIE"), `brand` (tidak menentukan generik). Template tingkat 92 tidak ada di sumber dan tidak dibuat sendiri. Bahan zat aktif tingkat 91 (`kfa_bza`) tidak dimuat: bukan barang yang diserahkan atau distok.

Tambahan dan ubahan klinik disimpan di tabel `kfa_lokal` (per klinik). Pencarian menggabungkan katalog JSON dengan tabel ini; baris `kfa_lokal` menimpa produk katalog berkode sama. `master_obat` menyalin kode, nama, dan bentuk sediaan KFA saat obat ditambahkan, jadi riwayat tidak berubah bila katalog diperbarui.

Memperbarui katalog: ambil berkas baru dari sumber, perbarui commit dan checksum di `skrip/buat-json-kfa.py` dan README ini, lalu jalankan skrip. Tidak ada impor ke database.

## LOINC yang dipakai Klira (10 November 2026)

Sumber: `loinc.csv.stub` dari commit `e4c3667924f707002ae4671e73d79667f6fcb084`, disimpan terkompresi sebagai `loinc.csv.gz` (isi tak berubah). SHA-256 berkas mentah: `443f94d9960f94358a016f8bae7f9cefa3ff8bcc938cf03423fb3c1b518e13a4`. Versi LOINC tertinggi di dalamnya: 2.74.

`python3 skrip/buat-json-loinc.py` memverifikasi checksum, lalu menulis **`apps/api/data/loinc.json`** (dimuat sekali oleh API dan dicari di memori; bukan tabel database). Isi: **56.732 kode** dengan `CLASSTYPE` = 1 (laboratorium) dan `STATUS` = ACTIVE, kolom `kode`, `nama` (LONG_COMMON_NAME bahasa Inggris), `kelas`, dan `urut`. Tidak dimuat: kode non-laboratorium (39.717), tidak aktif (3.228: trial, deprecated, discouraged), dan 10 baris yang memuat pemberitahuan hak cipta pihak ketiga.

Dipakai di kolom "Kode LOINC" pada master pemeriksaan lab: ketik nama (bahasa Inggris) atau kode, pilih dari 10 saran teratas. Kode yang diisi manual tetap diterima bila polanya sah (mis. 718-7), sehingga kode yang lebih baru dari snapshot ini tetap bisa dipakai. Kueri berbentuk kode (angka dan tanda hubung) dicocokkan sebagai awalan kode. Urutan saran: kode persis, kolom `urut` (0 = konsentrasi kuantitatif umum di darah atau serum/plasma, sampai 4 = lainnya; dihitung skrip dari skala, properti, spesimen, dan metode karena sumber tidak memuat peringkat kelaziman tes), nama diawali kata kunci, lalu nama yang lebih pendek. Keterbatasan: pencarian hanya dalam bahasa Inggris (mis. "glucose", bukan "glukosa").

**Hak cipta dan lisensi LOINC.** LOINC® adalah hak cipta Regenstrief Institute, Inc. dan LOINC Committee, tersedia tanpa biaya di bawah lisensi di https://loinc.org/license . Pemberitahuan lengkap ada di kolom `hak_cipta` pada `loinc.json`, dan UI menampilkan sumbernya di bawah daftar saran. Pertahankan pemberitahuan itu bila data diperbarui atau dibagikan. Verifikasi syarat lisensi terbaru ke loinc.org sebelum rilis produksi.

Memperbarui: ganti `loinc.csv.gz` dengan snapshot baru, perbarui commit dan checksum di `skrip/buat-json-loinc.py`, lalu jalankan skripnya.

