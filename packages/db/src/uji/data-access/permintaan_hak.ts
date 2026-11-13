import { tulis, pool, type Koneksi } from '../../koneksi';


export async function ubahPermintaanHakUntukPdpPdpIntegrasiTest(batas_waktu: Date | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `permintaan_hak` t SET `batas_waktu` = IF(?, t.`batas_waktu`, ?) WHERE ((? OR t.`id` <=> ?))", [batas_waktu === undefined, batas_waktu ?? null, id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export function hapusPermintaanHakFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `permintaan_hak` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
