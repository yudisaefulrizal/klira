-- CreateTable
CREATE TABLE `draf` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pengguna_id` INTEGER NOT NULL,
    `alur` VARCHAR(50) NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `pasien_id` INTEGER NOT NULL,
    `langkah_terakhir` INTEGER NOT NULL DEFAULT 0,
    `isi` JSON NOT NULL,
    `diperbarui_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `draf_kunjungan_id_idx`(`kunjungan_id`),
    UNIQUE INDEX `draf_pengguna_id_alur_kunjungan_id_key`(`pengguna_id`, `alur`, `kunjungan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
