import { PrismaClient } from '@prisma/client';

export type PemeriksaanContoh = {
  kode: string; nama: string; kode_loinc: string; jenis_spesimen: string; satuan: string; rujukan_min: number | null; rujukan_maks: number | null; harga_umum: number; harga_jkn: number | null;
};

/**
 * Master pemeriksaan lab CONTOH (4.3, 4.9): kode LOINC, satuan UCUM, rentang rujukan, dan harga hanya agar order lab dapat dicoba. BUKAN data resmi:
 * kode ditandai `loinc_contoh`, tarif bernama "(contoh)", dan rentang rujukan harus ditetapkan laboratorium klinik sendiri.
 */
export const PEMERIKSAAN_CONTOH: PemeriksaanContoh[] = [
  { kode: 'LAB-HB', nama: 'Hemoglobin', kode_loinc: '718-7', jenis_spesimen: 'Darah vena', satuan: 'g/dL', rujukan_min: 12, rujukan_maks: 16, harga_umum: 25_000, harga_jkn: null },
  { kode: 'LAB-LEUKOSIT', nama: 'Leukosit', kode_loinc: '6690-2', jenis_spesimen: 'Darah vena', satuan: '10*3/uL', rujukan_min: 4, rujukan_maks: 11, harga_umum: 25_000, harga_jkn: null },
  { kode: 'LAB-TROMBOSIT', nama: 'Trombosit', kode_loinc: '777-3', jenis_spesimen: 'Darah vena', satuan: '10*3/uL', rujukan_min: 150, rujukan_maks: 450, harga_umum: 25_000, harga_jkn: null },
  { kode: 'LAB-GDS', nama: 'Glukosa darah sewaktu', kode_loinc: '2345-7', jenis_spesimen: 'Darah kapiler', satuan: 'mg/dL', rujukan_min: null, rujukan_maks: 200, harga_umum: 20_000, harga_jkn: null },
  { kode: 'LAB-KOLESTEROL', nama: 'Kolesterol total', kode_loinc: '2093-3', jenis_spesimen: 'Darah vena', satuan: 'mg/dL', rujukan_min: null, rujukan_maks: 200, harga_umum: 35_000, harga_jkn: null },
  { kode: 'LAB-ASAMURAT', nama: 'Asam urat', kode_loinc: '3084-1', jenis_spesimen: 'Darah vena', satuan: 'mg/dL', rujukan_min: 3.5, rujukan_maks: 7.2, harga_umum: 30_000, harga_jkn: null },
];

/** Tarif lab dan master pemeriksaan contoh untuk satu fasyankes; hanya bila fasyankes belum punya master pemeriksaan (tidak menimpa data klinik). Idempoten. */
export async function seedPenunjangContoh(prisma: PrismaClient, fasyankesId: number): Promise<number> {
  if ((await prisma.masterPemeriksaan.count({ where: { fasyankes_id: fasyankesId } })) > 0) return 0;
  for (const p of PEMERIKSAAN_CONTOH) {
    const tarif = await prisma.tarifLayanan.upsert({
      where: { fasyankes_id_kode: { fasyankes_id: fasyankesId, kode: p.kode } },
      update: {},
      create: { fasyankes_id: fasyankesId, kode: p.kode, nama: `${p.nama} (contoh)`, jenis: 'lab', harga_umum: p.harga_umum, harga_jkn: p.harga_jkn },
    });
    await prisma.masterPemeriksaan.create({
      data: {
        fasyankes_id: fasyankesId, kode: p.kode, nama: p.nama, jenis: 'lab', kode_loinc: p.kode_loinc, loinc_contoh: true, jenis_spesimen: p.jenis_spesimen, satuan: p.satuan,
        rujukan_min: p.rujukan_min, rujukan_maks: p.rujukan_maks, tarif_layanan_id: tarif.id,
      },
    });
  }
  return PEMERIKSAAN_CONTOH.length;
}
