-- Modul Keuangan lengkap: COA, Jurnal Umum (double-entry), Pengeluaran Operasional, Hutang Supplier, Piutang Non-JKN, dan Komponen Jasa Medis.

CREATE TABLE `akun_keuangan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kode` VARCHAR(20) NOT NULL,
    `nama` VARCHAR(120) NOT NULL,
    `tipe` ENUM('aset', 'kewajiban', 'ekuitas', 'pendapatan', 'beban') NOT NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `akun_keuangan_fasyankes_kode_key`(`fasyankes_id`, `kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `jurnal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `nomor` VARCHAR(40) NOT NULL,
    `tanggal` DATE NOT NULL,
    `sumber` ENUM('pembayaran', 'klaim', 'piutang', 'pengeluaran', 'hutang_supplier', 'manual') NOT NULL,
    `referensi_id` INTEGER NULL,
    `keterangan` VARCHAR(300) NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `jurnal_fasyankes_nomor_key`(`fasyankes_id`, `nomor`),
    INDEX `jurnal_fasyankes_tanggal_idx`(`fasyankes_id`, `tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `detail_jurnal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `jurnal_id` INTEGER NOT NULL,
    `akun_kode` VARCHAR(20) NOT NULL,
    `debit` INTEGER NOT NULL DEFAULT 0,
    `kredit` INTEGER NOT NULL DEFAULT 0,
    `keterangan` VARCHAR(200) NULL,

    INDEX `detail_jurnal_jurnal_idx`(`jurnal_id`),
    INDEX `detail_jurnal_akun_idx`(`fasyankes_id`, `akun_kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pengeluaran_operasional` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `tanggal` DATE NOT NULL,
    `kategori` ENUM('gaji', 'listrik_air', 'atk', 'pemeliharaan', 'rumah_tangga', 'lainnya') NOT NULL,
    `metode` ENUM('tunai', 'transfer') NOT NULL,
    `jumlah` INTEGER NOT NULL,
    `penerima` VARCHAR(120) NULL,
    `keterangan` VARCHAR(300) NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pengeluaran_op_fasyankes_tgl_idx`(`fasyankes_id`, `tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `faktur_supplier` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `nomor_faktur` VARCHAR(60) NOT NULL,
    `supplier` VARCHAR(150) NOT NULL,
    `tanggal_faktur` DATE NOT NULL,
    `jatuh_tempo` DATE NULL,
    `total` INTEGER NOT NULL,
    `terbayar` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('belum', 'sebagian', 'lunas') NOT NULL DEFAULT 'belum',
    `catatan` VARCHAR(300) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `faktur_supplier_fasyankes_status_idx`(`fasyankes_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `bayar_hutang_supplier` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `faktur_id` INTEGER NOT NULL,
    `tanggal` DATE NOT NULL,
    `metode` ENUM('tunai', 'transfer') NOT NULL,
    `jumlah` INTEGER NOT NULL,
    `catatan` VARCHAR(300) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bayar_hutang_faktur_idx`(`faktur_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `piutang_kunjungan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `tagihan_id` INTEGER NULL,
    `penjamin` VARCHAR(120) NOT NULL,
    `total` INTEGER NOT NULL,
    `terbayar` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('belum', 'sebagian', 'lunas') NOT NULL DEFAULT 'belum',
    `jatuh_tempo` DATE NULL,
    `catatan` VARCHAR(300) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `piutang_kunjungan_fasyankes_kunjungan_key`(`fasyankes_id`, `kunjungan_id`),
    INDEX `piutang_kunjungan_status_idx`(`fasyankes_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `bayar_piutang` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `piutang_id` INTEGER NOT NULL,
    `tanggal` DATE NOT NULL,
    `metode` ENUM('tunai', 'transfer', 'qris') NOT NULL,
    `jumlah` INTEGER NOT NULL,
    `catatan` VARCHAR(300) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bayar_piutang_piutang_idx`(`piutang_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `tarif_layanan`
    ADD COLUMN `jasa_klinik` INTEGER NOT NULL DEFAULT 0 AFTER `harga_jkn`,
    ADD COLUMN `jasa_dpjp` INTEGER NOT NULL DEFAULT 0 AFTER `jasa_klinik`,
    ADD COLUMN `jasa_perawat` INTEGER NOT NULL DEFAULT 0 AFTER `jasa_dpjp`;
