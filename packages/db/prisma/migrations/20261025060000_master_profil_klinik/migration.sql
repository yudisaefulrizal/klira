-- AlterTable
ALTER TABLE `fasyankes` ADD COLUMN `tanggal_akreditasi` DATE NULL;

-- AlterTable
ALTER TABLE `profil_profesi` ADD COLUMN `aktif` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `jadwal_praktik` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pengguna_id` INTEGER NOT NULL,
    `lokasi_id` INTEGER NOT NULL,
    `hari` INTEGER NOT NULL,
    `jam_mulai` VARCHAR(5) NOT NULL,
    `jam_selesai` VARCHAR(5) NOT NULL,
    `kuota` INTEGER NOT NULL,
    `berlaku_dari` DATE NOT NULL,
    `berlaku_sampai` DATE NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `jadwal_praktik_fasyankes_id_idx`(`fasyankes_id`),
    INDEX `jadwal_praktik_pengguna_id_idx`(`pengguna_id`),
    INDEX `jadwal_praktik_lokasi_id_idx`(`lokasi_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tarif_layanan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kode` VARCHAR(50) NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `jenis` ENUM('konsultasi', 'tindakan', 'lab', 'kamar') NOT NULL,
    `harga_umum` INTEGER NOT NULL,
    `harga_jkn` INTEGER NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tarif_layanan_fasyankes_id_kode_key`(`fasyankes_id`, `kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wilayah` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kode` VARCHAR(20) NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `tingkat` ENUM('provinsi', 'kabupaten_kota', 'kecamatan', 'kelurahan_desa') NOT NULL,
    `induk_kode` VARCHAR(20) NULL,
    `contoh` BOOLEAN NOT NULL DEFAULT false,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `wilayah_kode_key`(`kode`),
    INDEX `wilayah_induk_kode_idx`(`induk_kode`),
    INDEX `wilayah_tingkat_idx`(`tingkat`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `riwayat_profil` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `jenis` VARCHAR(20) NOT NULL,
    `pengguna_id` INTEGER NULL,
    `ringkasan` TEXT NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `riwayat_profil_fasyankes_id_dibuat_pada_idx`(`fasyankes_id`, `dibuat_pada`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `jadwal_praktik` ADD CONSTRAINT `jadwal_praktik_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jadwal_praktik` ADD CONSTRAINT `jadwal_praktik_pengguna_id_fkey` FOREIGN KEY (`pengguna_id`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jadwal_praktik` ADD CONSTRAINT `jadwal_praktik_lokasi_id_fkey` FOREIGN KEY (`lokasi_id`) REFERENCES `lokasi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tarif_layanan` ADD CONSTRAINT `tarif_layanan_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat_profil` ADD CONSTRAINT `riwayat_profil_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

