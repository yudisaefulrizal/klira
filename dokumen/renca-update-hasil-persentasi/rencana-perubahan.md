# Rencana perubahan hasil presentasi 10 November 2026

Sumber: catatan [10-nov-2026.txt](10-nov-2026.txt) dan diskusi lanjutan dengan pemilik klinik. Aplikasi belum produksi, jadi kolom dan alur lama boleh diubah atau dihapus langsung tanpa migrasi data (migrasi Prisma baru tetap dibuat). Dokumen ini mengalahkan rancangan-aplikasi.md bila bertentangan; bagian rancangan dan panduan yang terdampak ikut diperbarui.

Urutan pengerjaan: P1 → P4 → P2 → P5 → P3 → P6 → P7 → P8.

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

## Rekam medis mengikuti formulir klinik (P6–P8)

Sumber: permintaan klien setelah presentasi agar isian rekam medis rawat jalan mengikuti formulir yang sudah dipakai klinik ([Rekam Medis-yang-berjalan.pdf](Rekam%20Medis-yang-berjalan.pdf)). Mockup layar dan cetak: https://claude.ai/artifact/FBTdU4TxSbN9pcSJdXepUv. Kelompok langkah SOAPIE (rencana-soapie.md) **tetap**; isian baru dimasukkan ke kelompok yang sesuai.

Aturan umum **default keadaan baik**: setiap isian pemeriksaan yang punya keadaan normal sudah terisi teks keadaan baik yang cocok dengan variabelnya ("tidak ada", "tidak anemis", "vesikuler", "hangat", "normal", ...), sehingga tenaga kesehatan hanya mengubah yang tidak normal. Teks default disimpan sebagai konstanta di `packages/shared` (satu sumber untuk form, uji, dan data demo). Default hanya mengisi form yang belum pernah disimpan (tidak ada versi tersimpan dan tidak ada draf); isi tersimpan dan draf tidak ditimpa. Isian yang nilainya berbeda dari default ditandai (latar kuning, `status.kuning`) dan dihitung ("n isian diubah"); setiap kelompok punya tombol **Semua normal** (mengembalikan kelompok itu ke default) dan ada tombol **Kembalikan semua ke normal**. Isian boleh dikosongkan (tersimpan null).

## P6. Skrining keperawatan

Perawat (mode `skrining` di modal pemeriksaan klinis) mengisi bagian baru **keperawatan** selain tanda vital. Langkah skrining menjadi: Keperawatan (tanda vital + isian keperawatan dalam satu langkah, dua bagian tersimpan) → Ringkasan skrining.

Data:
- `BAGIAN_KLINIS` mendapat `keperawatan`. Model Prisma baru `Keperawatan` berversi seperti `Anamnesis` (fasyankes_id, kunjungan_id, versi, dibuat_oleh, dibuat_pada, `@@unique([kunjungan_id, versi])`), disahkan lewat mekanisme pengesahan yang sama (hash, versi, alasan perbaikan).
- Isi (`keperawatanIsi`, semua teks opsional kecuali disebut):
  - `kajian_keperawatan` (maks 1000, default "keadaan umum baik")
  - `telah_diobati` (maks 1000, default "tidak ada")
  - `alergi` (maks 500, default "tidak ada")
  - `obat_dikonsumsi` (maks 1000, default "tidak ada")
  - `diagnosa_keperawatan` (maks 500), `rencana_asuhan` (maks 1000): tanpa default
  - Skrining nyeri: `nyeri_jenis` enum `tidak | akut | kronis` (default `tidak`); bila `tidak`, isian nyeri lain disembunyikan dan disimpan null. `nyeri_skala` 0–10 (wajib bila jenis bukan `tidak`), `nyeri_lokasi`, `nyeri_durasi`, `nyeri_frekuensi`, `nyeri_hilang_bila` (teks maks 200).
  - Risiko jatuh (Get Up and Go): `jatuh_tidak_seimbang` dan `jatuh_menopang` boolean (default false). Hasil dihitung, tidak disimpan: tidak ada "ya" = Tidak berisiko, satu = Risiko rendah, dua = Risiko tinggi.
  - Skrining gizi (MST sederhana seperti formulir): `gizi_bb_turun` dan `gizi_asupan_kurang` boolean (default false). Hasil dihitung: tidak ada "ya" = Tidak berisiko malnutrisi, ada "ya" = Berisiko malnutrisi.
  - `skrining_visual` enum `hijau | kuning | merah`, opsional (arti warna dikonfirmasi klinik; label saja).
- Jenis kunjungan (baru/lama dari ada tidaknya kunjungan sebelumnya) dan jenis rawat ditampilkan baca saja, tidak disimpan.
- **Alergi pindah** dari anamnesis ke keperawatan: kolom `alergi` dihapus dari `Anamnesis` (migrasi), skema, form S, salin, templat, demo. Konteks klinis (`alergi` di kepala pasien) membaca alergi keperawatan terbaru pasien; nilai yang sama dengan default "tidak ada" (abaikan huruf besar/kecil dan spasi) dianggap tidak ada alergi.
- Dokter melihat ringkasan keperawatan dan tanda vital (baca saja) di atas langkah S, dan boleh mengubah bagian keperawatan bila punya izin klinis (perubahan lewat jalur pengesahan yang sama).

## P7. Isian dokter mengikuti formulir

**S — Subjective (anamnesis)**: urutan dan label mengikuti formulir.
- `keluhan_utama` (wajib, label "Alasan kedatangan / keluhan utama").
- `penyerta` berlabel "Keluhan tambahan".
- `riwayat_sekarang` baru (maks 1000, label "Riwayat perjalanan penyakit sekarang").
- `riwayat_pribadi` berlabel "Riwayat penyakit dahulu" (default "tidak ada").
- `riwayat_keluarga` (default "tidak ada").
- `kajian_sosial` baru (maks 1000).
- Kolom baru ikut Prisma + migrasi, skema, salin dari kunjungan sebelumnya, templat anamnesis.

**O — Objective (pemeriksaan fisik terstruktur)**: `PEMERIKSAAN_BIDANG` lama (`keadaan_umum, kepala_leher, thorax, abdomen, ekstremitas, catatan`) diganti daftar bidang di bawah, tetap disimpan per baris di `Observasi` (kelompok `pemeriksaan`, `bidang` = kunci). Definisi di shared berisi kunci, label, kelompok, dan default. Semua bidang teks opsional maks 300.

| Kelompok | Bidang (kunci: default) |
|---|---|
| Rambut | `rambut_warna`: hitam · `rambut_bentuk`: normal, tidak mudah rontok · `rambut_lain`: tidak ada |
| Mata | `mata_konjungtiva`: tidak anemis · `mata_sklera`: tidak ikterik · `mata_lain`: tidak ada |
| THT | `tht_gendang_telinga`: intak · `tht_serumen`: tidak ada · `tht_tonsil_kanan`: T1 · `tht_tonsil_kiri`: T1 · `tht_warna_tonsil`: tidak hiperemis · `tht_faring`: tidak hiperemis · `tht_lain`: tidak ada |
| Jantung | `jantung_bj1`: reguler · `jantung_bj2`: reguler · `jantung_murmur`: tidak ada · `jantung_gallop`: tidak ada · `jantung_lain`: tidak ada |
| Paru-paru | `paru_bunyi`: vesikuler · `paru_wheezing`: tidak ada · `paru_rhonki`: tidak ada · `paru_lain`: tidak ada |
| Abdomen | `abdomen_massa`: tidak ada · `abdomen_bising_usus`: normal · `abdomen_lain`: tidak ada |
| Ekstremitas | `ekstremitas_akral`: hangat · `ekstremitas_pitting_edema`: tidak ada · `ekstremitas_lain`: tidak ada |
| Status lokalis | `lokalis_bentuk`, `lokalis_letak`, `lokalis_jumlah`, `lokalis_warna`, `lokalis_ukuran`, `lokalis_lain`: semua tidak ada |
| Odontogram | `odontogram_tanggal`: tanggal (YYYY-MM-DD), tanpa default. Form menampilkan centang "Sudah dibuat"; tanggal wajib bila dicentang, null bila tidak. |

- Aturan "minimal satu bidang terisi" tetap.
- Templat pemeriksaan mengikuti kunci baru (templat lama dengan kunci lama diabaikan saat dipakai).
- Data demo diperbarui.
- Ringkasan, detail SOAPIE, dan riwayat menampilkan per kelompok; bidang yang sama dengan default boleh diringkas menjadi satu kalimat per kelompok.

**A — Assessment**:
- Diagnosis ICD-10 tetap: utama = "Diagnosa medis", penyerta = "Diagnosa tambahan".
- Tambah narasi baru **Diagnosa banding** (`diagnosis_banding`, teks bebas maks 1000, boleh berisi kode). Ia tidak ikut pengkodean, klaim, statistik, maupun diagnosis aktif.

**P — Plan**: tambah narasi baru **Komunikasi, informasi, dan edukasi** (`kie`, maks 2000).

**I — Implementation**: tambah narasi baru **Obat yang diberikan di poli** (`obat_poli`, maks 1000). Isian ini teks catatan saja, tidak mengurangi stok dan tidak membuat tagihan.

Narasi baru (`diagnosis_banding`, `kie`, `obat_poli`):
- Memakai `NarasiKlinis`: enum `BagianNarasi` dan `BAGIAN_NARASI`/`LABEL_NARASI` bertambah, migrasi enum.
- Masuk `BAGIAN_KLINIS` dan `SKEMA_BAGIAN`, ikut pengesahan.
- Tidak menjadi syarat penyelesaian pemeriksaan.

"Obat yang dibawa pulang" adalah teks resep dokter (P3), dan "Tindakan" adalah bagian tindakan; keduanya tidak berubah.

## P8. Cetak rekam medis rawat jalan

- Tombol **Cetak rekam medis** di detail kunjungan rawat jalan (detail SOAPIE / riwayat) bagi pemilik izin lihat rekam medis atau klinis. Pembukaan tercatat di audit (`lihat`/`cetak`) seperti pembukaan rekam medis lain.
- Satu endpoint baca `GET /kunjungan/:id/rekam-medis-cetak` mengembalikan seluruh data satu kunjungan (identitas, pendaftaran, keperawatan, tanda vital, anamnesis, pemeriksaan, hasil penunjang, diagnosis, narasi, tindakan, resep beserta item farmasi, tindak lanjut, surat rujukan bila ada, pengesahan per bagian) dalam satu DTO. Isolasi fasyankes berlaku.
- Halaman cetak A4 (komponen React + `@media print`, `window.print()`), tata letak dan urutan blok mengikuti formulir:
  - Kepala: tanggal/nomor pendaftaran, tanggal/nomor pelayanan, poli, dokter.
  - Data administratif: No. RM, nama, kepala keluarga/folder, NIK disamarkan, tanggal lahir, jenis kelamin, agama, status nikah, hubungan, cara bayar, No. BPJS disamarkan.
  - Keperawatan beserta skrining.
  - Anamnesa.
  - Pemeriksaan fisik (bidang tidak sama dengan default dicetak tebal).
  - Pemeriksaan penunjang: laboratorium dan rontgen dari hasil penunjang.
  - Kesimpulan: diagnosa medis/tambahan/banding, KIE.
  - Terapi: tindakan, obat di poli, obat dibawa pulang (teks resep dan item farmasi).
  - Data rujukan: nomor/tanggal surat rujukan, tujuan, alasan dari catatan tindak lanjut.
- Kolom kanan tiap blok menggantikan kotak tanda tangan dengan nama pengesah, waktu, dan keterangan "disahkan elektronik" dari pengesahan bagian terkait (Pasien = persetujuan umum bila ada). Bagian kosong dicetak "-".
- Kaki halaman: dicetak oleh, waktu cetak, nomor halaman.

## Di luar cakupan

- Klaim ke asuransi swasta oleh klinik.
- Jasa medis dan jasa sarana, rekap honor.
- Jasa racik.
