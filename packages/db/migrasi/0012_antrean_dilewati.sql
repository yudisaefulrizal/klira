-- Antrean yang dipanggil tetapi pasiennya tidak ada ditandai dilewati; poli bebas dan pasien dapat dipanggil lagi.
ALTER TABLE `antrean` MODIFY `status` ENUM('menunggu', 'dipanggil', 'dilewati', 'dilayani', 'selesai', 'batal') NOT NULL DEFAULT 'menunggu';
