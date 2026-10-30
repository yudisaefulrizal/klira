# Rencana penataan pemeriksaan klinis ke SOAPIE

Tanggal: 30 Oktober 2026. Status: diimplementasikan pada 30 Oktober 2026.

## 1. Keputusan dan batas pekerjaan

Pemeriksaan klinis disusun menggunakan format SOAPIE per kunjungan. Kebijakan pengisian ditentukan oleh klinik dan nakes. Sistem menyediakan pencatatan, penyimpanan, pengesahan, koreksi, dan riwayat untuk setiap bagian.

Pasien yang kembali setelah pelayanan selesai dibuatkan kunjungan baru; catatan sebelumnya tetap menjadi riwayat. Koreksi catatan lama tetap mengikuti mekanisme perbaikan yang tersedia.

Pekerjaan ini mencakup struktur data, API, formulir, draf, ringkasan, pengesahan, koreksi, dan riwayat. Integrasi BPJS/SATUSEHAT serta perubahan kebijakan klinis berada di luar cakupan pekerjaan ini.

## 2. Hasil analisis struktur sekarang

| Lapisan | Kondisi aktual | Konsekuensi perubahan |
|---|---|---|
| Shared | `packages/shared/src/klinis.ts` menetapkan enam bagian: anamnesis, tanda_vital, pemeriksaan, diagnosis, tindakan, tindak_lanjut | Enam bagian ini berbeda dari enam kelompok SOAPIE; jangan sekadar mengganti namanya |
| Validasi dan DTO | `packages/shared/src/skema/klinis.ts` memiliki skema, isi per bagian, respons, dan draf | Tambahkan narasi assessment, plan, implementasi, dan evaluasi beserta tipe dan validasinya |
| Database | `packages/db/prisma/schema.prisma`: Anamnesis, Observasi, Diagnosis, Tindakan, TindakLanjut; terkait kunjungan dan versi | Pertahankan model terstruktur; tambahkan penyimpanan narasi yang belum tersedia |
| Backend | `apps/api/src/modul/klinis/repositori.ts` membaca versi terbaru dan menulis isi serta pengesahan dalam transaksi | Semua bagian baru harus mendukung baca/tulis berversi dengan isolasi fasyankes |
| Pengesahan | Modul `rekam-medis` menyimpan pengesahan per entitas/bagian, hash, pembuat, waktu, dan versi | Gunakan mekanisme yang sama untuk bagian baru; jangan membuat jalur simpan tanpa audit/pengesahan |
| API | `GET /kunjungan/:id/klinis`, `PUT /kunjungan/:id/klinis/:bagian` | Perluas kontrak bagian dan respons tanpa mengganti endpoint yang sudah dipakai |
| Frontend | `keadaan-pemeriksaan.ts` mengatur sembilan langkah; `pemeriksaan-klinis.tsx` merender dan menyimpan perubahan per bagian | Kelompokkan menjadi enam langkah SOAPIE dan satu ringkasan; satu kelompok dapat memuat beberapa bagian tersimpan |
| Resep/penunjang | Komponen resep dan order penunjang menyimpan melalui modulnya sendiri | Penataan formulir tidak boleh membuat penyimpanan ganda atau menyamakan order dengan pelaksanaan |
| Penyelesaian | Frontend dan backend mensyaratkan anamnesis, diagnosis, tindak lanjut; backend hanya menolak status belum_disahkan | Jangan menambah syarat kelengkapan SOAPIE. Pastikan catatan yang disyaratkan benar-benar sah, bukan berstatus berubah |
| Draf | Draf server berisi keadaan formulir dan indeks langkah | Perubahan urutan membutuhkan versi format draf dan pemetaan indeks lama |
| Riwayat/salin | Riwayat ringkas; fitur salin mengambil anamnesis, diagnosis, dan tindakan | Tampilkan SOAPIE lengkap di detail; I/E tidak otomatis disalin menjadi fakta kunjungan baru |
| Dokumen RM | `layanan-rm.ts` dan `layanan-dokumen.ts` memakai diagnosis/tindakan; ada mekanisme addendum | Periksa pembaca, dokumen, dan koreksi agar bagian baru dapat diakses tanpa mengubah dokumen lama yang sudah disahkan |

Assessment saat ini terutama direpresentasikan oleh diagnosis; belum ada narasi penilaian tersendiri. Plan tersebar di resep, order penunjang, dan tindak lanjut; belum ada narasi rencana tersendiri. Belum ada bagian implementasi dan evaluasi pada kontrak pemeriksaan klinis ini.

Model Tindakan sudah menyimpan kode, pelaksana, waktu mulai, dan selesai. Karena itu data tersebut merupakan kandidat isi I, bukan otomatis dianggap rencana P. Makna catatan lama tetap dipertahankan.

## 3. Susunan yang akan dibuat

| Kelompok tampilan | Isi | Penyimpanan |
|---|---|---|
| S — Subjective | Keluhan utama, keluhan penyerta, riwayat pribadi/keluarga, alergi | Anamnesis yang sudah ada |
| O — Objective | Tanda vital, pemeriksaan fisik, hasil penunjang yang tersedia | Observasi dan hasil penunjang yang sudah ada |
| A — Assessment | Narasi penilaian dan diagnosis terstruktur | Tambahan narasi assessment + Diagnosis |
| P — Plan | Narasi rencana, resep, order penunjang, tindak lanjut | Tambahan narasi plan + modul yang sudah ada |
| I — Implementation | Narasi pelaksanaan dan tindakan terstruktur yang dicatat nakes | Tambahan narasi implementasi + Tindakan |
| E — Evaluation | Narasi respons pasien dan hasil evaluasi | Tambahan narasi evaluasi |

Formulir menampilkan keenam bagian menggunakan label pada tabel di atas. Ringkasan akhir menyajikan data yang tercatat dalam susunan SOAPIE.

Hasil penunjang di O dibaca dari hasil yang sudah tersedia; order tetap di P. Resep di P tidak otomatis menghasilkan catatan “obat sudah diberikan” di I. Bagian I tetap menjadi catatan nakes, tanpa otomatis menyimpulkan pelaksanaan dari rencana atau penagihan.

## 4. Desain penyimpanan yang disarankan

Pertahankan nama entitas lama agar versi, hash, referensi klaim, dan pembaca lama tidak rusak. SOAPIE menjadi pengelompokan tampilan di atas bagian penyimpanan tersebut.

Tambahkan empat bagian narasi: `assessment`, `plan`, `implementasi`, dan `evaluasi`. Gunakan satu model baru, misalnya `NarasiKlinis`, dengan:

- `id`, `fasyankes_id`, `kunjungan_id`;
- `bagian` berupa enum empat bagian narasi;
- `isi` berupa teks;
- `versi`, `dibuat_oleh`, `dibuat_pada`;
- relasi ke Kunjungan dan unique `(kunjungan_id, bagian, versi)`.

Setiap bagian memiliki pengesahan sendiri dengan mekanisme yang sudah tersedia. Identitas penulis dan waktu dicatat sistem, bukan hanya ditulis dalam narasi. Satu kunjungan memiliki isi terkini per bagian beserta riwayat versinya.

Bagian yang belum diisi direpresentasikan sebagai belum ada catatan. Membuka dan menyimpan bagian lain tidak membuat pengesahan untuk narasi kosong. Pengosongan catatan yang sudah disahkan harus tercatat sebagai koreksi berversi, bukan menghapus riwayatnya. Tetapkan batas panjang teks konsisten di skema dan antarmuka.

## 5. Urutan implementasi

### Tahap 1 — Kontrak dan database

- Tambahkan enum/model narasi melalui migrasi aditif dan relasi Kunjungan.
- Perluas `BAGIAN_KLINIS`, `SKEMA_BAGIAN`, `IsiBagian`, DTO, ekspor shared, dan label teks.
- Buat konfigurasi kelompok SOAPIE terpisah dari daftar bagian penyimpanan. Hindari asumsi satu langkah selalu satu bagian.
- Pertahankan mode skrining tanda vital yang sudah tersedia; mode tersebut tidak perlu menyalin seluruh formulir dokter.

### Tahap 2 — Backend dan pengesahan

- Tambahkan baca/tulis narasi di repositori klinis dan daftarkan penyedia isi untuk verifikasi hash.
- Gunakan transaksi isi + pengesahan, pemeriksaan izin, batas fasyankes, koreksi, serta audit yang sudah ada.
- Perluas API yang sudah ada; catatan lama mengembalikan bagian tambahan dengan isi/pengesahan null.
- Selaraskan pemeriksaan status sah saat menyelesaikan pemeriksaan. I dan E tidak dimasukkan sebagai syarat selesai.
- Pertahankan syarat selesai lama dalam pekerjaan ini; perubahan kebijakan kelengkapan lain dikerjakan terpisah jika ditetapkan klinik.

### Tahap 3 — Formulir SOAPIE

- Ubah konfigurasi menjadi S → O → A → P → I → E → Ringkasan.
- S menggunakan komponen anamnesis; O menggabungkan tanda vital, pemeriksaan, dan pembacaan hasil penunjang.
- A memuat narasi penilaian dan diagnosis; P memuat narasi rencana, resep, order, dan tindak lanjut.
- I memuat narasi implementasi dan komponen tindakan; E memuat narasi evaluasi.
- Sesuaikan rencana simpan, penunjuk galat, status per kelompok, navigasi, dan ringkasan agar menangani beberapa bagian dalam satu langkah.
- Pertahankan jalur penyimpanan resep/order yang mandiri serta perilaku kegagalan sebagian; ringkasan harus membaca status aktualnya.

### Tahap 4 — Draf dan kompatibilitas

- Versikan format draf dan petakan langkah lama ke kelompok baru berdasarkan ID, bukan memakai indeks lama langsung.
- Pulihkan draf lama dengan empat narasi baru kosong; hindari hilangnya isian yang sudah tersimpan di server.
- Jangan menulis ulang atau mengesahkan ulang data historis hanya untuk mengikuti SOAPIE.
- Jangan menyimpulkan I/E dari data lama atau menyalinnya otomatis dari kunjungan sebelumnya.
- Pastikan penambahan bagian baru tidak membuka kembali kunjungan yang sudah selesai.

### Tahap 5 — Rekam medis dan dokumen

- Perluas detail riwayat, pemeriksaan pengesahan, koreksi/addendum yang relevan, serta ringkasan yang menampilkan catatan pemeriksaan.
- Pertahankan identitas diagnosis/tindakan yang dibaca klaim dan penagihan.
- Dokumen lama yang sudah disahkan tetap utuh; perubahan format berlaku pada tampilan atau dokumen baru, tanpa mengubah snapshot lama.
- Perbarui dokumentasi alur dan pengujian yang terpengaruh.

## 6. Risiko implementasi dan penanganan

| Risiko nyata | Penanganan |
|---|---|
| Mengganti nama entitas lama merusak hash/riwayat | Pertahankan entitas; tambahkan pengelompokan SOAPIE |
| Mengira rencana sudah terlaksana | Bedakan order/resep di P dari catatan pelaksanaan di I |
| Indeks langkah draf berubah | Versikan draf dan petakan ID langkah |
| Status satu kelompok terlihat sah padahal sebagian belum tersimpan | Hitung status dari bagian penyimpanan dan modul sumbernya |
| Bagian baru tidak tersedia di koreksi atau detail RM | Uji alur lengkap sampai pembacaan dan perbaikan |
| Data lama diisi dengan fakta buatan | Narasi baru tetap kosong pada kunjungan lama |

## 7. Kriteria selesai dan verifikasi

- [x] Formulir dan ringkasan pemeriksaan tersusun dalam enam bagian SOAPIE.
- [x] I/E kosong tidak menghalangi simpan atau selesai dan tidak menghasilkan fakta/pengesahan buatan.
- [x] Narasi A/P/I/E tersimpan, terbaca kembali, dan ikut pulih dari draf.
- [x] Diagnosis, tindakan, resep, order, hasil, dan tindak lanjut tetap berfungsi melalui sumber data yang sama.
- [x] Penulis, waktu, versi, hash, izin, isolasi fasyankes, dan alasan koreksi bekerja pada bagian baru.
- [x] Catatan berstatus berubah tidak lolos sebagai catatan sah pada syarat penyelesaian.
- [x] Kunjungan lama serta draf lama tetap dapat dibaca tanpa kehilangan data atau perubahan hash.
- [x] Kunjungan baru tidak otomatis mewarisi catatan pelaksanaan dan evaluasi lama.
- [x] Detail rekam medis dan dokumen baru menampilkan data SOAPIE yang tersedia.
- [x] Uji unit shared, keadaan formulir, layanan klinis/pengesahan, dan regresi keadaan dokumen lulus (72 tes). Uji langsung repositori dan layanan pada database pengembangan juga lulus; fixture dibersihkan. Tes integrasi HTTP ditambahkan pada suite klinis yang memerlukan DATABASE_URL_UJI.
- [x] Typecheck seluruh workspace, lint berkas implementasi, dan build web lulus.
- [x] Navigasi S/O/A/P/I/E dan ringkasan diperiksa di Chrome headless dengan respons API simulasi; tidak ada galat runtime. Tampilan E diperiksa melalui screenshot `output/soapie/evaluation.png`.

## 8. Hasil implementasi

- Tabel `narasi_klinis` ditambahkan melalui migrasi `20261030090000_soapie` dan diterapkan pada database pengembangan.
- Tampilan pemeriksaan menggunakan S → O → A → P → I → E → Ringkasan.
- Data terstruktur dan identitas entitas lama dipertahankan. Empat narasi baru memakai pengesahan dan koreksi berversi.
- Draf memakai `versi_draf: 2`, dengan pemetaan indeks langkah draf lama.
- Detail SOAPIE dapat dibuka dari riwayat kunjungan dan sebagai referensi dalam formulir resume; ringkasan SOAPIE juga tersedia sebelum penyimpanan pemeriksaan.
- Tampilan referensi SOAPIE pada formulir resume membaca catatan kunjungan terkini. Isi/snapshot resume yang sudah disahkan tetap mengikuti mekanisme dokumen yang ada.
- Resep/order dibaca langsung dari sumbernya pada ringkasan; hasil penunjang ditampilkan pada O.
- Validasi penyelesaian memeriksa status `sah` pada bagian yang sebelumnya sudah disyaratkan.

Seluruh tes aktif lulus: 697 tes pada 106 suite; 145 tes dilewati oleh konfigurasi proyek, termasuk suite integrasi yang memerlukan DATABASE_URL_UJI. Pemeriksaan browser memakai respons API simulasi dan tidak mengubah data pasien. Pengujian database dilakukan melalui layanan dan repositori dengan fixture terpisah, termasuk simpan, baca, hash/pengesahan, koreksi, isolasi fasyankes, selesai, dan penolakan perubahan baru setelah tahap kasir.

Catatan lint: berkas implementasi SOAPIE lulus pemeriksaan. `npm run lint` seluruh repositori masih melaporkan 18 pelanggaran `no-require-imports` pada skrip CJS yang sudah ada di direktori `output/` dan berada di luar perubahan ini.
