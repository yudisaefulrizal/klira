import { POLA_LOINC } from '@klira/shared';
import { PEMERIKSAAN_CONTOH } from './penunjang';
import { TEKS_PERSETUJUAN_TINDAKAN_V1 } from './seed';

describe('seed penunjang contoh', () => {
  it('kode unik, LOINC berpola, satuan terisi, rentang konsisten, dan harga positif', () => {
    expect(new Set(PEMERIKSAAN_CONTOH.map((p) => p.kode)).size).toBe(PEMERIKSAAN_CONTOH.length);
    for (const p of PEMERIKSAAN_CONTOH) {
      expect(p.kode_loinc).toMatch(POLA_LOINC);
      expect(p.satuan).not.toBe('');
      if (p.rujukan_min !== null && p.rujukan_maks !== null) expect(p.rujukan_min).toBeLessThanOrEqual(p.rujukan_maks);
      expect(p.harga_umum).toBeGreaterThan(0);
    }
  });
  it('teks persetujuan tindakan contoh bertanda contoh dan berversi 1', () => {
    expect(TEKS_PERSETUJUAN_TINDAKAN_V1.versi).toBe(1);
    expect(TEKS_PERSETUJUAN_TINDAKAN_V1.jenis).toBe('tindakan');
    expect(TEKS_PERSETUJUAN_TINDAKAN_V1.judul).toMatch(/contoh/i);
  });
});
