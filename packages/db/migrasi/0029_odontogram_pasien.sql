-- Menyimpan status odontogram kumulatif per pasien (standar FDI & pemeriksaan intraoral Kemenkes).
CREATE TABLE `odontogram_pasien` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pasien_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NULL,
    `gigi` JSON NOT NULL,
    `intraoral` JSON NOT NULL,
    `diperbarui_oleh` INTEGER NULL,
    `diperbarui_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `odontogram_pasien_fasyankes_pasien_key`(`fasyankes_id`, `pasien_id`),
    INDEX `odontogram_pasien_kunjungan_idx`(`kunjungan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
