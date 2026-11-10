-- Kode LOINC kini dipilih dari katalog statis apps/api/data/loinc.json; penanda kode contoh tidak diperlukan lagi.
ALTER TABLE `master_pemeriksaan` DROP COLUMN `loinc_contoh`;
