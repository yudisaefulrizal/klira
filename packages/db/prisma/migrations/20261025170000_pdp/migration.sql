-- CreateTable
CREATE TABLE `permintaan_hak` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pasien_id` INTEGER NOT NULL,
    `jenis` ENUM('akses', 'salinan', 'koreksi', 'hapus', 'batasi', 'ekspor', 'keberatan') NOT NULL,
    `saluran` ENUM('langsung', 'surat', 'elektronik', 'telepon') NOT NULL,
    `pemohon_nama` VARCHAR(200) NOT NULL,
    `pemohon_hubungan` VARCHAR(20) NOT NULL,
    `verifikasi` VARCHAR(300) NOT NULL,
    `rincian` VARCHAR(1000) NULL,
    `diterima_pada` DATETIME(3) NOT NULL,
    `batas_waktu` DATETIME(3) NOT NULL,
    `status` ENUM('diterima', 'disetujui', 'ditolak', 'dilaksanakan', 'selesai') NOT NULL DEFAULT 'diterima',
    `keputusan_oleh` INTEGER NULL,
    `waktu_keputusan` DATETIME(3) NULL,
    `alasan_keputusan` VARCHAR(500) NULL,
    `pelaksanaan` VARCHAR(1000) NULL,
    `pelaksana_id` INTEGER NULL,
    `waktu_pelaksanaan` DATETIME(3) NULL,
    `notifikasi_pada` DATETIME(3) NULL,
    `notifikasi_oleh` INTEGER NULL,
    `catatan_notifikasi` VARCHAR(300) NULL,
    `dibuat_oleh` INTEGER NOT NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `permintaan_hak_fasyankes_id_status_idx`(`fasyankes_id`, `status`),
    INDEX `permintaan_hak_pasien_id_idx`(`pasien_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `penarikan_persetujuan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `persetujuan_id` INTEGER NOT NULL,
    `alasan` VARCHAR(500) NOT NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `batas_henti` DATETIME(3) NOT NULL,
    `dicatat_oleh` INTEGER NOT NULL,

    UNIQUE INDEX `penarikan_persetujuan_persetujuan_id_key`(`persetujuan_id`),
    INDEX `penarikan_persetujuan_fasyankes_id_idx`(`fasyankes_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ropa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `nama_kegiatan` VARCHAR(200) NOT NULL,
    `ppdp_nama` VARCHAR(200) NULL,
    `sumber_tujuan` VARCHAR(500) NOT NULL,
    `dasar` VARCHAR(40) NOT NULL,
    `tujuan` VARCHAR(500) NOT NULL,
    `jenis_data` VARCHAR(500) NOT NULL,
    `kategori_subjek` VARCHAR(300) NOT NULL,
    `pihak_akses` VARCHAR(500) NOT NULL,
    `pemenuhan_hak` VARCHAR(500) NOT NULL,
    `aliran` VARCHAR(500) NOT NULL,
    `masa_retensi` VARCHAR(200) NOT NULL,
    `pengamanan` VARCHAR(500) NOT NULL,
    `transfer` VARCHAR(300) NOT NULL,
    `dibuat_oleh` INTEGER NOT NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diperbarui_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ropa_fasyankes_id_idx`(`fasyankes_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dpia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pemrosesan` VARCHAR(200) NOT NULL,
    `ropa_id` INTEGER NULL,
    `risiko` TEXT NOT NULL,
    `mitigasi` TEXT NOT NULL,
    `saran_ppdp` TEXT NULL,
    `tinjau_ulang_pada` DATE NOT NULL,
    `ditinjau_pada` DATETIME(3) NULL,
    `dibuat_oleh` INTEGER NOT NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diperbarui_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `dpia_fasyankes_id_idx`(`fasyankes_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `insiden_data` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `waktu_kejadian` DATETIME(3) NULL,
    `waktu_diketahui` DATETIME(3) NOT NULL,
    `siber` BOOLEAN NOT NULL DEFAULT false,
    `uraian` TEXT NOT NULL,
    `data_terungkap` VARCHAR(1000) NOT NULL,
    `penanganan` TEXT NULL,
    `pemulihan` TEXT NULL,
    `kontak_ppdp` VARCHAR(200) NULL,
    `batas_notifikasi` DATETIME(3) NOT NULL,
    `notifikasi_pasien_pada` DATETIME(3) NULL,
    `notifikasi_lembaga_pada` DATETIME(3) NULL,
    `dibuat_oleh` INTEGER NOT NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diperbarui_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `insiden_data_fasyankes_id_waktu_diketahui_idx`(`fasyankes_id`, `waktu_diketahui`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `insiden_pasien` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `insiden_id` INTEGER NOT NULL,
    `pasien_id` INTEGER NOT NULL,

    UNIQUE INDEX `insiden_pasien_insiden_id_pasien_id_key`(`insiden_id`, `pasien_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kebijakan_retensi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `jenis_data` VARCHAR(200) NOT NULL,
    `periode_tahun` INTEGER NOT NULL,
    `dasar_hukum` VARCHAR(300) NOT NULL,
    `metode_musnah` VARCHAR(300) NOT NULL,
    `penanggung_jawab` VARCHAR(200) NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `kebijakan_retensi_fasyankes_id_idx`(`fasyankes_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pemusnahan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `cakupan` VARCHAR(500) NOT NULL,
    `dasar` VARCHAR(30) NOT NULL,
    `permintaan_hak_id` INTEGER NULL,
    `pasien_id` INTEGER NULL,
    `jadwal` DATE NOT NULL,
    `status` ENUM('direncanakan', 'diperintahkan', 'dilaksanakan', 'selesai') NOT NULL DEFAULT 'direncanakan',
    `prosesor_id` INTEGER NULL,
    `nomor_perintah` VARCHAR(100) NULL,
    `perintah_pada` DATETIME(3) NULL,
    `pelaksana` VARCHAR(200) NULL,
    `metode` VARCHAR(300) NULL,
    `mencakup_cadangan` BOOLEAN NOT NULL DEFAULT false,
    `pelaksanaan_pada` DATETIME(3) NULL,
    `berita_acara` TEXT NULL,
    `berita_acara_pada` DATETIME(3) NULL,
    `dibuat_oleh` INTEGER NOT NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pemusnahan_fasyankes_id_status_idx`(`fasyankes_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prosesor_data` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `layanan` VARCHAR(300) NOT NULL,
    `lokasi_data` VARCHAR(200) NOT NULL,
    `nomor_perjanjian` VARCHAR(100) NULL,
    `butir_perjanjian` JSON NOT NULL,
    `sub_prosesor` JSON NOT NULL,
    `sla_lapor_jam` INTEGER NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `dibuat_oleh` INTEGER NOT NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diperbarui_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `prosesor_data_fasyankes_id_idx`(`fasyankes_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

