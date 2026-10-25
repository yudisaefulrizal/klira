import { alasanPerbaikanSah, awalKode, berubahDariFinal, bentukKode, buangKode, galatKode, jadikanKodeUtama, perluCatatanKode, ringkasIsi, selisihBaris, tambahKode, tambahKodeTindakan } from './keadaan-rm';

const dokter = { diagnosis: [{ kode: 'I10', nama: 'Hipertensi', peran: 'utama' as const }, { kode: 'E78.0', nama: 'Kolesterol', peran: 'penyerta' as const }], tindakan: [{ kode: '89.52', nama: 'EKG' }] };

describe('pengkodean ICD', () => {
  it('awal disalin dari dokter bila belum ada kode final, atau memakai kode final', () => {
    const k = awalKode({ final: null, dokter });
    expect(k.diagnosis.map((d) => d.kode)).toEqual(['I10', 'E78.0']);
    k.diagnosis[0].kode = 'X'; // salinan, bukan acuan
    expect(dokter.diagnosis[0].kode).toBe('I10');
    const f = awalKode({ final: { diagnosis: [{ kode: 'J06.9', nama: 'ISPA', peran: 'utama' }], tindakan: [], catatan: null }, dokter });
    expect(f.diagnosis.map((d) => d.kode)).toEqual(['J06.9']);
    expect(f.catatan).toBe('');
  });
  it('tambah menormalkan huruf besar, menolak ganda, diagnosis pertama utama; buang memilih utama baru', () => {
    let d = tambahKode([], { kode: 'i10', nama: ' Hipertensi ' });
    expect(d).toEqual([{ kode: 'I10', nama: 'Hipertensi', peran: 'utama' }]);
    d = tambahKode(d, { kode: 'e78.0', nama: 'Kolesterol' });
    expect(tambahKode(d, { kode: 'I10', nama: 'x' }).length).toBe(2);
    expect(d[1].peran).toBe('penyerta');
    expect(jadikanKodeUtama(d, 'E78.0').map((x) => x.peran)).toEqual(['penyerta', 'utama']);
    expect(buangKode(d, 'I10')).toEqual([{ kode: 'E78.0', nama: 'Kolesterol', peran: 'utama' }]);
    expect(buangKode(d, 'E78.0')[0].peran).toBe('utama');
    expect(tambahKodeTindakan([], { kode: '89.52', nama: 'EKG' }).length).toBe(1);
    expect(tambahKodeTindakan([{ kode: '89.52', nama: 'EKG' }], { kode: '89.52', nama: 'EKG' }).length).toBe(1);
  });
  it('galat: tepat satu utama, kode sah dan unik, minimal satu diagnosis', () => {
    expect(galatKode({ diagnosis: [], tindakan: [], catatan: '' }).diagnosis).toBeTruthy();
    expect(galatKode({ ...awalKode({ final: null, dokter }), catatan: '' })).toEqual({});
    expect(Object.keys(galatKode({ diagnosis: [{ kode: 'XYZ', nama: 'x', peran: 'utama' }], tindakan: [], catatan: '' }))).toContain('diagnosis.0.kode');
    expect(galatKode({ diagnosis: [{ kode: 'I10', nama: 'a', peran: 'penyerta' }], tindakan: [], catatan: '' }).diagnosis).toBeTruthy();
    expect(Object.keys(galatKode({ diagnosis: [{ kode: 'I10', nama: 'a', peran: 'utama' }], tindakan: [{ kode: '8952', nama: 'x' }], catatan: '' }))).toContain('tindakan.0.kode');
    expect(bentukKode({ diagnosis: [], tindakan: [], catatan: '  ' }).catatan).toBeNull();
  });
  it('mengubah kode final butuh catatan; tanpa perubahan tidak', () => {
    const final = { final: { diagnosis: dokter.diagnosis, tindakan: dokter.tindakan, catatan: null } };
    const sama = awalKode({ ...final, dokter });
    expect(berubahDariFinal(sama, final)).toBe(false);
    expect(perluCatatanKode(sama, final)).toBe(false);
    const ubah = { ...sama, diagnosis: [sama.diagnosis[0]] };
    expect(berubahDariFinal(ubah, final)).toBe(true);
    expect(perluCatatanKode(ubah, final)).toBe(true);
    expect(perluCatatanKode({ ...ubah, catatan: 'dihapus' }, final)).toBe(false);
    expect(perluCatatanKode(ubah, { final: null })).toBe(false);
  });
});

describe('tinjau perbaikan', () => {
  it('meringkas isi menjadi baris dan menandai yang berbeda', () => {
    const lama = ringkasIsi({ item: [{ kode: 'I10', nama: 'Hipertensi', peran: 'utama', snomed: null }] });
    const baru = ringkasIsi({ item: [{ kode: 'J06.9', nama: 'ISPA', peran: 'utama', snomed: null }] });
    expect(lama).toEqual(['item:', '  1. I10 · Hipertensi · utama']);
    const s = selisihBaris(lama, baru);
    expect(s.sekarang.map((x) => x.beda)).toEqual([false, true]);
    expect(s.usulan.map((x) => x.beda)).toEqual([false, true]);
    expect(ringkasIsi({ keluhan_utama: 'Pusing', penyerta: '' })).toEqual(['keluhan_utama: Pusing']);
    expect(ringkasIsi(null)).toEqual([]);
  });
  it('alasan perbaikan wajib', () => {
    expect(alasanPerbaikanSah('  ')).toBe(false);
    expect(alasanPerbaikanSah('salah ketik')).toBe(true);
  });
});
