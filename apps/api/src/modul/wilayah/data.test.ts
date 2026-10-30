import { ambilWilayah, cariWilayah, dataWilayah } from './data';

test('snapshot lengkap, kode unik, semua induk tersedia, termasuk nama berapostrof', () => {
  const data = dataWilayah();
  expect(Object.keys(data)).toHaveLength(91599);
  expect(Object.keys(data).filter((k) => k.split('.').length === 4)).toHaveLength(83762);
  for (const kode of Object.keys(data)) {
    expect(kode).toMatch(/^\d{2}(\.\d{2}){0,2}(\.\d{4})?$/);
    if (kode.includes('.')) expect(data[kode.slice(0, kode.lastIndexOf('.'))]).toBeTruthy();
  }
  expect(ambilWilayah('11.01.02.2018')?.nama).toBe("Pasi Kuala Ba'u");
});

test('resolusi kode berisi seluruh hierarki, kode asing tidak dibuatkan nama palsu', () => {
  expect(ambilWilayah('11.01.01.2001')).toEqual({ kode: '11.01.01.2001', nama: 'Keude Bakongan', label: 'Keude Bakongan, Bakongan, Kabupaten Aceh Selatan, Aceh' });
  expect(ambilWilayah('99.01.01.2001')).toBeNull();
});

test('pencarian desa membedakan nama sama dengan konteks wilayah, membatasi hasil', () => {
  const h = cariWilayah('sukamaju');
  expect(h.data.length).toBe(20);
  expect(h.lebih_banyak).toBe(true);
  expect(new Set(h.data.map((w) => w.kode)).size).toBe(20);
  for (const w of h.data) expect(w.kode.split('.')).toHaveLength(4);
  const spesifik = cariWilayah('keude bakongan aceh selatan');
  expect(spesifik.data).toContainEqual(ambilWilayah('11.01.01.2001'));
  expect(cariWilayah("Pasi Kuala Ba'u").data).toContainEqual(ambilWilayah('11.01.02.2018'));
  expect(cariWilayah('a').data).toEqual([]);
  expect(cariWilayah('tidak-ada-wilayah-ini').data).toEqual([]);
});
