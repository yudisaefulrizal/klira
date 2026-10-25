-- AlterTable
ALTER TABLE `pasien` ADD COLUMN `jalur_identitas` VARCHAR(20) NOT NULL DEFAULT 'nik',
    ADD COLUMN `status_identitas` ENUM('lengkap', 'sementara') NOT NULL DEFAULT 'lengkap',
    ADD COLUMN `tidak_cakap` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `urutan_nomor_rm` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `terakhir` INTEGER NOT NULL DEFAULT 0,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `urutan_nomor_rm_fasyankes_id_key`(`fasyankes_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kunjungan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pasien_id` INTEGER NOT NULL,
    `jenis` ENUM('AMB', 'IMP') NOT NULL,
    `status` ENUM('planned', 'arrived', 'in-progress', 'finished') NOT NULL DEFAULT 'arrived',
    `tahap_layanan` ENUM('menunggu_skrining', 'pemeriksaan', 'resep', 'kasir', 'ditutup') NOT NULL DEFAULT 'menunggu_skrining',
    `kunjungan_asal_id` INTEGER NULL,
    `lokasi_id` INTEGER NULL,
    `cara_pembayaran` ENUM('umum', 'jkn') NOT NULL DEFAULT 'umum',
    `nomor_sep` VARCHAR(50) NULL,
    `keluhan_singkat` VARCHAR(500) NULL,
    `service_type` VARCHAR(100) NULL,
    `encounter_id` VARCHAR(100) NULL,
    `mulai` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `selesai` DATETIME(3) NULL,
    `waktu_tutup` DATETIME(3) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `kunjungan_fasyankes_id_tahap_layanan_idx`(`fasyankes_id`, `tahap_layanan`),
    INDEX `kunjungan_pasien_id_idx`(`pasien_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `peserta_kunjungan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `pengguna_id` INTEGER NOT NULL,
    `tipe` ENUM('ATND', 'SPRF') NOT NULL,
    `mulai` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `selesai` DATETIME(3) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `peserta_kunjungan_kunjungan_id_idx`(`kunjungan_id`),
    INDEX `peserta_kunjungan_pengguna_id_idx`(`pengguna_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `antrean` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `lokasi_id` INTEGER NOT NULL,
    `tanggal` DATE NOT NULL,
    `nomor` INTEGER NOT NULL,
    `status` ENUM('menunggu', 'dipanggil', 'dilayani', 'selesai', 'batal') NOT NULL DEFAULT 'menunggu',
    `waktu_daftar` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `waktu_panggil` DATETIME(3) NULL,
    `waktu_mulai` DATETIME(3) NULL,
    `waktu_selesai` DATETIME(3) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `antrean_kunjungan_id_key`(`kunjungan_id`),
    INDEX `antrean_fasyankes_id_tanggal_status_idx`(`fasyankes_id`, `tanggal`, `status`),
    UNIQUE INDEX `antrean_fasyankes_id_lokasi_id_tanggal_nomor_key`(`fasyankes_id`, `lokasi_id`, `tanggal`, `nomor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teks_persetujuan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NULL,
    `jenis` ENUM('general', 'tindakan', 'pembukaan', 'PDP') NOT NULL,
    `versi` INTEGER NOT NULL,
    `judul` VARCHAR(200) NOT NULL,
    `tujuan` VARCHAR(500) NOT NULL,
    `isi` TEXT NOT NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `teks_persetujuan_jenis_aktif_idx`(`jenis`, `aktif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `persetujuan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pasien_id` INTEGER NOT NULL,
    `jenis` ENUM('general', 'tindakan', 'pembukaan', 'PDP') NOT NULL,
    `teks_persetujuan_id` INTEGER NULL,
    `versi_teks` INTEGER NOT NULL,
    `tujuan` VARCHAR(500) NOT NULL,
    `penjelasan` TEXT NULL,
    `bentuk` VARCHAR(20) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'diberikan',
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `penandatangan` VARCHAR(20) NOT NULL,
    `wali_id` INTEGER NULL,
    `penandatangan_nama` VARCHAR(200) NOT NULL,
    `saksi_pengguna_id` INTEGER NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `persetujuan_pasien_id_idx`(`pasien_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `pasien_fasyankes_id_nama_idx` ON `pasien`(`fasyankes_id`, `nama`);

-- AddForeignKey
ALTER TABLE `urutan_nomor_rm` ADD CONSTRAINT `urutan_nomor_rm_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kunjungan` ADD CONSTRAINT `kunjungan_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kunjungan` ADD CONSTRAINT `kunjungan_pasien_id_fkey` FOREIGN KEY (`pasien_id`) REFERENCES `pasien`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kunjungan` ADD CONSTRAINT `kunjungan_kunjungan_asal_id_fkey` FOREIGN KEY (`kunjungan_asal_id`) REFERENCES `kunjungan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peserta_kunjungan` ADD CONSTRAINT `peserta_kunjungan_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peserta_kunjungan` ADD CONSTRAINT `peserta_kunjungan_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `antrean` ADD CONSTRAINT `antrean_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `antrean` ADD CONSTRAINT `antrean_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `persetujuan` ADD CONSTRAINT `persetujuan_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `persetujuan` ADD CONSTRAINT `persetujuan_pasien_id_fkey` FOREIGN KEY (`pasien_id`) REFERENCES `pasien`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `persetujuan` ADD CONSTRAINT `persetujuan_teks_persetujuan_id_fkey` FOREIGN KEY (`teks_persetujuan_id`) REFERENCES `teks_persetujuan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `persetujuan` ADD CONSTRAINT `persetujuan_wali_id_fkey` FOREIGN KEY (`wali_id`) REFERENCES `wali_keluarga`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
