import * as db from '@klira/db';
import express, { Router } from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { dekripsiRahasia } from '@klira/db';
import { selesaikanLogin } from '../domain/login.js';
import { bacaSignedRequest, hash } from '../domain/meta.js';
import { webhookInstagram } from './webhook.js';
import { kabarkanInstagram } from '../domain/kanal.js';
export function buatRuteInstagramPublik(akses) {
    const r = Router();
    r.get('/auth/instagram/callback', async (req, res) => {
        let result = 'gagal';
        try {
            result = await selesaikanLogin(req, akses);
        }
        catch { /* Callback must never expose tokens, codes or provider response bodies. */ }
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Referrer-Policy', 'no-referrer');
        res.redirect(302, `/pesan?kanal=instagram&instagram=${encodeURIComponent(result)}`);
    });
    r.get('/webhook/instagram', (req, res) => {
        const token = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
        const given = req.query['hub.verify_token'];
        if (!token)
            return void res.sendStatus(503);
        if (req.query['hub.mode'] !== 'subscribe' || typeof given !== 'string' || typeof req.query['hub.challenge'] !== 'string' || Buffer.byteLength(token) !== Buffer.byteLength(given) || !timingSafeEqual(Buffer.from(token), Buffer.from(given)))
            return void res.sendStatus(403);
        res.type('text/plain').send(req.query['hub.challenge']);
    });
    r.post('/webhook/instagram', express.raw({ type: '*/*', limit: '1mb' }), webhookInstagram);
    r.get('/instagram/media/:token', async (req, res) => {
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'no-referrer');
        if (!/^[a-f\d]{64}$/.test(String(req.params.token)))
            return void res.sendStatus(404);
        const row = await db.ambilIgMediaPublikUntukBuatRuteInstagramPublik(hash(String(req.params.token)));
        const koneksi = row ? await db.ambilIgKoneksi(1) : null;
        if (!row || row.berakhir.getTime() <= Date.now() || !koneksi?.aktif || koneksi.penyedia !== 'meta' || koneksi.generasi !== row.generasi)
            return void res.sendStatus(404);
        const media = await db.cariIgMediaUntukBuatRuteInstagram(row.media_id, koneksi.fasyankes_id);
        if (!media || !['image/jpeg', 'image/png'].includes(media.mime))
            return void res.sendStatus(404);
        res.type(media.mime).send(Buffer.from(dekripsiRahasia(media.isi), 'base64'));
    });
    const parser = express.urlencoded({ extended: false, limit: '16kb' });
    r.post('/instagram/deauthorize', parser, async (req, res) => {
        const id = bacaSignedRequest(req.body?.signed_request);
        if (!id)
            return void res.sendStatus(403);
        const row = await db.cariIgKoneksiUntukBuatRuteInstagramPublik('meta', id, id);
        if (row)
            await db.transaksi(async (tx) => {
                await db.kunciIgKoneksi(tx);
                await db.ubahIgKoneksiUntukBuatRuteInstagramPublik(false, 'dicabut', null, null, 1, row.akun_id, tx);
                await db.hapusIgOauthStateUntukPutuskanDanBersihkan(row.fasyankes_id, tx);
                await db.hapusIgMediaPublikUntukBuatRuteInstagramPublik(tx);
            });
        if (row)
            kabarkanInstagram({ tipe: 'koneksi', fasyankes_id: row.fasyankes_id });
        res.sendStatus(200);
    });
    r.post('/instagram/data-deletion', parser, async (req, res) => {
        const id = bacaSignedRequest(req.body?.signed_request);
        if (!id)
            return void res.sendStatus(403);
        const code = randomBytes(24).toString('hex');
        const fas = await db.transaksi(async (tx) => {
            await db.kunciIgKoneksi(tx);
            const row = await db.cariIgKoneksiUntukBuatRuteInstagramPublik('meta', id, id, tx);
            if (row) {
                await db.hapusIgMediaPublikUntukBuatRuteInstagramPublik(tx);
                await db.hapusIgBacaUntukBersihkanDalam(row.fasyankes_id, tx);
                await db.hapusIgPesanUntukBersihkanDalam(row.fasyankes_id, tx);
                await db.hapusIgPercakapanUntukBersihkanDalam(row.fasyankes_id, tx);
                await db.hapusIgMediaUntukBersihkanDalam(row.fasyankes_id, tx);
                await db.hapusIgOauthStateUntukPutuskanDanBersihkan(row.fasyankes_id, tx);
                await db.hapusIgEventUntukBuatRuteInstagramPublik(tx);
                // Keep a blank singleton to invalidate in-flight callbacks while removing account identifiers and credentials.
                await db.ubahIgKoneksiUntukBuatRuteInstagramPublik2(false, 'terputus', '', null, null, 1, tx);
            }
            await db.tambahIgPenghapusanUntukBuatRuteInstagramPublik(code, tx);
            return row?.fasyankes_id;
        });
        if (fas)
            kabarkanInstagram({ tipe: 'koneksi', fasyankes_id: fas });
        res.setHeader('Cache-Control', 'no-store');
        res.json({ url: `${new URL(process.env.BASE_URL ?? 'http://localhost').origin}/instagram/data-deletion-status/${code}`, confirmation_code: code });
    });
    r.get('/instagram/data-deletion-status/:code', async (req, res) => {
        res.setHeader('Cache-Control', 'no-store');
        const code = String(req.params.code);
        if (!/^[a-f\d]{48}$/.test(code) || !await db.ambilIgPenghapusanUntukBuatRuteInstagramPublik(code))
            return void res.sendStatus(404);
        res.type('text/plain').send('Permintaan penghapusan data integrasi Instagram sudah selesai diproses.');
    });
    return r;
}
