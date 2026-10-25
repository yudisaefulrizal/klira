import { buatLayananPengesahan } from './layanan';
import type { PengesahanTersimpan, RepositoriPengesahan } from './repositori';
import { hashIsi } from './pengesahan';

const T0 = new Date('2026-10-25T00:00:00Z');

function buat(opsi: { terakhir?: Partial<PengesahanTersimpan> | null; jenis?: { id: number; nama: string }[]; sekarang?: Date } = {}) {
  const catatan: { aksi: string; entitas: string }[] = [];
  const diminta: string[] = [];
  const terakhir = opsi.terakhir === null || opsi.terakhir === undefined ? null : ({ versi: 1, pengguna_id: 7, pengguna_nama: 'Dr. A', jenis_akun_id: 2, jenis_akun_nama: 'Dokter', waktu: T0, hash: hashIsi({ v: 1 }), ...opsi.terakhir } as PengesahanTersimpan);
  const repo: RepositoriPengesahan = {
    terakhir: async () => terakhir,
    jenisAkunPemberiHak: async (_f, _p, _fitur, aksi) => {
      diminta.push(aksi);
      return opsi.jenis ?? [{ id: 5, nama: 'Perawat' }, { id: 2, nama: 'Dokter' }];
    },
    riwayatVersi: async () => [],
  };
  const l = buatLayananPengesahan({ repo, audit: { catat: async (e) => void catatan.push(e) }, sekarang: () => opsi.sekarang ?? new Date('2026-10-25T01:00:00Z') });
  return { l, catatan, diminta };
}
const dasar = { fasyankesId: 1, pelakuId: 7, fitur: 'klinis', entitas: 'anamnesis', entitasId: 10 };

describe('pengesahan generik: siapkan', () => {
  it('pengesahan pertama: versi 1, hash isi, satu jenis akun (walau merangkap), tanpa versi catatan', async () => {
    const { l, diminta } = buat();
    const h = await l.siapkan({ ...dasar, isiBaru: { v: 1 }, bacaIsiSekarang: async () => null });
    expect(h).toMatchObject({ ok: true, data: { jenis: 'baru', rencana: { versi: 1, penggunaId: 7, jenisAkun: { id: 2, nama: 'Dokter' }, versiLama: null, hash: hashIsi({ v: 1 }) } } });
    expect(diminta).toEqual(['input']);
  });

  it('isi sama dengan pengesahan terakhir dan isi tersimpan tidak berubah: tidak membuat versi baru', async () => {
    const { l } = buat({ terakhir: {} });
    const h = await l.siapkan({ ...dasar, isiBaru: { v: 1 }, bacaIsiSekarang: async () => ({ v: 1 }) });
    expect(h).toEqual({ ok: true, data: { jenis: 'sama', versi: 1 } });
  });

  it('isi berubah: butuh alasan, lalu menyimpan isi lama sebagai versi catatan tanpa penyetuju', async () => {
    const { l, diminta } = buat({ terakhir: {} });
    const tanpa = await l.siapkan({ ...dasar, isiBaru: { v: 2 }, bacaIsiSekarang: async () => ({ v: 1 }) });
    expect(tanpa).toMatchObject({ ok: false, kode: 'tidak_valid' });
    const h = await l.siapkan({ ...dasar, isiBaru: { v: 2 }, bacaIsiSekarang: async () => ({ v: 1 }), alasan: ' salah ketik ' });
    expect(h).toMatchObject({ ok: true, data: { jenis: 'baru', rencana: { versi: 2, versiLama: { versi: 1, isi_lama: { v: 1 }, alasan: 'salah ketik', disetujui_oleh: null } } } });
    expect(diminta).toEqual(['perbaikan']);
  });

  it('perbaikan oleh pengguna lain atau setelah 2x24 jam ditolak (butuh persetujuan)', async () => {
    const lain = await buat({ terakhir: {} }).l.siapkan({ ...dasar, pelakuId: 8, isiBaru: { v: 2 }, bacaIsiSekarang: async () => ({ v: 1 }), alasan: 'x' });
    expect(lain).toMatchObject({ ok: false, kode: 'konflik' });
    const lama = await buat({ terakhir: {}, sekarang: new Date('2026-10-28T00:00:00Z') }).l.siapkan({ ...dasar, isiBaru: { v: 2 }, bacaIsiSekarang: async () => ({ v: 1 }), alasan: 'x' });
    expect(lama).toMatchObject({ ok: false, kode: 'konflik' });
  });

  it('isi tersimpan sudah berubah dari yang disahkan lalu diserahkan ulang sama dengan hash: tetap versi baru (bukan "sama")', async () => {
    const { l } = buat({ terakhir: {} });
    const h = await l.siapkan({ ...dasar, isiBaru: { v: 1 }, bacaIsiSekarang: async () => ({ v: 'diubah diam-diam' }), alasan: 'pulihkan' });
    expect(h).toMatchObject({ ok: true, data: { jenis: 'baru', rencana: { versi: 2 } } });
  });

  it('tanpa jenis akun pemberi hak (izin tambahan) jenisAkun kosong', async () => {
    const h = await buat({ jenis: [] }).l.siapkan({ ...dasar, isiBaru: { v: 1 }, bacaIsiSekarang: async () => null });
    expect(h).toMatchObject({ ok: true, data: { rencana: { jenisAkun: null } } });
  });
});

describe('pengesahan generik: deteksi perubahan dan verifikasi', () => {
  it('belum disahkan, sah bila hash cocok, berubah bila isi berubah', async () => {
    const belum = buat();
    belum.l.daftarkanPenyedia('anamnesis', async () => ({ v: 1 }));
    expect((await belum.l.keadaan(1, 'anamnesis', 10)).status).toBe('belum_disahkan');

    const ada = buat({ terakhir: {} });
    ada.l.daftarkanPenyedia('anamnesis', async () => ({ v: 1 }));
    expect((await ada.l.keadaan(1, 'anamnesis', 10)).status).toBe('sah');

    const ubah = buat({ terakhir: {} });
    ubah.l.daftarkanPenyedia('anamnesis', async () => ({ v: 'diubah' }));
    expect((await ubah.l.keadaan(1, 'anamnesis', 10)).status).toBe('berubah');
  });

  it('API verifikasi: entitas tak dikenal 404, hasil dicatat lihat dan memuat pengesahan', async () => {
    const { l, catatan } = buat({ terakhir: {} });
    l.daftarkanPenyedia('anamnesis', async () => ({ v: 'diubah' }));
    expect(await l.verifikasi({ id: 3, fasyankes_id: 1 }, 'tak-dikenal', 10)).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
    const h = await l.verifikasi({ id: 3, fasyankes_id: 1 }, 'anamnesis', 10);
    expect(h).toMatchObject({ ok: true, data: { status: 'berubah', versi: 1, pengesahan: { pengguna_nama: 'Dr. A', jenis_akun: 'Dokter' } } });
    expect(catatan).toEqual([{ aksi: 'lihat', entitas: 'pengesahan_catatan', entitas_id: 10, keterangan: 'Verifikasi pengesahan anamnesis', fasyankes_id: 1, pengguna_id: 3, alamat: undefined }]);
  });
});
