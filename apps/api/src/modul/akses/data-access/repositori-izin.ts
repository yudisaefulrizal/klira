import * as db from '@klira/db';
import type { AksiIzin, CakupanIzin } from '@klira/shared';
import type { SnapshotAkses } from '../domain/mesin-izin';

export type BarisIzin = { id: number; fitur: string; aksi: AksiIzin; cakupan: CakupanIzin };
export type BarisJenisAkun = {
  id: number;
  fasyankes_id: number;
  nama: string;
  syarat_profesi: string | null;
  aktif: boolean;
  diubah_oleh: number | null;
  alasan_perubahan: string | null;
  dibuat_pada: Date;
  izin: BarisIzin[];
};
export type BarisRiwayat = { id: number; jenis_akun_id: number; ringkasan: string; alasan: string | null; dibuat_oleh: number | null; dibuat_pada: Date };
export type BarisPenugasan = {
  id: number; fasyankes_id: number; pengguna_id: number; jenis_akun_id: number;
  mulai: Date; selesai: Date | null; ditetapkan_oleh: number | null;
};
export type BarisIzinAkun = {
  id: number; fasyankes_id: number; pengguna_id: number; izin_id: number; tipe: 'tambah' | 'kurang';
  alasan: string; mulai: Date; selesai: Date | null; ditetapkan_oleh: number | null;
};
export type BarisPeringatan = {
  id: number; fasyankes_id: number; pengguna_id: number; izin_id: number | null; penugasan_id: number | null;
  jenis_peringatan: string; alasan_pimpinan: string; sumber: string; diterima_untuk_akun: boolean;
  keterangan: string | null; ditetapkan_oleh: number | null; waktu: Date;
};
export type EntriPeringatan = Omit<BarisPeringatan, 'id' | 'waktu'>;
export type FilterPeringatan = {
  pengguna_id?: number; jenis_peringatan?: string; cari?: string; dari?: Date; sampai?: Date; halaman: number; ukuran: number;
};
export type BarisPeringatanDaftar = BarisPeringatan & { pengguna_nama: string | null; ditetapkan_oleh_nama: string | null };
export type BarisJenisAkunDaftar = BarisJenisAkun & { jumlah_pemakai?: number };

export class KonflikNama extends Error {}

export interface RepositoriIzin {
  /** Pengguna dalam fasyankes ini? */
  penggunaAda(penggunaId: number, fasyankesId: number): Promise<boolean>;
  ambilSnapshot(penggunaId: number): Promise<SnapshotAkses | null>;
  daftarIzin(): Promise<BarisIzin[]>;
  izinByIds(ids: number[]): Promise<BarisIzin[]>;
  cariIzin(fitur: string, aksi: string, cakupan: string): Promise<BarisIzin | null>;

  daftarJenisAkun(fasyankesId: number, sekarang?: Date): Promise<BarisJenisAkunDaftar[]>;
  ambilJenisAkun(fasyankesId: number, id: number): Promise<BarisJenisAkun | null>;
  buatJenisAkun(data: { fasyankes_id: number; nama: string; syarat_profesi: string | null; izin_ids: number[]; alasan: string | null; oleh: number; ringkasan: string }): Promise<BarisJenisAkun>;
  ubahJenisAkun(data: {
    fasyankes_id: number; id: number; nama?: string; syarat_profesi?: string | null; izin_ids?: number[]; aktif?: boolean;
    alasan: string; oleh: number; ringkasan: string;
  }): Promise<BarisJenisAkun>;
  riwayatJenisAkun(fasyankesId: number, id: number): Promise<BarisRiwayat[]>;

  daftarPenugasan(penggunaId: number): Promise<BarisPenugasan[]>;
  ambilPenugasan(penggunaId: number, id: number): Promise<BarisPenugasan | null>;
  buatPenugasan(data: Omit<BarisPenugasan, 'id'>): Promise<BarisPenugasan>;
  akhiriPenugasan(id: number, selesai: Date): Promise<BarisPenugasan>;

  daftarIzinAkun(penggunaId: number): Promise<BarisIzinAkun[]>;
  ambilIzinAkun(penggunaId: number, id: number): Promise<BarisIzinAkun | null>;
  buatIzinAkun(data: Omit<BarisIzinAkun, 'id'>): Promise<BarisIzinAkun>;
  akhiriIzinAkun(id: number, selesai: Date): Promise<BarisIzinAkun>;

  simpanPeringatan(entri: EntriPeringatan[]): Promise<BarisPeringatan[]>;
  daftarPeringatan(fasyankesId: number, f: FilterPeringatan): Promise<{ data: BarisPeringatanDaftar[]; total: number }>;
  /** Catatan penerimaan terakhir untuk akun dan jenis peringatan (null bila belum diterima). */
  cariDiterima(penggunaId: number, jenis: string): Promise<BarisPeringatan | null>;
  alasanTerakhir(penggunaId: number, jenis: string): Promise<string | null>;
  adaTindakanSejak(penggunaId: number, kunci: string, sejak: Date): Promise<boolean>;
}



type JenisDb = db.JenisAkun & { izin: (db.IzinJenisAkun & { izin: db.Izin })[] };
const petaJenis = (j: JenisDb): BarisJenisAkun => ({
  id: j.id, fasyankes_id: j.fasyankes_id, nama: j.nama, syarat_profesi: j.syarat_profesi, aktif: j.aktif,
  diubah_oleh: j.diubah_oleh, alasan_perubahan: j.alasan_perubahan, dibuat_pada: j.dibuat_pada,
  izin: j.izin.map((x) => ({ id: x.izin.id, fitur: x.izin.fitur, aksi: x.izin.aksi, cakupan: x.izin.cakupan })),
});


export class RepositoriIzinMysql implements RepositoriIzin {
  async penggunaAda(penggunaId: number, fasyankesId: number): Promise<boolean> {
    return (await db.hitungPenggunaUntukPenggunaAda(penggunaId, fasyankesId)) > 0;
  }

  async ambilSnapshot(penggunaId: number): Promise<SnapshotAkses | null> {
    const p = await db.ambilPenggunaUntukAmbilSnapshot(penggunaId);
    if (!p) return null;
    return {
      pengguna_id: p.id,
      aktif: p.aktif,
      profil: p.profil_profesi,
      penugasan: p.penugasan_jenis.map((x) => ({
        id: x.id, jenis_akun_id: x.jenis_akun_id, jenis_nama: x.jenis_akun.nama, syarat_profesi: x.jenis_akun.syarat_profesi,
        jenis_aktif: x.jenis_akun.aktif, mulai: x.mulai, selesai: x.selesai,
        izin: x.jenis_akun.izin.map((i) => ({ fitur: i.izin.fitur, aksi: i.izin.aksi, cakupan: i.izin.cakupan })),
      })),
      izin_akun: p.izin_per_akun.map((x) => ({
        id: x.id, tipe: x.tipe, mulai: x.mulai, selesai: x.selesai,
        izin: { fitur: x.izin.fitur, aksi: x.izin.aksi, cakupan: x.izin.cakupan },
      })),
    };
  }

  daftarIzin(): Promise<BarisIzin[]> {
    return db.daftarIzinUntukDaftarIzin();
  }
  izinByIds(ids: number[]): Promise<BarisIzin[]> {
    return db.daftarIzinUntukIzinByIds(ids);
  }
  cariIzin(fitur: string, aksi: string, cakupan: string): Promise<BarisIzin | null> {
    return db.cariIzinUntukCariIzin(fitur, aksi as AksiIzin, cakupan as CakupanIzin);
  }

  /** `jumlah_pemakai` = akun berbeda dengan penugasan jenis ini yang sedang berjalan (mulai sudah lewat, belum selesai). */
  async daftarJenisAkun(fasyankesId: number, sekarang: Date = new Date()): Promise<BarisJenisAkunDaftar[]> {
    const [j, pemakai] = await Promise.all([
      db.daftarJenisAkunUntukDaftarJenisAkun(fasyankesId),
      db.daftarPenugasanJenisUntukDaftarJenisAkun(fasyankesId, sekarang, null, sekarang),
    ]);
    const hitung = new Map<number, number>();
    for (const x of pemakai) hitung.set(x.jenis_akun_id, (hitung.get(x.jenis_akun_id) ?? 0) + 1);
    return j.map((x) => ({ ...petaJenis(x), jumlah_pemakai: hitung.get(x.id) ?? 0 }));
  }
  async ambilJenisAkun(fasyankesId: number, id: number): Promise<BarisJenisAkun | null> {
    const j = await db.cariJenisAkunUntukAmbilJenisAkun(id, fasyankesId);
    return j ? petaJenis(j) : null;
  }

  async buatJenisAkun(d: Parameters<RepositoriIzin['buatJenisAkun']>[0]): Promise<BarisJenisAkun> {
    try {
      const id = await db.transaksi(async (tx) => {
        const j = await (async () => { const _hasil = await db.tambahJenisAkunUntukBuatJenisAkun(d.fasyankes_id, d.nama, d.syarat_profesi, d.oleh, d.alasan, tx); return db.tambahJenisAkunUntukBuatJenisAkunHasil(_hasil.id, tx); })();
        await db.tambahBanyakIzinJenisAkunUntukBuatJenisAkun(d.izin_ids.map((izin_id) => ({ fasyankes_id: d.fasyankes_id, jenis_akun_id: j.id, izin_id, dibuat_oleh: d.oleh })), tx);
        await db.tambahRiwayatJenisAkunUntukBuatJenisAkun(d.fasyankes_id, j.id, d.ringkasan, d.alasan, d.oleh, tx);
        return j.id;
      });
      return (await this.ambilJenisAkun(d.fasyankes_id, id)) as BarisJenisAkun;
    } catch (galat) {
      if (db.bentrokUnik(galat)) throw new KonflikNama();
      throw galat;
    }
  }

  async ubahJenisAkun(d: Parameters<RepositoriIzin['ubahJenisAkun']>[0]): Promise<BarisJenisAkun> {
    try {
      await db.transaksi(async (tx) => {
        await db.ubahJenisAkunUntukUbahJenisAkun((d.nama !== undefined) ? (d.nama) : (undefined), (d.syarat_profesi !== undefined) ? (d.syarat_profesi) : (undefined), (d.aktif !== undefined) ? (d.aktif) : (undefined), d.oleh, d.alasan, d.id, tx);
        if (d.izin_ids) {
          // Isi paket diganti; jejak perubahan tersimpan di riwayat_jenis_akun.
          await db.hapusIzinJenisAkunUntukUbahJenisAkun(d.id, d.izin_ids, tx);
          await db.tambahBanyakIzinJenisAkunUntukUbahJenisAkun(d.izin_ids.map((izin_id) => ({ fasyankes_id: d.fasyankes_id, jenis_akun_id: d.id, izin_id, dibuat_oleh: d.oleh })), tx);
        }
        await db.tambahRiwayatJenisAkunUntukBuatJenisAkun(d.fasyankes_id, d.id, d.ringkasan, d.alasan, d.oleh, tx);
      });
    } catch (galat) {
      if (db.bentrokUnik(galat)) throw new KonflikNama();
      throw galat;
    }
    return (await this.ambilJenisAkun(d.fasyankes_id, d.id)) as BarisJenisAkun;
  }

  riwayatJenisAkun(fasyankesId: number, id: number): Promise<BarisRiwayat[]> {
    return db.daftarRiwayatJenisAkunUntukRiwayatJenisAkun(fasyankesId, id);
  }

  daftarPenugasan(penggunaId: number): Promise<BarisPenugasan[]> {
    return db.daftarPenugasanJenisUntukDaftarPenugasan(penggunaId);
  }
  ambilPenugasan(penggunaId: number, id: number): Promise<BarisPenugasan | null> {
    return db.cariPenugasanJenisUntukAmbilPenugasan(id, penggunaId);
  }
  buatPenugasan(d: Omit<BarisPenugasan, 'id'>): Promise<BarisPenugasan> {
    return db.transaksi(async koneksiBaru => { const _hasil = await db.tambahPenugasanJenisUntukBuatPenugasan((d)?.fasyankes_id, (d)?.pengguna_id, (d)?.jenis_akun_id, (d)?.mulai, (d)?.selesai, (d)?.ditetapkan_oleh, d.ditetapkan_oleh, koneksiBaru); return db.tambahPenugasanJenisUntukBuatPenugasanHasil(_hasil.id, koneksiBaru); });
  }
  akhiriPenugasan(id: number, selesai: Date): Promise<BarisPenugasan> {
    return db.transaksi(async koneksiBaru => { (await db.ubahPenugasanJenisUntukAkhiriPenugasan(selesai, id, koneksiBaru)); return db.tambahPenugasanJenisUntukBuatPenugasanHasil(id, koneksiBaru); });
  }

  daftarIzinAkun(penggunaId: number): Promise<BarisIzinAkun[]> {
    return db.daftarIzinPerAkunUntukDaftarIzinAkun(penggunaId);
  }
  ambilIzinAkun(penggunaId: number, id: number): Promise<BarisIzinAkun | null> {
    return db.cariIzinPerAkunUntukAmbilIzinAkun(id, penggunaId);
  }
  buatIzinAkun(d: Omit<BarisIzinAkun, 'id'>): Promise<BarisIzinAkun> {
    return db.transaksi(async koneksiBaru => { const _hasil = await db.tambahIzinPerAkunUntukBuatIzinAkun((d)?.fasyankes_id, (d)?.pengguna_id, (d)?.izin_id, (d)?.tipe, (d)?.alasan, (d)?.mulai, (d)?.selesai, (d)?.ditetapkan_oleh, d.ditetapkan_oleh, koneksiBaru); return db.tambahIzinPerAkunUntukBuatIzinAkunHasil(_hasil.id, koneksiBaru); });
  }
  akhiriIzinAkun(id: number, selesai: Date): Promise<BarisIzinAkun> {
    return db.transaksi(async koneksiBaru => { (await db.ubahIzinPerAkunUntukAkhiriIzinAkun(selesai, id, koneksiBaru)); return db.tambahIzinPerAkunUntukBuatIzinAkunHasil(id, koneksiBaru); });
  }

  async simpanPeringatan(entri: EntriPeringatan[]): Promise<BarisPeringatan[]> {
    const hasil: BarisPeringatan[] = [];
    for (const e of entri) {
      hasil.push(await db.transaksi(async koneksiBaru => { const _hasil = await db.tambahPeringatanIzinUntukSimpanPeringatan((e)?.fasyankes_id, (e)?.pengguna_id, (e)?.izin_id, (e)?.penugasan_id, (e)?.jenis_peringatan, (e)?.alasan_pimpinan, (e)?.sumber, (e)?.diterima_untuk_akun, (e)?.keterangan, (e)?.ditetapkan_oleh, e.ditetapkan_oleh, koneksiBaru); return db.tambahPeringatanIzinUntukSimpanPeringatanHasil(_hasil.id, koneksiBaru); }));
    }
    return hasil;
  }

  async daftarPeringatan(fasyankesId: number, f: FilterPeringatan): Promise<{ data: BarisPeringatanDaftar[]; total: number }> {

    const [baris, total] = await Promise.all([
      db.daftarPeringatanIzinUntukDaftarPeringatan(fasyankesId, (f.pengguna_id) ? (f.pengguna_id) : undefined, (f.jenis_peringatan) ? (f.jenis_peringatan) : undefined, f.cari, f.cari, ((f.dari || f.sampai) && (f.dari)) ? (f.dari) : undefined, ((f.dari || f.sampai) && (f.sampai)) ? (f.sampai) : undefined, f.ukuran, (f.halaman - 1) * f.ukuran),
      db.hitungPeringatanIzinUntukDaftarPeringatan(fasyankesId, (f.pengguna_id) ? (f.pengguna_id) : undefined, (f.jenis_peringatan) ? (f.jenis_peringatan) : undefined, f.cari, f.cari, ((f.dari || f.sampai) && (f.dari)) ? (f.dari) : undefined, ((f.dari || f.sampai) && (f.sampai)) ? (f.sampai) : undefined),
    ]);
    const ids = [...new Set(baris.flatMap((b) => [b.pengguna_id, ...(b.ditetapkan_oleh ? [b.ditetapkan_oleh] : [])]))];
    const nama = new Map(
      (ids.length ? await db.daftarPenggunaUntukNamaPengguna(ids) : []).map((x) => [x.id, x.nama]),
    );
    const data = baris.map((b) => ({
      ...b, pengguna_nama: nama.get(b.pengguna_id) ?? null, ditetapkan_oleh_nama: b.ditetapkan_oleh ? (nama.get(b.ditetapkan_oleh) ?? null) : null,
    }));
    return { data, total };
  }

  cariDiterima(penggunaId: number, jenis: string): Promise<BarisPeringatan | null> {
    return db.cariPeringatanIzinUntukCariDiterima(penggunaId, jenis, true);
  }
  async alasanTerakhir(penggunaId: number, jenis: string): Promise<string | null> {
    const r = await db.cariPeringatanIzinUntukAlasanTerakhir(penggunaId, jenis, 'tindakan');
    return r?.alasan_pimpinan ?? null;
  }
  async adaTindakanSejak(penggunaId: number, kunci: string, sejak: Date): Promise<boolean> {
    return (
      (await db.hitungPeringatanIzinUntukAdaTindakanSejak(penggunaId, 'tindakan', kunci, sejak)) > 0
    );
  }
}




