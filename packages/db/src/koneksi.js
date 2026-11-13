import mysql from 'mysql2';
/** Seluruh waktu DATE/DATETIME ditafsirkan sebagai UTC, termasuk koneksi yang dibuat ulang. */
export function konfigurasiPool(env = process.env) {
    const url = env.DATABASE_URL ? new URL(env.DATABASE_URL) : null;
    if (url && url.protocol !== 'mysql:')
        throw new Error('DATABASE_URL harus memakai mysql://.');
    return {
        host: url?.hostname || env.DB_HOST || '127.0.0.1',
        port: Number(url?.port || env.DB_PORT || 3306),
        user: url ? decodeURIComponent(url.username) : env.DB_USER,
        password: url ? decodeURIComponent(url.password) : env.DB_PASSWORD,
        database: url ? decodeURIComponent(url.pathname.slice(1)) : env.DB_NAME,
        charset: 'utf8mb4',
        timezone: 'Z',
        connectionLimit: 10,
        multipleStatements: false,
        supportBigNumbers: true,
        bigNumberStrings: true,
        typeCast(field, next) {
            if (field.type === 'TINY' && field.length === 1) {
                const nilai = field.string();
                return nilai === null ? null : nilai === '1';
            }
            return next();
        },
    };
}
const poolDasar = mysql.createPool(konfigurasiPool());
export const pool = poolDasar.promise();
// Perintah ini masuk antrean sebelum koneksi dipinjam oleh pemanggil pertama.
poolDasar.on('connection', koneksi => {
    koneksi.query("SET time_zone = '+00:00'", galat => { if (galat)
        koneksi.destroy(); });
    koneksi.query('SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ', galat => { if (galat)
        koneksi.destroy(); });
});
let penutupan;
export const tutupPool = () => penutupan ??= pool.end();
export async function baca(sql, nilai = [], koneksi = pool) {
    const [baris] = await koneksi.query(sql, [...nilai]);
    return baris;
}
export async function tulis(sql, nilai = [], koneksi = pool) {
    const [hasil] = await koneksi.query(sql, [...nilai]);
    return hasil;
}
/** Semua operasi callback harus memakai koneksi yang diberikan. */
export async function transaksi(jalankan) {
    const koneksi = await pool.getConnection();
    try {
        await koneksi.beginTransaction();
        const hasil = await jalankan(koneksi);
        await koneksi.commit();
        return hasil;
    }
    catch (galat) {
        try {
            await koneksi.rollback();
        }
        catch {
            koneksi.destroy();
        }
        throw galat;
    }
    finally {
        koneksi.release();
    }
}
export function kodeGalat(galat) {
    return typeof galat === 'object' && galat !== null && 'code' in galat ? String(galat.code) : undefined;
}
export const bentrokUnik = (galat) => kodeGalat(galat) === 'ER_DUP_ENTRY';
export const transaksiBisaDiulang = (galat) => ['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(kodeGalat(galat) ?? '');
export function pesanGalat(galat) { return galat instanceof Error ? galat.message : ''; }
