import type { PersetujuanTindakanMasukan, TeksPersetujuanDto } from '@klira/shared';
import { buatLayananPersetujuan } from './layanan';
import type { DataPersetujuan, PasienPersetujuan, RepositoriPersetujuan } from './repositori';

const pelaku = { id: 7, fasyankes_id: 1 };
const T = new Date('2026-10-25T03:00:00Z');
const teks: TeksPersetujuanDto = { id: 4, jenis: 'tindakan', versi: 2, judul: 'Teks', tujuan: 'Tujuan tindakan', isi: 'Isi' };
const masukan: PersetujuanTindakanMasukan = {
  tindakan_kode: '86.04', tindakan_nama: ' Insisi abses ', penjelasan: ' Risiko dijelaskan ', bentuk: 'tertulis', penandatangan: 'pasien', wali_id: null, saksi_pengguna_id: 9, teks_persetujuan_id: 4,
};

function buat(opsi: { pasien?: Partial<PasienPersetujuan>; tahap?: string; teks?: TeksPersetujuanDto | null; saksiAda?: boolean } = {}) {
  const dicatat: DataPersetujuan[] = [];
  const audit: { aksi: string; entitas: string; keterangan?: string }[] = [];
  const repo: RepositoriPersetujuan = {
    kunjungan: async (_f, id) => (id === 404 ? null : { id, pasien_id: 2, tahap_layanan: opsi.tahap ?? 'pemeriksaan' }),
    pasien: async () => ({ id: 2, nama: 'Siti', tidak_cakap: false, ...opsi.pasien }),
    teksAktif: async () => (opsi.teks === undefined ? teks : opsi.teks),
    teksUntukPakai: async (_f, id) => (id === teks.id && opsi.teks !== null ? teks : null),
    wali: async () => [{ id: 6, hubungan: 'Ibu', nama: 'Ibu Siti' }],
    saksiOpsi: async () => [{ id: 9, nama: 'Ns. Budi' }],
    saksi: async (_f, id) => (opsi.saksiAda === false || id !== 9 ? null : { id: 9, nama: 'Ns. Budi' }),
    catat: async (d) => {
      dicatat.push(d);
      return {
        id: 1, kunjungan_id: d.kunjunganId, tindakan_kode: d.tindakanKode, tindakan_nama: d.tindakanNama, versi_teks: d.teks.versi, tujuan: d.teks.tujuan, penjelasan: d.penjelasan, bentuk: d.bentuk,
        status: 'diberikan', waktu: d.waktu.toISOString(), penandatangan: d.penandatangan, penandatangan_nama: d.penandatanganNama, saksi_nama: 'Ns. Budi', dicatat_oleh_nama: 'Dr. A',
      };
    },
    daftar: async () => [],
  };
  const l = buatLayananPersetujuan({
    repo, audit: { catat: async (e) => void audit.push(e) }, tindakanKunjungan: async () => [{ kode: '86.04', nama: 'Insisi abses' }], sekarang: () => T,
  });
  return { l, dicatat, audit };
}

describe('persetujuan tindakan', () => {
  it('mencatat dengan versi teks, penjelasan, bentuk, penandatangan pasien, dan saksi; audit input', async () => {
    const { l, dicatat, audit } = buat();
    const h = await l.catat(pelaku, 5, masukan);
    expect(h.ok).toBe(true);
    expect(dicatat[0]).toMatchObject({ pasienId: 2, kunjunganId: 5, tindakanNama: 'Insisi abses', penjelasan: 'Risiko dijelaskan', penandatangan: 'pasien', penandatanganNama: 'Siti', saksiId: 9, waktu: T });
    expect(dicatat[0].teks.versi).toBe(2);
    expect(audit).toEqual([expect.objectContaining({ aksi: 'input', entitas: 'persetujuan' })]);
  });
  it('wali menjadi penandatangan dan namanya yang dicatat; wali bukan milik pasien ditolak', async () => {
    const { l, dicatat } = buat();
    expect((await l.catat(pelaku, 5, { ...masukan, penandatangan: 'wali', wali_id: 6 })).ok).toBe(true);
    expect(dicatat[0]).toMatchObject({ penandatangan: 'wali', waliId: 6, penandatanganNama: 'Ibu Siti' });
    expect(await buat().l.catat(pelaku, 5, { ...masukan, penandatangan: 'wali', wali_id: 77 })).toMatchObject({ ok: false, kode: 'tidak_valid' });
  });
  it('pasien tidak cakap hanya boleh ditandatangani wali', async () => {
    const { l, dicatat } = buat({ pasien: { tidak_cakap: true } });
    expect(await l.catat(pelaku, 5, masukan)).toMatchObject({ ok: false, kode: 'tidak_valid' });
    expect(dicatat).toHaveLength(0);
    expect((await l.catat(pelaku, 5, { ...masukan, penandatangan: 'wali', wali_id: 6 })).ok).toBe(true);
  });
  it('saksi harus tenaga kesehatan aktif fasyankes ini; teks tidak aktif ditolak; tidak ditulis bila galat', async () => {
    const a = buat({ saksiAda: false });
    expect(await a.l.catat(pelaku, 5, masukan)).toMatchObject({ ok: false, kode: 'tidak_valid' });
    const b = buat({ teks: null });
    expect(await b.l.catat(pelaku, 5, masukan)).toMatchObject({ ok: false, kode: 'tidak_valid' });
    expect(a.dicatat.length + b.dicatat.length).toBe(0);
  });
  it('kunjungan tidak ada atau sudah ditutup', async () => {
    expect(await buat().l.catat(pelaku, 404, masukan)).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
    expect(await buat({ tahap: 'ditutup' }).l.catat(pelaku, 5, masukan)).toMatchObject({ ok: false, kode: 'konflik' });
  });
  it('siapkan memuat teks aktif, tindakan kunjungan, wali, dan saksi; daftar dicatat lihat', async () => {
    const { l, audit } = buat();
    const s = await l.siapkan(pelaku, 5);
    expect(s).toMatchObject({ ok: true, data: { teks: { versi: 2 }, tindakan: [{ kode: '86.04' }], wali: [{ id: 6 }], saksi: [{ id: 9 }], pasien: { nama: 'Siti' } } });
    await l.daftar(pelaku, 5);
    expect(audit.some((a) => a.aksi === 'lihat' && a.entitas === 'persetujuan')).toBe(true);
    expect(await buat().l.siapkan(pelaku, 404)).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
  });
});
