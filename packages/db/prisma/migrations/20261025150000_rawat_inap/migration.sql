-- CreateTable
CREATE TABLE `penempatan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `lokasi_id` INTEGER NOT NULL,
    `kelas` ENUM('satu', 'dua', 'tiga', 'vip', 'vvip') NOT NULL,
    `indikator` ENUM('kelas_tetap', 'naik_kelas', 'turun_kelas', 'titip_rawat') NOT NULL DEFAULT 'kelas_tetap',
    `tarif_id` INTEGER NULL,
    `mulai` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `selesai` DATETIME(3) NULL,
    `dibuat_oleh` INTEGER NULL,

    INDEX `penempatan_kunjungan_id_idx`(`kunjungan_id`),
    INDEX `penempatan_fasyankes_id_lokasi_id_selesai_idx`(`fasyankes_id`, `lokasi_id`, `selesai`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `catatan_harian` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `subjektif` TEXT NOT NULL,
    `objektif` TEXT NOT NULL,
    `asesmen` TEXT NOT NULL,
    `rencana` TEXT NOT NULL,
    `instruksi` TEXT NULL,
    `tanda_vital` JSON NULL,
    `dibuat_oleh` INTEGER NOT NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `catatan_harian_fasyankes_id_kunjungan_id_idx`(`fasyankes_id`, `kunjungan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pemulangan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `disposisi` ENUM('home', 'aadvice', 'other-hcf', 'exp-lt48h', 'exp-gt48h', 'oth') NOT NULL,
    `kondisi_pulang` VARCHAR(300) NOT NULL,
    `diagnosis_akhir` VARCHAR(500) NOT NULL,
    `ringkasan` TEXT NOT NULL,
    `tindak_lanjut` TEXT NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dibuat_oleh` INTEGER NOT NULL,

    UNIQUE INDEX `pemulangan_kunjungan_id_key`(`kunjungan_id`),
    INDEX `pemulangan_fasyankes_id_idx`(`fasyankes_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

