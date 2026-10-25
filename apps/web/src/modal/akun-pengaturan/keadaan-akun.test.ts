import { penggunaBaru } from '@klira/shared';
import { awalAkun, bentukPermintaan, galatData, galatLangkah, galatPenugasan, galatProfil, hariIniLokal, opsiIzin, ringkasanAkun } from './keadaan-akun';
import type { IzinKatalog, JenisKatalog, KeadaanAkun } from './keadaan-akun';

const izin: IzinKatalog[] = [
  { id: 1, fitur: 'resep', aksi: 'input', cakupan: 'unit' },
  { id: 2, fitur: 'pendaftaran', aksi: 'lihat', cakupan: 'unit' },
  { id: 3, fitur: 'kasir', aksi: 'input', cakupan: 'unit' },
];
const jenis: JenisKatalog[] = [
  { id: 10, nama: 'Dokter', syarat_profesi: 'dokter ber-SIP', aktif: true, izin: [izin[0]] },
  { id: 11, nama: 'Pendaftaran', syarat_profesi: null, aktif: true, izin: [izin[1]] },
];
const lengkap = (ubah: Partial<KeadaanAkun> = {}): KeadaanAkun => ({
  ...awalAkun(), nama: 'Dewi Lestari', nik: '3201010101010001', username: 'dewi.l', penugasan: { 11: { mulai: '2026-10-01', selesai: '' } }, ...ubah,
});

describe('keadaan modal pembuatan akun', () => {
  it('awal kosong dan tidak lolos validasi data, penugasan', () => {
    const k = awalAkun();
    expect(Object.keys(galatData(k)).sort()).toEqual(['nama', 'nik', 'username']);
    expect(galatPenugasan(k)._).toBeTruthy();
    expect(galatProfil(k)).toEqual({});
  });
  it('NIK dan username memakai aturan skema bersama', () => {
    expect(galatData(lengkap({ nik: '123' })).nik).toBeTruthy();
    expect(galatData(lengkap({ username: 'a b' })).username).toBeTruthy();
    expect(galatData(lengkap())).toEqual({});
  });
  it('profil: profesi terisi memerlukan tanggal SIP sah bila diisi', () => {
    expect(galatProfil(lengkap({ profesi: 'Dokter' }))).toEqual({});
    expect(galatProfil(lengkap({ profesi: 'Dokter', masa_berlaku_sip: 'bukan-tanggal' })).masa_berlaku_sip).toBeTruthy();
  });
  it('periode: selesai sebelum mulai ditolak per jenis', () => {
    const k = lengkap({ penugasan: { 10: { mulai: '2026-10-05', selesai: '2026-10-01' }, 11: { mulai: '2026-10-01', selesai: '' } } });
    expect(Object.keys(galatPenugasan(k))).toEqual(['10']);
  });
  it('galat per langkah menunjuk langkah bermasalah', () => {
    expect(galatLangkah(lengkap())).toEqual([null, null, null, null, null]);
    expect(galatLangkah(lengkap({ nama: '' }))[0]).toBeTruthy();
    expect(galatLangkah(lengkap({ izin: [{ izin_id: 3, tipe: 'tambah', alasan: '', mulai: '2026-10-01', selesai: '' }] }))[3]).toBeTruthy();
  });
  it('permintaan lolos skema API: profil kosong jadi null, tanggal kosong dihilangkan, konfirmasi ikut', () => {
    const k = lengkap({ izin: [{ izin_id: 3, tipe: 'tambah', alasan: 'bantu kasir', mulai: '2026-10-01', selesai: '' }] });
    const badan = bentukPermintaan(k, { alasan: 'ok', terima_untuk_akun: true });
    expect(badan.profil).toBeNull();
    expect(badan.penugasan).toEqual([{ jenis_akun_id: 11, mulai: '2026-10-01', selesai: undefined }]);
    expect(penggunaBaru.safeParse(JSON.parse(JSON.stringify(badan))).success).toBe(true);
    expect(penggunaBaru.safeParse(JSON.parse(JSON.stringify(bentukPermintaan(lengkap({ profesi: 'Perawat', nomor_sip: ' SIP-1 ' }))))).success).toBe(true);
  });
  it('pilihan izin: Tambah di luar paket, Kurangi di dalam paket, tanpa duplikat, tersaring kata', () => {
    const terpilih = [jenis[1]];
    expect(opsiIzin('tambah', izin, terpilih, [], '').map((i) => i.id)).toEqual([1, 3]);
    expect(opsiIzin('kurang', izin, terpilih, [], '').map((i) => i.id)).toEqual([2]);
    const sudah = [{ izin_id: 3, tipe: 'tambah' as const, alasan: 'x', mulai: '2026-10-01', selesai: '' }];
    expect(opsiIzin('tambah', izin, terpilih, sudah, '').map((i) => i.id)).toEqual([1]);
    expect(opsiIzin('tambah', izin, terpilih, [], 'KASIR').map((i) => i.id)).toEqual([3]);
    expect(opsiIzin('kurang', izin, [], [], '')).toEqual([]);
  });
  it('ringkasan memuat semua bagian dan menamai jenis', () => {
    const r = ringkasanAkun(lengkap({ profesi: 'Perawat', nomor_sip: 'S1' }), jenis, izin);
    expect(r.map((b) => b.judul)).toHaveLength(4);
    expect(r[2].baris[0]).toEqual({ label: 'Pendaftaran', nilai: '2026-10-01 s.d. tanpa batas' });
    expect(r[1].baris[1]).toEqual({ label: 'Nomor SIP', nilai: 'S1' });
  });
  it('tanggal hari ini lokal berformat YYYY-MM-DD', () => {
    expect(hariIniLokal(new Date(2026, 9, 5))).toBe('2026-10-05');
  });
});
