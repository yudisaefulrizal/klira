import { baca, tulis, pool, type Koneksi } from '../koneksi';


export async function hapusIgOauthStateUntukPutuskanDanBersihkan(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `ig_oauth_state` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function hapusIgOauthStateUntukMulaiLogin(berakhir: Date | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `ig_oauth_state` t WHERE ((((? OR t.`berakhir` < ?))) OR (((? OR t.`fasyankes_id` <=> ?))))", [berakhir === undefined, berakhir ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function tambahIgOauthStateUntukMulaiLogin(hash: string | undefined, pengguna_id: number | undefined, fasyankes_id: number | undefined, sesi_hash: string | undefined, generasi: number | undefined, berakhir: Date | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `ig_oauth_state` (`hash`, `pengguna_id`, `fasyankes_id`, `sesi_hash`, `generasi`, `berakhir`) VALUES (?, ?, ?, ?, ?, ?)", [(hash === undefined ? null : hash) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (fasyankes_id === undefined ? null : fasyankes_id) ?? null, (sesi_hash === undefined ? null : sesi_hash) ?? null, (generasi === undefined ? null : generasi) ?? null, (berakhir === undefined ? null : berakhir) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function ambilIgOauthStateUntukSelesaikanLogin(hash: string | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ hash: string; pengguna_id: number; fasyankes_id: number; sesi_hash: string; generasi: number; berakhir: Date }>("SELECT t.`hash`, t.`pengguna_id`, t.`fasyankes_id`, t.`sesi_hash`, t.`generasi`, t.`berakhir` FROM `ig_oauth_state` t WHERE ((? OR t.`hash` <=> ?)) LIMIT 1", [hash === undefined, hash ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function hapusIgOauthStateUntukSelesaikanLogin(hash: string | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `ig_oauth_state` t WHERE ((? OR t.`hash` <=> ?))", [hash === undefined, hash ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function hapusIgOauthStateUntukPerbaruiTokenInstagram(berakhir: Date | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `ig_oauth_state` t WHERE ((? OR t.`berakhir` < ?))", [berakhir === undefined, berakhir ?? null], koneksi);
  return { count: hasil.affectedRows };
}
