-- Satu dokter tidak bisa berada di dua tempat sekaligus: per hari dan shift hanya satu jadwal per dokter.
DELETE j FROM `jadwal_praktik` j JOIN `jadwal_praktik` k ON k.`pengguna_id` = j.`pengguna_id` AND k.`hari` = j.`hari` AND k.`shift_id` = j.`shift_id` AND k.`id` < j.`id`;

ALTER TABLE `jadwal_praktik` ADD UNIQUE INDEX `jadwal_praktik_pengguna_id_hari_shift_id_key`(`pengguna_id`, `hari`, `shift_id`);
