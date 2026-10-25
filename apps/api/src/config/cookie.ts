import type { CookieOptions } from 'express';

/** Opsi cookie sesi bersama; secure bila alamat dasar memakai https (HTTPS diakhiri di tunnel). */
export function opsiCookieSesi(baseUrl: string): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: new URL(baseUrl).protocol === 'https:',
    path: '/',
  };
}
