import { resepMasukan, telaahMasukan } from '@klira/shared';
import { samaItemResep } from './repositori';

describe('resep teks bebas dan item oleh farmasi (P3)', () => {
  it('resep dokter hanya teks: wajib, dirapikan, maksimal 2000 karakter', () => {
    expect(resepMasukan.parse({ teks: '  R/ Parasetamol 500 mg tab ½, CTM 4 mg tab ½, m.f. pulv. dtd No. X, s 3 dd pulv I  ' }).teks).toMatch(/^R\/ .* pulv I$/);
    expect(resepMasukan.safeParse({ teks: '  ' }).success).toBe(false);
    expect(resepMasukan.safeParse({ teks: 'x'.repeat(2001) }).success).toBe(false);
    expect(resepMasukan.safeParse({ item: [{ master_obat_id: 1, aturan_pakai: '3 x 1', jumlah: 1 }] }).success).toBe(false);
  });

  it('telaah membawa item: boleh kosong, obat sama boleh dua kali, jumlah bulat minimal 1, aturan pakai wajib', () => {
    const dasar = { administratif: true, farmasetik: true, klinis: true };
    expect(telaahMasukan.parse(dasar).item).toEqual([]);
    const ganda = telaahMasukan.parse({ ...dasar, item: [{ master_obat_id: 1, aturan_pakai: '3 x 1', jumlah: '10' }, { master_obat_id: 1, aturan_pakai: 'racikan', bentuk: 'puyer', jumlah: 5 }] });
    expect(ganda.item.map((i) => i.jumlah)).toEqual([10, 5]);
    expect(telaahMasukan.safeParse({ ...dasar, item: [{ master_obat_id: 1, aturan_pakai: '3 x 1', jumlah: 0 }] }).success).toBe(false);
    expect(telaahMasukan.safeParse({ ...dasar, item: [{ master_obat_id: 1, aturan_pakai: '3 x 1', jumlah: 1.5 }] }).success).toBe(false);
    expect(telaahMasukan.safeParse({ ...dasar, item: [{ master_obat_id: 1, aturan_pakai: ' ', jumlah: 1 }] }).success).toBe(false);
  });

  it('item resep dan tagihannya hanya diganti bila daftar item berubah', () => {
    const a = [{ master_obat_id: 1, aturan_pakai: '3 x 1', bentuk: null, rute: null, jumlah: 10 }, { master_obat_id: 1, aturan_pakai: 'racikan', bentuk: 'puyer', rute: null, jumlah: 5 }];
    expect(samaItemResep(a, a.map((x) => ({ ...x })))).toBe(true);
    expect(samaItemResep(a, [a[1], a[0]])).toBe(false);
    expect(samaItemResep(a, [a[0]])).toBe(false);
    expect(samaItemResep(a, [{ ...a[0], jumlah: 11 }, a[1]])).toBe(false);
    expect(samaItemResep(a, [a[0], { ...a[1], rute: 'oral' }])).toBe(false);
    expect(samaItemResep([], [])).toBe(true);
  });
});
