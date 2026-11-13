import * as api from '../../api-klien/whatsapp.js';
import { sesiPesan } from './konteks-pesan.js';
import { AvatarKontak } from './avatar.js';
import { KoneksiWhatsapp } from './koneksi.js';
import { InfoKontakPesan } from './info-kontak.js';
import { buatTampilanPesan } from './tampilan-native.js';
export const { TombolPesan, IsiPesan, PanelPesan } = buatTampilanPesan({ kanal: 'whatsapp', nama: 'WhatsApp', prefix: 'wa', sesi: sesiPesan, api, Avatar: AvatarKontak, Koneksi: KoneksiWhatsapp, Info: InfoKontakPesan });
