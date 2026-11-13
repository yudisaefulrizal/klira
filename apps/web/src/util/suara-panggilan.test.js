import { jest } from '@jest/globals';
import { buatSuaraPanggilan } from './suara-panggilan.js';

const properti = ['window', 'document', 'localStorage', 'SpeechSynthesisUtterance'];
const semula = new Map(properti.map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
let simpanan, sintesis, dokumen, kontrol;
beforeEach(() => {
  jest.useFakeTimers();
  simpanan = new Map();
  class Ucapan { constructor(teks) { this.text = teks; } }
  sintesis = { speak: jest.fn(u => u.onstart?.()), cancel: jest.fn(), getVoices: () => [] };
  dokumen = new EventTarget();
  jest.spyOn(dokumen, 'removeEventListener');
  for (const [k, value] of Object.entries({
    window: { speechSynthesis: sintesis, SpeechSynthesisUtterance: Ucapan }, document: dokumen,
    SpeechSynthesisUtterance: Ucapan,
    localStorage: { getItem: k => simpanan.get(k), setItem: (k, v) => simpanan.set(k, v) },
  })) Object.defineProperty(globalThis, k, { value, configurable: true, writable: true });
});
afterEach(() => {
  kontrol?.tutup(); kontrol = undefined;
  jest.useRealTimers(); jest.restoreAllMocks();
  for (const [k, descriptor] of semula) {
    if (descriptor) Object.defineProperty(globalThis, k, descriptor);
    else delete globalThis[k];
  }
});

test('preferensi fasilitas mengaktifkan suara dan pilihan nonaktif tersimpan', () => {
  simpanan.set('klira.panggilan.suara.1', 'aktif');
  kontrol = buatSuaraPanggilan('1', jest.fn());
  jest.advanceTimersByTime(0);
  expect(kontrol.status).toMatchObject({ aktif: true, siap: true, perluInteraksi: false });
  expect(sintesis.speak).toHaveBeenCalledTimes(1);
  kontrol.ubahSuara();
  expect(kontrol.status.aktif).toBe(false);
  expect(simpanan.get('klira.panggilan.suara.1')).toBe('nonaktif');
});

test('timeout autoplay memerlukan interaksi dan mengabaikan callback ucapan lama', () => {
  sintesis.speak.mockImplementation(() => {});
  kontrol = buatSuaraPanggilan('1', jest.fn());
  kontrol.ubahSuara();
  const ucapan = sintesis.speak.mock.calls[0][0];
  jest.advanceTimersByTime(8000);
  expect(kontrol.status).toMatchObject({ aktif: false, siap: false, perluInteraksi: true });
  expect(simpanan.get('klira.panggilan.suara.1')).toBe('aktif');
  ucapan.onstart();
  expect(kontrol.status.siap).toBe(false);
});

test('cleanup membatalkan autostart tertunda dan melepas pemulihan interaksi', () => {
  simpanan.set('klira.panggilan.suara.1', 'aktif');
  kontrol = buatSuaraPanggilan('1', jest.fn());
  kontrol.tutup();
  jest.advanceTimersByTime(0);
  expect(sintesis.speak).not.toHaveBeenCalled();
  expect(dokumen.removeEventListener).toHaveBeenCalledWith('pointerdown', expect.any(Function), true);
  expect(dokumen.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function), true);
  expect(jest.getTimerCount()).toBe(0);
});
