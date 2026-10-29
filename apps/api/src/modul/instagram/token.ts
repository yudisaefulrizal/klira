import { prisma, enkripsiRahasia, dekripsiRahasia } from '@klira/db';
import { perpanjangToken, GalatMeta } from './meta';
import { kabarkanInstagram } from './kanal';
let berjalan = false;
export async function perbaruiTokenInstagram() {
  if (berjalan) return;
  berjalan = true;
  try {
    await prisma.igMediaPublik.deleteMany({ where: { berakhir: { lt: new Date() } } });
    await prisma.igOauthState.deleteMany({ where: { berakhir: { lt: new Date() } } });
    const row = await prisma.igKoneksi.findUnique({ where: { id: 1 } });
    if (!row?.aktif || row.penyedia !== 'meta' || !row.access_token || !row.token_berakhir) return;
    if (row.token_berakhir.getTime() <= Date.now()) {
      await prisma.igKoneksi.updateMany({ where: { id: 1, generasi: row.generasi, access_token: row.access_token }, data: { status: 'kedaluwarsa', access_token: null } });
      kabarkanInstagram({ tipe: 'koneksi', fasyankes_id: row.fasyankes_id }); return;
    }
    if (row.token_berakhir.getTime() - Date.now() > 7 * 86400000 || !row.token_diperbarui || Date.now() - row.token_diperbarui.getTime() < 86400000) return;
    try {
      const next = await perpanjangToken(dekripsiRahasia(row.access_token));
      await prisma.igKoneksi.updateMany({ where: { id: 1, aktif: true, generasi: row.generasi, access_token: row.access_token }, data: { access_token: enkripsiRahasia(next.token), token_berakhir: new Date(Date.now() + next.masa * 1000), token_diperbarui: new Date() } });
    } catch (e) {
      if (e instanceof GalatMeta && e.dicabut) await prisma.igKoneksi.updateMany({ where: { id: 1, generasi: row.generasi, access_token: row.access_token }, data: { aktif: false, status: 'dicabut', access_token: null, webhook_aktif: false, generasi: { increment: 1 } } });
      console.error('Perpanjangan token Instagram gagal; periksa koneksi atau hubungkan ulang akun.');
    }
    kabarkanInstagram({ tipe: 'koneksi', fasyankes_id: row.fasyankes_id });
  } finally { berjalan = false; }
}
