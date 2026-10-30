CREATE TABLE `narasi_klinis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `bagian` ENUM('assessment', 'plan', 'implementasi', 'evaluasi') NOT NULL,
    `isi` TEXT NULL,
    `versi` INTEGER NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `narasi_klinis_kunjungan_id_bagian_versi_key` (`kunjungan_id`, `bagian`, `versi`),
    INDEX `narasi_klinis_fasyankes_id_kunjungan_id_idx` (`fasyankes_id`, `kunjungan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `narasi_klinis` ADD CONSTRAINT `narasi_klinis_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
