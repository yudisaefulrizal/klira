import { tabPengaturanDiizinkan } from './tab-pengaturan';

const ids = (izin: { fitur: string; aksi: 'lihat'; cakupan: 'unit' }[]) => tabPengaturanDiizinkan({ izin }).map((t) => t.id);

describe('tab Pengaturan menurut izin', () => {
  it('akses lihat membuka tab akses; audit lihat hanya Log audit', () => {
    expect(ids([{ fitur: 'akses', aksi: 'lihat', cakupan: 'unit' }])).toEqual(['pengguna', 'jenis-akun', 'peringatan', 'master', 'profil', 'keamanan']);
    expect(ids([{ fitur: 'audit', aksi: 'lihat', cakupan: 'unit' }])).toEqual(['audit']);
    expect(ids([])).toEqual([]);
  });
});
