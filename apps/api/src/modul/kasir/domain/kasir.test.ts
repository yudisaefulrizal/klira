import * as db from '@klira/db';
import { rencanaItemTindakan, sinkronItemTindakanDalam, statusTagihanDari, totalTagihan, tambahItemTagihanDalam } from '../data-access/repositori';
import type { ItemTindakanLama, TarifTindakan } from '../data-access/repositori';

jest.mock('@klira/db', () => ({ ...jest.requireActual('@klira/db'),
pool: {},
simpanTagihanUntukTambahItemTagihanDalam: jest.fn(),
simpanTagihanUntukTambahItemTagihanDalamHasil: jest.fn(),
tambahItemTagihanUntukTambahItemTagihanDalam: jest.fn(),
daftarItemTagihanUntukTambahItemTagihanDalam: jest.fn(),
ubahTagihanUntukTambahItemTagihanDalam: jest.fn(),
kunciTagihanKunjungan: jest.fn(),
cariKunjunganUntukSinkronItemTindakanDalam: jest.fn(),
daftarItemTagihanUntukSinkronItemTindakanDalam: jest.fn(),
daftarTarifLayananUntukSinkronItemTindakanDalam: jest.fn(),
hitungPembayaranUntukSinkronItemTindakanDalam: jest.fn(),
tambahTagihanUntukSinkronItemTindakanDalam: jest.fn(),
tambahTagihanUntukSinkronItemTindakanDalamHasil: jest.fn(),
hapusItemTagihanUntukSinkronItemTindakanDalam: jest.fn(),
tambahBanyakItemTagihanUntukSinkronItemTindakanDalam: jest.fn() }));
beforeEach(() => jest.clearAllMocks());

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
    const tx = {} as db.Koneksi;
    jest.mocked(db.simpanTagihanUntukTambahItemTagihanDalamHasil).mockResolvedValue({ id: 9 } as never);
    jest.mocked(db.daftarItemTagihanUntukTambahItemTagihanDalam).mockResolvedValue([{ harga: 30_000 }, { harga: null }]);
    const id = await tambahItemTagihanDalam(tx as never, 1, 5, 7, [
      { jenis: 'lab', tarifId: 2, kode: 'LAB-HB', nama: 'Hemoglobin', harga: 30_000, orderPenunjangId: 10 },
      { jenis: 'lab', tarifId: null, kode: 'X', nama: 'Tanpa tarif', harga: null, orderPenunjangId: 11 },
    ]);
    expect(id).toBe(9);
    expect(db.tambahItemTagihanUntukTambahItemTagihanDalam).toHaveBeenCalledTimes(2);
    expect(db.tambahItemTagihanUntukTambahItemTagihanDalam).toHaveBeenCalledWith(1, 9, 'lab', 2, 'LAB-HB', 'Hemoglobin', 1, 30_000, 10, null, 7, tx);
    expect(db.ubahTagihanUntukTambahItemTagihanDalam).toHaveBeenCalledWith('belum_lengkap', 9, tx);
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
    const tx = {} as db.Koneksi;
    jest.mocked(db.kunciTagihanKunjungan).mockResolvedValue(o.adaTagihan === false ? [] : [{ id: 9 }]);
    jest.mocked(db.cariKunjunganUntukSinkronItemTindakanDalam).mockResolvedValue({ tahap_layanan: o.tahap ?? 'pemeriksaan', cara_pembayaran: 'umum' } as never);
    jest.mocked(db.daftarItemTagihanUntukSinkronItemTindakanDalam).mockResolvedValue((o.lama ?? []) as never);
    jest.mocked(db.daftarItemTagihanUntukTambahItemTagihanDalam).mockResolvedValue([{ harga: 75_000 }]);
    jest.mocked(db.daftarTarifLayananUntukSinkronItemTindakanDalam).mockResolvedValue([...tarif.values()] as never);
    jest.mocked(db.hitungPembayaranUntukSinkronItemTindakanDalam).mockResolvedValue(o.pembayaran ?? 0);
    jest.mocked(db.tambahTagihanUntukSinkronItemTindakanDalam).mockResolvedValue({ id: 9, count: 1 });
    jest.mocked(db.tambahTagihanUntukSinkronItemTindakanDalamHasil).mockResolvedValue({ id: 9 } as never);
    jest.mocked(db.hapusItemTagihanUntukSinkronItemTindakanDalam).mockImplementation(async () => ({ count: ++tulis.hapus }));
    jest.mocked(db.tambahBanyakItemTagihanUntukSinkronItemTindakanDalam).mockImplementation(async data => { tulis.buat.push(...data); return { count: data.length }; });
    jest.mocked(db.ubahTagihanUntukTambahItemTagihanDalam).mockImplementation(async status => { tulis.status = status ?? null; return { count: 1 }; });
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
