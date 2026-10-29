-- Satu izin WhatsApp mencakup seluruh operasi WhatsApp.
INSERT IGNORE INTO izin (fitur, aksi, cakupan) VALUES ('whatsapp', 'lihat', 'unit');

-- Gabungkan paket jenis akun tanpa kehilangan akses yang sudah diberikan.
INSERT IGNORE INTO izin_jenis_akun (fasyankes_id, jenis_akun_id, izin_id, dibuat_oleh, dibuat_pada)
SELECT g.fasyankes_id, g.jenis_akun_id, tujuan.id, g.dibuat_oleh, g.dibuat_pada
FROM izin_jenis_akun g
JOIN izin lama ON lama.id = g.izin_id
JOIN izin tujuan ON tujuan.fitur = 'whatsapp' AND tujuan.aksi = 'lihat' AND tujuan.cakupan = 'unit'
WHERE lama.fitur IN ('pesan', 'whatsapp');

-- Periode serta jejak pemberian/pengurangan per akun tidak dihapus.
UPDATE izin_per_akun p
JOIN izin lama ON lama.id = p.izin_id
JOIN izin tujuan ON tujuan.fitur = 'whatsapp' AND tujuan.aksi = 'lihat' AND tujuan.cakupan = 'unit'
SET p.izin_id = tujuan.id WHERE lama.fitur IN ('pesan', 'whatsapp');
UPDATE peringatan_izin p
JOIN izin lama ON lama.id = p.izin_id
JOIN izin tujuan ON tujuan.fitur = 'whatsapp' AND tujuan.aksi = 'lihat' AND tujuan.cakupan = 'unit'
SET p.izin_id = tujuan.id WHERE lama.fitur IN ('pesan', 'whatsapp');
DELETE g FROM izin_jenis_akun g JOIN izin i ON i.id = g.izin_id
WHERE i.fitur = 'pesan' OR (i.fitur = 'whatsapp' AND NOT (i.aksi = 'lihat' AND i.cakupan = 'unit'));
DELETE FROM izin WHERE fitur = 'pesan' OR (fitur = 'whatsapp' AND NOT (aksi = 'lihat' AND cakupan = 'unit'));
