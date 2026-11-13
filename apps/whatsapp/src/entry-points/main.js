import * as db from '@klira/db';
import { buatPembaruanFotoWhatsapp } from '../domain/profil.js';
import { jidWhatsappPribadi } from '@klira/shared';
import { buatPemberitahuEngine } from '../domain/pembaruan.js';
import { randomUUID } from 'node:crypto';
import { enkripsiRahasia, dekripsiRahasia, kunciPercakapanWhatsapp, pangkasPesanWhatsapp, rapikanRiwayatWhatsapp, } from '@klira/db';
import makeWASocket, { BufferJSON, initAuthCreds, proto, downloadMediaMessage, normalizeMessageContent, DisconnectReason, generateMessageIDV2, } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
const muat = (isi) => JSON.parse(dekripsiRahasia(isi), BufferJSON.reviver);
const kemas = (isi) => enkripsiRahasia(JSON.stringify(isi, BufferJSON.replacer));
const logger = {
    level: 'silent',
    child() {
        return logger;
    },
    trace() { },
    debug() { },
    info() { },
    warn() { },
    error() { },
};
// libsignal dapat menulis objek kunci langsung ke console, di luar logger Baileys.
console.info = () => { };
console.warn = () => { };
console.error = () => console.log('WhatsApp: terjadi galat internal; rincian sensitif disembunyikan.');
const pemberitahu = buatPemberitahuEngine();
const perbaruiFoto = buatPembaruanFotoWhatsapp();
const kabarkan = (fasyankes_id, tipe, baru = false) => pemberitahu.kabarkan({ tipe, fasyankes_id, baru });
const pemilik = randomUUID();
let retensiSiap = false;
let socket;
let generasi = -1;
let berhenti = false;
let sibuk = false;
let ulangPada = 0;
let pulih = false;
let antrean = Promise.resolve();
const catat = (pekerjaan) => {
    antrean = antrean.then(pekerjaan).catch(() => console.error('WhatsApp: penyimpanan event gagal'));
};
async function tutup() {
    const lama = socket;
    socket = undefined;
    lama?.ev.removeAllListeners('connection.update');
    lama?.ev.removeAllListeners('messages.upsert');
    lama?.ev.removeAllListeners('messages.update');
    lama?.ev.removeAllListeners('creds.update');
    lama?.end(undefined);
}
async function autentikasi() {
    const baca = async (id) => {
        const row = await db.ambilWaAuthUntukBaca(id);
        return row ? muat(row.isi) : null;
    };
    const simpan = async (id, nilai) => {
        if (nilai == null)
            await db.hapusWaAuthUntukSimpan(id);
        else
            await db.simpanWaAuthUntukSimpan(id, kemas(nilai));
    };
    const creds = (await baca('creds')) ?? initAuthCreds();
    return {
        state: {
            creds,
            keys: {
                async get(type, ids) {
                    const hasil = {};
                    for (const id of ids) {
                        let nilai = await baca(`${type}-${id}`);
                        if (type === 'app-state-sync-key' && nilai)
                            nilai = proto.Message.AppStateSyncKeyData.fromObject(nilai);
                        if (nilai)
                            hasil[id] = nilai;
                    }
                    return hasil;
                },
                async set(data) {
                    for (const [type, values] of Object.entries(data))
                        for (const [id, nilai] of Object.entries(values ?? {}))
                            await simpan(`${type}-${id}`, nilai);
                },
            },
        },
        save: () => simpan('creds', creds),
    };
}
async function terima(fasyankes, message, wa) {
    const generasiPesan = generasi;
    if (socket !== wa)
        return;
    const jid = message.key.remoteJidAlt?.endsWith('@s.whatsapp.net') ? message.key.remoteJidAlt : message.key.remoteJid;
    if (!jidWhatsappPribadi(message.key.remoteJid) || !jidWhatsappPribadi(jid) || !message.key.id)
        return;
    const isi = normalizeMessageContent(message.message);
    if (!isi || isi.protocolMessage || isi.senderKeyDistributionMessage)
        return;
    const waId = message.key.id;
    if (await db.ambilWaPesanUntukTerima(waId))
        return;
    let teks = isi.conversation ?? isi.extendedTextMessage?.text ?? '';
    let jenis = 'text';
    let mediaId = null;
    let lampiran = null;
    for (const [tipe, media] of [
        ['image', isi.imageMessage],
        ['document', isi.documentMessage],
        ['audio', isi.audioMessage],
        ['video', isi.videoMessage],
    ]) {
        if (!media)
            continue;
        jenis = tipe;
        teks = 'caption' in media ? (media.caption ?? '') : '';
        try {
            if (Number(media.fileLength ?? 0) > 8 * 1024 * 1024)
                throw new Error('ukuran');
            const stream = await downloadMediaMessage(message, 'stream', {}, { logger, reuploadRequest: wa.updateMediaMessage });
            const potongan = [];
            let ukuran = 0;
            for await (const potong of stream) {
                ukuran += potong.length;
                if (ukuran > 8 * 1024 * 1024) {
                    stream.destroy();
                    throw new Error('ukuran');
                }
                potongan.push(potong);
            }
            mediaId = randomUUID();
            lampiran = {
                id: mediaId,
                fasyankes_id: fasyankes,
                isi: enkripsiRahasia(Buffer.concat(potongan).toString('base64')),
                mime: media.mimetype ?? 'application/octet-stream',
                nama: ('fileName' in media && media.fileName ? media.fileName : `lampiran-${tipe}`).slice(0, 200),
            };
        }
        catch {
            teks = `${teks}\n[Lampiran tidak tersedia atau melebihi 8 MB]`.trim();
        }
        break;
    }
    if (!teks && !mediaId)
        teks = '[Jenis pesan ini belum didukung]';
    const tersimpan = await db.transaksi(async (tx) => {
        await db.kunciWaKoneksi(tx);
        const current = await db.ambilWaKoneksi(1, tx);
        if (!current?.aktif || current.fasyankes_id !== fasyankes || current.generasi !== generasiPesan || socket !== wa)
            return false;
        if (lampiran)
            await db.tambahWaMediaUntukTerima(tx);
        const percakapan = await (async () => { (await db.simpanWaPercakapanUntukTerima(fasyankes, jid, (message.key.fromMe ? jid.split('@')[0] : message.pushName || jid.split('@')[0]).slice(0, 200), tx)); return db.simpanWaPercakapanUntukBuatRuteWhatsappHasil(fasyankes, jid, tx); })();
        await kunciPercakapanWhatsapp(tx, percakapan.id);
        await db.tambahWaPesanUntukTerima(percakapan.id, waId, message.key.fromMe ? 'keluar' : 'masuk', enkripsiRahasia(teks), jenis, mediaId, message.key.fromMe ? 'terkirim' : 'diterima', tx);
        await db.ubahWaPercakapanUntukBuatRuteWhatsapp3(new Date(), percakapan.id, tx);
        await pangkasPesanWhatsapp(tx, percakapan.id);
        return true;
    });
    if (tersimpan)
        kabarkan(fasyankes, 'pesan', !message.key.fromMe);
}
async function hubungkan(fasyankes) {
    await db.ubahWaKoneksiUntukHubungkan('menghubungkan', null, 1);
    const auth = await autentikasi();
    const wa = makeWASocket({
        auth: auth.state,
        logger,
        markOnlineOnConnect: false,
        syncFullHistory: false,
        connectTimeoutMs: 20000,
        defaultQueryTimeoutMs: 30000,
    });
    socket = wa;
    wa.ev.on('creds.update', () => catat(auth.save));
    wa.ev.on('connection.update', (event) => catat(async () => {
        if (socket !== wa || berhenti)
            return;
        if (event.qr)
            await db.ubahWaKoneksiUntukHubungkan('qr', enkripsiRahasia(await QRCode.toDataURL(event.qr)), 1);
        if (event.connection === 'open')
            await db.ubahWaKoneksiUntukHubungkan3('terhubung', wa.user?.id.split(':')[0].split('@')[0], null, 1);
        if (event.connection === 'close') {
            socket = undefined;
            const kode = event.lastDisconnect?.error?.output?.statusCode;
            const logout = kode === DisconnectReason.loggedOut;
            ulangPada = Date.now() + 5000;
            await db.ubahWaKoneksiUntukHubungkan4((logout) ? (false) : (undefined), logout ? 'terputus' : 'menghubungkan', (logout) ? (null) : (undefined), null, 1);
            if (logout)
                await db.hapusWaAuthUntukPutuskanDanBersihkan();
        }
        kabarkan(fasyankes, 'koneksi');
    }));
    wa.ev.on('messages.upsert', (event) => {
        if (event.type === 'notify')
            for (const pesan of event.messages)
                catat(() => terima(fasyankes, pesan, wa));
    });
    wa.ev.on('messages.update', (events) => catat(async () => {
        for (const { key, update } of events) {
            if (!key.id || !jidWhatsappPribadi(key.remoteJid) || !update.status)
                continue;
            const status = update.status >= 4 ? 'dibaca' : update.status >= 3 ? 'diterima' : undefined;
            if (status)
                await db.ubahWaPesanUntukHubungkan(status, key.id, ['antre', 'mengirim'], 'dibaca', (status === 'diterima') && (true));
        }
        kabarkan(fasyankes, 'pesan');
    }));
}
async function kirim(fasyankes) {
    const wa = socket;
    if (!wa?.user)
        return;
    const pesan = await db.cariWaPesanUntukKirim('keluar', 'antre', fasyankes);
    if (!pesan)
        return;
    if (!jidWhatsappPribadi(pesan.percakapan.jid)) {
        await db.ubahWaPesanUntukKirim('dibatalkan', pesan.id);
        return;
    }
    const waId = generateMessageIDV2(wa.user.id);
    const klaim = await db.ubahWaPesanUntukKirim2(waId, 'mengirim', pesan.id, 'antre');
    if (!klaim.count)
        return;
    try {
        const teks = dekripsiRahasia(pesan.isi);
        let content = { text: teks };
        if (pesan.media_id) {
            const media = await db.wajibWaMediaUntukKirim(pesan.media_id);
            const buffer = Buffer.from(dekripsiRahasia(media.isi), 'base64');
            content =
                pesan.jenis === 'image'
                    ? { image: buffer, caption: teks }
                    : pesan.jenis === 'audio'
                        ? { audio: buffer, mimetype: media.mime }
                        : pesan.jenis === 'video'
                            ? { video: buffer, caption: teks }
                            : { document: buffer, mimetype: media.mime, fileName: media.nama, caption: teks };
        }
        const hasil = await wa.sendMessage(pesan.percakapan.jid, content, { messageId: waId });
        if (!hasil?.key.id)
            throw new Error('ID kosong');
        await db.transaksi(async (tx) => {
            await kunciPercakapanWhatsapp(tx, pesan.percakapan_id);
            await db.ubahWaPesanUntukKirim('terkirim', pesan.id, tx);
            await pangkasPesanWhatsapp(tx, pesan.percakapan_id);
        });
    }
    catch {
        await db.transaksi(async (tx) => {
            await kunciPercakapanWhatsapp(tx, pesan.percakapan_id);
            await db.ubahWaPesanUntukKirim('gagal', pesan.id, tx);
            await pangkasPesanWhatsapp(tx, pesan.percakapan_id);
        });
    }
    kabarkan(fasyankes, 'pesan');
}
async function detak() {
    if (berhenti)
        return;
    const now = new Date();
    const klaim = await db.ubahWaKoneksiUntukDetak(now, pemilik, new Date(Date.now() + 60000), 1, null);
    if (!klaim.count) {
        pulih = false;
        await tutup();
        return;
    }
    if (!pulih) {
        await db.ubahWaPesanUntukDetak('gagal', 'mengirim');
        pulih = true;
    }
    if (sibuk)
        return;
    sibuk = true;
    try {
        if (!retensiSiap) {
            await rapikanRiwayatWhatsapp();
            retensiSiap = true;
        }
        const koneksi = await db.wajibWaKoneksiUntukDetak(1);
        if (!koneksi.aktif || koneksi.generasi !== generasi) {
            if (!koneksi.aktif && socket?.user) {
                try {
                    await socket.logout();
                }
                catch {
                    console.error('WhatsApp: logout jarak jauh belum terkonfirmasi');
                }
            }
            await tutup();
            await antrean;
            generasi = koneksi.generasi;
            if (!koneksi.aktif) {
                await db.hapusWaAuthUntukPutuskanDanBersihkan();
                await db.ubahWaKoneksiUntukDetak2('terputus', null, 1);
                return;
            }
        }
        if (!socket && Date.now() >= ulangPada) {
            ulangPada = Date.now() + 10000;
            await hubungkan(koneksi.fasyankes_id);
        }
        const terbaru = await db.wajibWaKoneksiUntukDetak(1);
        if (terbaru.aktif && terbaru.generasi === generasi && terbaru.status === 'terhubung') {
            await kirim(koneksi.fasyankes_id);
            const wa = socket;
            const generasiFoto = generasi;
            if (wa?.user)
                void perbaruiFoto({
                    fasyankes: koneksi.fasyankes_id, generasi: generasiFoto, pemilik,
                    masihAktif: () => socket === wa && generasi === generasiFoto && !berhenti,
                    ambil: (jid) => wa.profilePictureUrl(jid, 'image', 8000),
                    kabarkan: () => kabarkan(koneksi.fasyankes_id, 'pesan'),
                });
        }
    }
    finally {
        sibuk = false;
    }
}
const timer = setInterval(() => {
    void detak().catch(() => {
        void tutup();
        console.error('WhatsApp: engine belum siap; periksa database dan migrasi');
    });
}, 1500);
console.log('Engine WhatsApp Klira berjalan (satu nomor).');
for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, () => {
        void (async () => {
            berhenti = true;
            clearInterval(timer);
            pemberitahu.tutup();
            await tutup();
            await antrean;
            await db.ubahWaKoneksiUntukSrcMain('terputus', null, null, pemilik);
            await db.tutupPool();
        })().finally(() => process.exit());
    });
