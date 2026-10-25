-- AlterTable
ALTER TABLE `peringatan_izin`
    ADD COLUMN `sumber` VARCHAR(20) NOT NULL DEFAULT 'pemberian',
    ADD COLUMN `diterima_untuk_akun` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `keterangan` VARCHAR(255) NULL;

-- CreateIndex
CREATE INDEX `peringatan_izin_pengguna_id_jenis_peringatan_idx` ON `peringatan_izin`(`pengguna_id`, `jenis_peringatan`);
