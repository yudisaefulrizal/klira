import { baca, tulis, pool, type Koneksi } from '../koneksi';


export async function daftarPenarikanPersetujuanUntukDaftarPersetujuan(persetujuan_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; persetujuan_id: number; alasan: string; waktu: Date; batas_henti: Date; dicatat_oleh: number }>("SELECT t.`id`, t.`fasyankes_id`, t.`persetujuan_id`, t.`alasan`, t.`waktu`, t.`batas_henti`, t.`dicatat_oleh` FROM `penarikan_persetujuan` t WHERE ((? OR t.`persetujuan_id` IN (?)))", [persetujuan_id === undefined, (persetujuan_id)?.length ? (persetujuan_id) : [null]], koneksi);
  return baris;
}

export async function tambahPenarikanPersetujuanUntukTarik(fasyankes_id: number | undefined, persetujuan_id: number | undefined, alasan: string | undefined, waktu: Date | undefined, batas_henti: Date | undefined, dicatat_oleh: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `penarikan_persetujuan` (`fasyankes_id`, `persetujuan_id`, `alasan`, `waktu`, `batas_henti`, `dicatat_oleh`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (persetujuan_id === undefined ? null : persetujuan_id) ?? null, (alasan === undefined ? null : alasan) ?? null, (waktu === undefined ? new Date() : waktu) ?? null, (batas_henti === undefined ? null : batas_henti) ?? null, (dicatat_oleh === undefined ? null : dicatat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}
