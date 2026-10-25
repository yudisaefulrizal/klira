import { ringkasanSip } from './layanan';
import { buatLayananMaster } from './layanan';
import type { RepositoriMaster } from './repositori';
import { normalkanProfil, riwayatPerubahan } from '../fasyankes/layanan';

describe('ringkasan SIP', () => {
  it('kosong bila tidak berubah, memuat perubahan nomor dan masa berlaku', () => {
    const lama = { id: 1, aktif: true, nomor_sip: 'A1', masa_berlaku_sip: '2027-01-01', profesi: 'Dokter' };
    expect(ringkasanSip(lama, { profesi: 'Dokter', nomor_sip: 'A1', masa_berlaku_sip: new Date('2027-01-01') })).toBeNull();
    const r = ringkasanSip(lama, { profesi: 'Dokter', nomor_sip: 'A2', masa_berlaku_sip: null });
    expect(r).toContain('Nomor SIP: A1 menjadi A2');
    expect(r).toContain('Masa berlaku SIP: 2027-01-01 menjadi -');
    expect(r).not.toContain('Profesi');
  });
  it('pembuatan dengan SIP menghasilkan riwayat, tanpa SIP tidak', () => {
    expect(ringkasanSip(null, { profesi: 'Perawat' })).toContain('Profesi: - menjadi Perawat');
  });
});

describe('profil klinik', () => {
  const lama = normalkanProfil(1, { nama: 'Klinik', jenis: 'klinik_pratama_rawat_jalan', status_akreditasi: 'Dasar', tanggal_akreditasi: new Date('2025-01-02') });
  it('normalisasi: kosong menjadi null, tanggal menjadi YYYY-MM-DD', () => {
    expect(lama).toMatchObject({ bentuk_usaha: null, tanggal_akreditasi: '2025-01-02', status_akreditasi: 'Dasar' });
    expect(normalkanProfil(1, { nama: ' K ', jenis: 'klinik_pratama_rawat_inap', bentuk_usaha: '  ' }).nama).toBe('K');
  });
  it('riwayat memisahkan akreditasi dari profil dan kosong bila sama', () => {
    expect(riwayatPerubahan(lama, lama)).toEqual([]);
    const baru = { ...lama, nama: 'Klinik Baru', tanggal_akreditasi: '2026-02-03' };
    const r = riwayatPerubahan(lama, baru);
    expect(r.map((x) => x.jenis)).toEqual(['profil', 'akreditasi']);
    expect(r[1].ringkasan).toContain('2025-01-02 menjadi 2026-02-03');
  });
});

describe('layanan master dengan repositori tiruan', () => {
  const catatan: unknown[] = [];
  const repo = {
    lokasiAda: async (f: number, id: number) => f === 1 && id === 10,
    penggunaAda: async () => true,
    punyaProfil: async () => true,
    tarifKodeAda: async () => false,
    ambil: async () => null,
    buat: async () => ({ id: 5, aktif: true }),
  } as unknown as RepositoriMaster;
  const layanan = buatLayananMaster({ repo, audit: { catat: async (e) => void catatan.push(e) } });

  it('rujukan di luar fasyankes ditolak tanpa menyimpan atau mencatat audit', async () => {
    const h = await layanan.buat({ id: 1, fasyankes_id: 2 }, 'ruang', { nama: 'R', induk_id: 10, status_operasional: 'O' });
    expect(h).toMatchObject({ ok: false, kode: 'tidak_valid' });
    expect(catatan).toHaveLength(0);
  });
  it('rujukan sah dibuat dan dicatat audit input', async () => {
    const h = await layanan.buat({ id: 1, fasyankes_id: 1 }, 'ruang', { nama: 'R', induk_id: 10, status_operasional: 'O' });
    expect(h.ok).toBe(true);
    expect(catatan[0]).toMatchObject({ aksi: 'input', entitas: 'lokasi', entitas_id: 5 });
  });
  it('ubah baris yang tidak ada: tidak ditemukan', async () => {
    expect(await layanan.ubah({ id: 1, fasyankes_id: 1 }, 'poli', 99, { nama: 'x' })).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
  });
});
