# Pengelolaan master pada halaman pemiliknya

Tidak ada menu atau halaman Master data. Tiap master dikelola sebagai tab di modul yang memakainya, lewat komponen `DaftarMaster` yang sama (formulir, validasi, API, dan audit tidak berubah). Pengaturan dipecah menjadi Akses dan keamanan (`/akses`) dan Pengaturan klinik (`/pengaturan-klinik`).

| Halaman | Tab | Alamat | Jenis data |
| --- | --- | --- | --- |
| Daftar pasien | Poli · Praktisi · Jadwal praktik | `/pasien?tab=poli` (`praktisi`, `jadwal`) | Poli, praktisi, jadwal praktik |
| Rawat inap | Daftar ruang · Daftar bed | `/rawat-inap?tab=ruang` (`bed`) | Ruang, bed |
| Kasir dan klaim | Tarif layanan | `/kasir-klaim?tab=tarif` | Tarif layanan |
| Farmasi | Master obat | `/farmasi` | Obat |
| Penunjang | Master pemeriksaan | `/penunjang?tab=master` | Pemeriksaan lab |

Satu jenis master = satu tab, sejajar dengan tab operasional halaman itu (satu baris tab, tanpa subtab). Judul di dalam kartu tidak diulang karena sudah ada pada tab.

Tab master hanya tampil bagi pemilik izin `master/lihat`. Tambah memerlukan `master/input`; ubah dan aktif/nonaktif memerlukan `master/perbaikan`. Tab bersanding dengan tab operasional halaman itu hanya bila akun berhak atas keduanya; akun yang hanya punya izin master langsung melihat tab kelola. Halaman Daftar pasien, Rawat inap, dan Kasir dan klaim terbuka bagi pemegang izin master walau tanpa akses klinis, tetapi tab operasionalnya tersembunyi dan menunya tidak muncul di sidebar. Pintu masuk akun seperti ini adalah daftar periksa pengaturan awal di Beranda tugas.

Referensi wilayah tidak punya halaman telusur; ia hanya dipakai pemilih alamat. Tidak ada perubahan database maupun endpoint API.
