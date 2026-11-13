import { baca, tulis, pool, type Koneksi } from '../koneksi';


export async function tambahSesiUntukBuatSesi(fasyankes_id: number | undefined, pengguna_id: number | undefined, id_hash: string | undefined, alamat: string | null | undefined, kedaluwarsa_pada: Date | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `sesi` (`fasyankes_id`, `pengguna_id`, `id_hash`, `alamat`, `kedaluwarsa_pada`) VALUES (?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (id_hash === undefined ? null : id_hash) ?? null, (alamat === undefined ? null : alamat) ?? null, (kedaluwarsa_pada === undefined ? null : kedaluwarsa_pada) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function cariSesiUntukCariSesi(id_hash: string | undefined, kedaluwarsa_pada: Date | undefined, aktif: boolean | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__pengguna_id: number; t0__id_hash: string; t0__alamat: string | null; t0__dibuat_pada: Date; t0__kedaluwarsa_pada: Date; t1__id: number; t1__fasyankes_id: number; t1__nama: string; t1__username: string; t1__kata_sandi_hash: string; t1__aktif: boolean; t1__wajib_ganti_kredensial: boolean };
function petakt1(semua: Baris[]): { id: number; fasyankes_id: number; nama: string; username: string; kata_sandi_hash: string; aktif: boolean; wajib_ganti_kredensial: boolean }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, nama: baris[0].t1__nama, username: baris[0].t1__username, kata_sandi_hash: baris[0].t1__kata_sandi_hash, aktif: baris[0].t1__aktif, wajib_ganti_kredensial: baris[0].t1__wajib_ganti_kredensial }));
}
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; pengguna_id: number; id_hash: string; alamat: string | null; dibuat_pada: Date; kedaluwarsa_pada: Date; pengguna: { id: number; fasyankes_id: number; nama: string; username: string; kata_sandi_hash: string; aktif: boolean; wajib_ganti_kredensial: boolean } }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, pengguna_id: baris[0].t0__pengguna_id, id_hash: baris[0].t0__id_hash, alamat: baris[0].t0__alamat, dibuat_pada: baris[0].t0__dibuat_pada, kedaluwarsa_pada: baris[0].t0__kedaluwarsa_pada, pengguna: petakt1(baris)[0]! }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`pengguna_id` AS `t0__pengguna_id`, t0.`id_hash` AS `t0__id_hash`, t0.`alamat` AS `t0__alamat`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`kedaluwarsa_pada` AS `t0__kedaluwarsa_pada`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`nama` AS `t1__nama`, t1.`username` AS `t1__username`, t1.`kata_sandi_hash` AS `t1__kata_sandi_hash`, t1.`aktif` AS `t1__aktif`, t1.`wajib_ganti_kredensial` AS `t1__wajib_ganti_kredensial`\nFROM (SELECT t0.* FROM `sesi` t0 WHERE ((? OR t0.`id_hash` <=> ?)) AND ((? OR t0.`kedaluwarsa_pada` > ?)) AND (EXISTS (SELECT 1 FROM `pengguna` r1 WHERE t0.`pengguna_id` = r1.`id` AND (((? OR r1.`aktif` <=> ?))))) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `pengguna` b1 WHERE TRUE) t1 ON t0.`pengguna_id` = t1.`id`\nORDER BY t1.`id` ASC", [id_hash === undefined, id_hash ?? null, kedaluwarsa_pada === undefined, kedaluwarsa_pada ?? null, aktif === undefined, aktif ?? null], koneksi);
  const hasil = petakt0(baris);
  return (hasil[0] ?? null) as (typeof hasil)[number] | null;
}

export async function hapusSesiUntukHapusSesi(id_hash: string | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `sesi` t WHERE ((? OR t.`id_hash` <=> ?))", [id_hash === undefined, id_hash ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function hapusSesiKedaluwarsa(kedaluwarsa_pada: Date | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `sesi` t WHERE ((? OR t.`kedaluwarsa_pada` <= ?))", [kedaluwarsa_pada === undefined, kedaluwarsa_pada ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function hapusSesiPengguna(pengguna_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `sesi` t WHERE ((? OR t.`pengguna_id` <=> ?))", [pengguna_id === undefined, pengguna_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

