import { rencanaItemTindakan, sinkronItemTindakanDalam, statusTagihanDari, totalTagihan, tambahItemTagihanDalam } from './repositori';
import type { ItemTindakanLama, TarifTindakan } from './repositori';

describe('tagihan dasar', () => {
  it('status tagihan lengkap hanya bila semua item berharga', () => {
    expect(statusTagihanDari([50_000, 0])).toBe('lengkap');
    expect(statusTagihanDari([50_000, null])).toBe('belum_lengkap');
    expect(statusTagihanDari([])).toBe('lengkap');
  });
  it('total menjumlah harga x jumlah, item tanpa harga dihitung nol', () => {
    expect(totalTagihan([{ jumlah: 2, harga: 10_000 }, { jumlah: 1, harga: null }, { jumlah: 1, harga: 5_000 }])).toBe(25_000);
  });
  it('item ditambahkan ke tagihan kunjungan (dibuat bila belum ada) dan status dihitung ulang dalam transaksi yang sama', async () => {
    const dibuat: unknown[] = [];
    let status = '';
    const tx = {
      tagihan: {
        upsert: async () => ({ id: 9 }),
        update: async ({ data }: { data: { status_tagihan: string } }) => void (status = data.status_tagihan),
      },
      itemTagihan: {
        create: async ({ data }: { data: unknown }) => void dibuat.push(data),
        findMany: async () => [{ harga: 30_000 }, { harga: null }],
      },
    };
    const id = await tambahItemTagihanDalam(tx as never, 1, 5, 7, [
      { jenis: 'lab', tarifId: 2, kode: 'LAB-HB', nama: 'Hemoglobin', harga: 30_000, orderPenunjangId: 10 },
      { jenis: 'lab', tarifId: null, kode: 'X', nama: 'Tanpa tarif', harga: null, orderPenunjangId: 11 },
    ]);
    expect(id).toBe(9);
    expect(dibuat).toHaveLength(2);
    expect(dibuat[0]).toMatchObject({ tagihan_id: 9, order_penunjang_id: 10, harga: 30_000, harga_acuan: 30_000, jenis: 'lab' });
    expect(status).toBe('belum_lengkap');
  });
});

describe('tagihan tindakan dari pencatatan dokter (P5)', () => {
  const tarif = new Map<number, TarifTindakan>([
    [1, { id: 1, kode: 'TND-001', nama: 'Jahit luka <= 5 cm', harga_umum: 75_000, harga_jkn: 50_000 }],
    [2, { id: 2, kode: 'TND-002', nama: 'Jahit luka > 5 cm', harga_umum: 150_000, harga_jkn: null }],
    [3, { id: 3, kode: 'TND-003', nama: 'Nebulisasi', harga_umum: null, harga_jkn: null }],
  ]);
  const t = (tarif_layanan_id: number | null, kode = '86.59', jumlah = 1) => ({ kode, nama: 'dari dokter', tarif_layanan_id, jumlah });

  it('harga sesuai cara bayar: JKN pakai harga JKN bila ada; asuransi dan umum pakai harga umum; tanpa harga atau tanpa tarif null', () => {
    const daftar = [t(1, '86.59', 2), t(2), t(3, '93.94'), t(null, '89.52')];
    expect(rencanaItemTindakan(daftar, tarif, 'jkn', []).map((r) => r.harga)).toEqual([50_000, 150_000, null, null]);
    expect(rencanaItemTindakan(daftar, tarif, 'asuransi', []).map((r) => r.harga)).toEqual([75_000, 150_000, null, null]);
    const umum = rencanaItemTindakan(daftar, tarif, 'umum', []);
    expect(umum[0]).toMatchObject({ tarif_layanan_id: 1, kode: 'TND-001', nama: 'Jahit luka <= 5 cm', jumlah: 2, harga: 75_000, harga_acuan: 75_000, alasan_ubah_harga: null });
    expect(umum[3]).toMatchObject({ tarif_layanan_id: null, kode: '89.52', nama: 'dari dokter', harga: null });
  });

  it('harga yang diubah atau dilengkapi kasir pada item yang sama dipertahankan saat sinkron ulang', () => {
    const lama: ItemTindakanLama[] = [
      { tarif_layanan_id: 1, kode: 'TND-001', nama: 'Jahit luka <= 5 cm', jumlah: 1, harga: 60_000, harga_acuan: 75_000, alasan_ubah_harga: 'Diskon keluarga karyawan' },
      { tarif_layanan_id: 3, kode: 'TND-003', nama: 'Nebulisasi', jumlah: 1, harga: 40_000, harga_acuan: null, alasan_ubah_harga: null },
    ];
    const r = rencanaItemTindakan([t(1, '86.59', 3), t(3, '93.94')], tarif, 'umum', lama);
    expect(r[0]).toMatchObject({ jumlah: 3, harga: 60_000, harga_acuan: 75_000, alasan_ubah_harga: 'Diskon keluarga karyawan' });
    expect(r[1]).toMatchObject({ harga: 40_000, harga_acuan: null });
  });

  function txTiruan(o: { tahap?: string; pembayaran?: number; lama?: ItemTindakanLama[]; adaTagihan?: boolean }) {
    const tulis: { hapus: number; buat: unknown[]; status: string | null } = { hapus: 0, buat: [], status: null };
    const tx = {
      $queryRaw: async () => (o.adaTagihan === false ? [] : [{ id: 9 }]),
      kunjungan: { findFirst: async () => ({ tahap_layanan: o.tahap ?? 'pemeriksaan', cara_pembayaran: 'umum' }) },
      itemTagihan: {
        findMany: async (q: { where: { tindakan_sumber?: boolean } }) => (q.where.tindakan_sumber ? (o.lama ?? []) : [{ harga: 75_000 }]),
        deleteMany: async () => void (tulis.hapus += 1),
        createMany: async ({ data }: { data: unknown[] }) => void tulis.buat.push(...data),
      },
      tarifLayanan: { findMany: async () => [...tarif.values()] },
      pembayaran: { count: async () => o.pembayaran ?? 0 },
      tagihan: { create: async () => ({ id: 9 }), update: async ({ data }: { data: { status_tagihan: string } }) => void (tulis.status = data.status_tagihan) },
    };
    return { tx: tx as never, tulis };
  }

  it('sinkron mengganti item sumber tindakan saja dan menghitung ulang status tagihan', async () => {
    const { tx, tulis } = txTiruan({});
    expect(await sinkronItemTindakanDalam(tx, 1, 5, 7, [t(1), t(3, '93.94')])).toBe('disinkron');
    expect(tulis.hapus).toBe(1);
    expect(tulis.buat).toEqual([
      expect.objectContaining({ tindakan_sumber: true, jenis: 'tindakan', tarif_layanan_id: 1, harga: 75_000 }),
      expect.objectContaining({ tindakan_sumber: true, tarif_layanan_id: 3, harga: null }),
    ]);
    expect(tulis.status).toBe('lengkap');
  });

  it('terkunci bila sudah ada pembayaran atau kunjungan ditutup; tidak perlu bila tidak ada perubahan', async () => {
    for (const o of [{ pembayaran: 1 }, { tahap: 'ditutup' }]) {
      const { tx, tulis } = txTiruan(o);
      expect(await sinkronItemTindakanDalam(tx, 1, 5, 7, [t(1)])).toBe('terkunci');
      expect(tulis.hapus).toBe(0);
    }
    const lama: ItemTindakanLama[] = [{ tarif_layanan_id: 1, kode: 'TND-001', nama: 'Jahit luka <= 5 cm', jumlah: 1, harga: 75_000, harga_acuan: 75_000, alasan_ubah_harga: null }];
    const { tx } = txTiruan({ tahap: 'ditutup', lama });
    expect(await sinkronItemTindakanDalam(tx, 1, 5, 7, [t(1)])).toBe('tidak_perlu');
    const kosong = txTiruan({ adaTagihan: false });
    expect(await sinkronItemTindakanDalam(kosong.tx, 1, 5, 7, [])).toBe('tidak_perlu');
  });
});
