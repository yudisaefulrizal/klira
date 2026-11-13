import { jest } from '@jest/globals';

const { filterMaster } = await import("@klira/shared");
const { pool } = await import("@klira/db");
const { RepositoriMasterMysql } = await import("../data-access/repositori.js");

test('master wilayah membaca snapshot aplikasi tanpa tabel DB dan tetap mendukung paginasi/tingkat', async () => {
    const query = jest.spyOn(pool, 'query');
    const repo = new RepositoriMasterMysql();
    const h = await repo.daftar(7, 'wilayah', filterMaster.parse({ tingkat: 'provinsi', cari: 'Aceh' }));
    expect(h.total).toBe(1);
    expect(h.baris[0]).toMatchObject({ kode: '11', nama: 'Aceh', induk_kode: null, contoh: false });
    const halaman = await repo.daftar(99, 'wilayah', filterMaster.parse({ tingkat: 'provinsi', halaman: 2, ukuran: 10 }));
    expect(halaman.total).toBe(38);
    expect(halaman.baris).toHaveLength(10);
    expect(query).not.toHaveBeenCalled();
    query.mockRestore();
});