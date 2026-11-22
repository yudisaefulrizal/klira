-- Kelas rawat (dan indikator perubahan kelas) sudah dihapus BPJS; ruang rawat dibedakan lewat nama ruang dan tarif kamar.
ALTER TABLE `penempatan` DROP COLUMN `kelas`, DROP COLUMN `indikator`;
