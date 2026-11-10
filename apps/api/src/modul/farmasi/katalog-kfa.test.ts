import { ambilKatalogKfa, cariKatalogKfa } from './katalog-kfa';
import type { KfaLokal } from './katalog-kfa';

const lokal = (kode: string, nama: string, status = 'aktif'): KfaLokal => ({ kode, nama, bentuk_sediaan: 'Tablet', satuan: 'Tablet', status });

describe('katalog KFA (JSON statis)', () => {
  it('mencari per kata, tanpa peduli huruf besar dan urutan, dan membatasi jumlah hasil', () => {
    const hasil = cariKatalogKfa('PARACETAMOL tablet 500', 10);
    expect(hasil.length).toBeGreaterThan(0);
    expect(hasil.length).toBeLessThanOrEqual(10);
    for (const h of hasil) {
      expect(h.nama.toLowerCase()).toContain('paracetamol');
      expect(h.lokal).toBe(false);
    }
  });

  it('kueri kurang dari dua huruf tidak mengembalikan apa pun', () => {
    expect(cariKatalogKfa('a', 10)).toEqual([]);
    expect(cariKatalogKfa('  ', 10)).toEqual([]);
  });

  it('mencari menurut kode dan mengambil satu produk menurut kode', () => {
    const [pertama] = cariKatalogKfa('paracetamol', 1);
    expect(ambilKatalogKfa(pertama.kode)).toMatchObject({ kode: pertama.kode, nama: pertama.nama, lokal: false });
    expect(cariKatalogKfa(pertama.kode, 5).map((h) => h.kode)).toContain(pertama.kode);
    expect(ambilKatalogKfa('kode-tidak-ada')).toBeNull();
  });

  it('katalog memuat nama panjang dan produk nonaktif dengan statusnya', () => {
    const nonaktif = cariKatalogKfa('tidak dipakai', 50);
    expect(nonaktif.length).toBeGreaterThan(0);
    expect(nonaktif.every((h) => h.status === 'nonaktif')).toBe(true);
  });

  it('tambahan klinik ditemukan dan menimpa produk katalog dengan kode yang sama', () => {
    const [asli] = cariKatalogKfa('paracetamol', 1);
    const tambahan = lokal('LOKAL-1', 'Obat Racikan Klinik Uji');
    expect(cariKatalogKfa('racikan klinik uji', 5, [tambahan])[0]).toMatchObject({ kode: 'LOKAL-1', lokal: true });
    expect(cariKatalogKfa('racikan klinik uji', 5)).toEqual([]);

    const timpa = lokal(asli.kode, 'Nama Diperbaiki Klinik', 'nonaktif');
    expect(ambilKatalogKfa(asli.kode, [timpa])).toMatchObject({ nama: 'Nama Diperbaiki Klinik', status: 'nonaktif', lokal: true });
    const hasil = cariKatalogKfa(asli.kode, 5, [timpa]);
    expect(hasil.filter((h) => h.kode === asli.kode)).toHaveLength(1);
    expect(hasil.find((h) => h.kode === asli.kode)?.lokal).toBe(true);
  });
});
