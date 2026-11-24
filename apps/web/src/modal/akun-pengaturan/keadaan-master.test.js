import { DEFINISI_MASTER, JENIS_MASTER_UBAH, MASTER } from '@klira/shared';
import { awalMaster, bentukMasukan, bidangAktif, bidangTampil, galatMaster, masterBerubah, opsiDenganNilaiSaatIni, petunjukSaatIni, wajibSaatIni } from './keadaan-master.js';
describe('bentuk generik master', () => {
    it('setiap jenis punya bidang dan awal yang sesuai definisi (praktisi menyembunyikan pengguna saat ubah)', () => {
        for (const j of JENIS_MASTER_UBAH)
            expect(Object.keys(awalMaster(j))).toEqual(bidangTampil(j, false).map((b) => b.kunci));
        expect(bidangTampil('praktisi', false).map((b) => b.kunci)).toContain('pengguna_id');
        expect(bidangTampil('praktisi', true).map((b) => b.kunci)).not.toContain('pengguna_id');
        expect(awalMaster('poli').status_operasional).toBe('O');
    });
    it('awal ubah memakai baris, null menjadi kosong', () => {
        const awal = awalMaster('tarif', { id: 1, aktif: true, kode: 'K', nama: 'N', jenis: 'lab', harga_umum: 1000, harga_jkn: null });
        expect(awal).toEqual({ kode: 'K', nama: 'N', jenis: 'lab', harga_umum: '1000', harga_jkn: '', kode_icd9cm: '' });
    });
    it('tarif tindakan: kode ICD-9-CM tampil dan wajib, kode tarif dan harga umum tidak wajib', () => {
        const lab = { ...awalMaster('tarif'), jenis: 'lab' };
        const tindakan = { ...awalMaster('tarif'), jenis: 'tindakan', nama: 'Jahit luka' };
        expect(bidangAktif('tarif', false, lab).map((b) => b.kunci)).not.toContain('kode_icd9cm');
        expect(bidangAktif('tarif', false, tindakan).map((b) => b.kunci)).toContain('kode_icd9cm');
        const harga = DEFINISI_MASTER.tarif.bidang.find((b) => b.kunci === 'harga_umum');
        expect(wajibSaatIni(harga, lab)).toBe(true);
        expect(wajibSaatIni(harga, tindakan)).toBe(false);
        expect(petunjukSaatIni(harga, tindakan)).toBe(MASTER.petunjuk.hargaTindakan);
        expect(galatMaster('tarif', tindakan, false)).toEqual({ kode_icd9cm: MASTER.galat.icd9Wajib });
        expect(galatMaster('tarif', { ...tindakan, kode_icd9cm: '86.59' }, false)).toEqual({});
        expect(bentukMasukan('tarif', { ...tindakan, kode_icd9cm: '86.59' }, false)).toEqual({ jenis: 'tindakan', nama: 'Jahit luka', kode_icd9cm: '86.59' });
        // Kode ICD-9-CM tidak dikirim untuk jenis lain walau sempat diisi.
        expect(bentukMasukan('tarif', { ...lab, kode: 'L', nama: 'Lab', harga_umum: '1', kode_icd9cm: '86.59' }, false)).toEqual({ jenis: 'lab', kode: 'L', nama: 'Lab', harga_umum: 1 });
        expect(galatMaster('tarif', { ...lab, nama: 'Lab' }, false)).toMatchObject({ kode: MASTER.galat.wajib, harga_umum: MASTER.galat.wajib });
    });
    it('bentuk masukan mengubah tipe: angka, id, hari; kosong opsional tidak dikirim', () => {
        const m = bentukMasukan('jadwal', { pengguna_id: '3', lokasi_id: '4', hari: '2', shift_id: '5', kuota: '15' }, false);
        expect(m).toEqual({ pengguna_id: 3, lokasi_id: 4, hari: 2, shift_id: 5, kuota: 15 });
        expect(bentukMasukan('poli', { nama: ' Umum ', status_operasional: 'O', ihs_location_id: ' ' }, false)).toEqual({ nama: 'Umum', status_operasional: 'O' });
    });
    it('validasi memakai skema bersama dengan pesan Indonesia', () => {
        expect(galatMaster('poli', awalMaster('poli'), false)).toEqual({ nama: MASTER.galat.wajib });
        expect(galatMaster('poli', { ...awalMaster('poli'), nama: 'Umum' }, false)).toEqual({});
        expect(galatMaster('ruang_periksa', { ...awalMaster('ruang_periksa'), nama: 'Ruang 1' }, false)).toEqual({ induk_id: MASTER.galat.indukRuangPeriksa });
        expect(galatMaster('bed', { ...awalMaster('bed'), nama: 'B1' }, false)).toEqual({ induk_id: MASTER.galat.indukBed });
        const jadwal = { pengguna_id: '1', lokasi_id: '1', hari: '1', shift_id: '1', kuota: '0' };
        const g = galatMaster('jadwal', jadwal, false);
        expect(g.kuota).toBe(MASTER.galat.kuota);
        expect(galatMaster('jadwal', { ...jadwal, shift_id: '', kuota: '5' }, false).shift_id).toBeTruthy();
        expect(galatMaster('tarif', { kode: 'K', nama: 'N', jenis: 'lab', harga_umum: '-5', harga_jkn: '' }, false).harga_umum).toBe(MASTER.galat.angka);
        expect(galatMaster('praktisi', { profesi: 'Dokter', nomor_sip: '', masa_berlaku_sip: '', ihs_practitioner_id: '' }, true)).toEqual({});
        expect(galatMaster('praktisi', { pengguna_id: '', profesi: 'Dokter', nomor_sip: '', masa_berlaku_sip: '', ihs_practitioner_id: '' }, false).pengguna_id).toBe(MASTER.galat.wajib);
    });
    it('perubahan terdeteksi tanpa memperhatikan spasi tepi', () => {
        expect(masterBerubah({ nama: 'A' }, { nama: 'A ' })).toBe(false);
        expect(masterBerubah({ nama: 'A' }, { nama: 'B' })).toBe(true);
    });
    it('opsi rujukan memuat nilai saat ini bila tidak ada di daftar', () => {
        const baris = { id: 1, aktif: true, pengguna_id: 7, pengguna_nama: 'Dr. Lama' };
        expect(opsiDenganNilaiSaatIni([{ nilai: '1', label: 'A' }], 'pengguna_id', baris)).toEqual([{ nilai: '7', label: 'Dr. Lama' }, { nilai: '1', label: 'A' }]);
        expect(opsiDenganNilaiSaatIni([{ nilai: '7', label: 'Dr' }], 'pengguna_id', baris)).toHaveLength(1);
        expect(opsiDenganNilaiSaatIni([], 'induk_id')).toEqual([]);
    });
    it('definisi: wilayah hanya baca (tanpa bidang), jenis lain punya kolom dan bidang', () => {
        expect(DEFINISI_MASTER.wilayah.bidang).toEqual([]);
        for (const j of JENIS_MASTER_UBAH) {
            expect(DEFINISI_MASTER[j].kolom.length).toBeGreaterThan(1);
            expect(DEFINISI_MASTER[j].bidang.length).toBeGreaterThan(2);
        }
    });
});
