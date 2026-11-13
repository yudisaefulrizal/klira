import * as db from '@klira/db';
import { perbaruiNamaKontakInstagram } from '../domain/profil.js';
import { randomUUID } from 'node:crypto';
import { enkripsiRahasia, kunciPercakapanInstagram, pangkasPesanInstagram } from '@klira/db';
import { idPesan, tandaTanganSah } from '../domain/meta.js';
import { kabarkanInstagram } from '../domain/kanal.js';
export function bacaPesanInstagram(event, akun) {
    const m = event.message;
    const echo = m?.is_echo === true;
    const jid = (echo ? event.recipient?.id : event.sender?.id) ?? '';
    if (!m || typeof m.mid !== 'string' || !m.mid || !/^\d{3,32}$/.test(jid) || jid === akun || (echo ? event.sender?.id : event.recipient?.id) !== akun)
        return null;
    const tanggal = new Date(typeof event.timestamp === 'number' ? event.timestamp : Date.now());
    const lampiran = Array.isArray(m.attachments) ? m.attachments[0] : undefined;
    const teks = typeof m.text === 'string' ? m.text.slice(0, 10000) : '';
    if (!teks && !lampiran)
        return null;
    return { jid, mid: m.mid, nama: jid, teks, arah: echo ? 'keluar' : 'masuk', tanggal: Number.isNaN(tanggal.getTime()) ? new Date() : tanggal, lampiran };
}
// Only fetch public Meta CDN hosts, without redirects. Streaming enforces the cap even without Content-Length.
export async function unduhGambarInstagram(alamat) {
    const url = new URL(alamat);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || !/(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(url.hostname))
        throw new Error('Alamat media tidak didukung');
    const res = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000) });
    const mime = res.headers.get('content-type')?.split(';')[0];
    if (!res.ok || !res.body || !mime || !['image/jpeg', 'image/png'].includes(mime))
        throw new Error('Gambar tidak tersedia');
    const reader = res.body.getReader();
    const bagian = [];
    let ukuran = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            ukuran += value.length;
            if (ukuran > 8 * 1024 * 1024)
                throw new Error('Gambar melebihi 8 MB');
            bagian.push(value);
        }
    }
    finally {
        await reader.cancel();
    }
    return { base64: Buffer.concat(bagian).toString('base64'), mime };
}
export const webhookInstagram = async (req, res) => {
    if (!Buffer.isBuffer(req.body) || !tandaTanganSah(req.body, req.headers['x-hub-signature-256'])) {
        res.status(403).end();
        return;
    }
    let payload;
    try {
        payload = JSON.parse(req.body.toString('utf8'));
        if (!payload || typeof payload !== 'object')
            throw new Error();
    }
    catch {
        res.status(400).end();
        return;
    }
    if (payload.object !== 'instagram') {
        res.json({ ok: true });
        return;
    }
    const row = await db.ambilIgKoneksi(1);
    if (!row?.aktif || row.penyedia !== 'meta') {
        res.json({ ok: true });
        return;
    }
    for (const entry of Array.isArray(payload.entry) ? payload.entry : []) {
        if (entry?.id !== row.akun_id)
            continue;
        const events = [...(Array.isArray(entry.messaging) ? entry.messaging : []), ...(Array.isArray(entry.changes) ? entry.changes : []).filter((v) => v?.field === 'messages' && v.value).map((v) => v.value)];
        for (const event of events) {
            if (!event || typeof event !== 'object')
                continue;
            const pesan = bacaPesanInstagram(event, row.akun_id);
            if (!pesan)
                continue;
            const mid = idPesan(row.akun_id, pesan.mid);
            if (await db.ambilIgEventUntukWebhookInstagram(mid))
                continue;
            let gambar = null;
            if (pesan.lampiran?.type === 'image' && typeof pesan.lampiran.payload?.url === 'string') {
                try {
                    gambar = await unduhGambarInstagram(pesan.lampiran.payload.url);
                }
                catch { /* A failed download does not discard the DM. */ }
            }
            const baru = await db.transaksi(async (tx) => {
                await db.kunciIgKoneksi(tx);
                const current = await db.ambilIgKoneksi(1, tx);
                if (!current?.aktif || current.generasi !== row.generasi || current.akun_id !== row.akun_id || current.penyedia !== 'meta')
                    return false;
                if (await db.ambilIgEventUntukWebhookInstagram(mid, tx))
                    return false;
                const kontak = await (async () => { (await db.simpanIgPercakapanUntukWebhookInstagram(row.fasyankes_id, pesan.jid, pesan.nama, tx)); return db.simpanIgPercakapanUntukWebhookInstagramHasil(row.fasyankes_id, pesan.jid, tx); })();
                await kunciPercakapanInstagram(tx, kontak.id);
                await db.tambahIgEventUntukWebhookInstagram(mid, tx);
                // Echoes may arrive before or after the send response. Never insert an already acknowledged send.
                if (await db.ambilIgPesanUntukBuatRuteInstagram2(mid, tx))
                    return false;
                const mediaId = gambar ? randomUUID() : null;
                if (gambar && mediaId)
                    await db.tambahIgMediaUntukBuatRuteInstagram(mediaId, row.fasyankes_id, enkripsiRahasia(gambar.base64), gambar.mime, gambar.mime === 'image/png' ? 'instagram.png' : 'instagram.jpg', tx);
                const label = pesan.lampiran && !gambar ? '\n[Lampiran Instagram tidak tersedia di Klira; buka aplikasi Instagram]' : '';
                await db.tambahIgPesanUntukWebhookInstagram(kontak.id, mid, pesan.arah, enkripsiRahasia(pesan.teks + label), gambar ? 'image' : 'text', mediaId, 'terkirim', pesan.tanggal, tx);
                await db.ubahIgPercakapanUntukBuatRuteInstagram3(new Date(), kontak.id, tx);
                await pangkasPesanInstagram(tx, kontak.id);
                return kontak.id;
            });
            if (baru) {
                kabarkanInstagram({ tipe: 'pesan', fasyankes_id: row.fasyankes_id, baru: pesan.arah === 'masuk' });
                void perbaruiNamaKontakInstagram(baru);
            }
        }
    }
    // Processing failures propagate as 5xx so Meta can retry, rather than acknowledging a lost event.
    res.json({ ok: true });
};
