import type { PersetujuanSiapDto } from '@klira/shared';
import { awalPersetujuan, bentukPersetujuan, galatPersetujuan, langkahBermasalahPersetujuan, PILIHAN_MANUAL, pilihTindakan } from './keadaan-persetujuan';

const siap = (p: Partial<PersetujuanSiapDto> = {}): PersetujuanSiapDto => ({
  pasien: { id: 2, nama: 'Siti', tidak_cakap: false },
  teks: { id: 4, jenis: 'tindakan', versi: 1, judul: 'T', tujuan: 'U', isi: 'I' },
  tindakan: [{ kode: '86.04', nama: 'Insisi abses' }, { kode: '86.59', nama: 'Jahit luka' }],
  wali: [{ id: 6, hubungan: 'Ibu', nama: 'Ibu Siti' }], saksi: [{ id: 9, nama: 'Ns. Budi' }], ...p,
});

describe('Persetujuan tindakan', () => {
  it('awal: tindakan tunggal terpilih, wali tunggal terpilih, pasien tidak cakap diwakili wali', () => {
    expect(awalPersetujuan(siap())).toMatchObject({ pilih: '', penandatangan: 'pasien', wali: '6', bentuk: 'tertulis' });
    expect(awalPersetujuan(siap({ tindakan: [{ kode: '86.04', nama: 'Insisi abses' }] }))).toMatchObject({ pilih: '86.04', kode: '86.04', nama: 'Insisi abses' });
    expect(awalPersetujuan(siap({ pasien: { id: 2, nama: 'Anak', tidak_cakap: true } })).penandatangan).toBe('wali');
    expect(awalPersetujuan(null).penandatangan).toBe('pasien');
  });
  it('memilih tindakan menyalin kode dan nama; manual mengosongkan', () => {
    const s = siap();
    let k = pilihTindakan(awalPersetujuan(s), s, '86.59');
    expect(k).toMatchObject({ kode: '86.59', nama: 'Jahit luka' });
    k = pilihTindakan(k, s, PILIHAN_MANUAL);
    expect(k).toMatchObject({ pilih: 'manual', kode: '', nama: '' });
  });
  it('galat per bidang: tindakan, penjelasan, wali bila wali, saksi, kode ICD-9 CM, dan pasien tidak cakap', () => {
    const s = siap();
    const k = awalPersetujuan(s);
    expect(Object.keys(galatPersetujuan(k, s)).sort()).toEqual(['nama', 'penjelasan', 'saksi']);
    const lengkap = { ...k, nama: 'Insisi', penjelasan: 'Dijelaskan', saksi: '9' };
    expect(galatPersetujuan(lengkap, s)).toEqual({});
    expect(galatPersetujuan({ ...lengkap, kode: 'XX' }, s).kode).toBeDefined();
    expect(galatPersetujuan({ ...lengkap, penandatangan: 'wali', wali: '' }, s).wali).toBeDefined();
    expect(galatPersetujuan({ ...lengkap, penandatangan: 'wali', wali: '' }, siap({ wali: [] })).wali).toBeDefined();
    expect(galatPersetujuan(lengkap, siap({ pasien: { id: 2, nama: 'Anak', tidak_cakap: true } })).penandatangan).toBeDefined();
    expect(galatPersetujuan(lengkap, siap({ teks: null })).teks).toBeDefined();
  });
  it('langkah bermasalah mengikuti urutan langkah', () => {
    expect(langkahBermasalahPersetujuan({ nama: 'x', penjelasan: 'y' })).toBe(0);
    expect(langkahBermasalahPersetujuan({ penjelasan: 'y', saksi: 'z' })).toBe(1);
    expect(langkahBermasalahPersetujuan({ saksi: 'z' })).toBe(2);
    expect(langkahBermasalahPersetujuan({})).toBe(-1);
  });
  it('bentuk kiriman: wali hanya bila penandatangan wali, kode kosong menjadi null, id teks dari teks aktif', () => {
    const s = siap();
    const dasar = { ...awalPersetujuan(s), nama: ' Insisi ', penjelasan: ' Dijelaskan ', saksi: '9' };
    expect(bentukPersetujuan(dasar, s)).toEqual({
      tindakan_kode: null, tindakan_nama: 'Insisi', penjelasan: 'Dijelaskan', bentuk: 'tertulis', penandatangan: 'pasien', wali_id: null, saksi_pengguna_id: 9, teks_persetujuan_id: 4,
    });
    expect(bentukPersetujuan({ ...dasar, penandatangan: 'wali', wali: '6', kode: '86.04' }, s)).toMatchObject({ wali_id: 6, tindakan_kode: '86.04' });
  });
});
