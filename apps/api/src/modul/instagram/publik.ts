import express, { Router } from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { prisma, dekripsiRahasia } from '@klira/db';
import type { LayananAkses } from '../akses/layanan';
import { selesaikanLogin } from './login';
import { bacaSignedRequest, hash } from './meta';
import { webhookInstagram } from './webhook';
import { kabarkanInstagram } from './kanal';
export function buatRuteInstagramPublik(akses: LayananAkses) {
  const r = Router();
  r.get('/auth/instagram/callback', async (req, res) => {
    let result = 'gagal';
    try { result = await selesaikanLogin(req, akses); } catch { /* Callback must never expose tokens, codes or provider response bodies. */ }
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('Referrer-Policy', 'no-referrer');
    res.redirect(302, `/pengaturan?tab=instagram&instagram=${encodeURIComponent(result)}`);
  });
  r.get('/webhook/instagram', (req, res) => {
    const token = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
    const given = req.query['hub.verify_token'];
    if (!token) return void res.sendStatus(503);
    if (req.query['hub.mode'] !== 'subscribe' || typeof given !== 'string' || typeof req.query['hub.challenge'] !== 'string' || Buffer.byteLength(token) !== Buffer.byteLength(given) || !timingSafeEqual(Buffer.from(token), Buffer.from(given))) return void res.sendStatus(403);
    res.type('text/plain').send(req.query['hub.challenge']);
  });
  r.post('/webhook/instagram', express.raw({ type: '*/*', limit: '1mb' }), webhookInstagram);
  r.get('/instagram/media/:token', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'no-referrer');
    if (!/^[a-f\d]{64}$/.test(String(req.params.token))) return void res.sendStatus(404);
    const row = await prisma.igMediaPublik.findUnique({ where: { token_hash: hash(String(req.params.token)) } });
    const koneksi = row ? await prisma.igKoneksi.findUnique({ where: { id: 1 } }) : null;
    if (!row || row.berakhir.getTime() <= Date.now() || !koneksi?.aktif || koneksi.penyedia !== 'meta' || koneksi.generasi !== row.generasi) return void res.sendStatus(404);
    const media = await prisma.igMedia.findFirst({ where: { id: row.media_id, fasyankes_id: koneksi.fasyankes_id } });
    if (!media || !['image/jpeg', 'image/png'].includes(media.mime)) return void res.sendStatus(404);
    res.type(media.mime).send(Buffer.from(dekripsiRahasia(media.isi), 'base64'));
  });
  const parser = express.urlencoded({ extended: false, limit: '16kb' });
  r.post('/instagram/deauthorize', parser, async (req, res) => {
    const id = bacaSignedRequest(req.body?.signed_request);
    if (!id) return void res.sendStatus(403);
    const row = await prisma.igKoneksi.findFirst({ where: { penyedia: 'meta', OR: [{ akun_id: id }, { oauth_user_id: id }] } });
    if (row) await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM ig_koneksi WHERE id = 1 FOR UPDATE`;
      await tx.igKoneksi.update({ where: { id: 1, akun_id: row.akun_id }, data: { aktif: false, status: 'dicabut', access_token: null, token_berakhir: null, webhook_aktif: false, generasi: { increment: 1 } } });
      await tx.igOauthState.deleteMany({ where: { fasyankes_id: row.fasyankes_id } }); await tx.igMediaPublik.deleteMany({});
    });
    if (row) kabarkanInstagram({ tipe: 'koneksi', fasyankes_id: row.fasyankes_id });
    res.sendStatus(200);
  });
  r.post('/instagram/data-deletion', parser, async (req, res) => {
    const id = bacaSignedRequest(req.body?.signed_request);
    if (!id) return void res.sendStatus(403);
    const code = randomBytes(24).toString('hex');
    const fas = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM ig_koneksi WHERE id = 1 FOR UPDATE`;
      const row = await tx.igKoneksi.findFirst({ where: { penyedia: 'meta', OR: [{ akun_id: id }, { oauth_user_id: id }] } });
      if (row) {
        const daftar = { percakapan: { fasyankes_id: row.fasyankes_id } };
        await tx.igMediaPublik.deleteMany({});
        await tx.igBaca.deleteMany({ where: daftar }); await tx.igPesan.deleteMany({ where: daftar });
        await tx.igPercakapan.deleteMany({ where: { fasyankes_id: row.fasyankes_id } });
        await tx.igMedia.deleteMany({ where: { fasyankes_id: row.fasyankes_id } });
        await tx.igOauthState.deleteMany({ where: { fasyankes_id: row.fasyankes_id } }); await tx.igEvent.deleteMany({});
        // Keep a blank singleton to invalidate in-flight callbacks while removing account identifiers and credentials.
        await tx.igKoneksi.update({ where: { id: 1 }, data: { aktif: false, status: 'terputus', akun_id: '', oauth_user_id: null, username: '', access_token: null, token_berakhir: null, token_diperbarui: null, webhook_aktif: false, generasi: { increment: 1 }, api_key: null, webhook_secret: null, webhook_id: null } });
      }
      await tx.igPenghapusan.create({ data: { kode: code } });
      return row?.fasyankes_id;
    });
    if (fas) kabarkanInstagram({ tipe: 'koneksi', fasyankes_id: fas });
    res.setHeader('Cache-Control', 'no-store');
    res.json({ url: `${new URL(process.env.BASE_URL ?? 'http://localhost').origin}/instagram/data-deletion-status/${code}`, confirmation_code: code });
  });
  r.get('/instagram/data-deletion-status/:code', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const code = String(req.params.code);
    if (!/^[a-f\d]{48}$/.test(code) || !await prisma.igPenghapusan.findUnique({ where: { kode: code } })) return void res.sendStatus(404);
    res.type('text/plain').send('Permintaan penghapusan data integrasi Instagram sudah selesai diproses.');
  });
  return r;
}
