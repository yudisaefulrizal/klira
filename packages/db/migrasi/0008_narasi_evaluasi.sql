-- Catatan SOAPIE di halaman Pasien: huruf E (Evaluasi) disimpan sebagai narasi klinis berversi, sama seperti diagnosa banding, KIE, dan obat di poli.
ALTER TABLE `narasi_klinis` MODIFY `bagian` ENUM('diagnosis_banding', 'kie', 'obat_poli', 'evaluasi') NOT NULL;
