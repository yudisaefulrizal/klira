import { tulis, pool, type Koneksi } from '../../koneksi';


export async function ubahKlaimUntukKlaimKlaimIntegrasiTest(batas_pengajuan: Date | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `klaim` t SET `batas_pengajuan` = IF(?, t.`batas_pengajuan`, ?) WHERE ((? OR t.`id` <=> ?))", [batas_pengajuan === undefined, batas_pengajuan ?? null, id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function ubahKlaimUntukKlaimKlaimIntegrasiTest2(batas_ajukan_ulang: Date | null | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `klaim` t SET `batas_ajukan_ulang` = IF(?, t.`batas_ajukan_ulang`, ?) WHERE ((? OR t.`id` <=> ?))", [batas_ajukan_ulang === undefined, batas_ajukan_ulang ?? null, id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export function hapusKlaimFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `klaim` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
