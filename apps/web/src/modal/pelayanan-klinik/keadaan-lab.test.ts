import type { MasterPemeriksaanDto, OrderPenunjangDto } from '@klira/shared';
import { awalOrderLab, bentukOrderLab, galatOrderLab, gantiPilihan, perkiraanBiaya, rupiah, saringPemeriksaan } from './keadaan-order-lab';
import { awalSpesimen, bentukSpesimen, galatSpesimen, gantiOrderSpesimen, menungguSpesimen } from './keadaan-spesimen';
import {
  awalHasilLab, galatHasilLab, langkahBermasalahHasil, menungguHasil, pulihkanHasilLab, rencanaHasil, saranUntuk, terapkanSaran, ubahIsian,
} from './keadaan-hasil-lab';
import { awalMasterPemeriksaan, bentukMasterPemeriksaan, galatMasterPemeriksaan, perubahanMaster } from './keadaan-master-pemeriksaan';

const master = (id: number, p: Partial<MasterPemeriksaanDto> = {}): MasterPemeriksaanDto => ({
  id, kode: `K${id}`, nama: `Tes ${id}`, kode_loinc: null, loinc_contoh: false, jenis_spesimen: null, satuan: null, rujukan_min: null, rujukan_maks: null, rujukan_teks: null, aktif: true, tarif: null, ...p,
});
const order = (id: number, p: Partial<OrderPenunjangDto> = {}): OrderPenunjangDto => ({
  id, kunjungan_id: 5, pasien_id: 2, nama: `Tes ${id}`, kode_loinc: null, prioritas: 'rutin', catatan: null, status: 'dipesan', dibuat_pada: '2026-10-25T01:00:00Z', dibuat_oleh_nama: 'Dr. A',
  satuan: 'g/dL', rujukan_teks: '12 - 16 g/dL', rujukan_min: 12, rujukan_maks: 16, jenis_spesimen: 'Darah vena', spesimen: null, hasil: null, pengesahan: null, verifikasi: 'belum_disahkan', addendum: [], ...p,
});

describe('Order lab', () => {
  const daftar = [master(1, { nama: 'Hemoglobin', kode: 'HB', kode_loinc: '718-7' }), master(2, { nama: 'Asam urat' }), master(3, { nama: 'Lama', aktif: false })];
  it('menyaring pemeriksaan aktif menurut nama, kode, atau LOINC dan mengurutkan menurut nama', () => {
    expect(saringPemeriksaan(daftar, '').map((m) => m.id)).toEqual([2, 1]);
    expect(saringPemeriksaan(daftar, 'hemo').map((m) => m.id)).toEqual([1]);
    expect(saringPemeriksaan(daftar, '718').map((m) => m.id)).toEqual([1]);
    expect(saringPemeriksaan(daftar, 'hb').map((m) => m.id)).toEqual([1]);
    expect(saringPemeriksaan(daftar, 'lama')).toEqual([]);
  });
  it('pilihan bergantian dan urutan pilih dipertahankan; minimal satu pemeriksaan', () => {
    let k = awalOrderLab();
    expect(galatOrderLab(k)).not.toBeNull();
    k = gantiPilihan(gantiPilihan(k, 2), 1);
    expect(k.pemeriksaan).toEqual([2, 1]);
    expect(galatOrderLab(k)).toBeNull();
    expect(gantiPilihan(k, 2).pemeriksaan).toEqual([1]);
  });
  it('bentuk kiriman: catatan kosong menjadi null, prioritas ikut', () => {
    expect(bentukOrderLab({ pemeriksaan: [1], prioritas: 'segera', catatan: '  ' })).toEqual({ pemeriksaan_ids: [1], prioritas: 'segera', catatan: null });
    expect(bentukOrderLab({ pemeriksaan: [1], prioritas: 'rutin', catatan: ' puasa ' }).catatan).toBe('puasa');
  });
  it('perkiraan biaya mengikuti cara pembayaran dan menghitung yang tanpa tarif', () => {
    const m = [master(1, { tarif: { id: 1, kode: 'A', nama: 'A', harga_umum: 30_000, harga_jkn: 20_000 } }), master(2)];
    expect(perkiraanBiaya(m, [1, 2], 'umum')).toEqual({ total: 30_000, tanpaTarif: 1 });
    expect(perkiraanBiaya(m, [1], 'jkn')).toEqual({ total: 20_000, tanpaTarif: 0 });
    expect(rupiah(30000).replace(/\s/g, '')).toMatch(/Rp30\.000/);
  });
});

describe('Ambil spesimen', () => {
  const orders = [order(1), order(2, { jenis_spesimen: 'Urin' }), order(3, { status: 'spesimen_diambil' })];
  it('hanya order dipesan; semuanya terpilih awal dan asal dari pemeriksaan pertama', () => {
    expect(menungguSpesimen(orders).map((o) => o.id)).toEqual([1, 2]);
    const k = awalSpesimen(orders, new Date('2026-10-25T03:00:00Z'));
    expect(k.terpilih).toEqual([1, 2]);
    expect(k.asal).toBe('Darah vena');
    expect(k.waktu).toMatch(/^2026-10-25T\d\d:00$/);
  });
  it('melepas dan memilih order; asal kosong diisi dari order terpilih pertama tetapi tidak menimpa isian', () => {
    let k = { ...awalSpesimen(orders), asal: '', terpilih: [] as number[] };
    k = gantiOrderSpesimen(k, orders, 2);
    expect(k).toMatchObject({ terpilih: [2], asal: 'Urin' });
    expect(gantiOrderSpesimen({ ...k, asal: 'Darah kapiler' }, orders, 1).asal).toBe('Darah kapiler');
  });
  it('galat: order, asal, dan waktu (tidak di masa depan)', () => {
    const k = awalSpesimen(orders);
    expect(galatSpesimen(k)).toEqual({});
    expect(Object.keys(galatSpesimen({ ...k, terpilih: [], asal: ' ', waktu: '' })).sort()).toEqual(['asal', 'terpilih', 'waktu']);
    expect(galatSpesimen({ ...k, waktu: '2999-01-01T10:00' }).waktu).toBeDefined();
  });
  it('bentuk kiriman: waktu ISO dan petugas hanya bila dipilih', () => {
    const k = { ...awalSpesimen(orders), asal: ' Darah vena ', waktu: '2026-10-25T10:30' };
    const b = bentukSpesimen(k);
    expect(b.asal).toBe('Darah vena');
    expect(b.waktu_ambil).toMatch(/^2026-10-25T\d\d:30:00\.000Z$/);
    expect('petugas_id' in b).toBe(false);
    expect(bentukSpesimen({ ...k, petugas: '9' }).petugas_id).toBe(9);
  });
});

describe('Hasil lab (Hasil, Interpretasi, Validasi)', () => {
  const orders = [
    order(1, { status: 'spesimen_diambil' }),
    order(2, { status: 'menunggu_hasil', hasil: { nilai: '8', satuan: 'g/dL', rujukan_teks: null, interpretasi: 'rendah', catatan: 'cek ulang', dientri_oleh: 'A', dientri_pada: '', validator_nama: null, divalidasi_pada: null } }),
    order(3, { status: 'dipesan' }), order(4, { status: 'divalidasi' }),
  ];
  it('hanya order bersepesimen yang belum divalidasi; hasil tersimpan diisikan kembali', () => {
    expect(menungguHasil(orders).map((o) => o.id)).toEqual([1, 2]);
    const k = awalHasilLab(orders);
    expect(k.nilai).toEqual({ 1: '', 2: '8' });
    expect(k.interpretasi[2]).toBe('rendah');
    expect(k.catatan[2]).toBe('cek ulang');
    expect(k.validasi).toBe(true);
  });
  it('saran interpretasi dari rentang rujukan, hanya mengisi yang kosong', () => {
    expect(saranUntuk(orders[0], '9,5')).toBe('rendah');
    expect(saranUntuk(orders[0], '14')).toBe('normal');
    expect(saranUntuk(orders[0], 'negatif')).toBeNull();
    let k = ubahIsian(ubahIsian(awalHasilLab(orders), 'nilai', 1, '17'), 'nilai', 2, '14');
    k = terapkanSaran(k, orders);
    expect(k.interpretasi).toEqual({ 1: 'tinggi', 2: 'rendah' }); // pilihan analis untuk order 2 tidak ditimpa
  });
  it('rencana hanya order bernilai dan berinterpretasi sah; galat bila nilai terisi tanpa interpretasi', () => {
    let k = ubahIsian(awalHasilLab(orders), 'nilai', 1, '14');
    expect(galatHasilLab(k, orders)).toEqual({ 1: expect.any(String) });
    expect(rencanaHasil(k, orders).map((r) => r.order.id)).toEqual([2]);
    k = ubahIsian(k, 'interpretasi', 1, 'normal');
    expect(galatHasilLab(k, orders)).toEqual({});
    expect(rencanaHasil(k, orders).map((r) => [r.order.id, r.nilai, r.interpretasi, r.catatan])).toEqual([[1, '14', 'normal', null], [2, '8', 'rendah', 'cek ulang']]);
  });
  it('langkah bermasalah: tanpa nilai kembali ke Hasil, nilai tanpa interpretasi ke Interpretasi', () => {
    const kosong = { ...awalHasilLab(orders), nilai: { 1: '', 2: '' } };
    expect(langkahBermasalahHasil(kosong, orders)).toBe(0);
    expect(langkahBermasalahHasil(ubahIsian(kosong, 'nilai', 1, '14'), orders)).toBe(1);
    expect(langkahBermasalahHasil(awalHasilLab(orders), orders)).toBe(-1);
  });
});

describe('Master pemeriksaan', () => {
  it('isian awal dari data dan galat dari skema bersama', () => {
    const k = awalMasterPemeriksaan(master(1, { kode: 'HB', nama: 'Hemoglobin', rujukan_min: 12, rujukan_maks: 16, satuan: 'g/dL', tarif: { id: 4, kode: 'T', nama: 'T', harga_umum: 1, harga_jkn: null } }));
    expect(k).toMatchObject({ kode: 'HB', rujukan_min: '12', rujukan_maks: '16', tarif_layanan_id: '4', aktif: true });
    expect(galatMasterPemeriksaan(k)).toEqual({});
    expect(Object.keys(galatMasterPemeriksaan(awalMasterPemeriksaan())).sort()).toEqual(['kode', 'nama']);
    expect(galatMasterPemeriksaan({ ...k, kode_loinc: 'salah' }).kode_loinc).toBeDefined();
    expect(galatMasterPemeriksaan({ ...k, rujukan_min: '20' }).rujukan_maks).toBeDefined();
  });
  it('perubahan hanya memuat bidang yang berubah', () => {
    const awal = awalMasterPemeriksaan(master(1));
    expect(perubahanMaster(awal, { ...awal, nama: 'Baru', aktif: false })).toEqual({ nama: 'Baru', aktif: false });
    expect(perubahanMaster(awal, awal)).toEqual({});
    expect(bentukMasterPemeriksaan(awal)).toMatchObject({ kode: 'K1' });
  });
});

describe('Hasil lab: draf', () => {
  it('draf menimpa isian untuk order yang masih menunggu dan membuang order lain', () => {
    const orders = [order(1, { status: 'spesimen_diambil' }), order(2, { status: 'spesimen_diambil' })];
    const awal = awalHasilLab(orders);
    const hasil = pulihkanHasilLab(awal, { nilai: { 1: '14', 9: 'sisa' }, interpretasi: { 1: 'normal' }, validasi: false });
    expect(hasil.nilai).toEqual({ 1: '14', 2: '' });
    expect(hasil.interpretasi).toEqual({ 1: 'normal', 2: '' });
    expect(hasil.validasi).toBe(false);
    expect(pulihkanHasilLab(awal, null)).toBe(awal);
  });
});
