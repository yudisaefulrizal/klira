import mysql, { type PoolOptions, type ResultSetHeader, type RowDataPacket } from 'mysql2';
import type { PoolConnection } from 'mysql2/promise';

/** Seluruh waktu DATE/DATETIME ditafsirkan sebagai UTC, termasuk koneksi yang dibuat ulang. */
export function konfigurasiPool(env: NodeJS.ProcessEnv = process.env): PoolOptions {
  const url = env.DATABASE_URL ? new URL(env.DATABASE_URL) : null;
  if (url && url.protocol !== 'mysql:') throw new Error('DATABASE_URL harus memakai mysql://.');
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
  koneksi.query("SET time_zone = '+00:00'", galat => { if (galat) koneksi.destroy(); });
  koneksi.query('SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ', galat => { if (galat) koneksi.destroy(); });
});
export type Koneksi = Pick<PoolConnection, 'query' | 'execute'>;
let penutupan: Promise<void> | undefined;
export const tutupPool = () => penutupan ??= pool.end();

export async function baca<T>(sql: string, nilai: readonly unknown[] = [], koneksi: Koneksi = pool): Promise<T[]> {
  const [baris] = await koneksi.query<RowDataPacket[]>(sql, [...nilai]);
  return baris as T[];
}

export async function tulis(sql: string, nilai: readonly unknown[] = [], koneksi: Koneksi = pool): Promise<ResultSetHeader> {
  const [hasil] = await koneksi.query<ResultSetHeader>(sql, [...nilai]);
  return hasil;
}

/** Semua operasi callback harus memakai koneksi yang diberikan. */
export async function transaksi<T>(jalankan: (koneksi: Koneksi) => Promise<T>): Promise<T> {
  const koneksi = await pool.getConnection();
  try {
    await koneksi.beginTransaction();
    const hasil = await jalankan(koneksi);
    await koneksi.commit();
    return hasil;
  } catch (galat) {
    try { await koneksi.rollback(); } catch { koneksi.destroy(); }
    throw galat;
  } finally {
    koneksi.release();
  }
}

export function kodeGalat(galat: unknown): string | undefined {
  return typeof galat === 'object' && galat !== null && 'code' in galat ? String(galat.code) : undefined;
}
export const bentrokUnik = (galat: unknown): boolean => kodeGalat(galat) === 'ER_DUP_ENTRY';
export const transaksiBisaDiulang = (galat: unknown): boolean => ['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(kodeGalat(galat) ?? '');

export function pesanGalat(galat: unknown): string { return galat instanceof Error ? galat.message : ''; }
