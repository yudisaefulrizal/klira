# Referensi wilayah

Sumber: https://github.com/cahyadsn/wilayah/blob/b2af89991152c2d18251c922362869c117b90a7f/db/wilayah.sql
Commit: `b2af89991152c2d18251c922362869c117b90a7f`. Diambil 29 Oktober 2026.
Header sumber menyebut Kepmendagri No. 300.2.2-2138 Tahun 2025, terakhir diedit 13 Februari 2026.
Lisensi MIT: lihat WILAYAH-LICENSE. Data pihak ketiga ini bukan layanan resmi Kemendagri.

wilayah.json memetakan kode Kemendagri bertitik ke nama, mencakup seluruh tingkat.
Jumlah: 91599 wilayah, 83762 desa/kelurahan.
Nama dan kode disimpan sebagai referensi aplikasi, bukan tabel database.
Server memuatnya sekali; browser hanya menerima hasil pencarian terbatas.
Sertakan direktori apps/api/data saat mengemas aplikasi (berada di luar dist).

Pembaruan: ambil snapshot berlisensi dari sumber, konversi pasangan SQL kode/nama
menjadi objek JSON, catat commit/tanggal, dan jalankan tes wilayah. Jangan menghasilkan
kode dari nama atau nomor urut CSV lama. Perubahan kode pasien lama tidak dimigrasikan otomatis.
