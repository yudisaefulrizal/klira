import { readFileSync } from 'fs';
import { join } from 'path';
import { adaptorDrafServer } from '../../api-klien/draf-klinis';
import type { DrafKlinisDto } from '@klira/shared';

const sumber = readFileSync(join(__dirname, 'pemeriksaan-klinis.tsx'), 'utf8');

describe('modal Pemeriksaan klinis tidak memakai penyimpanan lokal', () => {
  it('tidak mengimpor atau memanggil penyimpan lokal, hanya adaptor server', () => {
    for (const larangan of ['localStorage', 'sessionStorage', 'adaptorLokal', 'simpanDraf', 'bacaDraf', 'kunciDraf', 'saringSensitif']) {
      expect(sumber).not.toContain(larangan);
    }
    expect(sumber).toContain('adaptorDrafServer');
    // hanya boleh menghapus sisa kunci lama, tidak pernah menulis
    expect(sumber).toContain('hapusDrafKlinisLama');
  });

  it('adaptor server tidak menyentuh localStorage dan menyimpan isi utuh', async () => {
    const lokal = { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn(), key: jest.fn(), length: 0 };
    (globalThis as { localStorage?: unknown }).localStorage = lokal;
    try {
      const simpan = jest.fn(async () => ({}));
      const a = adaptorDrafServer<{ anamnesis: { keluhan_utama: string } }>(5, 'pemeriksaan-klinis', { baca: async () => null, simpan, hapus: async () => ({}) });
      await a.simpan({ anamnesis: { keluhan_utama: 'Batuk' } }, 2);
      expect(simpan).toHaveBeenCalledWith(5, 'pemeriksaan-klinis', 2, { anamnesis: { keluhan_utama: 'Batuk' } });
      expect(a.saring({ anamnesis: { keluhan_utama: 'Batuk' } })).toEqual({ anamnesis: { keluhan_utama: 'Batuk' } });
      for (const f of Object.values(lokal)) if (typeof f === 'function') expect(f).not.toHaveBeenCalled();
    } finally {
      delete (globalThis as { localStorage?: unknown }).localStorage;
    }
  });
});

describe('adaptor draf server', () => {
  const dto: DrafKlinisDto = { alur: 'skrining', kunjungan_id: 5, langkah: 1, isi: { a: 1 }, diperbarui_pada: '2026-10-25T01:00:00.000Z' };

  it('baca mengubah draf server menjadi draf kerangka; galat atau kosong menjadi null', async () => {
    const dasar = { simpan: async () => ({}), hapus: async () => ({}) };
    expect(await adaptorDrafServer(5, 'skrining', { ...dasar, baca: async () => dto }).baca()).toEqual({ versi: 1, disimpan: dto.diperbarui_pada, langkah: 1, nilai: { a: 1 } });
    expect(await adaptorDrafServer(5, 'skrining', { ...dasar, baca: async () => null }).baca()).toBeNull();
    expect(await adaptorDrafServer(5, 'skrining', { ...dasar, baca: async () => { throw new Error('putus'); } }).baca()).toBeNull();
  });

  it('simpan dan hapus berjalan berurutan dan kegagalan tidak melempar', async () => {
    const urutan: string[] = [];
    const tunda = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const a = adaptorDrafServer(5, 'skrining', {
      baca: async () => null,
      simpan: async () => { await tunda(20); urutan.push('simpan'); throw new Error('putus'); },
      hapus: async () => { urutan.push('hapus'); return {}; },
    });
    void a.simpan({}, 0);
    await a.hapus();
    expect(urutan).toEqual(['simpan', 'hapus']);
  });
});
