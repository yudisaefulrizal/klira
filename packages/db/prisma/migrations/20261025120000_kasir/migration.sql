-- AlterTable
ALTER TABLE `tagihan` ADD COLUMN `alasan_tutup_belum_lunas` VARCHAR(300) NULL;

-- CreateTable
CREATE TABLE `shift_kasir` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kasir_id` INTEGER NOT NULL,
    `buka` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tutup` DATETIME(3) NULL,
    `kas_awal` INTEGER NOT NULL,
    `kas_akhir` INTEGER NULL,
    `selisih` INTEGER NULL,
    `alasan_selisih` VARCHAR(300) NULL,

    INDEX `shift_kasir_fasyankes_id_kasir_id_idx`(`fasyankes_id`, `kasir_id`),
    INDEX `shift_kasir_fasyankes_id_buka_idx`(`fasyankes_id`, `buka`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pembayaran` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `tagihan_id` INTEGER NOT NULL,
    `shift_id` INTEGER NOT NULL,
    `metode` ENUM('tunai', 'transfer', 'qris') NOT NULL,
    `jumlah` INTEGER NOT NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `kasir_id` INTEGER NOT NULL,

    INDEX `pembayaran_tagihan_id_idx`(`tagihan_id`),
    INDEX `pembayaran_shift_id_idx`(`shift_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengeluaran_obat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `resep_id` INTEGER NOT NULL,
    `item_resep_id` INTEGER NOT NULL,
    `master_obat_id` INTEGER NOT NULL,
    `jumlah` INTEGER NOT NULL,
    `harga` INTEGER NOT NULL,
    `stok_kurang` BOOLEAN NOT NULL DEFAULT false,
    `alasan` VARCHAR(300) NULL,
    `petugas_id` INTEGER NOT NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `pengeluaran_obat_item_resep_id_key`(`item_resep_id`),
    INDEX `pengeluaran_obat_resep_id_idx`(`resep_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pembayaran` ADD CONSTRAINT `pembayaran_tagihan_id_fkey` FOREIGN KEY (`tagihan_id`) REFERENCES `tagihan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pembayaran` ADD CONSTRAINT `pembayaran_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `shift_kasir`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

