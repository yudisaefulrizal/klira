CREATE TABLE `event_panggilan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `poli_id` INTEGER NOT NULL,
    `poli_nama` VARCHAR(200) NOT NULL,
    `kode` VARCHAR(32) NOT NULL,
    `tanggal` DATE NOT NULL,
    `waktu_panggil` DATETIME(3) NOT NULL,
    INDEX `event_panggilan_fasyankes_id_tanggal_id_idx`(`fasyankes_id`, `tanggal`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `event_panggilan` ADD CONSTRAINT `event_panggilan_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
