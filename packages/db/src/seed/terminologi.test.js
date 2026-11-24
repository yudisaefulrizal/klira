
const { TANDA_VITAL } = await import("@klira/shared");
const { TERMINOLOGI_CONTOH, bacaCsvTerminologi } = await import("./terminologi.js");

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
