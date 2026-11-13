import { tutupPool } from '../packages/db/src/koneksi.js';
if (process.env.KLIRA_UJI_DB === '1' && process.env.NODE_ENV === 'production') {
  throw new Error('Uji database menolak lingkungan produksi.');
}
afterAll(async () => { await tutupPool(); });
