-- Bridging pelayanan PCare BPJS (FKTP): perluas pemetaan kode BPJS untuk tindakan & obat,
-- simpan hasil pengiriman kunjungan ke PCare pada tabel `kunjungan`, dan dukung `pcare_no_kunjungan` di `klaim`.

ALTER TABLE `pemetaan_bpjs`
    MODIFY COLUMN `jenis` ENUM('poli', 'dokter', 'tindakan', 'obat') NOT NULL;

ALTER TABLE `kunjungan`
    ADD COLUMN `pcare_no_kunjungan` VARCHAR(50) NULL,
    ADD COLUMN `pcare_status` ENUM('terkirim', 'gagal') NULL,
    ADD COLUMN `pcare_pesan` VARCHAR(500) NULL,
    ADD COLUMN `pcare_dikirim_pada` DATETIME(3) NULL,
    ADD COLUMN `pcare_rujuk_lanjut` JSON NULL,
    ADD COLUMN `non_kapitasi` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `klaim`
    ADD COLUMN `pcare_no_kunjungan` VARCHAR(50) NULL;
