import { izinUntuk } from '../../util/sesi/izin-pengguna.js';
import { penggunaSaatIni } from '../../util/sesi/konteks-pengguna.js';
export const izinSaatIni = () => izinUntuk(penggunaSaatIni().pengguna);
export function HanyaDenganIzin({ fitur, aksi, cakupan, children }) {
  const el = document.createDocumentFragment();
  if (izinSaatIni()(fitur, aksi, cakupan)) el.append(...[children].flat(Infinity).filter(x => x !== null && x !== undefined && x !== false && x !== true));
  return el;
}
