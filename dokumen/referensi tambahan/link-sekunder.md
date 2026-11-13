# Referensi Sekunder

## Awesome BPJS untuk Rumah Sakit

- Tautan: https://github.com/ImperialHealthtechDev/awesome-bpjs-rs
- Pengelola: ImperialHealthtechDev / MedMinutes.
- Disimpan: 31 Oktober 2026.
- Isi: kumpulan panduan dan tautan tentang klaim BPJS rumah sakit, VClaim/SEP, INA-CBG, eClaim, koding ICD, casemix, dan SATUSEHAT.
- Status: disimpan untuk kemungkinan kebutuhan pengembangan Klira di kemudian hari; belum menjadi acuan implementasi.
- Catatan: gunakan sebagai referensi sekunder. Ketentuan regulasi dan spesifikasi teknis perlu diverifikasi ke sumber resmi; cakupan rumah sakit perlu disesuaikan dengan lingkup layanan Klira.

## SATUSEHAT Integration Library (ivanwilliammd)

- Tautan: https://github.com/ivanwilliammd/satusehat-integration
- Pengelola: ivanwilliammd. Lisensi kode: MIT.
- Disimpan: 10 November 2026 (commit `e4c3667`, 9 November 2026).
- Isi: pustaka integrasi SATUSEHAT/FHIR R4 (PHP, Node, Python, Go) beserta data kamus CSV: KFA obat, bahan zat aktif, alkes, terminologi Kemenkes, UCUM, LOINC, KPTL, ICD-10, dan ICD-9-CM.
- Status: sumber katalog KFA obat Klira (`apps/api/data/kfa.json`, dibuat dengan `skrip/data-referensi/buat-json-kfa.py`); berkas lain di repo ini belum dipakai.
- Catatan: asal dan tanggal data tidak dinyatakan, dan lisensi MIT belum tentu mencakup data Kemenkes. Verifikasi sampel ke KFA Browser resmi. Rincian: [satusehat-integration-ivanwilliammd/README.md](<satusehat-integration-ivanwilliammd/README.md>).
