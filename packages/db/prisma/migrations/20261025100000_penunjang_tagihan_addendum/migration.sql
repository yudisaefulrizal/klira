-- AlterTable
ALTER TABLE `persetujuan` ADD COLUMN `kunjungan_id` INTEGER NULL,
    ADD COLUMN `tindakan_kode` VARCHAR(50) NULL,
    ADD COLUMN `tindakan_nama` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `master_pemeriksaan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kode` VARCHAR(50) NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `jenis` VARCHAR(20) NOT NULL DEFAULT 'lab',
    `kode_loinc` VARCHAR(30) NULL,
    `loinc_contoh` BOOLEAN NOT NULL DEFAULT false,
    `jenis_spesimen` VARCHAR(100) NULL,
    `satuan` VARCHAR(50) NULL,
    `rujukan_min` DOUBLE NULL,
    `rujukan_maks` DOUBLE NULL,
    `rujukan_teks` VARCHAR(200) NULL,
    `tarif_layanan_id` INTEGER NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diubah_pada` DATETIME(3) NULL,

    UNIQUE INDEX `master_pemeriksaan_fasyankes_id_kode_key`(`fasyankes_id`, `kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_penunjang` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `pasien_id` INTEGER NOT NULL,
    `jenis` VARCHAR(20) NOT NULL DEFAULT 'lab',
    `master_pemeriksaan_id` INTEGER NULL,
    `kode_loinc` VARCHAR(30) NULL,
    `nama` VARCHAR(200) NOT NULL,
    `prioritas` VARCHAR(20) NOT NULL DEFAULT 'rutin',
    `catatan` VARCHAR(500) NULL,
    `status` ENUM('dipesan', 'spesimen_diambil', 'menunggu_hasil', 'divalidasi') NOT NULL DEFAULT 'dipesan',
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `order_penunjang_fasyankes_id_status_idx`(`fasyankes_id`, `status`),
    INDEX `order_penunjang_kunjungan_id_idx`(`kunjungan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spesimen` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `order_id` INTEGER NOT NULL,
    `asal` VARCHAR(100) NOT NULL,
    `waktu_ambil` DATETIME(3) NOT NULL,
    `petugas_id` INTEGER NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `spesimen_order_id_key`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hasil_penunjang` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `order_id` INTEGER NOT NULL,
    `nilai` VARCHAR(200) NOT NULL,
    `satuan` VARCHAR(50) NULL,
    `rujukan_teks` VARCHAR(200) NULL,
    `interpretasi` VARCHAR(30) NOT NULL,
    `catatan` VARCHAR(1000) NULL,
    `dientri_oleh` INTEGER NOT NULL,
    `dientri_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `validator_id` INTEGER NULL,
    `divalidasi_pada` DATETIME(3) NULL,

    UNIQUE INDEX `hasil_penunjang_order_id_key`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tagihan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `status_tagihan` ENUM('belum_lengkap', 'lengkap') NOT NULL DEFAULT 'belum_lengkap',
    `status_pembayaran` ENUM('belum', 'sebagian', 'lunas') NOT NULL DEFAULT 'belum',
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tagihan_kunjungan_id_key`(`kunjungan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_tagihan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `tagihan_id` INTEGER NOT NULL,
    `jenis` ENUM('konsultasi', 'tindakan', 'lab', 'kamar') NOT NULL,
    `tarif_layanan_id` INTEGER NULL,
    `kode` VARCHAR(50) NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `jumlah` INTEGER NOT NULL DEFAULT 1,
    `harga` INTEGER NULL,
    `order_penunjang_id` INTEGER NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `item_tagihan_order_penunjang_id_key`(`order_penunjang_id`),
    INDEX `item_tagihan_tagihan_id_idx`(`tagihan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `addendum` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `entitas` VARCHAR(50) NOT NULL,
    `entitas_id` INTEGER NOT NULL,
    `versi` INTEGER NOT NULL,
    `isi` JSON NOT NULL,
    `alasan` VARCHAR(500) NOT NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `perlu_kirim_ulang` BOOLEAN NOT NULL DEFAULT true,
    `dikirim_pada` DATETIME(3) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `addendum_kunjungan_id_idx`(`kunjungan_id`),
    UNIQUE INDEX `addendum_entitas_entitas_id_versi_key`(`entitas`, `entitas_id`, `versi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `persetujuan_kunjungan_id_idx` ON `persetujuan`(`kunjungan_id`);

-- AddForeignKey
ALTER TABLE `order_penunjang` ADD CONSTRAINT `order_penunjang_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_penunjang` ADD CONSTRAINT `order_penunjang_master_pemeriksaan_id_fkey` FOREIGN KEY (`master_pemeriksaan_id`) REFERENCES `master_pemeriksaan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spesimen` ADD CONSTRAINT `spesimen_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `order_penunjang`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hasil_penunjang` ADD CONSTRAINT `hasil_penunjang_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `order_penunjang`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tagihan` ADD CONSTRAINT `tagihan_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_tagihan` ADD CONSTRAINT `item_tagihan_tagihan_id_fkey` FOREIGN KEY (`tagihan_id`) REFERENCES `tagihan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

