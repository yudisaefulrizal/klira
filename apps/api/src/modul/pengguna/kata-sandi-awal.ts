import { randomInt } from 'node:crypto';

// Tanpa huruf dan angka yang mudah tertukar (0/O, 1/l/I) agar mudah disampaikan.
const HURUF = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
const ANGKA = '23456789';
const PANJANG = 12;

const ambil = (set: string) => set[randomInt(set.length)];

/** Kata sandi awal acak (CSPRNG): 12 karakter, selalu memuat huruf dan angka sehingga lolos aturan kata sandi. */
export function buatKataSandiAwal(): string {
  const semua = HURUF + ANGKA;
  const arr = [ambil(HURUF), ambil(ANGKA)];
  while (arr.length < PANJANG) arr.push(ambil(semua));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}
