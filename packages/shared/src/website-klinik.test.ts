import { WEBSITE_KLINIK_BAWAAN, websiteKlinikMasukan, nomorWhatsappPublik, tautanWhatsappPublik } from './website-klinik';
test('pengaturan valid, domain/slug dinormalisasi, bidang internal dari klien diabaikan', () => {
  const nilai = websiteKlinikMasukan.parse({ ...WEBSITE_KLINIK_BAWAAN, slug: ' Klinik-Keluarga ', domain: ' Klinik.Example ', email: '  klinik@example.com ', fasyankes_id: 999 });
  expect(nilai).toMatchObject({ slug: 'klinik-keluarga', domain: 'klinik.example', email: 'klinik@example.com' });
  expect(nilai).not.toHaveProperty('fasyankes_id');
});
test('alamat berbahaya, domain dengan path, slug tidak sah, warna dan kontak rusak ditolak', () => {
  for (const nilai of [{ slug: '../masuk' }, { domain: 'https://klinik.example/' }, { hero_url: 'javascript:alert(1)' }, { logo_url: '//asing.example/a.png' }, { hero_url: 'data:image/svg+xml,<svg/>' }, { warna_utama: 'red' }, { whatsapp: '--------' }, { email: 'salah' }]) expect(websiteKlinikMasukan.safeParse({ ...WEBSITE_KLINIK_BAWAAN, ...nilai }).success).toBe(false);
});
test('tautan WhatsApp mengubah nomor lokal dan mengenkode nama serta layanan', () => {
  expect(nomorWhatsappPublik('0812-3456-7890')).toBe('6281234567890');
  const url = new URL(tautanWhatsappPublik('+62 812 3456 7890', 'Klinik A & B', 'Poli Gigi')!);
  expect(url.hostname).toBe('wa.me'); expect(url.pathname).toBe('/6281234567890');
  expect(url.searchParams.get('text')).toContain('Klinik A & B');
  expect(tautanWhatsappPublik('', 'Klinik')).toBeNull();
});
