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
  `diubah_pada` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `website_klinik_fasyankes_id_key` (`fasyankes_id`),
  UNIQUE INDEX `website_klinik_slug_key` (`slug`),
  UNIQUE INDEX `website_klinik_domain_key` (`domain`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `website_klinik` ADD CONSTRAINT `website_klinik_fasyankes_id_fkey` FOREIGN KEY (`fasyankes_id`) REFERENCES `fasyankes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- Satu fasilitas yang sudah ada langsung memiliki root publik; instalasi multi-fasilitas tetap perlu memilih publikasi masing-masing.
INSERT INTO `website_klinik` (`fasyankes_id`,`aktif`,`slug`,`judul`,`ringkasan`,`tentang`,`alamat`,`whatsapp`,`telepon`,`email`,`jam_operasional`,`warna_utama`,`logo_url`,`hero_url`,`diubah_pada`)
SELECT `id`, (SELECT COUNT(*) FROM `fasyankes`)=1, CONCAT('klinik-',`id`), 'Layanan kesehatan untuk Anda dan keluarga.', 'Temukan layanan, jadwal praktik, dan informasi kunjungan dalam satu tempat.', '', '', '', '', '', '', '#0B6B64', '', '/asset/ilustrasi/klinik-dokter-pasien-berhijab-v1.png', NOW(3) FROM `fasyankes`;
