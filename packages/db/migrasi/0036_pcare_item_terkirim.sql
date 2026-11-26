-- Catat ID item tindakan & obat yang sudah berhasil dikirim ke PCare agar retry/sinkron ulang tidak mengirim ganda.
ALTER TABLE `kunjungan`
    ADD COLUMN `pcare_item_terkirim` JSON NULL;
