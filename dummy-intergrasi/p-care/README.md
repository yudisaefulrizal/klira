# PCare BPJS (FKTP): dummy

Layanan Web Service BPJS Kesehatan untuk Fasilitas Kesehatan Tingkat Pertama (klinik pratama, puskesmas, dokter praktik).

Sumber: https://github.com/indravscode/bridging-bpjs (folder `src/PCare`, `src/BpjsService.php`).

## Konfigurasi klien [repo]

| Kunci | Contoh | Fungsi |
|---|---|---|
| `cons_id` | `2112121` | ID konsumen, masuk header dan signature |
| `secret_key` | `1a2b1a2b1a2b` | Kunci HMAC dan kunci dekripsi |
| `user_key` | `1a2b3c1a2b3c` | Header `user_key` |
| `username`, `password`, `app_code` | `username-pcare`, `...`, `012` | Header `X-Authorization` |
| `base_url` | `https://apijkn.bpjs-kesehatan.go.id` | Alamat dasar |
| `service_name` | `pcare-rest` | Awalan jalur |

URL akhir: `{base_url}/{service_name}/{fitur}`.

Server dummy cukup menerima `base_url` lokal dan `service_name` yang sama, sehingga klira tinggal ganti konfigurasi untuk pindah ke server asli.

## Isi

1. [01-autentikasi-dan-amplop.md](01-autentikasi-dan-amplop.md)
2. [02-daftar-endpoint.md](02-daftar-endpoint.md)
3. [03-struktur-data.md](03-struktur-data.md)

## Yang tidak dicakup repo

- Skema body POST/PUT (kunjungan, kelompok) dan isi respons: tidak ada di repo, semua **[dugaan]**.
- Layanan lain di repo yang sama (VClaim, Aplicare, Antrean FKTP, i-Care) belum dicatat. Antrean FKTP (tambah, panggil, batal antrean) kemungkinan relevan untuk klinik dan bisa ditambahkan kemudian.
