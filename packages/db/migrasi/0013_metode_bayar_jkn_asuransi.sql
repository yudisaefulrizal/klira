-- Pembayaran dapat dicatat dengan metode JKN atau asuransi: biaya yang ditanggung tetap diinput sebagai pembayaran.
ALTER TABLE `pembayaran` MODIFY `metode` ENUM('tunai', 'transfer', 'qris', 'jkn', 'asuransi') NOT NULL;
