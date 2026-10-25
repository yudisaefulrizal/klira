-- AlterTable
ALTER TABLE `item_tagihan` ADD COLUMN `item_resep_id` INTEGER NULL,
    MODIFY `jenis` ENUM('konsultasi', 'tindakan', 'lab', 'kamar', 'obat') NOT NULL;

-- AlterTable
ALTER TABLE `tarif_layanan` MODIFY `jenis` ENUM('konsultasi', 'tindakan', 'lab', 'kamar', 'obat') NOT NULL;

-- CreateTable
CREATE TABLE `referensi_kfa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kode` VARCHAR(30) NOT NULL,
    `tingkat` INTEGER NOT NULL,
    `nama` VARCHAR(255) NOT NULL,
    `bentuk_sediaan` VARCHAR(100) NULL,
    `rute` VARCHAR(100) NULL,
    `satuan` VARCHAR(50) NULL,
    `kekuatan` VARCHAR(100) NULL,
    `nomor_izin_edar` VARCHAR(100) NULL,
    `produsen` VARCHAR(200) NULL,
    `generik` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(30) NOT NULL DEFAULT 'aktif',
    `produk_pengganti_kode` VARCHAR(30) NULL,
    `contoh` BOOLEAN NOT NULL DEFAULT false,
    `diperbarui_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `referensi_kfa_kode_key`(`kode`),
    INDEX `referensi_kfa_tingkat_idx`(`tingkat`),
    INDEX `referensi_kfa_nama_idx`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `master_obat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kfa_id` INTEGER NOT NULL,
    `nama_tampil` VARCHAR(200) NOT NULL,
    `satuan` VARCHAR(50) NOT NULL,
    `harga` INTEGER NOT NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diubah_pada` DATETIME(3) NULL,

    INDEX `master_obat_fasyankes_id_idx`(`fasyankes_id`),
    UNIQUE INDEX `master_obat_fasyankes_id_kfa_id_key`(`fasyankes_id`, `kfa_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resep` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `dpjp_id` INTEGER NOT NULL,
    `nomor_resep` VARCHAR(40) NOT NULL,
    `jenis_pembiayaan` ENUM('umum', 'jkn') NOT NULL DEFAULT 'umum',
    `status` ENUM('diajukan', 'ditelaah', 'siap', 'diserahkan') NOT NULL DEFAULT 'diajukan',
    `waktu_siap` DATETIME(3) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `resep_kunjungan_id_idx`(`kunjungan_id`),
    INDEX `resep_fasyankes_id_status_idx`(`fasyankes_id`, `status`),
    UNIQUE INDEX `resep_fasyankes_id_nomor_resep_key`(`fasyankes_id`, `nomor_resep`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_resep` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `resep_id` INTEGER NOT NULL,
    `master_obat_id` INTEGER NOT NULL,
    `aturan_pakai` VARCHAR(200) NOT NULL,
    `bentuk` VARCHAR(50) NULL,
    `rute` VARCHAR(50) NULL,
    `jumlah` INTEGER NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `item_resep_resep_id_idx`(`resep_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `telaah_resep` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `resep_id` INTEGER NOT NULL,
    `apoteker_id` INTEGER NOT NULL,
    `administratif` BOOLEAN NOT NULL,
    `farmasetik` BOOLEAN NOT NULL,
    `klinis` BOOLEAN NOT NULL,
    `catatan` VARCHAR(1000) NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `telaah_resep_resep_id_key`(`resep_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stok_obat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `master_obat_id` INTEGER NOT NULL,
    `batch` VARCHAR(60) NOT NULL,
    `kedaluwarsa` DATE NOT NULL,
    `jumlah` INTEGER NOT NULL DEFAULT 0,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diubah_pada` DATETIME(3) NULL,

    INDEX `stok_obat_fasyankes_id_idx`(`fasyankes_id`),
    UNIQUE INDEX `stok_obat_master_obat_id_batch_key`(`master_obat_id`, `batch`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mutasi_stok` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `stok_id` INTEGER NOT NULL,
    `jenis` ENUM('terima', 'keluar', 'koreksi') NOT NULL,
    `jumlah` INTEGER NOT NULL,
    `alasan` VARCHAR(300) NULL,
    `pengguna_id` INTEGER NOT NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `mutasi_stok_stok_id_idx`(`stok_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `item_tagihan_item_resep_id_key` ON `item_tagihan`(`item_resep_id`);

-- AddForeignKey
ALTER TABLE `master_obat` ADD CONSTRAINT `master_obat_kfa_id_fkey` FOREIGN KEY (`kfa_id`) REFERENCES `referensi_kfa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resep` ADD CONSTRAINT `resep_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_resep` ADD CONSTRAINT `item_resep_resep_id_fkey` FOREIGN KEY (`resep_id`) REFERENCES `resep`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_resep` ADD CONSTRAINT `item_resep_master_obat_id_fkey` FOREIGN KEY (`master_obat_id`) REFERENCES `master_obat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `telaah_resep` ADD CONSTRAINT `telaah_resep_resep_id_fkey` FOREIGN KEY (`resep_id`) REFERENCES `resep`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stok_obat` ADD CONSTRAINT `stok_obat_master_obat_id_fkey` FOREIGN KEY (`master_obat_id`) REFERENCES `master_obat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mutasi_stok` ADD CONSTRAINT `mutasi_stok_stok_id_fkey` FOREIGN KEY (`stok_id`) REFERENCES `stok_obat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

