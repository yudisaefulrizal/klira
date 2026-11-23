-- Menggabungkan anamnesis, keperawatan, catatan_harian, tanda_vital (observasi), dan SOAPIE (narasi_klinis) ke satu tabel `pemeriksaan`.
CREATE TABLE `pemeriksaan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fasyankes_id` INTEGER NOT NULL,
    `kunjungan_id` INTEGER NOT NULL,
    `jenis` ENUM('ralan', 'cppt') NOT NULL DEFAULT 'ralan',
    `bagian` VARCHAR(30) NULL,
    `versi` INTEGER NOT NULL DEFAULT 1,
    `suhu` DECIMAL(4, 1) NULL,
    `tensi_sistol` SMALLINT NULL,
    `tensi_diastol` SMALLINT NULL,
    `nadi` SMALLINT NULL,
    `respirasi` SMALLINT NULL,
    `tinggi` DECIMAL(5, 1) NULL,
    `berat` DECIMAL(5, 2) NULL,
    `lingkar_perut` DECIMAL(5, 1) NULL,
    `spo2` TINYINT NULL,
    `gcs` TINYINT NULL,
    `kesadaran` ENUM('compos_mentis', 'apatis', 'somnolen', 'sopor', 'koma') NULL,
    `alergi` VARCHAR(500) NULL,
    `subjek` TEXT NULL,
    `objek` TEXT NULL,
    `asesmen` TEXT NULL,
    `plan` TEXT NULL,
    `instruksi` TEXT NULL,
    `evaluasi` TEXT NULL,
    `keluhan_utama` TEXT NULL,
    `penyerta` TEXT NULL,
    `riwayat_sekarang` TEXT NULL,
    `riwayat_pribadi` TEXT NULL,
    `riwayat_keluarga` TEXT NULL,
    `kajian_sosial` TEXT NULL,
    `telah_diobati` TEXT NULL,
    `obat_dikonsumsi` TEXT NULL,
    `kajian_keperawatan` TEXT NULL,
    `diagnosa_keperawatan` VARCHAR(500) NULL,
    `rencana_asuhan` TEXT NULL,
    `nyeri_jenis` ENUM('tidak', 'akut', 'kronis') NULL,
    `nyeri_skala` TINYINT NULL,
    `nyeri_lokasi` VARCHAR(200) NULL,
    `nyeri_durasi` VARCHAR(200) NULL,
    `nyeri_frekuensi` VARCHAR(200) NULL,
    `nyeri_hilang_bila` VARCHAR(200) NULL,
    `gizi_bb_turun` BOOLEAN NULL,
    `gizi_asupan_kurang` BOOLEAN NULL,
    `dibuat_oleh` INTEGER NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pemeriksaan_kunjungan_jenis_bagian_versi_idx`(`kunjungan_id`, `jenis`, `bagian`, `versi`),
    INDEX `pemeriksaan_fasyankes_kunjungan_idx`(`fasyankes_id`, `kunjungan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Migrasi data anamnesis -> pemeriksaan
INSERT INTO `pemeriksaan` (
    `fasyankes_id`, `kunjungan_id`, `jenis`, `bagian`, `versi`,
    `keluhan_utama`, `penyerta`, `riwayat_sekarang`, `riwayat_pribadi`, `riwayat_keluarga`, `kajian_sosial`,
    `dibuat_oleh`, `dibuat_pada`
)
SELECT
    `fasyankes_id`, `kunjungan_id`, 'ralan', 'anamnesis', `versi`,
    `keluhan_utama`, `penyerta`, `riwayat_sekarang`, `riwayat_pribadi`, `riwayat_keluarga`, `kajian_sosial`,
    `dibuat_oleh`, `dibuat_pada`
FROM `anamnesis`;

-- Migrasi data keperawatan -> pemeriksaan
INSERT INTO `pemeriksaan` (
    `fasyankes_id`, `kunjungan_id`, `jenis`, `bagian`, `versi`,
    `kajian_keperawatan`, `telah_diobati`, `alergi`, `obat_dikonsumsi`,
    `diagnosa_keperawatan`, `rencana_asuhan`,
    `nyeri_jenis`, `nyeri_skala`, `nyeri_lokasi`, `nyeri_durasi`, `nyeri_frekuensi`, `nyeri_hilang_bila`,
    `gizi_bb_turun`, `gizi_asupan_kurang`, `dibuat_oleh`, `dibuat_pada`
)
SELECT
    `fasyankes_id`, `kunjungan_id`, 'ralan', 'keperawatan', `versi`,
    `kajian_keperawatan`, `telah_diobati`, `alergi`, `obat_dikonsumsi`,
    `diagnosa_keperawatan`, `rencana_asuhan`,
    `nyeri_jenis`, `nyeri_skala`, `nyeri_lokasi`, `nyeri_durasi`, `nyeri_frekuensi`, `nyeri_hilang_bila`,
    `gizi_bb_turun`, `gizi_asupan_kurang`, `dibuat_oleh`, `dibuat_pada`
FROM `keperawatan`;

-- Migrasi data tanda_vital dari observasi -> pemeriksaan
INSERT INTO `pemeriksaan` (
    `fasyankes_id`, `kunjungan_id`, `jenis`, `bagian`, `versi`,
    `suhu`, `tensi_sistol`, `tensi_diastol`, `nadi`, `respirasi`,
    `tinggi`, `berat`, `lingkar_perut`, `spo2`, `gcs`, `kesadaran`,
    `dibuat_oleh`, `dibuat_pada`
)
SELECT
    `fasyankes_id`, `kunjungan_id`, 'ralan', 'tanda_vital', `versi`,
    MAX(CASE WHEN `bidang` = 'suhu' THEN CAST(`nilai` AS DECIMAL(4,1)) END),
    MAX(CASE WHEN `bidang` = 'sistolik' THEN CAST(`nilai` AS SIGNED) END),
    MAX(CASE WHEN `bidang` = 'diastolik' THEN CAST(`nilai` AS SIGNED) END),
    MAX(CASE WHEN `bidang` = 'nadi' THEN CAST(`nilai` AS SIGNED) END),
    MAX(CASE WHEN `bidang` = 'respirasi' THEN CAST(`nilai` AS SIGNED) END),
    MAX(CASE WHEN `bidang` = 'tinggi_badan' THEN CAST(`nilai` AS DECIMAL(5,1)) END),
    MAX(CASE WHEN `bidang` = 'berat_badan' THEN CAST(`nilai` AS DECIMAL(5,2)) END),
    MAX(CASE WHEN `bidang` = 'lingkar_perut' THEN CAST(`nilai` AS DECIMAL(5,1)) END),
    MAX(CASE WHEN `bidang` = 'spo2' THEN CAST(`nilai` AS SIGNED) END),
    MAX(CASE WHEN `bidang` = 'gcs' THEN CAST(`nilai` AS SIGNED) END),
    MAX(CASE WHEN `bidang` = 'kesadaran' THEN `nilai` END),
    MAX(`dibuat_oleh`),
    MAX(`dibuat_pada`)
FROM `observasi`
WHERE `kelompok` = 'tanda_vital'
GROUP BY `fasyankes_id`, `kunjungan_id`, `versi`;

-- Migrasi SOAPIE dari narasi_klinis -> pemeriksaan
INSERT INTO `pemeriksaan` (
    `fasyankes_id`, `kunjungan_id`, `jenis`, `bagian`, `versi`,
    `subjek`, `objek`, `asesmen`, `plan`, `instruksi`, `evaluasi`,
    `dibuat_oleh`, `dibuat_pada`
)
SELECT
    `fasyankes_id`, `kunjungan_id`, 'ralan', `bagian`, `versi`,
    CASE WHEN `bagian` = 'subjek' THEN `isi` END,
    CASE WHEN `bagian` = 'objek' THEN `isi` END,
    CASE WHEN `bagian` = 'asesmen' THEN `isi` END,
    CASE WHEN `bagian` = 'plan' THEN `isi` END,
    CASE WHEN `bagian` = 'instruksi' THEN `isi` END,
    CASE WHEN `bagian` = 'evaluasi' THEN `isi` END,
    `dibuat_oleh`, `dibuat_pada`
FROM `narasi_klinis`
WHERE `bagian` IN ('subjek', 'objek', 'asesmen', 'plan', 'instruksi', 'evaluasi');

-- Migrasi catatan_harian (CPPT rawat inap) -> pemeriksaan
INSERT INTO `pemeriksaan` (
    `fasyankes_id`, `kunjungan_id`, `jenis`, `bagian`, `versi`,
    `subjek`, `objek`, `asesmen`, `plan`, `instruksi`,
    `suhu`, `tensi_sistol`, `tensi_diastol`, `nadi`, `respirasi`,
    `tinggi`, `berat`, `lingkar_perut`, `spo2`, `gcs`, `kesadaran`,
    `dibuat_oleh`, `dibuat_pada`
)
SELECT
    `fasyankes_id`, `kunjungan_id`, 'cppt', 'cppt', 1,
    `subjektif`, `objektif`, `asesmen`, `rencana`, `instruksi`,
    CAST(JSON_UNQUOTE(JSON_EXTRACT(`tanda_vital`, '$.suhu')) AS DECIMAL(4,1)),
    CAST(JSON_UNQUOTE(JSON_EXTRACT(`tanda_vital`, '$.sistolik')) AS SIGNED),
    CAST(JSON_UNQUOTE(JSON_EXTRACT(`tanda_vital`, '$.diastolik')) AS SIGNED),
    CAST(JSON_UNQUOTE(JSON_EXTRACT(`tanda_vital`, '$.nadi')) AS SIGNED),
    CAST(JSON_UNQUOTE(JSON_EXTRACT(`tanda_vital`, '$.respirasi')) AS SIGNED),
    CAST(JSON_UNQUOTE(JSON_EXTRACT(`tanda_vital`, '$.tinggi_badan')) AS DECIMAL(5,1)),
    CAST(JSON_UNQUOTE(JSON_EXTRACT(`tanda_vital`, '$.berat_badan')) AS DECIMAL(5,2)),
    CAST(JSON_UNQUOTE(JSON_EXTRACT(`tanda_vital`, '$.lingkar_perut')) AS DECIMAL(5,1)),
    CAST(JSON_UNQUOTE(JSON_EXTRACT(`tanda_vital`, '$.spo2')) AS SIGNED),
    CAST(JSON_UNQUOTE(JSON_EXTRACT(`tanda_vital`, '$.gcs')) AS SIGNED),
    JSON_UNQUOTE(JSON_EXTRACT(`tanda_vital`, '$.kesadaran')),
    `dibuat_oleh`, `dibuat_pada`
FROM `catatan_harian`;

-- Bersihkan data yang sudah dipindahkan & hapus tabel lama
DELETE FROM `observasi` WHERE `kelompok` = 'tanda_vital';
DELETE FROM `narasi_klinis` WHERE `bagian` IN ('subjek', 'objek', 'asesmen', 'plan', 'instruksi', 'evaluasi');
DROP TABLE `anamnesis`;
DROP TABLE `keperawatan`;
DROP TABLE `catatan_harian`;
