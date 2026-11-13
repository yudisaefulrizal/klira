import * as api from '../../../api-klien/instagram.js';
import { sesiPesan } from './konteks-pesan.js';
import { AvatarInstagram } from './avatar.js';
import { IkonInstagram } from './ikon-svg.js';
import { KoneksiInstagram } from './koneksi.js';
import { InfoKontakPesan } from './info-kontak.js';
import { buatTampilanPesan } from '../bersama/tampilan.js';
export const { TombolPesan, IsiPesan, PanelPesan } = buatTampilanPesan({ kanal: 'instagram', nama: 'Instagram', prefix: 'ig', sesi: sesiPesan, api, Avatar: AvatarInstagram, Koneksi: KoneksiInstagram, Info: InfoKontakPesan, logo: IkonInstagram });
