import { aksiAntreanTersedia, NILAI_TAHAP_FILTER } from '@klira/shared';
import type { AksiAntrean, AksiIzin, PasienBarisDto, TahapFilter } from '@klira/shared';

/** Keadaan Daftar pasien yang disimpan di alamat (5.1g, 5.1k): pencarian, tahap layanan, halaman. */
export type KeadaanPasien = { cari: string; tahap: TahapFilter; halaman: number };

const tahapSah = (t: string | null): t is TahapFilter => !!t && (NILAI_TAHAP_FILTER as readonly string[]).includes(t);

/**
 * Filter bawaan sesuai pekerjaan akun (3.1): dokter menunggu pemeriksaan, perawat menunggu skrining, apoteker resep menunggu,
 * kasir menunggu pembayaran; selain itu semua. Dokter dikenali dari izin resep, perawat dari izin klinis tanpa resep.
 */
export function tahapBawaan(fitur: readonly string[]): TahapFilter {
  const ada = (f: string) => fitur.includes(f);
  if (ada('klinis') && ada('resep')) return 'pemeriksaan';
  if (ada('klinis')) return 'menunggu_skrining';
  if (ada('farmasi')) return 'resep';
  if (ada('kasir')) return 'kasir';
  return 'semua';
}

/** Baca keadaan dari alamat; tahap yang tidak ada di alamat memakai `bawaan` (diingat sesi atau bawaan pekerjaan). */
export function keadaanPasienDariQuery(search: string, bawaan: TahapFilter): KeadaanPasien {
  const q = new URLSearchParams(search);
  const halaman = Number(q.get('halaman'));
  const tahap = q.get('tahap');
  return {
    cari: (q.get('cari') ?? '').trim(),
    tahap: tahapSah(tahap) ? tahap : bawaan,
    halaman: Number.isInteger(halaman) && halaman >= 1 ? halaman : 1,
  };
}

/** Query string selalu memuat tahap (agar pilihan "Semua" tidak tertukar bawaan pekerjaan). */
export function queryPasien(k: KeadaanPasien): string {
  const q = new URLSearchParams({ tahap: k.tahap });
  if (k.cari.trim()) q.set('cari', k.cari.trim());
  if (k.halaman > 1) q.set('halaman', String(k.halaman));
  return `?${q.toString()}`;
}

/** Mengubah pencarian atau tahap kembali ke halaman pertama; ganti halaman mempertahankan penyaring. */
export function ubahKeadaanPasien(k: KeadaanPasien, perubahan: Partial<KeadaanPasien>): KeadaanPasien {
  const berubah = (perubahan.cari !== undefined && perubahan.cari !== k.cari) || (perubahan.tahap !== undefined && perubahan.tahap !== k.tahap);
  return { ...k, ...perubahan, halaman: perubahan.halaman ?? (berubah ? 1 : k.halaman) };
}

export type AksiBaris = { jenis: 'buka' | 'daftarkan' | 'skrining' | 'periksa' | 'telaah' | 'persetujuan' | 'order_lab' | 'spesimen' | 'hasil_lab' | 'riwayat' | 'keluarga' | AksiAntrean };
type Boleh = (fitur: string, aksi: AksiIzin) => boolean;

/**
 * Tindakan per baris sesuai tahap dan izin (5.1m): tindakan yang belum tersedia atau tanpa izin tidak ditampilkan.
 * Skrining dan Periksa mengikuti tahap layanan (menunggu skrining atau pemeriksaan) dan izin klinis; Riwayat dan Family folder
 * adalah panel pendamping. Persetujuan tindakan dan Order lab mengikuti tahap berjalan; Ambil spesimen dan Hasil lab untuk pemegang izin penunjang.
 */
export function aksiBaris(baris: PasienBarisDto, boleh: Boleh): AksiBaris[] {
  const hasil: AksiBaris[] = [];
  const k = baris.kunjungan;
  if (k?.antrean && boleh('kunjungan', 'perbaikan')) {
    for (const jenis of aksiAntreanTersedia(k.antrean.status)) hasil.push({ jenis });
  }
  if (k?.tahap_layanan === 'menunggu_skrining' && boleh('klinis', 'input')) hasil.push({ jenis: 'skrining' });
  if (k?.tahap_layanan === 'pemeriksaan' && boleh('klinis', 'input')) hasil.push({ jenis: 'periksa' });
  if (k?.tahap_layanan === 'resep' && boleh('farmasi', 'input')) hasil.push({ jenis: 'telaah' });
  if (!k && boleh('kunjungan', 'input')) hasil.push({ jenis: 'daftarkan' });
  const berjalan = !!k && k.tahap_layanan !== 'menunggu_skrining' && k.tahap_layanan !== 'ditutup';
  if (berjalan && boleh('persetujuan', 'input')) hasil.push({ jenis: 'persetujuan' });
  if (berjalan && boleh('klinis', 'input')) hasil.push({ jenis: 'order_lab' });
  if (berjalan && boleh('penunjang', 'input')) hasil.push({ jenis: 'spesimen' }, { jenis: 'hasil_lab' });
  if (boleh('pasien', 'lihat') || boleh('rekam-medis', 'lihat')) hasil.push({ jenis: 'buka' });
  if (boleh('klinis', 'lihat') || boleh('rekam-medis', 'lihat')) hasil.push({ jenis: 'riwayat' });
  if (boleh('pasien', 'lihat') || boleh('klinis', 'lihat') || boleh('rekam-medis', 'lihat')) hasil.push({ jenis: 'keluarga' });
  return hasil;
}

/** Lama menunggu sejak `mulai` (ISO) dalam jam dan menit utuh; tidak negatif. */
export function lamaMenunggu(mulai: string, sekarang: Date): { jam: number; menit: number } {
  const selisih = Math.max(0, Math.floor((sekarang.getTime() - new Date(mulai).getTime()) / 60_000));
  return { jam: Math.floor(selisih / 60), menit: selisih % 60 };
}

/** Pintasan keyboard fokus pencarian (5.1l): tombol "/" di luar isian. */
export function adalahPintasanCari(e: { key: string; ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean; target?: unknown }): boolean {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return false;
  const sasaran = e.target as { tagName?: string; isContentEditable?: boolean } | null | undefined;
  const tag = sasaran?.tagName?.toUpperCase();
  return !(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || sasaran?.isContentEditable);
}
