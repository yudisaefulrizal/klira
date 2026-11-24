
const { WILAYAH_CONTOH, bacaCsvWilayah } = await import("./wilayah.js");

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
