-- Instagram DM melalui Zernio: satu akun per instalasi.
CREATE TABLE `ig_koneksi` (
 `id` INTEGER NOT NULL DEFAULT 1,
 `fasyankes_id` INTEGER NOT NULL,
 `aktif` BOOLEAN NOT NULL DEFAULT false,
 `status` VARCHAR(30) NOT NULL DEFAULT 'terputus',
 `akun_id` VARCHAR(100) NOT NULL,
 `username` VARCHAR(100) NOT NULL,
 `api_key` LONGTEXT NOT NULL,
 `webhook_secret` LONGTEXT NOT NULL,
 `webhook_id` VARCHAR(100) NULL,
 PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `ig_event` (
 `id` VARCHAR(64) NOT NULL,
 PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `ig_percakapan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `jid` VARCHAR(100) NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `pasien_id` INTEGER NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'baru',
    `penanggung_jawab` INTEGER NULL,
    `diperbarui_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ig_percakapan_fasyankes_id_diperbarui_pada_idx`(`fasyankes_id`, `diperbarui_pada`),
    UNIQUE INDEX `ig_percakapan_fasyankes_id_jid_key`(`fasyankes_id`, `jid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ig_pesan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `percakapan_id` INTEGER NOT NULL,
    `ig_id` VARCHAR(200) NULL,
    `arah` VARCHAR(10) NOT NULL,
    `isi` LONGTEXT NOT NULL,
    `jenis` VARCHAR(20) NOT NULL DEFAULT 'text',
    `media_id` VARCHAR(36) NULL,
    `status` VARCHAR(20) NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ig_pesan_ig_id_key`(`ig_id`),
    INDEX `ig_pesan_percakapan_id_id_idx`(`percakapan_id`, `id`),
    INDEX `ig_pesan_status_arah_idx`(`status`, `arah`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ig_baca` (
    `percakapan_id` INTEGER NOT NULL,
    `pengguna_id` INTEGER NOT NULL,
    `pesan_id` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`percakapan_id`, `pengguna_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ig_media` (
    `id` VARCHAR(36) NOT NULL,
    `fasyankes_id` INTEGER NOT NULL,
    `isi` LONGTEXT NOT NULL,
    `mime` VARCHAR(100) NOT NULL,
    `nama` VARCHAR(200) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ig_pesan` ADD CONSTRAINT `ig_pesan_percakapan_id_fkey` FOREIGN KEY (`percakapan_id`) REFERENCES `ig_percakapan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ig_baca` ADD CONSTRAINT `ig_baca_percakapan_id_fkey` FOREIGN KEY (`percakapan_id`) REFERENCES `ig_percakapan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


INSERT IGNORE INTO izin (fitur, aksi, cakupan) VALUES ('instagram', 'lihat', 'unit');
