/** Opsi cookie sesi bersama; secure bila alamat dasar memakai https (HTTPS diakhiri di tunnel). */
export function opsiCookieSesi(baseUrl) {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: new URL(baseUrl).protocol === 'https:',
        path: '/',
    };
}
