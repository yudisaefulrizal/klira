import { tulis, pool, type Koneksi } from '../../koneksi';


export async function hapusJadwalPraktikUntukMasterMasterIntegrasiTest(fasyankes_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `jadwal_praktik` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
  return { count: hasil.affectedRows };
}

export async function tambahJadwalPraktikUntukPasienPasienIntegrasiTest(fasyankes_id: number | undefined, pengguna_id: number | undefined, lokasi_id: number | undefined, hari: number | undefined, jam_mulai: string | undefined, jam_selesai: string | undefined, kuota: number | undefined, berlaku_dari: Date | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `jadwal_praktik` (`fasyankes_id`, `pengguna_id`, `lokasi_id`, `hari`, `jam_mulai`, `jam_selesai`, `kuota`, `berlaku_dari`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (lokasi_id === undefined ? null : lokasi_id) ?? null, (hari === undefined ? null : hari) ?? null, (jam_mulai === undefined ? null : jam_mulai) ?? null, (jam_selesai === undefined ? null : jam_selesai) ?? null, (kuota === undefined ? null : kuota) ?? null, (berlaku_dari === undefined ? null : berlaku_dari) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

