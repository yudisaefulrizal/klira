-- Kredensial dan Organization ID SATUSEHAT dipindah ke variabel lingkungan server (.env); tidak lagi disimpan di database.
DROP TABLE `kredensial_satusehat`;
ALTER TABLE `fasyankes` DROP COLUMN `organization_id`;
