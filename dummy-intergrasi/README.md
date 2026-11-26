# Dummy integrasi (PCare BPJS dan SATUSEHAT)

Tujuan: endpoint tiruan untuk dua layanan eksternal supaya klira bisa dibangun dan diuji tanpa kredensial asli. Folder ini berisi **catatan permintaan, respons, struktur data**, dan **server tiruan yang berjalan**.

Dicatat: 14 November 2026.

## Menjalankan (service-dummy)

```
npm run service-dummy                     # atau: node dummy-intergrasi/server.mjs
npm test -- dummy-intergrasi              # 53 uji
```

Satu proses, dua port. Ubah dengan `DUMMY_PORT_PCARE` dan `DUMMY_PORT_SATUSEHAT`. Untuk memakai dummy SATUSEHAT dari klira, isi variabel `SATUSEHAT_*` di `.env` dengan alamat dan kredensial di bawah, lalu mulai ulang server. Kredensial PCare diisi dari halamannya di aplikasi.

| Layanan | Alamat | Kredensial bawaan (dicetak saat mulai) |
|---|---|---|
| PCare | `http://localhost:8075/pcare-rest/...` | `cons_id=2112121`, `secret_key=1a2b1a2b1a2b`, `user_key=1a2b3c1a2b3c`, `username-pcare` / `password-pcare` / `012` |
| SATUSEHAT | `http://localhost:8076` + `/oauth2/v1`, `/fhir-r4/v1`, `/kfa-v2`, `/kyc/v1` | `client_id=dummy-client-id`, `client_secret=dummy-client-secret`, organization `2a3b4c5d-0000-4000-8000-000000000001` |

Kode: `server.mjs`, `p-care/pcare.js` (+ `pcare-crypto.js`, `pcare-data.js`, `antrean.js`, `mobile-jkn.js`, `mobile-jkn.html`), `satusehat/satusehat.js` (+ `satusehat-data.js`), `lib/lz-string.js` (salinan lz-string 1.4.5). Data ICD-10, ICD-9-CM, LOINC, dan KFA dibaca dari `apps/api/data`. Data disimpan di memori dan hilang saat server dimatikan.

### Yang sudah ditiru

- **PCare:** verifikasi header (cons-id, timestamp, signature, user_key, X-Authorization, jendela waktu 5 menit), respons dienkripsi AES-256-CBC dan dikompres LZString persis seperti klien repo mendekripsi, semua jalur GET di `02-daftar-endpoint.md`, serta tulis: pendaftaran, kunjungan (POST/PUT/DELETE), obat dan tindakan kunjungan, kegiatan dan peserta Prolanis. Validasi tulis: peserta aktif, pendaftaran harus ada sebelum kunjungan, diagnosa dari ICD-10, rujuk wajib `rujukLanjut`.
- **Antrean online FKTP:** layanan `antreanfktp` pada port PCare (referensi poli dan dokter, tambah, panggil, batal antrean) dan simulator Mobile JKN di `http://localhost:8075/mobile-jkn/` yang menulis pendaftaran ke PCare tiruan untuk ditarik klira. Lihat [p-care/04-antrean-online.md](p-care/04-antrean-online.md).
- **SATUSEHAT:** token OAuth2 (`expires_in` 3599 detik), baca dan cari FHIR (NIK, `_id`, `subject`, `encounter`), POST/PUT 20 lebih jenis resource dengan validasi bidang wajib dan referensi, Patient (respons `success/data.patient_id`), Bundle transaksi atomik dengan penggantian `urn:uuid`, KFA v2, dan KYC (RSA-OAEP SHA-256 + AES-256-GCM).

### Batas yang perlu diingat

- Validasi tulis PCare dan bentuk respons PCare adalah **[dugaan]** (lihat bawah); aturan asli BPJS bisa lebih ketat atau beda kode galat.
- Kode LOINC: lab dari `loinc.json`, ditambah lima kode tanda vital. Kode LOINC klinis lain (bukan lab) ditolak dummy padahal SATUSEHAT asli menerimanya.
- Resource tanpa validator khusus (Composition, CarePlan, Claim, dan lainnya) diterima bila `resourceType` dikenal.
- KYC: hash OAEP (SHA-256) dan isi URL respons belum terverifikasi terhadap layanan asli; klien repo menanam kunci publik server asli, jadi untuk uji KYC gunakan kunci dari `GET /kyc/v1/public-key`.
- `lz-string` hanya diuji bolak-balik di sini; belum dibandingkan keluarannya dengan pustaka lz-string asli.
- Pasien dan nakes awal memakai pengenal sandbox dari repo (`P02478375538`, `10009880728`, dan seterusnya), tetapi NIK dan nama fiktif.

## Sumber (hanya dipelajari, kodenya tidak dipakai)

| Layanan | Repo | Bahasa | Yang dipelajari |
|---|---|---|---|
| PCare | https://github.com/indravscode/bridging-bpjs | PHP/Laravel | Header, tanda tangan, dekripsi respons, daftar jalur endpoint |
| SATUSEHAT | https://github.com/ivanwilliammd/satusehat-integration | PHP (ada juga Node, Python, Go) | OAuth2, bentuk resource FHIR, Bundle, kode sistem terminologi, KYC |

## Isi

- [p-care/](p-care/README.md)
  - [01-autentikasi-dan-amplop.md](p-care/01-autentikasi-dan-amplop.md): header, signature, enkripsi respons, amplop `metaData`.
  - [02-daftar-endpoint.md](p-care/02-daftar-endpoint.md): semua jalur, metode, parameter.
  - [03-struktur-data.md](p-care/03-struktur-data.md): bentuk data respons dan body tulis.
  - [04-antrean-online.md](p-care/04-antrean-online.md): antrean online (kabar antrean ke BPJS, tarik pendaftaran Mobile JKN) dan simulator Mobile JKN.
- [satusehat/](satusehat/README.md)
  - [01-autentikasi.md](satusehat/01-autentikasi.md): lingkungan, token, KFA, KYC.
  - [02-daftar-endpoint.md](satusehat/02-daftar-endpoint.md): jalur FHIR, KFA, pencarian, kode galat.
  - [03-struktur-resource.md](satusehat/03-struktur-resource.md): struktur JSON per resource.
  - [04-kode-sistem.md](satusehat/04-kode-sistem.md): URL `system` dan identifier.

## Tingkat kepastian

Setiap fakta diberi salah satu penanda:

- **[repo]**: terbaca langsung dari kode repo di atas.
- **[dugaan]**: tidak ada di repo; berasal dari pengetahuan umum tentang layanan tersebut. Wajib dicocokkan dengan katalog resmi BPJS atau dokumentasi SATUSEHAT sebelum jadi acuan.

Repo bridging-bpjs hanya meneruskan data (`$data`) tanpa skema, jadi hampir semua isi respons dan body PCare berstatus **[dugaan]**. Repo satusehat-integration membangun payload FHIR sendiri, jadi struktur request-nya **[repo]**, sedangkan isi respons sukses mengikuti FHIR standar.

## Catatan nama folder

Nama folder `dummy-intergrasi` ditulis persis seperti permintaan. Bila maksudnya `dummy-integrasi`, cukup ganti nama folder.
