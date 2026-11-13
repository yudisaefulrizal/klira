import * as db from '@klira/db';
import { dataWilayah } from '../../wilayah/data-access/data';
import { AWALAN_KODE_TINDAKAN, SKEMA_MASTER } from '@klira/shared';
import type { BarisMaster, FilterMaster, JenisMaster, JenisMasterUbah, OpsiMasterDto, SumberOpsiMaster, z } from '@klira/shared';

export type MasukanMaster = { [J in JenisMasterUbah]: z.infer<(typeof SKEMA_MASTER)[J]> };
export type HasilDaftar = { total: number; baris: BarisMaster[] };

export interface RepositoriMaster {
  daftar(fasyankesId: number, jenis: JenisMaster, f: FilterMaster): Promise<HasilDaftar>;
  ambil(fasyankesId: number, jenis: JenisMasterUbah, id: number): Promise<BarisMaster | null>;
  buat(fasyankesId: number, jenis: JenisMasterUbah, data: MasukanMaster[JenisMasterUbah], oleh: number): Promise<BarisMaster>;
  /** Ubah baris milik fasyankes ini; praktisi tidak mengubah pengguna_id. */
  ubah(fasyankesId: number, jenis: JenisMasterUbah, id: number, data: Partial<MasukanMaster[JenisMasterUbah]>): Promise<BarisMaster>;
  setAktif(fasyankesId: number, jenis: JenisMasterUbah, id: number, aktif: boolean): Promise<BarisMaster>;
  opsi(fasyankesId: number, sumber: SumberOpsiMaster, cari?: string): Promise<OpsiMasterDto[]>;
  lokasiAda(fasyankesId: number, id: number, jenis: 'poli' | 'ruang'): Promise<boolean>;
  penggunaAda(fasyankesId: number, id: number): Promise<boolean>;
  punyaProfil(fasyankesId: number, penggunaId: number): Promise<boolean>;
  tarifKodeAda(fasyankesId: number, kode: string, kecualiId?: number): Promise<boolean>;
  /** Kode tarif berawalan TND- milik fasyankes (untuk membuat kode tindakan otomatis berikutnya). */
  kodeTarifTindakan(fasyankesId: number): Promise<string[]>;
  tambahRiwayatProfil(fasyankesId: number, jenis: 'sip', penggunaId: number, ringkasan: string, oleh: number): Promise<void>;
}

const tgl = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);
const LOKASI = ['poli', 'ruang', 'bed'] as const;
const UKURAN_OPSI = 500;

const barisLokasi = (l: { id: number; nama: string; induk_id: number | null; status_operasional: 'U' | 'O'; ihs_location_id: string | null; induk: { nama: string } | null }): BarisMaster => ({
  id: l.id, aktif: l.status_operasional === 'O', nama: l.nama, induk_id: l.induk_id, induk_nama: l.induk?.nama ?? null,
  status_operasional: l.status_operasional, ihs_location_id: l.ihs_location_id,
});
const barisPraktisi = (p: { id: number; pengguna_id: number; profesi: string; nomor_sip: string | null; masa_berlaku_sip: Date | null; ihs_practitioner_id: string | null; aktif: boolean; pengguna: { nama: string } }): BarisMaster => ({
  id: p.id, aktif: p.aktif, pengguna_id: p.pengguna_id, pengguna_nama: p.pengguna.nama, profesi: p.profesi, nomor_sip: p.nomor_sip,
  masa_berlaku_sip: tgl(p.masa_berlaku_sip), ihs_practitioner_id: p.ihs_practitioner_id,
});
type BarisJadwal = { id: number; pengguna_id: number; lokasi_id: number; hari: number; jam_mulai: string; jam_selesai: string; kuota: number; berlaku_dari: Date; berlaku_sampai: Date | null; aktif: boolean; pengguna: { nama: string }; lokasi: { nama: string } };
const barisJadwal = (j: BarisJadwal): BarisMaster => ({
  id: j.id, aktif: j.aktif, pengguna_id: j.pengguna_id, pengguna_nama: j.pengguna.nama, lokasi_id: j.lokasi_id, lokasi_nama: j.lokasi.nama,
  hari: j.hari, jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai, kuota: j.kuota, berlaku_dari: tgl(j.berlaku_dari), berlaku_sampai: tgl(j.berlaku_sampai),
});
const barisTarif = (t: { id: number; kode: string; nama: string; jenis: string; harga_umum: number | null; harga_jkn: number | null; kode_icd9cm: string | null; aktif: boolean }): BarisMaster => ({
  id: t.id, aktif: t.aktif, kode: t.kode, nama: t.nama, jenis: t.jenis, harga_umum: t.harga_umum, harga_jkn: t.harga_jkn, kode_icd9cm: t.kode_icd9cm,
});
/** Data tarif dari masukan; kode sudah dipastikan terisi oleh layanan (dibuat otomatis untuk tindakan). */
const dataTarif = (d: MasukanMaster['tarif']) => ({ kode: d.kode ?? '', nama: d.nama, jenis: d.jenis, harga_umum: d.harga_umum, harga_jkn: d.harga_jkn, kode_icd9cm: d.kode_icd9cm });





export class RepositoriMasterMysql implements RepositoriMaster {
  async daftar(fasyankesId: number, jenis: JenisMaster, f: FilterMaster): Promise<HasilDaftar> {
    const halaman = { skip: (f.halaman - 1) * f.ukuran, take: f.ukuran };
    const cari = f.cari;
    const aktif = f.status === 'semua' ? undefined : f.status === 'aktif';
    if (jenis === 'poli' || jenis === 'ruang' || jenis === 'bed') {

      const [total, data] = await Promise.all([
        db.hitungLokasiUntukDaftar(fasyankesId, jenis, (!(aktif === undefined)) ? (aktif ? 'O' : 'U') : undefined, cari, cari, cari),
        db.daftarLokasiUntukDaftar(fasyankesId, jenis, (!(aktif === undefined)) ? (aktif ? 'O' : 'U') : undefined, cari, cari, cari, f.ukuran, (f.halaman - 1) * f.ukuran),
      ]);
      return { total, baris: data.map(barisLokasi) };
    }
    if (jenis === 'praktisi') {

      const [total, data] = await Promise.all([
        db.hitungProfilProfesiUntukDaftar(fasyankesId, (!(aktif === undefined)) ? (aktif) : undefined, cari, cari, cari),
        db.daftarProfilProfesiUntukDaftar(fasyankesId, (!(aktif === undefined)) ? (aktif) : undefined, cari, cari, cari, f.ukuran, (f.halaman - 1) * f.ukuran),
      ]);
      return { total, baris: data.map(barisPraktisi) };
    }
    if (jenis === 'jadwal') {

      const [total, data] = await Promise.all([
        db.hitungJadwalPraktikUntukDaftar(fasyankesId, (!(aktif === undefined)) ? (aktif) : undefined, cari, cari),
        db.daftarJadwalPraktikUntukDaftar(fasyankesId, (!(aktif === undefined)) ? (aktif) : undefined, cari, cari, f.ukuran, (f.halaman - 1) * f.ukuran),
      ]);
      return { total, baris: data.map(barisJadwal) };
    }
    if (jenis === 'tarif') {

      const [total, data] = await Promise.all([
        db.hitungTarifLayananUntukDaftar(fasyankesId, (!(aktif === undefined)) ? (aktif) : undefined, cari, cari, cari),
        db.daftarTarifLayananUntukDaftar(fasyankesId, (!(aktif === undefined)) ? (aktif) : undefined, cari, cari, cari, f.ukuran, (f.halaman - 1) * f.ukuran),
      ]);
      return { total, baris: data.map(barisTarif) };
    }
    // Wilayah adalah referensi statis aplikasi, tidak memerlukan tabel database.
    const tingkat = ['provinsi', 'kabupaten_kota', 'kecamatan', 'kelurahan_desa'] as const;
    const kata = cari?.toLocaleLowerCase('id');
    const data = Object.entries(dataWilayah()).map(([kode, nama], i) => ({
      id: i + 1, aktif: true, kode, nama, tingkat: tingkat[kode.split('.').length - 1],
      induk_kode: kode.includes('.') ? kode.slice(0, kode.lastIndexOf('.')) : null, contoh: false,
    })).filter((w) => (!f.tingkat || w.tingkat === f.tingkat) && (!kata || w.kode.includes(kata) || w.nama.toLocaleLowerCase('id').includes(kata)));
    return { total: data.length, baris: data.slice(halaman.skip, halaman.skip + halaman.take) };
  }

  async ambil(fasyankesId: number, jenis: JenisMasterUbah, id: number): Promise<BarisMaster | null> {
    if ((LOKASI as readonly string[]).includes(jenis)) {
      const l = await db.cariLokasiUntukAmbil(id, fasyankesId, jenis as 'poli');
      return l ? barisLokasi(l) : null;
    }
    if (jenis === 'praktisi') {
      const p = await db.cariProfilProfesiUntukAmbil(id, fasyankesId);
      return p ? barisPraktisi(p) : null;
    }
    if (jenis === 'jadwal') {
      const j = await db.cariJadwalPraktikUntukAmbil(id, fasyankesId);
      return j ? barisJadwal(j) : null;
    }
    const t = await db.cariTarifLayananUntukAmbil(id, fasyankesId);
    return t ? barisTarif(t) : null;
  }

  async buat(fasyankesId: number, jenis: JenisMasterUbah, data: MasukanMaster[JenisMasterUbah], oleh: number): Promise<BarisMaster> {

    if (jenis === 'poli' || jenis === 'ruang' || jenis === 'bed') {
      const d = data as MasukanMaster['ruang'];
      const l = await db.transaksi(async koneksiBaru => { const _hasil = await db.tambahLokasiUntukBuat(fasyankesId, d.nama, jenis, jenis === 'poli' ? null : (d.induk_id ?? null), d.status_operasional, d.ihs_location_id ?? null, oleh, koneksiBaru); return db.tambahLokasiUntukBuatHasil(_hasil.id, koneksiBaru); });
      return barisLokasi(l);
    }
    if (jenis === 'praktisi') {
      const d = data as MasukanMaster['praktisi'];
      const p = await db.transaksi(async koneksiBaru => { const _hasil = await db.tambahProfilProfesiUntukBuat(fasyankesId, d.pengguna_id, d.profesi, d.nomor_sip ?? null, d.masa_berlaku_sip ?? null, d.ihs_practitioner_id ?? null, oleh, koneksiBaru); return db.tambahProfilProfesiUntukBuatHasil(_hasil.id, koneksiBaru); });
      return barisPraktisi(p);
    }
    if (jenis === 'jadwal') {
      const d = data as MasukanMaster['jadwal'];
      const j = await db.transaksi(async koneksiBaru => { const _hasil = await db.tambahJadwalPraktikUntukBuat(fasyankesId, d.pengguna_id, d.lokasi_id, d.hari, d.jam_mulai, d.jam_selesai, d.kuota, d.berlaku_dari, d.berlaku_sampai ?? null, oleh, koneksiBaru); return db.tambahJadwalPraktikUntukBuatHasil(_hasil.id, koneksiBaru); });
      return barisJadwal(j);
    }
    const d = data as MasukanMaster['tarif'];
    return barisTarif(await db.transaksi(async koneksiBaru => { const _hasil = await db.tambahTarifLayananUntukBuat(fasyankesId, (dataTarif(d))?.kode, (dataTarif(d))?.nama, (dataTarif(d))?.jenis, (dataTarif(d))?.harga_umum, (dataTarif(d))?.harga_jkn, (dataTarif(d))?.kode_icd9cm, oleh, koneksiBaru); return db.tambahTarifLayananUntukBuatHasil(_hasil.id, koneksiBaru); }));
  }

  async ubah(fasyankesId: number, jenis: JenisMasterUbah, id: number, data: Partial<MasukanMaster[JenisMasterUbah]>): Promise<BarisMaster> {
    // Kunci fasyankes_id di where agar tidak pernah melintasi klinik, walau pemanggil lupa memeriksa.
    if ((LOKASI as readonly string[]).includes(jenis)) {
      const d = data as MasukanMaster['ruang'];
      await db.ubahLokasiUntukUbah(d.nama, (!(jenis === 'poli')) ? (d.induk_id ?? null) : (undefined), d.status_operasional, d.ihs_location_id ?? null, id, fasyankesId);
    } else if (jenis === 'praktisi') {
      const d = data as Partial<MasukanMaster['praktisi']>;
      await db.ubahProfilProfesiUntukUbah(d.profesi, d.nomor_sip ?? null, d.masa_berlaku_sip ?? null, d.ihs_practitioner_id ?? null, id, fasyankesId);
    } else if (jenis === 'jadwal') {
      const d = data as MasukanMaster['jadwal'];
      await db.ubahJadwalPraktikUntukUbah(d.pengguna_id, d.lokasi_id, d.hari, d.jam_mulai, d.jam_selesai, d.kuota, d.berlaku_dari, d.berlaku_sampai ?? null, id, fasyankesId);
    } else {
      const d = data as MasukanMaster['tarif'];
      await db.ubahTarifLayananUntukUbah((dataTarif(d))?.kode, (dataTarif(d))?.nama, (dataTarif(d))?.jenis, (dataTarif(d))?.harga_umum, (dataTarif(d))?.harga_jkn, (dataTarif(d))?.kode_icd9cm, id, fasyankesId);
    }
    return (await this.ambil(fasyankesId, jenis, id)) as BarisMaster;
  }

  async setAktif(fasyankesId: number, jenis: JenisMasterUbah, id: number, aktif: boolean): Promise<BarisMaster> {

    if ((LOKASI as readonly string[]).includes(jenis)) await db.ubahLokasiUntukSetAktif(aktif ? 'O' : 'U', id, fasyankesId);
    else if (jenis === 'praktisi') await db.ubahProfilProfesiUntukSetAktif(aktif, id, fasyankesId);
    else if (jenis === 'jadwal') await db.ubahJadwalPraktikUntukSetAktif(aktif, id, fasyankesId);
    else await db.ubahTarifLayananUntukSetAktif(aktif, id, fasyankesId);
    return (await this.ambil(fasyankesId, jenis, id)) as BarisMaster;
  }

  async opsi(fasyankesId: number, sumber: SumberOpsiMaster, cari?: string): Promise<OpsiMasterDto[]> {
    if (sumber === 'poli' || sumber === 'ruang') {
      const l = await db.daftarLokasiUntukOpsi(fasyankesId, sumber, 'O', (cari) ? (cari) : undefined, UKURAN_OPSI);
      return l.map((x) => ({ nilai: String(x.id), label: x.nama }));
    }
    if (sumber === 'praktisi') {
      const p = await db.daftarPenggunaUntukOpsi(fasyankesId, true, (cari) ? (cari) : undefined, UKURAN_OPSI);
      return p.map((x) => ({ nilai: String(x.id), label: x.nama }));
    }
    const p = await db.daftarPenggunaUntukOpsi2(fasyankesId, true, (cari) ? (cari) : undefined, UKURAN_OPSI);
    return p.map((x) => ({ nilai: String(x.id), label: x.nama }));
  }

  async lokasiAda(fasyankesId: number, id: number, jenis: 'poli' | 'ruang'): Promise<boolean> {
    return (await db.hitungLokasiUntukLokasiAda(id, fasyankesId, jenis)) > 0;
  }

  async penggunaAda(fasyankesId: number, id: number): Promise<boolean> {
    return (await db.hitungPenggunaUntukPenggunaAda(id, fasyankesId)) > 0;
  }

  async punyaProfil(fasyankesId: number, penggunaId: number): Promise<boolean> {
    return (await db.hitungProfilProfesiUntukPunyaProfil(penggunaId, fasyankesId)) > 0;
  }

  async tarifKodeAda(fasyankesId: number, kode: string, kecualiId?: number): Promise<boolean> {
    return (await db.hitungTarifLayananUntukTarifKodeAda(fasyankesId, kode, (kecualiId) ? (kecualiId) : undefined)) > 0;
  }

  async kodeTarifTindakan(fasyankesId: number): Promise<string[]> {
    const t = await db.daftarTarifLayananUntukKodeTarifTindakan(fasyankesId, AWALAN_KODE_TINDAKAN);
    return t.map((x) => x.kode);
  }

  async tambahRiwayatProfil(fasyankesId: number, jenis: 'sip', penggunaId: number, ringkasan: string, oleh: number): Promise<void> {
    await db.tambahRiwayatProfilUntukTambahRiwayatProfil(fasyankesId, jenis, penggunaId, ringkasan.slice(0, 2000), oleh);
  }
}
