import { buatLayananPengesahan } from '../rekam-medis/layanan';
import type { PengesahanTersimpan } from '../rekam-medis/repositori';
import { hashIsi } from '../rekam-medis/pengesahan';
import { buatLayananPenunjang } from './layanan';
import { susunIsiHasil } from './isi';
import type { KunjunganOrder, MasterBaris, OrderBaris, RepositoriPenunjang } from './repositori';

const pelaku = { id: 7, fasyankes_id: 1 };
const T = new Date('2026-10-25T03:00:00Z');

const master = (id: number, p: Partial<MasterBaris> = {}): MasterBaris => ({
  id, kode: `K${id}`, nama: `Pemeriksaan ${id}`, kode_loinc: '718-7', loinc_contoh: true, jenis_spesimen: 'Darah', satuan: 'g/dL', rujukan_min: 12, rujukan_maks: 16, rujukan_teks: '12 - 16 g/dL',
  aktif: true, tarif: null, tarif_layanan_id: null, ...p,
});
const order = (p: Partial<OrderBaris> = {}): OrderBaris => ({
  id: 10, kunjungan_id: 5, pasien_id: 2, nama: 'Hemoglobin', kode_loinc: '718-7', prioritas: 'rutin', catatan: null, status: 'dipesan', dibuat_pada: T, dibuat_oleh_nama: 'Dr. A',
  master: { satuan: 'g/dL', rujukan_teks: '12 - 16 g/dL', rujukan_min: 12, rujukan_maks: 16, jenis_spesimen: 'Darah' }, spesimen: null, hasil: null, ...p,
});
const hasil = (p: object = {}) => ({ nilai: '14', satuan: 'g/dL', rujukan_teks: '12 - 16 g/dL', interpretasi: 'normal' as const, catatan: null, dientri_oleh: 'Analis', dientri_pada: T, validator_nama: null, divalidasi_pada: null, ...p });

function buat(opsi: { kunjungan?: Partial<KunjunganOrder> | null; order?: OrderBaris | null; masterAktif?: MasterBaris[]; disahkan?: string[]; validasiOk?: boolean } = {}) {
  const panggilan: Record<string, unknown[]> = {};
  const catat = (nama: string, arg: unknown) => void (panggilan[nama] ??= []).push(arg);
  const audit: { aksi: string; entitas: string }[] = [];
  const pengesahanTerakhir = new Map<string, PengesahanTersimpan>();
  const pengesahan = buatLayananPengesahan({
    repo: {
      terakhir: async (_f, e, id) => pengesahanTerakhir.get(`${e}:${id}`) ?? null,
      jenisAkunPemberiHak: async () => [{ id: 3, nama: 'Analis lab' }],
      riwayatVersi: async () => [],
    },
    audit: { catat: async () => undefined },
  });
  const o = opsi.order === undefined ? order() : opsi.order;
  const repo: RepositoriPenunjang = {
    kunjungan: async () => (opsi.kunjungan === null ? null : { id: 5, pasien_id: 2, tahap_layanan: 'pemeriksaan', cara_pembayaran: 'umum', ...opsi.kunjungan }),
    bagianDisahkan: async () => opsi.disahkan ?? [],
    masterAktifDari: async (_f, ids) => (opsi.masterAktif ?? [master(1), master(2)]).filter((m) => ids.includes(m.id)),
    buatOrder: async (d) => {
      catat('buatOrder', d);
      return { orderIds: d.master.map((m) => 100 + m.id), tagihan: { status_tagihan: 'lengkap', status_pembayaran: 'belum', total: 0 } };
    },
    order: async () => o,
    ordersKunjungan: async () => [order({ id: 101 }), order({ id: 102 })],
    penggunaAda: async (_f, id) => id !== 99,
    catatSpesimen: async (d) => (catat('catatSpesimen', d), true),
    simpanHasil: async (d) => (catat('simpanHasil', d), true),
    validasi: async (d) => (catat('validasi', d), opsi.validasiOk ?? true),
    rekap: async () => ({ data: [], halaman: 1, ukuran: 20, total: 0, jumlah_status: { dipesan: 0, spesimen_diambil: 0, menunggu_hasil: 0, divalidasi: 0 } }),
    daftarMaster: async () => [],
    master: async () => null,
    tarifLab: async () => [],
    tarifLabSah: async () => true,
    buatMaster: async () => null,
    ubahMaster: async () => null,
    isiHasil: async () => null,
  };
  const l = buatLayananPenunjang({
    repo, audit: { catat: async (e) => void audit.push(e) }, pengesahan, addendum: { untukEntitas: async () => [] }, sekarang: () => T,
  });
  return { l, panggilan, audit, pengesahanTerakhir };
}

describe('order lab', () => {
  it('membuat satu order per pemeriksaan sesuai urutan pilihan dan mencatat audit tiap order', async () => {
    const { l, panggilan, audit } = buat();
    const h = await l.buatOrder(pelaku, 5, { pemeriksaan_ids: [2, 1], prioritas: 'segera', catatan: null });
    expect(h.ok).toBe(true);
    const d = panggilan.buatOrder[0] as { master: MasterBaris[]; prioritas: string; kunjungan: KunjunganOrder };
    expect(d.master.map((m) => m.id)).toEqual([2, 1]);
    expect(d.prioritas).toBe('segera');
    expect(audit.filter((a) => a.entitas === 'order_penunjang' && a.aksi === 'input')).toHaveLength(2);
  });
  it('kunjungan tidak ada atau sudah ditutup ditolak', async () => {
    expect(await buat({ kunjungan: null }).l.buatOrder(pelaku, 5, { pemeriksaan_ids: [1], prioritas: 'rutin', catatan: null })).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
    const t = buat({ kunjungan: { tahap_layanan: 'ditutup' } });
    expect(await t.l.buatOrder(pelaku, 5, { pemeriksaan_ids: [1], prioritas: 'rutin', catatan: null })).toMatchObject({ ok: false, kode: 'konflik' });
    expect(t.panggilan.buatOrder).toBeUndefined();
  });
  it('pemeriksaan tidak aktif atau milik klinik lain (tidak ditemukan repositori) ditolak tanpa menulis', async () => {
    const t = buat({ masterAktif: [master(1)] });
    expect(await t.l.buatOrder(pelaku, 5, { pemeriksaan_ids: [1, 2], prioritas: 'rutin', catatan: null })).toMatchObject({ ok: false, kode: 'tidak_valid' });
    expect(t.panggilan.buatOrder).toBeUndefined();
  });
  it('order boleh dibuat sampai kunjungan ditutup, termasuk setelah kasir (lab tidak menunggu tutup kunjungan)', async () => {
    expect((await buat({ kunjungan: { tahap_layanan: 'kasir' } }).l.buatOrder(pelaku, 5, { pemeriksaan_ids: [1], prioritas: 'rutin', catatan: null })).ok).toBe(true);
  });
});

describe('urutan status order (hanya maju)', () => {
  const spesimen = { asal: 'Darah vena', waktu_ambil: T.toISOString(), petugas_id: null };
  it('spesimen hanya dari dipesan', async () => {
    expect((await buat().l.ambilSpesimen(pelaku, 10, spesimen)).ok).toBe(true);
    for (const status of ['spesimen_diambil', 'menunggu_hasil', 'divalidasi'] as const) {
      expect(await buat({ order: order({ status }) }).l.ambilSpesimen(pelaku, 10, spesimen)).toMatchObject({ ok: false, kode: 'konflik' });
    }
  });
  it('petugas bawaan pengguna sendiri; petugas luar fasyankes ditolak', async () => {
    const t = buat();
    await t.l.ambilSpesimen(pelaku, 10, spesimen);
    expect((t.panggilan.catatSpesimen[0] as { petugasId: number }).petugasId).toBe(7);
    expect(await buat().l.ambilSpesimen(pelaku, 10, { ...spesimen, petugas_id: 99 })).toMatchObject({ ok: false, kode: 'tidak_valid' });
  });
  it('hasil hanya setelah spesimen dan boleh diisi ulang sebelum validasi; satuan dan rujukan disalin dari master', async () => {
    expect(await buat().l.isiHasil(pelaku, 10, { nilai: '14', interpretasi: 'normal', catatan: null })).toMatchObject({ ok: false, kode: 'konflik' });
    const t = buat({ order: order({ status: 'spesimen_diambil' }) });
    expect((await t.l.isiHasil(pelaku, 10, { nilai: '14', interpretasi: 'normal', catatan: null })).ok).toBe(true);
    expect(t.panggilan.simpanHasil[0]).toMatchObject({ satuan: 'g/dL', rujukanTeks: '12 - 16 g/dL', nilai: '14' });
    expect((await buat({ order: order({ status: 'menunggu_hasil', hasil: hasil() }) }).l.isiHasil(pelaku, 10, { nilai: '15', interpretasi: 'normal', catatan: null })).ok).toBe(true);
    expect(await buat({ order: order({ status: 'divalidasi', hasil: hasil() }) }).l.isiHasil(pelaku, 10, { nilai: '15', interpretasi: 'normal', catatan: null })).toMatchObject({ ok: false, kode: 'konflik' });
  });
  it('validasi hanya dari menunggu hasil dan sekali saja', async () => {
    expect(await buat({ order: order({ status: 'spesimen_diambil' }) }).l.validasi(pelaku, 10)).toMatchObject({ ok: false, kode: 'konflik' });
    expect(await buat({ order: order({ status: 'divalidasi', hasil: hasil() }) }).l.validasi(pelaku, 10)).toMatchObject({ ok: false, kode: 'konflik' });
    expect(await buat({ order: order({ status: 'menunggu_hasil', hasil: null }) }).l.validasi(pelaku, 10)).toMatchObject({ ok: false, kode: 'konflik' });
  });
  it('balapan status di repositori (false) menjadi konflik', async () => {
    expect(await buat({ order: order({ status: 'menunggu_hasil', hasil: hasil() }), validasiOk: false }).l.validasi(pelaku, 10)).toMatchObject({ ok: false, kode: 'konflik' });
  });
  it('order tidak ada: tidak ditemukan', async () => {
    expect(await buat({ order: null }).l.validasi(pelaku, 10)).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
  });
});

describe('validasi: hasil biasa atau addendum', () => {
  const siap = (kunjungan: Partial<KunjunganOrder> = {}, disahkan: string[] = []) => buat({ order: order({ status: 'menunggu_hasil', hasil: hasil() }), kunjungan, disahkan });

  it('sebelum catatan disahkan: pengesahan hasil saja, tanpa addendum (dokter melihatnya di pemeriksaan)', async () => {
    const t = siap({}, ['anamnesis', 'tanda_vital']);
    expect((await t.l.validasi(pelaku, 10)).ok).toBe(true);
    const d = t.panggilan.validasi[0] as { addendum: unknown; pengesahan: { versi: number; hash: string; jenisAkun: { nama: string } } };
    expect(d.addendum).toBeNull();
    expect(d.pengesahan).toMatchObject({ versi: 1, jenisAkun: { nama: 'Analis lab' } });
    expect(d.pengesahan.hash).toHaveLength(64);
  });
  it('setelah diagnosis atau tindak lanjut disahkan: addendum dengan alasan hasil susulan', async () => {
    for (const bagian of ['diagnosis', 'tindak_lanjut']) {
      const t = siap({}, [bagian]);
      await t.l.validasi(pelaku, 10);
      expect((t.panggilan.validasi[0] as { addendum: { alasan: string } }).addendum.alasan).toContain('Hemoglobin');
    }
  });
  it('setelah pemeriksaan selesai (kasir): addendum; audit menyebut addendum', async () => {
    const t = siap({ tahap_layanan: 'kasir' });
    await t.l.validasi(pelaku, 10);
    expect((t.panggilan.validasi[0] as { addendum: unknown }).addendum).not.toBeNull();
    expect(t.audit.find((a) => a.entitas === 'hasil_penunjang')?.aksi).toBe('input');
  });
  it('isi kanonik pengesahan sama dengan isi addendum (susunIsiHasil) sehingga hash hasil dapat diverifikasi', async () => {
    const t = siap();
    await t.l.validasi(pelaku, 10);
    const isi = susunIsiHasil({ order_id: 10, nama: 'Hemoglobin', kode_loinc: '718-7', nilai: '14', satuan: 'g/dL', rujukan_teks: '12 - 16 g/dL', interpretasi: 'normal', catatan: null });
    expect((t.panggilan.validasi[0] as { pengesahan: { hash: string } }).pengesahan.hash).toBe(hashIsi(isi));
  });
});
