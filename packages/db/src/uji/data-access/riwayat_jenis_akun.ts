import { tulis, pool, type Koneksi } from '../../koneksi';


export async function hapusRiwayatJenisAkunUntukAksesIzinIntegrasiTest(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `riwayat_jenis_akun` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

