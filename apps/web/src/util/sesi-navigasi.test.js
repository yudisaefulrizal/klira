import { jest } from '@jest/globals';
import { buatSesiPengguna } from './sesi-pengguna.js';
import { buatNavigasi, ruteDokumenNative } from './navigasi-native.js';
const janji = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
test('hasil pemuatan sesi lama tidak menimpa akun yang baru masuk', async () => {
  const baca = janji(); const api = { ambilSaya: () => baca.promise, masuk: async () => ({ id: 2 }) };
  const sesi = buatSesiPengguna(api, () => null), berubah = jest.fn(); sesi.langganan(berubah);
  const muat = sesi.muat(); await sesi.masuk('petugas', 'sandi'); baca.resolve({ id: 1 }); await muat;
  expect(sesi.potret()).toEqual({ pengguna: { id: 2 }, memuat: false }); expect(berubah).toHaveBeenCalledTimes(1); sesi.tutup();
});
test('keluar gagal mempertahankan akun tetapi tetap menghapus draf lokal', async () => {
  const data = new Map([['klira.draf.uji', 'isi'], ['klira.tema', 'gelap']]);
  const simpanan = { get length() { return data.size; }, key: i => [...data.keys()][i], removeItem: k => data.delete(k) };
  const sesi = buatSesiPengguna({ ambilSaya: async () => ({ id: 1 }), keluar: async () => { throw Error('offline'); } }, () => simpanan);
  await sesi.muat(); await expect(sesi.keluar()).rejects.toThrow('offline');
  expect(sesi.potret().pengguna.id).toBe(1); expect(data.has('klira.draf.uji')).toBe(false); expect(data.get('klira.tema')).toBe('gelap'); sesi.tutup();
});
test('sesi yang ditutup tidak menerbitkan respons terlambat', async () => {
  const baca = janji(), berubah = jest.fn(); const sesi = buatSesiPengguna({ ambilSaya: () => baca.promise }); sesi.langganan(berubah);
  const muat = sesi.muat(); sesi.tutup(); baca.resolve({ id: 1 }); await muat; expect(berubah).not.toHaveBeenCalled();
});
function jendela() {
  const w = new EventTarget(); let url = new URL('http://klira.test/log-audit');
  w.location = { get pathname() { return url.pathname; }, get search() { return url.search; }, origin: url.origin, assign: jest.fn(), replace: jest.fn(), reload: jest.fn() };
  w.history = { pushState: jest.fn((_s, _t, ke) => { url = new URL(ke, url); }), replaceState: jest.fn((_s, _t, ke) => { url = new URL(ke, url); }) };
  return w;
}
test('navigasi menerbitkan History API dan melepas popstate saat ditutup', () => {
  const w = jendela(), n = buatNavigasi(w), berubah = jest.fn(); n.langganan(berubah); n.mulai();
  n.ganti('/log-audit?aksi=lihat'); expect(n.potret()).toEqual({ path: '/log-audit', search: '?aksi=lihat' });
  n.pindah('/statistik'); expect(w.history.pushState).toHaveBeenCalledTimes(1); w.dispatchEvent(new Event('popstate'));
  expect(berubah).toHaveBeenCalledTimes(3); n.tutup(); w.dispatchEvent(new Event('popstate')); expect(berubah).toHaveBeenCalledTimes(3);
});
test('rute mandiri memakai perpindahan dokumen selama transisi', () => {
  const w = jendela(), n = buatNavigasi(w, ruteDokumenNative); n.ganti('/masuk'); n.pindah('/layar-panggilan/1');
  expect(w.location.replace).toHaveBeenCalledWith('/masuk'); expect(w.location.assign).toHaveBeenCalledWith('/layar-panggilan/1'); expect(w.history.pushState).not.toHaveBeenCalled();
});
