-- CreateTable
CREATE TABLE `anamnesis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `versi` INTEGER NOT NULL,
    `keluhan_utama` TEXT NOT NULL,
    `penyerta` TEXT NULL,
    `riwayat_pribadi` TEXT NULL,
    `riwayat_keluarga` TEXT NULL,
    `alergi` TEXT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `anamnesis_kunjungan_id_versi_key`(`kunjungan_id`, `versi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `observasi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `kelompok` ENUM('tanda_vital', 'pemeriksaan') NOT NULL,
    `versi` INTEGER NOT NULL,
    `bidang` VARCHAR(50) NOT NULL,
    `kode_loinc` VARCHAR(20) NULL,
    `nilai` TEXT NOT NULL,
    `satuan_ucum` VARCHAR(30) NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `observasi_kunjungan_id_kelompok_versi_bidang_key`(`kunjungan_id`, `kelompok`, `versi`, `bidang`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diagnosis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `versi` INTEGER NOT NULL,
    `kode_icd10` VARCHAR(20) NOT NULL,
    `nama` VARCHAR(500) NOT NULL,
    `kode_snomed` VARCHAR(30) NULL,
    `peran` ENUM('utama', 'penyerta') NOT NULL,
    `urutan` INTEGER NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `diagnosis_fasyankes_id_kode_icd10_idx`(`fasyankes_id`, `kode_icd10`),
    UNIQUE INDEX `diagnosis_kunjungan_id_versi_urutan_key`(`kunjungan_id`, `versi`, `urutan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tindakan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `versi` INTEGER NOT NULL,
    `kode_icd9cm` VARCHAR(20) NOT NULL,
    `nama` VARCHAR(500) NOT NULL,
    `performer_id` INTEGER NULL,
    `mulai` DATETIME(3) NOT NULL,
    `selesai` DATETIME(3) NULL,
    `urutan` INTEGER NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tindakan_kunjungan_id_versi_urutan_key`(`kunjungan_id`, `versi`, `urutan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tindak_lanjut` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `versi` INTEGER NOT NULL,
    `jenis` ENUM('pulang', 'rujuk', 'rawat_inap') NOT NULL,
    `tujuan` VARCHAR(300) NULL,
    `spri` VARCHAR(100) NULL,
    `catatan` TEXT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tindak_lanjut_kunjungan_id_versi_key`(`kunjungan_id`, `versi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `versi_catatan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `entitas` VARCHAR(50) NOT NULL,
    `entitas_id` INTEGER NOT NULL,
    `versi` INTEGER NOT NULL,
    `isi_lama` JSON NOT NULL,
    `alasan` TEXT NOT NULL,
    `disetujui_oleh` INTEGER NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `versi_catatan_entitas_entitas_id_versi_key`(`entitas`, `entitas_id`, `versi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengesahan_catatan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `entitas` VARCHAR(50) NOT NULL,
    `entitas_id` INTEGER NOT NULL,
    `versi` INTEGER NOT NULL,
    `pengguna_id` INTEGER NOT NULL,
    `jenis_akun_id` INTEGER NULL,
    `jenis_akun_nama` VARCHAR(150) NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `hash` CHAR(64) NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pengesahan_catatan_pengguna_id_idx`(`pengguna_id`),
    UNIQUE INDEX `pengesahan_catatan_entitas_entitas_id_versi_key`(`entitas`, `entitas_id`, `versi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kode_terminologi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sistem` ENUM('icd10', 'icd9cm', 'loinc', 'snomed', 'ucum') NOT NULL,
    `kode` VARCHAR(40) NOT NULL,
    `nama` VARCHAR(500) NOT NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `contoh` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `kode_terminologi_sistem_kode_key`(`sistem`, `kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorit_dokter` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pengguna_id` INTEGER NOT NULL,
    `jenis` ENUM('diagnosis', 'tindakan', 'resep') NOT NULL,
    `kode` VARCHAR(50) NOT NULL,
    `nama` VARCHAR(255) NOT NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `favorit_dokter_pengguna_id_jenis_kode_key`(`pengguna_id`, `jenis`, `kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `templat_catatan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pengguna_id` INTEGER NOT NULL,
    `bagian` ENUM('anamnesis', 'pemeriksaan') NOT NULL,
    `nama` VARCHAR(100) NOT NULL,
    `isi` JSON NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `templat_catatan_pengguna_id_bagian_idx`(`pengguna_id`, `bagian`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `keluarga_pasien` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pasien_id` INTEGER NOT NULL,
    `anggota_pasien_id` INTEGER NOT NULL,
    `hubungan` VARCHAR(100) NOT NULL,
    `dibatasi` BOOLEAN NOT NULL DEFAULT false,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `keluarga_pasien_pasien_id_anggota_pasien_id_key`(`pasien_id`, `anggota_pasien_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `anamnesis` ADD CONSTRAINT `anamnesis_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `observasi` ADD CONSTRAINT `observasi_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diagnosis` ADD CONSTRAINT `diagnosis_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tindakan` ADD CONSTRAINT `tindakan_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tindak_lanjut` ADD CONSTRAINT `tindak_lanjut_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `keluarga_pasien` ADD CONSTRAINT `keluarga_pasien_pasien_id_fkey` FOREIGN KEY (`pasien_id`) REFERENCES `pasien`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `keluarga_pasien` ADD CONSTRAINT `keluarga_pasien_anggota_pasien_id_fkey` FOREIGN KEY (`anggota_pasien_id`) REFERENCES `pasien`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
