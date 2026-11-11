-- Resep teks bebas oleh dokter, item stok oleh farmasi (P3): dokter menulis teks resep; item resep dan item tagihan obat
-- dibuat apoteker saat telaah. Resep lama tidak dipertahankan isinya (kolom teks terisi kosong).
ALTER TABLE `resep` ADD COLUMN `teks` TEXT NOT NULL;
