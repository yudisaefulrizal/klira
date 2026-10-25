import { prisma } from '@klira/db';

export type EntriAudit = {
  fasyankes_id?: number | null;
  pengguna_id?: number | null;
  aksi: string;
  entitas: string;
  entitas_id?: number | null;
  keterangan?: string;
  alamat?: string;
};

/** Antarmuka penampung audit; implementasi dapat diganti saat butir Log audit dikerjakan. */
export interface PenampungAudit {
  catat(entri: EntriAudit): Promise<void>;
}

/** Implementasi sementara: menulis ke tabel log_audit. Kegagalan tulis tidak menggagalkan permintaan. */
export class PenampungAuditPrisma implements PenampungAudit {
  async catat(entri: EntriAudit): Promise<void> {
    try {
      await prisma.logAudit.create({
        data: {
          fasyankes_id: entri.fasyankes_id ?? null,
          pengguna_id: entri.pengguna_id ?? null,
          aksi: entri.aksi,
          entitas: entri.entitas,
          entitas_id: entri.entitas_id ?? null,
          keterangan: entri.keterangan?.slice(0, 255),
          alamat: entri.alamat?.slice(0, 64),
        },
      });
    } catch (galat) {
      console.error('Gagal mencatat audit', galat);
    }
  }
}
