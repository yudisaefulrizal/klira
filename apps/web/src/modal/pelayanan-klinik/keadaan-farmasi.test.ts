import { adaIsianResep, awalMasterObat, awalMutasi, awalResep, awalTelaah, barisResepKosong, biayaResep, bentukMutasi, bentukResep, galatMasterObat, galatMutasi, galatResep, galatTelaah, gantiJenisMutasi, hapusBarisResep, perubahanMasterObat, pilihBatch, pilihKfa, telaahLengkap, ubahBarisResep } from './keadaan-farmasi';

const kfa = { id: 7, kode: 'contoh-1', tingkat: 92, nama: 'Parasetamol 500 mg tablet', bentuk_sediaan: null, rute: null, satuan: 'tablet', kekuatan: null, nomor_izin_edar: null, produsen: null, generik: true, status: 'aktif', contoh: true };

describe('master obat', () => {
  it('memilih KFA mengisi nama dan satuan awal tanpa menimpa isian klinik', () => {
    const k = pilihKfa(awalMasterObat(), kfa);
    expect(k).toMatchObject({ nama_tampil: 'Parasetamol 500 mg tablet', satuan: 'tablet' });
    expect(pilihKfa({ ...k, nama_tampil: 'Parasetamol 500' }, { ...kfa, nama: 'lain' }).nama_tampil).toBe('Parasetamol 500');
  });
  it('tambah butuh kode KFA, nama, satuan, dan harga bilangan bulat tidak negatif', () => {
    const g = galatMasterObat(awalMasterObat(), false);
    expect(Object.keys(g).sort()).toEqual(['harga', 'kfa_id', 'nama_tampil', 'satuan']);
    expect(galatMasterObat({ ...pilihKfa(awalMasterObat(), kfa), harga: '500' }, false)).toEqual({});
    expect(galatMasterObat({ ...pilihKfa(awalMasterObat(), kfa), harga: '-1' }, false).harga).toBeTruthy();
    expect(galatMasterObat({ ...pilihKfa(awalMasterObat(), kfa), harga: '1,5' }, false).harga).toBeTruthy();
  });
  it('ubah hanya mengirim bidang yang berubah dan tidak menyentuh aktif bila tidak diubah', () => {
    const awal = awalMasterObat({ id: 1, kfa_id: 7, kfa_kode: 'c', kfa_nama: 'n', kfa_tingkat: 92, kfa_contoh: true, nama_tampil: 'A', satuan: 'tablet', harga: 500, aktif: false, stok_total: 0, kedaluwarsa_terdekat: null, status_stok: 'habis' });
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

describe('resep', () => {
  it('baris dapat ditambah, diubah, dan dibuang tanpa pernah kosong', () => {
    let b = awalResep();
    b = ubahBarisResep(b, 0, { master_obat_id: '1', aturan_pakai: '3 x 1' });
    b = [...b, barisResepKosong()];
    expect(b.length).toBe(2);
    expect(hapusBarisResep(b, 0).length).toBe(1);
    expect(hapusBarisResep(hapusBarisResep(b, 0), 0)).toEqual(awalResep());
  });
  it('galat per baris: obat, aturan pakai, jumlah, dan obat ganda', () => {
    expect(galatResep(awalResep())['item.0.master_obat_id']).toBeTruthy();
    const ok = ubahBarisResep(awalResep(), 0, { master_obat_id: '1', aturan_pakai: '3 x 1', jumlah: '5' });
    expect(galatResep(ok)).toEqual({});
    expect(galatResep(ubahBarisResep(ok, 0, { jumlah: '0' }))['item.0.jumlah']).toBeTruthy();
    expect(galatResep(ubahBarisResep(ok, 0, { aturan_pakai: '' }))['item.0.aturan_pakai']).toBeTruthy();
    expect(galatResep([...ok, ...ok])['item.1.master_obat_id']).toBeTruthy();
    expect(bentukResep(ok).item[0]).toMatchObject({ master_obat_id: 1, bentuk: null });
  });
  it('biaya resep dari harga master', () => {
    const b = [...ubahBarisResep(awalResep(), 0, { master_obat_id: '1', jumlah: '10' }), ...ubahBarisResep(awalResep(), 0, { master_obat_id: '2', jumlah: '3' })];
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


test('resep awal dan baris tambahan kosong tidak diajukan; isian sebagian tetap memerlukan validasi', () => {
  expect(adaIsianResep(awalResep())).toBe(false);
  expect(adaIsianResep([barisResepKosong(), barisResepKosong()])).toBe(false);
  for (const p of [{ master_obat_id: '7' }, { aturan_pakai: '3 x 1' }, { jumlah: '' }, { jumlah: '2' }, { rute: 'oral' }]) {
    expect(adaIsianResep([{ ...barisResepKosong(), ...p }])).toBe(true);
  }
});
