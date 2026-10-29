-- AlterTable
ALTER TABLE `ig_koneksi` ADD COLUMN `access_token` LONGTEXT NULL,
    ADD COLUMN `generasi` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `oauth_user_id` VARCHAR(100) NULL,
    ADD COLUMN `penyedia` VARCHAR(20) NOT NULL DEFAULT 'meta',
    ADD COLUMN `token_berakhir` DATETIME(3) NULL,
    ADD COLUMN `token_diperbarui` DATETIME(3) NULL,
    ADD COLUMN `webhook_aktif` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `api_key` LONGTEXT NULL,
    MODIFY `webhook_secret` LONGTEXT NULL;

-- CreateTable
CREATE TABLE `ig_oauth_state` (
    `hash` VARCHAR(64) NOT NULL,
    `pengguna_id` INTEGER NOT NULL,
    `fasyankes_id` INTEGER NOT NULL,
    `sesi_hash` VARCHAR(64) NOT NULL,
    `generasi` INTEGER NOT NULL,
    `berakhir` DATETIME(3) NOT NULL,

    INDEX `ig_oauth_state_berakhir_idx`(`berakhir`),
    PRIMARY KEY (`hash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ig_media_publik` (
    `token_hash` VARCHAR(64) NOT NULL,
    `media_id` VARCHAR(36) NOT NULL,
    `generasi` INTEGER NOT NULL,
    `berakhir` DATETIME(3) NOT NULL,

    INDEX `ig_media_publik_berakhir_idx`(`berakhir`),
    PRIMARY KEY (`token_hash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ig_penghapusan` (
    `kode` VARCHAR(64) NOT NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`kode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Koneksi Zernio lama tidak otomatis dianggap sebagai koneksi Meta.
UPDATE ig_koneksi SET penyedia = 'zernio', aktif = false, status = 'terputus' WHERE api_key IS NOT NULL;
