-- Tabel shift: tiga shift tetap per klinik (Pagi, Siang, Malam) yang hanya memuat jam. Jadwal praktik memilih shift, bukan jam bebas.
CREATE TABLE `shift` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `urutan` INTEGER NOT NULL,
    `nama` VARCHAR(50) NOT NULL,
    `jam_mulai` VARCHAR(5) NOT NULL,
    `jam_selesai` VARCHAR(5) NOT NULL,

    UNIQUE INDEX `shift_fasyankes_id_urutan_key`(`fasyankes_id`, `urutan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `shift` ADD CONSTRAINT `shift_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO `shift` (`fasyankes_id`, `urutan`, `nama`, `jam_mulai`, `jam_selesai`) SELECT `id`, 1, 'Pagi', '08:00', '14:00' FROM `fasyankes`;

INSERT INTO `shift` (`fasyankes_id`, `urutan`, `nama`, `jam_mulai`, `jam_selesai`) SELECT `id`, 2, 'Siang', '14:00', '20:00' FROM `fasyankes`;

INSERT INTO `shift` (`fasyankes_id`, `urutan`, `nama`, `jam_mulai`, `jam_selesai`) SELECT `id`, 3, 'Malam', '20:00', '23:59' FROM `fasyankes`;

ALTER TABLE `jadwal_praktik` ADD COLUMN `shift_id` INTEGER NULL AFTER `hari`;

UPDATE `jadwal_praktik` j JOIN `shift` s ON s.`fasyankes_id` = j.`fasyankes_id` AND s.`urutan` = IF(j.`jam_mulai` < '12:00', 1, IF(j.`jam_mulai` < '17:00', 2, 3)) SET j.`shift_id` = s.`id`;

ALTER TABLE `jadwal_praktik` MODIFY `shift_id` INTEGER NOT NULL, DROP COLUMN `jam_mulai`, DROP COLUMN `jam_selesai`, ADD INDEX `jadwal_praktik_shift_id_idx`(`shift_id`);

ALTER TABLE `jadwal_praktik` ADD CONSTRAINT `jadwal_praktik_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `shift`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
