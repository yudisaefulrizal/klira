import { prisma } from '@klira/db';
import type { ItemKesiapanDto, KesiapanDto } from '@klira/shared';

/** Hari ini (WIB) sebagai tanggal UTC tengah malam, untuk dibandingkan dengan kolom tanggal. */
const hariIni = (): Date => new Date(new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10));

/**
 * Kesiapan pengaturan awal klinik (hanya hitungan, tanpa data pribadi): poli, praktisi, jadwal, tarif konsultasi, obat, pemeriksaan lab;
 * ditambah dua peringatan (pemeriksaan tanpa harga, SIP lewat masa berlaku).
 */
export async function hitungKesiapan(fasyankesId: number): Promise<KesiapanDto> {
  const [poli, praktisi, jadwal, tarif, obat, pemeriksaan, tanpaTarif, sipLewat] = await Promise.all([
    prisma.lokasi.count({ where: { fasyankes_id: fasyankesId, jenis: 'poli', status_operasional: 'O' } }),
    prisma.profilProfesi.count({ where: { fasyankes_id: fasyankesId, aktif: true } }),
    prisma.jadwalPraktik.count({ where: { fasyankes_id: fasyankesId, aktif: true } }),
    prisma.tarifLayanan.count({ where: { fasyankes_id: fasyankesId, jenis: 'konsultasi', aktif: true } }),
    prisma.masterObat.count({ where: { fasyankes_id: fasyankesId, aktif: true } }),
    prisma.masterPemeriksaan.count({ where: { fasyankes_id: fasyankesId, aktif: true } }),
    prisma.masterPemeriksaan.count({ where: { fasyankes_id: fasyankesId, aktif: true, tarif_layanan_id: null } }),
    prisma.profilProfesi.count({ where: { fasyankes_id: fasyankesId, aktif: true, masa_berlaku_sip: { lt: hariIni() } } }),
  ]);
  const wajib = (kunci: ItemKesiapanDto['kunci'], jumlah: number): ItemKesiapanDto => ({ kunci, jumlah, ok: jumlah > 0, peringatan: false });
  const peringatan = (kunci: ItemKesiapanDto['kunci'], jumlah: number): ItemKesiapanDto => ({ kunci, jumlah, ok: jumlah === 0, peringatan: true });
  return {
    item: [
      wajib('poli', poli), wajib('praktisi', praktisi), wajib('jadwal', jadwal), wajib('tarif', tarif), wajib('obat', obat), wajib('pemeriksaan', pemeriksaan),
      peringatan('pemeriksaan_tanpa_tarif', tanpaTarif), peringatan('sip_kedaluwarsa', sipLewat),
    ],
  };
}
