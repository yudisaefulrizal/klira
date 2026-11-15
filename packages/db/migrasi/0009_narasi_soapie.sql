-- Catatan SOAPIE di halaman Pasien menjadi enam teks panjang (Subjek, Objek, Asesmen, Plan, Instruksi, Evaluasi), disimpan sebagai narasi klinis berversi.
ALTER TABLE `narasi_klinis` MODIFY `bagian` ENUM('diagnosis_banding', 'kie', 'obat_poli', 'evaluasi', 'subjek', 'objek', 'asesmen', 'plan', 'instruksi') NOT NULL;
