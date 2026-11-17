import { bisaCetakBayar, susunBuktiBayar } from './keadaan-cetak-bayar.js';
const g = (pembayaran, total = 150000) => ({
    kunjungan: { id: 9, pasien_nama: 'Putu', pasien_nomor_rm: '00-00-007', fasyankes_nama: 'Klinik Bhakti Rahayu' },
    tagihan: { total, dibayar: pembayaran.reduce((s, p) => s + p.jumlah, 0), sisa: Math.max(0, total - pembayaran.reduce((s, p) => s + p.jumlah, 0)),
        item: [{ nama: 'Konsultasi', jumlah: 1, harga: 100000 }, { nama: 'Obat A', jumlah: 5, harga: 10000 }], pembayaran },
});
test('bukti memuat subtotal item, pembayaran urut waktu, dan kasir terakhir', () => {
    const b = susunBuktiBayar(g([
        { metode: 'qris', jumlah: 50000, waktu: '2026-11-16T03:10:00.000Z', kasir_nama: 'Rina' },
        { metode: 'tunai', jumlah: 100000, waktu: '2026-11-16T03:00:00.000Z', kasir_nama: 'Sari' },
    ]));
    expect(b.item.map((i) => i.subtotal)).toEqual([100000, 50000]);
    expect(b.pembayaran.map((p) => p.metode)).toEqual(['tunai', 'qris']);
    expect(b.kasir).toBe('Rina');
    expect(b).toMatchObject({ klinik: 'Klinik Bhakti Rahayu', total: 150000, dibayar: 150000, sisa: 0, lunas: true });
});
test('pembayaran sebagian ditandai belum lunas dan hanya bisa dicetak bila ada pembayaran', () => {
    const sebagian = g([{ metode: 'tunai', jumlah: 50000, waktu: '2026-11-16T03:00:00.000Z', kasir_nama: 'Sari' }]);
    expect(susunBuktiBayar(sebagian)).toMatchObject({ sisa: 100000, lunas: false });
    expect(bisaCetakBayar(sebagian)).toBe(true);
    expect(bisaCetakBayar(g([]))).toBe(false);
    expect(bisaCetakBayar(null)).toBe(false);
});
