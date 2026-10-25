import { bacaTabTerakhir, pilihTab, simpanTabTerakhir } from './ingatan-tab';

const buatSimpanan = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};
const tab = ['pengguna', 'jenis', 'audit'] as const;

describe('ingatan tab', () => {
  it('menyimpan dan membaca tab terakhir per halaman', () => {
    const s = buatSimpanan();
    simpanTabTerakhir('pengaturan', 'audit', s);
    expect(bacaTabTerakhir('pengaturan', tab, s)).toBe('audit');
    expect(bacaTabTerakhir('farmasi', tab, s)).toBeNull();
  });
  it('tab yang tidak valid lagi diabaikan; penyimpanan rusak tidak melempar', () => {
    const s = buatSimpanan();
    simpanTabTerakhir('pengaturan', 'hilang', s);
    expect(bacaTabTerakhir('pengaturan', tab, s)).toBeNull();
    const rusak = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); } };
    expect(bacaTabTerakhir('pengaturan', tab, rusak)).toBeNull();
    expect(() => simpanTabTerakhir('pengaturan', 'audit', rusak)).not.toThrow();
    expect(bacaTabTerakhir('pengaturan', tab, null)).toBeNull();
  });
  it('pilihTab: alamat, lalu ingatan, lalu tab pertama', () => {
    expect(pilihTab(tab, 'jenis', 'audit')).toBe('jenis');
    expect(pilihTab(tab, 'salah', 'audit')).toBe('audit');
    expect(pilihTab(tab, null, null)).toBe('pengguna');
  });
});
