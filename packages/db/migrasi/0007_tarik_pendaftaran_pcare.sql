-- Antrean online FKTP ternyata satu arah: klinik yang menarik pendaftaran Mobile JKN dari PCare, BPJS tidak memanggil klinik.
-- Akun web service klinik tidak diperlukan lagi. `pcare_no_urut` menandai antrean yang berasal dari pendaftaran PCare
-- (nomor urut PCare pada tanggal dan poli itu) supaya pendaftaran yang sama tidak ditarik dua kali.
ALTER TABLE `pengaturan_antrean_jkn` DROP INDEX `pengaturan_antrean_jkn_ws_username_key`, DROP COLUMN `ws_username`, DROP COLUMN `ws_password_hash`;

ALTER TABLE `antrean` ADD COLUMN `pcare_no_urut` VARCHAR(10) NULL, ADD INDEX `antrean_fasyankes_id_tanggal_pcare_no_urut_idx`(`fasyankes_id`, `tanggal`, `pcare_no_urut`);
