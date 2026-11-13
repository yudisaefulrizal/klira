import { jest } from '@jest/globals';

const { bayarMasukan, rincianBayar } = await import("./kasir.js");

describe('bayarMasukan (beberapa metode)', () => {
    it('menerima 1 sampai 3 baris dengan metode berbeda', () => {
        expect(bayarMasukan.safeParse({ pembayaran: [{ metode: 'tunai', jumlah: '5000' }] }).success).toBe(true);
        expect(bayarMasukan.safeParse({ pembayaran: [{ metode: 'tunai', jumlah: 1 }, { metode: 'transfer', jumlah: 2 }, { metode: 'qris', jumlah: 3 }] }).success).toBe(true);
    });
    it('menolak kosong, lebih dari 3 baris, metode ganda, metode asing, jumlah tidak sah, dan bentuk lama', () => {
        expect(bayarMasukan.safeParse({ pembayaran: [] }).success).toBe(false);
        expect(bayarMasukan.safeParse({}).success).toBe(false);
        expect(bayarMasukan.safeParse({ metode: 'tunai', jumlah: 5000 }).success).toBe(false);
        const empat = ['tunai', 'transfer', 'qris', 'tunai'].map((metode) => ({ metode, jumlah: 1 }));
        expect(bayarMasukan.safeParse({ pembayaran: empat }).success).toBe(false);
        const ganda = bayarMasukan.safeParse({ pembayaran: [{ metode: 'qris', jumlah: 1 }, { metode: 'qris', jumlah: 2 }] });
        expect(ganda.success).toBe(false);
        expect(ganda.error?.issues[0].path).toEqual(['pembayaran', 1, 'metode']);
        expect(bayarMasukan.safeParse({ pembayaran: [{ metode: 'cek', jumlah: 1 }] }).success).toBe(false);
        expect(bayarMasukan.safeParse({ pembayaran: [{ metode: 'tunai', jumlah: 0 }] }).success).toBe(false);
        expect(bayarMasukan.safeParse({ pembayaran: [{ metode: 'tunai', jumlah: '' }] }).success).toBe(false);
    });
});

describe('rincianBayar', () => {
    it('non-tunai diterapkan penuh, tunai sebatas sisa, kembalian hanya dari tunai', () => {
        const r = rincianBayar([{ metode: 'transfer', jumlah: 50_000 }, { metode: 'tunai', jumlah: 50_000 }], 80_000);
        expect(r).toMatchObject({ diterima: 100_000, non_tunai: 50_000, diterapkan: 80_000, kembalian: 20_000, non_tunai_lebih: false });
        expect(r.per_baris.map((b) => b.diterapkan)).toEqual([50_000, 30_000]);
    });
    it('pembayaran sebagian dan non-tunai melebihi sisa', () => {
        expect(rincianBayar([{ metode: 'qris', jumlah: 10_000 }, { metode: 'tunai', jumlah: 5000 }], 80_000)).toMatchObject({ diterapkan: 15_000, kembalian: 0 });
        expect(rincianBayar([{ metode: 'transfer', jumlah: 50_000 }, { metode: 'qris', jumlah: 40_000 }], 80_000).non_tunai_lebih).toBe(true);
    });
    it('tunai seluruhnya kembalian bila non-tunai sudah menutup sisa', () => {
        const r = rincianBayar([{ metode: 'qris', jumlah: 80_000 }, { metode: 'tunai', jumlah: 10_000 }], 80_000);
        expect(r).toMatchObject({ diterapkan: 80_000, kembalian: 10_000 });
        expect(r.per_baris[1].diterapkan).toBe(0);
    });
});