import { bentukItemResep, galatItemResep, galatTelaah, telaahLengkap } from './keadaan-farmasi.js';
export const resepTerkunci = (r) => r.status === 'siap' || r.status === 'diserahkan';
/** Galat satu isian sebelum dikirim: telaah, item per baris, dan syarat tandai siap (ketiga telaah dan minimal satu item). */
export function galatIsianTelaah(k) {
    const g = { ...galatTelaah(k), ...galatItemResep(k.item) };
    if (k.siap && !telaahLengkap(k))
        g.siap = 'Lengkapi ketiga telaah sebelum menandai obat selesai disiapkan.';
    else if (k.siap && !k.item.length)
        g.siap = 'Isi minimal satu item obat sebelum menandai obat selesai disiapkan.';
    return g;
}
/** Bentuk kiriman telaah: centang, catatan, dan item obat dalam satu permintaan (disimpan satu transaksi di server). */
export const bentukTelaah = (k) => ({
    administratif: k.administratif, farmasetik: k.farmasetik, klinis: k.klinis, catatan: k.catatan, item: bentukItemResep(k.item),
});
/** Beritahu UI setiap penulisan berhasil agar retry melewati resep yang sudah siap. */
export async function simpanSeluruhTelaah(daftar, isian, api) {
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
