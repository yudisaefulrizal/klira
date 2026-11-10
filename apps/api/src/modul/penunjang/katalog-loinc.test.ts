import { cariKatalogLoinc } from './katalog-loinc';

describe('katalog LOINC (JSON statis)', () => {
  it('mencari per kata tanpa peduli huruf besar dan membatasi jumlah hasil', () => {
    const hasil = cariKatalogLoinc('HEMOGLOBIN blood', 10);
    expect(hasil.length).toBeGreaterThan(0);
    expect(hasil.length).toBeLessThanOrEqual(10);
    for (const h of hasil) expect(h.nama.toLowerCase()).toContain('hemoglobin');
  });

  it('kode persis didahulukan dan namanya benar', () => {
    expect(cariKatalogLoinc('718-7', 5)[0]).toMatchObject({ kode: '718-7', nama: expect.stringContaining('Hemoglobin') });
  });

  it('kueri berbentuk kode hanya cocok sebagai awalan kode, tanpa derau dari kode lain', () => {
    const hasil = cariKatalogLoinc('718-7', 20);
    expect(hasil[0].kode).toBe('718-7');
    for (const h of hasil) expect(h.kode.startsWith('718-7')).toBe(true);
  });

  it('pemeriksaan kuantitatif umum didahulukan (Hemoglobin [Mass/volume] in Blood sebelum [Presence])', () => {
    expect(cariKatalogLoinc('hemoglobin blood', 5)[0].kode).toBe('718-7');
    expect(cariKatalogLoinc('hemoglobin', 3).map((h) => h.kode)).toContain('718-7');
  });

  it('kueri kurang dari dua huruf atau tanpa kecocokan mengembalikan daftar kosong', () => {
    expect(cariKatalogLoinc('a', 10)).toEqual([]);
    expect(cariKatalogLoinc('zzzzqqqq', 10)).toEqual([]);
  });

  it('hanya memuat kode laboratorium aktif (mis. kode tanda vital bukan kelas lab tidak termasuk)', () => {
    expect(cariKatalogLoinc('2345-7', 3)[0]).toMatchObject({ kode: '2345-7', kelas: 'CHEM' });
  });
});
