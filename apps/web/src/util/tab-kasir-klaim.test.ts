import { tabKasirKlaimDiizinkan } from './tab-kasir-klaim';

const ids = (izin: { fitur: string; aksi: 'lihat'; cakupan: 'unit' }[]) => tabKasirKlaimDiizinkan({ izin }).map((t) => t.id);

describe('tab Kasir dan klaim menurut izin', () => {
  it('kasir hanya shift, klaim hanya klaim, keduanya semua, tanpa izin kosong', () => {
    expect(ids([{ fitur: 'kasir', aksi: 'lihat', cakupan: 'unit' }])).toEqual(['shift']);
    expect(ids([{ fitur: 'klaim', aksi: 'lihat', cakupan: 'unit' }])).toEqual(['klaim']);
    expect(ids([{ fitur: 'kasir', aksi: 'lihat', cakupan: 'unit' }, { fitur: 'klaim', aksi: 'lihat', cakupan: 'unit' }])).toEqual(['shift', 'klaim']);
    expect(ids([{ fitur: 'pasien', aksi: 'lihat', cakupan: 'unit' }])).toEqual([]);
  });
});
