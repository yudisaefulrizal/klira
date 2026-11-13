CREATE TABLE `fasyankes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `jenis` ENUM('klinik_pratama_rawat_jalan', 'klinik_pratama_rawat_inap') NOT NULL,
    `bentuk_usaha` VARCHAR(100) NULL,
    `kode_registrasi` VARCHAR(50) NULL,
    `organization_id` VARCHAR(100) NULL,
    `status_akreditasi` VARCHAR(100) NULL,
    `tanggal_akreditasi` DATE NULL,
    `puskesmas_wilayah` VARCHAR(200) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `fasyankes_fasyankes_id_key`(`fasyankes_id`),
    UNIQUE INDEX `fasyankes_kode_registrasi_key`(`kode_registrasi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

CREATE TABLE `profil_profesi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pengguna_id` INTEGER NOT NULL,
    `profesi` VARCHAR(100) NOT NULL,
    `nomor_sip` VARCHAR(100) NULL,
    `masa_berlaku_sip` DATE NULL,
    `ihs_practitioner_id` VARCHAR(100) NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `profil_profesi_pengguna_id_idx`(`pengguna_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pasien` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `nomor_rm` VARCHAR(50) NOT NULL,
    `nik` CHAR(16) NULL,
    `nama` VARCHAR(200) NOT NULL,
    `nomor_hp` VARCHAR(20) NULL,
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
    `asuransi_nama` VARCHAR(100) NULL,
    `asuransi_nomor_polis` VARCHAR(50) NULL,
    `status_identitas` ENUM('lengkap', 'sementara') NOT NULL DEFAULT 'lengkap',
    `jalur_identitas` VARCHAR(20) NOT NULL DEFAULT 'nik',
    `tidak_cakap` BOOLEAN NOT NULL DEFAULT false,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pasien_fasyankes_id_nama_idx`(`fasyankes_id`, `nama`),
    UNIQUE INDEX `pasien_fasyankes_id_nomor_rm_key`(`fasyankes_id`, `nomor_rm`),
    UNIQUE INDEX `pasien_fasyankes_id_nik_key`(`fasyankes_id`, `nik`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

CREATE TABLE `peringatan_izin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pengguna_id` INTEGER NOT NULL,
    `izin_id` INTEGER NULL,
    `penugasan_id` INTEGER NULL,
    `jenis_peringatan` VARCHAR(100) NOT NULL,
    `alasan_pimpinan` TEXT NOT NULL,
    `sumber` VARCHAR(20) NOT NULL DEFAULT 'pemberian',
    `diterima_untuk_akun` BOOLEAN NOT NULL DEFAULT false,
    `keterangan` VARCHAR(255) NULL,
    `ditetapkan_oleh` INTEGER NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `peringatan_izin_pengguna_id_idx`(`pengguna_id`),
    INDEX `peringatan_izin_pengguna_id_jenis_peringatan_idx`(`pengguna_id`, `jenis_peringatan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    INDEX `log_audit_fasyankes_id_waktu_idx`(`fasyankes_id`, `waktu`),
    INDEX `log_audit_aksi_waktu_idx`(`aksi`, `waktu`),
    INDEX `log_audit_entitas_entitas_id_idx`(`entitas`, `entitas_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pengaturan_keamanan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `masa_sesi_jam` INTEGER NOT NULL DEFAULT 12,
    `batas_percobaan_masuk` INTEGER NOT NULL DEFAULT 5,
    `panjang_minimum_kata_sandi` INTEGER NOT NULL DEFAULT 8,
    `diubah_oleh` INTEGER NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diubah_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `pengaturan_keamanan_fasyankes_id_key`(`fasyankes_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `riwayat_backup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(20) NOT NULL,
    `ukuran_byte` BIGINT NULL,
    `lokasi` VARCHAR(500) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `riwayat_backup_fasyankes_id_waktu_idx`(`fasyankes_id`, `waktu`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `jadwal_praktik` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pengguna_id` INTEGER NOT NULL,
    `lokasi_id` INTEGER NOT NULL,
    `hari` INTEGER NOT NULL,
    `jam_mulai` VARCHAR(5) NOT NULL,
    `jam_selesai` VARCHAR(5) NOT NULL,
    `kuota` INTEGER NOT NULL,
    `berlaku_dari` DATE NOT NULL,
    `berlaku_sampai` DATE NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `jadwal_praktik_fasyankes_id_idx`(`fasyankes_id`),
    INDEX `jadwal_praktik_pengguna_id_idx`(`pengguna_id`),
    INDEX `jadwal_praktik_lokasi_id_idx`(`lokasi_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `tarif_layanan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kode` VARCHAR(50) NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `jenis` ENUM('konsultasi', 'tindakan', 'lab', 'kamar', 'obat') NOT NULL,
    `harga_umum` INTEGER NULL,
    `harga_jkn` INTEGER NULL,
    `kode_icd9cm` VARCHAR(20) NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tarif_layanan_fasyankes_id_kode_key`(`fasyankes_id`, `kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `wilayah` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kode` VARCHAR(20) NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `tingkat` ENUM('provinsi', 'kabupaten_kota', 'kecamatan', 'kelurahan_desa') NOT NULL,
    `induk_kode` VARCHAR(20) NULL,
    `contoh` BOOLEAN NOT NULL DEFAULT false,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `wilayah_kode_key`(`kode`),
    INDEX `wilayah_induk_kode_idx`(`induk_kode`),
    INDEX `wilayah_tingkat_idx`(`tingkat`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `riwayat_profil` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `jenis` VARCHAR(20) NOT NULL,
    `pengguna_id` INTEGER NULL,
    `ringkasan` TEXT NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `riwayat_profil_fasyankes_id_dibuat_pada_idx`(`fasyankes_id`, `dibuat_pada`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `urutan_nomor_rm` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `terakhir` INTEGER NOT NULL DEFAULT 0,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `urutan_nomor_rm_fasyankes_id_key`(`fasyankes_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `kunjungan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pasien_id` INTEGER NOT NULL,
    `jenis` ENUM('AMB', 'IMP') NOT NULL,
    `status` ENUM('planned', 'arrived', 'in-progress', 'finished') NOT NULL DEFAULT 'arrived',
    `tahap_layanan` ENUM('menunggu_skrining', 'pemeriksaan', 'resep', 'kasir', 'ditutup') NOT NULL DEFAULT 'menunggu_skrining',
    `kunjungan_asal_id` INTEGER NULL,
    `lokasi_id` INTEGER NULL,
    `cara_pembayaran` ENUM('umum', 'jkn', 'asuransi') NOT NULL DEFAULT 'umum',
    `nomor_sep` VARCHAR(50) NULL,
    `spri` VARCHAR(100) NULL,
    `keluhan_singkat` VARCHAR(500) NULL,
    `service_type` VARCHAR(100) NULL,
    `encounter_id` VARCHAR(100) NULL,
    `mulai` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `selesai` DATETIME(3) NULL,
    `waktu_tutup` DATETIME(3) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diarsipkan_pada` DATETIME(3) NULL,
    `retensi_sampai` DATE NULL,

    INDEX `kunjungan_fasyankes_id_tahap_layanan_idx`(`fasyankes_id`, `tahap_layanan`),
    INDEX `kunjungan_pasien_id_idx`(`pasien_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    `kunjungan_id` INTEGER NULL,
    `tindakan_kode` VARCHAR(50) NULL,
    `tindakan_nama` VARCHAR(255) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `persetujuan_pasien_id_idx`(`pasien_id`),
    INDEX `persetujuan_kunjungan_id_idx`(`kunjungan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `anamnesis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `versi` INTEGER NOT NULL,
    `keluhan_utama` TEXT NOT NULL,
    `penyerta` TEXT NULL,
    `riwayat_sekarang` TEXT NULL,
    `riwayat_pribadi` TEXT NULL,
    `riwayat_keluarga` TEXT NULL,
    `kajian_sosial` TEXT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `anamnesis_kunjungan_id_versi_key`(`kunjungan_id`, `versi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `keperawatan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `versi` INTEGER NOT NULL,
    `kajian_keperawatan` TEXT NULL,
    `telah_diobati` TEXT NULL,
    `alergi` VARCHAR(500) NULL,
    `obat_dikonsumsi` TEXT NULL,
    `diagnosa_keperawatan` VARCHAR(500) NULL,
    `rencana_asuhan` TEXT NULL,
    `nyeri_jenis` ENUM('tidak', 'akut', 'kronis') NOT NULL DEFAULT 'tidak',
    `nyeri_skala` TINYINT NULL,
    `nyeri_lokasi` VARCHAR(200) NULL,
    `nyeri_durasi` VARCHAR(200) NULL,
    `nyeri_frekuensi` VARCHAR(200) NULL,
    `nyeri_hilang_bila` VARCHAR(200) NULL,
    `gizi_bb_turun` BOOLEAN NOT NULL DEFAULT false,
    `gizi_asupan_kurang` BOOLEAN NOT NULL DEFAULT false,
    `skrining_visual` ENUM('hijau', 'kuning', 'merah') NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `keperawatan_fasyankes_id_idx`(`fasyankes_id`),
    UNIQUE INDEX `keperawatan_kunjungan_id_versi_key`(`kunjungan_id`, `versi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

CREATE TABLE `tindakan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `versi` INTEGER NOT NULL,
    `kode_icd9cm` VARCHAR(20) NOT NULL,
    `nama` VARCHAR(500) NOT NULL,
    `tarif_layanan_id` INTEGER NULL,
    `jumlah` INTEGER NOT NULL DEFAULT 1,
    `performer_id` INTEGER NULL,
    `mulai` DATETIME(3) NOT NULL,
    `selesai` DATETIME(3) NULL,
    `urutan` INTEGER NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tindakan_kunjungan_id_versi_urutan_key`(`kunjungan_id`, `versi`, `urutan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

CREATE TABLE `draf` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `pengguna_id` INTEGER NOT NULL,
    `alur` VARCHAR(50) NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `pasien_id` INTEGER NOT NULL,
    `langkah_terakhir` INTEGER NOT NULL DEFAULT 0,
    `isi` JSON NOT NULL,
    `diperbarui_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `draf_kunjungan_id_idx`(`kunjungan_id`),
    UNIQUE INDEX `draf_pengguna_id_alur_kunjungan_id_key`(`pengguna_id`, `alur`, `kunjungan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

CREATE TABLE `master_pemeriksaan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kode` VARCHAR(50) NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `jenis` VARCHAR(20) NOT NULL DEFAULT 'lab',
    `kode_loinc` VARCHAR(30) NULL,
    `jenis_spesimen` VARCHAR(100) NULL,
    `satuan` VARCHAR(50) NULL,
    `rujukan_min` DOUBLE NULL,
    `rujukan_maks` DOUBLE NULL,
    `rujukan_teks` VARCHAR(200) NULL,
    `tarif_layanan_id` INTEGER NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diubah_pada` DATETIME(3) NULL,

    UNIQUE INDEX `master_pemeriksaan_fasyankes_id_kode_key`(`fasyankes_id`, `kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `order_penunjang` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `pasien_id` INTEGER NOT NULL,
    `jenis` VARCHAR(20) NOT NULL DEFAULT 'lab',
    `master_pemeriksaan_id` INTEGER NULL,
    `kode_loinc` VARCHAR(30) NULL,
    `nama` VARCHAR(200) NOT NULL,
    `prioritas` VARCHAR(20) NOT NULL DEFAULT 'rutin',
    `catatan` VARCHAR(500) NULL,
    `status` ENUM('dipesan', 'spesimen_diambil', 'menunggu_hasil', 'divalidasi') NOT NULL DEFAULT 'dipesan',
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `order_penunjang_fasyankes_id_status_idx`(`fasyankes_id`, `status`),
    INDEX `order_penunjang_kunjungan_id_idx`(`kunjungan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `spesimen` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `order_id` INTEGER NOT NULL,
    `asal` VARCHAR(100) NOT NULL,
    `waktu_ambil` DATETIME(3) NOT NULL,
    `petugas_id` INTEGER NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `spesimen_order_id_key`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `hasil_penunjang` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `order_id` INTEGER NOT NULL,
    `nilai` VARCHAR(200) NOT NULL,
    `satuan` VARCHAR(50) NULL,
    `rujukan_teks` VARCHAR(200) NULL,
    `interpretasi` VARCHAR(30) NOT NULL,
    `catatan` VARCHAR(1000) NULL,
    `dientri_oleh` INTEGER NOT NULL,
    `dientri_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `validator_id` INTEGER NULL,
    `divalidasi_pada` DATETIME(3) NULL,

    UNIQUE INDEX `hasil_penunjang_order_id_key`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `tagihan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `status_tagihan` ENUM('belum_lengkap', 'lengkap') NOT NULL DEFAULT 'belum_lengkap',
    `status_pembayaran` ENUM('belum', 'sebagian', 'lunas') NOT NULL DEFAULT 'belum',
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `alasan_tutup_belum_lunas` VARCHAR(300) NULL,

    UNIQUE INDEX `tagihan_kunjungan_id_key`(`kunjungan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `item_tagihan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `tagihan_id` INTEGER NOT NULL,
    `jenis` ENUM('konsultasi', 'tindakan', 'lab', 'kamar', 'obat') NOT NULL,
    `tarif_layanan_id` INTEGER NULL,
    `kode` VARCHAR(50) NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `jumlah` INTEGER NOT NULL DEFAULT 1,
    `harga` INTEGER NULL,
    `order_penunjang_id` INTEGER NULL,
    `item_resep_id` INTEGER NULL,
    `manual` BOOLEAN NOT NULL DEFAULT false,
    `tindakan_sumber` BOOLEAN NOT NULL DEFAULT false,
    `harga_acuan` INTEGER NULL,
    `alasan_ubah_harga` VARCHAR(300) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `item_tagihan_order_penunjang_id_key`(`order_penunjang_id`),
    UNIQUE INDEX `item_tagihan_item_resep_id_key`(`item_resep_id`),
    INDEX `item_tagihan_tagihan_id_idx`(`tagihan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `addendum` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `entitas` VARCHAR(50) NOT NULL,
    `entitas_id` INTEGER NOT NULL,
    `versi` INTEGER NOT NULL,
    `isi` JSON NOT NULL,
    `alasan` VARCHAR(500) NOT NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `perlu_kirim_ulang` BOOLEAN NOT NULL DEFAULT true,
    `dikirim_pada` DATETIME(3) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `addendum_kunjungan_id_idx`(`kunjungan_id`),
    UNIQUE INDEX `addendum_entitas_entitas_id_versi_key`(`entitas`, `entitas_id`, `versi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `kfa_lokal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kode` VARCHAR(30) NOT NULL,
    `nama` VARCHAR(700) NOT NULL,
    `bentuk_sediaan` VARCHAR(100) NULL,
    `satuan` VARCHAR(50) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'aktif',
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diubah_pada` DATETIME(3) NULL,

    UNIQUE INDEX `kfa_lokal_fasyankes_id_kode_key`(`fasyankes_id`, `kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `master_obat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kfa_kode` VARCHAR(30) NOT NULL,
    `kfa_nama` VARCHAR(700) NOT NULL,
    `bentuk_sediaan` VARCHAR(100) NULL,
    `rute` VARCHAR(50) NULL,
    `nama_tampil` VARCHAR(200) NOT NULL,
    `satuan` VARCHAR(50) NOT NULL,
    `harga` INTEGER NOT NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diubah_pada` DATETIME(3) NULL,

    INDEX `master_obat_fasyankes_id_idx`(`fasyankes_id`),
    UNIQUE INDEX `master_obat_fasyankes_id_kfa_kode_key`(`fasyankes_id`, `kfa_kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `resep` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `dpjp_id` INTEGER NOT NULL,
    `nomor_resep` VARCHAR(40) NOT NULL,
    `teks` TEXT NOT NULL,
    `jenis_pembiayaan` ENUM('umum', 'jkn', 'asuransi') NOT NULL DEFAULT 'umum',
    `status` ENUM('diajukan', 'ditelaah', 'siap', 'diserahkan') NOT NULL DEFAULT 'diajukan',
    `waktu_siap` DATETIME(3) NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `resep_kunjungan_id_idx`(`kunjungan_id`),
    INDEX `resep_fasyankes_id_status_idx`(`fasyankes_id`, `status`),
    UNIQUE INDEX `resep_fasyankes_id_nomor_resep_key`(`fasyankes_id`, `nomor_resep`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `item_resep` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `resep_id` INTEGER NOT NULL,
    `master_obat_id` INTEGER NOT NULL,
    `aturan_pakai` VARCHAR(200) NOT NULL,
    `bentuk` VARCHAR(50) NULL,
    `rute` VARCHAR(50) NULL,
    `jumlah` INTEGER NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `item_resep_resep_id_idx`(`resep_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `telaah_resep` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `resep_id` INTEGER NOT NULL,
    `apoteker_id` INTEGER NOT NULL,
    `administratif` BOOLEAN NOT NULL,
    `farmasetik` BOOLEAN NOT NULL,
    `klinis` BOOLEAN NOT NULL,
    `catatan` VARCHAR(1000) NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `telaah_resep_resep_id_key`(`resep_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `stok_obat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `master_obat_id` INTEGER NOT NULL,
    `batch` VARCHAR(60) NOT NULL,
    `kedaluwarsa` DATE NOT NULL,
    `jumlah` INTEGER NOT NULL DEFAULT 0,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diubah_pada` DATETIME(3) NULL,

    INDEX `stok_obat_fasyankes_id_idx`(`fasyankes_id`),
    UNIQUE INDEX `stok_obat_master_obat_id_batch_key`(`master_obat_id`, `batch`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `mutasi_stok` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `stok_id` INTEGER NOT NULL,
    `jenis` ENUM('terima', 'keluar', 'koreksi') NOT NULL,
    `jumlah` INTEGER NOT NULL,
    `alasan` VARCHAR(300) NULL,
    `pengguna_id` INTEGER NOT NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `mutasi_stok_stok_id_idx`(`stok_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `shift_kasir` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kasir_id` INTEGER NOT NULL,
    `buka` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tutup` DATETIME(3) NULL,
    `kas_awal` INTEGER NOT NULL,
    `kas_akhir` INTEGER NULL,
    `selisih` INTEGER NULL,
    `alasan_selisih` VARCHAR(300) NULL,

    INDEX `shift_kasir_fasyankes_id_kasir_id_idx`(`fasyankes_id`, `kasir_id`),
    INDEX `shift_kasir_fasyankes_id_buka_idx`(`fasyankes_id`, `buka`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pembayaran` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `tagihan_id` INTEGER NOT NULL,
    `shift_id` INTEGER NOT NULL,
    `metode` ENUM('tunai', 'transfer', 'qris') NOT NULL,
    `jumlah` INTEGER NOT NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `kasir_id` INTEGER NOT NULL,

    INDEX `pembayaran_tagihan_id_idx`(`tagihan_id`),
    INDEX `pembayaran_shift_id_idx`(`shift_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pengeluaran_obat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `resep_id` INTEGER NOT NULL,
    `item_resep_id` INTEGER NOT NULL,
    `master_obat_id` INTEGER NOT NULL,
    `jumlah` INTEGER NOT NULL,
    `harga` INTEGER NOT NULL,
    `stok_kurang` BOOLEAN NOT NULL DEFAULT false,
    `alasan` VARCHAR(300) NULL,
    `petugas_id` INTEGER NOT NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `pengeluaran_obat_item_resep_id_key`(`item_resep_id`),
    INDEX `pengeluaran_obat_resep_id_idx`(`resep_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `permintaan_perbaikan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `bagian` VARCHAR(30) NOT NULL,
    `isi_baru` JSON NOT NULL,
    `alasan` VARCHAR(500) NOT NULL,
    `pemohon_id` INTEGER NOT NULL,
    `status` ENUM('diajukan', 'disetujui', 'ditolak') NOT NULL DEFAULT 'diajukan',
    `penyetuju_id` INTEGER NULL,
    `catatan_keputusan` VARCHAR(500) NULL,
    `waktu_keputusan` DATETIME(3) NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `permintaan_perbaikan_fasyankes_id_status_idx`(`fasyankes_id`, `status`),
    INDEX `permintaan_perbaikan_kunjungan_id_idx`(`kunjungan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

CREATE TABLE `penempatan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `lokasi_id` INTEGER NOT NULL,
    `kelas` ENUM('satu', 'dua', 'tiga', 'vip', 'vvip') NOT NULL,
    `indikator` ENUM('kelas_tetap', 'naik_kelas', 'turun_kelas', 'titip_rawat') NOT NULL DEFAULT 'kelas_tetap',
    `tarif_id` INTEGER NULL,
    `mulai` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `selesai` DATETIME(3) NULL,
    `dibuat_oleh` INTEGER NULL,

    INDEX `penempatan_kunjungan_id_idx`(`kunjungan_id`),
    INDEX `penempatan_fasyankes_id_lokasi_id_selesai_idx`(`fasyankes_id`, `lokasi_id`, `selesai`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `catatan_harian` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `subjektif` TEXT NOT NULL,
    `objektif` TEXT NOT NULL,
    `asesmen` TEXT NOT NULL,
    `rencana` TEXT NOT NULL,
    `instruksi` TEXT NULL,
    `tanda_vital` JSON NULL,
    `dibuat_oleh` INTEGER NOT NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `catatan_harian_fasyankes_id_kunjungan_id_idx`(`fasyankes_id`, `kunjungan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pemulangan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `disposisi` ENUM('home', 'aadvice', 'other-hcf', 'exp-lt48h', 'exp-gt48h', 'oth') NOT NULL,
    `kondisi_pulang` VARCHAR(300) NOT NULL,
    `diagnosis_akhir` VARCHAR(500) NOT NULL,
    `ringkasan` TEXT NOT NULL,
    `tindak_lanjut` TEXT NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dibuat_oleh` INTEGER NOT NULL,

    UNIQUE INDEX `pemulangan_kunjungan_id_key`(`kunjungan_id`),
    INDEX `pemulangan_fasyankes_id_idx`(`fasyankes_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `klaim` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `nomor_sep` VARCHAR(50) NULL,
    `status` ENUM('menunggu_sep', 'siap_diajukan', 'diajukan', 'dikembalikan', 'diajukan_ulang', 'ditolak', 'dibayar', 'lewat_batas_waktu') NOT NULL,
    `tanggal_selesai` DATETIME(3) NOT NULL,
    `batas_pengajuan` DATETIME(3) NOT NULL,
    `diagnosis` JSON NOT NULL,
    `tindakan` JSON NOT NULL,
    `berkas` JSON NOT NULL,
    `catatan` VARCHAR(300) NULL,
    `diajukan_pada` DATETIME(3) NULL,
    `dikembalikan_pada` DATETIME(3) NULL,
    `berita_acara` TEXT NULL,
    `batas_ajukan_ulang` DATETIME(3) NULL,
    `alasan` VARCHAR(500) NULL,
    `jumlah_dibayar` INTEGER NULL,
    `dibayar_pada` DATETIME(3) NULL,
    `dibuat_oleh` INTEGER NOT NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diperbarui_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `klaim_kunjungan_id_key`(`kunjungan_id`),
    INDEX `klaim_fasyankes_id_status_idx`(`fasyankes_id`, `status`),
    INDEX `klaim_fasyankes_id_batas_pengajuan_idx`(`fasyankes_id`, `batas_pengajuan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `riwayat_klaim` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `klaim_id` INTEGER NOT NULL,
    `dari` ENUM('menunggu_sep', 'siap_diajukan', 'diajukan', 'dikembalikan', 'diajukan_ulang', 'ditolak', 'dibayar', 'lewat_batas_waktu') NULL,
    `ke` ENUM('menunggu_sep', 'siap_diajukan', 'diajukan', 'dikembalikan', 'diajukan_ulang', 'ditolak', 'dibayar', 'lewat_batas_waktu') NOT NULL,
    `alasan` VARCHAR(500) NULL,
    `oleh` INTEGER NOT NULL,
    `waktu` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `riwayat_klaim_klaim_id_idx`(`klaim_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

CREATE TABLE `insiden_pasien` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `insiden_id` INTEGER NOT NULL,
    `pasien_id` INTEGER NOT NULL,

    UNIQUE INDEX `insiden_pasien_insiden_id_pasien_id_key`(`insiden_id`, `pasien_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

CREATE TABLE `wa_koneksi` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `fasyankes_id` INTEGER NOT NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT false,
    `generasi` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(30) NOT NULL DEFAULT 'terputus',
    `nomor` VARCHAR(40) NULL,
    `qr` LONGTEXT NULL,
    `detak` DATETIME(3) NULL,
    `pemilik_engine` VARCHAR(36) NULL,
    `sewa_sampai` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `wa_auth` (
    `id` VARCHAR(200) NOT NULL,
    `isi` LONGTEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `wa_percakapan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `jid` VARCHAR(100) NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `foto_profil` TEXT NULL,
    `foto_periksa_setelah` DATETIME(3) NULL,
    `pasien_id` INTEGER NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'baru',
    `penanggung_jawab` INTEGER NULL,
    `diperbarui_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `wa_percakapan_fasyankes_id_diperbarui_pada_idx`(`fasyankes_id`, `diperbarui_pada`),
    UNIQUE INDEX `wa_percakapan_fasyankes_id_jid_key`(`fasyankes_id`, `jid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `wa_pesan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `percakapan_id` INTEGER NOT NULL,
    `wa_id` VARCHAR(200) NULL,
    `arah` VARCHAR(10) NOT NULL,
    `isi` LONGTEXT NOT NULL,
    `jenis` VARCHAR(20) NOT NULL DEFAULT 'text',
    `media_id` VARCHAR(36) NULL,
    `status` VARCHAR(20) NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `wa_pesan_wa_id_key`(`wa_id`),
    INDEX `wa_pesan_percakapan_id_id_idx`(`percakapan_id`, `id`),
    INDEX `wa_pesan_status_arah_idx`(`status`, `arah`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `wa_baca` (
    `percakapan_id` INTEGER NOT NULL,
    `pengguna_id` INTEGER NOT NULL,
    `pesan_id` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`percakapan_id`, `pengguna_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `wa_media` (
    `id` VARCHAR(36) NOT NULL,
    `fasyankes_id` INTEGER NOT NULL,
    `isi` LONGTEXT NOT NULL,
    `mime` VARCHAR(100) NOT NULL,
    `nama` VARCHAR(200) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `riwayat_tahap_layanan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `tahap` ENUM('menunggu_skrining', 'pemeriksaan', 'resep', 'kasir', 'ditutup') NOT NULL,
    `masuk` DATETIME(3) NOT NULL,
    `keluar` DATETIME(3) NULL,

    INDEX `riwayat_tahap_layanan_fasyankes_id_masuk_idx`(`fasyankes_id`, `masuk`),
    INDEX `riwayat_tahap_layanan_kunjungan_id_keluar_idx`(`kunjungan_id`, `keluar`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ig_koneksi` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `fasyankes_id` INTEGER NOT NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(30) NOT NULL DEFAULT 'terputus',
    `akun_id` VARCHAR(100) NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `api_key` LONGTEXT NULL,
    `webhook_secret` LONGTEXT NULL,
    `webhook_id` VARCHAR(100) NULL,
    `penyedia` VARCHAR(20) NOT NULL DEFAULT 'meta',
    `oauth_user_id` VARCHAR(100) NULL,
    `access_token` LONGTEXT NULL,
    `token_berakhir` DATETIME(3) NULL,
    `token_diperbarui` DATETIME(3) NULL,
    `generasi` INTEGER NOT NULL DEFAULT 0,
    `webhook_aktif` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ig_percakapan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `jid` VARCHAR(100) NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `foto_profil` TEXT NULL,
    `profil_diperbarui_pada` DATETIME(3) NULL,
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

CREATE TABLE `ig_event` (
    `id` VARCHAR(64) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

CREATE TABLE `ig_media_publik` (
    `token_hash` VARCHAR(64) NOT NULL,
    `media_id` VARCHAR(36) NOT NULL,
    `generasi` INTEGER NOT NULL,
    `berakhir` DATETIME(3) NOT NULL,

    INDEX `ig_media_publik_berakhir_idx`(`berakhir`),
    PRIMARY KEY (`token_hash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ig_penghapusan` (
    `kode` VARCHAR(64) NOT NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`kode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `event_panggilan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `poli_id` INTEGER NOT NULL,
    `poli_nama` VARCHAR(200) NOT NULL,
    `kode` VARCHAR(32) NOT NULL,
    `tanggal` DATE NOT NULL,
    `waktu_panggil` DATETIME(3) NOT NULL,

    INDEX `event_panggilan_fasyankes_id_tanggal_id_idx`(`fasyankes_id`, `tanggal`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `website_klinik` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT false,
    `slug` VARCHAR(100) NOT NULL,
    `domain` VARCHAR(253) NULL,
    `judul` VARCHAR(160) NOT NULL,
    `ringkasan` VARCHAR(500) NOT NULL,
    `tentang` TEXT NOT NULL,
    `alamat` VARCHAR(1000) NOT NULL,
    `whatsapp` VARCHAR(25) NOT NULL,
    `telepon` VARCHAR(40) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `jam_operasional` VARCHAR(500) NOT NULL,
    `warna_utama` VARCHAR(7) NOT NULL,
    `logo_url` VARCHAR(2000) NOT NULL,
    `hero_url` VARCHAR(2000) NOT NULL,
    `tampilkan_jadwal` BOOLEAN NOT NULL DEFAULT true,
    `tampilkan_nama_praktisi` BOOLEAN NOT NULL DEFAULT false,
    `diubah_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `website_klinik_fasyankes_id_key`(`fasyankes_id`),
    UNIQUE INDEX `website_klinik_slug_key`(`slug`),
    UNIQUE INDEX `website_klinik_domain_key`(`domain`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `narasi_klinis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `bagian` ENUM('diagnosis_banding', 'kie', 'obat_poli') NOT NULL,
    `isi` TEXT NULL,
    `versi` INTEGER NOT NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `narasi_klinis_fasyankes_id_kunjungan_id_idx`(`fasyankes_id`, `kunjungan_id`),
    UNIQUE INDEX `narasi_klinis_kunjungan_id_bagian_versi_key`(`kunjungan_id`, `bagian`, `versi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `kredensial_satusehat` ADD CONSTRAINT `kredensial_satusehat_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `lokasi` ADD CONSTRAINT `lokasi_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `lokasi` ADD CONSTRAINT `lokasi_induk_id_fkey` FOREIGN KEY (`induk_id`) REFERENCES `lokasi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `pengguna` ADD CONSTRAINT `pengguna_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `profil_profesi` ADD CONSTRAINT `profil_profesi_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `profil_profesi` ADD CONSTRAINT `profil_profesi_pengguna_id_fkey` FOREIGN KEY (`pengguna_id`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `pasien` ADD CONSTRAINT `pasien_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `wali_keluarga` ADD CONSTRAINT `wali_keluarga_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `wali_keluarga` ADD CONSTRAINT `wali_keluarga_pasien_id_fkey` FOREIGN KEY (`pasien_id`) REFERENCES `pasien`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `jenis_akun` ADD CONSTRAINT `jenis_akun_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `izin_jenis_akun` ADD CONSTRAINT `izin_jenis_akun_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `izin_jenis_akun` ADD CONSTRAINT `izin_jenis_akun_jenis_akun_id_fkey` FOREIGN KEY (`jenis_akun_id`) REFERENCES `jenis_akun`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `izin_jenis_akun` ADD CONSTRAINT `izin_jenis_akun_izin_id_fkey` FOREIGN KEY (`izin_id`) REFERENCES `izin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `riwayat_jenis_akun` ADD CONSTRAINT `riwayat_jenis_akun_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `riwayat_jenis_akun` ADD CONSTRAINT `riwayat_jenis_akun_jenis_akun_id_fkey` FOREIGN KEY (`jenis_akun_id`) REFERENCES `jenis_akun`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `penugasan_jenis` ADD CONSTRAINT `penugasan_jenis_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `penugasan_jenis` ADD CONSTRAINT `penugasan_jenis_pengguna_id_fkey` FOREIGN KEY (`pengguna_id`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `penugasan_jenis` ADD CONSTRAINT `penugasan_jenis_jenis_akun_id_fkey` FOREIGN KEY (`jenis_akun_id`) REFERENCES `jenis_akun`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `izin_per_akun` ADD CONSTRAINT `izin_per_akun_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `izin_per_akun` ADD CONSTRAINT `izin_per_akun_pengguna_id_fkey` FOREIGN KEY (`pengguna_id`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `izin_per_akun` ADD CONSTRAINT `izin_per_akun_izin_id_fkey` FOREIGN KEY (`izin_id`) REFERENCES `izin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `peringatan_izin` ADD CONSTRAINT `peringatan_izin_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `peringatan_izin` ADD CONSTRAINT `peringatan_izin_pengguna_id_fkey` FOREIGN KEY (`pengguna_id`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `peringatan_izin` ADD CONSTRAINT `peringatan_izin_izin_id_fkey` FOREIGN KEY (`izin_id`) REFERENCES `izin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `peringatan_izin` ADD CONSTRAINT `peringatan_izin_penugasan_id_fkey` FOREIGN KEY (`penugasan_id`) REFERENCES `penugasan_jenis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sesi` ADD CONSTRAINT `sesi_pengguna_id_fkey` FOREIGN KEY (`pengguna_id`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `pengaturan_keamanan` ADD CONSTRAINT `pengaturan_keamanan_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `riwayat_backup` ADD CONSTRAINT `riwayat_backup_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `jadwal_praktik` ADD CONSTRAINT `jadwal_praktik_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `jadwal_praktik` ADD CONSTRAINT `jadwal_praktik_pengguna_id_fkey` FOREIGN KEY (`pengguna_id`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `jadwal_praktik` ADD CONSTRAINT `jadwal_praktik_lokasi_id_fkey` FOREIGN KEY (`lokasi_id`) REFERENCES `lokasi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `tarif_layanan` ADD CONSTRAINT `tarif_layanan_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `riwayat_profil` ADD CONSTRAINT `riwayat_profil_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `urutan_nomor_rm` ADD CONSTRAINT `urutan_nomor_rm_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `kunjungan` ADD CONSTRAINT `kunjungan_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `kunjungan` ADD CONSTRAINT `kunjungan_pasien_id_fkey` FOREIGN KEY (`pasien_id`) REFERENCES `pasien`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `kunjungan` ADD CONSTRAINT `kunjungan_kunjungan_asal_id_fkey` FOREIGN KEY (`kunjungan_asal_id`) REFERENCES `kunjungan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `peserta_kunjungan` ADD CONSTRAINT `peserta_kunjungan_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `peserta_kunjungan` ADD CONSTRAINT `peserta_kunjungan_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `antrean` ADD CONSTRAINT `antrean_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `antrean` ADD CONSTRAINT `antrean_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `persetujuan` ADD CONSTRAINT `persetujuan_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `persetujuan` ADD CONSTRAINT `persetujuan_pasien_id_fkey` FOREIGN KEY (`pasien_id`) REFERENCES `pasien`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `persetujuan` ADD CONSTRAINT `persetujuan_teks_persetujuan_id_fkey` FOREIGN KEY (`teks_persetujuan_id`) REFERENCES `teks_persetujuan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `persetujuan` ADD CONSTRAINT `persetujuan_wali_id_fkey` FOREIGN KEY (`wali_id`) REFERENCES `wali_keluarga`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `anamnesis` ADD CONSTRAINT `anamnesis_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `keperawatan` ADD CONSTRAINT `keperawatan_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `observasi` ADD CONSTRAINT `observasi_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `diagnosis` ADD CONSTRAINT `diagnosis_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `tindakan` ADD CONSTRAINT `tindakan_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `tindak_lanjut` ADD CONSTRAINT `tindak_lanjut_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `keluarga_pasien` ADD CONSTRAINT `keluarga_pasien_pasien_id_fkey` FOREIGN KEY (`pasien_id`) REFERENCES `pasien`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `keluarga_pasien` ADD CONSTRAINT `keluarga_pasien_anggota_pasien_id_fkey` FOREIGN KEY (`anggota_pasien_id`) REFERENCES `pasien`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `order_penunjang` ADD CONSTRAINT `order_penunjang_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `order_penunjang` ADD CONSTRAINT `order_penunjang_master_pemeriksaan_id_fkey` FOREIGN KEY (`master_pemeriksaan_id`) REFERENCES `master_pemeriksaan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `spesimen` ADD CONSTRAINT `spesimen_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `order_penunjang`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `hasil_penunjang` ADD CONSTRAINT `hasil_penunjang_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `order_penunjang`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `tagihan` ADD CONSTRAINT `tagihan_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `item_tagihan` ADD CONSTRAINT `item_tagihan_tagihan_id_fkey` FOREIGN KEY (`tagihan_id`) REFERENCES `tagihan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `resep` ADD CONSTRAINT `resep_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `item_resep` ADD CONSTRAINT `item_resep_resep_id_fkey` FOREIGN KEY (`resep_id`) REFERENCES `resep`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `item_resep` ADD CONSTRAINT `item_resep_master_obat_id_fkey` FOREIGN KEY (`master_obat_id`) REFERENCES `master_obat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `telaah_resep` ADD CONSTRAINT `telaah_resep_resep_id_fkey` FOREIGN KEY (`resep_id`) REFERENCES `resep`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `stok_obat` ADD CONSTRAINT `stok_obat_master_obat_id_fkey` FOREIGN KEY (`master_obat_id`) REFERENCES `master_obat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `mutasi_stok` ADD CONSTRAINT `mutasi_stok_stok_id_fkey` FOREIGN KEY (`stok_id`) REFERENCES `stok_obat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `pembayaran` ADD CONSTRAINT `pembayaran_tagihan_id_fkey` FOREIGN KEY (`tagihan_id`) REFERENCES `tagihan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `pembayaran` ADD CONSTRAINT `pembayaran_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `shift_kasir`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `wa_pesan` ADD CONSTRAINT `wa_pesan_percakapan_id_fkey` FOREIGN KEY (`percakapan_id`) REFERENCES `wa_percakapan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `wa_baca` ADD CONSTRAINT `wa_baca_percakapan_id_fkey` FOREIGN KEY (`percakapan_id`) REFERENCES `wa_percakapan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ig_pesan` ADD CONSTRAINT `ig_pesan_percakapan_id_fkey` FOREIGN KEY (`percakapan_id`) REFERENCES `ig_percakapan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ig_baca` ADD CONSTRAINT `ig_baca_percakapan_id_fkey` FOREIGN KEY (`percakapan_id`) REFERENCES `ig_percakapan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `event_panggilan` ADD CONSTRAINT `event_panggilan_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `website_klinik` ADD CONSTRAINT `website_klinik_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `narasi_klinis` ADD CONSTRAINT `narasi_klinis_kunjungan_id_fkey` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TRIGGER `kunjungan_catat_tahap_awal` AFTER INSERT ON `kunjungan`
FOR EACH ROW INSERT INTO `riwayat_tahap_layanan` (`fasyankes_id`,`kunjungan_id`,`tahap`,`masuk`)
VALUES (NEW.fasyankes_id,NEW.id,NEW.tahap_layanan,UTC_TIMESTAMP(3));

DELIMITER $$
CREATE TRIGGER `kunjungan_catat_perpindahan` AFTER UPDATE ON `kunjungan`
FOR EACH ROW BEGIN
 IF OLD.tahap_layanan <> NEW.tahap_layanan THEN
  UPDATE `riwayat_tahap_layanan` SET `keluar` = UTC_TIMESTAMP(3)
   WHERE `kunjungan_id` = NEW.id AND `keluar` IS NULL;
  INSERT INTO `riwayat_tahap_layanan` (`fasyankes_id`,`kunjungan_id`,`tahap`,`masuk`)
   VALUES (NEW.fasyankes_id,NEW.id,NEW.tahap_layanan,UTC_TIMESTAMP(3));
 END IF;
END$$
DELIMITER ;
