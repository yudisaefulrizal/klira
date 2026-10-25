import { aksiKlaimTersedia, batasAjukanUlang, batasPengajuan, berkasKurang, kodeKlaimBeda, sisaHariBatas, statusAwalKlaim, statusKlaimEfektif } from './klaim';

const d = (s: string) => new Date(s);

describe('batas pengajuan klaim', () => {
  it('6 bulan sejak pelayanan selesai sampai akhir hari WIB', () => {
    expect(batasPengajuan(d('2026-03-10T05:00:00Z')).toISOString()).toBe('2026-09-10T16:59:59.999Z');
  });
  it('31 Agustus menjadi akhir Februari (kabisat dan bukan)', () => {
    expect(batasPengajuan(d('2027-08-31T05:00:00Z')).toISOString()).toBe('2028-02-29T16:59:59.999Z');
    expect(batasPengajuan(d('2026-08-31T05:00:00Z')).toISOString()).toBe('2027-02-28T16:59:59.999Z');
  });
  it('tanggal WIB dipakai: 31 Des 20.00 UTC sudah 1 Januari WIB', () => {
    expect(batasPengajuan(d('2026-12-31T20:00:00Z')).toISOString()).toBe('2027-07-01T16:59:59.999Z');
  });
  it('batas ajukan ulang: akhir bulan berikutnya (lintas tahun)', () => {
    expect(batasAjukanUlang(d('2026-12-15T05:00:00Z')).toISOString()).toBe('2027-01-31T16:59:59.999Z');
    expect(batasAjukanUlang(d('2026-01-31T05:00:00Z')).toISOString()).toBe('2026-02-28T16:59:59.999Z');
  });
});

describe('status efektif dan sisa hari', () => {
  const dasar = { batas_pengajuan: d('2026-09-10T16:59:59.999Z'), batas_ajukan_ulang: d('2026-10-31T16:59:59.999Z') };
  it('belum diajukan melewati batas menjadi lewat batas; yang sudah diajukan tidak', () => {
    expect(statusKlaimEfektif({ ...dasar, status: 'siap_diajukan' }, d('2026-09-11T00:00:00Z'))).toBe('lewat_batas_waktu');
    expect(statusKlaimEfektif({ ...dasar, status: 'menunggu_sep' }, d('2026-09-10T16:00:00Z'))).toBe('menunggu_sep');
    expect(statusKlaimEfektif({ ...dasar, status: 'diajukan' }, d('2027-01-01T00:00:00Z'))).toBe('diajukan');
  });
  it('dikembalikan melewati batas ajukan ulang menjadi lewat batas', () => {
    expect(statusKlaimEfektif({ ...dasar, status: 'dikembalikan' }, d('2026-10-31T16:00:00Z'))).toBe('dikembalikan');
    expect(statusKlaimEfektif({ ...dasar, status: 'dikembalikan' }, d('2026-11-01T00:00:00Z'))).toBe('lewat_batas_waktu');
  });
  it('sisa hari hanya untuk klaim yang belum final', () => {
    expect(sisaHariBatas({ ...dasar, status: 'siap_diajukan' }, d('2026-09-01T00:00:00Z'))).toBe(10);
    expect(sisaHariBatas({ ...dasar, status: 'dibayar' }, d('2026-09-01T00:00:00Z'))).toBeNull();
  });
});

describe('transisi dan kelengkapan', () => {
  it('aksi tersedia menurut status', () => {
    expect(aksiKlaimTersedia('siap_diajukan')).toEqual(['ajukan']);
    expect(aksiKlaimTersedia('diajukan')).toEqual(['dikembalikan', 'ditolak', 'dibayar']);
    expect(aksiKlaimTersedia('dikembalikan')).toEqual(['ajukan_ulang']);
    expect(aksiKlaimTersedia('dibayar')).toEqual([]);
    expect(aksiKlaimTersedia('lewat_batas_waktu')).toEqual([]);
    expect(aksiKlaimTersedia('menunggu_sep')).toEqual([]);
  });
  it('status awal: siap hanya bila SEP dan berkas wajib lengkap (rawat inap butuh SPRI dan ringkasan)', () => {
    const lengkapRj = ['fpk', 'rekapitulasi', 'kuitansi', 'surat_tanggung_jawab'];
    expect(statusAwalKlaim({ nomor_sep: 'SEP1', berkas: lengkapRj, jenis: 'AMB', resume_ada: false })).toBe('siap_diajukan');
    expect(statusAwalKlaim({ nomor_sep: null, berkas: lengkapRj, jenis: 'AMB', resume_ada: false })).toBe('menunggu_sep');
    expect(statusAwalKlaim({ nomor_sep: ' ', berkas: lengkapRj, jenis: 'AMB', resume_ada: false })).toBe('menunggu_sep');
    expect(statusAwalKlaim({ nomor_sep: 'SEP1', berkas: lengkapRj.slice(1), jenis: 'AMB', resume_ada: false })).toBe('menunggu_sep');
    expect(statusAwalKlaim({ nomor_sep: 'SEP1', berkas: lengkapRj, jenis: 'IMP', resume_ada: true })).toBe('menunggu_sep');
    expect(statusAwalKlaim({ nomor_sep: 'SEP1', berkas: [...lengkapRj, 'spri', 'ringkasan_rm'], jenis: 'IMP', resume_ada: false })).toBe('menunggu_sep');
    expect(statusAwalKlaim({ nomor_sep: 'SEP1', berkas: [...lengkapRj, 'spri', 'ringkasan_rm'], jenis: 'IMP', resume_ada: true })).toBe('siap_diajukan');
    expect(berkasKurang('IMP', lengkapRj)).toEqual(['spri', 'ringkasan_rm']);
  });
  it('kode klaim dibandingkan sebagai himpunan', () => {
    const a = { diagnosis: [{ kode: 'I10', nama: 'x' }, { kode: 'E11', nama: 'y' }], tindakan: [] };
    expect(kodeKlaimBeda(a, { diagnosis: [{ kode: 'E11', nama: 'y' }, { kode: 'I10', nama: 'x' }], tindakan: [] })).toBe(false);
    expect(kodeKlaimBeda(a, { diagnosis: [{ kode: 'I10', nama: 'x' }], tindakan: [] })).toBe(true);
    expect(kodeKlaimBeda(a, { ...a, tindakan: [{ kode: '89.52', nama: 'EKG' }] })).toBe(true);
  });
});
