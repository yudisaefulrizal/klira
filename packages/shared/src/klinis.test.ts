import {
  anamnesisIsi, cariTerminologiMasukan, diagnosisIsi, favoritMasukan, keluargaMasukan, pemeriksaanIsi, SKEMA_BAGIAN, STATUS_PENGESAHAN, tandaVitalIsi, templatMasukan, tindakanIsi, tindakLanjutIsi,
  ubahKeluargaMasukan,
} from './index';

describe('skema catatan klinis', () => {
  it('anamnesis: keluhan wajib dan bidang kosong dinormalkan menjadi null', () => {
    expect(anamnesisIsi.safeParse({ keluhan_utama: '  ' }).success).toBe(false);
    expect(anamnesisIsi.parse({ keluhan_utama: ' Batuk ', alergi: ' ' })).toEqual({ keluhan_utama: 'Batuk', penyerta: null, riwayat_pribadi: null, riwayat_keluarga: null, alergi: null });
  });

  it('tanda vital: angka (juga teks berkoma) dalam rentang, minimal satu nilai', () => {
    const h = tandaVitalIsi.parse({ sistolik: '150', diastolik: 95, suhu: '36,7' });
    expect(h).toMatchObject({ sistolik: 150, diastolik: 95, suhu: 36.7, nadi: null, spo2: null });
    expect(tandaVitalIsi.safeParse({}).success).toBe(false);
    expect(tandaVitalIsi.safeParse({ suhu: 80 }).success).toBe(false);
    expect(tandaVitalIsi.safeParse({ nadi: 'abc' }).success).toBe(false);
  });

  it('pemeriksaan: minimal satu bidang terisi', () => {
    expect(pemeriksaanIsi.safeParse({}).success).toBe(false);
    expect(pemeriksaanIsi.parse({ keadaan_umum: 'Baik' })).toMatchObject({ keadaan_umum: 'Baik', abdomen: null });
  });

  it('diagnosis: kode ICD-10 sah, tepat satu utama, tanpa kode ganda', () => {
    const item = (kode: string, peran: 'utama' | 'penyerta') => ({ kode, nama: 'Nama', peran });
    expect(diagnosisIsi.parse({ item: [item('i10', 'utama'), item('E11.9', 'penyerta')] }).item[0]).toMatchObject({ kode: 'I10', snomed: null });
    expect(diagnosisIsi.safeParse({ item: [] }).success).toBe(false);
    expect(diagnosisIsi.safeParse({ item: [item('I10', 'penyerta')] }).success).toBe(false);
    expect(diagnosisIsi.safeParse({ item: [item('I10', 'utama'), item('E11', 'utama')] }).success).toBe(false);
    expect(diagnosisIsi.safeParse({ item: [item('I10', 'utama'), item('I10', 'penyerta')] }).success).toBe(false);
    expect(diagnosisIsi.safeParse({ item: [item('XYZ', 'utama')] }).success).toBe(false);
  });

  it('tindakan: kode ICD-9 CM, waktu ISO, selesai tidak sebelum mulai, tanggal tidak sebelum 2014-06-03', () => {
    const ok = tindakanIsi.parse({ item: [{ kode: '89.52', nama: 'EKG', mulai: '2026-10-25T01:00:00Z', selesai: '' }] });
    expect(ok.item[0]).toMatchObject({ mulai: '2026-10-25T01:00:00.000Z', selesai: null });
    expect(tindakanIsi.safeParse({ item: [{ kode: '89.52', nama: 'EKG', mulai: '2026-10-25T01:00:00Z', selesai: '2026-10-25T00:00:00Z' }] }).success).toBe(false);
    expect(tindakanIsi.safeParse({ item: [{ kode: '89.52', nama: 'EKG', mulai: '2010-01-01T00:00:00Z' }] }).success).toBe(false);
    expect(tindakanIsi.safeParse({ item: [{ kode: 'A10', nama: 'Salah', mulai: '2026-10-25T01:00:00Z' }] }).success).toBe(false);
    expect(tindakanIsi.parse({ item: [] })).toEqual({ item: [] });
  });

  it('tindak lanjut: rujuk butuh tujuan; tujuan dan SPRI dikosongkan menurut jenis', () => {
    expect(tindakLanjutIsi.safeParse({ jenis: 'rujuk' }).success).toBe(false);
    expect(tindakLanjutIsi.parse({ jenis: 'pulang', tujuan: 'x', spri: 'y' })).toMatchObject({ tujuan: null, spri: null });
    expect(tindakLanjutIsi.parse({ jenis: 'rawat_inap', spri: 'SPRI-1' })).toMatchObject({ spri: 'SPRI-1' });
    expect(tindakLanjutIsi.parse({ jenis: 'rujuk', tujuan: 'RS A', spri: 'y' })).toMatchObject({ tujuan: 'RS A', spri: null });
  });

  it('semua bagian punya skema', () => {
    expect(Object.keys(SKEMA_BAGIAN).sort()).toEqual(['anamnesis', 'tanda_vital', 'pemeriksaan', 'diagnosis', 'tindakan', 'tindak_lanjut', 'assessment', 'plan', 'implementasi', 'evaluasi'].sort());
  });
});

describe('skema pendamping', () => {
  it('pencarian terminologi dibatasi dan wajib berkata kunci', () => {
    expect(cariTerminologiMasukan.parse({ sistem: 'icd10', q: ' hiper ' })).toEqual({ sistem: 'icd10', q: 'hiper', batas: 10 });
    expect(cariTerminologiMasukan.safeParse({ sistem: 'icd10', q: '' }).success).toBe(false);
    expect(cariTerminologiMasukan.safeParse({ sistem: 'icd10', q: 'a', batas: 500 }).success).toBe(false);
    expect(cariTerminologiMasukan.safeParse({ sistem: 'lain', q: 'a' }).success).toBe(false);
  });
  it('favorit, templat, dan keluarga', () => {
    expect(favoritMasukan.safeParse({ jenis: 'diagnosis', kode: 'I10', nama: 'Hipertensi' }).success).toBe(true);
    expect(favoritMasukan.safeParse({ jenis: 'lain', kode: 'I10', nama: 'x' }).success).toBe(false);
    expect(templatMasukan.safeParse({ bagian: 'anamnesis', nama: 'Batuk', isi: { keluhan_utama: 'Batuk' } }).success).toBe(true);
    expect(templatMasukan.safeParse({ bagian: 'tindakan', nama: 'x', isi: {} }).success).toBe(false);
    expect(keluargaMasukan.safeParse({ anggota_pasien_id: 3, hubungan: 'Anak' }).success).toBe(true);
    expect(ubahKeluargaMasukan.safeParse({}).success).toBe(false);
    expect(ubahKeluargaMasukan.safeParse({ dibatasi: true }).success).toBe(true);
  });
  it('label status pengesahan dipetakan sekali', () => {
    expect(STATUS_PENGESAHAN.label('berubah')).toBe('Berubah setelah disahkan');
    expect(STATUS_PENGESAHAN.warna('sah')).toBe('hijau');
  });
});
