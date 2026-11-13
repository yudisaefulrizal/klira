import * as api from '../../api-klien/instagram.js';
import { buatSesiPesan } from '../pesan/sesi-pesan.js';
export const sesiPesan = buatSesiPesan('instagram', api);
export const pesanSaatIni = () => sesiPesan.potret();
