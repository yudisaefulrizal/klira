import { adaLapisan, adalahAtas, keluarLapisan, langgananLapisan, lapisanAtas, masukLapisan, pilihTargetPemulihan, potretLapisan, setelUlangLapisan } from './lapisan';
import { fokusBerikut } from './fokus';

describe('tumpukan lapisan', () => {
  beforeEach(setelUlangLapisan);
  it('hanya lapisan teratas yang aktif; keluar mengembalikan yang di bawah', () => {
    masukLapisan('modal');
    masukLapisan('konfirmasi');
    expect(lapisanAtas()).toBe('konfirmasi');
    expect(adalahAtas('modal')).toBe(false);
    keluarLapisan('konfirmasi');
    expect(adalahAtas('modal')).toBe(true);
    keluarLapisan('modal');
    expect(adaLapisan()).toBe(false);
    expect(lapisanAtas()).toBeNull();
  });
  it('masuk dua kali tidak menggandakan; pendengar diberi tahu dan bisa berhenti', () => {
    const p = jest.fn();
    const henti = langgananLapisan(p);
    masukLapisan('a');
    masukLapisan('a');
    expect(potretLapisan()).toBe('a');
    expect(p).toHaveBeenCalledTimes(2);
    henti();
    keluarLapisan('a');
    expect(p).toHaveBeenCalledTimes(2);
  });
});

describe('kunci fokus', () => {
  it('Tab berputar maju dan Shift+Tab mundur', () => {
    expect(fokusBerikut(3, 2, false)).toBe(0);
    expect(fokusBerikut(3, 0, true)).toBe(2);
    expect(fokusBerikut(3, 1, false)).toBe(2);
  });
  it('fokus di luar daftar masuk ke ujung; daftar kosong -1', () => {
    expect(fokusBerikut(3, -1, false)).toBe(0);
    expect(fokusBerikut(3, -1, true)).toBe(2);
    expect(fokusBerikut(0, -1, false)).toBe(-1);
  });
});

import { adalahInert, inertDalam } from './lapisan';

describe('inert lapisan', () => {
  beforeEach(setelUlangLapisan);
  it('lapisan yang belum terdaftar (render pertama) tidak inert', () => {
    expect(inertDalam([], 'a')).toBe(false);
    expect(inertDalam(['a'], 'b')).toBe(false);
    expect(adalahInert('baru')).toBe(false);
  });
  it('hanya teratas yang tidak inert', () => {
    expect(inertDalam(['modal', 'konfirmasi'], 'modal')).toBe(true);
    expect(inertDalam(['modal', 'konfirmasi'], 'konfirmasi')).toBe(false);
    masukLapisan('m');
    masukLapisan('k');
    expect(adalahInert('m')).toBe(true);
    keluarLapisan('k');
    expect(adalahInert('m')).toBe(false);
  });
});

describe('pilihTargetPemulihan', () => {
  it('tanpa lapisan tersisa: ke pemicu bila masih ada', () => {
    expect(pilihTargetPemulihan(true, null, null)).toBe('pemicu');
    expect(pilihTargetPemulihan(false, null, null)).toBe('tidak');
  });
  it('pemicu di lapisan teratas sesudah keluar: ke pemicu', () => {
    expect(pilihTargetPemulihan(true, 'modal', 'modal')).toBe('pemicu');
  });
  it('pemicu hilang atau bukan di lapisan teratas: isian pertama lapisan teratas', () => {
    expect(pilihTargetPemulihan(false, null, 'modal')).toBe('pertamaAtas');
    expect(pilihTargetPemulihan(true, 'modal', 'konfirmasi')).toBe('pertamaAtas');
    expect(pilihTargetPemulihan(true, null, 'modal')).toBe('pertamaAtas');
  });
});
