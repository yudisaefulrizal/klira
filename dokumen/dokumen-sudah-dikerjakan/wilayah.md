# Referensi wilayah aplikasi

Registrasi dan edit pasien memakai pencarian desa/kelurahan. Ketik minimal dua
karakter, lalu pilih hasil dengan hierarki lengkap (desa/kelurahan, kecamatan,
kabupaten/kota, provinsi). Nama kecamatan/kabupaten dapat ditambahkan untuk
membedakan nama yang sama. Maksimal 20 hasil; antarmuka memberi tahu bila perlu
mempersempit pencarian. Kode resmi disimpan otomatis pada `pasien.kode_wilayah`.
Pilihan bersifat opsional; mengetik saja belum memilih wilayah.

Referensi nama/kode berada pada `apps/api/data/wilayah.json`, dimuat sekali oleh
server dan dicari di memori. Tidak ada permintaan ke layanan eksternal saat
aplikasi digunakan dan browser tidak mengunduh seluruh referensi. Snapshot
berisi 38 provinsi, 514 kabupaten/kota, 7.285 kecamatan, 83.762 desa/kelurahan.
Sumber, versi, dan lisensi tercatat pada `apps/api/data/README.md`.
CSV klinik old hanya berisi nama; kode tidak dibuat dari nomor urut CSV tersebut.

- `GET /api/wilayah?cari=...`: hasil desa/kelurahan beserta penanda hasil terbatas.
- `GET /api/wilayah/:kode`: membuka nama dan hierarki dari kode tersimpan.
- Keduanya memerlukan sesi dan izin pasien (lihat/input/perbaikan) atau lihat
  rekam medis; petugas pendaftaran tidak membutuhkan izin pengaturan master.
- Daftar master wilayah juga memakai berkas yang sama; seed utama tidak lagi
  memasukkan wilayah contoh ke database.

Sertakan `apps/api/data` bersama `apps/api/dist` saat mengemas aplikasi. Tidak
memerlukan migrasi database. Tabel/data referensi lama tidak dihapus otomatis.
Kode pasien yang tidak ditemukan dalam snapshot dipertahankan saat edit;
antarmuka menyatakan nama wilayah belum dapat ditampilkan, sehingga petugas
bisa memilih ulang tanpa nama atau kode buatan.

Validasi: tes snapshot/hierarki/nama berapostrof/pencarian, tes HTTP dan izin,
tes registrasi dan master, build API/web, serta pemeriksaan komponen di Chromium
untuk pemilihan keyboard/mouse, penghapusan, hasil kosong, galat, Escape, dan
respons pencarian usang. Pemeriksaan komponen menggunakan respons API tiruan;
tes HTTP memeriksa endpoint asli dengan layanan sesi/izin pengganti tanpa DB.
