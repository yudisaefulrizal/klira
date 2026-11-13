import * as db from '@klira/db';

export type CatatanBaru = {
  fasyankes_id: number | null;
  pengguna_id: number | null;
  aksi: string;
  entitas: string;
  entitas_id: number | null;
  keterangan: string | null;
  alamat: string | null;
  waktu: Date;
};
export type CatatanTersimpan = CatatanBaru & { id: number };
export type SaringanRepo = { fasyankes_id: number; pengguna_id?: number; aksi?: string; entitas?: string; dari?: Date; sampai?: Date };

/** Log hanya-tambah: antarmuka ini sengaja tanpa ubah dan hapus. */
export interface RepositoriAudit {
  tambah(c: CatatanBaru): Promise<void>;
  cari(f: SaringanRepo, lewati: number, ambil: number): Promise<{ total: number; baris: CatatanTersimpan[] }>;
  ambil(id: number, fasyankesId: number): Promise<CatatanTersimpan | null>;
  namaPengguna(ids: number[]): Promise<Map<number, string>>;
}



export class RepositoriAuditMysql implements RepositoriAudit {
  constructor(private readonly klien: db.Koneksi = db.pool) {}
  async tambah(c: CatatanBaru): Promise<void> {
    await db.tambahLogAuditUntukTambah((c)?.fasyankes_id, (c)?.pengguna_id, (c)?.aksi, (c)?.entitas, (c)?.entitas_id, (c)?.keterangan, (c)?.waktu, (c)?.alamat, this.klien);
  }

  async cari(f: SaringanRepo, lewati: number, ambil: number) {
    const [total, baris] = await Promise.all([
      db.hitungLogAuditUntukCari(f.fasyankes_id, f.pengguna_id, f.aksi, f.entitas, f.dari, f.sampai),
      db.daftarLogAuditUntukCari(f.fasyankes_id, f.pengguna_id, f.aksi, f.entitas, f.dari, f.sampai, ambil, lewati),
    ]);
    return { total, baris };
  }

  ambil(id: number, fasyankesId: number) {
    return db.cariLogAuditUntukAmbil(id, fasyankesId);
  }

  async namaPengguna(ids: number[]) {
    const unik = [...new Set(ids)];
    if (!unik.length) return new Map<number, string>();
    const p = await db.daftarPenggunaUntukNamaPengguna(unik);
    return new Map(p.map((x) => [x.id, x.nama]));
  }
}
