import { kodeOrderLab, adalahMaju, angkaDariNilai, bolehAksiOrder, hargaTarif, hasilJadiAddendum, orderBerjalan, sarankanInterpretasi, teksRujukan, URUTAN_STATUS_ORDER } from './penunjang';
import { rentangHariWib } from './alur';
import {
  filterRekapLab, hasilMasukan, masterPemeriksaanMasukan, orderLabMasukan, persetujuanTindakanMasukan, spesimenMasukan, ubahMasterPemeriksaanMasukan,
} from './skema';

describe('urutan status order', () => {
  it('hanya maju: ambil spesimen, isi hasil, validasi', () => {
    expect(URUTAN_STATUS_ORDER).toEqual(['dipesan', 'spesimen_diambil', 'menunggu_hasil', 'divalidasi']);
    expect(bolehAksiOrder('dipesan', 'spesimen')).toBe(true);
    expect(bolehAksiOrder('spesimen_diambil', 'spesimen')).toBe(false);
    expect(bolehAksiOrder('dipesan', 'hasil')).toBe(false);
    expect(bolehAksiOrder('spesimen_diambil', 'hasil')).toBe(true);
    expect(bolehAksiOrder('menunggu_hasil', 'hasil')).toBe(true);
    expect(bolehAksiOrder('spesimen_diambil', 'validasi')).toBe(false);
    expect(bolehAksiOrder('menunggu_hasil', 'validasi')).toBe(true);
    expect(bolehAksiOrder('divalidasi', 'hasil')).toBe(false);
    expect(bolehAksiOrder('divalidasi', 'validasi')).toBe(false);
  });
  it('adalahMaju dan orderBerjalan', () => {
    expect(adalahMaju('dipesan', 'menunggu_hasil')).toBe(true);
    expect(adalahMaju('divalidasi', 'dipesan')).toBe(false);
    expect(adalahMaju('dipesan', 'dipesan')).toBe(false);
    expect(orderBerjalan('menunggu_hasil')).toBe(true);
    expect(orderBerjalan('divalidasi')).toBe(false);
  });
});

describe('hasil: saran interpretasi dan rujukan', () => {
  it('angka dengan koma atau titik', () => {
    expect(angkaDariNilai('5,4')).toBe(5.4);
    expect(angkaDariNilai(' 12 ')).toBe(12);
    expect(angkaDariNilai('positif')).toBeNull();
    expect(angkaDariNilai('1e3')).toBeNull();
  });
  it('saran dari rentang; kualitatif atau tanpa rentang tidak disarankan', () => {
    expect(sarankanInterpretasi('4,0', 4.5, 11)).toBe('rendah');
    expect(sarankanInterpretasi('12', 4.5, 11)).toBe('tinggi');
    expect(sarankanInterpretasi('4,5', 4.5, 11)).toBe('normal');
    expect(sarankanInterpretasi('11', 4.5, 11)).toBe('normal');
    expect(sarankanInterpretasi('7', null, 11)).toBe('normal');
    expect(sarankanInterpretasi('7', null, null)).toBeNull();
    expect(sarankanInterpretasi('negatif', 1, 2)).toBeNull();
  });
  it('teks rujukan: teks bebas lebih dahulu, lalu rentang dengan satuan', () => {
    expect(teksRujukan({ rujukan_teks: 'Negatif', rujukan_min: 1, rujukan_maks: 2, satuan: 'g/dL' })).toBe('Negatif');
    expect(teksRujukan({ rujukan_teks: null, rujukan_min: 12, rujukan_maks: 16, satuan: 'g/dL' })).toBe('12 - 16 g/dL');
    expect(teksRujukan({ rujukan_teks: null, rujukan_min: null, rujukan_maks: 200, satuan: null })).toBe('<= 200');
    expect(teksRujukan({ rujukan_teks: null, rujukan_min: 3, rujukan_maks: null, satuan: 'x' })).toBe('>= 3 x');
    expect(teksRujukan({ rujukan_teks: ' ', rujukan_min: null, rujukan_maks: null, satuan: null })).toBeNull();
  });
});

describe('harga tarif dan addendum', () => {
  it('harga JKN dipakai untuk kunjungan JKN bila ada; tanpa tarif null', () => {
    expect(hargaTarif({ harga_umum: 50_000, harga_jkn: 30_000 }, 'jkn')).toBe(30_000);
    expect(hargaTarif({ harga_umum: 50_000, harga_jkn: null }, 'jkn')).toBe(50_000);
    expect(hargaTarif({ harga_umum: 50_000, harga_jkn: 30_000 }, 'umum')).toBe(50_000);
    expect(hargaTarif(null, 'umum')).toBeNull();
  });
  it('hasil jadi addendum bila pemeriksaan selesai atau diagnosis/tindak lanjut sudah disahkan', () => {
    expect(hasilJadiAddendum({ tahap: 'pemeriksaan', bagianDisahkan: [] })).toBe(false);
    expect(hasilJadiAddendum({ tahap: 'pemeriksaan', bagianDisahkan: ['anamnesis', 'tanda_vital', 'pemeriksaan', 'tindakan'] })).toBe(false);
    expect(hasilJadiAddendum({ tahap: 'pemeriksaan', bagianDisahkan: ['diagnosis'] })).toBe(true);
    expect(hasilJadiAddendum({ tahap: 'pemeriksaan', bagianDisahkan: ['tindak_lanjut'] })).toBe(true);
    expect(hasilJadiAddendum({ tahap: 'kasir', bagianDisahkan: [] })).toBe(true);
    expect(hasilJadiAddendum({ tahap: 'menunggu_skrining', bagianDisahkan: [] })).toBe(false);
  });
});

describe('rentang hari WIB', () => {
  it('awal hari WIB sampai sebelum hari sesudah akhir', () => {
    const r = rentangHariWib('2026-10-25', '2026-10-26');
    expect(r.awal?.toISOString()).toBe('2026-10-24T17:00:00.000Z');
    expect(r.akhir?.toISOString()).toBe('2026-10-26T17:00:00.000Z');
    expect(rentangHariWib()).toEqual({});
  });
});

describe('skema penunjang', () => {
  it('master: LOINC berpola, rentang min tidak melebihi maks, angka dengan koma', () => {
    const dasar = { kode: 'HB', nama: 'Hemoglobin' };
    expect(masterPemeriksaanMasukan.safeParse({ ...dasar, kode_loinc: '718-7', satuan: 'g/dL', rujukan_min: '12,0', rujukan_maks: '16' }).success).toBe(true);
    expect(masterPemeriksaanMasukan.safeParse({ ...dasar, kode_loinc: 'ABC' }).success).toBe(false);
    expect(masterPemeriksaanMasukan.safeParse({ ...dasar, rujukan_min: 20, rujukan_maks: 10 }).success).toBe(false);
    const hasil = masterPemeriksaanMasukan.parse({ ...dasar, kode_loinc: '', satuan: '' });
    expect(hasil.kode_loinc).toBeNull();
    expect(hasil.satuan).toBeNull();
    expect(hasil.aktif).toBe(true);
  });
  it('ubah master: aktif tidak otomatis true saat tidak dikirim; kosong ditolak', () => {
    expect(ubahMasterPemeriksaanMasukan.parse({ nama: 'Baru' })).toEqual({ nama: 'Baru' });
    expect(ubahMasterPemeriksaanMasukan.safeParse({}).success).toBe(false);
    expect(ubahMasterPemeriksaanMasukan.parse({ aktif: false })).toEqual({ aktif: false });
  });
  it('order lab: minimal satu pemeriksaan, tanpa ganda, prioritas bawaan rutin', () => {
    expect(orderLabMasukan.safeParse({ pemeriksaan_ids: [] }).success).toBe(false);
    expect(orderLabMasukan.safeParse({ pemeriksaan_ids: [1, 1] }).success).toBe(false);
    const o = orderLabMasukan.parse({ pemeriksaan_ids: [1, 2], catatan: ' ' });
    expect(o.prioritas).toBe('rutin');
    expect(o.catatan).toBeNull();
    expect(orderLabMasukan.safeParse({ pemeriksaan_ids: [1], prioritas: 'kilat' }).success).toBe(false);
  });
  it('spesimen: asal wajib dan waktu tidak di masa depan', () => {
    expect(spesimenMasukan.safeParse({ asal: ' ', waktu_ambil: new Date().toISOString() }).success).toBe(false);
    expect(spesimenMasukan.safeParse({ asal: 'Darah vena', waktu_ambil: new Date(Date.now() + 3_600_000).toISOString() }).success).toBe(false);
    expect(spesimenMasukan.safeParse({ asal: 'Darah vena', waktu_ambil: new Date().toISOString() }).success).toBe(true);
  });
  it('hasil: nilai wajib dan interpretasi dari daftar', () => {
    expect(hasilMasukan.safeParse({ nilai: '', interpretasi: 'normal' }).success).toBe(false);
    expect(hasilMasukan.safeParse({ nilai: '14', interpretasi: 'aneh' }).success).toBe(false);
    expect(hasilMasukan.safeParse({ nilai: '14', interpretasi: 'normal' }).success).toBe(true);
  });
  it('rekap: status dan tanggal opsional, bentuk tanggal dijaga', () => {
    expect(filterRekapLab.parse({}).ukuran).toBe(20);
    expect(filterRekapLab.safeParse({ status: 'divalidasi', dari: '2026-10-01' }).success).toBe(true);
    expect(filterRekapLab.safeParse({ status: 'selesai' }).success).toBe(false);
    expect(filterRekapLab.safeParse({ dari: '25/10/2026' }).success).toBe(false);
    expect(filterRekapLab.parse({ status: '', dari: '' }).status).toBeUndefined();
  });
});

describe('skema persetujuan tindakan', () => {
  const dasar = { tindakan_nama: 'Insisi abses', penjelasan: 'Risiko dijelaskan', bentuk: 'tertulis', penandatangan: 'pasien', saksi_pengguna_id: 3, teks_persetujuan_id: 1 };
  it('wali wajib bila penandatangan wali; id wali dibuang bila pasien sendiri', () => {
    expect(persetujuanTindakanMasukan.safeParse({ ...dasar, penandatangan: 'wali' }).success).toBe(false);
    expect(persetujuanTindakanMasukan.parse({ ...dasar, penandatangan: 'wali', wali_id: 4 }).wali_id).toBe(4);
    expect(persetujuanTindakanMasukan.parse({ ...dasar, wali_id: 4 }).wali_id).toBeNull();
  });
  it('kode ICD-9 CM bila ada harus berbentuk benar; penjelasan dan saksi wajib', () => {
    expect(persetujuanTindakanMasukan.safeParse({ ...dasar, tindakan_kode: '86.04' }).success).toBe(true);
    expect(persetujuanTindakanMasukan.safeParse({ ...dasar, tindakan_kode: 'XYZ' }).success).toBe(false);
    expect(persetujuanTindakanMasukan.parse({ ...dasar, tindakan_kode: '' }).tindakan_kode).toBeNull();
    expect(persetujuanTindakanMasukan.safeParse({ ...dasar, penjelasan: ' ' }).success).toBe(false);
    expect(persetujuanTindakanMasukan.safeParse({ ...dasar, saksi_pengguna_id: undefined }).success).toBe(false);
    expect(persetujuanTindakanMasukan.safeParse({ ...dasar, bentuk: 'isyarat' }).success).toBe(false);
  });
});

describe('kode order lab', () => {
  it('tiga digit minimal', () => {
    expect(kodeOrderLab(31)).toBe('L-031');
    expect(kodeOrderLab(1234)).toBe('L-1234');
  });
});
