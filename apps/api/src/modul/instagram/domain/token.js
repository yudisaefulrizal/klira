import * as db from '@klira/db';
import { enkripsiRahasia, dekripsiRahasia } from '@klira/db';
import { perpanjangToken, GalatMeta } from './meta.js';
import { kabarkanInstagram } from './kanal.js';
let berjalan = false;
export async function perbaruiTokenInstagram() {
    if (berjalan)
        return;
    berjalan = true;
    try {
        await db.hapusIgMediaPublikUntukPerbaruiTokenInstagram(new Date());
        await db.hapusIgOauthStateUntukPerbaruiTokenInstagram(new Date());
        const row = await db.ambilIgKoneksi(1);
        if (!row?.aktif || row.penyedia !== 'meta' || !row.access_token || !row.token_berakhir)
            return;
        if (row.token_berakhir.getTime() <= Date.now()) {
            await db.ubahIgKoneksiUntukPerbaruiTokenInstagram('kedaluwarsa', null, 1, row.generasi, row.access_token);
            kabarkanInstagram({ tipe: 'koneksi', fasyankes_id: row.fasyankes_id });
            return;
        }
        if (row.token_berakhir.getTime() - Date.now() > 7 * 86400000 || !row.token_diperbarui || Date.now() - row.token_diperbarui.getTime() < 86400000)
            return;
        try {
            const next = await perpanjangToken(dekripsiRahasia(row.access_token));
            await db.ubahIgKoneksiUntukPerbaruiTokenInstagram2(enkripsiRahasia(next.token), new Date(Date.now() + next.masa * 1000), new Date(), 1, true, row.generasi, row.access_token);
        }
        catch (e) {
            if (e instanceof GalatMeta && e.dicabut)
                await db.ubahIgKoneksiUntukPerbaruiTokenInstagram3(false, 'dicabut', null, 1, row.generasi, row.access_token);
            console.error('Perpanjangan token Instagram gagal; periksa koneksi atau hubungkan ulang akun.');
        }
        kabarkanInstagram({ tipe: 'koneksi', fasyankes_id: row.fasyankes_id });
    }
    finally {
        berjalan = false;
    }
}
