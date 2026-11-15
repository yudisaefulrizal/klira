-- Lampiran berkas (PDF, PNG, JPEG) pada catatan kunjungan, disimpan di basis data bersama catatan klinis lainnya.
CREATE TABLE `lampiran_kunjungan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `nama` VARCHAR(255) NOT NULL,
    `tipe` VARCHAR(50) NOT NULL,
    `ukuran` INTEGER NOT NULL,
    `isi` LONGBLOB NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lampiran_kunjungan_fasyankes_id_kunjungan_id_idx`(`fasyankes_id`, `kunjungan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `lampiran_kunjungan` ADD CONSTRAINT `lampiran_kunjungan_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
