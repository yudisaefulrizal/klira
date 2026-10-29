import type { JenisMaster } from '@klira/shared';

export const KELOMPOK_MASTER = [
  { id: 'layanan', path: '/pasien/layanan', induk: '/pasien', halaman: 'Daftar pasien', judul: 'Kelola layanan', keterangan: 'Poli, profil praktisi, dan jadwal praktik.', jenis: ['poli', 'praktisi', 'jadwal'] },
  { id: 'ruangan', path: '/rawat-inap/ruangan', induk: '/rawat-inap', halaman: 'Rawat inap', judul: 'Kelola ruangan', keterangan: 'Ruang perawatan dan bed.', jenis: ['ruang', 'bed'] },
  { id: 'tarif', path: '/kasir-klaim/tarif', induk: '/kasir-klaim', halaman: 'Kasir dan klaim', judul: 'Tarif layanan', keterangan: 'Tarif layanan untuk penagihan dan pembayaran.', jenis: ['tarif'] },
] as const satisfies readonly { id: string; path: string; induk: string; halaman: string; judul: string; keterangan: string; jenis: readonly JenisMaster[] }[];
export type KelompokMaster = (typeof KELOMPOK_MASTER)[number];
export type IdKelompokMaster = KelompokMaster['id'];

export function jenisMasterDiHalaman(search: string, daftar: readonly JenisMaster[]): JenisMaster {
  const jenis = new URLSearchParams(search).get('jenis');
  return daftar.find(j => j === jenis) ?? daftar[0] ?? 'poli';
}

/** Bookmark lama tetap menuju jenis dan penyaring yang sama di halaman pemiliknya. */
export function tujuanMasterLama(search: string): string | null {
  const lama = new URLSearchParams(search);
  if (lama.get('tab') !== 'master') return null;
  const jenis = lama.get('jenis');
  const tujuan = KELOMPOK_MASTER.find(k => (k.jenis as readonly string[]).includes(jenis ?? ''));
  if (!tujuan) return null;
  const query = new URLSearchParams();
  for (const kunci of ['jenis', 'cari', 'status', 'halaman']) {
    const nilai = lama.get(kunci);
    if (nilai) query.set(kunci, nilai);
  }
  query.set('kembali', '/pengaturan?tab=master');
  return `${tujuan.path}?${query}`;
}

export function tautanKelolaMaster(kelompok: KelompokMaster, kembali: string): string {
  return `${kelompok.path}?${new URLSearchParams({ kembali })}`;
}

/** Hanya alamat internal halaman asal yang sah; izin halaman asal tetap diperiksa. */
export function alamatKembaliMaster(search: string, kelompok: KelompokMaster, diizinkan: readonly string[]): string {
  const fallback = diizinkan.includes(kelompok.induk) ? kelompok.induk : '/pengaturan?tab=master';
  const nilai = new URLSearchParams(search).get('kembali');
  if (!nilai?.startsWith('/') || nilai.startsWith('//')) return fallback;
  try {
    const url = new URL(nilai, 'https://klira.invalid');
    if (url.origin !== 'https://klira.invalid' || ![kelompok.induk, '/pengaturan'].includes(url.pathname) || !diizinkan.includes(url.pathname)) return fallback;
    return `${url.pathname}${url.search}`;
  } catch { return fallback; }
}
