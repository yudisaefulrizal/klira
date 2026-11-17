-- Kuota jadwal praktik boleh kosong: kosong berarti tanpa batas.
ALTER TABLE `jadwal_praktik` MODIFY `kuota` INTEGER NULL;
