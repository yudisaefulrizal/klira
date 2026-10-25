-- CreateTable
CREATE TABLE `sesi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pengguna_id` INTEGER NOT NULL,
    `id_hash` CHAR(64) NOT NULL,
    `alamat` VARCHAR(64) NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `kedaluwarsa_pada` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sesi_id_hash_key`(`id_hash`),
    INDEX `sesi_pengguna_id_idx`(`pengguna_id`),
    INDEX `sesi_kedaluwarsa_pada_idx`(`kedaluwarsa_pada`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `log_audit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NULL,
    `pengguna_id` INTEGER NULL,
    `aksi` VARCHAR(50) NOT NULL,
    `entitas` VARCHAR(100) NOT NULL,
    `entitas_id` INTEGER NULL,
    `keterangan` VARCHAR(255) NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `alamat` VARCHAR(64) NULL,

    INDEX `log_audit_pengguna_id_idx`(`pengguna_id`),
    INDEX `log_audit_waktu_idx`(`waktu`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sesi` ADD CONSTRAINT `sesi_pengguna_id_fkey` FOREIGN KEY (`pengguna_id`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
