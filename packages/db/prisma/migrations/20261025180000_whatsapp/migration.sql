-- Inbox WhatsApp satu nomor, sesi dan isi pesan terenkripsi di aplikasi.

CREATE TABLE `wa_koneksi` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `fasyankes_id` INTEGER NOT NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT false,
    `generasi` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(30) NOT NULL DEFAULT 'terputus',
    `nomor` VARCHAR(40) NULL,
    `qr` LONGTEXT NULL,
    `detak` DATETIME(3) NULL,
    `pemilik_engine` VARCHAR(36) NULL,
    `sewa_sampai` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `wa_auth` (
    `id` VARCHAR(200) NOT NULL,
    `isi` LONGTEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `wa_percakapan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `jid` VARCHAR(100) NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `pasien_id` INTEGER NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'baru',
    `penanggung_jawab` INTEGER NULL,
    `diperbarui_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `wa_percakapan_fasyankes_id_diperbarui_pada_idx`(`fasyankes_id`, `diperbarui_pada`),
    UNIQUE INDEX `wa_percakapan_fasyankes_id_jid_key`(`fasyankes_id`, `jid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `wa_pesan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `percakapan_id` INTEGER NOT NULL,
    `wa_id` VARCHAR(200) NULL,
    `arah` VARCHAR(10) NOT NULL,
    `isi` LONGTEXT NOT NULL,
    `jenis` VARCHAR(20) NOT NULL DEFAULT 'text',
    `media_id` VARCHAR(36) NULL,
    `status` VARCHAR(20) NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `wa_pesan_wa_id_key`(`wa_id`),
    INDEX `wa_pesan_percakapan_id_id_idx`(`percakapan_id`, `id`),
    INDEX `wa_pesan_status_arah_idx`(`status`, `arah`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `wa_baca` (
    `percakapan_id` INTEGER NOT NULL,
    `pengguna_id` INTEGER NOT NULL,
    `pesan_id` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`percakapan_id`, `pengguna_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `wa_media` (
    `id` VARCHAR(36) NOT NULL,
    `fasyankes_id` INTEGER NOT NULL,
    `isi` LONGTEXT NOT NULL,
    `mime` VARCHAR(100) NOT NULL,
    `nama` VARCHAR(200) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `wa_pesan` ADD CONSTRAINT `wa_pesan_percakapan_id_fkey` FOREIGN KEY (`percakapan_id`) REFERENCES `wa_percakapan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `wa_baca` ADD CONSTRAINT `wa_baca_percakapan_id_fkey` FOREIGN KEY (`percakapan_id`) REFERENCES `wa_percakapan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Tambah katalog izin; akun yang sudah ada dapat diberikan akses lewat Pengaturan.
INSERT IGNORE INTO izin (fitur, aksi, cakupan)
SELECT fitur, aksi, cakupan FROM
(SELECT 'pesan' AS fitur UNION ALL SELECT 'whatsapp') f
CROSS JOIN (SELECT 'lihat' AS aksi UNION ALL SELECT 'input' UNION ALL SELECT 'perbaikan') a
CROSS JOIN (SELECT 'unit' AS cakupan UNION ALL SELECT 'layanan') c;
