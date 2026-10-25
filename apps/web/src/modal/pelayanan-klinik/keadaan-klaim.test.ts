import { BERKAS_KLAIM } from '@klira/shared';
import type { KandidatKlaimDto } from '@klira/shared';
import { alihBerkas, awalKlaim, awalStatusKlaim, galatKlaim, galatStatusKlaim, kurangBerkas, langkahBermasalahKlaim, pilihKandidat } from './keadaan-klaim';

describe('keadaan penyiapan klaim', () => {
  it('butuh kunjungan; SEP boleh kosong; nomor SEP dari kunjungan mengisi yang kosong saja', () => {
    expect(galatKlaim(awalKlaim(), false).kunjungan_id).toBeDefined();
    expect(langkahBermasalahKlaim(galatKlaim(awalKlaim(), false))).toBe(0);
    const kand = { kunjungan_id: 7, nomor_sep: 'SEP-7' } as KandidatKlaimDto;
    const k = pilihKandidat(awalKlaim(), kand);
    expect(k).toMatchObject({ kunjungan_id: 7, nomor_sep: 'SEP-7' });
    expect(galatKlaim(k, false)).toEqual({});
    expect(pilihKandidat({ ...awalKlaim(), nomor_sep: 'ketik' }, kand).nomor_sep).toBe('ketik');
    expect(galatKlaim({ ...awalKlaim(), nomor_sep: '' }, true)).toEqual({});
  });
  it('berkas dialihkan sesuai urutan katalog dan kekurangan dihitung per jenis', () => {
    let k = awalKlaim();
    k = alihBerkas(k, 'kuitansi', true, BERKAS_KLAIM);
    k = alihBerkas(k, 'fpk', true, BERKAS_KLAIM);
    expect(k.berkas).toEqual(['fpk', 'kuitansi']);
    expect(alihBerkas(k, 'fpk', false, BERKAS_KLAIM).berkas).toEqual(['kuitansi']);
    expect(kurangBerkas('AMB', k)).toEqual(['rekapitulasi', 'surat_tanggung_jawab']);
    expect(kurangBerkas('IMP', k)).toEqual(['rekapitulasi', 'surat_tanggung_jawab', 'spri', 'ringkasan_rm']);
  });
});

describe('keadaan ubah status klaim', () => {
  it('isian wajib menurut aksi', () => {
    expect(galatStatusKlaim(awalStatusKlaim()).aksi).toBeDefined();
    expect(galatStatusKlaim(awalStatusKlaim('ajukan'))).toEqual({});
    expect(galatStatusKlaim(awalStatusKlaim('dikembalikan')).berita_acara).toBeDefined();
    expect(galatStatusKlaim(awalStatusKlaim('ditolak')).alasan).toBeDefined();
    const bayar = awalStatusKlaim('dibayar', '2026-10-25');
    expect(galatStatusKlaim(bayar).jumlah_dibayar).toBeDefined();
    expect(galatStatusKlaim({ ...bayar, jumlah_dibayar: '150000' })).toEqual({});
    expect(galatStatusKlaim({ ...bayar, jumlah_dibayar: '-5' }).jumlah_dibayar).toBeDefined();
    expect(galatStatusKlaim({ ...bayar, jumlah_dibayar: '100', dibayar_pada: '' }).dibayar_pada).toBeDefined();
  });
});
