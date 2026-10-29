import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// AES-256-GCM. Kunci 32 byte (base64) dari lingkungan KUNCI_ENKRIPSI; tidak ada kunci di kode.
function ambilKunci(kunciBase64: string | undefined = process.env.KUNCI_ENKRIPSI): Buffer {
  if (!kunciBase64) throw new Error('KUNCI_ENKRIPSI belum diatur');
  const kunci = Buffer.from(kunciBase64, 'base64');
  if (kunci.length !== 32) throw new Error('KUNCI_ENKRIPSI harus 32 byte (base64)');
  return kunci;
}

/** Hasil: v1:<iv>:<tag>:<data>, semuanya base64. */
export function enkripsiRahasia(teks: string, kunci?: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', ambilKunci(kunci), iv);
  const data = Buffer.concat([cipher.update(teks, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join(':');
}

export function dekripsiRahasia(terenkripsi: string, kunci?: string): string {
  const [versi, iv, tag, data] = terenkripsi.split(':');
  if (versi !== 'v1' || !iv || !tag || data === undefined) throw new Error('Format rahasia terenkripsi tidak dikenal');
  const decipher = createDecipheriv('aes-256-gcm', ambilKunci(kunci), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
}
