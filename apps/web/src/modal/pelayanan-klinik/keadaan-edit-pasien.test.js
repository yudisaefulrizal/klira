import { jest } from '@jest/globals';
import { lokasiGalatEditPasien } from './keadaan-edit-pasien.js';
it('membuka bagian yang berisi isian salah saat disimpan dari tab lain', () => {
    expect(lokasiGalatEditPasien('nik')).toEqual({ tab: 'edit-identitas' });
    expect(lokasiGalatEditPasien('kode_wilayah')).toEqual({ tab: 'edit-pelengkap' });
    expect(lokasiGalatEditPasien('pekerjaan')).toEqual({ tab: 'edit-identitas' });
    expect(lokasiGalatEditPasien('jkn_nomor_kartu')).toEqual({ tab: 'edit-penjamin' });
    expect(lokasiGalatEditPasien('asuransi_nomor_polis')).toEqual({ tab: 'edit-penjamin' });
});
it('memilih wali yang bermasalah walaupun sebelumnya tersembunyi', () => {
    expect(lokasiGalatEditPasien('wali.7.nama')).toEqual({ tab: 'edit-keluarga', wali: 7 });
    expect(lokasiGalatEditPasien('wali')).toEqual({ tab: 'edit-keluarga' });
    expect(lokasiGalatEditPasien('tidak_cakap')).toEqual({ tab: 'edit-keluarga' });
});
