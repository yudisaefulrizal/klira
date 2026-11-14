-- Kunjungan "Penunjang saja" (hanya tes lab, tanpa dokter dan poli): jenis LAB, perujuk opsional, panggilan tanpa poli, dan penyerahan hasil di kasir.
ALTER TABLE `kunjungan` MODIFY `jenis` ENUM('AMB', 'IMP', 'LAB') NOT NULL, ADD COLUMN `perujuk` VARCHAR(200) NULL;

ALTER TABLE `event_panggilan` MODIFY `poli_id` INTEGER NULL;

CREATE TABLE `penyerahan_hasil` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `penerima_nama` VARCHAR(200) NOT NULL,
    `hubungan` VARCHAR(100) NULL,
    `petugas_id` INTEGER NOT NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `penyerahan_hasil_kunjungan_id_key`(`kunjungan_id`),
    INDEX `penyerahan_hasil_fasyankes_id_waktu_idx`(`fasyankes_id`, `waktu`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `penyerahan_hasil` ADD CONSTRAINT `penyerahan_hasil_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `penyerahan_hasil` ADD CONSTRAINT `penyerahan_hasil_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
