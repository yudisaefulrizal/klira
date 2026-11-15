# PCare: struktur data

**Peringatan:** repo bridging-bpjs tidak memuat skema respons maupun body tulis. Semua struktur di bawah adalah **[dugaan]** dari pengetahuan umum tentang katalog PCare BPJS. Cocokkan dengan Katalog Web Service PCare resmi dari BPJS sebelum dijadikan acuan.

## Bentuk respons daftar

Respons terdekripsi untuk daftar (diagnosa, dokter, poli, provider, obat, tindakan):

```json
{
  "metaData": { "code": 200, "message": "OK" },
  "response": {
    "count": 2,
    "list": [ { "...": "..." } ]
  }
}
```

Bila tidak ada data: `metaData.code = 204`, `response = null`.

## Peserta

```json
{
  "noKartu": "0000039043765",
  "nama": "NAMA PESERTA",
  "hubunganKeluarga": "Peserta",
  "sex": "L",
  "tglLahir": "01-01-1980",
  "tglMulaiAktif": "01-01-2014",
  "tglAkhirBerlaku": "31-12-2099",
  "kdProviderPst": { "kdProvider": "0114A026", "nmProvider": "KLINIK CONTOH" },
  "kdProviderGigi": { "kdProvider": null, "nmProvider": null },
  "jnsKelas": { "nama": "KELAS III", "kode": "3" },
  "jnsPeserta": { "nama": "PBI (APBN)", "kode": "13" },
  "golDarah": "-",
  "noHP": "08xxxxxxxxxx",
  "noKTP": "3201xxxxxxxxxxxx",
  "pstProl": "Tidak",
  "pstPrb": "Tidak",
  "aktif": true,
  "ketAktif": "AKTIF",
  "asuransi": { "kdAsuransi": null, "nmAsuransi": null, "noAsuransi": null, "cob": false },
  "tunggakan": 0
}
```

Kasus uji yang sebaiknya ada: peserta aktif, tidak aktif (`aktif=false`, `ketAktif` berisi alasan), tidak ditemukan (kode 404 atau 204), dan terdaftar di provider lain.

## Pendaftaran

```json
{
  "tglDaftar": "14-11-2026",
  "noUrut": "A001",
  "peserta": { "noKartu": "0000039043765", "nama": "..." },
  "poli": { "kdPoli": "001", "nmPoli": "UMUM" },
  "keluhan": "Demam 3 hari",
  "kunjSakit": true,
  "sistole": 120, "diastole": 80,
  "beratBadan": 60, "tinggiBadan": 165,
  "respRate": 20, "heartRate": 80,
  "rujukBalik": 0,
  "kdTkp": "10"
}
```

Body POST pendaftaran **[dugaan]** memuat `kdProviderPeserta`, `tglDaftar`, `noKartu`, `kdPoli`, `keluhan`, `kunjSakit`, `sistole`, `diastole`, `beratBadan`, `tinggiBadan`, `respRate`, `lingkarPerut`, `heartRate`, `rujukBalik`, `kdTkp`. Respons sukses memuat `message` (nomor urut).

## Kunjungan: body POST/PUT `/kunjungan/v1`

```json
{
  "noKunjungan": null,
  "noKartu": "0000039043765",
  "tglDaftar": "14-11-2026",
  "kdPoli": "001",
  "keluhan": "Demam 3 hari",
  "kdSadar": "01",
  "sistole": 120, "diastole": 80,
  "beratBadan": 60, "tinggiBadan": 165,
  "respRate": 20, "lingkarPerut": 80, "heartRate": 80,
  "terapi": "Istirahat dan minum obat",
  "kdStatusPulang": "4",
  "tglPulang": "14-11-2026",
  "kdDokter": "123123",
  "kdDiag1": "A01.0", "kdDiag2": null, "kdDiag3": null,
  "kdPoliRujukInternal": null,
  "rujukLanjut": null,
  "kdTacc": -1,
  "alasanTacc": null,
  "anamnesa": "...",
  "alergiMakan": "00", "alergiUdara": "00", "alergiObat": "00",
  "kdPrognosa": "01",
  "terapiNonObat": "...",
  "bmhp": "...",
  "suhu": "36.5"
}
```

`rujukLanjut` (bila dirujuk) **[dugaan]**:

```json
{
  "kdppk": "0114A026",
  "tglEstRujuk": "20-11-2026",
  "subSpesialis": { "kdSubSpesialis1": "26", "kdSarana": "1" },
  "khusus": null
}
```

Respons POST sukses: `metaData.code = 201`, `response = [{ "field": "noKunjungan", "message": "0114A0260815Y000003" }]`. Respons galat validasi: `metaData.code = 412`, `response` berisi daftar `{ "field", "message" }`.

## Referensi

```json
// diagnosa
{ "kdDiag": "A01.0", "nmDiag": "Typhoid fever", "nonSpesialis": true }
// dokter
{ "kdDokter": "123123", "nmDokter": "dr. Contoh" }
// poli FKTP
{ "kdPoli": "001", "nmPoli": "Umum", "poliSakit": true }
// provider rayonisasi
{ "kdProvider": "0114A026", "nmProvider": "KLINIK CONTOH" }
// kesadaran
{ "kdSadar": "01", "nmSadar": "Compos mentis" }
// obat DPHO
{ "kdObat": "XXXXXXXX", "nmObat": "Paracetamol 500 mg tablet", "sedia": 0, "harga": 0 }
// tindakan
{ "kdTindakan": "10101", "nmTindakan": "Konsultasi", "maxTarif": 0, "withValue": false }
// status pulang
{ "kdStatusPulang": "4", "nmStatusPulang": "Berobat Jalan" }
// prognosa
{ "kdPrognosa": "01", "nmPrognosa": "Bonam" }
// spesialis
{ "kdSpesialis": "ANA", "nmSpesialis": "Anak" }
// sub spesialis
{ "kdSubSpesialis": "26", "nmSubSpesialis": "..." , "kdPoliRujuk": "..." }
// sarana
{ "kdSarana": "1", "nmSarana": "..." }
```

## Obat, tindakan, MCU pada kunjungan

```json
// obat kunjungan
{ "kdObatSK": 0, "noKunjungan": "...", "racikan": false, "kdRacikan": null, "obat": { "kdObat": "...", "nmObat": "..." }, "signa1": 3, "signa2": 1, "jmlObat": 10 }
// tindakan kunjungan
{ "kdTindakanSK": 0, "noKunjungan": "...", "tindakan": { "kdTindakan": "...", "nmTindakan": "..." }, "biaya": 0, "keterangan": null, "hasil": 0 }
// mcu
{ "kdMCU": 0, "noKunjungan": "...", "kdProvider": "...", "tglPelayanan": "dd-MM-yyyy", "tekananDarahSistolik": 0, "tekananDarahDiastolik": 0, "...": "..." }
```

## Rujukan (kunjungan/rujukan)

```json
{
  "noKunjungan": "0114A0260815Y000003",
  "tglKunjungan": "14-11-2026",
  "ppk": { "kdProvider": "...", "nmProvider": "..." },
  "poli": { "kdPoli": "...", "nmPoli": "..." },
  "diagnosa": { "kdDiag": "...", "nmDiag": "..." },
  "tglEstRujuk": "20-11-2026"
}
```

## Catatan untuk server dummy

- Isi `response` selalu dienkripsi dan dikompres seperti di [01-autentikasi-dan-amplop.md](01-autentikasi-dan-amplop.md); kecuali `null`/`[]`.
- Gunakan data peserta contoh bernomor kartu tetap supaya uji bisa diulang, termasuk satu peserta tidak aktif dan satu tidak ditemukan.
- Data diagnosa bisa diambil dari ICD-10 yang sudah ada di klira (`apps/api/data`), obat DPHO dari `kfa.json` hanya sebagai contoh bentuk (bukan data DPHO asli).
