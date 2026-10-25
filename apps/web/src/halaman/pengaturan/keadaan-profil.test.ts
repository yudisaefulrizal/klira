import { bentukProfil, formDariProfil, galatProfil, labelJenisRiwayat, profilBerubah } from './keadaan-profil';

const dto = { id: 1, nama: 'Klinik', jenis: 'klinik_pratama_rawat_jalan' as const, bentuk_usaha: null, kode_registrasi: 'K-1', organization_id: null, status_akreditasi: 'Dasar', tanggal_akreditasi: '2025-01-02', puskesmas_wilayah: null };

describe('keadaan profil klinik', () => {
  it('form dari dto: null menjadi kosong', () => {
    expect(formDariProfil(dto)).toMatchObject({ bentuk_usaha: '', tanggal_akreditasi: '2025-01-02', jenis: 'klinik_pratama_rawat_jalan' });
  });
  it('bentuk: kosong opsional dihilangkan', () => {
    const b = bentukProfil({ ...formDariProfil(dto), nama: ' Klinik ' });
    expect(b.nama).toBe('Klinik');
    expect(b.bentuk_usaha).toBeUndefined();
    expect(b.kode_registrasi).toBe('K-1');
  });
  it('validasi nama dan jenis', () => {
    expect(galatProfil(formDariProfil(dto))).toEqual({});
    expect(galatProfil({ ...formDariProfil(dto), nama: '' }).nama).toBeDefined();
    expect(galatProfil({ ...formDariProfil(dto), jenis: 'rumah_sakit' }).jenis).toBeDefined();
  });
  it('perubahan dan label riwayat', () => {
    const f = formDariProfil(dto);
    expect(profilBerubah(f, { ...f, nama: 'Klinik ' })).toBe(false);
    expect(profilBerubah(f, { ...f, nama: 'Lain' })).toBe(true);
    expect(labelJenisRiwayat('sip')).toBe('SIP tenaga');
    expect(labelJenisRiwayat('x')).toBe('x');
  });
});
