import { prisma, dekripsiRahasia } from '@klira/db';
import { versiGraph } from './meta';
import { kabarkanInstagram } from './kanal';
/** Name first, then username. Missing profile data must never replace an existing name with an ID. */
export function namaProfilInstagram(data: { name?: unknown; username?: unknown }): string | null {
  const nama = typeof data.name === 'string' ? data.name.trim().replace(/\s+/g, ' ') : '';
  const username = typeof data.username === 'string' ? data.username.trim().replace(/^@/, '') : '';
  const valid = /^[A-Za-z0-9._]{1,30}$/.test(username) ? username : '';
  return (nama ? valid ? `${nama} (@${valid})` : nama : valid ? `@${valid}` : '').slice(0, 200) || null;
}
export function fotoProfilInstagram(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 8000) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') && /(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(url.hostname) ? url.href : null;
  } catch { return null; }
}
export async function ambilProfilInstagram(token: string, id: string): Promise<{ nama: string | null; foto: string | null } | null> {
  if (!/^\d{3,32}$/.test(id)) return null;
  try {
    const res = await fetch(`https://graph.instagram.com/${versiGraph()}/${encodeURIComponent(id)}?fields=name,username,profile_pic`, {
      headers: { Authorization: `Bearer ${token}` }, redirect: 'error', signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== 'object' || data.error) return null;
    return { nama: namaProfilInstagram(data), foto: fotoProfilInstagram(data.profile_pic) };
  } catch { return null; }
}
export async function ambilNamaInstagram(token: string, id: string): Promise<string | null> {
  return (await ambilProfilInstagram(token, id))?.nama ?? null;
}
const jeda = new Map<number, number>();
const berjalan = new Map<number, Promise<boolean>>();
/** Best effort: delivery/storage of a DM never waits for the customer's profile API. */
export function perbaruiNamaKontakInstagram(id: number): Promise<boolean> {
  const pending = berjalan.get(id); if (pending) return pending;
  if ((jeda.get(id) ?? 0) > Date.now()) return Promise.resolve(false);
  const promise = perbarui(id).catch(() => false).finally(() => berjalan.delete(id));
  berjalan.set(id, promise); return promise;
}
async function perbarui(id: number) {
  jeda.set(id, Date.now() + 15 * 60000);
  if (jeda.size > 1000) jeda.delete(jeda.keys().next().value!);
  const kontak = await prisma.igPercakapan.findUnique({ where: { id } });
  if (!kontak || (kontak.profil_diperbarui_pada && kontak.profil_diperbarui_pada.getTime() > Date.now() - 24 * 60 * 60000)) return false;
  const koneksi = await prisma.igKoneksi.findUnique({ where: { id: 1 } });
  if (!koneksi?.aktif || koneksi.penyedia !== 'meta' || koneksi.fasyankes_id !== kontak.fasyankes_id || !koneksi.access_token || !koneksi.token_berakhir || koneksi.token_berakhir.getTime() <= Date.now()) return false;
  const profil = await ambilProfilInstagram(dekripsiRahasia(koneksi.access_token), kontak.jid);
  if (!profil) return false;
  const changed = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM ig_koneksi WHERE id = 1 FOR UPDATE`;
    const current = await tx.igKoneksi.findUnique({ where: { id: 1 } });
    // A slow profile lookup cannot restore deleted contacts or update a disconnected account.
    if (!current?.aktif || current.akun_id !== koneksi.akun_id || current.generasi !== koneksi.generasi) return false;
    const result = await tx.igPercakapan.updateMany({ where: { id, fasyankes_id: kontak.fasyankes_id, jid: kontak.jid, nama: kontak.nama }, data: { ...(profil.nama && kontak.nama === kontak.jid ? { nama: profil.nama } : {}), foto_profil: profil.foto, profil_diperbarui_pada: new Date() } });
    return result.count > 0;
  });
  if (changed) kabarkanInstagram({ tipe: 'percakapan', fasyankes_id: kontak.fasyankes_id });
  return changed;
}
