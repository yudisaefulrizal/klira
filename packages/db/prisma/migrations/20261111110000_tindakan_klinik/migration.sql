-- Daftar tindakan klinik dan tagihan tindakan otomatis (P5): tarif tindakan berkode ICD-9-CM dan boleh tanpa harga,
-- tindakan dokter tertaut tarif dengan jumlah, item tagihan dari pencatatan tindakan, dan ubah harga per kunjungan oleh kasir.
ALTER TABLE `tarif_layanan` ADD COLUMN `kode_icd9cm` VARCHAR(20) NULL,
    MODIFY `harga_umum` INTEGER NULL;

ALTER TABLE `tindakan` ADD COLUMN `jumlah` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `tarif_layanan_id` INTEGER NULL;

ALTER TABLE `item_tagihan` ADD COLUMN `alasan_ubah_harga` VARCHAR(300) NULL,
    ADD COLUMN `harga_acuan` INTEGER NULL,
    ADD COLUMN `tindakan_sumber` BOOLEAN NOT NULL DEFAULT false;
