import { bacaDrafKlinis, hapusDrafKlinis, simpanDrafKlinis } from './klinis.js';
const apiBawaan = { baca: bacaDrafKlinis, simpan: simpanDrafKlinis, hapus: hapusDrafKlinis };
/** Draf server menjadi bentuk draf kerangka; null bila tidak ada. */
export const drafDariServer = (d) => (d ? { versi: 1, disimpan: d.diperbarui_pada, langkah: d.langkah, nilai: d.isi } : null);
/**
 * Penyimpan draf di server untuk alur klinis. Data kesehatan tidak boleh masuk penyimpanan peramban komputer bersama.
 * Permintaan simpan dan hapus dijalankan berurutan agar simpan yang terlambat tidak menghidupkan lagi draf yang sudah dihapus.
 * Kegagalan jaringan tidak mengganggu pengisian (isian tetap di layar).
 */
export function adaptorDrafServer(kunjunganId, alur, api = apiBawaan) {
    let antrean = Promise.resolve();
    const urut = (kerja) => {
        antrean = antrean.then(kerja, kerja).catch(() => undefined);
        return antrean;
    };
    return {
        baca: () => api.baca(kunjunganId, alur).then((d) => drafDariServer(d), () => null),
        simpan: (nilai, langkah) => urut(() => api.simpan(kunjunganId, alur, langkah, nilai)),
        hapus: () => urut(() => api.hapus(kunjunganId, alur)),
        saring: (nilai) => nilai,
    };
}
