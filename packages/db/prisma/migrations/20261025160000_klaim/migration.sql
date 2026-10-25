-- CreateTable
CREATE TABLE `klaim` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `nomor_sep` VARCHAR(50) NULL,
    `status` ENUM('menunggu_sep', 'siap_diajukan', 'diajukan', 'dikembalikan', 'diajukan_ulang', 'ditolak', 'dibayar', 'lewat_batas') NOT NULL,
    `tanggal_selesai` DATETIME(3) NOT NULL,
    `batas_pengajuan` DATETIME(3) NOT NULL,
    `diagnosis` JSON NOT NULL,
    `tindakan` JSON NOT NULL,
    `berkas` JSON NOT NULL,
    `catatan` VARCHAR(300) NULL,
    `diajukan_pada` DATETIME(3) NULL,
    `dikembalikan_pada` DATETIME(3) NULL,
    `berita_acara` TEXT NULL,
    `batas_ajukan_ulang` DATETIME(3) NULL,
    `alasan` VARCHAR(500) NULL,
    `jumlah_dibayar` INTEGER NULL,
    `dibayar_pada` DATETIME(3) NULL,
    `dibuat_oleh` INTEGER NOT NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diperbarui_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `klaim_kunjungan_id_key`(`kunjungan_id`),
    INDEX `klaim_fasyankes_id_status_idx`(`fasyankes_id`, `status`),
    INDEX `klaim_fasyankes_id_batas_pengajuan_idx`(`fasyankes_id`, `batas_pengajuan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `riwayat_klaim` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `klaim_id` INTEGER NOT NULL,
    `dari` ENUM('menunggu_sep', 'siap_diajukan', 'diajukan', 'dikembalikan', 'diajukan_ulang', 'ditolak', 'dibayar', 'lewat_batas') NULL,
    `ke` ENUM('menunggu_sep', 'siap_diajukan', 'diajukan', 'dikembalikan', 'diajukan_ulang', 'ditolak', 'dibayar', 'lewat_batas') NOT NULL,
    `alasan` VARCHAR(500) NULL,
    `oleh` INTEGER NOT NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `riwayat_klaim_klaim_id_idx`(`klaim_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

