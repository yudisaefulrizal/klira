/**
 * Nilai `trust proxy` Express dari TRUST_PROXY: jumlah hop proxy di depan aplikasi (mis. `1`), atau daftar alamat, CIDR,
 * atau nama (`loopback`, `linklocal`, `uniquelocal`) dipisah koma. Kosong berarti `loopback`: hanya proxy atau tunnel di host yang sama.
 * Mempercayai semua proxy (`true`) ditolak karena membuat alamat klien bisa dipalsukan lewat X-Forwarded-For.
 */
export function bacaTrustProxy(nilai) {
    const teks = nilai?.trim().toLowerCase();
    if (!teks)
        return 'loopback';
    if (teks === 'true')
        throw new Error('TRUST_PROXY tidak boleh true; sebutkan jumlah hop atau alamat proxy (lihat .env.contoh)');
    if (teks === 'false')
        return false;
    return /^\d+$/.test(teks) ? Number(teks) : teks.split(',').map((bagian) => bagian.trim()).filter(Boolean);
}
export function bacaKonfigurasi(env = process.env) {
    const port = Number(env.PORT);
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error('PORT belum diatur di konfigurasi lingkungan (lihat .env.contoh)');
    }
    const baseUrl = env.BASE_URL?.trim();
    if (!baseUrl) {
        throw new Error('BASE_URL belum diatur di konfigurasi lingkungan (lihat .env.contoh)');
    }
    try {
        new URL(baseUrl);
    }
    catch {
        throw new Error('BASE_URL bukan alamat yang valid');
    }
    return { port, baseUrl, nodeEnv: env.NODE_ENV?.trim() || 'development', trustProxy: bacaTrustProxy(env.TRUST_PROXY) };
}
