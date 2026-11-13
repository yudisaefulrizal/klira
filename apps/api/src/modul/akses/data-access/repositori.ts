import * as db from '@klira/db';
import { hitungAksesEfektif } from '../domain/mesin-izin';
import { RepositoriIzinMysql } from './repositori-izin';
import type { AksesAkun, AkunMasuk, SesiAktif } from '../domain/skema';

export interface RepositoriAkses {
  cariAkunByUsername(username: string): Promise<AkunMasuk | null>;
  ambilAkses(penggunaId: number, sekarang: Date): Promise<AksesAkun>;
  buatSesi(data: { idHash: string; akun: AkunMasuk; alamat?: string; kedaluwarsa: Date }): Promise<void>;
  cariSesi(idHash: string, sekarang: Date): Promise<SesiAktif | null>;
  hapusSesi(idHash: string): Promise<void>;
  hapusKedaluwarsa(sekarang: Date): Promise<void>;
  /** Apakah username dipakai akun lain (tanpa membedakan huruf besar/kecil). */
  usernameDipakai(username: string, kecualiPenggunaId: number): Promise<boolean>;
  /**
   * Atomik: ubah username dan hash, matikan wajib ganti, cabut semua sesi akun,
   * lalu buat sesi baru. Melempar KonflikUsername bila username bentrok.
   */
  gantiKredensial(data: {
    akun: AkunMasuk;
    username: string;
    kataSandiHash: string;
    sesiBaru: { idHash: string; alamat?: string; kedaluwarsa: Date };
  }): Promise<void>;
}

export class KonflikUsername extends Error {}



export class RepositoriAksesMysql implements RepositoriAkses {
  async cariAkunByUsername(username: string): Promise<AkunMasuk | null> {
    return db.cariPenggunaUntukCariAkunByUsername(username, true);
  }

  /** Akses efektif (2.0): gabungan jenis akun aktif + tambahan - pengurangan pada waktu `sekarang`. */
  async ambilAkses(penggunaId: number, sekarang: Date): Promise<AksesAkun> {
    const snap = await new RepositoriIzinMysql().ambilSnapshot(penggunaId);
    if (!snap) return { jenis_akun: [], fitur: [], izin: [] };
    const { jenis_akun, fitur, izin } = hitungAksesEfektif(snap, sekarang);
    return { jenis_akun, fitur, izin };
  }

  async buatSesi(data: { idHash: string; akun: AkunMasuk; alamat?: string; kedaluwarsa: Date }): Promise<void> {
    await db.tambahSesiUntukBuatSesi(data.akun.fasyankes_id, data.akun.id, data.idHash, data.alamat?.slice(0, 64), data.kedaluwarsa);
  }

  async cariSesi(idHash: string, sekarang: Date): Promise<SesiAktif | null> {
    const sesi = await db.cariSesiUntukCariSesi(idHash, sekarang, true);
    return sesi ? { akun: sesi.pengguna } : null;
  }

  async hapusSesi(idHash: string): Promise<void> {
    await db.hapusSesiUntukHapusSesi(idHash);
  }

  async hapusKedaluwarsa(sekarang: Date): Promise<void> {
    await db.hapusSesiKedaluwarsa(sekarang);
  }

  async usernameDipakai(username: string, kecualiPenggunaId: number): Promise<boolean> {
    const ada = await db.cariPenggunaUntukUsernameDipakai(username, kecualiPenggunaId);
    return ada !== null;
  }

  async gantiKredensial(data: {
    akun: AkunMasuk;
    username: string;
    kataSandiHash: string;
    sesiBaru: { idHash: string; alamat?: string; kedaluwarsa: Date };
  }): Promise<void> {
    try {
      await db.transaksi(async tx => {
        await db.ubahPenggunaUntukGantiKredensial(data.username, data.kataSandiHash, false, data.akun.id, tx);
        await db.hapusSesiPengguna(data.akun.id, tx);
        await db.tambahSesiUntukBuatSesi(data.akun.fasyankes_id, data.akun.id, data.sesiBaru.idHash, data.sesiBaru.alamat?.slice(0, 64), data.sesiBaru.kedaluwarsa, tx);
      });
    } catch (galat) {
      if (db.bentrokUnik(galat)) throw new KonflikUsername();
      throw galat;
    }
  }
}
