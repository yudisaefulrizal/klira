import * as db from '@klira/db';
import type { ProfilKlinikDto, ProfilKlinikMasukan } from '@klira/shared';

export type BarisRiwayatProfil = { id: number; jenis: string; ringkasan: string; dibuat_oleh_nama: string | null; dibuat_pada: Date };
export type RiwayatBaru = { jenis: 'profil' | 'akreditasi'; ringkasan: string };

export interface RepositoriFasyankes {
  ambil(fasyankesId: number): Promise<ProfilKlinikDto | null>;
  /** Kode registrasi dipakai fasyankes lain (kode unik global). */
  kodeDipakaiLain(fasyankesId: number, kode: string): Promise<boolean>;
  /** Simpan profil dan riwayatnya dalam satu transaksi. */
  simpan(fasyankesId: number, nilai: ProfilKlinikDto, oleh: number, riwayat: RiwayatBaru[]): Promise<ProfilKlinikDto>;
  /** Riwayat milik fasyankes ini, terbaru dahulu. */
  riwayat(fasyankesId: number, lewati: number, ambil: number): Promise<{ total: number; baris: BarisRiwayatProfil[] }>;
}


const keDto = (f: { id: number; nama: string; jenis: ProfilKlinikDto['jenis']; bentuk_usaha: string | null; kode_registrasi: string | null; organization_id: string | null; status_akreditasi: string | null; tanggal_akreditasi: Date | null; puskesmas_wilayah: string | null }): ProfilKlinikDto => ({
  ...f, tanggal_akreditasi: f.tanggal_akreditasi ? f.tanggal_akreditasi.toISOString().slice(0, 10) : null,
});

export type NilaiProfil = ProfilKlinikMasukan;

export class RepositoriFasyankesMysql implements RepositoriFasyankes {
  async ambil(fasyankesId: number): Promise<ProfilKlinikDto | null> {
    const f = await db.ambilFasyankesUntukAmbil(fasyankesId);
    return f ? keDto(f) : null;
  }

  async kodeDipakaiLain(fasyankesId: number, kode: string): Promise<boolean> {
    return (await db.hitungFasyankesUntukKodeDipakaiLain(kode, fasyankesId)) > 0;
  }

  async simpan(fasyankesId: number, n: ProfilKlinikDto, oleh: number, riwayat: RiwayatBaru[]): Promise<ProfilKlinikDto> {
    const f = await db.transaksi(async (tx) => {
      const baru = await (async () => { (await db.ubahFasyankesUntukSimpan(n.nama, n.jenis, n.bentuk_usaha, n.kode_registrasi, n.organization_id, n.status_akreditasi, n.tanggal_akreditasi ? new Date(n.tanggal_akreditasi) : null, n.puskesmas_wilayah, fasyankesId, tx)); return db.ubahFasyankesUntukSimpanHasil(fasyankesId, tx); })();
      if (riwayat.length) {
        await db.tambahBanyakRiwayatProfilUntukSimpan(riwayat.map((r) => ({ fasyankes_id: fasyankesId, jenis: r.jenis, ringkasan: r.ringkasan.slice(0, 2000), dibuat_oleh: oleh })), tx);
      }
      return baru;
    });
    return keDto(f);
  }

  async riwayat(fasyankesId: number, lewati: number, ambil: number) {

    const [total, data] = await Promise.all([
      db.hitungRiwayatProfilUntukRiwayat(fasyankesId),
      db.daftarRiwayatProfilUntukRiwayat(fasyankesId, ambil, lewati),
    ]);
    const ids = [...new Set(data.map((r) => r.dibuat_oleh).filter((x): x is number => x !== null))];
    const nama = new Map((await db.daftarPenggunaUntukRiwayat(ids, fasyankesId)).map((p) => [p.id, p.nama]));
    return {
      total,
      baris: data.map((r) => ({ id: r.id, jenis: r.jenis, ringkasan: r.ringkasan, dibuat_oleh_nama: r.dibuat_oleh ? nama.get(r.dibuat_oleh) ?? null : null, dibuat_pada: r.dibuat_pada })),
    };
  }
}
