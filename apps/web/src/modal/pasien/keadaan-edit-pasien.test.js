import { lokasiGalatEditPasien } from './keadaan-edit-pasien.js';
it('isian salah di luar data wali tidak membuka wali tertentu', () => {
    for (const jalur of ['nik', 'kode_wilayah', 'pekerjaan', 'jkn_nomor_kartu', 'asuransi_nomor_polis'])
        expect(lokasiGalatEditPasien(jalur)).toEqual({});
});
it('memilih wali yang bermasalah walaupun sebelumnya tersembunyi', () => {
    expect(lokasiGalatEditPasien('wali.7.nama')).toEqual({ wali: 7 });
    expect(lokasiGalatEditPasien('wali')).toEqual({});
    expect(lokasiGalatEditPasien('tidak_cakap')).toEqual({});
});
