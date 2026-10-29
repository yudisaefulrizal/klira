# Pengelolaan master pada halaman layanan

Data operasional dikelola dari modul yang menggunakannya. Pengaturan → Master data menjadi indeks tautan; referensi wilayah tetap di Pengaturan. Formulir, validasi, API, dan audit master yang sudah ada dipakai bersama melalui komponen `DaftarMaster` dan `ModalMasterProfil`.

| Halaman asal | Akses | Alamat pengelolaan | Jenis data |
| --- | --- | --- | --- |
| Daftar pasien | Kelola layanan | `/pasien/layanan` | Poli, praktisi, jadwal praktik |
| Rawat inap | Kelola ruangan | `/rawat-inap/ruangan` | Ruang, bed |
| Kasir dan klaim | Tarif layanan | `/kasir-klaim/tarif` | Tarif layanan |
| Pengaturan | Master data → Wilayah | `/pengaturan?tab=master&jenis=wilayah` | Wilayah, hanya baca |

Tombol kontekstual hanya tampil bagi pemilik izin `master/lihat`. Alamat pengelolaan juga memerlukan izin tersebut. Tambah tetap memerlukan `master/input`; ubah dan aktif/nonaktif tetap memerlukan `master/perbaikan`. Tidak ada perubahan pemberian izin atau pembukaan akses data klinis. Pengguna yang hanya memiliki akses master tetap dapat masuk lewat indeks di Pengaturan tanpa membuka daftar pasien, papan bed, ataupun transaksi kasir.

Daftar pengelolaan dibatasi ke jenis terkait; mengganti parameter `jenis` secara manual tidak menampilkan master modul lain. Pencarian, penyaring status, paginasi, konfirmasi perubahan status, serta pemeriksaan formulir belum tersimpan memakai perilaku komponen semula. Setelah penyimpanan, daftar dimuat ulang.

Tombol dari halaman kerja membawa alamat asal beserta seluruh penyaringnya di parameter `kembali`. Tombol kembali memulihkan alamat tersebut. Halaman kerja dimuat ulang saat kembali sehingga daftar dan opsi formulir yang dibuka berikutnya menggunakan data terbaru. Pengelolaan tidak membuka modal tambahan di dalam formulir pelayanan. Tautan dapat dibuka di tab baru melalui perilaku tautan standar.

Bookmark lama seperti `/pengaturan?tab=master&jenis=bed&cari=VIP&halaman=2` dialihkan ke lokasi pengelolaan baru dengan jenis, pencarian, status, dan halaman tetap sama. Alamat indeks tanpa `jenis` tetap menampilkan pintasan; wilayah tetap di tempat semula. Alamat kembali dibatasi ke halaman asal atau Pengaturan, sesuai izin pengguna.

Perubahan ini hanya pada navigasi dan komponen web, tanpa migrasi database maupun perubahan endpoint API.

Verifikasi: build web, lint berkas terkait, dan pengujian lokasi master, penjaga rute, tab Pengaturan, penyaring master, serta keadaan formulir master.
