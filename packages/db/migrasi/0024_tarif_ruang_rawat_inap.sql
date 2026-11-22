ALTER TABLE `lokasi`
    ADD COLUMN `tarif_id` INTEGER NULL AFTER `induk_id`,
    ADD INDEX `lokasi_tarif_id_idx`(`tarif_id`);
