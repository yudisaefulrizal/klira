import { fileURLToPath as kliraFilePath } from 'node:url';
const __dirname = kliraFilePath(new URL('.', import.meta.url));
import { pasangWebsocketLayarPanggilan } from './modul/layar-panggilan/entry-points/websocket.js';
import { pasangWebsocketNotifikasi } from './modul/notifikasi/entry-points/websocket.js';
import { perbaruiTokenInstagram } from './modul/instagram/domain/token.js';
import { pulihkanPengirimanInstagram } from './modul/instagram/domain/pemulihan.js';
import { pasangWebsocketInstagram } from './modul/instagram/entry-points/websocket.js';
import { createServer } from 'node:http';
import { pasangWebsocketWhatsapp } from './modul/whatsapp/entry-points/websocket.js';
import { buatApp } from './app.js';
import { bacaKonfigurasi } from './config/lingkungan.js';
import { GalatFasyankesGanda, pastikanFasyankesTunggal } from '@klira/db';
/** Satu instalasi satu fasyankes: menolak mulai bila database berisi lebih dari satu. Database yang belum siap atau tidak terjangkau tidak menahan proses. */
async function periksaFasyankesTunggal() {
    try {
        await pastikanFasyankesTunggal();
    }
    catch (galat) {
        if (galat instanceof GalatFasyankesGanda)
            throw galat;
        console.error('Pemeriksaan satu fasyankes dilewati: database belum siap atau tidak terjangkau.');
    }
}
async function mulai() {
    const { port, baseUrl, trustProxy } = bacaKonfigurasi();
    await periksaFasyankesTunggal();
    const server = createServer();
    const app = buatApp(undefined, { trustProxy });
    server.on('request', app);
    pasangWebsocketWhatsapp(server, app.locals.layananAkses, baseUrl);
    pasangWebsocketInstagram(server, app.locals.layananAkses, baseUrl);
    pasangWebsocketLayarPanggilan(server, baseUrl, 20000, app.locals.layananAkses);
    pasangWebsocketNotifikasi(server, app.locals.layananAkses, baseUrl);
    let memulihkanInstagram = false;
    const pulihkanInstagram = async () => {
        if (memulihkanInstagram)
            return;
        memulihkanInstagram = true;
        try {
            await pulihkanPengirimanInstagram();
        }
        catch {
            console.error('Pemulihan pengiriman Instagram gagal; periksa migrasi dan koneksi database.');
        }
        finally {
            memulihkanInstagram = false;
        }
    };
    const timerInstagram = setInterval(() => void pulihkanInstagram(), 60000);
    timerInstagram.unref();
    const timerTokenInstagram = setInterval(() => void perbaruiTokenInstagram().catch(() => console.error('Pemeliharaan Instagram gagal.')), 3600000);
    timerTokenInstagram.unref();
    // Pendaftaran Mobile JKN ditarik dari PCare secara berkala untuk fasyankes yang mengaktifkan antrean online.
    const timerAntreanJkn = setInterval(() => void app.locals.layananAntreanJkn?.tarikSemua().catch(() => console.error('Tarik pendaftaran Mobile JKN gagal.')), 30000);
    timerAntreanJkn.unref();
    server.once('close', () => { clearInterval(timerInstagram); clearInterval(timerTokenInstagram); clearInterval(timerAntreanJkn); });
    void perbaruiTokenInstagram().catch(() => console.error('Pemeliharaan Instagram gagal; periksa migrasi.'));
    void pulihkanInstagram();
    server.listen(port, () => {
        console.log(`Klira berjalan di port ${port} (${baseUrl})`);
    });
}
void mulai().catch((galat) => { console.error(galat instanceof GalatFasyankesGanda ? galat.message : galat); process.exit(1); });
