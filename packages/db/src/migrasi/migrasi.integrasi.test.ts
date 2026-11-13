import { mkdtemp, cp, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pool, transaksi, baca, tulis } from '../koneksi';
import { jalankanMigrasi } from './entry-points/cli';
import { bacaMigrasi } from './domain/berkas';
import { daftarRiwayat, kunciMigrasi, lepasKunci } from './data-access/riwayat';

const ujiDb = process.env.KLIRA_UJI_DB === '1' ? describe : describe.skip;
ujiDb('migrasi dan transaksi MySQL', () => {
  test('pengunci, checksum, kegagalan DDL, UTC, serta commit dan rollback transaksi', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'klira-migrasi-'));
    await cp(resolve(__dirname, '../../migrasi'), folder, { recursive: true });
    const nomor = Math.max(...(await bacaMigrasi(folder)).map(b => b.nomor)) + 1;
    const nama = `${String(nomor).padStart(4, '0')}_uji.sql`;
    const namaGagal = `${String(nomor + 1).padStart(4, '0')}_uji_gagal.sql`;
    const sql = 'CREATE TABLE uji_migrasi (id INT PRIMARY KEY, waktu DATETIME(3) NOT NULL);\nINSERT INTO uji_migrasi VALUES (1, CURRENT_TIMESTAMP(3));\n';
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await expect(jalankanMigrasi(['fresh'], folder, { NODE_ENV: 'production' })).rejects.toThrow('fresh');
      const a = await pool.getConnection(), b = await pool.getConnection();
      let kunci: string | undefined;
      try {
        kunci = await kunciMigrasi(a);
        const [hasil] = await baca<{ terkunci: number }>('SELECT GET_LOCK(?, 0) AS terkunci', [kunci], b);
        expect(hasil.terkunci).toBe(0);
      } finally { if (kunci) await lepasKunci(a, kunci); a.release(); b.release(); }

      await writeFile(join(folder, nama), sql);
      await jalankanMigrasi(['status'], folder);
      expect(log).toHaveBeenCalledWith(`belum\t${nama}`);
      await jalankanMigrasi(['terapkan'], folder);
      await jalankanMigrasi(['terapkan'], folder);
      expect((await baca('SELECT id FROM uji_migrasi'))).toHaveLength(1);
      const waktu = new Date('2026-11-13T01:02:03.123Z');
      await expect(transaksi(async koneksi => {
        await tulis('INSERT INTO uji_migrasi VALUES (?, ?)', [2, waktu], koneksi);
        throw new Error('batalkan');
      })).rejects.toThrow('batalkan');
      expect(await baca('SELECT id FROM uji_migrasi WHERE id = ?', [2])).toHaveLength(0);
      await transaksi(async koneksi => {
        const [zona] = await baca<{ zona: string }>('SELECT @@session.time_zone AS zona', [], koneksi);
        expect(zona.zona).toBe('+00:00');
        await tulis('INSERT INTO uji_migrasi VALUES (?, ?)', [2, waktu], koneksi);
      });
      expect((await baca<{ waktu: Date }>('SELECT waktu FROM uji_migrasi WHERE id = ?', [2]))[0].waktu).toEqual(waktu);

      await writeFile(join(folder, nama), sql + '-- berubah\n');
      await expect(jalankanMigrasi(['terapkan'], folder)).rejects.toThrow('Checksum berubah');
      await writeFile(join(folder, nama), sql);
      await writeFile(join(folder, namaGagal), 'CREATE TABLE uji_migrasi_gagal (id INT PRIMARY KEY);\nINSERT INTO uji_migrasi_gagal (kolom_tidak_ada) VALUES (1);\n');
      await expect(jalankanMigrasi(['terapkan'], folder)).rejects.toThrow();
      const riwayat = await daftarRiwayat(pool);
      expect(riwayat.find(r => r.nomor === nomor)?.selesai_pada).toBeInstanceOf(Date);
      expect(riwayat.find(r => r.nomor === nomor + 1)?.selesai_pada).toBeNull();
      await expect(jalankanMigrasi(['terapkan'], folder)).rejects.toThrow('belum selesai');
    } finally {
      await tulis('DROP TABLE IF EXISTS uji_migrasi_gagal');
      await tulis('DROP TABLE IF EXISTS uji_migrasi');
      await tulis('DELETE FROM _migrasi WHERE nomor IN (?)', [[nomor, nomor + 1]]);
      log.mockRestore();
      await rm(folder, { recursive: true, force: true });
    }
  });
});
