-- CreateTable
CREATE TABLE `fasyankes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `jenis` ENUM('klinik_pratama_rawat_jalan', 'klinik_pratama_rawat_inap') NOT NULL,
    `bentuk_usaha` VARCHAR(100) NULL,
    `kode_registrasi` VARCHAR(50) NULL,
    `organization_id` VARCHAR(100) NULL,
    `status_akreditasi` VARCHAR(100) NULL,
    `puskesmas_wilayah` VARCHAR(200) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `fasyankes_fasyankes_id_key`(`fasyankes_id`),
    UNIQUE INDEX `fasyankes_kode_registrasi_key`(`kode_registrasi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kredensial_satusehat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `environment` ENUM('sandbox', 'produksi') NOT NULL,
    `client_id` VARCHAR(200) NOT NULL,
    `client_secret_terenkripsi` TEXT NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `kredensial_satusehat_fasyankes_id_environment_key`(`fasyankes_id`, `environment`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lokasi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `jenis` ENUM('poli', 'ruang', 'bed') NOT NULL,
    `induk_id` INTEGER NULL,
    `status_operasional` ENUM('U', 'O') NOT NULL DEFAULT 'O',
    `ihs_location_id` VARCHAR(100) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lokasi_fasyankes_id_idx`(`fasyankes_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengguna` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `nik` CHAR(16) NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `kata_sandi_hash` VARCHAR(255) NOT NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `wajib_ganti_kredensial` BOOLEAN NOT NULL DEFAULT true,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `pengguna_fasyankes_id_username_key`(`fasyankes_id`, `username`),
    UNIQUE INDEX `pengguna_fasyankes_id_nik_key`(`fasyankes_id`, `nik`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profil_profesi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pengguna_id` INTEGER NOT NULL,
    `profesi` VARCHAR(100) NOT NULL,
    `nomor_sip` VARCHAR(100) NULL,
    `masa_berlaku_sip` DATE NULL,
    `ihs_practitioner_id` VARCHAR(100) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `profil_profesi_pengguna_id_idx`(`pengguna_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pasien` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `nomor_rm` VARCHAR(50) NOT NULL,
    `nik` CHAR(16) NULL,
    `nama` VARCHAR(200) NOT NULL,
    `ibu_kandung` VARCHAR(200) NULL,
    `tempat_lahir` VARCHAR(100) NULL,
    `tanggal_lahir` DATE NOT NULL,
    `jenis_kelamin` ENUM('laki_laki', 'perempuan') NOT NULL,
    `agama` VARCHAR(50) NULL,
    `suku` VARCHAR(100) NULL,
    `bahasa` VARCHAR(100) NULL,
    `pekerjaan` VARCHAR(100) NULL,
    `pendidikan` VARCHAR(100) NULL,
    `status_kawin` VARCHAR(50) NULL,
    `alamat` TEXT NULL,
    `kode_wilayah` VARCHAR(20) NULL,
    `nomor_paspor` VARCHAR(50) NULL,
    `nomor_kitas` VARCHAR(50) NULL,
    `ihs_number` VARCHAR(100) NULL,
    `jkn_nomor_kartu` VARCHAR(50) NULL,
    `jkn_kelas_hak` VARCHAR(20) NULL,
    `jkn_fktp_terdaftar` VARCHAR(200) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `pasien_fasyankes_id_nomor_rm_key`(`fasyankes_id`, `nomor_rm`),
    UNIQUE INDEX `pasien_fasyankes_id_nik_key`(`fasyankes_id`, `nik`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wali_keluarga` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pasien_id` INTEGER NOT NULL,
    `hubungan` VARCHAR(100) NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `kontak` VARCHAR(100) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `wali_keluarga_pasien_id_idx`(`pasien_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jenis_akun` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `syarat_profesi` VARCHAR(200) NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `diubah_oleh` INTEGER NULL,
    `alasan_perubahan` TEXT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `jenis_akun_fasyankes_id_nama_key`(`fasyankes_id`, `nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `izin_jenis_akun` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `jenis_akun_id` INTEGER NOT NULL,
    `izin_id` INTEGER NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `izin_jenis_akun_jenis_akun_id_izin_id_key`(`jenis_akun_id`, `izin_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `riwayat_jenis_akun` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `jenis_akun_id` INTEGER NOT NULL,
    `ringkasan` TEXT NOT NULL,
    `alasan` TEXT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `riwayat_jenis_akun_jenis_akun_id_idx`(`jenis_akun_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `izin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NULL,
    `fitur` VARCHAR(100) NOT NULL,
    `aksi` ENUM('input', 'perbaikan', 'lihat') NOT NULL,
    `cakupan` ENUM('unit', 'layanan') NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `izin_fitur_aksi_cakupan_key`(`fitur`, `aksi`, `cakupan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `penugasan_jenis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pengguna_id` INTEGER NOT NULL,
    `jenis_akun_id` INTEGER NOT NULL,
    `mulai` DATETIME(3) NOT NULL,
    `selesai` DATETIME(3) NULL,
    `ditetapkan_oleh` INTEGER NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `penugasan_jenis_pengguna_id_idx`(`pengguna_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `izin_per_akun` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pengguna_id` INTEGER NOT NULL,
    `izin_id` INTEGER NOT NULL,
    `tipe` ENUM('tambah', 'kurang') NOT NULL,
    `alasan` TEXT NOT NULL,
    `mulai` DATETIME(3) NOT NULL,
    `selesai` DATETIME(3) NULL,
    `ditetapkan_oleh` INTEGER NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `izin_per_akun_pengguna_id_idx`(`pengguna_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `peringatan_izin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pengguna_id` INTEGER NOT NULL,
    `izin_id` INTEGER NULL,
    `penugasan_id` INTEGER NULL,
    `jenis_peringatan` VARCHAR(100) NOT NULL,
    `alasan_pimpinan` TEXT NOT NULL,
    `ditetapkan_oleh` INTEGER NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `peringatan_izin_pengguna_id_idx`(`pengguna_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `kredensial_satusehat` ADD CONSTRAINT `kredensial_satusehat_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lokasi` ADD CONSTRAINT `lokasi_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lokasi` ADD CONSTRAINT `lokasi_induk_id_fkey` FOREIGN KEY (`induk_id`) REFERENCES `lokasi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengguna` ADD CONSTRAINT `pengguna_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profil_profesi` ADD CONSTRAINT `profil_profesi_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profil_profesi` ADD CONSTRAINT `profil_profesi_pengguna_id_fkey` FOREIGN KEY (`pengguna_id`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pasien` ADD CONSTRAINT `pasien_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wali_keluarga` ADD CONSTRAINT `wali_keluarga_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wali_keluarga` ADD CONSTRAINT `wali_keluarga_pasien_id_fkey` FOREIGN KEY (`pasien_id`) REFERENCES `pasien`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jenis_akun` ADD CONSTRAINT `jenis_akun_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `izin_jenis_akun` ADD CONSTRAINT `izin_jenis_akun_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `izin_jenis_akun` ADD CONSTRAINT `izin_jenis_akun_jenis_akun_id_fkey` FOREIGN KEY (`jenis_akun_id`) REFERENCES `jenis_akun`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `izin_jenis_akun` ADD CONSTRAINT `izin_jenis_akun_izin_id_fkey` FOREIGN KEY (`izin_id`) REFERENCES `izin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat_jenis_akun` ADD CONSTRAINT `riwayat_jenis_akun_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat_jenis_akun` ADD CONSTRAINT `riwayat_jenis_akun_jenis_akun_id_fkey` FOREIGN KEY (`jenis_akun_id`) REFERENCES `jenis_akun`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penugasan_jenis` ADD CONSTRAINT `penugasan_jenis_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penugasan_jenis` ADD CONSTRAINT `penugasan_jenis_pengguna_id_fkey` FOREIGN KEY (`pengguna_id`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penugasan_jenis` ADD CONSTRAINT `penugasan_jenis_jenis_akun_id_fkey` FOREIGN KEY (`jenis_akun_id`) REFERENCES `jenis_akun`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `izin_per_akun` ADD CONSTRAINT `izin_per_akun_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `izin_per_akun` ADD CONSTRAINT `izin_per_akun_pengguna_id_fkey` FOREIGN KEY (`pengguna_id`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `izin_per_akun` ADD CONSTRAINT `izin_per_akun_izin_id_fkey` FOREIGN KEY (`izin_id`) REFERENCES `izin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peringatan_izin` ADD CONSTRAINT `peringatan_izin_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peringatan_izin` ADD CONSTRAINT `peringatan_izin_pengguna_id_fkey` FOREIGN KEY (`pengguna_id`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peringatan_izin` ADD CONSTRAINT `peringatan_izin_izin_id_fkey` FOREIGN KEY (`izin_id`) REFERENCES `izin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peringatan_izin` ADD CONSTRAINT `peringatan_izin_penugasan_id_fkey` FOREIGN KEY (`penugasan_id`) REFERENCES `penugasan_jenis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
