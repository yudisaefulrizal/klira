import type { HasilSiapDto, ResepDto, TelaahKirim } from '@klira/shared';
import { bentukItemResep, galatItemResep, galatTelaah, telaahLengkap } from './keadaan-farmasi';
import type { BarisResep, KeadaanTelaah } from './keadaan-farmasi';
/** Isian telaah satu resep: tiga centang, catatan, item obat yang disiapkan apoteker, dan pilihan tandai siap. */
export type IsianTelaah = KeadaanTelaah & { siap: boolean; item: BarisResep[] };
export const resepTerkunci = (r: ResepDto): boolean => r.status === 'siap' || r.status === 'diserahkan';

/** Galat satu isian sebelum dikirim: telaah, item per baris, dan syarat tandai siap (ketiga telaah dan minimal satu item). */
export function galatIsianTelaah(k: IsianTelaah): Record<string, string> {
  const g = { ...galatTelaah(k), ...galatItemResep(k.item) };
  if (k.siap && !telaahLengkap(k)) g.siap = 'Lengkapi ketiga telaah sebelum menandai obat selesai disiapkan.';
  else if (k.siap && !k.item.length) g.siap = 'Isi minimal satu item obat sebelum menandai obat selesai disiapkan.';
  return g;
}

/** Bentuk kiriman telaah: centang, catatan, dan item obat dalam satu permintaan (disimpan satu transaksi di server). */
export const bentukTelaah = (k: IsianTelaah): TelaahKirim => ({
  administratif: k.administratif, farmasetik: k.farmasetik, klinis: k.klinis, catatan: k.catatan, item: bentukItemResep(k.item),
});

/** Beritahu UI setiap penulisan berhasil agar retry melewati resep yang sudah siap. */
export async function simpanSeluruhTelaah(daftar: ResepDto[], isian: Record<number, IsianTelaah>, api: {
  telaah: (id: number, m: TelaahKirim) => Promise<ResepDto>;
  siapkan: (id: number) => Promise<HasilSiapDto>;
  tersimpan: (r: ResepDto) => void;
  kekurangan: (h: HasilSiapDto['kekurangan']) => void;
  selesaiResep: () => void;
}): Promise<void> {
  for (const r of daftar.filter((r) => !resepTerkunci(r))) {
    const k = isian[r.id];
    api.tersimpan(await api.telaah(r.id, bentukTelaah(k)));
    if (k.siap) {
      const hasil = await api.siapkan(r.id);
      api.tersimpan(hasil.resep);
      api.kekurangan(hasil.kekurangan);
    }
    api.selesaiResep();
  }
}
