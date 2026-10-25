import type { AlurDrafKlinis, DrafKlinisDto } from '@klira/shared';
import type { AdaptorDraf, Draf } from '../util/draf';
import { bacaDrafKlinis, hapusDrafKlinis, simpanDrafKlinis } from './klinis';

type Api = {
  baca: (kunjunganId: number, alur: AlurDrafKlinis) => Promise<DrafKlinisDto | null>;
  simpan: (kunjunganId: number, alur: AlurDrafKlinis, langkah: number, isi: Record<string, unknown>) => Promise<unknown>;
  hapus: (kunjunganId: number, alur: AlurDrafKlinis) => Promise<unknown>;
};
const apiBawaan: Api = { baca: bacaDrafKlinis, simpan: simpanDrafKlinis, hapus: hapusDrafKlinis };

/** Draf server menjadi bentuk draf kerangka; null bila tidak ada. */
export const drafDariServer = <T>(d: DrafKlinisDto | null): Draf<T> | null => (d ? { versi: 1, disimpan: d.diperbarui_pada, langkah: d.langkah, nilai: d.isi as T } : null);

/**
 * Penyimpan draf di server untuk alur klinis. Data kesehatan tidak boleh masuk penyimpanan peramban komputer bersama.
 * Permintaan simpan dan hapus dijalankan berurutan agar simpan yang terlambat tidak menghidupkan lagi draf yang sudah dihapus.
 * Kegagalan jaringan tidak mengganggu pengisian (isian tetap di layar).
 */
export function adaptorDrafServer<T extends object>(kunjunganId: number, alur: AlurDrafKlinis, api: Api = apiBawaan): AdaptorDraf<T> {
  let antrean: Promise<unknown> = Promise.resolve();
  const urut = (kerja: () => Promise<unknown>) => {
    antrean = antrean.then(kerja, kerja).catch(() => undefined);
    return antrean;
  };
  return {
    baca: () => api.baca(kunjunganId, alur).then((d) => drafDariServer<T>(d), () => null),
    simpan: (nilai, langkah) => urut(() => api.simpan(kunjunganId, alur, langkah, nilai as Record<string, unknown>)),
    hapus: () => urut(() => api.hapus(kunjunganId, alur)),
    saring: (nilai) => nilai,
  };
}
