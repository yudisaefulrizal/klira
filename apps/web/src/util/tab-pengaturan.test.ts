import { tabPengaturanDiizinkan } from './tab-pengaturan';

const ids = (izin: { fitur: string; aksi: 'lihat'; cakupan: 'unit' }[]) => tabPengaturanDiizinkan({ izin }).map((t) => t.id);

describe('tab Pengaturan menurut izin', () => {
  it('akses lihat membuka tab akses; audit lihat mendapat peringatan dan Log audit', () => {
    expect(ids([{ fitur: 'akses', aksi: 'lihat', cakupan: 'unit' }])).toEqual(['pengguna', 'jenis-akun', 'peringatan', 'keamanan']);
    expect(ids([{ fitur: 'master', aksi: 'lihat', cakupan: 'unit' }])).toEqual(['master']);
    expect(ids([{ fitur: 'profil-klinik', aksi: 'lihat', cakupan: 'unit' }])).toEqual(['profil']);
    expect(ids([{ fitur: 'audit', aksi: 'lihat', cakupan: 'unit' }])).toEqual(['peringatan', 'audit']);
    expect(ids([])).toEqual([]);
  });
});
