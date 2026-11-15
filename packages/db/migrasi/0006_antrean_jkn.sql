-- Antrean online BPJS (Mobile JKN) untuk FKTP.
-- pengaturan_antrean_jkn: satu baris per fasyankes. Layanan antrean BPJS memakai alamat dan kredensial PCare yang aktif,
-- dengan nama layanan dan user key sendiri. `ws_username`/`ws_password_hash` adalah akun yang dipakai BPJS untuk memanggil
-- web service antrean milik klinik (ambil antrean dari Mobile JKN).
CREATE TABLE `pengaturan_antrean_jkn` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT false,
    `service_name` VARCHAR(50) NOT NULL DEFAULT 'antreanfktp',
    `user_key_terenkripsi` TEXT NULL,
    `ws_username` VARCHAR(100) NULL,
    `ws_password_hash` VARCHAR(255) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diubah_pada` DATETIME(3) NULL,

    UNIQUE INDEX `pengaturan_antrean_jkn_fasyankes_id_key`(`fasyankes_id`),
    UNIQUE INDEX `pengaturan_antrean_jkn_ws_username_key`(`ws_username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `pengaturan_antrean_jkn` ADD CONSTRAINT `pengaturan_antrean_jkn_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Pemetaan kode BPJS: jenis 'poli' (kunci = nama jenis poli klira) dan 'dokter' (kunci = id pengguna).
CREATE TABLE `pemetaan_bpjs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `jenis` ENUM('poli', 'dokter') NOT NULL,
    `kunci` VARCHAR(60) NOT NULL,
    `kode` VARCHAR(20) NOT NULL,
    `nama` VARCHAR(100) NULL,

    UNIQUE INDEX `pemetaan_bpjs_fasyankes_id_jenis_kunci_key`(`fasyankes_id`, `jenis`, `kunci`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `pemetaan_bpjs` ADD CONSTRAINT `pemetaan_bpjs_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Asal antrean (loket atau Mobile JKN) dan hasil pengiriman status antrean ke BPJS.
ALTER TABLE `antrean` ADD COLUMN `sumber` ENUM('loket', 'mobile_jkn') NOT NULL DEFAULT 'loket', ADD COLUMN `bpjs_status` ENUM('terkirim', 'gagal') NULL, ADD COLUMN `bpjs_pesan` VARCHAR(300) NULL;
