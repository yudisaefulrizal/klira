import { z } from 'zod';
const alamatGambar = z.string().trim().max(2000).refine(v => !v || /^\/asset\/[a-zA-Z0-9/_.-]+$/.test(v) || (() => { try { return new URL(v).protocol === 'https:'; } catch { return false; } })(), 'Gunakan alamat HTTPS atau aset aplikasi.');
export const websiteKlinikMasukan = z.object({
  aktif: z.boolean(),
  slug: z.string().trim().toLowerCase().min(3).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Gunakan huruf, angka, dan tanda hubung.'),
  domain: z.string().trim().toLowerCase().max(253).refine(v => !v || /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(v), 'Isi nama domain tanpa https:// atau alamat halaman.'),
  judul: z.string().trim().min(1).max(160),
  ringkasan: z.string().trim().max(500),
  tentang: z.string().trim().max(3000),
  alamat: z.string().trim().max(1000),
  whatsapp: z.string().trim().max(25).refine(v => !v || (/^\+?[\d\s()-]{8,25}$/.test(v) && v.replace(/\D/g, '').length >= 8 && v.replace(/\D/g, '').length <= 15), 'Nomor WhatsApp tidak valid.'),
  telepon: z.string().trim().max(40).refine(v => !v || /^\+?[\d\s()-]{5,40}$/.test(v), 'Nomor telepon tidak valid.'),
  email: z.string().trim().max(254).refine(v => !v || z.email().safeParse(v).success, 'Alamat email tidak valid.'),
  jam_operasional: z.string().trim().max(500),
  warna_utama: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Pilih warna yang valid.'),
  logo_url: alamatGambar,
  hero_url: alamatGambar,
  tampilkan_jadwal: z.boolean(),
  tampilkan_nama_praktisi: z.boolean(),
});
export type WebsiteKlinikMasukan = z.infer<typeof websiteKlinikMasukan>;
export const WEBSITE_KLINIK_BAWAAN: WebsiteKlinikMasukan = {
  aktif: false, slug: 'klinik', domain: '', judul: 'Layanan kesehatan untuk Anda dan keluarga.',
  ringkasan: 'Temukan layanan, jadwal praktik, dan informasi kunjungan dalam satu tempat.',
  tentang: '', alamat: '', whatsapp: '', telepon: '', email: '', jam_operasional: '', warna_utama: '#0B6B64', logo_url: '',
  hero_url: '/asset/ilustrasi/klinik-dokter-pasien-berhijab-v1.png', tampilkan_jadwal: true, tampilkan_nama_praktisi: false,
};
export type WebsiteKlinikDto = WebsiteKlinikMasukan & { nama: string };
export type KlinikPublikDto = Omit<WebsiteKlinikDto, 'aktif' | 'tampilkan_jadwal' | 'tampilkan_nama_praktisi'> & {
  layanan: { id: number; nama: string }[];
  jadwal: { hari: number; jam_mulai: string; jam_selesai: string; poli_id: number; poli_nama: string; praktisi: string | null }[];
};
export function nomorWhatsappPublik(nomor: string): string {
  const angka = nomor.replace(/\D/g, '');
  return angka.startsWith('0') ? `62${angka.slice(1)}` : angka;
}
export function tautanWhatsappPublik(nomor: string, nama: string, layanan?: string): string | null {
  const angka = nomorWhatsappPublik(nomor);
  return angka ? `https://wa.me/${angka}?text=${encodeURIComponent(`Halo ${nama}, saya ingin bertanya tentang ${layanan ?? 'layanan dan jadwal kunjungan'}.`)}` : null;
}
