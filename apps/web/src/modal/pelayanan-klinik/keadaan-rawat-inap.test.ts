import { awalAdmisi, awalCatatan, awalPenempatan, awalPulang, galatAdmisi, galatCatatan, galatPenempatan, galatPulang, isiSpriAsal, langkahBermasalahAdmisi, langkahBermasalahPulang } from './keadaan-rawat-inap';
import type { RawatInapDto } from '@klira/shared';

describe('keadaan admisi', () => {
  it('butuh pasien dan DPJP; DPJP bersama tidak boleh memuat DPJP utama; bed boleh kosong', () => {
    const g = galatAdmisi(awalAdmisi());
    expect(g.pasien_id).toBeDefined();
    expect(g.dpjp_id).toBeDefined();
    expect(langkahBermasalahAdmisi(g)).toBe(0);
    const ok = { ...awalAdmisi(), pasien_id: 1, dpjp_id: '5' };
    expect(galatAdmisi(ok)).toEqual({});
    expect(galatAdmisi({ ...ok, dpjp_bersama: ['5'] }).dpjp_bersama).toBeDefined();
    expect(langkahBermasalahAdmisi({ dpjp_bersama: 'x' })).toBe(2);
  });
  it('SPRI dari rawat jalan hanya mengisi yang kosong', () => {
    expect(isiSpriAsal(awalAdmisi(), 'SPRI-9').spri).toBe('SPRI-9');
    expect(isiSpriAsal({ ...awalAdmisi(), spri: 'sendiri' }, 'SPRI-9').spri).toBe('sendiri');
  });
});

describe('keadaan penempatan', () => {
  const d = {
    kunjungan: { id: 1 }, penempatan: [{ id: 1, bed_id: 2, kelas: 'dua', indikator: 'naik_kelas', tarif_id: 9, selesai: null }], dpjp: [{ id: 5, nama: 'A', tipe: 'ATND' }, { id: 6, nama: 'B', tipe: 'SPRF' }],
  } as unknown as RawatInapDto;
  it('isian awal dari penempatan dan DPJP sekarang', () => {
    const k = awalPenempatan(d);
    expect(k).toMatchObject({ kelas: 'dua', indikator: 'naik_kelas', tarif_id: '9', dpjp_id: '5', dpjp_bersama: ['6'] });
    expect(galatPenempatan(k)).toEqual({});
    expect(galatPenempatan({ ...k, dpjp_id: '' }).dpjp_id).toBeDefined();
  });
});

describe('keadaan catatan dan pemulangan', () => {
  it('CPPT butuh SOAP; tanda vital opsional tetapi divalidasi bila diisi', () => {
    expect(Object.keys(galatCatatan(awalCatatan()))).toEqual(expect.arrayContaining(['subjektif', 'objektif', 'asesmen', 'rencana']));
    const k = { ...awalCatatan(), subjektif: 'a', objektif: 'b', asesmen: 'c', rencana: 'd' };
    expect(galatCatatan(k)).toEqual({});
    expect(Object.keys(galatCatatan({ ...k, tanda_vital: { ...k.tanda_vital, sistolik: '9999' } })).length).toBeGreaterThan(0);
    expect(galatCatatan({ ...k, tanda_vital: { ...k.tanda_vital, sistolik: '120' } })).toEqual({});
  });
  it('pemulangan butuh ringkasan, diagnosis akhir, kondisi pulang', () => {
    const g = galatPulang(awalPulang());
    expect(Object.keys(g)).toEqual(expect.arrayContaining(['ringkasan', 'diagnosis_akhir', 'kondisi_pulang']));
    expect(langkahBermasalahPulang(g)).toBe(0);
    expect(galatPulang({ ...awalPulang(), ringkasan: 'r', diagnosis_akhir: 'I10', kondisi_pulang: 'baik' })).toEqual({});
    expect(langkahBermasalahPulang({ kondisi_pulang: 'x' })).toBe(2);
  });
});
