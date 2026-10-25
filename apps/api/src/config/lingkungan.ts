export interface Konfigurasi {
  port: number;
  baseUrl: string;
  nodeEnv: string;
}

export function bacaKonfigurasi(env: NodeJS.ProcessEnv = process.env): Konfigurasi {
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
  } catch {
    throw new Error('BASE_URL bukan alamat yang valid');
  }
  return { port, baseUrl, nodeEnv: env.NODE_ENV?.trim() || 'development' };
}
