-- Kategori/jenis poli baku untuk klinik pratama (Umum, Gigi, KIA, UGD).
ALTER TABLE `lokasi`
    ADD COLUMN `kategori_poli` ENUM('umum', 'gigi', 'kia', 'ugd') NULL AFTER `jenis`;

UPDATE `lokasi`
SET `kategori_poli` = CASE
    WHEN LOWER(`nama`) LIKE '%gigi%' THEN 'gigi'
    WHEN LOWER(`nama`) LIKE '%kia%' OR LOWER(`nama`) LIKE '%kebidanan%' OR LOWER(`nama`) LIKE '%anak%' THEN 'kia'
    WHEN LOWER(`nama`) LIKE '%ugd%' OR LOWER(`nama`) LIKE '%igd%' THEN 'ugd'
    ELSE 'umum'
END
WHERE `jenis` = 'poli';
