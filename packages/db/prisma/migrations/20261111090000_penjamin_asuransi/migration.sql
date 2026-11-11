-- Cara bayar asuransi lain (P2): tambah nilai `asuransi`, data penjamin pasien, hapus kelas hak dan FKTP terdaftar JKN.
ALTER TABLE `kunjungan` MODIFY `cara_pembayaran` ENUM('umum', 'jkn', 'asuransi') NOT NULL DEFAULT 'umum';
ALTER TABLE `resep` MODIFY `jenis_pembiayaan` ENUM('umum', 'jkn', 'asuransi') NOT NULL DEFAULT 'umum';
ALTER TABLE `pasien` DROP COLUMN `jkn_kelas_hak`,
    DROP COLUMN `jkn_fktp_terdaftar`,
    ADD COLUMN `asuransi_nama` VARCHAR(100) NULL,
    ADD COLUMN `asuransi_nomor_polis` VARCHAR(50) NULL;
