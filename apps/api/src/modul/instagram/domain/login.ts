import * as db from '@klira/db';
import { randomBytes } from 'node:crypto';
import { enkripsiRahasia } from '@klira/db';
import { punyaIzin, type PenggunaSaya } from '@klira/shared';
import type { Request } from 'express';
import { idSesiDariPermintaan } from '../../../middleware/auth';
import type { LayananAkses } from '../../akses/domain/layanan';
import { GalatMeta, konfigurasiMeta, hash, tukarKode, langgananWebhook } from './meta';
import { kabarkanInstagram } from './kanal';
export async function mulaiLogin(user: PenggunaSaya, sesi: string) {
  const config = konfigurasiMeta();
  const state = randomBytes(32).toString('hex');
  await db.transaksi(async (tx) => {
    // Reserve singleton ownership before the browser leaves Klira.
    await db.simpanIgKoneksiUntukMulaiLogin(1, user.fasyankes_id, '', tx);
    await db.kunciIgKoneksi(tx);
    const row = (await db.ambilIgKoneksi(1, tx))!;
    if (row.fasyankes_id !== user.fasyankes_id) throw new GalatMeta('Instagram dikelola fasyankes lain.', 409);
    if (row.penyedia !== 'meta' && await db.hitungIgPercakapanUntukMulaiLogin(tx)) throw new GalatMeta('Riwayat koneksi lama perlu dipindahkan sebelum mengganti penyedia.', 409);
    // A new attempt supersedes any earlier login and any in-flight token refresh.
    const next = await (async () => { (await db.ubahIgKoneksiUntukMulaiLogin(1, tx)); return db.ubahIgKoneksiUntukMulaiLoginHasil(1, tx); })();
    await db.hapusIgOauthStateUntukMulaiLogin(new Date(), user.fasyankes_id, tx);
    await db.tambahIgOauthStateUntukMulaiLogin(hash(state), user.id, user.fasyankes_id, hash(sesi), next.generasi, new Date(Date.now() + 10 * 60000), tx);
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
  const saved = await db.transaksi(async (tx) => {
    const row = await db.ambilIgOauthStateUntukSelesaikanLogin(hash(state), tx);
    if (!row || row.berakhir.getTime() <= Date.now() || row.sesi_hash !== hash(sesi!) || row.pengguna_id !== user.id || row.fasyankes_id !== user.fasyankes_id) return null;
    const used = await db.hapusIgOauthStateUntukSelesaikanLogin(row.hash, tx);
    return used.count === 1 ? row : null;
  });
  if (!saved) return 'state';
  if (typeof req.query.error === 'string') return 'dibatalkan';
  if (typeof req.query.code !== 'string' || req.query.code.length > 4096 || !req.query.code) return 'gagal';
  const profile = await tukarKode(req.query.code);
  const current = await db.ambilIgKoneksi(1);
  if (!current || current.generasi !== saved.generasi || current.fasyankes_id !== user.fasyankes_id) return 'state';
  if (current.penyedia === 'meta' && current.akun_id && current.akun_id !== profile.id) return 'akun-berbeda';
  await langgananWebhook(profile.token);
  // Recheck permission after external network calls and before committing credentials.
  const masih = await akses.saya(sesi);
  if (!masih || masih.id !== user.id || masih.fasyankes_id !== user.fasyankes_id || masih.wajib_ganti_kredensial || !punyaIzin(masih, 'instagram', 'lihat')) return 'izin';
  const changed = await db.ubahIgKoneksiUntukSelesaikanLogin(true, 'terhubung', profile.id, profile.username, null, 'meta', profile.loginId, enkripsiRahasia(profile.token), new Date(Date.now() + profile.masa * 1000), new Date(), 1, user.fasyankes_id, saved.generasi);
  if (!changed.count) return 'state';
  kabarkanInstagram({ tipe: 'koneksi', fasyankes_id: user.fasyankes_id });
  return 'terhubung';
}
