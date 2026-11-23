import { jest } from '@jest/globals';
import { buatLayananKeuangan } from './layanan.js';

const P = { id: 1, fasyankes_id: 1, nama: 'Admin' };

function buatMock() {
    const repo = {
        ringkasanKeuangan: jest.fn(async () => ({
            laba_rugi: { pendapatan: 500000, beban: 150000, laba_bersih: 350000 },
            arus_kas: { masuk: 500000, keluar: 150000, bersih: 350000 },
            total_piutang: 100000,
            total_hutang: 200000,
            per_akun: [],
        })),
        daftarCoa: jest.fn(async () => [{ id: 1, kode: '1101', nama: 'Kas Tunai', tipe: 'aset' }]),
        tambahCoa: jest.fn(async (_f, m) => ({ id: 10, ...m, aktif: 1 })),
        daftarJurnal: jest.fn(async () => []),
        catatJurnal: jest.fn(async (_f, j) => ({ id: 5, nomor: 'JRN-20261123-01', tanggal: j.tanggal, total: 100000 })),
        daftarPengeluaran: jest.fn(async () => []),
        tambahPengeluaran: jest.fn(async (_f, m) => ({ id: 7, ...m })),
        daftarFakturSupplier: jest.fn(async () => []),
        tambahFakturSupplier: jest.fn(async (_f, m) => ({ id: 8, ...m, terbayar: 0, status: 'belum' })),
        bayarHutangSupplier: jest.fn(async () => ({ ok: true, data: { id: 8, nomor_faktur: 'INV-1', terbayar: 50000, status: 'sebagian' } })),
        daftarPiutang: jest.fn(async () => []),
        tambahPiutang: jest.fn(async () => ({ ok: true, id: 9 })),
        bayarPiutang: jest.fn(async () => ({ ok: true, data: { id: 9, kunjungan_id: 12, terbayar: 100000, status: 'lunas' } })),
        rekapJasaMedis: jest.fn(async () => [{ praktisi_nama: 'dr. Budi', jumlah_item: 2, total_jasa_dpjp: 100000, total_jasa_perawat: 20000, total_jasa_klinik: 30000 }]),
    };
    const audit = { catat: jest.fn(async () => {}) };
    return { repo, audit, layanan: buatLayananKeuangan({ repo, audit }) };
}

describe('Layanan Keuangan & Akuntansi', () => {
    test('ringkasan dan jasa medis mengembalikan data dari repositori', async () => {
        const { layanan } = buatMock();
        const r = await layanan.ringkasan(P, {});
        expect(r.ok).toBe(true);
        expect(r.data.laba_rugi.laba_bersih).toBe(350000);
        const jm = await layanan.jasaMedis(P, {});
        expect(jm.ok).toBe(true);
        expect(jm.data[0].total_jasa_dpjp).toBe(100000);
    });

    test('tambahCoa menolak duplikat kode akun', async () => {
        const { repo, layanan } = buatMock();
        repo.tambahCoa.mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' }));
        const r = await layanan.tambahCoa(P, { kode: '1101', nama: 'Duplikat', tipe: 'aset' }, '127.0.0.1');
        expect(r.ok).toBe(false);
        expect(r.kode).toBe('duplikat');
    });

    test('catatJurnalManual menolak jurnal tidak seimbang dan menerima yang seimbang', async () => {
        const { layanan, audit } = buatMock();
        const gagalRes = await layanan.catatJurnalManual(P, {
            tanggal: '2026-11-23',
            keterangan: 'Salah',
            baris: [
                { akun_kode: '1101', debit: 100000, kredit: 0 },
                { akun_kode: '4101', debit: 0, kredit: 50000 },
            ],
        }, '127.0.0.1');
        expect(gagalRes.ok).toBe(false);
        expect(gagalRes.kode).toBe('tidak_seimbang');

        const okRes = await layanan.catatJurnalManual(P, {
            tanggal: '2026-11-23',
            keterangan: 'Setoran modal',
            baris: [
                { akun_kode: '1101', debit: 100000, kredit: 0 },
                { akun_kode: '4101', debit: 0, kredit: 100000 },
            ],
        }, '127.0.0.1');
        expect(okRes.ok).toBe(true);
        expect(audit.catat).toHaveBeenCalled();
    });

    test('tambahPengeluaran, hutang supplier, dan piutang memetakan error dengan tepat', async () => {
        const { repo, layanan } = buatMock();
        const p = await layanan.tambahPengeluaran(P, { tanggal: '2026-11-23', kategori: 'atk', metode: 'tunai', jumlah: 50000, keterangan: 'Kertas' }, '127.0.0.1');
        expect(p.ok).toBe(true);

        const f = await layanan.tambahFakturSupplier(P, { nomor_faktur: 'INV-1', supplier: 'PBF Jaya', tanggal_faktur: '2026-11-23', total: 200000 }, '127.0.0.1');
        expect(f.ok).toBe(true);

        repo.bayarHutangSupplier.mockResolvedValueOnce({ ok: false, sebab: 'melebihi_sisa', sisa: 150000 });
        const bh = await layanan.bayarHutang(P, 8, { tanggal: '2026-11-23', metode: 'transfer', jumlah: 300000 }, '127.0.0.1');
        expect(bh.ok).toBe(false);
        expect(bh.kode).toBe('masukan_tidak_valid');

        repo.tambahPiutang.mockResolvedValueOnce({ ok: false, sebab: 'kunjungan_tidak_ada' });
        const tp = await layanan.tambahPiutang(P, { kunjungan_id: 999, penjamin: 'Asuransi X', total: 100000 }, '127.0.0.1');
        expect(tp.ok).toBe(false);
        expect(tp.kode).toBe('tidak_ditemukan');
    });
});
