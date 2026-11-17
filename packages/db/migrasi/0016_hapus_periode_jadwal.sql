-- Periode berlaku jadwal praktik dihapus: jadwal berlaku selama aktif; waktu pembuatan dan perubahan tercatat di log audit.
ALTER TABLE `jadwal_praktik` DROP COLUMN `berlaku_dari`, DROP COLUMN `berlaku_sampai`;
