-- AlterTable
ALTER TABLE `kunjungan` ADD COLUMN `diarsipkan_pada` DATETIME(3) NULL,
    ADD COLUMN `retensi_sampai` DATE NULL;

-- CreateTable
CREATE TABLE `permintaan_perbaikan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `bagian` VARCHAR(30) NOT NULL,
    `isi_baru` JSON NOT NULL,
    `alasan` VARCHAR(500) NOT NULL,
    `pemohon_id` INTEGER NOT NULL,
    `status` ENUM('diajukan', 'disetujui', 'ditolak') NOT NULL DEFAULT 'diajukan',
    `penyetuju_id` INTEGER NULL,
    `catatan_keputusan` VARCHAR(500) NULL,
    `waktu_keputusan` DATETIME(3) NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `permintaan_perbaikan_fasyankes_id_status_idx`(`fasyankes_id`, `status`),
    INDEX `permintaan_perbaikan_kunjungan_id_idx`(`kunjungan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengkodean` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `isi` JSON NOT NULL,
    `pengode_id` INTEGER NOT NULL,
    `diperbarui_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `pengkodean_kunjungan_id_key`(`kunjungan_id`),
    INDEX `pengkodean_fasyankes_id_idx`(`fasyankes_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

