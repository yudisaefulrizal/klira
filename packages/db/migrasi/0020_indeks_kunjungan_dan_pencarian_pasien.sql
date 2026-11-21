-- Daftar pasien harian, hitungan tab, dan statistik menyaring kunjungan menurut fasyankes dan rentang waktu mulai.
ALTER TABLE `kunjungan` ADD INDEX `kunjungan_fasyankes_id_mulai_idx`(`fasyankes_id`, `mulai`);

-- Pencarian pasien berangka mencocokkan nomor JKN dari awal angka.
ALTER TABLE `pasien` ADD INDEX `pasien_fasyankes_id_jkn_nomor_kartu_idx`(`fasyankes_id`, `jkn_nomor_kartu`);

-- Indeks yang sudah tercakup indeks komposit berawalan kolom yang sama.
ALTER TABLE `jadwal_praktik` DROP INDEX `jadwal_praktik_pengguna_id_idx`;

ALTER TABLE `master_obat` DROP INDEX `master_obat_fasyankes_id_idx`;

ALTER TABLE `peringatan_izin` DROP INDEX `peringatan_izin_pengguna_id_idx`;
