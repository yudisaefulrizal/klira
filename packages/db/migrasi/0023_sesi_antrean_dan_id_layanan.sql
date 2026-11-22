-- Sesi antrean (buka/tutup manual tanpa batas tanggal), antrean sementara Mobile JKN saat tutup, dan ID Layanan permanen pada kunjungan.

ALTER TABLE `kunjungan` ADD COLUMN `id_layanan` VARCHAR(30) NULL AFTER `fasyankes_id`;

UPDATE `kunjungan`
SET `id_layanan` = CONCAT('LY-', DATE_FORMAT(DATE_ADD(`mulai`, INTERVAL 7 HOUR), '%y%m%d'), '-', LPAD(`id`, 4, '0'))
WHERE `id_layanan` IS NULL;

ALTER TABLE `kunjungan`
    MODIFY `id_layanan` VARCHAR(30) NOT NULL,
    ADD UNIQUE INDEX `kunjungan_fasyankes_id_id_layanan_key`(`fasyankes_id`, `id_layanan`);

CREATE TABLE `sesi_antrean` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `status` ENUM('buka', 'tutup') NOT NULL DEFAULT 'buka',
    `dibuka_oleh` INTEGER NULL,
    `dibuka_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ditutup_oleh` INTEGER NULL,
    `ditutup_pada` DATETIME(3) NULL,

    INDEX `sesi_antrean_fasyankes_id_status_idx`(`fasyankes_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `sesi_antrean` ADD CONSTRAINT `sesi_antrean_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO `sesi_antrean` (`fasyankes_id`, `status`)
SELECT `id`, 'buka' FROM `fasyankes`;

ALTER TABLE `antrean`
    ADD COLUMN `sesi_id` INTEGER NULL AFTER `fasyankes_id`,
    ADD INDEX `antrean_sesi_id_status_idx`(`sesi_id`, `status`);

UPDATE `antrean` a
JOIN `sesi_antrean` s ON s.`fasyankes_id` = a.`fasyankes_id` AND s.`status` = 'buka'
SET a.`sesi_id` = s.`id`;

ALTER TABLE `antrean`
    DROP INDEX `antrean_fasyankes_id_awalan_tanggal_nomor_key`,
    ADD UNIQUE INDEX `antrean_sesi_id_awalan_nomor_key`(`sesi_id`, `awalan`, `nomor`);

CREATE TABLE `antrean_sementara_jkn` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pasien_id` INTEGER NOT NULL,
    `lokasi_id` INTEGER NULL,
    `jenis_poli` VARCHAR(100) NOT NULL,
    `awalan` VARCHAR(3) NOT NULL,
    `pcare_no_urut` VARCHAR(10) NOT NULL,
    `jkn_nomor_kartu` VARCHAR(50) NULL,
    `keluhan_singkat` VARCHAR(500) NULL,
    `tanggal_daftar` DATE NOT NULL,
    `status` ENUM('menunggu', 'dipindahkan', 'batal') NOT NULL DEFAULT 'menunggu',
    `kunjungan_id` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diubah_pada` DATETIME(3) NULL,

    INDEX `antrean_sementara_jkn_fasyankes_status_idx`(`fasyankes_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `antrean_sementara_jkn` ADD CONSTRAINT `antrean_sementara_jkn_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `event_panggilan`
    ADD COLUMN `sesi_id` INTEGER NULL AFTER `fasyankes_id`,
    ADD INDEX `event_panggilan_fasyankes_id_sesi_id_id_idx`(`fasyankes_id`, `sesi_id`, `id`);
