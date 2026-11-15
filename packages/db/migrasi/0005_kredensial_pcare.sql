-- Kredensial PCare BPJS per lingkungan (satu baris per fasyankes dan lingkungan), mengikuti pola kredensial_satusehat.
-- Rahasia (secret key, user key, password) disimpan terenkripsi. Alamat dan nama layanan kosong/bawaan memakai alamat resmi lingkungan.
CREATE TABLE `kredensial_pcare` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `environment` ENUM('sandbox', 'produksi') NOT NULL,
    `cons_id` VARCHAR(50) NOT NULL,
    `secret_key_terenkripsi` TEXT NOT NULL,
    `user_key_terenkripsi` TEXT NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `password_terenkripsi` TEXT NOT NULL,
    `app_code` VARCHAR(20) NOT NULL,
    `base_url` VARCHAR(300) NULL,
    `service_name` VARCHAR(50) NOT NULL DEFAULT 'pcare-rest',
    `aktif` BOOLEAN NOT NULL DEFAULT false,
    `diuji_pada` DATETIME(3) NULL,
    `hasil_uji` VARCHAR(500) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diubah_pada` DATETIME(3) NULL,

    UNIQUE INDEX `kredensial_pcare_fasyankes_id_environment_key`(`fasyankes_id`, `environment`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `kredensial_pcare` ADD CONSTRAINT `kredensial_pcare_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
