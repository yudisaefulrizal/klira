import { createDecipheriv, createHash, createHmac } from 'node:crypto';
import LZString from './lz-string.js';

/** X-Signature = base64(HMAC-SHA256(kunci = secret_key, data = "{cons_id}&{timestamp}")). */
export const buatSignature = (consId, timestamp, secretKey) => createHmac('sha256', secretKey).update(`${consId}&${timestamp}`).digest('base64');

/** X-Authorization = "Basic " + base64("username:password:app_code"). */
export const buatAuthorization = (username, password, appCode) => `Basic ${Buffer.from(`${username}:${password}:${appCode}`).toString('base64')}`;

/**
 * Isi `response` PCare yang berupa string: base64, AES-256-CBC (kunci = SHA-256 dari cons_id + secret_key + timestamp,
 * iv = 16 byte pertama kunci), lalu dekompresi LZString. Mengembalikan objek JSON.
 */
export function dekripsiRespons(teks, consId, secretKey, timestamp) {
    const kunci = createHash('sha256').update(`${consId}${secretKey}${timestamp}`).digest();
    const sandi = createDecipheriv('aes-256-cbc', kunci, kunci.subarray(0, 16));
    const terkompres = Buffer.concat([sandi.update(Buffer.from(teks, 'base64')), sandi.final()]).toString('utf8');
    return JSON.parse(LZString.decompressFromEncodedURIComponent(terkompres));
}
