import { DEFINISI_MASTER, MASTER, SKEMA_MASTER, SKEMA_MASTER_UBAH } from '@klira/shared';
import type { BarisMaster, BidangMaster, JenisMasterUbah, OpsiMasterDto } from '@klira/shared';
import { galatSkema } from './keadaan-akun';
import type { GalatBidang } from './keadaan-akun';

/** Nilai bentuk MODAL-1 master: semua teks agar kosong dan huruf bisa dikenali sebagai galat. */
export type NilaiMaster = Record<string, string>;

/** Bidang yang tampil: bidang `hanyaTambah` disembunyikan saat ubah. */
export const bidangTampil = (jenis: JenisMasterUbah, ubah: boolean): BidangMaster[] =>
  DEFINISI_MASTER[jenis].bidang.filter((b) => !(ubah && b.hanyaTambah));

/** Isian awal: baris yang diubah, atau nilai awal bidang (kosong bila tidak ada). */
export function awalMaster(jenis: JenisMasterUbah, baris?: BarisMaster): NilaiMaster {
  const nilai: NilaiMaster = {};
  for (const b of bidangTampil(jenis, baris !== undefined)) {
    const v = baris ? baris[b.kunci] : undefined;
    nilai[b.kunci] = baris ? (v === null || v === undefined ? '' : String(v)) : (b.nilaiAwal ?? '');
  }
  return nilai;
}

const kosong = (t: string) => t.trim() === '';

/** Ubah isian teks menjadi masukan skema bersama (angka, id, tanggal; kosong menjadi tidak ada). */
export function bentukMasukan(jenis: JenisMasterUbah, nilai: NilaiMaster, ubah: boolean): Record<string, unknown> {
  const hasil: Record<string, unknown> = {};
  for (const b of bidangTampil(jenis, ubah)) {
    const t = (nilai[b.kunci] ?? '').trim();
    if (b.tipe === 'teks') {
      if (b.wajib || t !== '') hasil[b.kunci] = t;
    } else if (!kosong(t)) {
      hasil[b.kunci] = b.tipe === 'angka' || b.tipe === 'rujukan' || b.numerik ? Number(t) : t;
    }
  }
  return hasil;
}

/** Galat per bidang dari skema bersama; bidang wajib kosong selalu memakai pesan wajib diisi. */
export function galatMaster(jenis: JenisMasterUbah, nilai: NilaiMaster, ubah: boolean): GalatBidang {
  const skema = ubah ? SKEMA_MASTER_UBAH[jenis] : SKEMA_MASTER[jenis];
  const galat = galatSkema(skema, bentukMasukan(jenis, nilai, ubah));
  for (const b of bidangTampil(jenis, ubah)) {
    if (b.wajib && kosong(nilai[b.kunci] ?? '')) galat[b.kunci] = jenis === 'bed' && b.kunci === 'induk_id' ? MASTER.galat.indukBed : MASTER.galat.wajib;
  }
  return galat;
}

export const masterBerubah = (awal: NilaiMaster, nilai: NilaiMaster): boolean =>
  Object.keys(awal).some((k) => (awal[k] ?? '').trim() !== (nilai[k] ?? '').trim());

const KUNCI_NAMA: Record<string, string> = { pengguna_id: 'pengguna_nama', lokasi_id: 'lokasi_nama', induk_id: 'induk_nama' };

/** Opsi rujukan ditambah nilai saat ini (mis. praktisi yang sudah nonaktif) agar pilihan tersimpan tidak hilang. */
export function opsiDenganNilaiSaatIni(opsi: readonly OpsiMasterDto[], kunci: string, baris?: BarisMaster): OpsiMasterDto[] {
  const nilai = baris?.[kunci];
  if (nilai === null || nilai === undefined || nilai === '' || opsi.some((o) => o.nilai === String(nilai))) return [...opsi];
  const nama = baris?.[KUNCI_NAMA[kunci] ?? ''];
  return [{ nilai: String(nilai), label: typeof nama === 'string' ? nama : String(nilai) }, ...opsi];
}
