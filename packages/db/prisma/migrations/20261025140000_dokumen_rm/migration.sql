-- CreateTable
CREATE TABLE `resume_medis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `isi` JSON NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `diperbarui_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `resume_medis_kunjungan_id_key`(`kunjungan_id`),
    INDEX `resume_medis_fasyankes_id_idx`(`fasyankes_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `surat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `jenis` VARCHAR(30) NOT NULL,
    `nomor_surat` VARCHAR(40) NOT NULL,
    `tujuan` VARCHAR(200) NULL,
    `isi` TEXT NOT NULL,
    `dokter_id` INTEGER NOT NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `surat_kunjungan_id_idx`(`kunjungan_id`),
    UNIQUE INDEX `surat_fasyankes_id_nomor_surat_key`(`fasyankes_id`, `nomor_surat`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pembukaan_rm` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pasien_id` INTEGER NOT NULL,
    `pemohon_nama` VARCHAR(200) NOT NULL,
    `pemohon_instansi` VARCHAR(200) NULL,
    `dasar` ENUM('persetujuan', 'hukum') NOT NULL,
    `alasan_hukum` VARCHAR(50) NULL,
    `dasar_rinci` VARCHAR(500) NOT NULL,
    `cakupan` VARCHAR(500) NOT NULL,
    `identitas_disamarkan` BOOLEAN NOT NULL DEFAULT true,
    `status` ENUM('diajukan', 'disetujui', 'ditolak') NOT NULL DEFAULT 'diajukan',
    `penyetuju_id` INTEGER NULL,
    `catatan_keputusan` VARCHAR(500) NULL,
    `waktu_keputusan` DATETIME(3) NULL,
    `diminta_oleh` INTEGER NOT NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pembukaan_rm_fasyankes_id_status_idx`(`fasyankes_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `penyampaian_rm` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pasien_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NULL,
    `penerima_nama` VARCHAR(200) NOT NULL,
    `hubungan` VARCHAR(20) NOT NULL,
    `bentuk` ENUM('elektronik', 'cetak') NOT NULL,
    `bukti_persetujuan` VARCHAR(300) NULL,
    `catatan` VARCHAR(500) NULL,
    `petugas_id` INTEGER NOT NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `penyampaian_rm_fasyankes_id_waktu_idx`(`fasyankes_id`, `waktu`),
    INDEX `penyampaian_rm_pasien_id_idx`(`pasien_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

