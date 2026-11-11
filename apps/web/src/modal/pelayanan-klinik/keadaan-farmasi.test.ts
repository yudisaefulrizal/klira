import { FARMASI } from '@klira/shared';
import type { MasterObatDto } from '@klira/shared';
import { adaIsianResep, awalMasterObat, awalMutasi, awalResep, awalTelaah, barisDariItem, barisResepKosong, biayaResep, bentukItemResep, bentukMutasi, bentukResep, galatItemResep, galatMasterObat, galatMutasi, galatResep, galatTelaah, gantiJenisMutasi, hapusBarisResep, opsiRute, perubahanMasterObat, pilihBatch, pilihKfa, telaahLengkap, ubahBarisResep } from './keadaan-farmasi';

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

describe('resep dokter (teks bebas)', () => {
  it('teks wajib, dirapikan, maksimal 2000 karakter', () => {
    expect(galatResep(awalResep()).teks).toBeTruthy();
    expect(galatResep('   ').teks).toBeTruthy();
    expect(galatResep('R/ Parasetamol 500 mg tab ½, CTM 4 mg tab ½, m.f. pulv. dtd No. X, s 3 dd pulv I')).toEqual({});
    expect(galatResep('x'.repeat(2001)).teks).toBeTruthy();
    expect(bentukResep('R/ Amoxicillin')).toEqual({ teks: 'R/ Amoxicillin' });
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


test('resep awal dan teks berisi spasi tidak diajukan', () => {
  expect(adaIsianResep(awalResep())).toBe(false);
  expect(adaIsianResep('  \n ')).toBe(false);
  expect(adaIsianResep('R/ Parasetamol')).toBe(true);
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
    const awal = awalMasterObat({ id: 1, kfa_kode: '93', kfa_nama: 'X', nama_tampil: 'X', satuan: 'tablet', harga: 1, aktif: true, rute: 'Oral', stok_total: 0, kedaluwarsa_terdekat: null, status_stok: 'habis' } as MasterObatDto);
    expect(awal.rute).toBe('Oral');
    expect(perubahanMasterObat(awal, awal)).toEqual({});
    expect(perubahanMasterObat(awal, { ...awal, rute: 'Intravena (IV)' })).toEqual({ rute: 'Intravena (IV)' });
  });
});
