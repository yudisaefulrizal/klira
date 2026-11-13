import * as db from '@klira/db';
import { kunciPercakapanInstagram, pangkasPesanInstagram } from '@klira/db';
/** Network requests time out at 20s; after 2min an interrupted send is uncertain and must never be retried automatically. */
export async function pulihkanPengirimanInstagram() {
  const batas = new Date(Date.now() - 120000);
  const rows = await db.daftarIgPesanUntukPulihkanPengirimanInstagram('keluar', 'mengirim', batas, 100);
  for (const row of rows) await db.transaksi(async (tx) => {
    await kunciPercakapanInstagram(tx, row.percakapan_id);
    await db.ubahIgPesanUntukPulihkanPengirimanInstagram('belum pasti', row.id, 'mengirim', batas, tx);
    await pangkasPesanInstagram(tx, row.percakapan_id);
  });
}
