import { putuskanDanBersihkan } from '../pesan/bersihkan';
import { alamatDari } from '../../middleware/audit';
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
    res.json({ data: { status: tersedia ? 'terhubung' : 'terputus', nomor: tersedia ? row.username || null : null, qr: null, tersedia, dikonfigurasi: metaTersedia(), token_berakhir: tersedia ? row.token_berakhir : null } });
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
    await putuskanDanBersihkan('instagram', user, alamatDari(req));
    kabarkanInstagram({ tipe: 'dibersihkan', fasyankes_id: user.fasyankes_id });
    kabarkanInstagram({ tipe: 'koneksi', fasyankes_id: user.fasyankes_id });
    res.json({ data: { ok: true } });
  });
}
