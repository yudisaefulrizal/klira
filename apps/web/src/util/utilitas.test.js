import { jest } from '@jest/globals';
import { buatDrafOtomatis } from './draf/draf-otomatis.js';
import { buatNilaiTertunda } from './tunda.js';
import { buatDaftar } from './daftar-berhalaman.js';
const janji = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
afterEach(() => jest.useRealTimers());
test('pencarian tertunda hanya menerbitkan nilai terakhir dan dibatalkan ketika ditutup', () => {
  jest.useFakeTimers(); const berubah = jest.fn(), tunda = buatNilaiTertunda(berubah, 250);
  tunda.ubah('a'); jest.advanceTimersByTime(100); tunda.ubah('ab'); jest.advanceTimersByTime(249);
  expect(berubah).not.toHaveBeenCalled(); jest.advanceTimersByTime(1); expect(berubah).toHaveBeenCalledWith('ab');
  tunda.ubah('abc'); tunda.tutup(); jest.runAllTimers(); expect(berubah).toHaveBeenCalledTimes(1);
});
test('daftar mengabaikan respons lama dan respons sesudah cleanup', async () => {
  const pertama = janji(), kedua = janji(), ketiga = janji(), berubah = jest.fn();
  const ambil = jest.fn().mockReturnValueOnce(pertama.promise).mockReturnValueOnce(kedua.promise).mockReturnValueOnce(ketiga.promise);
  const daftar = buatDaftar(ambil, 'Gagal', berubah); const a = daftar.muat(), b = daftar.pindah(2);
  kedua.resolve({ data: ['baru'] }); await b; pertama.resolve({ data: ['lama'] }); await a;
  expect(daftar.keadaan.hasil.data).toEqual(['baru']); expect(daftar.keadaan.halaman).toBe(2);
  const c = daftar.muat(); daftar.tutup(); berubah.mockClear(); ketiga.resolve({ data: ['terlambat'] }); await c;
  expect(berubah).not.toHaveBeenCalled();
});
test('draf dibaca sekali, flush memakai nilai terbaru, hapus menghentikan penyimpanan', () => {
  jest.useFakeTimers(); const adaptor = { baca: jest.fn(() => ({ nilai: { nama: 'pulihan' } })), saring: x => x, simpan: jest.fn(), hapus: jest.fn() };
  const opsi = { adaptor, nilai: { nama: 'a' }, awal: { nama: '' }, langkah: 1, aktif: true };
  const draf = buatDrafOtomatis(opsi); expect(draf.keadaan.siap).toBe(true);
  draf.perbarui(opsi); draf.perbarui({ ...opsi, nilai: { nama: 'b' }, langkah: 2 });
  expect(adaptor.simpan).toHaveBeenCalledWith({ nama: 'b' }, 2);
  draf.hapus(); jest.runAllTimers(); draf.tutup(); expect(adaptor.simpan).toHaveBeenCalledTimes(1); expect(adaptor.baca).toHaveBeenCalledTimes(1);
});
test('pemulihan asinkron tidak memberi kabar sesudah draf ditutup', async () => {
  const baca = janji(), berubah = jest.fn(); const adaptor = { baca: () => baca.promise, saring: x => x, simpan: jest.fn(), hapus: jest.fn() };
  const draf = buatDrafOtomatis({ adaptor, nilai: {}, awal: {}, aktif: false }, berubah);
  expect(draf.keadaan.siap).toBe(false); draf.tutup(); baca.resolve({ nilai: 'lama' }); await baca.promise;
  expect(berubah).not.toHaveBeenCalled();
});
