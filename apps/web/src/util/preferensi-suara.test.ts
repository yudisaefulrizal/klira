import { bacaPreferensiSuara, kunciPreferensiSuara, simpanPreferensiSuara } from './preferensi-suara';
const buat = () => { const data = new Map<string, string>(); return { data, getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); } }; };
test('pilihan aktif dan nonaktif bertahan pada pembacaan ulang', () => {
  const simpanan = buat(); expect(bacaPreferensiSuara('7', simpanan)).toBe(false);
  expect(simpanPreferensiSuara('7', true, simpanan)).toBe(true); expect(bacaPreferensiSuara('7', simpanan)).toBe(true);
  simpanPreferensiSuara('7', false, simpanan); expect(bacaPreferensiSuara('7', simpanan)).toBe(false);
});
test('pilihan terpisah per fasilitas dan ID dengan nol awal dinormalisasi', () => {
  const simpanan = buat(); simpanPreferensiSuara('007', true, simpanan);
  expect(bacaPreferensiSuara('7', simpanan)).toBe(true); expect(bacaPreferensiSuara('8', simpanan)).toBe(false);
});
test('ID tidak sah tidak membaca atau menulis preferensi global', () => {
  const simpanan = buat();
  for (const id of [undefined, '', 'abc', '0', '-1', '9007199254740992']) {
    expect(kunciPreferensiSuara(id)).toBeNull(); expect(simpanPreferensiSuara(id, true, simpanan)).toBe(false); expect(bacaPreferensiSuara(id, simpanan)).toBe(false);
  }
  expect(simpanan.data.size).toBe(0);
});
test('storage diblokir atau rusak tidak merusak layar', () => {
  const diblokir = { getItem: () => { throw new Error('diblokir'); }, setItem: () => { throw new Error('diblokir'); } };
  expect(bacaPreferensiSuara('7', diblokir)).toBe(false); expect(simpanPreferensiSuara('7', true, diblokir)).toBe(false);
  const simpanan = buat(); simpanan.setItem(kunciPreferensiSuara('7')!, 'asing'); expect(bacaPreferensiSuara('7', simpanan)).toBe(false);
});
