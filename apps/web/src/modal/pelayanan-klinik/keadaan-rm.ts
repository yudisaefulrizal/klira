import { GALAT, pengkodeanMasukan } from '@klira/shared';
import type { PengkodeanDto } from '@klira/shared';

type Isu = { path: PropertyKey[]; message: string };
const petakan = (isu: readonly Isu[]): Record<string, string> => {
  const g: Record<string, string> = {};
  for (const i of isu) g[i.path.map(String).join('.') || ''] ??= i.message;
  return g;
};

// ---- Pengkodean ICD ----
export type KodeDiagnosis = { kode: string; nama: string; peran: 'utama' | 'penyerta' };
export type KodeTindakan = { kode: string; nama: string };
export type KeadaanKode = { diagnosis: KodeDiagnosis[]; tindakan: KodeTindakan[]; catatan: string };

/** Awal formulir: kode final bila sudah ada, jika tidak disalin dari catatan dokter (boleh diubah perekam medis). */
export function awalKode(d: Pick<PengkodeanDto, 'final' | 'dokter'>): KeadaanKode {
  if (d.final) return { diagnosis: d.final.diagnosis.map((x) => ({ ...x })), tindakan: d.final.tindakan.map((x) => ({ ...x })), catatan: '' };
  return { diagnosis: d.dokter.diagnosis.map((x) => ({ ...x })), tindakan: d.dokter.tindakan.map((x) => ({ ...x })), catatan: '' };
}

/** Menambah diagnosis: kode huruf besar, tidak ganda; diagnosis pertama otomatis utama. */
export function tambahKode(daftar: readonly KodeDiagnosis[], d: { kode: string; nama: string }): KodeDiagnosis[] {
  const kode = d.kode.trim().toUpperCase();
  if (daftar.some((x) => x.kode === kode)) return [...daftar];
  return [...daftar, { kode, nama: d.nama.trim(), peran: daftar.length === 0 ? 'utama' : 'penyerta' }];
}
export const jadikanKodeUtama = (daftar: readonly KodeDiagnosis[], kode: string): KodeDiagnosis[] => daftar.map((x) => ({ ...x, peran: x.kode === kode ? 'utama' : 'penyerta' }));
/** Membuang diagnosis; bila yang utama dibuang, yang pertama tersisa menjadi utama. */
export function buangKode(daftar: readonly KodeDiagnosis[], kode: string): KodeDiagnosis[] {
  const sisa = daftar.filter((x) => x.kode !== kode);
  return sisa.length && !sisa.some((x) => x.peran === 'utama') ? sisa.map((x, i) => ({ ...x, peran: i === 0 ? 'utama' : 'penyerta' })) : sisa;
}
export function tambahKodeTindakan(daftar: readonly KodeTindakan[], t: { kode: string; nama: string }): KodeTindakan[] {
  const kode = t.kode.trim();
  return daftar.some((x) => x.kode === kode) ? [...daftar] : [...daftar, { kode, nama: t.nama.trim() }];
}
export const buangKodeTindakan = (daftar: readonly KodeTindakan[], kode: string): KodeTindakan[] => daftar.filter((x) => x.kode !== kode);

export const bentukKode = (k: KeadaanKode) => ({ diagnosis: k.diagnosis, tindakan: k.tindakan, catatan: k.catatan.trim() || null });
export const galatKode = (k: KeadaanKode): Record<string, string> => petakan(pengkodeanMasukan.safeParse(bentukKode(k)).error?.issues ?? []);
/** Perubahan terhadap kode final tersimpan (mengubah butuh catatan sebagai alasan). */
export function berubahDariFinal(k: KeadaanKode, d: Pick<PengkodeanDto, 'final'>): boolean {
  if (!d.final) return true;
  return JSON.stringify({ diagnosis: k.diagnosis, tindakan: k.tindakan }) !== JSON.stringify({ diagnosis: d.final.diagnosis.map((x) => ({ kode: x.kode, nama: x.nama, peran: x.peran })), tindakan: d.final.tindakan.map((x) => ({ kode: x.kode, nama: x.nama })) });
}
export const perluCatatanKode = (k: KeadaanKode, d: Pick<PengkodeanDto, 'final'>): boolean => !!d.final && berubahDariFinal(k, d) && k.catatan.trim() === '';

// ---- Tinjau perbaikan ----
/** Isi catatan menjadi baris teks "kunci: nilai" agar mudah dibandingkan peninjau; larik diringkas per butir. */
export function ringkasIsi(isi: unknown): string[] {
  if (isi === null || isi === undefined) return [];
  if (typeof isi !== 'object') return [String(isi)];
  const baris: string[] = [];
  for (const [kunci, nilai] of Object.entries(isi as Record<string, unknown>)) {
    if (Array.isArray(nilai)) {
      baris.push(`${kunci}:`);
      nilai.forEach((x, i) => baris.push(`  ${i + 1}. ${typeof x === 'object' && x ? Object.values(x as Record<string, unknown>).filter((v) => v !== null && v !== '').join(' · ') : String(x)}`));
    } else if (nilai !== null && nilai !== '') {
      baris.push(`${kunci}: ${typeof nilai === 'object' ? JSON.stringify(nilai) : String(nilai)}`);
    }
  }
  return baris;
}

/** Baris yang berubah antara isi sekarang dan usulan (untuk penanda di peninjauan). */
export function selisihBaris(sekarang: readonly string[], usulan: readonly string[]): { sekarang: { teks: string; beda: boolean }[]; usulan: { teks: string; beda: boolean }[] } {
  const a = new Set(sekarang);
  const b = new Set(usulan);
  return { sekarang: sekarang.map((teks) => ({ teks, beda: !b.has(teks) })), usulan: usulan.map((teks) => ({ teks, beda: !a.has(teks) })) };
}

// ---- Perbaiki catatan ----
export const alasanPerbaikanSah = (alasan: string): boolean => alasan.trim().length > 0;
export const galatAlasanPerbaikan = (alasan: string): string | null => (alasanPerbaikanSah(alasan) ? null : GALAT.alasanWajib);
