import { prisma } from '@klira/db';
import { tanggalWib, WEBSITE_KLINIK_BAWAAN } from '@klira/shared';
import type { KlinikPublikDto, WebsiteKlinikDto } from '@klira/shared';

export const pilihWebsite = {
  aktif: true, slug: true, domain: true, judul: true, ringkasan: true, tentang: true, alamat: true,
  whatsapp: true, telepon: true, email: true, jam_operasional: true, warna_utama: true, logo_url: true, hero_url: true,
  tampilkan_jadwal: true, tampilkan_nama_praktisi: true,
} as const;

export async function pengaturanWebsite(id: number): Promise<WebsiteKlinikDto | null> {
  const fas = await prisma.fasyankes.findUnique({ where: { id }, select: { nama: true, website_klinik: { select: pilihWebsite } } });
  return fas ? { ...WEBSITE_KLINIK_BAWAAN, slug: `klinik-${id}`, ...fas.website_klinik, domain: fas.website_klinik?.domain ?? '', nama: fas.nama } : null;
}

export async function bacaKlinikPublik(host: string, slug?: string): Promise<KlinikPublikDto | null> {
  const pilih = { ...pilihWebsite, fasyankes_id: true, fasyankes: { select: { nama: true } } } as const;
  // Domain terikat harus selalu menang; fallback hanya bila seluruh instalasi punya tepat satu website aktif.
  let web = await prisma.websiteKlinik.findFirst({ where: { aktif: true, ...(slug ? { slug } : { domain: host.toLowerCase() }) }, select: pilih });
  if (!web && !slug) {
    const kandidat = await prisma.websiteKlinik.findMany({ where: { aktif: true, domain: null }, select: pilih, take: 2, orderBy: { id: 'asc' } });
    const jumlah = await prisma.websiteKlinik.count({ where: { aktif: true } });
    web = jumlah === 1 && kandidat.length === 1 ? kandidat[0] : null;
  }
  if (!web) return null;
  const tanggal = new Date(`${tanggalWib(new Date())}T00:00:00Z`);
  const layanan = await prisma.lokasi.findMany({ where: { fasyankes_id: web.fasyankes_id, jenis: 'poli', status_operasional: 'O' }, select: { id: true, nama: true }, orderBy: { nama: 'asc' } });
  const baris = web.tampilkan_jadwal ? await prisma.jadwalPraktik.findMany({
    where: { fasyankes_id: web.fasyankes_id, aktif: true, berlaku_dari: { lte: tanggal }, OR: [{ berlaku_sampai: null }, { berlaku_sampai: { gte: tanggal } }], lokasi_id: { in: layanan.map(l => l.id) }, pengguna: { aktif: true, fasyankes_id: web.fasyankes_id, profil_profesi: { some: { aktif: true, fasyankes_id: web.fasyankes_id } } } },
    select: { hari: true, jam_mulai: true, jam_selesai: true, lokasi_id: true, pengguna: { select: { nama: true } } },
    orderBy: [{ hari: 'asc' }, { jam_mulai: 'asc' }],
  }) : [];
  return {
    nama: web.fasyankes.nama, slug: web.slug, domain: web.domain ?? '', judul: web.judul, ringkasan: web.ringkasan,
    tentang: web.tentang, alamat: web.alamat, whatsapp: web.whatsapp, telepon: web.telepon, email: web.email,
    jam_operasional: web.jam_operasional, warna_utama: web.warna_utama, logo_url: web.logo_url, hero_url: web.hero_url,
    layanan, jadwal: baris.map(j => ({ hari: j.hari, jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai, poli_id: j.lokasi_id, poli_nama: layanan.find(l => l.id === j.lokasi_id)!.nama, praktisi: web.tampilkan_nama_praktisi ? j.pengguna?.nama ?? null : null })),
  };
}
