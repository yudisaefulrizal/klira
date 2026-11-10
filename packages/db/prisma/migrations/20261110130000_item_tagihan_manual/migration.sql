-- Item tagihan yang ditambah kasir dari master tarif; hanya item manual yang boleh dihapus sebelum kunjungan ditutup.
ALTER TABLE `item_tagihan` ADD COLUMN `manual` BOOLEAN NOT NULL DEFAULT false;
