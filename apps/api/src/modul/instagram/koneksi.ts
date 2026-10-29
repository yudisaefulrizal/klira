import type { Router, RequestHandler } from 'express';
import { prisma } from '@klira/db';
import type { PenggunaSaya } from '@klira/shared';
import { idSesiDariPermintaan } from '../../middleware/auth';
import { mulaiLogin } from './login';
import { metaTersedia } from './meta';
import { kabarkanInstagram } from './kanal';
export function pasangRuteKoneksi(rute: Router, izin: RequestHandler) {
  rute.get('/instagram/koneksi', izin, async (_req, res) => {
    const row = await prisma.igKoneksi.findUnique({ where: { id: 1 } });
    const milik = row?.fasyankes_id === (res.locals.pengguna as PenggunaSaya).fasyankes_id;
    const tokenValid = !!row?.token_berakhir && row.token_berakhir.getTime() > Date.now();
    const tersedia = !!milik && row.penyedia === 'meta' && row.aktif && tokenValid && row.webhook_aktif;
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: { status: tersedia ? 'terhubung' : 'terputus', nomor: milik ? row.username || null : null, qr: null, tersedia, dikonfigurasi: metaTersedia(), token_berakhir: milik ? row.token_berakhir : null } });
  });
  rute.post('/instagram/login', izin, async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: await mulaiLogin(res.locals.pengguna as PenggunaSaya, idSesiDariPermintaan(req)!) });
  });
  rute.post('/instagram/koneksi', izin, async (req, res) => {
    if (req.body?.aksi !== 'putuskan') return void res.status(400).json({ galat: { pesan: 'Hubungkan Instagram melalui tombol login.' } });
    const user = res.locals.pengguna as PenggunaSaya;
    const row = await prisma.igKoneksi.findUnique({ where: { id: 1 } });
    if (row && row.fasyankes_id !== user.fasyankes_id) return void res.status(409).json({ galat: { pesan: 'Instagram dikelola fasyankes lain.' } });
    if (row) await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM ig_koneksi WHERE id = 1 FOR UPDATE`;
      await tx.igKoneksi.update({ where: { id: 1, fasyankes_id: user.fasyankes_id }, data: { aktif: false, status: 'terputus', access_token: null, token_berakhir: null, webhook_aktif: false, generasi: { increment: 1 } } });
      await tx.igOauthState.deleteMany({ where: { fasyankes_id: user.fasyankes_id } });
      await tx.igMediaPublik.deleteMany({});
    });
    kabarkanInstagram({ tipe: 'koneksi', fasyankes_id: user.fasyankes_id });
    res.json({ data: { ok: true } });
  });
}
