import * as api from '../../../api-klien/whatsapp.js';
import { buatSesiPesan } from '../bersama/sesi-pesan.js';
export const sesiPesan = buatSesiPesan('whatsapp', api);
export const pesanSaatIni = () => sesiPesan.potret();
