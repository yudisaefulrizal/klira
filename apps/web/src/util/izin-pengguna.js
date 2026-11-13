import { punyaIzin } from '@klira/shared';
/** Izin UI mengikuti pengguna yang diberikan pemanggil; pemeriksaan server tetap pada API. */
export const izinUntuk = pengguna => (fitur, aksi, cakupan) => !!pengguna && punyaIzin(pengguna, fitur, aksi, cakupan);
