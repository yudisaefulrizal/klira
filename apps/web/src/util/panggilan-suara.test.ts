import type { PanggilanPublik } from '@klira/shared';
import { PemilihPanggilanSuara, teksPanggilan } from './panggilan-suara';
const hari = '2026-10-29';
const panggilan = (poli_id = 9, waktu_panggil = '2026-10-29T03:00:00Z'): PanggilanPublik => ({ kode: 'A-023', poli_id, poli_nama: 'Poli Umum', waktu_panggil });
test('nomor dibaca per digit agar nol di depan tidak hilang, diikuti tujuan poli', () => {
  expect(teksPanggilan(panggilan())).toBe('Nomor antrean A nol dua tiga. Silakan menuju Poli Umum.');
});
test('polling berulang tidak mengulang audio; panggil ulang dengan waktu baru dibaca lagi', () => {
  const pemilih = new PemilihPanggilanSuara();
  expect(pemilih.baru(hari, hari, [panggilan()])).toHaveLength(1);
  expect(pemilih.baru(hari, hari, [panggilan()])).toEqual([]);
  expect(pemilih.baru(hari, hari, [panggilan(9, '2026-10-29T03:01:00Z')])).toHaveLength(1);
  expect(pemilih.baru(hari, hari, [panggilan()])).toEqual([]);
});
test('panggilan beberapa poli diurutkan dan nomor yang sama tetap dibaca untuk tiap poli', () => {
  const pemilih = new PemilihPanggilanSuara();
  const awal = panggilan(9), akhir = panggilan(10, '2026-10-29T03:01:00Z');
  expect(pemilih.baru(hari, hari, [akhir, awal])).toEqual([awal, akhir]);
  expect(pemilih.baru(hari, hari, [akhir, awal])).toEqual([]);
});
test('tanggal lama dan waktu rusak tidak dibaca; hari baru dan aktivasi ulang mereset riwayat', () => {
  const pemilih = new PemilihPanggilanSuara();
  expect(pemilih.baru(hari, '2026-10-30', [panggilan()])).toEqual([]);
  expect(pemilih.baru(hari, hari, [panggilan(9, 'rusak')])).toEqual([]);
  expect(pemilih.baru(hari, hari, [panggilan()])).toHaveLength(1);
  pemilih.reset();
  expect(pemilih.baru(hari, hari, [panggilan()])).toHaveLength(1);
  expect(pemilih.baru('2026-10-30', '2026-10-30', [panggilan(9, '2026-10-30T03:00:00Z')])).toHaveLength(1);
});
test('dua panggil ulang dengan timestamp sama tetap dibaca berdasarkan ID event, replay reconnect diabaikan', () => {
  const pemilih = new PemilihPanggilanSuara();
  const satu = { ...panggilan(), event_id: 43 }, dua = { ...panggilan(), event_id: 44 };
  expect(pemilih.baru(hari, hari, [dua, satu])).toEqual([satu, dua]);
  expect(pemilih.baru(hari, hari, [satu, dua])).toEqual([]);
  expect(pemilih.baru(hari, hari, [panggilan()])).toEqual([]);
});
test('aktivasi suara melewati histori sampai kursor namun membaca panggilan aktif dan event baru', () => {
  const pemilih = new PemilihPanggilanSuara();
  pemilih.lewatiSampai(44);
  expect(pemilih.baru(hari, hari, [{ ...panggilan(), event_id: 43 }])).toEqual([]);
  expect(pemilih.baru(hari, hari, [panggilan()])).toHaveLength(1);
  expect(pemilih.baru(hari, hari, [{ ...panggilan(), event_id: 45 }])).toHaveLength(1);
});
