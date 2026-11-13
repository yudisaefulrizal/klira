import * as db from '@klira/db';
import { tanggalWib, WEBSITE_KLINIK_BAWAAN } from '@klira/shared';
import type { KlinikPublikDto, WebsiteKlinikDto } from '@klira/shared';

export const pilihWebsite = {
  aktif: true, slug: true, domain: true, judul: true, ringkasan: true, tentang: true, alamat: true,
  whatsapp: true, telepon: true, email: true, jam_operasional: true, warna_utama: true, logo_url: true, hero_url: true,
  tampilkan_jadwal: true, tampilkan_nama_praktisi: true,
} as const;

export async function pengaturanWebsite(id: number): Promise<WebsiteKlinikDto | null> {
  const fas = await db.ambilFasyankesUntukPengaturanWebsite(id);
  return fas ? { ...WEBSITE_KLINIK_BAWAAN, slug: `klinik-${id}`, ...fas.website_klinik, domain: fas.website_klinik?.domain ?? '', nama: fas.nama } : null;
}

export async function bacaKlinikPublik(host: string, slug?: string): Promise<KlinikPublikDto | null> {

  // Domain terikat harus selalu menang; fallback hanya bila seluruh instalasi punya tepat satu website aktif.
  let web = await db.cariWebsiteKlinikUntukBacaKlinikPublik(true, (slug) ? (slug) : undefined, (!(slug)) ? (host.toLowerCase()) : undefined);
  if (!web && !slug) {
    const kandidat = await db.daftarWebsiteKlinikUntukBacaKlinikPublik(true, null, 2);
    const jumlah = await db.hitungWebsiteKlinikUntukBacaKlinikPublik(true);
    web = jumlah === 1 && kandidat.length === 1 ? kandidat[0] : null;
  }
  if (!web) return null;
  const tanggal = new Date(`${tanggalWib(new Date())}T00:00:00Z`);
  const layanan = await db.daftarLokasiUntukBacaKlinikPublik(web.fasyankes_id, 'poli', 'O');
  const baris = web.tampilkan_jadwal ? await db.daftarJadwalPraktikUntukBacaKlinikPublik(web.fasyankes_id, true, tanggal, null, tanggal, layanan.map(l => l.id)) : [];
  return {
    nama: web.fasyankes.nama, slug: web.slug, domain: web.domain ?? '', judul: web.judul, ringkasan: web.ringkasan,
    tentang: web.tentang, alamat: web.alamat, whatsapp: web.whatsapp, telepon: web.telepon, email: web.email,
    jam_operasional: web.jam_operasional, warna_utama: web.warna_utama, logo_url: web.logo_url, hero_url: web.hero_url,
    layanan, jadwal: baris.map(j => ({ hari: j.hari, jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai, poli_id: j.lokasi_id, poli_nama: layanan.find(l => l.id === j.lokasi_id)!.nama, praktisi: web.tampilkan_nama_praktisi ? j.pengguna?.nama ?? null : null })),
  };
}
