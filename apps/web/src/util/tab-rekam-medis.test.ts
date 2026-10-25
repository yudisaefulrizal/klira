import { tabRekamMedisDiizinkan } from './tab-rekam-medis';

const ids = (izin: { fitur: string; aksi: 'lihat'; cakupan: 'unit' }[]) => tabRekamMedisDiizinkan({ izin }).map((t) => t.id);

describe('tab Rekam medis menurut izin', () => {
  it('rekam medis lihat membuka semua tab; klinis lihat hanya berkas dan resume; tanpa izin tidak ada', () => {
    expect(ids([{ fitur: 'rekam-medis', aksi: 'lihat', cakupan: 'unit' }])).toEqual(['berkas', 'pengkodean', 'perbaikan', 'resume', 'pembukaan', 'penyampaian']);
    expect(ids([{ fitur: 'klinis', aksi: 'lihat', cakupan: 'unit' }])).toEqual(['berkas', 'resume']);
    expect(ids([{ fitur: 'kasir', aksi: 'lihat', cakupan: 'unit' }])).toEqual([]);
  });
});
