import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { buatPembaruanFotoWhatsapp, fotoProfilWhatsapp } from '../dist/profil.js';
const foto = 'https://pps.whatsapp.net/avatar.jpg?token=abc';
function siapkan() {
  const kontak = { id: 12, fasyankes_id: 10, jid: '628123@s.whatsapp.net', foto_profil: null };
  const koneksi = { aktif: true, status: 'terhubung', generasi: 2, fasyankes_id: 10, pemilik_engine: 'engine', sewa_sampai: new Date(Date.now() + 60000) };
  const db = {
    $queryRaw: mock.fn(),
    waPercakapan: { findFirst: mock.fn(async () => kontak), updateMany: mock.fn(async () => ({ count: 1 })) },
    waKoneksi: { findUnique: mock.fn(async () => koneksi) },
  };
  db.$transaction = async (fn) => fn(db);
  const dep = { fasyankes: 10, generasi: 2, pemilik: 'engine', masihAktif: mock.fn(() => true), ambil: mock.fn(async () => foto), kabarkan: mock.fn() };
  return { kontak, koneksi, db, dep, perbarui: buatPembaruanFotoWhatsapp(db) };
}
test('hanya menerima foto HTTPS dari CDN WhatsApp', () => {
  assert.equal(fotoProfilWhatsapp(foto), foto);
  for (const value of [null, 'http://pps.whatsapp.net/a', 'https://whatsapp.net.evil.test/a', 'https://user:pass@pps.whatsapp.net/a', 'https://example.com/a']) assert.equal(fotoProfilWhatsapp(value), null);
});
test('melengkapi kontak lama dan menyimpan foto selama sehari', async () => {
  const { db, dep, kontak, perbarui } = siapkan();
  const sebelum = Date.now();
  await perbarui(dep);
  assert.equal(dep.ambil.mock.calls[0].arguments[0], kontak.jid);
  const data = db.waPercakapan.updateMany.mock.calls[0].arguments[0].data;
  assert.equal(data.foto_profil, foto);
  assert.ok(data.foto_periksa_setelah.getTime() >= sebelum + 86400000);
  assert.equal(dep.kabarkan.mock.callCount(), 1);
  assert.equal(db.waPercakapan.findFirst.mock.calls[0].arguments[0].where.fasyankes_id, 10);
});
for (const kode of [403, 404]) test(`menghapus foto yang dibatasi atau dihapus (${kode})`, async () => {
  const { db, dep, kontak, perbarui } = siapkan(); kontak.foto_profil = foto;
  dep.ambil.mock.mockImplementation(async () => { throw { output: { statusCode: kode } }; });
  await perbarui(dep);
  assert.equal(db.waPercakapan.updateMany.mock.calls[0].arguments[0].data.foto_profil, null);
  assert.equal(dep.kabarkan.mock.callCount(), 1);
});
test('gangguan sementara mempertahankan foto dan menjadwalkan ulang setelah 15 menit', async () => {
  const { db, dep, perbarui } = siapkan();
  dep.ambil.mock.mockImplementation(async () => { throw new Error('timeout'); });
  const sebelum = Date.now(); await perbarui(dep);
  const data = db.waPercakapan.updateMany.mock.calls[0].arguments[0].data;
  assert.equal('foto_profil' in data, false);
  assert.ok(data.foto_periksa_setelah.getTime() >= sebelum + 900000);
  assert.ok(data.foto_periksa_setelah.getTime() < Date.now() + 901000);
  assert.equal(dep.kabarkan.mock.callCount(), 0);
});
for (const perubahan of [{ aktif: false }, { generasi: 3 }, { fasyankes_id: 11 }, { pemilik_engine: 'lain' }, { sewa_sampai: new Date(0) }]) test(`menolak hasil dari koneksi yang berubah: ${Object.keys(perubahan)[0]}`, async () => {
  const { db, dep, koneksi, perbarui } = siapkan(); Object.assign(koneksi, perubahan);
  await perbarui(dep);
  assert.equal(db.waPercakapan.updateMany.mock.callCount(), 0);
});
test('hanya satu request foto berjalan sekaligus', async () => {
  const { dep, perbarui } = siapkan();
  await Promise.all([perbarui(dep), perbarui(dep)]);
  assert.equal(dep.ambil.mock.callCount(), 1);
});
test('tidak mengambil profil saat tidak ada kontak yang perlu diperbarui', async () => {
  const { db, dep, perbarui } = siapkan(); db.waPercakapan.findFirst.mock.mockImplementation(async () => null);
  await perbarui(dep);
  assert.equal(dep.ambil.mock.callCount(), 0);
});
test('hasil request diabaikan ketika socket lama ditutup', async () => {
  const { db, dep, perbarui } = siapkan();
  let aktif = true;
  dep.masihAktif.mock.mockImplementation(() => aktif);
  dep.ambil.mock.mockImplementation(async () => { aktif = false; return foto; });
  await perbarui(dep);
  assert.equal(db.waPercakapan.updateMany.mock.callCount(), 0);
});
test('foto yang tidak berubah tidak memicu pembaruan daftar', async () => {
  const { kontak, dep, perbarui } = siapkan(); kontak.foto_profil = foto;
  await perbarui(dep);
  assert.equal(dep.kabarkan.mock.callCount(), 0);
});
