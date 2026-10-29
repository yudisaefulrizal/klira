import { randomBytes } from 'node:crypto';
import { prisma, enkripsiRahasia } from '@klira/db';
import { punyaIzin, type PenggunaSaya } from '@klira/shared';
import type { Request } from 'express';
import { idSesiDariPermintaan } from '../../middleware/auth';
import type { LayananAkses } from '../akses/layanan';
import { GalatMeta, konfigurasiMeta, hash, tukarKode, langgananWebhook } from './meta';
import { kabarkanInstagram } from './kanal';
export async function mulaiLogin(user: PenggunaSaya, sesi: string) {
  const config = konfigurasiMeta();
  const state = randomBytes(32).toString('hex');
  await prisma.$transaction(async (tx) => {
    // Reserve singleton ownership before the browser leaves Klira.
    await tx.igKoneksi.upsert({ where: { id: 1 }, create: { id: 1, fasyankes_id: user.fasyankes_id, akun_id: '', username: '' }, update: {} });
    await tx.$queryRaw`SELECT id FROM ig_koneksi WHERE id = 1 FOR UPDATE`;
    const row = (await tx.igKoneksi.findUnique({ where: { id: 1 } }))!;
    if (row.fasyankes_id !== user.fasyankes_id) throw new GalatMeta('Instagram dikelola fasyankes lain.', 409);
    if (row.penyedia !== 'meta' && await tx.igPercakapan.count()) throw new GalatMeta('Riwayat koneksi lama perlu dipindahkan sebelum mengganti penyedia.', 409);
    // A new attempt supersedes any earlier login and any in-flight token refresh.
    const next = await tx.igKoneksi.update({ where: { id: 1 }, data: { generasi: { increment: 1 } } });
    await tx.igOauthState.deleteMany({ where: { OR: [{ berakhir: { lt: new Date() } }, { fasyankes_id: user.fasyankes_id }] } });
    await tx.igOauthState.create({ data: { hash: hash(state), pengguna_id: user.id, fasyankes_id: user.fasyankes_id, sesi_hash: hash(sesi), generasi: next.generasi, berakhir: new Date(Date.now() + 10 * 60000) } });
  });
  const url = new URL('https://www.instagram.com/oauth/authorize');
  url.search = new URLSearchParams({ client_id: config.id, redirect_uri: config.redirect, response_type: 'code', scope: 'instagram_business_basic,instagram_business_manage_messages', state }).toString();
  return { url: url.toString() };
}
export async function selesaikanLogin(req: Request, akses: LayananAkses) {
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  if (!/^[a-f\d]{64}$/.test(state)) return 'state';
  const sesi = idSesiDariPermintaan(req);
  const user = sesi ? await akses.saya(sesi) : null;
  if (!user || user.wajib_ganti_kredensial || !punyaIzin(user, 'instagram', 'lihat')) return 'izin';
  const saved = await prisma.$transaction(async (tx) => {
    const row = await tx.igOauthState.findUnique({ where: { hash: hash(state) } });
    if (!row || row.berakhir.getTime() <= Date.now() || row.sesi_hash !== hash(sesi!) || row.pengguna_id !== user.id || row.fasyankes_id !== user.fasyankes_id) return null;
    const used = await tx.igOauthState.deleteMany({ where: { hash: row.hash } });
    return used.count === 1 ? row : null;
  });
  if (!saved) return 'state';
  if (typeof req.query.error === 'string') return 'dibatalkan';
  if (typeof req.query.code !== 'string' || req.query.code.length > 4096 || !req.query.code) return 'gagal';
  const profile = await tukarKode(req.query.code);
  const current = await prisma.igKoneksi.findUnique({ where: { id: 1 } });
  if (!current || current.generasi !== saved.generasi || current.fasyankes_id !== user.fasyankes_id) return 'state';
  if (current.penyedia === 'meta' && current.akun_id && current.akun_id !== profile.id) return 'akun-berbeda';
  await langgananWebhook(profile.token);
  // Recheck permission after external network calls and before committing credentials.
  const masih = await akses.saya(sesi);
  if (!masih || masih.id !== user.id || masih.fasyankes_id !== user.fasyankes_id || masih.wajib_ganti_kredensial || !punyaIzin(masih, 'instagram', 'lihat')) return 'izin';
  const changed = await prisma.igKoneksi.updateMany({ where: { id: 1, fasyankes_id: user.fasyankes_id, generasi: saved.generasi }, data: {
    penyedia: 'meta', akun_id: profile.id, oauth_user_id: profile.loginId, username: profile.username, access_token: enkripsiRahasia(profile.token), token_berakhir: new Date(Date.now() + profile.masa * 1000), token_diperbarui: new Date(), aktif: true, status: 'terhubung', webhook_aktif: true,
    api_key: null, webhook_id: null, webhook_secret: null,
  } });
  if (!changed.count) return 'state';
  kabarkanInstagram({ tipe: 'koneksi', fasyankes_id: user.fasyankes_id });
  return 'terhubung';
}
