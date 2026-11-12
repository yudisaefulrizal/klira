-- Isian dokter mengikuti formulir rekam medis klinik (P7): anamnesa mendapat riwayat perjalanan penyakit sekarang dan kajian sosial.
-- Bidang pemeriksaan fisik terstruktur disimpan di `observasi` (tanpa perubahan skema).
ALTER TABLE `anamnesis` ADD COLUMN `riwayat_sekarang` TEXT NULL,
    ADD COLUMN `kajian_sosial` TEXT NULL;
