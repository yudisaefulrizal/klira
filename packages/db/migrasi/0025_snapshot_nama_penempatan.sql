ALTER TABLE `penempatan`
    ADD COLUMN `ruang_nama` VARCHAR(200) NULL AFTER `lokasi_id`,
    ADD COLUMN `bed_nama` VARCHAR(200) NULL AFTER `ruang_nama`;

UPDATE `penempatan` p
LEFT JOIN `lokasi` b ON b.`id` = p.`lokasi_id`
LEFT JOIN `lokasi` r ON r.`id` = b.`induk_id`
SET p.`bed_nama` = b.`nama`,
    p.`ruang_nama` = r.`nama`
WHERE p.`bed_nama` IS NULL;
