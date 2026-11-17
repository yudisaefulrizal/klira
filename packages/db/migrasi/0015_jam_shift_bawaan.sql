-- Jam bawaan shift disesuaikan: Pagi 07:00-14:00, Siang 14:00-21:00, Malam 21:00-07:00 (melewati tengah malam).
UPDATE `shift` SET `jam_mulai` = '07:00', `jam_selesai` = '14:00' WHERE `urutan` = 1;

UPDATE `shift` SET `jam_mulai` = '14:00', `jam_selesai` = '21:00' WHERE `urutan` = 2;

UPDATE `shift` SET `jam_mulai` = '21:00', `jam_selesai` = '07:00' WHERE `urutan` = 3;
