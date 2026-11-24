-- Perbarui trigger kunjungan agar tidak merujuk fasyankes_id pada skema single-tenant

DROP TRIGGER IF EXISTS `kunjungan_catat_tahap_awal`;
DROP TRIGGER IF EXISTS `kunjungan_catat_perpindahan`;

CREATE TRIGGER `kunjungan_catat_tahap_awal` AFTER INSERT ON `kunjungan`
FOR EACH ROW INSERT INTO `riwayat_tahap_layanan` (`kunjungan_id`,`tahap`,`masuk`)
VALUES (NEW.id,NEW.tahap_layanan,UTC_TIMESTAMP(3));

DELIMITER $$
CREATE TRIGGER `kunjungan_catat_perpindahan` AFTER UPDATE ON `kunjungan`
FOR EACH ROW BEGIN
 IF OLD.tahap_layanan <> NEW.tahap_layanan THEN
  UPDATE `riwayat_tahap_layanan` SET `keluar` = UTC_TIMESTAMP(3)
   WHERE `kunjungan_id` = NEW.id AND `keluar` IS NULL;
  INSERT INTO `riwayat_tahap_layanan` (`kunjungan_id`,`tahap`,`masuk`)
   VALUES (NEW.id,NEW.tahap_layanan,UTC_TIMESTAMP(3));
 END IF;
END$$
DELIMITER ;
