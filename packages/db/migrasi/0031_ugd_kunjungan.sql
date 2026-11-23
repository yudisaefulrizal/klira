-- Menyimpan data triase dan survei primer UGD per kunjungan (standar PMK 47/2018 & kesiapan SATUSEHAT).
CREATE TABLE `ugd_kunjungan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pasien_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `triase` ENUM('merah', 'kuning', 'hijau', 'hitam') NOT NULL DEFAULT 'hijau',
    `waktu_triase` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data` JSON NOT NULL,
    `diperbarui_oleh` INTEGER NULL,
    `diperbarui_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ugd_kunjungan_fasyankes_kunjungan_key`(`fasyankes_id`, `kunjungan_id`),
    INDEX `ugd_kunjungan_pasien_idx`(`fasyankes_id`, `pasien_id`, `diperbarui_pada`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
