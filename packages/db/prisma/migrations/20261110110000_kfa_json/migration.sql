-- Katalog KFA resmi pindah ke berkas statis apps/api/data/kfa.json; tabel referensi_kfa dihapus.
-- master_obat menyimpan kode, nama, dan bentuk sediaan KFA sendiri (dibackfill dari referensi_kfa bila ada baris).
ALTER TABLE `master_obat` ADD COLUMN `kfa_kode` VARCHAR(30) NULL,
    ADD COLUMN `kfa_nama` VARCHAR(700) NULL,
    ADD COLUMN `bentuk_sediaan` VARCHAR(100) NULL;

UPDATE `master_obat` m JOIN `referensi_kfa` k ON k.`id` = m.`kfa_id`
SET m.`kfa_kode` = k.`kode`, m.`kfa_nama` = k.`nama`, m.`bentuk_sediaan` = k.`bentuk_sediaan`;

ALTER TABLE `master_obat` MODIFY `kfa_kode` VARCHAR(30) NOT NULL,
    MODIFY `kfa_nama` VARCHAR(700) NOT NULL;

ALTER TABLE `master_obat` DROP FOREIGN KEY `master_obat_kfa_id_fkey`;
DROP INDEX `master_obat_fasyankes_id_kfa_id_key` ON `master_obat`;
ALTER TABLE `master_obat` DROP COLUMN `kfa_id`;
CREATE UNIQUE INDEX `master_obat_fasyankes_id_kfa_kode_key` ON `master_obat`(`fasyankes_id`, `kfa_kode`);

DROP TABLE `referensi_kfa`;

-- CreateTable
CREATE TABLE `kfa_lokal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kode` VARCHAR(30) NOT NULL,
    `nama` VARCHAR(700) NOT NULL,
    `bentuk_sediaan` VARCHAR(100) NULL,
    `satuan` VARCHAR(50) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'aktif',
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diubah_pada` DATETIME(3) NULL,

    UNIQUE INDEX `kfa_lokal_fasyankes_id_kode_key`(`fasyankes_id`, `kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
