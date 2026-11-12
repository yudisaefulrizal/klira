# Instagram langsung ke Meta di Klira

Klira menggunakan Instagram API dengan Instagram Login resmi, mengikuti alur `official-login.ts`, `official-webhook.ts`, dan `official-messaging.ts` dari proyek `nc-wa-official`. Konektor Zernio telah diganti. Inbox, izin staf, ikon melayang, dan retensi tetap dipakai. Satu instalasi hanya dapat menghubungkan satu akun Instagram profesional, dengan kepemilikan fasyankes yang memulai koneksi.

## Konfigurasi server

Isi `.env` tanpa membagikan App Secret atau access token ke chat/log:

```dotenv
BASE_URL=https://klira.nuscode.id
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=
INSTAGRAM_GRAPH_VERSION=v23.0
```

- App ID dan App Secret berasal dari panel **Instagram API → Penyiapan API dengan Instagram Login** pada aplikasi Meta Klira. Gunakan pasangan kredensial Instagram yang sesuai dengan produk tersebut.
- Verify token adalah string acak buatan operator, bukan App Secret atau access token Instagram. Nilainya harus sama di server dan kolom Verifikasi token dashboard Meta. Nilai awal telah dibuat di `.env` lokal jika kunci ini belum ada.
- `KUNCI_ENKRIPSI` yang sudah dipakai Klira harus tetap tersedia. Token Instagram disimpan terenkripsi menggunakan kunci ini.
- Versi Graph dipatok mengikuti fondasi NC-WA yang diadaptasi. Pembaruan versi perlu diuji dahulu.

Terapkan migrasi dengan `npm run migrasi:terapkan -w packages/db` dan build dengan `npm run build`. Migrasi `20261026140000_instagram_meta` menambah penyimpanan state OAuth, masa berlaku token, URL gambar sementara, dan konfirmasi penghapusan. Koneksi legacy ditandai nonaktif sebagai Zernio, bukan dianggap otomatis sebagai akun Meta. Kolom legacy dipertahankan; data lama tidak dihapus migrasi. Jika koneksi Zernio sudah memiliki riwayat, konversi otomatis ditolak agar identitas yang berbeda antar-aplikasi tidak bercampur; perlu pemindahan riwayat terencana.

## Isian dashboard Meta

Untuk domain di atas:

| Pengaturan | Nilai |
| --- | --- |
| Produk/alur | Instagram API dengan Instagram Login |
| OAuth Redirect URI | `https://klira.nuscode.id/auth/instagram/callback` |
| Webhook Callback URL | `https://klira.nuscode.id/webhook/instagram` |
| Webhook Verify token | Nilai `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` dari `.env` |
| Field webhook awal | `messages` |
| Deauthorize callback | `https://klira.nuscode.id/instagram/deauthorize` |
| Data deletion callback | `https://klira.nuscode.id/instagram/data-deletion` |
| App domain | `klira.nuscode.id` |
| Privacy Policy URL | `https://klira.nuscode.id/kebijakan-privasi/` |
| Terms of Service URL | `https://klira.nuscode.id/ketentuan-layanan/` |
| Data deletion instructions URL (pilihan selain callback) | `https://klira.nuscode.id/kebijakan-privasi/#penghapusan-data` |

Aktifkan izin `instagram_business_basic` dan `instagram_business_manage_messages`. Izin posting, komentar dan insight tidak diminta untuk inbox ini. Tambahkan akun klinik sebagai **Penguji Instagram** sesuai instruksi dashboard, lalu terima undangannya di akun Instagram. Akun harus Business/Creator dan akses pesan untuk alat terhubung perlu diizinkan. Lengkapi publikasi aplikasi serta persyaratan akses/review yang diminta Meta untuk pemakaian yang dituju. Sukses verifikasi callback saja belum membuktikan DM nyata akan diterima.

Setelah login, Klira otomatis memanggil `POST /me/subscribed_apps` dengan `subscribed_fields=messages`. Login hanya dinyatakan berhasil setelah langganan dikonfirmasi. Jika langkah ini gagal, ulangi login setelah konfigurasi webhook diperbaiki.

Reverse proxy/tunnel harus meneruskan `/api`, `/auth/instagram`, `/webhook/instagram`, dan `/instagram` ke API Klira. POST webhook harus mempertahankan body mentah serta `X-Hub-Signature-256`. Endpoint publik tidak boleh dipagari login proxy. WebSocket browser memakai `/api/instagram/ws`. Proxy Vite untuk development sudah menambahkan seluruh jalur tersebut.

## Endpoint

| Metode | Jalur | Fungsi/akses |
| --- | --- | --- |
| POST | `/api/instagram/login` | Membuat tautan login; sesi Klira dan izin Instagram wajib |
| GET | `/auth/instagram/callback` | Menukar kode; state sekali pakai, sesi pemulai dan izin terkini diperiksa |
| GET | `/webhook/instagram` | Verifikasi `hub.challenge` dengan verify token |
| POST | `/webhook/instagram` | Menerima DM/echo; wajib HMAC-SHA256 Meta atas body mentah |
| POST | `/instagram/deauthorize` | Memproses `signed_request`, mencabut token lokal |
| POST | `/instagram/data-deletion` | Menghapus data integrasi Instagram milik akun terverifikasi, mengembalikan URL status dan kode |
| GET | `/instagram/data-deletion-status/:code` | Menampilkan konfirmasi hanya jika transaksi penghapusan selesai |
| GET | `/instagram/media/:token` | Gambar keluar sementara, URL acak berlaku 15 menit tanpa login agar dapat diambil Meta |
| GET/POST | `/api/instagram/koneksi` | Status koneksi / putuskan koneksi dengan izin Instagram |
| GET | `/api/instagram/percakapan` | Inbox per fasyankes |
| GET/POST | `/api/instagram/percakapan/:id/pesan` | Baca/kirim DM |
| POST | `/api/instagram/percakapan/:id/baca` | Penanda baca per pengguna Klira |
| GET/PATCH | `/api/instagram/percakapan/:id/info`, `/api/instagram/percakapan/:id` | Info kontak, penanganan dan tautan pasien |
| GET | `/api/instagram/media/:id` | Lampiran lokal, wajib sesi dan izin pemilik fasyankes |
| WebSocket | `/api/instagram/ws` | Notifikasi tanpa isi pesan; sesi, origin dan izin diperiksa berkala |

Endpoint lama Zernio `/api/instagram/akun` dan `/api/instagram/webhook` tidak digunakan lagi.

## Pemakaian dan perilaku

Berikan izin **Instagram** lewat Pengguna dan akses, lalu buka Pengaturan → Instagram → Hubungkan Instagram. Login dilakukan di domain resmi Instagram dan kembali ke Klira. App Secret dan access token tidak dikirim ke browser. State disimpan sebagai hash, berlaku 10 menit, terikat sesi/pengguna/fasyankes, dan hanya dapat dikonsumsi sekali. Login baru menggantikan percobaan sebelumnya. Akun Meta berbeda ditolak selama instalasi masih terikat akun sebelumnya.

Token diperpanjang otomatis pada pemeriksaan per jam ketika tersisa paling banyak 7 hari, masih berlaku, dan usia token minimal 24 jam. Refresh yang terlambat tidak boleh mengaktifkan kembali akun yang sudah diputuskan. Token yang sudah habis perlu login ulang. Memutuskan koneksi membuang token lokal, menonaktifkan penerimaan, membatalkan state login dan akses URL gambar sementara; riwayat lokal tetap ada. Pencabutan izin dari Meta ditangani melalui signed request. Penghapusan data menghapus percakapan, pesan, lampiran, tautan kontak-pasien, state/token Instagram; rekam medis dan data pasien tidak dihapus.

Ikon Instagram terpisah di atas WhatsApp, dengan badge per pengguna dan kanal. Maksimal satu panel melayang terbuka. Menu Pesan memiliki tab kanal sesuai izin. Draf teks tidak bercampur antar-kanal. Nama pengirim dilengkapi dari profil Instagram dan ditampilkan bersama @username jika tersedia; ID tetap dipakai sebagai identitas teknis di info kontak. Pengambilan profil berlangsung setelah pesan disimpan, sehingga kegagalan API profil tidak menahan penerimaan DM. Kontak lama yang masih bernama ID dilengkapi saat inbox dimuat. Foto profil diambil dari `profile_pic` dan tampil di daftar percakapan serta header chat; jika tidak tersedia atau gagal dimuat, avatar menampilkan inisial. Profil diperiksa ulang saat inbox dimuat atau pesan masuk setelah cache 24 jam, karena URL foto Meta dapat kedaluwarsa. Kegagalan API dicoba kembali setelah jeda 15 menit. Migrasi `20261026150000_instagram_foto_profil` menambahkan URL foto dan waktu pembaruan profil. Menerima/membalas teks serta gambar JPG/PNG sampai 8 MB; gambar keluar dikirim tanpa caption, dan draf teks tetap tersedia untuk dikirim terpisah. Lampiran lain diberi keterangan untuk dibuka di aplikasi Instagram. Gambar masuk hanya diambil dari CDN Meta yang diizinkan dengan batas ukuran dan tanpa redirect. URL gambar keluar menyimpan hash token, memiliki masa berlaku, dan tidak membuka lampiran lain.

Riwayat lokal dibatasi 10 pesan selesai terakhir per kontak. ID pesan di-hash dan tombstone tetap disimpan setelah pemangkasan untuk menolak replay. Echo balasan aplikasi Instagram diterima; echo kiriman Klira digabung dengan respons kirim berdasarkan ID pesan yang sama. Tidak ada impor riwayat lama otomatis atau penghapusan riwayat di Instagram. Retensi lokal tidak mengatur penyimpanan Meta.

Meta tetap menentukan izin/jendela balasan. Penolakan pasti ditampilkan sebagai gagal; timeout/hasil tanpa konfirmasi sebagai **belum pasti**, tanpa retry otomatis. Pengiriman yang terhenti lebih dari dua menit dipulihkan menjadi belum pasti oleh pemeriksaan per menit. Periksa Instagram sebelum mengulang pengiriman yang belum pasti.

## Validasi

Tes memakai respons Meta tiruan dan HTTP/WebSocket localhost. Alur akun asli baru boleh dinyatakan terverifikasi setelah: login, callback, verifikasi/langganan webhook, DM masuk, balas teks/gambar, echo aplikasi Instagram, replay webhook, dua pengguna, pencabutan izin, refresh, disconnect saat login, dan tampilan desktop/ponsel diuji. Konfigurasi aplikasi Meta dan uji akun nyata tetap membutuhkan kredensial serta tindakan pemilik aplikasi di dashboard Meta.

Inbox menggunakan filter Semua, Belum dibaca, dan Dibaca. Status penanganan Baru/Diproses/Selesai tidak digunakan lagi. Penanda baca tetap berlaku per pengguna Klira dan diperbarui saat percakapan dibuka.


## Bersihkan pesan

Tombol **Bersihkan pesan** tersedia pada bagian koneksi Instagram, baik di halaman Pesan maupun panel chat. Setelah konfirmasi, seluruh percakapan, pesan, penanda baca, dan lampiran lokal kanal Instagram milik fasyankes pengguna dihapus. Koneksi akun, data pasien, kanal lain, dan pesan di aplikasi Instagram tetap tersedia.

Endpoint `DELETE /api/instagram/percakapan` memerlukan sesi, izin `instagram:lihat`, dan badan `{"konfirmasi":"instagram"}`. Transaksi mengunci percakapan sebelum penghapusan dan menulis audit dalam transaksi yang sama. Jika masih ada pesan berstatus antre/mengirim, endpoint mengembalikan 409 tanpa menghapus data. Pembaruan WebSocket mengosongkan percakapan aktif, draf balasan, dan penanda belum dibaca pada klien kanal tersebut. Respons daftar lama diabaikan setelah pembersihan.

Token publik lampiran yang dihapus ikut dibersihkan berdasarkan ID media milik fasyankes. Tombstone deduplikasi webhook dipertahankan untuk menolak replay pesan lama.


### Keluar akun

Aksi **Keluar** memutus koneksi Instagram dan membersihkan seluruh percakapan, pesan (termasuk antrean), penanda baca, serta lampiran lokal fasyankes dalam satu transaksi dengan audit. Identitas akun lama dihapus dari konfigurasi lokal dan disembunyikan pada respons koneksi serta antarmuka saat tidak terhubung. Klien lain menerima pembaruan untuk mengosongkan inbox dan draf. Pesan di aplikasi Instagram tetap tersedia.

Token akses dan proses login yang tertunda dibatalkan. Webhook memeriksa generasi koneksi sebelum menyimpan pesan untuk mengabaikan pekerjaan sesi lama.
