-- Rute pemberian bawaan per obat di master klinik; dipakai otomatis untuk item resep saat telaah farmasi.
ALTER TABLE `master_obat` ADD COLUMN `rute` VARCHAR(50) NULL;
