-- Struktur lokasi dirombak: satu istilah, satu arti.
--   poli          = layanan (Umum, Gigi, KIA): satu baris per layanan, membawa awalan antrean. Antrean, jadwal dokter, dan kunjungan menunjuk poli.
--   ruang_periksa = tempat periksa fisik di bawah satu poli (induk_id = poli, wajib). Antrean mendapat ruang saat dipanggil (antrean.ruang_id).
--   ruang         = ruang rawat inap (Dahlia, Mawar), berdiri sendiri tanpa induk.
--   bed           = bed di dalam ruang rawat inap.
-- Poli lama yang sejenis (Poli Umum 1 dan 2) digabung menjadi satu poli; masing-masing menjadi ruang periksa di bawahnya.

ALTER TABLE `lokasi` MODIFY `jenis` ENUM('poli', 'ruang_periksa', 'ruang', 'bed') NOT NULL, ADD COLUMN `asal_poli_id` INTEGER NULL;

ALTER TABLE `antrean` ADD COLUMN `ruang_id` INTEGER NULL AFTER `lokasi_id`, ADD INDEX `antrean_ruang_id_tanggal_status_idx`(`ruang_id`, `tanggal`, `status`);

-- Poli baku per jenis: id terkecil di antara poli sejenis.
CREATE TABLE `_poli_baku` (`id` INTEGER NOT NULL PRIMARY KEY, `baku_id` INTEGER NOT NULL, `nama_baku` VARCHAR(200) NOT NULL) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `_poli_baku` (`id`, `baku_id`, `nama_baku`)
SELECT l.`id`, (SELECT MIN(x.`id`) FROM `lokasi` x WHERE x.`fasyankes_id` = l.`fasyankes_id` AND x.`jenis` = 'poli' AND LOWER(TRIM(COALESCE(NULLIF(x.`jenis_poli`, ''), x.`nama`))) = LOWER(TRIM(COALESCE(NULLIF(l.`jenis_poli`, ''), l.`nama`)))),
       TRIM(COALESCE(NULLIF(l.`jenis_poli`, ''), l.`nama`))
FROM `lokasi` l WHERE l.`jenis` = 'poli';

-- Setiap poli lama menjadi ruang periksa di bawah poli bakunya (nama, status, dan IHS ikut).
INSERT INTO `lokasi` (`fasyankes_id`, `nama`, `jenis`, `induk_id`, `status_operasional`, `ihs_location_id`, `dibuat_oleh`, `dibuat_pada`, `asal_poli_id`)
SELECT l.`fasyankes_id`, l.`nama`, 'ruang_periksa', b.`baku_id`, l.`status_operasional`, l.`ihs_location_id`, l.`dibuat_oleh`, l.`dibuat_pada`, l.`id`
FROM `lokasi` l JOIN `_poli_baku` b ON b.`id` = l.`id`;

-- Antrean yang sudah dipanggil: ruang = ruang periksa dari poli lamanya; lokasi = poli baku.
UPDATE `antrean` a JOIN `lokasi` r ON r.`asal_poli_id` = a.`lokasi_id` AND r.`jenis` = 'ruang_periksa' SET a.`ruang_id` = r.`id`;
UPDATE `antrean` a JOIN `_poli_baku` b ON b.`id` = a.`lokasi_id` SET a.`lokasi_id` = b.`baku_id`;
-- Antrean yang belum dipanggil: poli dari nama jenisnya (antrean laboratorium tetap tanpa poli).
UPDATE `antrean` a SET a.`lokasi_id` = (SELECT MIN(b.`baku_id`) FROM `_poli_baku` b JOIN `lokasi` l ON l.`id` = b.`id` WHERE l.`fasyankes_id` = a.`fasyankes_id` AND LOWER(b.`nama_baku`) = LOWER(TRIM(a.`jenis_poli`)))
WHERE a.`lokasi_id` IS NULL;

UPDATE `kunjungan` k JOIN `_poli_baku` b ON b.`id` = k.`lokasi_id` SET k.`lokasi_id` = b.`baku_id`;
UPDATE `kunjungan` k JOIN `antrean` a ON a.`kunjungan_id` = k.`id` SET k.`lokasi_id` = a.`lokasi_id` WHERE k.`lokasi_id` IS NULL AND a.`lokasi_id` IS NOT NULL;
UPDATE `jadwal_praktik` j JOIN `_poli_baku` b ON b.`id` = j.`lokasi_id` SET j.`lokasi_id` = b.`baku_id`;

-- Ruang rawat inap tidak lagi berinduk poli.
UPDATE `lokasi` SET `induk_id` = NULL WHERE `jenis` = 'ruang';

-- Poli baku bernama layanannya; poli sejenis lain dihapus (perannya sudah pindah ke ruang periksa).
UPDATE `lokasi` l JOIN `_poli_baku` b ON b.`id` = l.`id` AND b.`baku_id` = l.`id` SET l.`nama` = b.`nama_baku`, l.`status_operasional` = 'O';
DELETE l FROM `lokasi` l JOIN `_poli_baku` b ON b.`id` = l.`id` WHERE b.`baku_id` <> l.`id`;

DROP TABLE `_poli_baku`;

ALTER TABLE `lokasi` DROP COLUMN `jenis_poli`, DROP COLUMN `asal_poli_id`;
