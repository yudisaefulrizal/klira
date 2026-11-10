import { aksiAntreanTersedia } from '@klira/shared';
import type { AksiAntrean, AksiIzin, PasienBarisDto } from '@klira/shared';

/** Pencarian, tanggal, dan halaman tetap tersimpan di alamat; seluruh tahap memakai satu tabel. */
export type KeadaanPasien = { cari: string; halaman: number; tanggal?: string };

export function keadaanPasienDariQuery(search: string): KeadaanPasien {
  const q = new URLSearchParams(search);
  const halaman = Number(q.get('halaman'));
  return {
    ...(q.get('tanggal') ? { tanggal: q.get('tanggal')! } : {}),
    cari: (q.get('cari') ?? '').trim(),
    halaman: Number.isInteger(halaman) && halaman >= 1 ? halaman : 1,
  };
}

export function queryPasien(k: KeadaanPasien): string {
  const q = new URLSearchParams();
  if (k.tanggal) q.set('tanggal', k.tanggal);
  if (k.cari.trim()) q.set('cari', k.cari.trim());
  if (k.halaman > 1) q.set('halaman', String(k.halaman));
  return q.size ? `?${q.toString()}` : '';
}

/** Mengubah pencarian atau tanggal kembali ke halaman pertama. */
export function ubahKeadaanPasien(k: KeadaanPasien, perubahan: Partial<KeadaanPasien>): KeadaanPasien {
  const berubah = (perubahan.tanggal !== undefined && perubahan.tanggal !== k.tanggal) || (perubahan.cari !== undefined && perubahan.cari !== k.cari);
  return { ...k, ...perubahan, halaman: perubahan.halaman ?? (berubah ? 1 : k.halaman) };
}

export type AksiBaris = { ubah?: boolean; jenis: 'buka' | 'daftarkan' | 'skrining' | 'periksa' | 'telaah' | 'bayar' | 'serah_obat' | 'tutup_kunjungan' | 'persetujuan' | 'order_lab' | 'spesimen' | 'hasil_lab' | 'riwayat' | 'keluarga' | AksiAntrean };
type Boleh = (fitur: string, aksi: AksiIzin) => boolean;

/**
 * Tindakan per baris sesuai tahap dan izin (5.1m): tindakan yang belum tersedia atau tanpa izin tidak ditampilkan.
 * Skrining dan Periksa mengikuti tahap layanan (menunggu skrining atau pemeriksaan) dan izin klinis; Riwayat dan Family folder
 * adalah panel pendamping. Persetujuan tindakan dan Order lab mengikuti tahap berjalan; Ambil spesimen dan Hasil lab untuk pemegang izin penunjang.
 */
export function aksiBaris(baris: PasienBarisDto, boleh: Boleh): AksiBaris[] {
  const hasil: AksiBaris[] = [];
  const k = baris.kunjungan;
  if (k?.antrean?.status === 'batal') {
    return aksiBaris({ ...baris, kunjungan: null }, boleh);
  }
  if (k?.antrean && k.tahap_layanan !== 'ditutup' && boleh('kunjungan', 'perbaikan')) {
    for (const jenis of aksiAntreanTersedia(k.antrean.status)) {
      if (jenis === 'panggil' || jenis === 'batal') hasil.push({ jenis });
    }
  }
  // Skrining, Periksa, dan Telaah tetap tampil di semua tahap: aktif saat gilirannya, sebagai ubahan (perbaikan tercatat) setelah terlewati.
  const urutan = ['menunggu_skrining', 'pemeriksaan', 'resep', 'kasir', 'ditutup'];
  const tahap = k ? urutan.indexOf(k.tahap_layanan) : -1;
  const langkah: { jenis: 'skrining' | 'periksa' | 'telaah'; idx: number; izin: [string, AksiIzin] }[] = [
    { jenis: 'skrining', idx: 0, izin: ['klinis', 'input'] }, { jenis: 'periksa', idx: 1, izin: ['klinis', 'input'] }, { jenis: 'telaah', idx: 2, izin: ['farmasi', 'input'] },
  ];
  // Telaah resep dan Serahkan obat hanya untuk kunjungan yang punya resep.
  const perluResep = (jenis: string) => jenis !== 'telaah' || !!k?.ada_resep;
  for (const l of langkah) if (k && tahap === l.idx && boleh(...l.izin) && perluResep(l.jenis)) hasil.push({ jenis: l.jenis });
  for (const l of langkah) if (k && tahap > l.idx && boleh(...l.izin) && perluResep(l.jenis)) hasil.push({ jenis: l.jenis, ubah: true });
  if (k?.tahap_layanan === 'kasir' && k.ada_resep && boleh('farmasi', 'input')) hasil.push({ jenis: 'serah_obat' });
  if (k?.tahap_layanan === 'kasir' && boleh('kasir', 'input')) hasil.push({ jenis: 'bayar' });
  if (k?.tahap_layanan === 'kasir' && boleh('kasir', 'perbaikan')) hasil.push({ jenis: 'tutup_kunjungan' });
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

/**
 * Memisahkan tindakan baris menjadi yang langsung tampil (langkah yang sedang berjalan, pembayaran, panggil, dan Ambil spesimen/Hasil lab
 * hanya bila ada order yang menunggu) dan yang masuk menu "Aksi lainnya" (ubahan, riwayat, data pasien, persetujuan, order lab, batal).
 */
export function kelompokAksi(baris: PasienBarisDto, aksi: readonly AksiBaris[]): { utama: AksiBaris[]; lainnya: AksiBaris[] } {
  const k = baris.kunjungan;
  const langsung = new Set<AksiBaris['jenis']>(['panggil', 'daftarkan', 'skrining', 'periksa', 'telaah', 'bayar', 'serah_obat', 'tutup_kunjungan']);
  const utama: AksiBaris[] = [];
  const lainnya: AksiBaris[] = [];
  for (const a of aksi) {
    const penting = (!a.ubah && langsung.has(a.jenis)) || (a.jenis === 'spesimen' && (k?.lab.perlu_spesimen ?? 0) > 0) || (a.jenis === 'hasil_lab' && (k?.lab.perlu_hasil ?? 0) > 0);
    (penting ? utama : lainnya).push(a);
  }
  return { utama, lainnya };
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
