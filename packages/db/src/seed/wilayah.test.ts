import * as uji from '@klira/db/uji';
import { WILAYAH_CONTOH, bacaCsvWilayah, imporWilayahCsv, seedWilayahContoh } from './wilayah';

describe('CSV wilayah', () => {
  it('membaca judul, kutip, serta melengkapi tingkat dan induk dari kode', () => {
    const { baris, galat } = bacaCsvWilayah('kode,nama,tingkat,induk_kode\r\n98,"Provinsi, Uji",,\n98.02,Kab Uji\n98.02.03,Kec Uji,kecamatan,98.02\n\n');
    expect(galat).toEqual([]);
    expect(baris).toEqual([
      { kode: '98', nama: 'Provinsi, Uji', tingkat: 'provinsi', induk_kode: null },
      { kode: '98.02', nama: 'Kab Uji', tingkat: 'kabupaten_kota', induk_kode: '98' },
      { kode: '98.02.03', nama: 'Kec Uji', tingkat: 'kecamatan', induk_kode: '98.02' },
    ]);
  });

  it('melaporkan baris tidak sah tanpa menghentikan baris lain', () => {
    const { baris, galat } = bacaCsvWilayah('98,Ok\n,Tanpa kode\n98.1.2.3.4,Terlalu dalam\n98.5,Nama,tingkat-salah');
    expect(baris.map((b) => b.kode)).toEqual(['98']);
    expect(galat).toHaveLength(3);
  });

  it('seed contoh memakai kode fiktif', () => {
    expect(WILAYAH_CONTOH.every((w) => w.kode.startsWith('99') && w.nama.includes('Contoh'))).toBe(true);
  });
});

const url = (process.env.KLIRA_UJI_DB === '1' ? process.env.DATABASE_URL : undefined);
(url ? describe : describe.skip)('wilayah di database pengujian', () => {

  afterAll(async () => {
    await uji.hapusWilayahUntukSeedWilayahTest(['97', '97.01', ...WILAYAH_CONTOH.map((w) => w.kode)]);
    await uji.tutupPool();
  });

  it('impor idempoten, contoh ditandai, impor resmi menimpa penanda', async () => {
    await seedWilayahContoh(uji.pool);
    await seedWilayahContoh(uji.pool);
    expect(await uji.hitungWilayahUntukSeedWilayahTest('99')).toBe(WILAYAH_CONTOH.length);
    expect((await uji.wajibWilayahUntukSeedWilayahTest('99')).contoh).toBe(true);
    const h = await imporWilayahCsv(uji.pool, '97,Uji Impor\n97.01,Uji Kab');
    expect(h).toEqual({ diimpor: 2, galat: [] });
    expect((await uji.wajibWilayahUntukSeedWilayahTest('97.01')).contoh).toBe(false);
  });
});
