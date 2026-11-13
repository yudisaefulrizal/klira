import * as db from '@klira/db';
import type { PersetujuanTindakanDto, TeksPersetujuanDto } from '@klira/shared';

export type KunjunganPersetujuan = { id: number; pasien_id: number; tahap_layanan: string };
export type PasienPersetujuan = { id: number; nama: string; tidak_cakap: boolean };
export type Wali = { id: number; hubungan: string; nama: string };
export type Saksi = { id: number; nama: string };

export type DataPersetujuan = {
  fasyankesId: number;
  pasienId: number;
  kunjunganId: number;
  oleh: number;
  teks: TeksPersetujuanDto;
  tindakanKode: string | null;
  tindakanNama: string;
  penjelasan: string;
  bentuk: 'tertulis' | 'lisan';
  penandatangan: 'pasien' | 'wali';
  waliId: number | null;
  penandatanganNama: string;
  saksiId: number;
  waktu: Date;
};

export interface RepositoriPersetujuan {
  kunjungan(fasyankesId: number, id: number): Promise<KunjunganPersetujuan | null>;
  pasien(fasyankesId: number, id: number): Promise<PasienPersetujuan | null>;
  teksAktif(fasyankesId: number): Promise<TeksPersetujuanDto | null>;
  teksUntukPakai(fasyankesId: number, id: number): Promise<TeksPersetujuanDto | null>;
  wali(fasyankesId: number, pasienId: number): Promise<Wali[]>;
  /** Tenaga kesehatan aktif (berprofil profesi aktif) yang dapat menjadi saksi. */
  saksiOpsi(fasyankesId: number): Promise<Saksi[]>;
  saksi(fasyankesId: number, id: number): Promise<Saksi | null>;
  catat(d: DataPersetujuan): Promise<PersetujuanTindakanDto>;
  daftar(fasyankesId: number, kunjunganId: number): Promise<PersetujuanTindakanDto[]>;
}



export class RepositoriPersetujuanMysql implements RepositoriPersetujuan {
  async kunjungan(fasyankesId: number, id: number): Promise<KunjunganPersetujuan | null> {
    return db.cariKunjunganUntukKunjungan(id, fasyankesId);
  }

  async pasien(fasyankesId: number, id: number): Promise<PasienPersetujuan | null> {
    return db.cariPasienUntukPasien3(id, fasyankesId);
  }

  async teksAktif(fasyankesId: number): Promise<TeksPersetujuanDto | null> {
    // Teks klinik sendiri didahulukan, lalu teks bawaan; yang aktif dengan versi tertinggi.
    for (const fas of [fasyankesId, null]) {
      const t = await db.cariTeksPersetujuanUntukTeksAktif(fas, 'tindakan', true);
      if (t) return t;
    }
    return null;
  }

  async teksUntukPakai(fasyankesId: number, id: number): Promise<TeksPersetujuanDto | null> {
    return db.cariTeksPersetujuanUntukTeksUntukPakai(id, 'tindakan', true, fasyankesId, null);
  }

  async wali(fasyankesId: number, pasienId: number): Promise<Wali[]> {
    return db.daftarWaliKeluargaUntukWali(fasyankesId, pasienId);
  }

  async saksiOpsi(fasyankesId: number): Promise<Saksi[]> {
    return db.daftarPenggunaUntukSaksiOpsi(fasyankesId, true, 300);
  }

  async saksi(fasyankesId: number, id: number): Promise<Saksi | null> {
    return db.cariPenggunaUntukSaksi(id, fasyankesId, true);
  }

  async catat(d: DataPersetujuan): Promise<PersetujuanTindakanDto> {
    const p = await db.transaksi(async koneksiBaru => { const _hasil = await db.tambahPersetujuanUntukCatat(d.fasyankesId, d.pasienId, 'tindakan', d.teks.id, d.teks.versi, d.teks.tujuan, d.penjelasan, d.bentuk, 'diberikan', d.waktu, d.penandatangan, d.waliId, d.penandatanganNama, d.saksiId, d.kunjunganId, d.tindakanKode, d.tindakanNama, d.oleh, koneksiBaru); return db.tambahPersetujuanUntukDaftarkanHasil(_hasil.id, koneksiBaru); });
    return (await this.daftarDari(d.fasyankesId, [p]))[0];
  }

  async daftar(fasyankesId: number, kunjunganId: number): Promise<PersetujuanTindakanDto[]> {
    return this.daftarDari(
      fasyankesId, await db.daftarPersetujuanUntukDaftar(fasyankesId, kunjunganId, 'tindakan', 200),
    );
  }

  private async daftarDari(
    fasyankesId: number,
    baris: { id: number; kunjungan_id: number | null; tindakan_kode: string | null; tindakan_nama: string | null; versi_teks: number; tujuan: string; penjelasan: string | null; bentuk: string; status: string; waktu: Date;
      penandatangan: string; penandatangan_nama: string; saksi_pengguna_id: number | null; dibuat_oleh: number | null }[],
  ): Promise<PersetujuanTindakanDto[]> {
    const ids = [...new Set(baris.flatMap((b) => [b.saksi_pengguna_id, b.dibuat_oleh].filter((x): x is number => !!x)))];
    const pengguna = ids.length ? await db.daftarPenggunaUntukRiwayat(ids, fasyankesId) : [];
    const nama = new Map(pengguna.map((x) => [x.id, x.nama]));
    return baris.map((b) => ({
      id: b.id, kunjungan_id: b.kunjungan_id, tindakan_kode: b.tindakan_kode, tindakan_nama: b.tindakan_nama, versi_teks: b.versi_teks, tujuan: b.tujuan, penjelasan: b.penjelasan,
      bentuk: b.bentuk as 'tertulis' | 'lisan', status: b.status, waktu: b.waktu.toISOString(), penandatangan: b.penandatangan as 'pasien' | 'wali', penandatangan_nama: b.penandatangan_nama,
      saksi_nama: b.saksi_pengguna_id ? nama.get(b.saksi_pengguna_id) ?? null : null, dicatat_oleh_nama: b.dibuat_oleh ? nama.get(b.dibuat_oleh) ?? null : null,
    }));
  }
}
