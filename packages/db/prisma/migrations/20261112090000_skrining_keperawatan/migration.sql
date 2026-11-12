-- Skrining keperawatan (P6): bagian catatan berversi baru; alergi pindah dari anamnesis ke keperawatan (data lama tidak dipindahkan, aplikasi belum produksi).
-- AlterTable
ALTER TABLE `anamnesis` DROP COLUMN `alergi`;

-- CreateTable
CREATE TABLE `keperawatan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `versi` INTEGER NOT NULL,
    `kajian_keperawatan` TEXT NULL,
    `telah_diobati` TEXT NULL,
    `alergi` VARCHAR(500) NULL,
    `obat_dikonsumsi` TEXT NULL,
    `diagnosa_keperawatan` VARCHAR(500) NULL,
    `rencana_asuhan` TEXT NULL,
    `nyeri_jenis` ENUM('tidak', 'akut', 'kronis') NOT NULL DEFAULT 'tidak',
    `nyeri_skala` TINYINT NULL,
    `nyeri_lokasi` VARCHAR(200) NULL,
    `nyeri_durasi` VARCHAR(200) NULL,
    `nyeri_frekuensi` VARCHAR(200) NULL,
    `nyeri_hilang_bila` VARCHAR(200) NULL,
    `jatuh_tidak_seimbang` BOOLEAN NOT NULL DEFAULT false,
    `jatuh_menopang` BOOLEAN NOT NULL DEFAULT false,
    `gizi_bb_turun` BOOLEAN NOT NULL DEFAULT false,
    `gizi_asupan_kurang` BOOLEAN NOT NULL DEFAULT false,
    `skrining_visual` ENUM('hijau', 'kuning', 'merah') NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `keperawatan_fasyankes_id_idx`(`fasyankes_id`),
    UNIQUE INDEX `keperawatan_kunjungan_id_versi_key`(`kunjungan_id`, `versi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `keperawatan` ADD CONSTRAINT `keperawatan_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

