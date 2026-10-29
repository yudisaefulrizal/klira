CREATE TABLE `riwayat_tahap_layanan` (
 `id` INTEGER NOT NULL AUTO_INCREMENT,
 `fasyankes_id` INTEGER NOT NULL,
 `kunjungan_id` INTEGER NOT NULL,
 `tahap` ENUM('menunggu_skrining','pemeriksaan','resep','kasir','ditutup') NOT NULL,
 `masuk` DATETIME(3) NOT NULL,
 `keluar` DATETIME(3) NULL,
 INDEX `riwayat_tahap_layanan_fasyankes_id_masuk_idx` (`fasyankes_id`,`masuk`),
 INDEX `riwayat_tahap_layanan_kunjungan_id_keluar_idx` (`kunjungan_id`,`keluar`),
 PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Jangan mengarang waktu masuk tahap untuk kunjungan lama.
CREATE TRIGGER `kunjungan_catat_tahap_awal` AFTER INSERT ON `kunjungan`
FOR EACH ROW INSERT INTO `riwayat_tahap_layanan` (`fasyankes_id`,`kunjungan_id`,`tahap`,`masuk`)
VALUES (NEW.fasyankes_id,NEW.id,NEW.tahap_layanan,UTC_TIMESTAMP(3));

CREATE TRIGGER `kunjungan_catat_perpindahan` AFTER UPDATE ON `kunjungan`
FOR EACH ROW BEGIN
 IF OLD.tahap_layanan <> NEW.tahap_layanan THEN
  UPDATE `riwayat_tahap_layanan` SET `keluar` = UTC_TIMESTAMP(3)
   WHERE `kunjungan_id` = NEW.id AND `keluar` IS NULL;
  INSERT INTO `riwayat_tahap_layanan` (`fasyankes_id`,`kunjungan_id`,`tahap`,`masuk`)
   VALUES (NEW.fasyankes_id,NEW.id,NEW.tahap_layanan,UTC_TIMESTAMP(3));
 END IF;
END;
