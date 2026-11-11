# Rencana perubahan hasil presentasi 10 November 2026

Sumber: catatan [10-nov-2026.txt](10-nov-2026.txt) dan diskusi lanjutan dengan pemilik klinik. Aplikasi belum produksi, jadi kolom dan alur lama boleh diubah atau dihapus langsung tanpa migrasi data (migrasi Prisma baru tetap dibuat). Dokumen ini mengalahkan rancangan-aplikasi.md bila bertentangan; bagian rancangan dan panduan yang terdampak ikut diperbarui.

Urutan pengerjaan: P1 → P4 → P2 → P5 → P3.

## P1. Pilih dokter saat pendaftaran kunjungan

- Modal Pendaftaran kunjungan (rawat jalan, `pendaftaran-kunjungan.tsx`) mendapat isian **Dokter** di samping Poli.
- Opsi: `opsi.dpjp` yang `poli_ids`-nya memuat poli terpilih. Saat poli berganti dan dokter terpilih bukan dokter poli itu, pilihan dokter dikosongkan. Bila poli hanya punya satu dokter, terpilih otomatis.
- Opsional (boleh kosong) seperti sekarang di API; `dpjp_id` dikirim ke API yang sudah menerimanya (`kunjunganMasukan`, `dpjpSah`). API menolak dokter yang tidak bertugas di poli terpilih (validasi poli_ids di server).
- Kolom dokter di daftar pasien sudah memakai `dpjp_nama`; tidak perlu perubahan lain.

## P4. Satu tagihan dibayar beberapa metode

- `bayarMasukan` menjadi `{ pembayaran: [{ metode, jumlah }] }`, 1 sampai 3 baris, metode tidak boleh ganda.
- Aturan: jumlah non-tunai (transfer, QRIS) total tidak boleh melebihi sisa tagihan. Tunai boleh melebihi sisa setelah dikurangi non-tunai; kelebihannya adalah kembalian (tidak dicatat sebagai pembayaran). Setiap baris dicatat sebagai satu baris `Pembayaran` dalam **satu transaksi** (gagal satu, gagal semua) dengan satu entri audit.
- Pembayaran sebagian tetap boleh (total diterapkan < sisa).
- Modal Pembayaran: baris metode + jumlah; tombol **+ Metode lain** menambah baris (maks 3), tiap baris tambahan bisa dihapus. Baris pertama terisi sisa tagihan; saat baris kedua ditambah, jumlahnya terisi sisa yang belum tertutup. Ringkasan: total diterima, diterapkan, kembalian (hanya dari tunai). Enter tetap mengirim.
- Rekap harian per metode dan shift kasir (selisih tunai) tetap benar karena tiap metode tetap baris tersendiri.

## P2. Cara bayar Umum / JKN / Asuransi lain, data penjamin pasien

- Enum `CaraPembayaran` menjadi `umum | jkn | asuransi` (label tampilan: Umum, JKN, Asuransi lain). Berlaku di kunjungan, resep (`jenis_pembiayaan`), admisi rawat inap, filter dan label di mana pun.
- **Hapus dari seluruh sistem**: `jkn_kelas_hak` dan `jkn_fktp_terdaftar` (skema Prisma + migrasi, Zod, DTO, layanan/repositori pasien, form registrasi, edit pasien, detail pasien, ringkasan, teks, data demo, uji, panduan). **Kelas rawat inap (kelas kamar/bed, naik/turun kelas) TIDAK dihapus.**
- Pasien mendapat `asuransi_nama` (teks, maks 100) dan `asuransi_nomor_polis` (teks, maks 50), keduanya opsional. Nomor polis diperlakukan sama seperti nomor kartu JKN (bila nomor kartu dienkripsi/disamarkan, nomor polis juga).
- Langkah registrasi "JKN" diganti nama **Penjamin**: nomor kartu JKN, nama asuransi, nomor polis. Sama di Edit pasien dan Detail pasien.
- Pendaftaran kunjungan dan admisi: cara bayar **Asuransi lain** menampilkan nama asuransi dan nomor polis pasien sebagai keterangan (baca saja); bila pasien belum punya data asuransi, tampil peringatan lunak agar dilengkapi di data pasien (tidak memblokir). Nomor SEP tetap hanya untuk JKN.
- Tarif dan kasir: pasien asuransi lain diperlakukan seperti umum (harga umum, wajib bayar, tidak ada klaim ke asuransi dari klinik, tidak masuk penyiapan klaim JKN). Semua logika `=== 'jkn'` tetap; periksa logika `=== 'umum'` / `!== 'jkn'` agar asuransi mengikuti jalur umum.

## P5. Daftar tindakan klinik dan tagihan tindakan otomatis

Data:
- `TarifLayanan` mendapat `kode_icd9cm String? @db.VarChar(20)` (tidak unik). Untuk jenis `tindakan`, kode ICD-9-CM wajib dan harus ada di kamus ICD-9-CM (validasi server pakai terminologi yang sudah ada). `harga_umum` menjadi **opsional** (`Int?`) untuk jenis tindakan: tindakan tanpa harga acuan boleh. Jenis lain tetap wajib harga umum.
- Kode tarif tindakan dibuat otomatis bila kosong (`TND-001`, `TND-002`, ... per fasyankes).
- Satu kode ICD-9-CM boleh dipakai beberapa tarif tindakan (mis. Jahit luka ≤ 5 cm dan > 5 cm sama-sama 86.59).
- Tab Tarif (Kasir dan klaim) tetap tempat mengelola; form tarif jenis tindakan memuat pencarian ICD-9-CM dari kamus. Tabel menampilkan kolom kode ICD-9-CM.

Pencatatan dokter:
- Item tindakan (`tindakanItem`, model `Tindakan`) mendapat `tarif_layanan_id Int?` dan `jumlah Int @default(1)` (1–100).
- Pencarian tindakan di pemeriksaan klinis menampilkan **dua sumber**: daftar tindakan klinik (nama klinik, kode, harga) di atas, lalu kamus ICD-9-CM. Memilih dari daftar klinik mengisi kode, nama (nama tindakan klinik) dan `tarif_layanan_id`; memilih dari kamus mengisi kode dan nama kamus tanpa tarif.
- Aturan kode ganda diganti: yang tidak boleh ganda adalah pasangan (kode, tarif_layanan_id) — dua tarif berbeda dengan kode sama boleh.

Tagihan:
- Setiap simpan bagian tindakan menyinkronkan item tagihan berjenis tindakan yang berasal dari pencatatan (`ItemTagihan.tindakan_sumber = true`, item `manual` tidak tersentuh): item lama dari sumber ini diganti sesuai daftar tindakan versi terbaru, harga = harga tarif sesuai cara bayar (`harga_jkn` untuk JKN bila ada, selain itu `harga_umum`), atau `null` bila tanpa tarif/tanpa harga. Sinkronisasi ditolak bila tagihan sudah ada pembayaran atau kunjungan ditutup — tindakan tetap tersimpan tapi tagihan tidak berubah dan pengguna diberi pesan agar kasir menyesuaikan manual.
- Item tanpa harga membuat tagihan belum lengkap; kasir mengisi lewat **Lengkapi harga** (sudah ada).
- **Ubah harga per kunjungan**: kasir (izin kasir.input) bisa mengubah harga item yang sudah berharga (semua jenis kecuali obat) sebelum ada pembayaran, dengan **alasan wajib**. `ItemTagihan` mendapat `harga_acuan Int?` (harga awal saat item dibuat) dan `alasan_ubah_harga String? @db.VarChar(300)`. Audit mencatat harga lama, baru, dan alasan. Rincian tagihan menandai item yang harganya diubah (harga acuan dicoret).
- Tambah item manual kasir dari tarif tetap ada.
- Tidak ada pemecahan jasa medis/jasa sarana (satu harga per tindakan).

## P3. Resep teks bebas oleh dokter, item stok oleh farmasi

- Langkah Resep di pemeriksaan klinis menjadi satu **AreaTeks** "Resep" (maks 2000 karakter). Dokter menulis bebas termasuk merek dan racikan (puyer). Tidak ada lagi pemilihan obat dari master oleh dokter.
- `resepMasukan` menjadi `{ teks }` (wajib, trim, tidak kosong). Model `Resep` mendapat `teks String @db.Text`. Membuat resep **tidak** membuat item resep maupun item tagihan.
- Telaah resep (modal Telaah dan siapkan resep): apoteker membaca teks resep dokter, lalu mengisi **item** dari master obat klinik: obat (pencarian master obat, komponen `pencarian-obat-resep` dipakai ulang), jumlah (bilangan bulat ≥ 1, unit yang terpakai dari stok; racikan dicatat total unit, dibulatkan ke atas), aturan pakai, bentuk/rute opsional. Item boleh ditambah, diubah, dihapus selama resep belum siap. Obat yang sama boleh muncul lebih dari sekali (mis. obat tunggal dan bahan racikan) — aturan obat ganda dihapus.
- Simpan telaah menyimpan item dan tiga centang telaah. Item tagihan obat dibuat/diganti saat item disimpan (harga dari master obat, jenis obat), terhubung `item_resep_id`; selama resep belum siap item tagihan obat resep itu disinkronkan ulang. Tidak ada item jasa racik.
- Tandai siap mensyaratkan minimal satu item dan ketiga telaah terpenuhi; pemeriksaan stok kurang seperti sekarang.
- Serah terima dan pengurangan stok (batch kedaluwarsa terdekat) tidak berubah.
- Tahap kunjungan: resep diajukan → tahap resep (farmasi) seperti sekarang; kasir menunggu resep siap agar tagihan obat lengkap.
- Tampilan resep (riwayat obat, rekam medis, resume, cetak) menampilkan teks resep dokter dan item yang disiapkan farmasi.
- Resep lama tidak perlu dipertahankan (data demo diperbarui).

## Di luar cakupan

- Klaim ke asuransi swasta oleh klinik.
- Jasa medis dan jasa sarana, rekap honor.
- Jasa racik.
