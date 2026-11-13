-- Jenis poli: beberapa poli bisa sejenis (mis. Poli Umum 1 dan 2) dan berbagi satu antrean per jenis dengan awalan nomor sendiri.
-- Poli yang sudah ada menjadi jenis sendiri (awalan huruf menurut id) sampai jenisnya diubah di Master data.
ALTER TABLE `lokasi` ADD COLUMN `jenis_poli` VARCHAR(60) NULL, ADD COLUMN `awalan_antrean` VARCHAR(3) NULL;

UPDATE `lokasi` SET `jenis_poli` = TRIM(REPLACE(`nama`, 'Poli ', '')), `awalan_antrean` = CHAR(64 + LEAST(`id`, 26)) WHERE `jenis` = 'poli';

ALTER TABLE `antrean` MODIFY `lokasi_id` INTEGER NULL, ADD COLUMN `jenis_poli` VARCHAR(60) NOT NULL DEFAULT '', ADD COLUMN `awalan` VARCHAR(3) NOT NULL DEFAULT 'A';

UPDATE `antrean` a JOIN `lokasi` l ON l.`id` = a.`lokasi_id` SET a.`jenis_poli` = l.`jenis_poli`, a.`awalan` = l.`awalan_antrean`;

ALTER TABLE `antrean` DROP INDEX `antrean_fasyankes_id_lokasi_id_tanggal_nomor_key`, ADD UNIQUE INDEX `antrean_fasyankes_id_awalan_tanggal_nomor_key`(`fasyankes_id`, `awalan`, `tanggal`, `nomor`), ADD INDEX `antrean_lokasi_id_tanggal_status_idx`(`lokasi_id`, `tanggal`, `status`);
