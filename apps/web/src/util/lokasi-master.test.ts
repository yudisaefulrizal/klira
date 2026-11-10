import { HALAMAN_KELOLA_MASTER, jenisMasterDiHalaman } from './lokasi-master';

test('halaman pemilik master: Daftar pasien, Rawat inap, dan Kasir dan klaim', () => {
  expect([...HALAMAN_KELOLA_MASTER]).toEqual(['/pasien', '/rawat-inap', '/kasir-klaim']);
});
test('jenis master dalam URL tidak dapat melompati kelompok halaman', () => {
  expect(jenisMasterDiHalaman('?jenis=tarif', ['ruang', 'bed'])).toBe('ruang');
  expect(jenisMasterDiHalaman('?jenis=bed', ['ruang', 'bed'])).toBe('bed');
  expect(jenisMasterDiHalaman('', ['tarif'])).toBe('tarif');
  expect(jenisMasterDiHalaman('?jenis=poli', ['wilayah'])).toBe('wilayah');
});
