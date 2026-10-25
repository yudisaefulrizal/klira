import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const N = 16384;
const PANJANG = 64;

function turunkan(kataSandi: string, garam: Buffer, n: number): Promise<Buffer> {
  return new Promise((selesai, gagal) => {
    scrypt(kataSandi, garam, PANJANG, { N: n }, (galat, kunci) => (galat ? gagal(galat) : selesai(kunci)));
  });
}

/** Hash kata sandi dengan scrypt; format `scrypt$N$garam$hash` (base64). */
export async function hashKataSandi(kataSandi: string): Promise<string> {
  const garam = randomBytes(16);
  const kunci = await turunkan(kataSandi, garam, N);
  return `scrypt$${N}$${garam.toString('base64')}$${kunci.toString('base64')}`;
}

export async function cocokKataSandi(kataSandi: string, hash: string): Promise<boolean> {
  const [skema, n, garam, kunci] = hash.split('$');
  if (skema !== 'scrypt' || !n || !garam || !kunci) return false;
  const diharap = Buffer.from(kunci, 'base64');
  const hasil = await turunkan(kataSandi, Buffer.from(garam, 'base64'), Number(n));
  return hasil.length === diharap.length && timingSafeEqual(hasil, diharap);
}
