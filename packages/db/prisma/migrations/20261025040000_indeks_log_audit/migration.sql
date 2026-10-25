-- CreateIndex
CREATE INDEX `log_audit_fasyankes_id_waktu_idx` ON `log_audit`(`fasyankes_id`, `waktu`);

-- CreateIndex
CREATE INDEX `log_audit_aksi_waktu_idx` ON `log_audit`(`aksi`, `waktu`);

-- CreateIndex
CREATE INDEX `log_audit_entitas_entitas_id_idx` ON `log_audit`(`entitas`, `entitas_id`);
