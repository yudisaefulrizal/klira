import { WEBSITE_KLINIK_BAWAAN } from '@klira/shared';
import { htmlKlinikPublik } from './html';
const template = '<html><head><title>Klira</title></head><body><div id="root"></div></body></html>';
test('HTML awal berisi identitas publik, metadata, dan data bootstrap yang aman dari injeksi script', () => {
  const data = { ...WEBSITE_KLINIK_BAWAAN, nama: 'Klinik <B>', ringkasan: 'Sehat "bersama" </script><script>alert(1)</script>', layanan: [{ id: 1, nama: 'Poli <Umum>' }], jadwal: [] };
  const html = htmlKlinikPublik(template, data);
  expect(html).toContain('<title>Klinik &lt;B&gt;');
  expect(html).toContain('type="application/ld+json"');
  expect(html).toContain('window.__KLINIK_PUBLIK__=');
  expect(html).not.toContain('</script><script>alert(1)');
  expect(html).toContain('\\u003c/script>');
  expect(html).toContain('Poli &lt;Umum&gt;');
});
test('halaman yang tidak diterbitkan tidak memiliki bootstrap profil dan tidak diindeks', () => {
  const html = htmlKlinikPublik(template, null);
  expect(html).toContain('noindex'); expect(html).not.toContain('__KLINIK_PUBLIK__');
});
