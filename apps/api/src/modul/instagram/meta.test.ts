import { createHmac } from 'node:crypto';
import { hash, idPesan, tandaTanganSah, bacaSignedRequest, kirimMeta, langgananWebhook, tukarKode, perpanjangToken } from './meta';
import { bacaPesanInstagram, unduhGambarInstagram } from './webhook';
const asli = global.fetch;
const env = { ...process.env };
beforeEach(() => { process.env.INSTAGRAM_APP_SECRET = 'secret-uji'; process.env.INSTAGRAM_APP_ID = '123'; process.env.BASE_URL = 'https://klira.test'; process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN = 'verify-uji'; });
afterEach(() => { global.fetch = asli; process.env = { ...env }; });
it('memeriksa HMAC Meta atas body mentah dan menolak pemalsuan', () => {
  const raw = Buffer.from('{"object":"instagram"}'); const sig = 'sha256=' + createHmac('sha256', 'secret-uji').update(raw).digest('hex');
  expect(tandaTanganSah(raw, sig)).toBe(true); expect(tandaTanganSah(Buffer.from('{}'), sig)).toBe(false);
  expect(tandaTanganSah(raw, sig.slice(7))).toBe(false); expect(tandaTanganSah(raw, undefined)).toBe(false);
});
it('memverifikasi signed_request untuk pencabutan izin dan penghapusan', () => {
  const payload = Buffer.from(JSON.stringify({ algorithm: 'HMAC-SHA256', user_id: '123456789' })).toString('base64url');
  const sig = createHmac('sha256', 'secret-uji').update(payload).digest('base64url');
  expect(bacaSignedRequest(`${sig}.${payload}`)).toBe('123456789'); expect(bacaSignedRequest(`wrong.${payload}`)).toBeNull();
});
it('memisahkan ID pesan antar akun dan mendukung echo aplikasi Instagram', () => {
  expect(idPesan('a', 'mid')).not.toBe(idPesan('b', 'mid')); expect(hash('x')).toHaveLength(64);
  const event = { sender: { id: '111111' }, recipient: { id: '222222' }, message: { mid: 'mid', text: 'Halo' } };
  expect(bacaPesanInstagram(event, '222222')).toMatchObject({ jid: '111111', arah: 'masuk' });
  expect(bacaPesanInstagram({ ...event, message: { ...event.message, is_echo: true } }, '111111')).toMatchObject({ jid: '222222', arah: 'keluar' });
  expect(bacaPesanInstagram(event, '333333')).toBeNull();
});
it('menolak URL media non-Meta tanpa melakukan request', async () => {
  global.fetch = jest.fn();
  for (const url of ['https://127.0.0.1/x', 'http://fbcdn.net/x', 'https://fbcdn.net.evil.test/x', 'https://fbcdn.net:8443/x']) await expect(unduhGambarInstagram(url)).rejects.toThrow();
  expect(global.fetch).not.toHaveBeenCalled();
});
it('menukar kode, token panjang, membaca profil, berlangganan pesan dan memperpanjang token', async () => {
  const ambil = jest.fn().mockResolvedValueOnce(Response.json({ access_token: 'short' }))
    .mockResolvedValueOnce(Response.json({ access_token: 'long', expires_in: 5184000 }))
    .mockResolvedValueOnce(Response.json({ user_id: '123456789', username: 'klinik', account_type: 'BUSINESS' }))
    .mockResolvedValueOnce(Response.json({ success: true }))
    .mockResolvedValueOnce(Response.json({ access_token: 'refreshed', expires_in: 5184000 }));
  global.fetch = ambil;
  expect(await tukarKode('kode')).toMatchObject({ id: '123456789', username: 'klinik', token: 'long' });
  await langgananWebhook('long'); expect(ambil.mock.calls[3][0]).toContain('/me/subscribed_apps');
  expect(await perpanjangToken('long')).toMatchObject({ token: 'refreshed' });
});
it('mengirim teks/gambar melalui Graph API tanpa retry pada timeout', async () => {
  const ambil = jest.fn().mockImplementation(async () => Response.json({ message_id: 'mid' })); global.fetch = ambil;
  expect(await kirimMeta('token-uji', '123', '456', 'Halo')).toBe('mid');
  expect(JSON.parse(ambil.mock.calls[0][1].body)).toEqual({ recipient: { id: '456' }, message: { text: 'Halo' } });
  await kirimMeta('token-uji', '123', '456', '', 'https://klira.test/instagram/media/random');
  expect(JSON.parse(ambil.mock.calls[1][1].body).message.attachment.type).toBe('image');
  ambil.mockClear().mockRejectedValue(new Error('timeout'));
  await expect(kirimMeta('token-uji', '123', '456', 'Halo')).rejects.toMatchObject({ pastiDitolak: false }); expect(ambil).toHaveBeenCalledTimes(1);
});
it('membedakan penolakan pasti dari hasil pengiriman belum terkonfirmasi', async () => {
  global.fetch = jest.fn().mockResolvedValue(Response.json({ error: { code: 190 } }, { status: 400 }));
  await expect(kirimMeta('token-uji', '123', '456', 'Halo')).rejects.toMatchObject({ pastiDitolak: true, dicabut: true });
});
