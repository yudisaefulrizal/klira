import { jest } from '@jest/globals';
import { FARMASI } from '@klira/shared';
import { perbaruiCatatanPuyer, perbaruiPlan, resepDariServer, teksPlanResep, adaIsianResep, awalMasterObat, awalMutasi, awalResep, awalTelaah, barisDariItem, barisResepKosong, biayaResep, bentukItemResep, bentukMutasi, bentukResep, galatItemResep, galatMasterObat, galatMutasi, galatResep, galatTelaah, gantiJenisMutasi, hapusBarisResep, isiDariObat, opsiRute, perubahanMasterObat, pilihBatch, pilihKfa, telaahLengkap, ubahBarisResep } from './keadaan-farmasi.js';
const kfa = { kode: '93000001', nama: 'Parasetamol 500 mg tablet', bentuk_sediaan: null, satuan: 'tablet', status: 'aktif', lokal: false };
describe('master obat', () => {
    it('memilih KFA mengisi nama dan satuan awal tanpa menimpa isian klinik', () => {
        const k = pilihKfa(awalMasterObat(), kfa);
        expect(k).toMatchObject({ nama_tampil: 'Parasetamol 500 mg tablet', satuan: 'tablet' });
        expect(pilihKfa({ ...k, nama_tampil: 'Parasetamol 500' }, { ...kfa, nama: 'lain' }).nama_tampil).toBe('Parasetamol 500');
    });
    it('tambah butuh kode KFA, nama, satuan, dan harga bilangan bulat tidak negatif', () => {
        const g = galatMasterObat(awalMasterObat(), false);
        expect(Object.keys(g).sort()).toEqual(['harga', 'kfa_kode', 'nama_tampil', 'satuan']);
        expect(galatMasterObat({ ...pilihKfa(awalMasterObat(), kfa), harga: '500' }, false)).toEqual({});
        expect(galatMasterObat({ ...pilihKfa(awalMasterObat(), kfa), harga: '-1' }, false).harga).toBeTruthy();
        expect(galatMasterObat({ ...pilihKfa(awalMasterObat(), kfa), harga: '1,5' }, false).harga).toBeTruthy();
    });
    it('ubah hanya mengirim bidang yang berubah dan tidak menyentuh aktif bila tidak diubah', () => {
        const awal = awalMasterObat({ id: 1, kfa_kode: 'c', kfa_nama: 'n', nama_tampil: 'A', satuan: 'tablet', harga: 500, aktif: false, stok_total: 0, kedaluwarsa_terdekat: null, status_stok: 'habis' });
        expect(perubahanMasterObat(awal, { ...awal, harga: '600' })).toEqual({ harga: '600' });
        expect(perubahanMasterObat(awal, awal)).toEqual({});
    });
});
describe('mutasi stok', () => {
    it('terima butuh batch, kedaluwarsa, dan jumlah; keluar dan koreksi butuh alasan', () => {
        const k = { ...awalMutasi('3'), batch: 'B1', jumlah: '10' };
        expect(Object.keys(galatMutasi(k))).toEqual(['kedaluwarsa']);
        expect(galatMutasi({ ...k, kedaluwarsa: '2030-01-01' })).toEqual({});
        expect(galatMutasi({ ...k, jenis: 'keluar' }).alasan).toBeTruthy();
        expect(galatMutasi({ ...k, jenis: 'koreksi', alasan: 'opname' })).toEqual({});
        expect(galatMutasi({ ...awalMutasi(), batch: 'B', jumlah: '1', kedaluwarsa: '2030-01-01' }).master_obat_id).toBeTruthy();
    });
    it('mengganti jenis mengosongkan batch dan jumlah; memilih batch mengisi kedaluwarsa dan, untuk koreksi, jumlah', () => {
        const stok = [{ id: 1, master_obat_id: 3, batch: 'B1', kedaluwarsa: '2030-01-01', jumlah: 40 }];
        const k = gantiJenisMutasi({ ...awalMutasi('3'), batch: 'B1', jumlah: '9' }, 'koreksi');
        expect(k).toMatchObject({ jenis: 'koreksi', batch: '', jumlah: '' });
        expect(pilihBatch(k, stok, 'B1')).toMatchObject({ batch: 'B1', kedaluwarsa: '2030-01-01', jumlah: '40' });
        expect(pilihBatch(gantiJenisMutasi(awalMutasi('3'), 'keluar'), stok, 'B1').jumlah).toBe('');
        expect(bentukMutasi({ ...k, obatId: '3' }).master_obat_id).toBe(3);
    });
});
describe('resep dokter (obat satu per satu + catatan)', () => {
    const baris = (p = {}) => ({ master_obat_id: '1', jumlah: '10', aturan_pakai: '3 x 1 sesudah makan', bentuk: '', rute: '', ...p });
    it('awal: satu baris obat kosong dengan aturan pakai ditulis dokter, tanpa catatan', () => {
        expect(awalResep()).toEqual({ baris: [{ master_obat_id: '', jumlah: '1', aturan_pakai: '', bentuk: '', rute: 'Oral' }], catatan: '' });
        expect(adaIsianResep(awalResep())).toBe(false);
    });
    it('obat wajib dipilih, aturan pakai wajib, catatan maksimal 1000 karakter dan boleh kosong', () => {
        expect(galatResep(awalResep()).item).toBeTruthy();
        expect(galatResep({ baris: [baris({ aturan_pakai: ' ' })], catatan: '' })['item.0.aturan_pakai']).toBeTruthy();
        expect(galatResep({ baris: [baris()], catatan: '' })).toEqual({});
        expect(galatResep({ baris: [baris()], catatan: 'x'.repeat(1001) }).catatan).toBeTruthy();
        expect(galatResep({ baris: [], catatan: '' }).item).toBeTruthy();
    });
    it('baris yang sepenuhnya kosong diabaikan: tidak divalidasi dan tidak dikirim', () => {
        const kosong = { master_obat_id: '', jumlah: '1', aturan_pakai: '', bentuk: '', rute: 'Oral' };
        const r = { baris: [baris(), kosong], catatan: '' };
        expect(galatResep(r)).toEqual({});
        expect(bentukResep(r).item).toHaveLength(1);
        expect(galatResep({ baris: [kosong, baris(), kosong], catatan: '' })).toEqual({});
        expect(galatResep({ baris: [kosong, kosong], catatan: '' }).item).toBeTruthy();
    });
    it('baris setengah terisi: pesan “Pilih obat dari daftar.” pada baris yang benar di layar', () => {
        const kosong = { master_obat_id: '', jumlah: '1', aturan_pakai: '', bentuk: '', rute: 'Oral' };
        const g = galatResep({ baris: [kosong, baris(), baris({ master_obat_id: '', aturan_pakai: '2 x 1' })], catatan: '' });
        expect(g['item.2.master_obat_id']).toBe('Pilih obat dari daftar.');
        expect(g['item.0.master_obat_id']).toBeUndefined();
        const g2 = galatResep({ baris: [kosong, baris({ aturan_pakai: ' ' })], catatan: '' });
        expect(g2['item.1.aturan_pakai']).toBeTruthy();
    });
    it('bentuk kiriman: item dan catatan; obat sama boleh lebih dari sekali', () => {
        const r = { baris: [baris(), baris({ aturan_pakai: 'racikan' })], catatan: 'Dibuat puyer' };
        expect(bentukResep(r)).toEqual({ item: [{ master_obat_id: 1, jumlah: '10', aturan_pakai: '3 x 1 sesudah makan', bentuk: null, rute: null }, { master_obat_id: 1, jumlah: '10', aturan_pakai: 'racikan', bentuk: null, rute: null }], catatan: 'Dibuat puyer' });
        expect(adaIsianResep(r)).toBe(true);
    });
    it('teks untuk Plan: satu baris per obat lalu catatan', () => {
        const obat = [{ id: 1, nama_tampil: 'Parasetamol 500 mg', satuan: 'tablet' }, { id: 2, nama_tampil: 'Amoksisilin 500 mg', satuan: 'kapsul' }];
        const r = { baris: [baris(), baris({ master_obat_id: '2', jumlah: '15', aturan_pakai: '3 x 1' }), baris({ master_obat_id: '' })], catatan: ' Parasetamol dibuat puyer ' };
        expect(teksPlanResep(r, obat)).toBe('R/ Parasetamol 500 mg No. 10 tablet — 3 x 1 sesudah makan\nR/ Amoksisilin 500 mg No. 15 kapsul — 3 x 1\nCatatan: Parasetamol dibuat puyer');
    });
    it('toggle puyer: aturan pakai otomatis terisi penanda dan catatan resep wajib diisi', () => {
        const puyer = baris({ aturan_pakai: '', puyer: true });
        expect(galatResep({ baris: [puyer], catatan: '' }).catatan).toBeTruthy();
        expect(galatResep({ baris: [puyer], catatan: 'Buat puyer 10 bungkus, 3 x 1' })).toEqual({});
        expect(bentukResep({ baris: [puyer], catatan: 'Buat puyer 10 bungkus' }).item[0]).toMatchObject({
            aturan_pakai: 'Racikan/puyer (lihat catatan)',
            bentuk: 'puyer',
        });
    });
    it('narasi puyer otomatis di catatan resep: membentuk daftar obat dan mempertahankan lanjutan dokter', () => {
        const obat = [{ id: 1, nama_tampil: 'Parasetamol 500 mg' }, { id: 2, nama_tampil: 'Ambroksol 30 mg' }];
        const b1 = [baris({ master_obat_id: '1', puyer: true }), baris({ master_obat_id: '2', puyer: false })];
        expect(perbaruiCatatanPuyer('', b1, obat)).toBe('Parasetamol 500 mg dibuat puyer ');
        const b2 = [baris({ master_obat_id: '1', puyer: true }), baris({ master_obat_id: '2', puyer: true })];
        expect(perbaruiCatatanPuyer('Parasetamol 500 mg dibuat puyer 10 bungkus, 3 x 1', b2, obat))
            .toBe('Parasetamol 500 mg, Ambroksol 30 mg dibuat puyer 10 bungkus, 3 x 1');
        expect(perbaruiCatatanPuyer('Parasetamol 500 mg, Ambroksol 30 mg dibuat puyer 10 bungkus', [baris({ puyer: false })], obat))
            .toBe('10 bungkus');
    });
});
describe('resep tersimpan dan Plan', () => {
    it('isian dari resep tersimpan: item menjadi baris, catatan dari server; resep tanpa item mendapat satu baris kosong', () => {
        const r = resepDariServer({ item: [{ master_obat_id: 1, jumlah: 10, aturan_pakai: '3 x 1', bentuk: 'Tablet', rute: 'Oral' }], catatan: 'Dibuat puyer' });
        expect(r).toEqual({ baris: [{ master_obat_id: '1', jumlah: '10', aturan_pakai: '3 x 1', bentuk: 'Tablet', rute: 'Oral' }], catatan: 'Dibuat puyer' });
        expect(resepDariServer({ item: [], catatan: '' }).baris).toHaveLength(1);
    });
    it('Plan: blok resep lama diganti blok baru; bila tidak ditemukan ditambahkan; terlalu panjang -> null', () => {
        expect(perbaruiPlan('', null, 'Resep:\nA', 100)).toBe('Resep:\nA');
        expect(perbaruiPlan('Istirahat cukup', null, 'Resep:\nA', 100)).toBe('Istirahat cukup\n\nResep:\nA');
        expect(perbaruiPlan('Istirahat cukup\n\nResep:\nA\n\nKontrol 3 hari', 'Resep:\nA', 'Resep:\nB', 100)).toBe('Istirahat cukup\n\nResep:\nB\n\nKontrol 3 hari');
        // blok lama sudah diketik ulang dokter: blok baru ditambahkan di akhir
        expect(perbaruiPlan('Resep: diubah dokter', 'Resep:\nA', 'Resep:\nB', 100)).toBe('Resep: diubah dokter\n\nResep:\nB');
        expect(perbaruiPlan('x'.repeat(95), null, 'Resep:\nA', 100)).toBeNull();
        // karakter khusus ($&) pada blok baru tidak ditafsirkan sebagai pola ganti
        expect(perbaruiPlan('Resep:\nA', 'Resep:\nA', 'Resep:\n$& 5', 100)).toBe('Resep:\n$& 5');
    });
});
describe('item resep (apoteker)', () => {
    it('baris dapat ditambah, diubah, dan dibuang sampai kosong', () => {
        let b = [barisResepKosong()];
        b = ubahBarisResep(b, 0, { master_obat_id: '1', aturan_pakai: '3 x 1' });
        b = [...b, barisResepKosong()];
        expect(b.length).toBe(2);
        expect(hapusBarisResep(b, 0).length).toBe(1);
        expect(hapusBarisResep(hapusBarisResep(b, 0), 0)).toEqual([]);
    });
    it('galat per baris: obat, aturan pakai, jumlah bulat; obat sama boleh dua kali', () => {
        expect(galatItemResep([barisResepKosong()])['item.0.master_obat_id']).toBeTruthy();
        const ok = ubahBarisResep([barisResepKosong()], 0, { master_obat_id: '1', aturan_pakai: '3 x 1', jumlah: '5' });
        expect(galatItemResep(ok)).toEqual({});
        expect(galatItemResep([])).toEqual({});
        expect(galatItemResep(ubahBarisResep(ok, 0, { jumlah: '0' }))['item.0.jumlah']).toBeTruthy();
        expect(galatItemResep(ubahBarisResep(ok, 0, { jumlah: '2.5' }))['item.0.jumlah']).toBeTruthy();
        expect(galatItemResep(ubahBarisResep(ok, 0, { aturan_pakai: '' }))['item.0.aturan_pakai']).toBeTruthy();
        expect(galatItemResep([...ok, ...ok])).toEqual({});
        expect(bentukItemResep(ok)[0]).toMatchObject({ master_obat_id: 1, bentuk: null });
    });
    it('item tersimpan menjadi baris editor', () => {
        const item = [{ id: 9, master_obat_id: 3, nama: 'CTM', satuan: 'tablet', aturan_pakai: 'racikan', bentuk: 'puyer', rute: null, jumlah: 5, harga: 100, stok_tersedia: 10 }];
        expect(barisDariItem(item)).toEqual([{ master_obat_id: '3', jumlah: '5', aturan_pakai: 'racikan', bentuk: 'puyer', rute: '' }]);
    });
    it('biaya resep dari harga master', () => {
        const b = [{ ...barisResepKosong(), master_obat_id: '1', jumlah: '10' }, { ...barisResepKosong(), master_obat_id: '2', jumlah: '3' }];
        expect(biayaResep(b, [{ id: 1, harga: 600 }, { id: 2, harga: 1500 }])).toBe(10 * 600 + 3 * 1500);
    });
});
describe('telaah', () => {
    it('lengkap bila ketiganya terpenuhi; belum lengkap butuh catatan', () => {
        const k = { ...awalTelaah(), administratif: true, farmasetik: true };
        expect(telaahLengkap(k)).toBe(false);
        expect(galatTelaah(k).catatan).toBeTruthy();
        expect(galatTelaah({ ...k, catatan: 'cek alergi' })).toEqual({});
        expect(galatTelaah({ ...k, klinis: true })).toEqual({});
    });
});
describe('rute pemberian', () => {
    it('opsi rute: kosong, daftar baku, dan nilai lama di luar daftar tetap muncul', () => {
        const o = opsiRute('');
        expect(o[0]).toEqual({ nilai: '', label: FARMASI.item.ruteKosong });
        expect(o.map((x) => x.nilai)).toContain('Oral');
        expect(opsiRute('per sonde').at(-1)).toEqual({ nilai: 'per sonde', label: 'per sonde' });
        expect(opsiRute('Oral')).toHaveLength(o.length);
    });
    it('master obat: rute ikut awal dan hanya dikirim bila berubah', () => {
        const awal = awalMasterObat({ id: 1, kfa_kode: '93', kfa_nama: 'X', nama_tampil: 'X', satuan: 'tablet', harga: 1, aktif: true, rute: 'Oral', stok_total: 0, kedaluwarsa_terdekat: null, status_stok: 'habis' });
        expect(awal.rute).toBe('Oral');
        expect(perubahanMasterObat(awal, awal)).toEqual({});
        expect(perubahanMasterObat(awal, { ...awal, rute: 'Intravena (IV)' })).toEqual({ rute: 'Intravena (IV)' });
    });
});
describe('rute bawaan', () => {
    const obat = (rute, bentuk_sediaan) => ({ id: 7, kfa_kode: '93', kfa_nama: 'X', nama_tampil: 'X', satuan: 'tablet', harga: 1, aktif: true, rute, bentuk_sediaan, stok_total: 0, kedaluwarsa_terdekat: null, status_stok: 'habis' });
    it('item resep: rute master didahulukan, lalu tebakan dari bentuk, kosong bila tidak pasti', () => {
        expect(isiDariObat(barisResepKosong(), obat('Intramuskular (IM)', 'Larutan Injeksi'))).toEqual({ master_obat_id: '7', bentuk: 'Larutan Injeksi', rute: 'Intramuskular (IM)' });
        expect(isiDariObat(barisResepKosong(), obat(null, 'Tablet'))).toMatchObject({ bentuk: 'Tablet', rute: 'Oral' });
        expect(isiDariObat(barisResepKosong(), obat(null, 'Larutan Injeksi')).rute).toBe('');
        expect(isiDariObat({ ...barisResepKosong(), bentuk: 'Salep', rute: 'Topikal' }, null)).toEqual({ master_obat_id: '', bentuk: 'Salep', rute: 'Oral' });
        expect(isiDariObat(barisResepKosong(), obat(null, null)).rute).toBe('Oral');
        expect(barisResepKosong()).toMatchObject({ jumlah: '1', aturan_pakai: '3 x 1', rute: 'Oral' });
    });
    it('master obat: memilih KFA menebak rute bila belum diisi', () => {
        expect(pilihKfa(awalMasterObat(), { ...kfa, bentuk_sediaan: 'Krim' }).rute).toBe('Topikal');
        expect(pilihKfa(awalMasterObat(), kfa).rute).toBe('Oral');
        expect(pilihKfa({ ...awalMasterObat(), rute: 'Mata' }, { ...kfa, bentuk_sediaan: 'Krim' }).rute).toBe('Mata');
    });
});
