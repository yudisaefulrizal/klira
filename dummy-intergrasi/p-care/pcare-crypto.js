// Kripto PCare, mengikuti bridging-bpjs (src/PCare/PcareService.php).
import { createCipheriv, createDecipheriv, createHash, createHmac } from 'node:crypto';
import LZString from '../lib/lz-string.js';

/** X-Signature = base64(HMAC-SHA256(key=secret, data="{consId}&{timestamp}")). */
export function buatSignature(consId, timestamp, secret) {
  return createHmac('sha256', secret).update(`${consId}&${timestamp}`).digest('base64');
}

/** Header otorisasi: "Basic " + base64("username:password:appCode"). */
export function buatAuthorization(username, password, appCode) {
  return `Basic ${Buffer.from(`${username}:${password}:${appCode}`).toString('base64')}`;
}

function kunciDanIv(consId, secret, timestamp) {
  const kunci = createHash('sha256').update(`${consId}${secret}${timestamp}`).digest();
  return { kunci, iv: kunci.subarray(0, 16) };
}

/** Isi `response`: JSON, dikompres LZString (EncodedURIComponent), AES-256-CBC, base64. */
export function enkripsiRespons(objek, consId, secret, timestamp) {
  const { kunci, iv } = kunciDanIv(consId, secret, timestamp);
  const terkompres = LZString.compressToEncodedURIComponent(JSON.stringify(objek));
  const sandi = createCipheriv('aes-256-cbc', kunci, iv);
  return Buffer.concat([sandi.update(terkompres, 'utf8'), sandi.final()]).toString('base64');
}

/** Kebalikan enkripsiRespons; dipakai uji dan klien contoh. */
export function dekripsiRespons(teks, consId, secret, timestamp) {
  const { kunci, iv } = kunciDanIv(consId, secret, timestamp);
  const sandi = createDecipheriv('aes-256-cbc', kunci, iv);
  const terkompres = Buffer.concat([sandi.update(Buffer.from(teks, 'base64')), sandi.final()]).toString('utf8');
  return JSON.parse(LZString.decompressFromEncodedURIComponent(terkompres));
}
