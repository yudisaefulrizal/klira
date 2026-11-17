-- Jadwal praktik tidak lagi punya status aktif: ada berarti berlaku. Jadwal yang sebelumnya dinonaktifkan dihapus.
DELETE FROM `jadwal_praktik` WHERE `aktif` = 0;

ALTER TABLE `jadwal_praktik` DROP COLUMN `aktif`;
