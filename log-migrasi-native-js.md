# Migrasi Klira ke JavaScript native

## Status
Konversi belum selesai. Batch 1–71 dicatat di bawah. Mulai Batch 16, instruksi aktif adalah konversi tanpa pengujian/validasi dan tanpa kompatibilitas sementara React–DOM. Aplikasi belum diklaim dapat dijalankan.

## Batch 1 — Fondasi dan backend
- 446 berkas TypeScript (termasuk uji yang sudah ada) pada `packages/shared`, `packages/db`, `packages/integrasi`, `apps/api`, `apps/worker`, dan `apps/whatsapp` dikonversi otomatis ke JavaScript ES Modules.
- Import relatif memakai ekstensi `.js` atau `/index.js`; import JSON API memakai atribut JSON. Lokasi berbasis `__dirname` dan deteksi CLI disesuaikan untuk ESM.
- Entry point paket, seed, migrasi, backup/restore, skrip start/dev, dan pengujian WhatsApp menunjuk langsung ke `src`. SQL, skema, dan data tidak diubah. Tidak menjalankan migrasi/seed database.
- Konfigurasi TypeScript keenam workspace dihapus. Jest backend menggunakan ESM, dynamic import, dan `unstable_mockModule`; seluruh suite memakai JavaScript ESM tanpa transform TS.
- Validasi: sintaks dan import relatif 446 modul berhasil; import shared/db/integrasi, aplikasi API, dan profil WhatsApp berhasil. Enam suite terarah backend lulus (28 pengujian); 14 pengujian profil WhatsApp lulus.

## Batch 2 — Modul frontend tanpa JSX
- 125 modul `.ts` frontend (utilitas, data, keadaan/alur modal, dan pengujian) dikonversi otomatis ke `.js`. Empat utilitas yang menggunakan hook React masih membutuhkan konversi saat batch DOM.
- Empat suite terarah frontend lulus (33 pengujian). Build frontend transisi berhasil setelah kedua batch, tanpa perubahan CSS maupun komponen TSX.
- `ts-jest` dan tipe backend Express/WebSocket/QR dihapus; lockfile diperbarui offline. Konfigurasi TS akar dihapus; Jest tidak melakukan transformasi kode.
- `npm run dev` menjalankan source backend dengan Node watch; Vite masih melayani frontend. `npm start` sementara membangun frontend dengan Vite, kemudian menjalankan source backend. CLI DB berjalan langsung melalui skrip npm workspace.

## Batch 3 — Klinik publik dan layar panggilan
- Dua halaman TSX dan hook suara diganti modul DOM native; event, state halaman, timer, abort request, metadata, dan cleanup dikelola langsung. CSS dan API tetap dipakai.
- `main.js` memilih rute native tanpa memuat React. API melayani index sumber, CSS, aset, shared ESM, dan Zod langsung untuk rute ini; halaman internal masih menggunakan entry point React/Vite sementara.
- Validasi: Chrome headless memuat kedua rute dari source tanpa request Vite/React/TSX/bundle; menu/Escape, daftar layanan, filter jadwal, teks ter-escape, antrean, dan ID fasilitas kosong berhasil. Tiga suite terarah API/sambungan/suara lulus (16 pengujian); build transisi internal berhasil.
- Tidak menjalankan final regression maupun mengubah database.

## Batch 4 — Autentikasi, tema, dan status koneksi
- Form masuk dan ganti kredensial wajib menjadi `halaman/akses.js`, memakai API, skema validasi, penjaga rute, dan penghapusan draf yang sudah ada. Kedua rute disajikan dari source tanpa Vite.
- Bilah tema/status koneksi menjadi `komponen/tema-tampilan.js`; sinkronisasi storage, perubahan tema sistem, polling status, dan cleanup native. Dipakai juga kerangka internal melalui batas React sementara di `app-internal.tsx`; dua komponen TSX lama dihapus.
- Chrome headless: payload login, galat API, status submit, penyimpanan tema, guard ganti kredensial, dan validasi skema berhasil tanpa memuat React/TSX/Vite. Build transisi internal berhasil, termasuk setelah penyatuan bilah tema.

## Batch 5 — Log audit dan panel detail native
- `log-audit.tsx` dan `pengaturan/tab-audit.tsx` diganti `halaman/log-audit.js`; form penyaring, validasi, URL, tabel, paginasi, ekspor, dan respons async dikelola dengan DOM/event native.
- `ui/dialog-dom.js` memakai utilitas fokus, tumpukan lapisan, kunci gulir, dan riwayat yang sudah ada. Kerangka internal memasang halaman audit melalui batas React sementara.
- Chrome: query filter, paginasi, ekspor sesuai filter, teks aman, panel detail, trap fokus, back untuk menutup panel, pemulihan fokus/gulir, dan cleanup berhasil. Lima suite terarah guard/filter/lapisan/riwayat/API lulus (41 pengujian). Build transisi berhasil.

## Batch 6 — Statistik pelayanan
- Halaman statistik dan grafik penumpukan TSX diganti modul `.js` native: polling menit, rentang tanggal/poli, pilihan tahap, grafik SVG, tren, heat map, dan angka per jam. CSS statistik tetap digunakan.
- Chrome: grafik, heat map, penyaring tahap/poli, request API, dan cleanup berhasil; build transisi internal berhasil. Halaman masih dipasang oleh kerangka React sementara.

## Batch 7 — Beranda tugas dan kesiapan klinik
- Beranda tugas serta kesiapan klinik kartu/spanduk menjadi DOM native, memakai API, izin, urutan tugas PDP, tujuan navigasi, dan token tampilan yang sama. Spanduk di Daftar pasien memakai batas React sementara.
- Chrome: gerbang izin, daftar tugas/kesiapan, navigasi, dan cleanup berhasil. Pemasangan audit/tema native di kerangka internal asli juga berhasil. Build transisi berhasil; dua uji tugas PDP dan tiga uji lifecycle suara native lulus. Uji API mencakup penyajian entry/modul native tanpa build dan kanonisasi URL autentikasi dengan query. Pemeriksaan diff tidak menemukan masalah whitespace.

## Batch 8 — Draf, pencarian tertunda, dan daftar native
- Tiga utilitas hook menjadi pengendali native dengan callback dan cleanup; konsumen TSX memakai `util/hook-sementara.js` selama transisi. Adaptor tidak merender UI.
- Dipertahankan: baca draf sekali, pemulihan async, flush nilai terbaru, hapus/buang, debounce pencarian, halaman daftar dan penolakan respons lama.
- Empat pengujian terarah utilitas lulus; build transisi berhasil. Tiga modul utilitas tersebut tidak lagi mengimpor React; adaptor React sementara masih diperlukan oleh konsumen tersisa.

## Batch 9 — Sesi, izin, dan History API native
- State/aksi sesi berada di `sesi-pengguna.js`; History API di `navigasi-native.js`; pemeriksaan izin UI di `izin-pengguna.js`. Provider TSX sementara memakai subscription dari modul native.
- Lima pengujian terarah sesi/navigasi lulus: respons terlambat, pergantian akun, logout gagal/penghapusan draf, History API, cleanup, dan perpindahan rute mandiri. Build transisi berhasil.

## Batch 10 — UI DOM bersama dan tujuh daftar PDP
- `ui/native.js` menyediakan tombol, bidang formulir, kartu, lencana, tabel/paginasi berbasis elemen browser dan token yang sama. Bukan renderer/framework baru.
- Delapan TSX daftar PDP diganti `daftar-native.js`/`tab-native.js`; tujuh tab mempertahankan data, izin, paginasi, penyaring hak, kebijakan retensi, teks pemberitahuan, ekspor ROPA, serta aksi modal.
- Modal yang belum dimigrasikan tetap dibuka oleh batas React di `pelindungan-data.tsx`. Adaptor `useDaftar` tidak lagi diperlukan dan dihapus dari hook sementara.
- Chrome headless: tujuh tab, teks aman, aksi baris, paginasi, penyaring terapan, hak baca tanpa tombol ubah, dan cleanup berhasil. Build transisi berhasil.

## Batch 11 — Modal PDP satu layar
- Penarikan persetujuan dan versi pemberitahuan menjadi modal native. `modal-1/modal-dom.js` memakai dialog/fokus/lapisan native Batch 5, ditambah header/aksi, riwayat, konfirmasi alasan opsional, dan perlindungan tutup isian.
- Kedua modal dipanggil langsung dari tab native; callback API/validasi dan hasil sukses dipertahankan. Dua TSX lama dihapus.
- Chrome: validasi bidang, payload POST, konfirmasi tutup, inert lapisan bawah, hasil sukses, pemulihan fokus, dan cleanup berhasil. Build transisi berhasil.

## Batch 12 — Halaman dan pemilih tab PDP native
- Header, pemilih tab, izin lihat, pilihan tab dari URL/sessionStorage, pergantian daftar, muat ulang setelah modal, dan cleanup berada di `halaman/pelindungan-data.js`.
- File TSX halaman sekarang hanya batas context dan tujuh modal bertahap yang belum dimigrasikan. Pemilih tab DOM memakai token/atribut aksesibilitas komponen sebelumnya.
- Chrome: tujuh tab, perubahan alamat/seleksi, penggantian tabel dan cleanup berhasil. Build transisi berhasil; pemeriksaan batas internal audit/tema juga berhasil setelah sesi/navigasi menjadi native.

## Batch 13 — Siklus dialog bersama
- Komponen Dialog React kini hanya adaptor portal ke `ui/dialog-dom.js`; implementasi ganda backdrop, trap fokus, tumpukan/inert, Esc, kunci gulir, dan pemulihan fokus dihapus dari TSX. Kepala dialog masih React selama konsumennya memerlukan children React.
- Chrome pada aplikasi internal asli: aksi PDP membuka formulir ROPA React melalui dialog native; fokus, Esc, kunci/pemulihan gulir dan cleanup berhasil. Dua suite lapisan/riwayat lulus (17 pengujian); build transisi berhasil.

## Batch 14 — Kerangka dan menu native
- `tata-letak-native.js`, menu samping, serta ikon menu menggunakan DOM native. Kerangka TSX hanya memasang portal untuk halaman dan tombol pesan yang belum dimigrasikan; dua TSX menu/ikon lama dihapus.
- Build transisi berhasil. Chrome pada aplikasi internal: penanda aktif, perpindahan menu, penggantian isi portal, browser back, dan dialog/formulir lama berhasil.

## Checkpoint aktif
- Instruksi terbaru mengesampingkan alur validasi sebelumnya: jangan menjalankan test, build, cek sintaks/import/export, browser, troubleshooting hasil konversi, atau final regression. Pemeriksaan pada batch lama hanya catatan historis sebelum perubahan instruksi.
- Entry browser tetap `main.js`, kini mengimpor `app-internal.js` native. Provider, portal/adaptor React–DOM, entry React dan hook sementara dari migrasi sebelumnya dihapus. Aplikasi boleh belum tersambung/berjalan selama konversi.
- Batch 1–7 dipertahankan. Fondasi sesi/navigasi/izin, kerangka/menu, UI DOM, pengendali draf/debounce/daftar, seluruh tab dan modal PDP, sesi kanal WA/IG, avatar, bersihkan pesan, pemilih pasien, menu aksi, LOINC/wilayah, pencarian kode/kamus, serta modal jenis akun/master-profil telah memiliki source native.
- JSX presentasi tanpa hook telah dikonversi massal menjadi elemen/style/event DOM inline menggunakan transformasi mekanis satu kali. Tidak ada runtime JSX, renderer pengganti React, atau sistem build baru. Komponen stateful/lifecycle masih dikonversi manual.
- Masih tersisa TSX/state React pada view pesan/koneksi/info kontak, halaman klinis/administrasi, modal akun dan pelayanan. Sebagian konsumen utilitas sudah diganti import/nama tetapi lifecycle pemanggilnya belum dikonversi. Jangan menganggap source tersebut sudah tersambung atau siap dijalankan.
- Pengkabelan root/panel pesan dan cleanup antarhalaman juga belum tuntas; selesaikan melalui konversi source, tanpa menjalankan pemeriksaan atau perbaikan berdasarkan uji.
- Dependensi/config React/TypeScript/Vite dan penyajian frontend lama masih perlu dibersihkan setelah source konsumen selesai. Jangan menyatakan migrasi keseluruhan selesai.

## Pekerjaan berikutnya
- Lanjutkan batch besar: modal pelayanan/klinis dan komponen state terkait; halaman pasien/farmasi/penunjang/rawat inap/kasir/rekam medis beserta tabelnya; view pesan, koneksi dan info kontak WA/IG. Atur izin, pembuatan akun, seluruh tab Akses/Pengaturan klinik, profil dan website sudah dikonversi pada Batch 27–31; jangan diulang.
- Pakai API native `bukaModal1`, `bukaModalBertahap`, `bukaPanel`, utilitas draf/debounce/daftar dan `ui/native.js`. Konsumen lama harus dikonversi ke lifecycle/event/DOM eksplisit, bukan diberi adaptor React baru atau runtime hook pengganti.
- Selesaikan root navigasi/pemasangan halaman dan panel, lalu ubah penyajian HTML/CSS/modul serta script/dependensi/config agar tidak memakai bundler/kompilasi.
- Tidak ada pengujian atau validasi sampai pengguna memberikan instruksi terpisah. Tidak membuat backup, snapshot, branch, worktree, atau dokumentasi/checkpoint lain.

## Perubahan instruksi — konversi tanpa validasi
- Pengguna menghentikan seluruh test, build, pemeriksaan sintaks/import, browser, dan validasi teknis. Mulai checkpoint ini hanya konversi kode; aplikasi tidak perlu dapat dijalankan selama pengerjaan.
- Kompatibilitas React–DOM tidak lagi dipertahankan. Adaptor portal, provider React, entry point React dan hook sementara dihapus; konsumen yang belum dikonversi dapat belum terhubung.

## Batch 15 — Modal bertahap dan ROPA
- Pengendali langkah DOM dan modal ROPA native ditulis sebelum perubahan instruksi; TSX ROPA dihapus. Pemeriksaan yang selesai sebelum penghentian tetap catatan historis; tidak diulang.

## Batch 16 — Konversi massal UI dan penghapusan adaptor
- Tombol, isian, area teks, pilihan, checkbox, kartu, lencana, peringatan, susunan, tabel, penanda, tab, ikon, logo, bilah penyaring, paginasi, panel detail, dan halaman sementara dikonversi mekanis dari JSX ke operasi DOM langsung. Tidak menggunakan runtime JSX/renderer baru.
- Sesi, navigasi, izin dan entry point internal menggunakan modul native. Seluruh adaptor React–DOM sementara dari batch sebelumnya dihapus; entry point mengarah ke pengelola halaman native.
- Tidak menjalankan pengujian, build, pemeriksaan sintaks/import maupun browser untuk batch ini. Pengkabelan lifecycle konsumen interaktif yang masih TSX berlanjut pada batch berikutnya.

## Batch 17 — Kontrol interaktif dan modal bersama
- Info bantuan memakai tooltip body dan event browser; pilihan pil memakai radiogroup/keyboard native.
- Modal satu layar, modal bertahap, konfirmasi/perlindungan tutup, serta panel memakai pengelola dialog native tanpa portal/provider React. TSX komponen tersebut dihapus.
- Tidak ada pengujian atau validasi. Konsumen modal yang belum dikonversi perlu memakai API imperative `buka...` saat batch konsumen dikerjakan; belum diklaim dapat dijalankan.

## Batch 18 — DPIA native
- Risiko, mitigasi, saran PPDP, tinjau ulang, daftar ROPA asinkron, checkbox peninjauan, validasi bisnis dan penyimpanan DPIA dipindahkan ke modal bertahap DOM.
- Tab DPIA membuka modal native langsung; TSX DPIA dihapus. Tidak menjalankan pengujian atau validasi apa pun.

## Batch 19 — Pemilih pasien dan prosesor
- Pemilih pasien memakai input/select DOM, penundaan pencarian native, API daftar pasien dan cleanup permintaan/timer.
- Modal prosesor memakai tiga langkah native: identitas, butir perjanjian, daftar sub-prosesor dinamis dan SLA. Pembentukan payload, izin, pesan, hasil dan perlindungan tutup mengikuti kode sebelumnya.
- Kedua TSX dihapus; tidak menjalankan pengujian atau validasi.

## Batch 20 — Seluruh alur PDP native
- Catat permintaan hak, keputusan/pelaksanaan/notifikasi hak, insiden beserta pasien terdampak, serta rencana/perintah/pelaksanaan/berita acara pemusnahan dikonversi ke modal bertahap DOM.
- Helper bidang PDP dipakai untuk input, pesan bidang, dan lifecycle pemilih pasien; skema/pembentuk payload, batas waktu, tahap baca-saja, dan API lama tetap digunakan.
- Semua tab PDP kini membuka modal native langsung; empat TSX terakhir kelompok modal PDP dihapus. Tidak menjalankan pengujian atau validasi.

## Batch 21 — Presentasi klinis dan administrasi tanpa state hook
- Transformasi massal diterapkan pada sisa komponen TSX yang tidak memiliki lifecycle/state hook: JSX, fragmen, komponen fungsional dan createElement menjadi pembuatan elemen/event/style DOM langsung; anotasi TypeScript dihapus.
- Import relatif hasil konversi diarahkan ke JavaScript. Komponen dengan state/lifecycle tetap dikerjakan manual agar tidak membuat runtime pengganti React.
- Tidak menjalankan pengujian, build, pemeriksaan sintaks/import ataupun browser.

## Batch 22 — Lifecycle kanal pesan native
- Dua context React WhatsApp/Instagram diganti sesi kanal native: websocket/reconnect, perubahan pengguna/izin, ringkasan belum dibaca, daftar berhalaman, draf, notifikasi, serta saling tutup panel.
- Avatar dan konfirmasi bersihkan pesan menjadi DOM native. Entry point menghidupkan/mematikan sesi kanal secara eksplisit; provider React dihapus.
- View percakapan/koneksi/info kontak yang masih TSX belum selesai dikonversi. Tidak menjalankan pengujian atau validasi.

## Batch 23 — Pencarian dan menu tindakan native
- Menu tindakan memakai elemen body, penempatan viewport, keyboard dan cleanup event native.
- Pencarian LOINC mempertahankan kode manual, saran, kelas, nama, hak cipta, penundaan API dan pesan galat. Wilayah mempertahankan resolusi kode tersimpan, combobox/keyboard, cache pilihan, status dan pencarian tertunda.
- Tiga TSX dihapus. Penggantian konsumen resolver nama wilayah berlanjut bersama konversi halaman terkait. Tidak menjalankan pengujian atau validasi.

## Batch 24 — Pencarian terminologi dan kamus
- Pencarian kode, sumber tambahan, padanan Indonesia/KPTL, contoh, tambah manual dan kamus alfabet/angka berhalaman memakai DOM, debounce, API dan panel native.
- Dua TSX dihapus. Tidak menjalankan pengujian, build, pemeriksaan ataupun validasi.

## Batch 25 — Jenis akun dan paket izin native
- Modal buat/ubah jenis akun menjadi DOM: nama, syarat profesi, katalog izin asinkron per fitur, pilih/lepas kelompok, alasan perubahan dan penyimpanan memakai helper aturan/payload lama.
- TSX modal dihapus; tidak menjalankan pengujian atau validasi.

## Batch 26 — Master/profil native
- Modal tambah/ubah master berbasis definisi shared menjadi DOM: bidang kondisional, rujukan asinkron, pilihan lama, aturan wajib/petunjuk, angka/tanggal/waktu, ICD-9-CM dan kamus.
- Skema, deteksi perubahan, pembentukan masukan dan API lama dipertahankan. TSX dihapus; tidak menjalankan pengujian atau validasi.

### Kelanjutan setelah Batch 26
- `PencarianKode`, panel kamus dan daftar hasil memiliki modul DOM sendiri. Modal jenis akun (`bukaModalJenisAkun`) dan master/profil (`bukaModalMasterProfil`) sudah imperative; pemanggil administrasi yang masih TSX belum seluruhnya diubah ke API ini.
- Konsumen stateful yang tersisa harus dikonversi manual menggunakan state lokal, event browser, dan lifecycle eksplisit. Jangan memakai adaptor React, runtime hook tiruan, atau menjalankan source hasil konversi untuk memeriksanya.
- Tidak ada pengujian/validasi sejak instruksi penghentian; status kelengkapan dan pengkabelan aplikasi tetap belum selesai.

## Batch 27 — Atur izin, peringatan dan panel akses
- Atur izin menjadi modal native: penugasan/periode, tambahan/pengurangan izin, pencarian katalog, pemuatan ulang, akses efektif dan konfirmasi peringatan 409.
- Form/dialog peringatan serta panel detail memakai DOM/dialog native. State form dan pengulangan tindakan tetap memakai helper domain/payload sebelumnya.
- TSX Atur izin dan peringatan dihapus; tanpa pengujian atau validasi.

## Batch 28 — Pembuatan akun dan draf native
- Lima langkah pembuatan akun menjadi DOM native, memakai presentasi langkah dan helper bisnis yang sudah dikonversi. Katalog asinkron, kunjungan langkah, penahanan Lanjut, peringatan beralasan, hasil kredensial dan draf lokal dipertahankan.
- Modal langkah native mendukung konteks/header, catatan draf, pilihan langkah awal dan callback navigasi/lanjut untuk alur ini. TSX pembuatan akun dihapus.
- Tidak menjalankan pengujian, build atau validasi.

## Batch 29 — Administrasi pengguna, jenis akun dan peringatan
- Tabel pengguna, jenis akun dan peringatan memakai DOM, izin native, URL penyaring/paginasi, modal akun native, status akun, alasan perubahan dan panel riwayat.
- Header/tab halaman Akses dan Pengaturan klinik menjadi pengelola halaman native; tab keamanan/profil/backup masih dilanjutkan pada batch berikutnya. Panel detail mendukung perubahan isi asinkron tanpa membuka ulang lapisan.
- Empat TSX dihapus. Tidak menjalankan pengujian atau validasi.

## Batch 30 — Keamanan dan backup native
- Kebijakan keamanan memakai form DOM, batas angka/skema shared, izin baca/ubah, status bawaan dan penyimpanan API.
- Riwayat backup, unduh, pilihan unggah, konfirmasi pemulihan dan konfirmasi ketik RESET menjadi DOM native. Tidak menjalankan operasi backup/reset atau mengubah database selama konversi.
- Dua TSX dihapus; tidak menjalankan pengujian atau validasi.

## Batch 31 — Profil klinik dan website native
- Profil klinik, izin baca/ubah, riwayat perubahan berhalaman dan pengaturan website menjadi DOM native.
- Website mempertahankan slug/domain, konten, gambar/preset/pratinjau, warna/kontak, pilihan jadwal/praktisi, skema shared dan perlindungan beforeunload.
- Seluruh tab Pengaturan klinik/Akses sekarang memiliki source native. Dua TSX dihapus; tidak menjalankan pengujian atau validasi.

### Checkpoint setelah Batch 31
- Ekspor modal akun: `bukaAturIzin`, `bukaPembuatanAkun`, `bukaModalJenisAkun`, `bukaModalMasterProfil`. Form/dialog peringatan dan panel detail native mendukung lifecycle langsung.
- `halaman/pengaturan.js` adalah pengelola tab native. Enam tab memakai ekspor `pasangTabPengguna`, `pasangTabJenisAkun`, `pasangTabPeringatan`, `pasangTabKeamanan`, `pasangTabProfil`, dan `pasangTabBackup`.
- Tidak menjalankan test, build, cek sintaks/import/export, browser, atau validasi. Source hasil konversi belum diperiksa; pengkabelan seluruh aplikasi tetap belum selesai.

## Batch 32 — Status klaim dan pengambilan spesimen native
- Modal status klaim menjadi DOM native dengan aksi sesuai status, bidang kondisional, validasi bisnis saat submit, riwayat, perlindungan perubahan dan hasil simpan. Ekspor: `bukaUbahStatusKlaim`.
- Pengambilan spesimen menjadi modal native: pilihan beberapa order, asal/waktu/petugas, pencatatan berurutan, pemuatan ulang sisa order setelah kegagalan parsial, serta pemberitahuan selesai. Ekspor: `bukaAmbilSpesimen`.
- Dua source TSX dihapus. Pemanggil klinis yang masih TSX akan disambungkan saat konversi kelompok pemanggil; tidak membuat adaptor React.
- Tidak menjalankan test, build, pemeriksaan sintaks/import/export, browser, atau validasi. Modul klinis lain, tampilan pesan dan finalisasi penyajian/dependensi masih tersisa.

## Batch 33 — Harga tagihan dan penutupan kunjungan native
- Pelengkapan harga item tagihan menjadi komponen DOM `LengkapiHarga` dengan state angka per item, penyimpanan API, status proses, pembaruan gambaran dan lifecycle eksplisit.
- Modal `bukaUbahHarga` mempertahankan harga acuan, alasan wajib, helper aturan bisnis dan API perubahan harga. Modal `bukaTutupKunjungan` mempertahankan syarat kasir/resep/tagihan, pengecualian JKN, alasan belum lunas dan pelengkapan harga langsung.
- Tiga TSX dihapus; tidak menyediakan adaptor React. Pemanggil kasir/detail kunjungan akan memakai ekspor native saat dikonversi.
- Tidak menjalankan pengujian, build, pemeriksaan sintaks/import/export, browser atau validasi. Berikutnya: pembayaran/shift kasir dan pemanggil kelompok kasir; klinis lain, pesan dan pembersihan penyajian/dependensi masih tersisa.

## Batch 34 — Shift, tarif tambahan dan serah obat native
- Buka/tutup shift menjadi `bukaShiftKasir`, mempertahankan kas awal/akhir, selisih, alasan, helper aturan bisnis dan API.
- `TambahItemTarif` memakai form DOM, katalog tarif dari gambaran kasir, jumlah, status proses dan lifecycle langsung.
- Hook serah obat diganti controller `buatSerahObat`: resep/status, stok kurang, izin dan alasan pengecualian, API penyerahan dan pemuatan ulang. Modal mandiri memakai `bukaSerahTerimaObat`.
- Tiga TSX dihapus. Tidak menjalankan pengujian atau validasi. Pembayaran akan menggabungkan controller serah obat dan komponen tagihan native; pemanggil lain masih menunggu konversi.

## Batch 35 — Pembayaran bertahap native
- `bukaPembayaran` mengelola langkah Tagihan/Pembayaran/Serah obat melalui DOM, state lokal dan event browser. Izin kasir/farmasi menentukan langkah; status resep dapat menambahkan langkah serah setelah pemuatan.
- Memakai komponen harga/tarif dan modal ubah harga native; mempertahankan penghapusan item manual, harga acuan/alasan, ringkasan tagihan, riwayat pembayaran, beberapa metode, kembalian, pengecualian JKN dan syarat shift/tagihan.
- Controller serah obat native dipakai bersama modal Farmasi. Lifecycle modal/permintaan/komponen anak eksplisit; TSX pembayaran dihapus tanpa adaptor React.
- Tidak menjalankan pengujian, build, cek sintaks/import/export, browser atau validasi. Pemanggil kasir/daftar pasien/farmasi masih perlu dikonversi dan disambungkan ke ekspor native. Modul klinis lain, UI pesan dan pembersihan React/Vite/penyajian masih tersisa.

## Batch 36 — Master obat dan mutasi stok native
- `bukaMasterObat` mempertahankan pencarian KFA berjeda dengan pembatalan hasil lama, pilihan referensi aktif/lokal, rute, harga, satuan, status aktif, deteksi perubahan dan API master.
- `bukaMutasiStok` memakai DOM untuk penerimaan/pengeluaran/koreksi, pilihan batch, kedaluwarsa, alasan dan riwayat; stok dimuat kembali setelah pencatatan.
- Dua TSX dihapus; tanpa pengujian atau validasi. Tab Farmasi selanjutnya memakai kedua modal native.

## Batch 37 — Halaman Farmasi native
- Halaman Farmasi dan kedua tab menjadi DOM native, dengan tab URL/ingatan sesi, pencarian master berjeda, paginasi, izin tindakan, status stok/resep dan filter tanggal riwayat.
- Tab master memakai `bukaMasterObat`/`bukaMutasiStok`; tab riwayat memakai `bukaSerahTerimaObat`. Permintaan lama diabaikan dan modal/timer dilepas saat halaman ditutup.
- Tiga TSX dihapus; tidak menjalankan test, build, pemeriksaan sintaks/import/export, browser atau validasi.
- Berikutnya: kelompok Penunjang atau pemanggil kasir/daftar pasien, lalu modul klinis dan pesan yang tersisa. Penyajian frontend/dependensi React/Vite belum difinalisasi; aplikasi belum diklaim dapat dijalankan.

## Batch 38 — Penunjang dan master pemeriksaan native
- Modal `bukaMasterPemeriksaan` memakai form DOM, pencarian LOINC native, rentang/teks rujukan, harga umum/JKN, status aktif, helper masukan/perubahan dan API lama.
- Halaman Penunjang dan kedua tab menjadi DOM native: URL/ingatan tab, pencarian master berjeda, izin tambah/perbaikan/status, rekap berfilter status/tanggal, interpretasi hasil dan paginasi.
- Empat TSX dihapus. Lifecycle pencarian, permintaan dan modal eksplisit; tidak membuat kompatibilitas React.
- Tidak menjalankan test, build, cek sintaks/import/export, browser atau validasi. Berikutnya: modal pekerjaan lab serta konsumen klinis/kasir/rekam medis; UI pesan dan finalisasi penyajian/dependensi masih tersisa.

## Batch 39 — Rincian order, hasil penunjang dan salinan klinis native
- `HasilPenunjangKunjungan` dan `RingkasanOrderKunjungan` menjadi komponen DOM dengan pembaruan props/lifecycle eksplisit, pemuatan API, hasil lab tersimpan, status resep dan ringkasan pilihan draf.
- `bukaPanelSalin` menggantikan panel React: riwayat sumber, pemuatan salinan, pilihan bagian dan penerapan ke draf lewat callback lama. Respons sumber lama diabaikan ketika pilihan berganti.
- Tiga TSX dihapus; tidak menjalankan pengujian, build, cek sintaks/import/export, browser atau validasi.
- Konsumen pemeriksaan klinis masih perlu memakai ekspor native dan melepas lifecycle komponen anak. Modal order/hasil lab, modul klinis lain, pesan serta finalisasi dependensi/penyajian masih tersisa.

## Batch 40 — Form dan modal order lab native
- `FormOrderLab` menjadi komponen DOM bersama dengan pembaruan state eksplisit: pencarian pemeriksaan, pilihan terpisah, tarif sesuai cara bayar, biaya perkiraan, prioritas dan catatan; mode ringkas tetap tersedia untuk pemeriksaan klinis.
- `bukaOrderLab` memakai form native tersebut, katalog aktif asinkron, helper masukan/aturan bisnis, perlindungan perubahan dan hasil order/tagihan dari API.
- Dua TSX dihapus. Tidak menjalankan test, build, cek sintaks/import/export, browser atau validasi.
- Berikutnya: hasil lab dan konsumen pemeriksaan klinis; modul klinis lainnya, pesan dan finalisasi React/Vite/penyajian masih tersisa.

## Batch 41 — Hasil lab bertahap native
- `bukaHasilLab` menggantikan modal React: nilai per pemeriksaan, interpretasi/saran rujukan, catatan, ringkasan dan pilihan pengesahan memakai DOM serta state lokal.
- Draf server dipulihkan setelah order dan draf tersedia, dapat dibuang, disimpan lewat controller native dan dihapus setelah penyimpanan berhasil. Alur menyimpan hasil/pengesahan/addendum mempertahankan API dan helper bisnis lama; kegagalan parsial memuat ulang order.
- TSX hasil lab dihapus. Tidak menjalankan test, build, cek sintaks/import/export, browser atau validasi.
- Berikutnya: konsumen pemeriksaan klinis dan kelompok modal terkait, halaman pasien/kasir/rekam medis, UI pesan, lalu finalisasi penyajian dan dependensi. Pengkabelan dan hasil konversi belum diperiksa.

## Batch 42 — Penempatan rawat inap dan keterangan asuransi native
- `bukaUbahPenempatan` menjadi modal DOM: opsi bed/kelas/indikator/tarif, alasan perpindahan, DPJP utama/bersama, riwayat penempatan, helper bisnis dan API lama.
- `KeteranganAsuransi` menjadi komponen DOM baca saja dengan pemuatan pasien dan lifecycle/pembaruan pasien eksplisit; respons lama diabaikan.
- Dua TSX dihapus. Tidak menjalankan pengujian, build, cek sintaks/import/export, browser atau validasi.
- Berikutnya: admisi/pemulangan dan konsumen rawat inap, pemeriksaan klinis serta halaman pasien/kasir/rekam medis; UI pesan dan finalisasi dependensi/penyajian belum selesai.

## Batch 43 — Admisi dan pemulangan rawat inap native
- `bukaAdmisiRawatInap` memakai lima langkah DOM: pemilih pasien native, pemeriksaan asal kunjungan/SPRI, cara bayar/asuransi, bed/kelas/tarif, DPJP utama/bersama dan ringkasan. Lifecycle komponen anak dan respons asal pasien eksplisit.
- `bukaPemulanganRawatInap` mempertahankan ringkasan/terapi, diagnosis akhir, disposisi/kondisi, tindak lanjut, pilihan resume, helper bisnis dan hasil tagihan kamar/resume dari API.
- Dua TSX dihapus. Tidak menjalankan test, build, cek sintaks/import/export, browser atau validasi.
- Berikutnya: halaman rawat inap dan konsumen modal native, lalu pemeriksaan klinis/pasien/kasir/rekam medis serta UI pesan. Finalisasi penyajian dan pembersihan React/Vite masih tertunda sampai konversi konsumen selesai.

## Batch 44 — CPPT dan pengelolaan master bersama native
- `bukaCatatanHarian` memakai form SOAP/instruksi/tanda vital DOM, helper bisnis dan API pencatatan; riwayat/verifikasi serta mode sudah pulang tetap tersedia.
- `DaftarMaster` dan `KelolaMasterTab` menjadi DOM native: definisi kolom shared, jenis/status/tingkat/pencarian di URL, paginasi, izin, modal master native dan konfirmasi aktif/nonaktif.
- Tiga TSX dihapus; tidak menjalankan pengujian atau validasi. Halaman rawat inap selanjutnya memakai CPPT dan master bersama native ini.

## Batch 45 — Halaman rawat inap native
- Papan bed menjadi DOM native dengan kelompok ruang, ringkasan kapasitas, penghuni/status, pasien menunggu, serta tindakan berbasis izin.
- Admisi, CPPT, perubahan penempatan dan pemulangan memakai modal native Batch 42–44; tab ruang/bed memakai master bersama native. URL/ingatan tab dan lifecycle halaman/modal eksplisit.
- TSX halaman dihapus. Tidak menjalankan test, build, cek sintaks/import/export, browser atau validasi.
- Berikutnya: pemeriksaan klinis dan konsumen pasien/kasir/rekam medis, kemudian UI WhatsApp/Instagram; finalisasi penyajian/dependensi masih tersisa. Source hasil konversi belum diperiksa.

## Batch 46 — Penyiapan dan daftar klaim native
- `bukaPenyiapanKlaim` menggantikan empat langkah React dengan DOM: kandidat kunjungan/SEP, kode rekam medis, checklist berkas dan ringkasan; pembaruan berkas memakai API/helper lama.
- `TabKlaim` menjadi daftar DOM dengan penyaring, ringkasan status, batas waktu, paginasi dan pemanggilan modal penyiapan/status native.
- Dua TSX dihapus; tidak menjalankan pengujian atau validasi. Konversi seluruh kode masih berlanjut.

## Batch 47 — Halaman Kasir dan klaim native
- Halaman dan tab Shift/rekap menjadi DOM: shift aktif, buka/tutup shift native, tanggal rekap, ringkasan metode pembayaran dan riwayat kas/selisih.
- Tab Klaim memakai Batch 46 dan tab tarif memakai master bersama native; tab sesuai izin, URL/ingatan sesi dan pelepasan lifecycle eksplisit.
- TSX halaman dihapus. Tidak menjalankan pengujian atau validasi. Berikutnya melanjutkan kelompok rekam medis dan klinis serta pesan; finalisasi dependensi/penyajian tetap menunggu konversi semua konsumen.

## Batch 48 — Peninjauan pembukaan dan perbaikan rekam medis native
- Dua modal peninjauan menjadi DOM: rincian pemohon/dasar/cakupan pembukaan dan perbandingan isi sekarang/usulan perbaikan, status/verifikasi, catatan keputusan, persetujuan/penolakan dan hasil API.
- Ekspor `bukaTinjauPembukaan` dan `bukaTinjauPerbaikan`; dua TSX dihapus. Alasan penolakan, izin keputusan pembukaan dan perlindungan catatan dipertahankan.
- Konversi mekanis struktur modal dilakukan dengan generator sekali pakai; tidak menambahkan runtime atau adaptor React. Tidak menjalankan pengujian atau validasi.

## Batch 49 — Permintaan pembukaan dan penyampaian rekam medis native
- Modal pembukaan bertahap memakai pemilih pasien native, pemohon/instansi, dasar hukum/rincian/cakupan, penyamaran identitas dan ringkasan.
- Pencatatan penyampaian menjadi form DOM dengan penerima/hubungan/bentuk, bukti persetujuan kondisional dan catatan. API/skema/helper lama dipertahankan.
- Ekspor `bukaPermintaanPembukaan` dan `bukaPenyampaianRm`; dua TSX dihapus. Tidak menjalankan pengujian atau validasi.

## Batch 50 — Antrean dan riwayat rekam medis native
- Tab pembukaan, perbaikan dan penyampaian menjadi daftar DOM berfilter dan berhalaman. Rincian, izin tindakan, jumlah menunggu dan modal native Batch 48–49 dipakai langsung.
- Tiga TSX dihapus dengan generator source sekali pakai untuk struktur daftar yang serupa; tanpa runtime pengganti React.
- Tidak menjalankan pengujian atau validasi. Tab berkas/laporan, root rekam medis, konsumen klinis dan pesan masih dilanjutkan.

## Batch 51 — Detail dan cetak rekam medis native
- `DetailKunjungan` memakai pemuatan/lifecycle DOM, ringkasan klinis, komponen order/hasil native dan pengesahan per bagian.
- `bukaCetakRekamMedis` menggantikan portal React dengan lapisan DOM, fokus/keyboard dan dialog cetak browser. Tata letak/formulir cetak lama dikonversi mekanis ke `lembar-rekam-medis.js`; CSS cetak dimuat sebagai stylesheet browser.
- Dua TSX dihapus; transformasi source saja, tidak menjalankan test, build, pemeriksaan atau validasi.

## Batch 52 — Riwayat pasien dan laporan native
- `bukaPanelRiwayat` memakai kartu DOM dan detail kunjungan native yang dipasang/dilepas saat pilihan berubah.
- `bukaLaporanRm` mempertahankan jenis/rentang tanggal, tabel hasil dan ekspor CSV memakai API/helper lama.
- Dua TSX dihapus. Tidak menjalankan pengujian atau validasi; konversi berkas/resume dan konsumen klinis masih dilanjutkan.

## Batch 53 — Resume dan surat native
- `bukaResumeSurat` memakai empat langkah DOM dengan detail kunjungan native, resume/kondisi/anjuran, alasan perubahan, surat bernomor, ringkasan dan hasil simpan.
- Helper perbandingan/masukan dan API tetap dipakai; pengesahan versi resume, syarat tahap kasir/ditutup dan penanda penyimpanan parsial dipertahankan.
- TSX dihapus; tidak menjalankan pengujian atau validasi. Konsumen berkas dan perbaikan catatan masih dilanjutkan.

## Batch 54 — Langkah pemeriksaan dan perbaikan catatan native
- JSX presentasi langkah pemeriksaan dikonversi mekanis ke operasi DOM; state odontogram menjadi event browser dan visibilitas bidang tanggal langsung.
- `bukaPerbaikiCatatan` memakai pemilihan bagian tersahkan, editor DOM lama yang dikonversi, alasan perubahan, helper bisnis serta API permintaan/perbaikan versi.
- Dua TSX dihapus. Tidak menjalankan pengujian atau validasi. Konsumen pemeriksaan utama serta lifecycle editor kompleks masih bagian konversi berkelanjutan, belum diperiksa.

## Batch 55 — Halaman rekam medis dan tab berkas native
- Tab berkas/resume memakai daftar DOM dengan pencarian/rentang tanggal, paginasi, arsip/perbaikan menunggu dan modal riwayat/resume/perbaikan/laporan native.
- Root rekam medis mengelola lima tab sesuai izin, URL dan ingatan sesi, dengan pelepasan lifecycle tab/modal.
- Dua TSX dihapus. Tidak menjalankan test, build, pemeriksaan sintaks/import/export, browser atau validasi.
- Konversi menyeluruh belum selesai: pemeriksaan klinis/pasien dan modul pesan masih tersisa, termasuk pengkabelan root/panel serta pembersihan React/Vite dan penyajian tanpa bundler. Lanjut langsung dari kelompok klinis yang tersisa; jangan mengulang Batch 1–55.

## Batch 56 — Koneksi WhatsApp dan Instagram native
- Kedua panel koneksi menjadi DOM dengan langganan revisi sesi pesan, state proses/galat, masuk/keluar, reset sesi pesan dan komponen pembersihan native.
- QR WhatsApp serta hasil OAuth/konfigurasi Instagram dan pembatasan alamat login dipertahankan. API koneksi tidak dijalankan selama konversi.
- Dua TSX dihapus. Tidak menjalankan pengujian atau validasi. Antarmuka percakapan dan info kontak masih dilanjutkan.

## Batch 57 — Info kontak kedua kanal native
- Info kontak WhatsApp/Instagram memakai DOM untuk profil, penanggung jawab, pencarian pasien berjeda, pilihan/konfirmasi tautan dan perubahan API.
- State lokal, pembatalan hasil pencarian lama, fokus panel kecil dan pelepasan timer/lifecycle eksplisit. CSS/kelas panel lama dipertahankan.
- Dua TSX dihapus lewat templating source sekali pakai; tidak membuat runtime bersama pengganti React. Tidak menjalankan pengujian atau validasi.

## Batch 58 — Antarmuka percakapan kedua kanal native
- Antarmuka WhatsApp/Instagram memakai operasi DOM langsung untuk peluncur/panel, daftar/pencarian/filter kontak, percakapan, tanggal/status baca, draf, kirim/lampiran 8 MB, pratinjau media, info kontak dan layout responsif.
- Logika domain yang sama kedua kanal ditempatkan di `pesan/tampilan-native.js` (controller UI khusus percakapan, bukan runtime komponen/hook/JSX). Perbedaan kontak baru WA, identitas IG, lampiran tanpa caption IG, API/avatar/logo masing-masing tetap dipertahankan.
- Dua TSX dihapus. Tidak menjalankan test, build, cek sintaks/import/export, browser atau validasi. Root halaman/panel perlu disambungkan; konversi klinis tersisa dan finalisasi penyajian/dependensi belum selesai.

## Batch 59 — Halaman kanal dan lapisan pesan native
- Halaman masing-masing kanal dan pemilih kanal root memakai DOM, status koneksi, URL/tab sesuai izin dan lifecycle eksplisit.
- Root internal memasang peluncur/panel kedua kanal serta melepasnya saat aplikasi ditutup; source pemilih kanal lama diganti sepenuhnya dalam konversi ini.
- Dua TSX dihapus. Tidak menjalankan pengujian atau validasi. Sisa utama: alur pasien/pemeriksaan klinis dan komponennya, lalu penyajian browser serta pembersihan dependensi/config React/TS/Vite. Jangan mengulang Batch 1–59.

## Batch 60 — Family folder serta favorit/templat native
- `bukaPanelKeluarga` memakai DOM untuk wali/anggota, penanda privasi, pencarian pasien berjeda dan tautan/hubungan; API lama dan izin dipertahankan.
- `bukaPanelFavorit` memakai DOM untuk kode favorit, urutan/tambah/hapus/pakai, serta daftar/simpan/hapus/pakai templat pribadi. Callback editor dan helper isi templat tetap dipakai.
- Dua TSX dihapus. Tidak menjalankan pengujian atau validasi. Berikutnya melanjutkan alur pasien/pemeriksaan klinis tersisa, kemudian finalisasi source browser serta pembersihan dependensi. Batch 1–60 jangan diulang.

## Batch 61 — Editor resep dan pilihan penunjang native
- Pencarian obat menjadi combobox DOM dengan navigasi keyboard, master aktif dan pembaruan pilihan eksplisit.
- Editor item resep memakai form DOM, jumlah/stok, aturan/bentuk/rute, tambah/hapus, biaya dan lifecycle pencarian; pilihan lab memakai FormOrderLab native dan katalog asinkron.
- Tiga TSX dihapus; tidak menjalankan pengujian atau validasi. Berikutnya telaah resep serta alur pasien/pemeriksaan yang tersisa.

## Batch 62 — Telaah resep native
- `bukaTelaahResep` memakai editor item native, ringkasan klinis/alergi, checklist telaah, catatan dan penyiapan beberapa resep lewat helper simpan lama.
- Hasil parsial, kekurangan stok, status terkunci dan callback muat ulang dipertahankan; lifecycle editor eksplisit.
- TSX dihapus. Tidak menjalankan pengujian atau validasi; konversi pasien/persetujuan/pemeriksaan utama masih berlanjut.

## Batch 63 — Persetujuan tindakan native
- Modal persetujuan menjadi state lokal dan modal bertahap native; tampilan langkah lama dikonversi mekanis ke DOM untuk mempertahankan pilihan tindakan/manual, teks versi, penandatangan/wali/saksi dan ringkasan.
- API/helper lama, perlindungan perubahan dan hasil pencatatan dipertahankan. TSX dihapus; tanpa pengujian atau validasi.

## Batch 64 — Detail/edit pasien dan sisa presentasi akun
- Detail pasien menjadi panel native; edit pasien memakai state lokal, tab/form DOM, skema perbaikan, wali/penjamin dan API lama. Presentasi JSX dipertahankan lewat transformasi source mekanis.
- Dua source presentasi akun TSX yang masih tersimpan dikonversi ke JS pada path asal; konsumen akun native tetap dipakai.
- Empat TSX dihapus; tidak menjalankan pengujian atau validasi. Registrasi/kunjungan, daftar pasien dan pemeriksaan utama masih dilanjutkan.

## Batch 65 — Pendaftaran kunjungan native
- Modal memakai pencarian pasien/keyboard native, opsi layanan/poli/dokter, cara bayar/SEP/asuransi, keluhan, helper bisnis/API dan hasil nomor antrean.
- Timer/respons pencarian dan komponen asuransi memiliki lifecycle eksplisit. TSX dihapus; tanpa pengujian atau validasi.

## Batch 66 — Langkah registrasi native
- Presentasi identitas/duplikat, sosial, penjamin, consent dan konteks pasien dikonversi ke DOM; form tambahan wali memakai state bidang browser dan ringkasan wilayah memakai resolver native.
- TSX langkah dihapus; tidak menjalankan pengujian atau validasi. Registrasi induk dan dua konsumen besar terakhir dilanjutkan.

## Batch 67 — Registrasi pasien native
- Enam langkah registrasi dikelola langsung dengan state/event DOM dan modal native, pemulihan/penyaringan draf lokal, deteksi duplikat berjeda/ulang saat konflik, general consent, hasil nomor RM dan lanjut kunjungan.
- TSX induk dihapus. Tidak menjalankan pengujian atau validasi; sisa konsumen besar daftar pasien/pemeriksaan utama dan finalisasi penyajian/dependensi dilanjutkan.

## Batch 68 — Pemeriksaan klinis utama native
- Pengelola pemeriksaan/skrining memakai state lokal, modal langkah native dan helper bisnis lama: draf server, skrining, anamnesis/pemeriksaan, lab, diagnosis, tindakan/resep, tindak lanjut, ringkasan dan pengesahan per bagian.
- Panel riwayat/salin/favorit/keluarga dipanggil lewat API imperative native. Alur simpan bertahap dan penanda kegagalan parsial/resep/lab dipertahankan; presentasi langkah dikonversi mekanis tanpa runtime JSX.
- TSX utama dihapus. Tidak menjalankan pengujian atau validasi. Daftar pasien dan finalisasi dependensi/penyajian masih dilanjutkan.

## Batch 69 — Daftar pasien dan pemanggil klinis native
- Halaman daftar pasien memakai state lokal/DOM, filter URL/tanggal/pencarian berjeda, pintasan pencarian, pembaruan waktu menunggu, master poli/praktisi/jadwal dan helper aksi/izin lama.
- Seluruh modal/panel klinis dipanggil secara imperative melalui ekspor native Batch sebelumnya. Ikon/tombol pasien memakai mask PNG, event tooltip dan DOM langsung.
- TSX halaman dihapus; tidak menjalankan pengujian atau validasi. Tahap berikutnya finalisasi penyajian source ESM dan penghapusan dependensi/config TS/React/Vite; hasil konversi belum diperiksa.

## Batch 70 — Penyelesaian transformasi source presentasi
- Hambatan konversi mekanis ditemukan: emitter sebelumnya membaca JSX sebagai TypeScript biasa. Mode parsing JSX diperbaiki pada skrip transformasi sekali pakai, lalu source presentasi terdampak dikonversi ulang dari Git; modul DOM manual dipertahankan.
- State lokal presentasi akun diturunkan menjadi variabel/event dan paint DOM khusus setiap fungsi, tanpa hook/runtime React. Langkah registrasi dan pemeriksaan utama memakai emitter JSX yang sama setelah koreksi.
- Ini pekerjaan konversi source, bukan pemeriksaan hasil. Tidak menjalankan pengujian, build atau validasi. Finalisasi penyajian/dependensi dilanjutkan; hasil keseluruhan belum diperiksa.


## Batch 71 — Penyajian ESM dan pembersihan dependensi
- API menyajikan seluruh `/src`, CSS, aset publik, shared ESM dan Zod langsung; fallback HTML internal memakai `apps/web/index.html`. Middleware/server Vite dan ketergantungan ke `web/dist` dilepas.
- Script `start` menjalankan source API dan engine WhatsApp tanpa build; `dev` menjalankan Node watch untuk backend dan frontend dimuat langsung oleh browser. Import CSS bundler dipindahkan ke link stylesheet HTML.
- Dependensi langsung TypeScript/types, React/React DOM, Vite/plugin React dihapus; tsconfig, deklarasi CSS dan konfigurasi Vite dihapus. ESLint memakai konfigurasi JavaScript; lockfile diperbarui dengan lifecycle scripts dinonaktifkan.
- Tidak menjalankan test, build, pemeriksaan sintaks/import/export, browser, final regression atau validasi teknis apa pun.

### Checkpoint akhir tahap konversi
- Seluruh source TSX yang tersisa pada awal sesi telah dikonversi/dihapus. Frontend memakai DOM/ESM, state lokal, event browser dan lifecycle eksplisit; tidak ada adaptor React yang dipertahankan.
- Tahap konversi dan perubahan penyajian/dependensi selesai ditulis. Kebenaran sintaks, hubungan impor/ekspor, lifecycle editor kompleks dan kesetaraan perilaku **belum diperiksa** sesuai instruksi pengguna; jangan menganggap aplikasi telah terbukti dapat dijalankan.
- Cara menjalankan yang ditetapkan: `npm start` atau `npm run dev`, memakai `.env` dan database pengembangan yang sudah ada. URL mengikuti `BASE_URL`/`PORT` di konfigurasi lingkungan; frontend dilayani oleh API pada origin yang sama.
- Langkah selanjutnya hanya setelah instruksi pengguna terpisah: pemeriksaan dan perbaikan hasil konversi. Jangan mengulang migrasi Batch 1–71 atau menjalankan pemeriksaan otomatis tanpa instruksi tersebut.


## Perbaikan terarah — 404 modul browser
- Pengguna melaporkan kegagalan dynamic import app-internal dan kotak-centang. Permintaan HEAD ke kedua URL publik saat diagnosis mengembalikan 200 JavaScript, dengan cache empat jam melalui Cloudflare; sumber 404 sebelumnya belum dipastikan.
- Penyajian `/src` dan `/modul` memakai no-store untuk browser/CDN. Modul yang tidak ada mengembalikan 404 teks langsung, tidak jatuh ke fallback HTML aplikasi.
- Hanya diagnosis HTTP terarah berdasarkan laporan pengguna; tidak menjalankan test/build/browser/final regression. Perubahan header perlu proses API terbaru dan cache lama perlu dibersihkan.

## Diagnosis lanjutan — kegagalan impor internal/kotak centang
- Penelusuran HTTP statis dari app-internal pada origin demo menjangkau 78 modul relatif, tanpa respons non-200. Ini tidak membuktikan sintaks/eksekusi benar dan belum mereproduksi request 404 milik pengguna.
- Source kotak-centang berisi keluaran transformasi rusak; diganti implementasi DOM langsung dengan properti/event checkbox, label dan keterangan. Tidak melakukan regression/build/browser.
- Jika 404 berulang, perlu URL lengkap request gagal dari Network untuk membedakan path salah dengan resource yang sekarang 200. Kesimpulan sebelumnya bahwa cache merupakan penyebab belum terbukti.


## Perbaikan URL modul yang dilaporkan 404
- URL lengkap susunan.js/kotak-centang.js saat diagnosis mengembalikan 200 JavaScript, no-store, Cloudflare BYPASS. Kegagalan pada sesi browser pengguna belum dapat direproduksi.
- Import map HTML kini memberi query versi baru untuk app-internal, susunan dan kotak-centang agar browser meminta resource melalui URL baru dan tidak memakai entri kegagalan URL lama. Tidak mengubah path filesystem/modul.
- Perbaikan terbatas pada pemuatan tiga modul yang dilaporkan; tidak menjalankan build/test/regression.


## Perbaikan terarah — SyntaxError ikon.js
- Source ikon pesan memuat fragmen transformasi rusak setelah peta bentuk; diganti SVG DOM langsung dengan path, atribut dan style asli. Ikon Instagram yang terkait memiliki kerusakan sejenis dan diganti SVG DOM langsung juga.
- Bentuk/ukuran/warna ikon dipertahankan. Tidak menjalankan build/test/regression atau pemeriksaan menyeluruh.


## Perbaikan lanjutan — URL ikon SVG
- Source ikon pada URL publik sekarang berisi DOM SVG yang diperbaiki; baris 15 bukan token > seperti laporan sesi browser.
- Kedua modul dipindahkan menjadi ikon-svg-native.js, rujukan source diperbarui dan import map mengarahkan nama ikon.js lama ke URL baru. Tidak membuat salinan/backup; tidak menjalankan regression atau build.

## Perbaikan terarah — SyntaxError susunan.js
- Modul susunan memuat literal/fragmen source yang rusak akibat transformasi. Seluruh ekspor (Kolom, Sebaris, Kisi, Daftar, Baris, PasanganRingkasan, DaftarRingkasan, Tumbuh) diganti implementasi DOM langsung berdasarkan source asli di Git.
- Token tata letak, garis/jarak, atribut/event/ref dan Node anak dipertahankan. Tidak menjalankan build/test/regression atau validasi menyeluruh.


## Perbaikan terarah — SyntaxError daftar-pasien.js
- Fragmen transformasi rusak pada pembentukan tombol dan tampilan daftar diganti DOM langsung. Routing modal/API/helper aksi lama tetap dipakai; toolbar, tabel, menu, paginasi dan tab memakai komponen native yang sudah tersedia.
- Impor presentasi lama yang tidak diperlukan dilepas. Tidak menjalankan build/test/regression atau validasi menyeluruh.

## Perbaikan terarah — SyntaxError edit-pasien.js
- Fragmen transformasi rusak pada footer/form diganti implementasi DOM langsung. Empat tab, izin baca/ubah, wali baru/lama, wilayah, penjamin, navigasi galat skema/API, deteksi perubahan dan lifecycle dipertahankan.
- Impor Isian/presentasi JSX lama dilepas. Tidak menjalankan build/test/regression atau pemeriksaan menyeluruh.
