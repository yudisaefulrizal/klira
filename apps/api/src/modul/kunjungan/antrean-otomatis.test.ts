import type { Prisma } from '@klira/db';
import { mulaiAntreanDalam, selesaiAntreanDalam } from './antrean-otomatis';

const pertama = new Date('2026-10-30T02:00:00Z');
const berikutnya = new Date('2026-10-30T03:00:00Z');
function siapkan(status = 'dipanggil', tahap = 'pemeriksaan') {
  const antrean = { fasyankes_id: 7, kunjungan_id: 11, status, waktu_mulai: null as Date | null, waktu_selesai: null as Date | null };
  const kunjungan = { status: 'arrived' };
  const updateAntrean = jest.fn(async ({ where, data }) => {
    if (where.fasyankes_id !== antrean.fasyankes_id || where.kunjungan_id !== antrean.kunjungan_id || !where.status.in.includes(antrean.status)) return { count: 0 };
    if (where.waktu_mulai === null && antrean.waktu_mulai !== null) return { count: 0 };
    if (where.waktu_selesai === null && antrean.waktu_selesai !== null) return { count: 0 };
    Object.assign(antrean, data);
    return { count: 1 };
  });
  const tx = {
    kunjungan: { updateMany: jest.fn(async ({ where, data }) => {
      if (where.fasyankes_id !== 7 || where.id !== 11 || !where.tahap_layanan.in.includes(tahap) || antrean.status === 'batal') return { count: 0 };
      Object.assign(kunjungan, data);
      return { count: 1 };
    }) },
    antrean: { updateMany: updateAntrean },
  };
  return { tx: tx as unknown as Prisma.TransactionClient, antrean, kunjungan };
}

test.each(['menunggu', 'dipanggil'])('catatan pertama mulai melayani dari %s tanpa perlu tombol manual', async status => {
  const w = siapkan(status, 'menunggu_skrining');
  await mulaiAntreanDalam(w.tx, 7, 11, pertama);
  expect(w.antrean).toMatchObject({ status: 'dilayani', waktu_mulai: pertama });
  expect(w.kunjungan.status).toBe('in_progress');
  await mulaiAntreanDalam(w.tx, 7, 11, berikutnya);
  expect(w.antrean.waktu_mulai).toEqual(pertama);
  await selesaiAntreanDalam(w.tx, 7, 11, berikutnya);
  expect(w.antrean).toMatchObject({ status: 'selesai', waktu_mulai: pertama, waktu_selesai: berikutnya });
  await selesaiAntreanDalam(w.tx, 7, 11, new Date());
  await mulaiAntreanDalam(w.tx, 7, 11, new Date());
  expect(w.antrean).toMatchObject({ status: 'selesai', waktu_mulai: pertama, waktu_selesai: berikutnya });
});
test.each(['batal', 'selesai'])('status terminal %s tidak dibuka ulang atau ditimpa waktunya', async status => {
  const w = siapkan(status);
  await mulaiAntreanDalam(w.tx, 7, 11, pertama);
  await selesaiAntreanDalam(w.tx, 7, 11, berikutnya);
  expect(w.antrean).toMatchObject({ status, waktu_mulai: null, waktu_selesai: null });
});
test.each(['resep', 'kasir', 'ditutup'])('perbaikan catatan di tahap %s tidak memulai antrean', async tahap => {
  const w = siapkan('dipanggil', tahap);
  await mulaiAntreanDalam(w.tx, 7, 11, pertama);
  expect(w.antrean.status).toBe('dipanggil');
  expect(w.antrean.waktu_mulai).toBeNull();
});
test('fasilitas lain tidak dapat mengubah status atau waktu', async () => {
  const w = siapkan();
  await mulaiAntreanDalam(w.tx, 8, 11, pertama);
  await selesaiAntreanDalam(w.tx, 8, 11, berikutnya);
  expect(w.antrean).toMatchObject({ status: 'dipanggil', waktu_mulai: null, waktu_selesai: null });
});
test.each(['menunggu', 'dipanggil', 'dilayani'])('penutupan menyelesaikan antrean lama yang masih %s', async status => {
  const w = siapkan(status);
  await selesaiAntreanDalam(w.tx, 7, 11, berikutnya);
  expect(w.antrean).toMatchObject({ status: 'selesai', waktu_selesai: berikutnya });
});
