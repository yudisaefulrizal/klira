# Layar panggilan publik

Buka **Layar panggilan ↗** pada halaman daftar pasien untuk membuka layar fasilitas akun saat ini di tab baru. Alamat dapat dibuka tanpa login di TV ruang tunggu:

`/layar-panggilan/ID-fasilitas`

ID merujuk primary key fasilitas yang juga digunakan akun pada `pengguna.fasyankes_id`. Alternatif alamat: `/layar-panggilan?fasyankes=ID-fasilitas`. Gunakan mode layar penuh peramban untuk TV.

## Koneksi dan pemulihan

- Data awal melalui `GET /api/publik/layar-panggilan/:id`.
- Kanal publik `WS /api/publik/layar-panggilan/:id/ws` mengirim `siap`, `perubahan`, dan `hidup`. Notifikasi perubahan dikirim setelah pendaftaran atau aksi antrean berhasil disimpan, sebelum audit ditulis. Kanal hanya menerima koneksi dengan origin yang sesuai dan fasilitas yang ada, serta menolak pesan masuk. Kanal WhatsApp/Instagram tetap berjalan pada server yang sama.
- Setiap panggil/panggil ulang membuat satu `event_panggilan` dalam transaksi perubahan status. Penguncian baris fasilitas mengurutkan commit event per fasilitas. ID unik membedakan dua panggil ulang meskipun timestamp sama.
- Layar mengambil `?setelah=KURSOR` setelah sinyal WebSocket. Respons berisi snapshot layanan serta `event_panggilan`, `kursor`, dan `ada_lanjutan`. Maksimum 100 event per halaman, sisanya diambil langsung. Snapshot dan kursor dibaca dalam satu transaksi RepeatableRead. Event tetap tersedia setelah server restart atau status antrean selesai/batal, terbatas pada hari Jakarta saat ini dan fasilitas yang dipilih.
- Saat pertama membuka layar, kursor dimulai pada event terbaru. Histori lama tidak dibacakan massal; hanya panggilan yang masih aktif. Setelah reconnect, layar melanjutkan kursor terakhir di memori tanpa mengulang event yang sama. Muat ulang halaman memulai sesi layar baru.
- Heartbeat server setiap 20 detik; koneksi yang macet lebih dari 45 detik diputus. Handshake diberi waktu 10 detik. Reconnect otomatis dengan jeda 1–15 detik.
- Saat WebSocket terputus/tidak tersedia, polling berjalan setiap 3 detik. Setelah WebSocket pulih, polling rutin berhenti. Sinkronisasi pengaman tetap dilakukan setiap 60 detik untuk perubahan master, pergantian hari, atau notifikasi yang gagal terkirim. HTTP yang gagal diulang setiap 3 detik tanpa memajukan kursor.

Penyiaran langsung memakai kanal dalam satu proses API, sesuai server Klira saat ini. Jika API dijalankan dalam beberapa proses/replika, tambahkan pub/sub lintas proses agar notifikasi tetap langsung; log event tetap memulihkan perubahan melalui sinkronisasi pengaman.

## Tampilan dan suara

Layar mengikuti desain konsep teal Klira: panggilan terbaru, pelayanan per poli, dan nomor menunggu terendah per poli. Data hanya untuk poli operasional dan antrean hari ini menurut Asia/Jakarta. Nomor memakai formatter aplikasi (saat ini A-001 di setiap poli); nama poli membedakan tujuan. Nama ruang tidak direkayasa karena master belum memiliki atribut nomor ruang terpisah.

Klik **Aktifkan suara** sekali pada perangkat layar. Panggilan aktif langsung dibaca, kemudian event baru/panggil ulang dibaca berurutan dalam bahasa Indonesia. Nomor dibaca per digit (A-023 menjadi “A nol dua tiga”), diikuti nama poli. Event yang sama tidak mengulang suara. Mengaktifkan ulang suara hanya membacakan panggilan aktif, bukan histori selama suara dimatikan. Setelah memuat ulang halaman, aktifkan kembali. Dukungan dan kualitas suara mengikuti peramban/perangkat; pasang suara bahasa Indonesia bila diperlukan.

Saat koneksi terputus, data terakhir tetap terlihat dengan status mode cadangan atau galat jaringan. Data hari sebelumnya disembunyikan saat berganti hari Jakarta. Alamat tanpa ID menampilkan petunjuk; fasilitas tidak ditemukan menampilkan pesan galat. Layar menyesuaikan ukuran kecil dan tidak menampilkan menu administrasi atau panel pesan.

## Data dan migrasi

Respons publik dan log event hanya berisi nama fasilitas/poli, nomor antrean, status layanan, waktu panggilan, serta ID event. Identitas pasien, nomor rekam medis, dan data kunjungan tidak dikirim. API menggunakan Cache-Control no-store. WebSocket tidak dapat mengubah antrean.

Migrasi `20261029100000_event_panggilan` menambahkan tabel log publik. Jalankan `npm run migrasi:terapkan -w packages/db` sebelum menjalankan versi API ini pada lingkungan lain.

## Verifikasi

`npm run build` dan pengujian terarah untuk modul `layar-panggilan`, `kunjungan/event-panggilan`, `panggilan-suara`, serta `sambungan-layar-panggilan`.


## Ikon koneksi pada header petugas

Header utama menampilkan ikon server dan monitor di kanan pemilih tema, tanpa label teks tetap. Tooltip tersedia saat hover/fokus dan label aksesibel menjelaskan status. Ikon server diperiksa melalui `/api/kesehatan` setiap 15 detik (timeout 5 detik), juga saat browser mendeteksi perubahan jaringan. Ikon ini menunjukkan API dapat dijangkau, bukan pemeriksaan database.

Ikon monitor memakai kanal `?pemantau=1` dengan sesi login milik fasilitas yang sama. Server mengirim pesan `layar` berisi `jumlah` koneksi layar publik; koneksi pemantau sendiri dan fasilitas lain tidak ikut dihitung. Jumlah diperbarui ketika layar tersambung/terputus. Sesi pemantau diperiksa ulang saat heartbeat. Kanal pemantau tidak dapat membuat panggilan.

Hijau berarti terhubung, abu-abu berarti belum ada layar/akun fasilitas, kuning berarti sedang memeriksa atau status pemantauan belum diketahui, dan merah berarti API tidak dapat dijangkau. Saat koneksi pemantau putus, jumlah sebelumnya dihapus agar ikon tidak terus hijau. Jumlah koneksi tidak menyatakan bahwa suara perangkat telah diaktifkan. Pemantauan mengikuti satu proses API; distribusi beberapa replika memerlukan agregasi presence lintas proses.
