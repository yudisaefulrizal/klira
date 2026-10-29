import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
export class GalatMeta extends Error {
  constructor(pesan: string, public status = 502, public pastiDitolak = false, public dicabut = false) { super(pesan); }
}
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export const idPesan = (akun: string, mid: string) => hash(`${akun}:${mid}`);
export function konfigurasiMeta() {
  const id = process.env.INSTAGRAM_APP_ID;
  const secret = process.env.INSTAGRAM_APP_SECRET;
  const origin = new URL(process.env.BASE_URL ?? 'http://localhost').origin;
  if (!id || !secret || !process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || !origin.startsWith('https://'))
    throw new GalatMeta('Koneksi Instagram belum dikonfigurasi di server.', 503);
  return { id, secret, origin, redirect: `${origin}/auth/instagram/callback` };
}
export const metaTersedia = () => { try { konfigurasiMeta(); return true; } catch { return false; } };
export const versiGraph = () => {
  const versi = process.env.INSTAGRAM_GRAPH_VERSION ?? 'v23.0';
  if (!/^v\d+\.0$/.test(versi)) throw new GalatMeta('Versi Instagram Graph API tidak valid.', 503);
  return versi;
};
const graph = () => `https://graph.instagram.com/${versiGraph()}`;
export async function mintaMeta<T>(url: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try { response = await fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(15000) }); }
  catch { throw new GalatMeta('Meta tidak dapat dihubungi. Coba lagi sebentar lagi.'); }
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.error) {
    const kode = data?.error?.code;
    throw new GalatMeta(kode === 190 ? 'Izin Instagram berakhir atau dicabut. Hubungkan ulang akun.' : 'Instagram menolak permintaan. Periksa izin akun dan batas waktu balasan.', 502, response.status >= 400 && response.status < 500, kode === 190);
  }
  if (!data || typeof data !== 'object') throw new GalatMeta('Respons Instagram belum terkonfirmasi.');
  return data as T;
}
export async function tukarKode(code: string) {
  const { id, secret, redirect } = konfigurasiMeta();
  const short = await mintaMeta<{ access_token?: string; user_id?: string }>('https://api.instagram.com/oauth/access_token', {
    method: 'POST', body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: 'authorization_code', redirect_uri: redirect, code: code.replace(/#_$/, '') }),
  });
  if (!short.access_token) throw new GalatMeta('Token Instagram tidak tersedia.');
  const token = await mintaMeta<{ access_token?: string; expires_in?: number }>(`https://graph.instagram.com/access_token?${new URLSearchParams({ grant_type: 'ig_exchange_token', client_secret: secret, access_token: short.access_token })}`);
  if (!token.access_token || !Number.isFinite(token.expires_in) || token.expires_in! <= 0) throw new GalatMeta('Masa berlaku token Instagram tidak tersedia.');
  const profile = await mintaMeta<{ user_id?: string; username?: string; account_type?: string }>(`${graph()}/me?fields=user_id,username,account_type`, { headers: { Authorization: `Bearer ${token.access_token}` } });
  if (!/^\d{3,32}$/.test(profile.user_id ?? '') || !profile.username) throw new GalatMeta('Profil Instagram tidak terbaca.');
  return { loginId: short.user_id ? String(short.user_id) : profile.user_id!, token: token.access_token, masa: token.expires_in!, id: profile.user_id!, username: profile.username.slice(0, 100) };
}
export async function langgananWebhook(token: string) {
  const data = await mintaMeta<{ success?: boolean }>(`${graph()}/me/subscribed_apps`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ subscribed_fields: 'messages' }) });
  if (data.success !== true) throw new GalatMeta('Langganan pesan Instagram belum terkonfirmasi.');
}
export async function perpanjangToken(token: string) {
  const data = await mintaMeta<{ access_token?: string; expires_in?: number }>(`https://graph.instagram.com/refresh_access_token?${new URLSearchParams({ grant_type: 'ig_refresh_token', access_token: token })}`);
  if (!data.access_token || !Number.isFinite(data.expires_in) || data.expires_in! <= 0) throw new GalatMeta('Perpanjangan token belum terkonfirmasi.');
  return { token: data.access_token, masa: data.expires_in! };
}
export function tandaTanganSah(raw: Buffer, signature: unknown) {
  const secret = process.env.INSTAGRAM_APP_SECRET;
  if (!secret || typeof signature !== 'string' || !/^sha256=[a-f\d]{64}$/i.test(signature)) return false;
  return timingSafeEqual(createHmac('sha256', secret).update(raw).digest(), Buffer.from(signature.slice(7), 'hex'));
}
export function bacaSignedRequest(value: unknown) {
  if (typeof value !== 'string' || value.length > 16000 || !process.env.INSTAGRAM_APP_SECRET) return null;
  const parts = value.split('.'); if (parts.length !== 2) return null;
  try {
    const signature = Buffer.from(parts[0], 'base64url');
    const expected = createHmac('sha256', process.env.INSTAGRAM_APP_SECRET).update(parts[1]).digest();
    if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return null;
    const data = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return data.algorithm === 'HMAC-SHA256' && /^\d{3,32}$/.test(data.user_id) ? String(data.user_id) : null;
  } catch { return null; }
}
export async function kirimMeta(token: string, accountId: string, recipient: string, text: string, gambarUrl?: string) {
  const message = gambarUrl ? { attachment: { type: 'image', payload: { url: gambarUrl } } } : { text };
  const data = await mintaMeta<{ message_id?: string }>(`${graph()}/${encodeURIComponent(accountId)}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient: { id: recipient }, message }) });
  if (!data.message_id) throw new GalatMeta('Pengiriman Instagram belum terkonfirmasi.');
  return data.message_id;
}
