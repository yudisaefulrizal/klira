import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/** Hash SHA-256 (base64) dari setiap skrip inline di HTML, supaya hanya skrip itu yang boleh jalan tanpa 'unsafe-inline'. */
export function hashSkripInline(html) {
    const hasil = [];
    for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
        if (m[1].trim()) hasil.push(`'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
    }
    return hasil;
}

/** Hash skrip inline di index.html; kosong bila berkas tidak terbaca (uji dengan direktori web palsu). */
export function bacaHashIndex(direktoriWeb) {
    try {
        return hashSkripInline(readFileSync(path.join(direktoriWeb, 'index.html'), 'utf8'));
    } catch {
        return [];
    }
}

/**
 * Kebijakan CSP untuk halaman aplikasi. Sumber luar yang sah hanya Google Fonts (gaya dan font) dan Google Maps (iframe peta
 * situs klinik); logo klinik boleh dari alamat https lain. WebSocket menyambung ke asal yang sama.
 */
export function susunCsp({ host, hashSkrip = [] }) {
    const asalWs = host ? ` ws://${host} wss://${host}` : '';
    return [
        "default-src 'self'",
        `script-src 'self' ${hashSkrip.join(' ')}`.trim(),
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        "media-src 'self' blob: data:",
        `connect-src 'self'${asalWs}`,
        'frame-src https://www.google.com https://maps.google.com',
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'",
    ].join('; ');
}

/**
 * Pasang CSP pada semua respons. Bawaan menegakkan; KLIRA_CSP_TEGAKKAN=0 mengubahnya menjadi hanya melapor
 * (Content-Security-Policy-Report-Only: pelanggaran muncul di konsol browser tanpa memblokir apa pun), berguna untuk
 * menyelidiki halaman yang rusak.
 */
export function pasangCsp({ direktoriWeb, tegakkan = process.env.KLIRA_CSP_TEGAKKAN !== '0' }) {
    const hashSkrip = bacaHashIndex(direktoriWeb);
    const nama = tegakkan ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';
    return (req, res, next) => {
        res.setHeader(nama, susunCsp({ host: req.headers.host, hashSkrip }));
        next();
    };
}
