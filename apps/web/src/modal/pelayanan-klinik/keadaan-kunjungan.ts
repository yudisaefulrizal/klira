import { kunjunganMasukan } from '@klira/shared';
import type { KunjunganKirim } from '@klira/shared';

/** Isian modal Pendaftaran kunjungan; teks agar mudah dikelola di isian. */
export type KeadaanKunjungan = {
  pasien_id: string;
  jenis: 'AMB' | 'IMP';
  lokasi_id: string;
  cara_pembayaran: 'umum' | 'jkn';
  nomor_sep: string;
  keluhan_singkat: string;
};

export const awalKunjungan = (pasienId?: number): KeadaanKunjungan => ({
  pasien_id: pasienId ? String(pasienId) : '', jenis: 'AMB', lokasi_id: '', cara_pembayaran: 'umum', nomor_sep: '', keluhan_singkat: '',
});

const angka = (t: string): number | undefined => (t === '' ? undefined : Number(t));

export function bentukKunjungan(k: KeadaanKunjungan): KunjunganKirim {
  return {
    pasien_id: Number(k.pasien_id) || 0,
    jenis: k.jenis,
    lokasi_id: k.jenis === 'AMB' ? angka(k.lokasi_id) : undefined,
    cara_pembayaran: k.cara_pembayaran,
    nomor_sep: k.cara_pembayaran === 'jkn' ? k.nomor_sep : undefined,
    keluhan_singkat: k.keluhan_singkat,
  };
}

/** Galat per bidang dari skema bersama (kunci = nama bidang). */
export function galatKunjungan(k: KeadaanKunjungan): Record<string, string> {
  const r = kunjunganMasukan.safeParse(bentukKunjungan(k));
  const hasil: Record<string, string> = {};
  if (!r.success) for (const i of r.error.issues) hasil[String(i.path[0])] ??= i.message;
  return hasil;
}

/** Perubahan jenis atau cara pembayaran membersihkan isian yang tidak berlaku. */
export function ubahKunjungan(k: KeadaanKunjungan, p: Partial<KeadaanKunjungan>): KeadaanKunjungan {
  const baru = { ...k, ...p };
  if (baru.cara_pembayaran !== 'jkn') baru.nomor_sep = '';
  if (baru.jenis !== 'AMB') baru.lokasi_id = '';
  return baru;
}
