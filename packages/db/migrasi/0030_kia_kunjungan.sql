-- Menyimpan data terstruktur pemeriksaan KIA (ANC, KB, Anak/Imunisasi) per kunjungan untuk kesiapan regulasi & SATUSEHAT.
CREATE TABLE `kia_kunjungan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pasien_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `layanan` ENUM('anc', 'kb', 'anak') NOT NULL DEFAULT 'anc',
    `data` JSON NOT NULL,
    `diperbarui_oleh` INTEGER NULL,
    `diperbarui_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `kia_kunjungan_fasyankes_kunjungan_key`(`fasyankes_id`, `kunjungan_id`),
    INDEX `kia_kunjungan_pasien_idx`(`fasyankes_id`, `pasien_id`, `diperbarui_pada`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
