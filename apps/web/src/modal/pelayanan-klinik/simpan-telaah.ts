import type { HasilSiapDto, ResepDto, TelaahMasukan } from '@klira/shared';
import type { KeadaanTelaah } from './keadaan-farmasi';
export type IsianTelaah = KeadaanTelaah & { siap: boolean };
export const resepTerkunci = (r: ResepDto): boolean => r.status === 'siap' || r.status === 'diserahkan';

/** Beritahu UI setiap penulisan berhasil agar retry melewati resep yang sudah siap. */
export async function simpanSeluruhTelaah(daftar: ResepDto[], isian: Record<number, IsianTelaah>, api: {
  telaah: (id: number, m: TelaahMasukan) => Promise<ResepDto>;
  siapkan: (id: number) => Promise<HasilSiapDto>;
  tersimpan: (r: ResepDto) => void;
  kekurangan: (h: HasilSiapDto['kekurangan']) => void;
  selesaiResep: () => void;
}): Promise<void> {
  for (const r of daftar.filter((r) => !resepTerkunci(r))) {
    const { siap, ...telaah } = isian[r.id];
    api.tersimpan(await api.telaah(r.id, telaah));
    if (siap) {
      const hasil = await api.siapkan(r.id);
      api.tersimpan(hasil.resep);
      api.kekurangan(hasil.kekurangan);
    }
    api.selesaiResep();
  }
}
