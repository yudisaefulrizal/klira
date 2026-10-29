import { KELOMPOK_MASTER, alamatKembaliMaster, jenisMasterDiHalaman, tautanKelolaMaster, tujuanMasterLama } from './lokasi-master';

test('setiap master operasional hanya memiliki satu halaman pengelola', () => {
  const jenis = KELOMPOK_MASTER.flatMap(k => [...k.jenis]);
  expect([...jenis].sort()).toEqual(['poli', 'praktisi', 'jadwal', 'ruang', 'bed', 'tarif'].sort());
  expect(new Set(jenis).size).toBe(jenis.length);
});
test('alamat lama diarahkan ke pemiliknya dengan jenis, pencarian, status, dan halaman yang sama', () => {
  for (const kelompok of KELOMPOK_MASTER) for (const jenis of kelompok.jenis) {
    const tujuan = new URL(tujuanMasterLama(`?tab=master&jenis=${jenis}&cari=Ruang+VIP&status=nonaktif&halaman=3`)!, 'https://klira.test');
    expect(tujuan.pathname).toBe(kelompok.path);
    expect(Object.fromEntries(tujuan.searchParams)).toEqual({ jenis, cari: 'Ruang VIP', status: 'nonaktif', halaman: '3', kembali: '/pengaturan?tab=master' });
  }
});
test('indeks master, referensi wilayah, dan tab lain tetap di Pengaturan', () => {
  for (const query of ['?tab=master', '?tab=master&jenis=wilayah', '?tab=profil', '?tab=master&jenis=asing', '?jenis=bed']) expect(tujuanMasterLama(query)).toBeNull();
});
test('jenis master dalam URL tidak dapat melompati kelompok halaman', () => {
  expect(jenisMasterDiHalaman('?jenis=tarif', KELOMPOK_MASTER[1].jenis)).toBe('ruang');
  expect(jenisMasterDiHalaman('?jenis=bed', KELOMPOK_MASTER[1].jenis)).toBe('bed');
  expect(jenisMasterDiHalaman('', KELOMPOK_MASTER[2].jenis)).toBe('tarif');
  expect(jenisMasterDiHalaman('?jenis=poli', ['wilayah'])).toBe('wilayah');
});
test('tautan kontekstual menjaga seluruh filter halaman kerja saat kembali', () => {
  const kelompok = KELOMPOK_MASTER[0];
  const asal = '/pasien?tahap=pemeriksaan&cari=Siti&tanggal=2026-10-29&halaman=3';
  const tujuan = new URL(tautanKelolaMaster(kelompok, asal), 'https://klira.test');
  expect(alamatKembaliMaster(tujuan.search, kelompok, ['/pasien', '/pengaturan'])).toBe(asal);
});
test('alamat kembali menolak situs luar, halaman asing, dan halaman klinis tanpa izin', () => {
  const kelompok = KELOMPOK_MASTER[1];
  for (const kembali of ['https://asing.test', '//asing.test', '/\\asing.test', '/farmasi', '/rawat-inap/ruangan', '/\\[']) {
    expect(alamatKembaliMaster(`?${new URLSearchParams({ kembali })}`, kelompok, ['/rawat-inap', '/pengaturan'])).toBe('/rawat-inap');
  }
  expect(alamatKembaliMaster(`?${new URLSearchParams({ kembali: '/rawat-inap' })}`, kelompok, ['/pengaturan'])).toBe('/pengaturan?tab=master');
  expect(alamatKembaliMaster('?kembali=%2Fpengaturan%3Ftab%3Dmaster', kelompok, ['/rawat-inap', '/pengaturan'])).toBe('/pengaturan?tab=master');
});
