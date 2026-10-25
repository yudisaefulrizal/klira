import type { BagianKlinis, KunjunganDto, TahapLayanan } from '@klira/shared';
import { hashIsi } from '../rekam-medis/pengesahan';
import { buatLayananPengesahan } from '../rekam-medis/layanan';
import type { PengesahanTersimpan, RepositoriPengesahan, TulisPengesahan } from '../rekam-medis/repositori';
import { buatLayananKlinis } from './layanan';
import { BentrokVersiError } from './repositori';
import type { RepositoriKlinis } from './repositori';

/** Repositori tiruan di memori: isi dan pengesahan per bagian, mengikuti kontrak repositori sebenarnya. */
function buatDunia(tahapAwal: TahapLayanan = 'pemeriksaan') {
  const isi = new Map<string, unknown>();
  const pengesahanTersimpan = new Map<string, PengesahanTersimpan>();
  const versiCatatan: unknown[] = [];
  const draf = new Map<string, { langkah: number; isi: Record<string, unknown>; diperbarui_pada: Date }>();
  const catatan: { aksi: string; entitas: string }[] = [];
  const dunia = { tahap: tahapAwal, bentrok: false, waktu: new Date('2026-10-25T01:00:00Z'), ubahTahap: [] as TahapLayanan[] };
  const kunjunganDto = (id: number) => ({ id, pasien_id: id === 99 ? 2 : 1, tahap_layanan: dunia.tahap }) as unknown as KunjunganDto;

  const repoPengesahan: RepositoriPengesahan = {
    terakhir: async (_f, e, id) => pengesahanTersimpan.get(`${e}:${id}`) ?? null,
    jenisAkunPemberiHak: async () => [{ id: 2, nama: 'Dokter/DPJP' }],
    riwayatVersi: async () => [],
  };
  const pengesahan = buatLayananPengesahan({ repo: repoPengesahan, audit: { catat: async () => undefined }, sekarang: () => new Date('2026-10-25T01:00:00Z') });
  const repo = {
    kunjungan: async (f: number, id: number) => (f === 1 && [10, 11, 99].includes(id) ? { id, pasien_id: id === 99 ? 2 : 1, tahap_layanan: dunia.tahap } : null),
    kunjunganDto: async (f: number, id: number) => (f === 1 ? kunjunganDto(id) : null),
    penggunaAda: async (f: number, id: number) => f === 1 && id === 7,
    bacaBagian: async (_f: number, id: number, b: BagianKlinis) => isi.get(`${b}:${id}`) ?? (b === 'diagnosis' || b === 'tindakan' ? { item: [] } : null),
    simpanBagian: jest.fn(async (d: { kunjunganId: number; bagian: BagianKlinis; isi: unknown; pengesahan: TulisPengesahan }) => {
      if (dunia.bentrok) throw new BentrokVersiError();
      isi.set(`${d.bagian}:${d.kunjunganId}`, d.isi);
      if (d.pengesahan.versiLama) versiCatatan.push(d.pengesahan.versiLama);
      pengesahanTersimpan.set(`${d.bagian}:${d.kunjunganId}`, {
        versi: d.pengesahan.versi, pengguna_id: d.pengesahan.penggunaId, pengguna_nama: 'Dr. A', jenis_akun_id: d.pengesahan.jenisAkun?.id ?? null,
        jenis_akun_nama: d.pengesahan.jenisAkun?.nama ?? null, waktu: d.pengesahan.waktu, hash: d.pengesahan.hash,
      });
    }),
    bacaDraf: async (_f: number, p: number, alur: string, id: number) => draf.get(`${p}:${alur}:${id}`) ?? null,
    simpanDraf: jest.fn(async (d: { penggunaId: number; alur: string; kunjunganId: number; langkah: number; isi: Record<string, unknown>; sekarang: Date }) => {
      const t = { langkah: d.langkah, isi: d.isi, diperbarui_pada: d.sekarang };
      draf.set(`${d.penggunaId}:${d.alur}:${d.kunjunganId}`, t);
      return t;
    }),
    hapusDraf: jest.fn(async (_f: number, id: number, p?: number, alur?: string) => {
      let n = 0;
      for (const k of [...draf.keys()]) {
        const [kp, ka, ki] = k.split(':');
        if (Number(ki) === id && (p === undefined || Number(kp) === p) && (!alur || ka === alur)) { draf.delete(k); n += 1; }
      }
      return n;
    }),
    salinan: async (_f: number, id: number) => ({ sumber: { id, mulai: 'x' }, anamnesis: null, diagnosis: null, tindakan: null }),
  } as unknown as RepositoriKlinis;
  const l = buatLayananKlinis({
    repo, pengesahan, sekarang: () => dunia.waktu, audit: { catat: async (e) => void catatan.push(e) },
    kunjungan: { ubahTahap: async (_p, _id, ke) => { dunia.tahap = ke; dunia.ubahTahap.push(ke); return { ok: true, data: kunjunganDto(10) } as never; } },
  });
  return { l, repo, dunia, catatan, isi, versiCatatan, pengesahanTersimpan };
}
const saya = { id: 7, fasyankes_id: 1 };
const anamnesis = { keluhan_utama: 'Batuk' };

describe('layanan klinis: simpan bagian = pengesahan', () => {
  it('menyimpan, mengesahkan (hash isi kanonik, jenis akun), mencatat audit input, dan status sah', async () => {
    const { l, catatan, pengesahanTersimpan } = buatDunia();
    const h = await l.simpanBagian(saya, 10, 'anamnesis', anamnesis, undefined);
    expect(h).toMatchObject({ ok: true, data: { tersimpan: true, bagian: { verifikasi: 'sah', pengesahan: { versi: 1, jenis_akun: 'Dokter/DPJP' } } } });
    expect(pengesahanTersimpan.get('anamnesis:10')?.hash).toBe(hashIsi({ keluhan_utama: 'Batuk', penyerta: null, riwayat_pribadi: null, riwayat_keluarga: null, alergi: null }));
    expect(catatan).toEqual([expect.objectContaining({ aksi: 'input', entitas: 'anamnesis', entitas_id: 10 })]);
  });

  it('isi tidak sah ditolak dengan rincian jalur tanpa menulis apa pun', async () => {
    const { l, repo } = buatDunia();
    const h = await l.simpanBagian(saya, 10, 'diagnosis', { item: [{ kode: 'I10', nama: 'x', peran: 'penyerta' }] }, undefined);
    expect(h).toMatchObject({ ok: false, kode: 'tidak_valid', rincian: [{ jalur: 'isi.item' }] });
    expect(repo.simpanBagian).not.toHaveBeenCalled();
  });

  it('menyimpan ulang isi yang sama tidak membuat versi atau audit baru', async () => {
    const { l, repo, catatan } = buatDunia();
    await l.simpanBagian(saya, 10, 'anamnesis', anamnesis, undefined);
    const h = await l.simpanBagian(saya, 10, 'anamnesis', anamnesis, undefined);
    expect(h).toMatchObject({ ok: true, data: { tersimpan: false } });
    expect(repo.simpanBagian).toHaveBeenCalledTimes(1);
    expect(catatan).toHaveLength(1);
  });

  it('perbaikan: wajib alasan, isi lama masuk versi catatan, audit perbaikan', async () => {
    const { l, catatan, versiCatatan } = buatDunia();
    await l.simpanBagian(saya, 10, 'anamnesis', anamnesis, undefined);
    expect(await l.simpanBagian(saya, 10, 'anamnesis', { keluhan_utama: 'Pilek' }, undefined)).toMatchObject({ ok: false, kode: 'tidak_valid' });
    const h = await l.simpanBagian(saya, 10, 'anamnesis', { keluhan_utama: 'Pilek' }, 'Salah catat');
    expect(h).toMatchObject({ ok: true, data: { tersimpan: true, bagian: { pengesahan: { versi: 2 } } } });
    expect(versiCatatan).toEqual([expect.objectContaining({ versi: 1, alasan: 'Salah catat', isi_lama: expect.objectContaining({ keluhan_utama: 'Batuk' }) })]);
    expect(catatan.map((c) => c.aksi)).toEqual(['input', 'perbaikan']);
  });

  it('deteksi perubahan: isi di basis data diubah di luar alur terlihat sebagai berubah', async () => {
    const { l, isi } = buatDunia();
    await l.simpanBagian(saya, 10, 'anamnesis', anamnesis, undefined);
    isi.set('anamnesis:10', { keluhan_utama: 'Diubah langsung', penyerta: null, riwayat_pribadi: null, riwayat_keluarga: null, alergi: null });
    const h = await l.ambil(saya, 10);
    expect(h).toMatchObject({ ok: true, data: { bagian: { anamnesis: { verifikasi: 'berubah' }, diagnosis: { verifikasi: 'belum_disahkan', isi: null } } } });
  });

  it('tahap skrining maju ke pemeriksaan saat catatan pertama disimpan; kasir dan ditutup menolak catatan', async () => {
    const w = buatDunia('menunggu_skrining');
    await w.l.simpanBagian(saya, 10, 'tanda_vital', { sistolik: 120 }, undefined);
    expect(w.dunia.ubahTahap).toEqual(['pemeriksaan']);
    for (const t of ['kasir', 'ditutup'] as const) {
      const x = buatDunia(t);
      expect(await x.l.simpanBagian(saya, 10, 'anamnesis', anamnesis, undefined)).toMatchObject({ ok: false, kode: 'konflik' });
    }
  });

  it('kunjungan fasyankes lain tidak ditemukan; pelaksana tindakan harus pengguna fasyankes', async () => {
    const { l } = buatDunia();
    expect(await l.simpanBagian({ id: 7, fasyankes_id: 2 }, 10, 'anamnesis', anamnesis, undefined)).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
    const item = { kode: '89.52', nama: 'EKG', mulai: '2026-10-25T01:00:00Z' };
    expect(await l.simpanBagian(saya, 10, 'tindakan', { item: [{ ...item, performer_id: 55 }] }, undefined)).toMatchObject({ ok: false, kode: 'tidak_valid' });
    const ok = await l.simpanBagian(saya, 10, 'tindakan', { item: [item] }, undefined);
    expect(ok).toMatchObject({ ok: true, data: { bagian: { isi: { item: [{ performer_id: 7 }] } } } });
  });

  it('penulisan serempak yang bentrok menjadi konflik', async () => {
    const { l, dunia } = buatDunia();
    dunia.bentrok = true;
    expect(await l.simpanBagian(saya, 10, 'anamnesis', anamnesis, undefined)).toMatchObject({ ok: false, kode: 'konflik' });
  });
});

describe('layanan klinis: selesai dan salinan', () => {
  it('selesai butuh anamnesis, diagnosis, dan tindak lanjut tersimpan, lalu maju ke kasir', async () => {
    const { l, dunia } = buatDunia();
    expect(await l.selesai(saya, 10, 'kasir')).toMatchObject({ ok: false, kode: 'konflik' });
    await l.simpanBagian(saya, 10, 'anamnesis', anamnesis, undefined);
    await l.simpanBagian(saya, 10, 'diagnosis', { item: [{ kode: 'I10', nama: 'Hipertensi', peran: 'utama' }] }, undefined);
    expect(await l.selesai(saya, 10, 'kasir')).toMatchObject({ ok: false, kode: 'konflik' });
    await l.simpanBagian(saya, 10, 'tindak_lanjut', { jenis: 'pulang' }, undefined);
    expect(await l.selesai(saya, 10, 'kasir')).toMatchObject({ ok: true });
    expect(dunia.ubahTahap).toEqual(['kasir']);
  });

  it('selesai hanya pada tahap pemeriksaan', async () => {
    expect(await buatDunia('resep').l.selesai(saya, 10, 'kasir')).toMatchObject({ ok: false, kode: 'konflik' });
  });

  it('salin hanya dari kunjungan pasien yang sama dan berbeda dari kunjungan ini, dan tercatat lihat', async () => {
    const { l, catatan } = buatDunia();
    expect(await l.salinan(saya, 10, 10)).toMatchObject({ ok: false, kode: 'tidak_valid' });
    expect(await l.salinan(saya, 10, 99)).toMatchObject({ ok: false, kode: 'tidak_valid' });
    expect(await l.salinan(saya, 10, 404)).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
    expect(await l.salinan(saya, 10, 11)).toMatchObject({ ok: true });
    expect(catatan).toEqual([expect.objectContaining({ aksi: 'lihat', entitas: 'catatan_klinis', entitas_id: 11 })]);
  });
});

describe('layanan klinis: draf server', () => {
  it('menyimpan dan membaca draf per pengguna tanpa audit, dan menimpa draf yang ada', async () => {
    const { l, catatan, repo } = buatDunia();
    await l.simpanDraf(saya, 10, 'pemeriksaan-klinis', { langkah: 1, isi: { a: 1 } });
    await l.simpanDraf(saya, 10, 'pemeriksaan-klinis', { langkah: 2, isi: { a: 2 } });
    expect(await l.bacaDraf(saya, 10, 'pemeriksaan-klinis')).toMatchObject({ ok: true, data: { langkah: 2, isi: { a: 2 } } });
    expect(await l.bacaDraf({ id: 8, fasyankes_id: 1 }, 10, 'pemeriksaan-klinis')).toEqual({ ok: true, data: null });
    expect(await l.bacaDraf(saya, 10, 'skrining')).toEqual({ ok: true, data: null });
    expect(catatan).toEqual([]);
    expect(repo.simpanDraf).toHaveBeenCalledTimes(2);
  });

  it('kunjungan fasyankes lain 404, tahap tertutup 409, draf kedaluwarsa dibuang', async () => {
    const { l, dunia, repo } = buatDunia();
    expect(await l.simpanDraf({ id: 7, fasyankes_id: 2 }, 10, 'skrining', { langkah: 0, isi: {} })).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
    await l.simpanDraf(saya, 10, 'skrining', { langkah: 0, isi: { a: 1 } });
    dunia.waktu = new Date(dunia.waktu.getTime() + 13 * 3_600_000);
    expect(await l.bacaDraf(saya, 10, 'skrining')).toEqual({ ok: true, data: null });
    expect(repo.hapusDraf).toHaveBeenCalledWith(1, 10, 7, 'skrining');
    dunia.tahap = 'kasir';
    expect(await l.simpanDraf(saya, 10, 'skrining', { langkah: 0, isi: {} })).toMatchObject({ ok: false, kode: 'konflik' });
  });

  it('draf kunjungan dihapus saat pemeriksaan selesai', async () => {
    const { l, repo } = buatDunia();
    await l.simpanDraf(saya, 10, 'pemeriksaan-klinis', { langkah: 0, isi: { a: 1 } });
    await l.simpanBagian(saya, 10, 'anamnesis', anamnesis, undefined);
    await l.simpanBagian(saya, 10, 'diagnosis', { item: [{ kode: 'I10', nama: 'Hipertensi', peran: 'utama' }] }, undefined);
    await l.simpanBagian(saya, 10, 'tindak_lanjut', { jenis: 'pulang' }, undefined);
    await l.selesai(saya, 10, 'kasir');
    expect(repo.hapusDraf).toHaveBeenCalledWith(1, 10);
    expect(await l.bacaDraf(saya, 10, 'pemeriksaan-klinis')).toEqual({ ok: true, data: null });
  });
});
