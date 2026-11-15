# PCare: daftar endpoint

Semua jalur di bawah relatif terhadap `{base_url}/{service_name}` (contoh `pcare-rest`). Semua permintaan membawa header dari [01-autentikasi-dan-amplop.md](01-autentikasi-dan-amplop.md).

Jalur dan metode bertanda **[repo]** karena terbaca dari kode. Bagian `{start}/{limit}` berarti pagination opsional: kalau dipakai, keduanya wajib.

Contoh nilai parameter dari README repo: `noKartu=0000039043765`, `noKunjungan=0114A0260815Y000003`, `kdDokter=123123`, `kdDiagnosa=A001`, `jenisKartu=nik|noka`, `kdJenisKelompok=01`, `kdTkp=10`, `kdSpesialis=ANA`, `kdSubSpesialis=26`, `kdSarana=1`, `kdKhusus=THA|HEM`.

## Peserta

| Metode | Jalur | Keterangan |
|---|---|---|
| GET | `/peserta/{noKartu}` | Peserta menurut nomor kartu |
| GET | `/peserta/{jenisKartu}/{nomor}` | `jenisKartu` = `nik` atau `noka` |

## Pendaftaran

| Metode | Jalur | Keterangan |
|---|---|---|
| GET | `/pendaftaran/tglDaftar/{tanggal}/{start}/{limit}` | Pendaftaran milik provider pada tanggal itu |
| GET | `/pendaftaran/noUrut/{noUrut}/tglDaftar/{tanggal}` | Satu pendaftaran menurut nomor urut dan tanggal |
| GET | `/pendaftaran/peserta/{noKartu}` | Pendaftaran milik satu peserta |
| GET | `/pendaftaran/kdPoli/{kdPoli}` | Penyaring poli (dari kelas, tidak ada contoh di README) |

Urutan segmen untuk gabungan (`noUrut` lalu `tglDaftar`) mengikuti urutan pemanggilan metode berantai di README. Format tanggal yang dipakai asli: **[dugaan]** `dd-MM-yyyy`.

POST/PUT/DELETE pendaftaran tidak ada di kelas **[repo]**; kelas hanya menyediakan GET, namun kelas dasar punya `store`/`update`/`destroy` generik. Jalur tulis pendaftaran asli: **[dugaan]** `POST /pendaftaran`, `DELETE /pendaftaran/peserta/{noKartu}/tglDaftar/{tgl}/noUrut/{no}/kdPoli/{kdPoli}`.

## Kunjungan

| Metode | Jalur | Keterangan |
|---|---|---|
| GET | `/kunjungan/rujukan/{noKunjungan}` | Data rujukan menurut nomor kunjungan |
| GET | `/kunjungan/peserta/{noKartu}` | Riwayat kunjungan peserta |
| POST | `/kunjungan/v1` | Tambah kunjungan **[repo]** (body: lihat struktur data) |
| PUT | `/kunjungan/v1` | Ubah kunjungan **[repo]** |
| DELETE | `/kunjungan/{noKunjungan}` | Hapus kunjungan **[dugaan]**, lewat `destroy` generik |

## Referensi

| Metode | Jalur | Keterangan |
|---|---|---|
| GET | `/diagnosa/{kdDiagnosa}/{start}/{limit}` | Cari diagnosa (ICD-10) |
| GET | `/dokter/{start}/{limit}` | Dokter di provider |
| GET | `/kesadaran` | Referensi tingkat kesadaran |
| GET | `/poli/fktp/{start}/{limit}` | Poli FKTP |
| GET | `/provider/{start}/{limit}` | Provider rayonisasi |
| GET | `/obat/dpho/{keyword}/{start}/{limit}` | Obat DPHO |
| GET | `/obat/kunjungan/{noKunjungan}` | Obat pada kunjungan |
| GET | `/tindakan/kdTkp/{kdTkp}/{start}/{limit}` | Referensi tindakan menurut jenis TKP |
| GET | `/tindakan/kunjungan/{noKunjungan}` | Tindakan pada kunjungan |
| GET | `/mcu/kunjungan/{noKunjungan}` | MCU pada kunjungan |
| GET | `/alergi/jenis/{jenisAlergi}` | Referensi alergi **[repo: kelas ada]** |
| GET | `/prognosa` | Referensi prognosa **[repo: kelas ada]** |
| GET | `/statuspulang/rawatInap/{true|false}` | Referensi status pulang **[repo: kelas ada]** |

## Kelompok (Prolanis)

| Metode | Jalur | Keterangan |
|---|---|---|
| GET | `/kelompok/club/{kdJenisKelompok}` | Club Prolanis |
| GET | `/kelompok/kegiatan/{bulan}` | Kegiatan kelompok pada bulan itu |
| GET | `/kelompok/peserta/{eduId}` | Peserta kegiatan |
| DELETE | `/kelompok/kegiatan/{eduId}` | Hapus kegiatan (komentar kode: `{edu id}` untuk delete) |
| POST/DELETE | `/kelompok/peserta/{eduId}/{noKartu}` | Tambah/hapus peserta kegiatan **[dugaan]** dari bentuk `peserta($eduId, $nomorKartu)` |

## Spesialis dan rujukan

| Metode | Jalur | Keterangan |
|---|---|---|
| GET | `/spesialis` | Referensi spesialis |
| GET | `/spesialis/{kdSpesialis}/subspesialis` | Sub spesialis |
| GET | `/spesialis/sarana` | Referensi sarana |
| GET | `/spesialis/khusus` | Referensi khusus (THA, HEM) |
| GET | `/spesialis/rujuk/subspesialis/{kdSubSpesialis}/sarana/{kdSarana}/tglEstRujuk/{tgl}` | Faskes rujukan sub spesialis |
| GET | `/spesialis/rujuk/khusus/{kdKhusus}/subspesialis/{kdSubSpesialis}/noKartu/{noKartu}/tglEstRujuk/{tgl}` | Faskes rujukan khusus THALASEMIA/HEMOFILI |

## Skrining

Perhatikan penulisan: kelas memakai awalan `skrinning` (dua n) untuk empat jalur ini **[repo]**.

| Metode | Jalur | Keterangan |
|---|---|---|
| GET | `/skrinning/rekap` | Rekap skrining riwayat kesehatan per penyakit |
| GET | `/skrinning/peserta/{noKartuAtauNama}/{start}/{limit}` | Detail peserta skrining |
| GET | `/skrinning/prolanis/dm/{keyword}/{start}/{limit}` | Prolanis diabetes melitus |
| GET | `/skrinning/prolanis/ht/{keyword}/{start}/{limit}` | Prolanis hipertensi |

## Prioritas untuk klira (usulan)

1. `peserta` (verifikasi keaktifan), `pendaftaran`, `kunjungan` (POST/PUT), `diagnosa`, `obat/dpho`, `tindakan`, `dokter`, `poli`.
2. Rujukan: `spesialis/*` dan `kunjungan/rujukan`.
3. Prolanis dan skrining menyusul.
