import { resepMasukan, telaahMasukan } from '@klira/shared';
import { samaItemResep } from './repositori';
import { buatLayananFarmasi } from './layanan';
import type { DependensiFarmasi } from './layanan';

describe('resep teks bebas dan item oleh farmasi (P3)', () => {
  it('resep dokter hanya teks: wajib, dirapikan, maksimal 2000 karakter', () => {
    expect(resepMasukan.parse({ teks: '  R/ Parasetamol 500 mg tab ½, CTM 4 mg tab ½, m.f. pulv. dtd No. X, s 3 dd pulv I  ' }).teks).toMatch(/^R\/ .* pulv I$/);
    expect(resepMasukan.safeParse({ teks: '  ' }).success).toBe(false);
    expect(resepMasukan.safeParse({ teks: 'x'.repeat(2001) }).success).toBe(false);
    expect(resepMasukan.safeParse({ item: [{ master_obat_id: 1, aturan_pakai: '3 x 1', jumlah: 1 }] }).success).toBe(false);
  });

  it('telaah membawa item: boleh tidak dikirim (tanpa default), boleh kosong, obat sama boleh dua kali, jumlah bulat minimal 1, aturan pakai wajib', () => {
    const dasar = { administratif: true, farmasetik: true, klinis: true };
    expect(telaahMasukan.parse(dasar).item).toBeUndefined();
    expect(telaahMasukan.parse({ ...dasar, item: [] }).item).toEqual([]);
    const ganda = telaahMasukan.parse({ ...dasar, item: [{ master_obat_id: 1, aturan_pakai: '3 x 1', jumlah: '10' }, { master_obat_id: 1, aturan_pakai: 'racikan', bentuk: 'puyer', jumlah: 5 }] });
    expect(ganda.item?.map((i) => i.jumlah)).toEqual([10, 5]);
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

  it('telaah tanpa item hanya mencatat telaah; item resep dan tagihan obat tidak disentuh', async () => {
    const resep = { id: 5, nomor_resep: 'R-1', status: 'diajukan', item: [{ id: 1 }] };
    const repo = {
      resep: jest.fn().mockResolvedValue(resep), obatAktifDari: jest.fn().mockResolvedValue([{ id: 1, nama_tampil: 'Parasetamol', harga: 600 }]),
      catatTelaah: jest.fn().mockResolvedValue('ok'),
    } as unknown as DependensiFarmasi['repo'];
    const l = buatLayananFarmasi({ repo, audit: { catat: jest.fn().mockResolvedValue(undefined) } });
    const p = { id: 7, fasyankes_id: 1 };
    const dasar = { administratif: true, farmasetik: true, klinis: true };
    expect(await l.telaah(p, 5, telaahMasukan.parse(dasar))).toMatchObject({ ok: true });
    expect(repo.catatTelaah).toHaveBeenLastCalledWith(1, 5, 7, expect.anything(), null, []);
    expect(repo.obatAktifDari).not.toHaveBeenCalled();
    await l.telaah(p, 5, telaahMasukan.parse({ ...dasar, item: [] }));
    expect(repo.catatTelaah).toHaveBeenLastCalledWith(1, 5, 7, expect.anything(), [], []);
    await l.telaah(p, 5, telaahMasukan.parse({ ...dasar, item: [{ master_obat_id: 1, aturan_pakai: '3 x 1', jumlah: 10 }] }));
    expect(repo.catatTelaah).toHaveBeenLastCalledWith(1, 5, 7, expect.anything(), [expect.objectContaining({ master_obat_id: 1, jumlah: 10 })], expect.any(Array));
  });
});
