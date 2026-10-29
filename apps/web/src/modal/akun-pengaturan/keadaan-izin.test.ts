import { GalatApi } from '../../api-klien/klien';
import { jalankanAksi } from './alur-atur-izin';
import {
  bagianAkses, bentukIzinBaru, bentukPenugasanBaru, galatIzinBaru, galatPenugasanBaru, galatUbahPeriode, izinAwal, jenisBerjalan, opsiJenisBaru,
  penugasanAwal, periodeTeks, statusPeriode, tanggalSaja,
} from './keadaan-izin';

const hari = '2026-10-25';
const jenis = [
  { id: 1, nama: 'A', syarat_profesi: null, aktif: true, izin: [] },
  { id: 2, nama: 'B', syarat_profesi: null, aktif: true, izin: [] },
  { id: 3, nama: 'C', syarat_profesi: null, aktif: false, izin: [] },
];
const tugas = (id: number, jenis_akun_id: number, mulai: string, selesai: string | null) => ({ id, pengguna_id: 9, jenis_akun_id, mulai: `${mulai}T00:00:00.000Z`, selesai: selesai && `${selesai}T00:00:00.000Z` });

describe('status dan periode', () => {
  it('menentukan status tanggal dan batas waktu ISO eksklusif', () => {
    expect(statusPeriode('2026-11-01', null, hari)).toBe('akan_datang');
    expect(statusPeriode('2026-10-01', null, hari)).toBe('berjalan');
    expect(statusPeriode('2026-10-01T00:00:00.000Z', '2026-10-25T00:00:00.000Z', hari, Date.parse('2026-10-25T15:58:00Z'))).toBe('berakhir');
    expect(statusPeriode('2026-10-01', '2026-10-24', hari)).toBe('berakhir');
  });
  it('mencabut langsung pada detik yang sama, bukan menunggu pergantian hari', () => {
    const waktu = Date.parse('2026-10-25T15:58:00Z');
    expect(statusPeriode('2026-10-25T00:00:00Z', '2026-10-25T15:58:00Z', hari, waktu)).toBe('berakhir');
    expect(statusPeriode('2026-10-25T00:00:00Z', '2026-10-25T16:00:00Z', hari, waktu)).toBe('berjalan');
  });
  it('tanggalSaja dan periodeTeks', () => {
    expect(tanggalSaja('2026-10-01T00:00:00.000Z')).toBe('2026-10-01');
    expect(periodeTeks('2026-10-01', null)).toContain('tanpa batas');
  });
});

describe('penyusunan perubahan', () => {
  it('penugasan baru: wajib pilih jenis, periode sah, badan memuat konfirmasi bila ada', () => {
    const f = { ...penugasanAwal(hari) };
    expect(galatPenugasanBaru(f).jenis_akun_id).toBeTruthy();
    expect(galatPenugasanBaru({ ...f, jenis_akun_id: '2', selesai: '2026-01-01' }).selesai).toBeTruthy();
    const ok = { ...f, jenis_akun_id: '2' };
    expect(galatPenugasanBaru(ok)).toEqual({});
    expect(bentukPenugasanBaru(ok)).toEqual({ jenis_akun_id: 2, mulai: hari, selesai: undefined });
    expect(bentukPenugasanBaru(ok, { alasan: 'x', terima_untuk_akun: true })).toMatchObject({ konfirmasi_peringatan: { alasan: 'x', terima_untuk_akun: true } });
  });
  it('izin baru: alasan dan izin wajib; alasan dipangkas', () => {
    const f = izinAwal(hari);
    const g = galatIzinBaru(f);
    expect(g.izin_id).toBeTruthy();
    expect(g.alasan).toBeTruthy();
    expect(galatIzinBaru({ ...f, izin_id: 4, alasan: '   ' }).alasan).toBeTruthy();
    const ok = { ...f, izin_id: 4, tipe: 'kurang' as const, alasan: '  cuti  ' };
    expect(galatIzinBaru(ok)).toEqual({});
    expect(bentukIzinBaru(ok)).toMatchObject({ izin_id: 4, tipe: 'kurang', alasan: 'cuti', selesai: undefined });
  });
  it('ubah periode: selesai wajib dan tidak sebelum mulai', () => {
    expect(galatUbahPeriode('2026-10-01T00:00:00.000Z', '')).toBeTruthy();
    expect(galatUbahPeriode('2026-10-01T00:00:00.000Z', '2026-09-30')).toBeTruthy();
    expect(galatUbahPeriode('2026-10-01T00:00:00.000Z', '2026-10-01')).toBeNull();
  });
});

describe('pilihan jenis', () => {
  it('jenis aktif yang belum berjalan atau terjadwal; yang berakhir boleh ditambah lagi', () => {
    const p = [tugas(1, 1, '2026-01-01', null), tugas(2, 2, '2026-01-01', '2026-02-01')];
    expect(opsiJenisBaru(jenis, p, hari).map((j) => j.id)).toEqual([2]);
    expect(jenisBerjalan(jenis, p, hari).map((j) => j.id)).toEqual([1]);
  });
});

describe('akses efektif', () => {
  it('menyusun bagian detail dikelompokkan per fitur', () => {
    const b = bagianAkses({ pengguna_id: 1, jenis_akun: ['A'], fitur: ['resep'], izin: [{ fitur: 'resep', aksi: 'input', cakupan: 'unit' }, { fitur: 'resep', aksi: 'lihat', cakupan: 'unit' }] });
    expect(b[0].baris[0].nilai).toBe('A');
    expect(b[1].baris).toEqual([{ label: 'resep', nilai: 'input (unit), lihat (unit)' }]);
    expect(bagianAkses({ pengguna_id: 1, jenis_akun: [], fitur: [], izin: [] })[0].baris[0].nilai).toBe('Tidak ada');
  });
});

describe('jalankanAksi', () => {
  it('berhasil, peringatan 409 lalu ulang dengan konfirmasi, galat', async () => {
    const w = [{ jenis: 'nakes_tanpa_sip', kunci: 'k', pesan: 'p' }];
    const kirim = jest.fn().mockRejectedValueOnce(new GalatApi(409, 'x', w as never, 'perlu_konfirmasi_peringatan')).mockResolvedValueOnce({ id: 1 });
    expect(await jalankanAksi(kirim)).toEqual({ jenis: 'peringatan', peringatan: w });
    const k = { alasan: 'a', terima_untuk_akun: false };
    expect(await jalankanAksi(kirim, k)).toEqual({ jenis: 'berhasil', data: { id: 1 } });
    expect(kirim).toHaveBeenLastCalledWith(k);
    expect(await jalankanAksi(jest.fn().mockRejectedValue(new GalatApi(400, 'salah', undefined, 'tidak_valid')))).toEqual({ jenis: 'galat', pesan: 'salah' });
    expect((await jalankanAksi(jest.fn().mockRejectedValue(new Error('z')))).jenis).toBe('galat');
  });
});
