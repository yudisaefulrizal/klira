import { jest } from '@jest/globals';

const { mkdtemp, rm, writeFile } = await import("node:fs/promises");
const { tmpdir } = await import("node:os");
const { join } = await import("node:path");
const { bacaMigrasi, buatMigrasi, pecahSql, periksaRiwayat } = await import("./berkas.js");

let folder;

beforeEach(async () => { folder = await mkdtemp(join(tmpdir(), 'klira-migrasi-')); });

afterEach(async () => { await rm(folder, { recursive: true, force: true }); });

test('nomor baru berurutan dan berkas tidak ditimpa', async () => {
    expect(await buatMigrasi(folder, 'awal')).toBe('0001_awal.sql');
    expect(await buatMigrasi(folder, 'tambah_indeks')).toBe('0002_tambah_indeks.sql');
    await expect(buatMigrasi(folder, '../salah')).rejects.toThrow();
});

test('nomor duplikat dan nama tidak sah ditolak', async () => {
    await writeFile(join(folder, '0001_awal.sql'), 'SELECT 1;');
    await writeFile(join(folder, '0001_ganda.sql'), 'SELECT 2;');
    await expect(bacaMigrasi(folder)).rejects.toThrow('ganda');
});

test('perubahan checksum, berkas hilang, kegagalan, dan penyisipan nomor lama ditolak', async () => {
    await writeFile(join(folder, '0002_awal.sql'), 'SELECT 1;');
    const berkas = await bacaMigrasi(folder);
    const catatan = [{ ...berkas[0], selesai_pada: new Date() }];
    expect(() => periksaRiwayat(berkas, catatan)).not.toThrow();
    expect(() => periksaRiwayat([], catatan)).toThrow('hilang');
    expect(() => periksaRiwayat([{ ...berkas[0], checksum: 'berubah' }], catatan)).toThrow('Checksum');
    expect(() => periksaRiwayat(berkas, [{ ...catatan[0], selesai_pada: null }])).toThrow('belum selesai');
    await writeFile(join(folder, '0001_disisipkan.sql'), 'SELECT 2;');
    expect(() => periksaRiwayat([...berkas, { ...berkas[0], nomor: 1 }], catatan)).toThrow('nomor');
});

test('titik koma di string, komentar, dan trigger tidak memecah pernyataan', () => {
    const hasil = pecahSql(`-- pembuka
INSERT INTO contoh VALUES ('a; b', 'kutip\\\' dan ;', "x;y", \`a;b\`);
/* komentar ; */
DELIMITER $$
CREATE TRIGGER contoh AFTER INSERT ON data FOR EACH ROW BEGIN
  INSERT INTO riwayat VALUES (';');
  UPDATE data SET angka = 2;
END$$
DELIMITER ;
SELECT 1;
`);
    expect(hasil).toHaveLength(3);
    expect(hasil[1]).toContain("INSERT INTO riwayat VALUES (';');");
    expect(hasil[2]).toBe('SELECT 1');
});

test('SQL tidak lengkap ditolak sebelum migrasi dijalankan', () => {
    expect(() => pecahSql('SELECT 1')).toThrow('delimiter');
    expect(() => pecahSql("SELECT 'terbuka;")).toThrow('belum ditutup');
    expect(() => pecahSql('/* belum ditutup')).toThrow();
});