import { adaPerubahanJenis, alihIzin, awalJenis, bentukBuat, bentukUbah, galatJenis, kelompokkanIzin, semuaTerpilih, setKelompok } from './keadaan-jenis-akun';

const katalog = [
  { id: 1, fitur: 'audit', aksi: 'lihat', cakupan: 'unit' },
  { id: 2, fitur: 'akses', aksi: 'input', cakupan: 'unit' },
  { id: 3, fitur: 'akses', aksi: 'lihat', cakupan: 'layanan' },
  { id: 4, fitur: 'lain', aksi: 'lihat', cakupan: 'unit' },
];

describe('keadaan jenis akun', () => {
  it('mengelompokkan izin per fitur menurut urutan katalog, fitur tak dikenal di akhir', () => {
    const k = kelompokkanIzin(katalog);
    expect(k.map((x) => x.fitur)).toEqual(['akses', 'audit', 'lain']);
    expect(k[0].izin.map((i) => i.id)).toEqual([2, 3]);
    expect(k[0].label).toBe('Akses dan pengaturan');
  });

  it('mengalihkan satu izin dan memilih atau melepas satu kelompok', () => {
    const [akses] = kelompokkanIzin(katalog);
    expect(alihIzin([1], 2)).toEqual([1, 2]);
    expect(alihIzin([1, 2], 2)).toEqual([1]);
    expect(setKelompok([1], akses, true).sort()).toEqual([1, 2, 3]);
    expect(setKelompok([1, 2, 3], akses, false)).toEqual([1]);
    expect(semuaTerpilih([2, 3], akses)).toBe(true);
    expect(semuaTerpilih([2], akses)).toBe(false);
  });

  it('nama wajib saat buat dan alasan wajib saat ubah', () => {
    expect(galatJenis({ nama: ' ', syarat: '', izin: [], alasan: '' }, false).nama).toBeDefined();
    expect(galatJenis({ nama: 'A', syarat: '', izin: [], alasan: '' }, false)).toEqual({});
    expect(galatJenis({ nama: 'A', syarat: '', izin: [], alasan: '  ' }, true).alasan_perubahan).toBeDefined();
    expect(galatJenis({ nama: 'A', syarat: '', izin: [], alasan: 'koreksi' }, true)).toEqual({});
  });

  it('mendeteksi perubahan tanpa memperhitungkan urutan izin atau alasan', () => {
    const awal = awalJenis({ nama: 'X', syarat_profesi: null, izin: [{ id: 3, fitur: 'a', aksi: 'lihat', cakupan: 'unit' }, { id: 2, fitur: 'a', aksi: 'lihat', cakupan: 'unit' }] });
    expect(awal.izin).toEqual([2, 3]);
    expect(adaPerubahanJenis(awal, { ...awal, izin: [3, 2], alasan: 'x' })).toBe(false);
    expect(adaPerubahanJenis(awal, { ...awal, syarat: 'dokter' })).toBe(true);
  });

  it('membentuk muatan buat dan ubah (hanya bidang berubah)', () => {
    expect(bentukBuat({ nama: ' B ', syarat: '', izin: [3, 1], alasan: '' })).toEqual({ nama: 'B', syarat_profesi: null, izin_ids: [1, 3] });
    const awal = { nama: 'B', syarat: 'dokter', izin: [1], alasan: '' };
    expect(bentukUbah(awal, { ...awal, syarat: '', alasan: ' perlu ' })).toEqual({ syarat_profesi: null, alasan_perubahan: 'perlu' });
    expect(bentukUbah(awal, { ...awal, izin: [1, 2], alasan: 'r' })).toEqual({ izin_ids: [1, 2], alasan_perubahan: 'r' });
  });
});
