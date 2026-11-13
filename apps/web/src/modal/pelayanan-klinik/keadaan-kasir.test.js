import { jest } from '@jest/globals';
import { awalSerah, bentukSerah, galatSerah } from './keadaan-farmasi.js';
import { KASIR } from '@klira/shared';
import { awalBayar, awalShift, bentukBayar, bisaTutup, daftarSyarat, galatBayar, galatBukaShift, galatTambahItem, galatTutupShift, galatUbahHarga, hapusBaris, hargaDiubah, ringkasBayar, selisihShift, tambahBaris, ubahBaris, ubahHargaTersedia } from './keadaan-kasir.js';
const gambaran = (syarat = {}) => ({ syarat: { tahap_kasir: true, tagihan_lengkap: true, resep_diserahkan: true, lunas: true, ditanggung_jkn: false, ...syarat } });
describe('tambah item dari tarif', () => {
    it('tarif wajib dipilih dan jumlah bilangan bulat minimal 1', () => {
        expect(galatTambahItem('', '1')).toBeTruthy();
        expect(galatTambahItem('3', '0')).toBeTruthy();
        expect(galatTambahItem('3', '1,5')).toBeTruthy();
        expect(galatTambahItem('3', '')).toBeTruthy();
        expect(galatTambahItem('3', '2')).toBeNull();
    });
});
describe('pembayaran', () => {
    const k = (...baris) => ({ baris: baris.map(([metode, jumlah]) => ({ metode: metode, jumlah })) });
    it('awal satu baris tunai berisi sisa tagihan; jumlah wajib bilangan bulat positif dan metode sah', () => {
        expect(awalBayar(80_000)).toEqual({ baris: [{ metode: 'tunai', jumlah: '80000' }] });
        expect(awalBayar(0).baris[0].jumlah).toBe('');
        expect(galatBayar(k(['tunai', '']))['pembayaran.0.jumlah']).toBeTruthy();
        expect(galatBayar(k(['tunai', '0']))['pembayaran.0.jumlah']).toBeTruthy();
        expect(galatBayar(k(['tunai', '1,5']))['pembayaran.0.jumlah']).toBeTruthy();
        expect(galatBayar(k(['qris', '5000']))).toEqual({});
    });
    it('metode ganda ditolak; non-tunai melebihi sisa ditolak, tunai boleh lebih', () => {
        expect(galatBayar(k(['tunai', '1000'], ['tunai', '2000']))['pembayaran.1.metode']).toBeTruthy();
        expect(galatBayar(k(['transfer', '50000'], ['qris', '40000']), 80_000).pembayaran).toBeTruthy();
        expect(galatBayar(k(['transfer', '50000'], ['tunai', '100000']), 80_000)).toEqual({});
    });
    it('tambah baris maks 3 dengan metode belum dipakai dan sisa yang belum tertutup; baris pertama tidak bisa dihapus', () => {
        const satu = { baris: [{ metode: 'tunai', jumlah: '30000' }] };
        const dua = tambahBaris(satu, 80_000);
        expect(dua.baris[1]).toEqual({ metode: 'transfer', jumlah: '50000' });
        const tiga = tambahBaris(dua, 80_000);
        expect(tiga.baris[2]).toEqual({ metode: 'qris', jumlah: '' });
        expect(tambahBaris(tiga, 80_000)).toBe(tiga);
        expect(hapusBaris(tiga, 0)).toBe(tiga);
        expect(hapusBaris(tiga, 1).baris.map((b) => b.metode)).toEqual(['tunai', 'qris']);
        expect(ubahBaris(satu, 0, { metode: 'qris' }).baris[0]).toEqual({ metode: 'qris', jumlah: '30000' });
        expect(bentukBayar(dua)).toEqual({ pembayaran: [{ metode: 'tunai', jumlah: '30000' }, { metode: 'transfer', jumlah: '50000' }] });
    });
    it('ringkasan: diterima, diterapkan dibatasi sisa, kembalian hanya dari tunai', () => {
        expect(ringkasBayar(k(['tunai', '100000']), 80_000)).toEqual({ diterima: 100_000, diterapkan: 80_000, kembalian: 20_000 });
        expect(ringkasBayar(k(['transfer', '50000'], ['tunai', '50000']), 80_000)).toEqual({ diterima: 100_000, diterapkan: 80_000, kembalian: 20_000 });
        expect(ringkasBayar(k(['tunai', '30000'], ['qris', '20000']), 80_000)).toEqual({ diterima: 50_000, diterapkan: 50_000, kembalian: 0 });
        expect(ringkasBayar(k(['tunai', 'abc']), 80_000)).toEqual({ diterima: 0, diterapkan: 0, kembalian: 0 });
    });
});
describe('serah terima', () => {
    it('stok kurang hanya lanjut dengan alasan; tanpa izin tidak mengirim apa pun', () => {
        expect(bentukSerah(awalSerah())).toEqual({});
        expect(galatSerah({ izinkan: true, alasan: '' })).toBeTruthy();
        expect(galatSerah({ izinkan: true, alasan: 'stok fisik ada' })).toBeNull();
        expect(bentukSerah({ izinkan: true, alasan: 'stok fisik ada' })).toEqual({ izinkan_stok_kurang: true, alasan: 'stok fisik ada' });
    });
});
describe('syarat tutup kunjungan', () => {
    it('tahap, tagihan lengkap, dan resep diserahkan wajib; belum lunas butuh alasan', () => {
        expect(daftarSyarat(gambaran()).map((s) => s.kunci)).toEqual(['tahap', 'tagihan', 'resep', 'lunas']);
        expect(bisaTutup(gambaran(), '')).toBe(true);
        expect(bisaTutup(gambaran({ tahap_kasir: false }), '')).toBe(false);
        expect(bisaTutup(gambaran({ tagihan_lengkap: false }), 'alasan')).toBe(false);
        expect(bisaTutup(gambaran({ resep_diserahkan: false }), 'alasan')).toBe(false);
        expect(bisaTutup(gambaran({ lunas: false }), '')).toBe(false);
        expect(bisaTutup(gambaran({ lunas: false }), 'akan melunasi besok')).toBe(true);
        // JKN: biaya diklaim ke BPJS, boleh ditutup tanpa pembayaran dan tanpa alasan; syarat wajib lain tetap berlaku.
        expect(bisaTutup(gambaran({ lunas: false, ditanggung_jkn: true }), '')).toBe(true);
        expect(bisaTutup(gambaran({ lunas: false, ditanggung_jkn: true, resep_diserahkan: false }), '')).toBe(false);
    });
});
describe('shift', () => {
    it('kas awal wajib dan tidak negatif; tutup butuh alasan bila ada selisih', () => {
        expect(galatBukaShift(awalShift()).kas).toBeTruthy();
        expect(galatBukaShift({ kas: '-5', alasan: '' }).kas).toBeTruthy();
        expect(galatBukaShift({ kas: '100000', alasan: '' })).toEqual({});
        expect(galatTutupShift({ kas: '', alasan: '' }, 150_000).kas).toBeTruthy();
        expect(galatTutupShift({ kas: '150000', alasan: '' }, 150_000)).toEqual({});
        expect(galatTutupShift({ kas: '149500', alasan: '' }, 150_000).alasan).toBeTruthy();
        expect(galatTutupShift({ kas: '149500', alasan: 'uang kembalian' }, 150_000)).toEqual({});
        expect(selisihShift({ kas: '149500', alasan: '' }, 150_000)).toBe(-500);
        expect(selisihShift(awalShift(), 150_000)).toBeNull();
    });
});
describe('ubah harga item per kunjungan', () => {
    const item = { id: 1, jenis: 'tindakan', kode: 'TND-001', nama: 'Jahit luka', jumlah: 1, harga: 75_000, order_penunjang_id: null };
    const gambaran = (o = {}) => ({
        kunjungan: { tahap_layanan: o.tahap ?? 'kasir' }, tagihan: { pembayaran: o.bayar ? [{ id: 1 }] : [] },
    });
    it('harga bilangan bulat dan alasan wajib; harga sama ditolak', () => {
        expect(galatUbahHarga('60000', 'Diskon', 75_000)).toEqual({});
        expect(galatUbahHarga('60000', '  ', 75_000).alasan).toBe(KASIR.galat.alasanWajib);
        expect(galatUbahHarga('abc', 'Diskon', 75_000).harga).toBe(KASIR.galat.angka);
        expect(galatUbahHarga('75000', 'Diskon', 75_000).harga).toBe(KASIR.galat.hargaSama);
    });
    it('tersedia untuk item berharga bukan obat, sebelum pembayaran dan sebelum ditutup', () => {
        expect(ubahHargaTersedia(item, gambaran())).toBe(true);
        expect(ubahHargaTersedia({ ...item, jenis: 'obat' }, gambaran())).toBe(false);
        expect(ubahHargaTersedia({ ...item, harga: null }, gambaran())).toBe(false);
        expect(ubahHargaTersedia(item, gambaran({ bayar: true }))).toBe(false);
        expect(ubahHargaTersedia(item, gambaran({ tahap: 'ditutup' }))).toBe(false);
    });
    it('item diubah ditandai bila beralasan dan harga acuan berbeda', () => {
        expect(hargaDiubah({ ...item, harga: 60_000, harga_acuan: 75_000, alasan_ubah_harga: 'Diskon' })).toBe(true);
        expect(hargaDiubah({ ...item, harga_acuan: 75_000, alasan_ubah_harga: null })).toBe(false);
    });
});
