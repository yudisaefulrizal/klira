import { baca, tulis, pool, type Koneksi } from '../../koneksi';


export async function hapusPengaturanKeamananUntukKeamananKeamananIntegrasiTest(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `pengaturan_keamanan` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function hitungPengaturanKeamananUntukKeamananKeamananIntegrasiTest(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `pengaturan_keamanan` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return Number(baris.jumlah);
}
