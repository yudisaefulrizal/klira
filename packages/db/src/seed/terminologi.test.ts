import * as uji from '@klira/db/uji';
import { TANDA_VITAL } from '@klira/shared';
import { TERMINOLOGI_CONTOH, bacaCsvTerminologi, imporTerminologiCsv, seedTerminologiContoh } from './terminologi';

describe('CSV terminologi', () => {
  it('membaca judul, kutip, dan penanda aktif', () => {
    const { baris, galat } = bacaCsvTerminologi('sistem,kode,nama,aktif\r\nicd10,Z99.1,"Nama, uji",0\nICD9CM,00.01,Tindakan uji\n\n');
    expect(galat).toEqual([]);
    expect(baris).toEqual([
      { sistem: 'icd10', kode: 'Z99.1', nama: 'Nama, uji', aktif: false },
      { sistem: 'icd9cm', kode: '00.01', nama: 'Tindakan uji', aktif: true },
    ]);
  });

  it('melaporkan baris tidak sah tanpa menghentikan baris lain', () => {
    const { baris, galat } = bacaCsvTerminologi('icd10,A00,Ok\nlainnya,B00,Sistem salah\nicd10,,Tanpa kode\nicd10,C00,');
    expect(baris.map((b) => b.kode)).toEqual(['A00']);
    expect(galat).toHaveLength(3);
  });

  it('contoh memuat kode LOINC dan UCUM untuk semua tanda vital', () => {
    for (const t of TANDA_VITAL) {
      expect(TERMINOLOGI_CONTOH.some((c) => c.sistem === 'loinc' && c.kode === t.loinc)).toBe(true);
      expect(TERMINOLOGI_CONTOH.some((c) => c.sistem === 'ucum' && c.kode === t.satuan)).toBe(true);
    }
  });
});

const url = (process.env.KLIRA_UJI_DB === '1' ? process.env.DATABASE_URL : undefined);
(url ? describe : describe.skip)('terminologi di database pengujian', () => {

  afterAll(async () => {
    await uji.hapusKodeTerminologiUntukSeedTerminologiTest(['ZZ9.9', ...TERMINOLOGI_CONTOH.map((c) => c.kode)]);
    await uji.tutupPool();
  });

  it('seed contoh idempoten dan bertanda contoh; impor CSV menimpa tanpa tanda contoh', async () => {
    await seedTerminologiContoh(uji.pool);
    await seedTerminologiContoh(uji.pool);
    const i10 = await uji.daftarKodeTerminologiUntukSeedTerminologiTest('icd10', 'I10');
    expect(i10).toHaveLength(1);
    expect(i10[0].contoh).toBe(true);
    const h = await imporTerminologiCsv(uji.pool, 'icd10,ZZ9.9,Kode uji impor');
    expect(h).toEqual({ diimpor: 1, galat: [] });
    expect((await uji.wajibKodeTerminologiUntukSeedTerminologiTest('icd10', 'ZZ9.9')).contoh).toBe(false);
  });
});
