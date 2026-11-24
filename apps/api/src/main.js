import { pasangWebsocketLayarPanggilan } from './modul/layar-panggilan/entry-points/websocket.js';
import { pasangWebsocketNotifikasi } from './modul/notifikasi/entry-points/websocket.js';
import { perbaruiTokenInstagram } from './modul/instagram/domain/token.js';
import { pulihkanPengirimanInstagram } from './modul/instagram/domain/pemulihan.js';
import { pasangWebsocketInstagram } from './modul/instagram/entry-points/websocket.js';
import { createServer } from 'node:http';
import { pasangWebsocketWhatsapp } from './modul/whatsapp/entry-points/websocket.js';
import { buatApp } from './app.js';
import { bacaKonfigurasi } from './config/lingkungan.js';
import { GalatFasyankesGanda, pastikanFasyankesTunggal, tutupPool } from '@klira/db';

const BATAS_TUTUP_MS = 10_000;
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
    const tutupWebsocket = [
        pasangWebsocketWhatsapp(server, app.locals.layananAkses, baseUrl),
        pasangWebsocketInstagram(server, app.locals.layananAkses, baseUrl),
        pasangWebsocketLayarPanggilan(server, baseUrl, 20000, app.locals.layananAkses),
        pasangWebsocketNotifikasi(server, app.locals.layananAkses, baseUrl),
    ];
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
    // Penutupan anggun: berhenti menerima sambungan, putuskan WebSocket (yang menahan server.close), lalu tutup database.
    let berhenti = false;
    const berhentiAnggun = (sinyal) => {
        if (berhenti)
            return;
        berhenti = true;
        console.log(`${sinyal} diterima; menutup Klira.`);
        setTimeout(() => { console.error('Penutupan melewati batas waktu; keluar paksa.'); process.exit(1); }, BATAS_TUTUP_MS).unref();
        for (const tutup of tutupWebsocket)
            tutup();
        server.close(() => void tutupPool().catch(() => undefined).finally(() => process.exit(0)));
        server.closeIdleConnections();
        setTimeout(() => server.closeAllConnections(), 3000).unref();
    };
    process.once('SIGTERM', () => berhentiAnggun('SIGTERM'));
    process.once('SIGINT', () => berhentiAnggun('SIGINT'));
}
void mulai().catch((galat) => { console.error(galat instanceof GalatFasyankesGanda ? galat.message : galat); process.exit(1); });
