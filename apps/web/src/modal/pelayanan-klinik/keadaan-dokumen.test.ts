import { adaSuratBaru, awalLaporan, awalPembukaan, awalPenyampaian, awalResume, galatLaporan, galatPembukaan, galatPenyampaian, galatResume, langkahBermasalahResume, resumeSama } from './keadaan-dokumen';
import type { DokumenKunjunganDto } from '@klira/shared';

const dok = (resume: DokumenKunjunganDto['resume'] = null): DokumenKunjunganDto => ({
  kunjungan: { id: 1, pasien_id: 1, pasien_nama: 'A', pasien_nomor_rm: 'RM1', tahap_layanan: 'ditutup' }, resume, saran: { diagnosis_akhir: 'I10 Hipertensi', terapi: 'Amlodipin', kondisi_pulang: '' }, surat: [],
});
const tersimpan = { ringkasan: 'Ringkas', diagnosis_akhir: 'I10 Hipertensi', terapi: 'Amlodipin', kondisi_pulang: 'Membaik', anjuran: null };

describe('keadaan resume dan surat', () => {
  it('isian awal dari saran saat belum ada resume, dari resume tersimpan saat ada', () => {
    expect(awalResume(dok()).diagnosis_akhir).toBe('I10 Hipertensi');
    const k = awalResume(dok({ isi: tersimpan, versi: 1, pengesahan: null, verifikasi: 'sah', diperbarui_pada: '' }));
    expect(k.ringkasan).toBe('Ringkas');
    expect(resumeSama(k, dok({ isi: tersimpan, versi: 1, pengesahan: null, verifikasi: 'sah', diperbarui_pada: '' }))).toBe(true);
  });
  it('resume baru butuh ringkasan dan kondisi pulang; ubah resume lama butuh alasan', () => {
    const baru = galatResume(awalResume(dok()), dok());
    expect(baru.ringkasan).toBeDefined();
    expect(baru.kondisi_pulang).toBeDefined();
    const d = dok({ isi: tersimpan, versi: 1, pengesahan: null, verifikasi: 'sah', diperbarui_pada: '' });
    const k = { ...awalResume(d), anjuran: 'Kontrol' };
    expect(galatResume(k, d).alasan).toBeDefined();
    expect(galatResume({ ...k, alasan: 'Koreksi' }, d)).toEqual({});
    expect(langkahBermasalahResume({ alasan: 'x' })).toBe(1);
  });
  it('surat divalidasi hanya bila diisi; rujukan butuh tujuan', () => {
    const d = dok({ isi: tersimpan, versi: 1, pengesahan: null, verifikasi: 'sah', diperbarui_pada: '' });
    const k = awalResume(d);
    expect(adaSuratBaru(k)).toBe(false);
    expect(galatResume(k, d)).toEqual({});
    const g = galatResume({ ...k, surat_isi: 'Mohon tindak lanjut' }, d);
    expect(g.surat_tujuan).toBeDefined();
    expect(langkahBermasalahResume(g)).toBe(2);
  });
});

describe('keadaan pembukaan, penyampaian, laporan', () => {
  it('pembukaan butuh pasien, pemohon, alasan hukum untuk dasar hukum, dasar dan cakupan', () => {
    const g = galatPembukaan(awalPembukaan());
    expect(Object.keys(g)).toEqual(expect.arrayContaining(['pasien_id', 'pemohon_nama', 'alasan_hukum', 'dasar_rinci', 'cakupan']));
    const ok = { ...awalPembukaan(), pasien_id: 1, pemohon_nama: 'P', alasan_hukum: 'audit_medis', dasar_rinci: 'Surat 1', cakupan: 'Resume' };
    expect(galatPembukaan(ok)).toEqual({});
    expect(galatPembukaan({ ...ok, dasar: 'persetujuan', alasan_hukum: '' })).toEqual({});
  });
  it('penyampaian ke keluarga butuh bukti persetujuan', () => {
    const k = { ...awalPenyampaian(), pasien_id: 1, penerima_nama: 'Ibu' };
    expect(galatPenyampaian(k)).toEqual({});
    expect(galatPenyampaian({ ...k, hubungan: 'keluarga' }).bukti_persetujuan).toBeDefined();
    expect(galatPenyampaian({ ...k, hubungan: 'keluarga', bukti_persetujuan: 'Surat kuasa' })).toEqual({});
  });
  it('laporan menolak rentang terbalik', () => {
    expect(galatLaporan(awalLaporan())).toEqual({});
    expect(galatLaporan({ ...awalLaporan(), dari: '2026-02-01', sampai: '2026-01-01' }).sampai).toBeDefined();
  });
});
