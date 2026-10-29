import { bukaLapisanRiwayat } from './riwayat-lapisan';
import type { JendelaRiwayat } from './riwayat-lapisan';

function jendela() {
  const semua: (() => void)[] = [];
  let pendengar: (() => void) | null = null;
  const log: string[] = [];
  const w: JendelaRiwayat = {
    history: { pushState: () => void log.push('push'), back: () => void log.push('back') },
    addEventListener: (_j, f) => { pendengar = f; semua.push(f); },
    removeEventListener: (_j, f) => { pendengar = null; semua.splice(semua.indexOf(f), 1); },
  };
  return { w, log, kembali: () => pendengar?.(), semuaKembali: () => [...semua].forEach((f) => f()), terpasang: () => pendengar !== null };
}

describe('tombol kembali menutup lapisan', () => {
  it('membuka menambah satu entri riwayat', () => {
    const j = jendela();
    bukaLapisanRiwayat(j.w, () => true);
    expect(j.log).toEqual(['push']);
  });
  it('kembali peramban menutup tanpa back() tambahan saat dibersihkan', () => {
    const j = jendela();
    const tutup = jest.fn(() => true);
    const bersih = bukaLapisanRiwayat(j.w, tutup);
    j.kembali();
    bersih();
    expect(tutup).toHaveBeenCalledTimes(1);
    expect(j.log).toEqual(['push']);
  });
  it('ditutup lewat antarmuka melepas entri riwayat dengan back()', () => {
    const j = jendela();
    bukaLapisanRiwayat(j.w, () => true)();
    expect(j.log).toEqual(['push', 'back']);
    j.semuaKembali();
    expect(j.terpasang()).toBe(false);
  });
  it('kembali yang ditolak (perlu konfirmasi) memasang ulang entri dan tetap terbuka', () => {
    const j = jendela();
    const bersih = bukaLapisanRiwayat(j.w, () => false);
    j.kembali();
    expect(j.log).toEqual(['push', 'push']);
    bersih();
    expect(j.log).toEqual(['push', 'push', 'back']);
  });
  it('menutup panel lewat antarmuka mempertahankan modal utama sampai kembali berikutnya', () => {
    const j = jendela();
    const modal = jest.fn(() => true);
    const panel = jest.fn(() => true);
    const bersihModal = bukaLapisanRiwayat(j.w, modal);
    const bersihPanel = bukaLapisanRiwayat(j.w, panel);
    bersihPanel();
    // Peramban mengirim popstate setelah back() dari pembersihan panel.
    j.semuaKembali();
    expect(modal).not.toHaveBeenCalled();
    expect(panel).not.toHaveBeenCalled();
    j.semuaKembali();
    expect(modal).toHaveBeenCalledTimes(1);
    bersihModal();
    expect(j.log).toEqual(['push', 'push', 'back']);
  });
  it('satu kali kembali hanya menutup lapisan teratas', () => {
    const j = jendela();
    const bawah = jest.fn(() => true);
    const atas = jest.fn(() => true);
    bukaLapisanRiwayat(j.w, bawah);
    bukaLapisanRiwayat(j.w, atas);
    j.semuaKembali();
    expect(atas).toHaveBeenCalledTimes(1);
    expect(bawah).not.toHaveBeenCalled();
  });
});
