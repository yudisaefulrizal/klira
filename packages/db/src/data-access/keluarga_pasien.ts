import { baca, tulis, pool, type Koneksi } from '../koneksi';


export async function cariKeluargaPasienUntukDataCetak(fasyankes_id: number | undefined, anggota_pasien_id: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__pasien_id: number; t0__anggota_pasien_id: number; t0__hubungan: string; t0__dibatasi: boolean; t0__dibuat_oleh: number | null; t0__dibuat_pada: Date; t1__id: number; t1__nama: string; t1__nomor_rm: string };
function petakt1(semua: Baris[]): { nama: string; nomor_rm: string }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ nama: baris[0].t1__nama, nomor_rm: baris[0].t1__nomor_rm }));
}
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; pasien_id: number; anggota_pasien_id: number; hubungan: string; dibatasi: boolean; dibuat_oleh: number | null; dibuat_pada: Date; pasien: { nama: string; nomor_rm: string } }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, pasien_id: baris[0].t0__pasien_id, anggota_pasien_id: baris[0].t0__anggota_pasien_id, hubungan: baris[0].t0__hubungan, dibatasi: baris[0].t0__dibatasi, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, pasien: petakt1(baris)[0]! }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`anggota_pasien_id` AS `t0__anggota_pasien_id`, t0.`hubungan` AS `t0__hubungan`, t0.`dibatasi` AS `t0__dibatasi`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`, t1.`nomor_rm` AS `t1__nomor_rm`\nFROM (SELECT t0.* FROM `keluarga_pasien` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`anggota_pasien_id` <=> ?)) ORDER BY t0.`id` ASC LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `pasien` b1 WHERE TRUE) t1 ON t0.`pasien_id` = t1.`id`\nORDER BY t0.`id` ASC, t1.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, anggota_pasien_id === undefined, anggota_pasien_id ?? null], koneksi);
  const hasil = petakt0(baris);
  return (hasil[0] ?? null) as (typeof hasil)[number] | null;
}

export async function daftarKeluargaPasienUntukFolderKeluarga(fasyankes_id: number | undefined, pasien_id: number | undefined, batas: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__pasien_id: number; t0__anggota_pasien_id: number; t0__hubungan: string; t0__dibatasi: boolean; t0__dibuat_oleh: number | null; t0__dibuat_pada: Date; t1__id: number; t1__nama: string; t1__nomor_rm: string };
function petakt1(semua: Baris[]): { id: number; nama: string; nomor_rm: string }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t1__id, nama: baris[0].t1__nama, nomor_rm: baris[0].t1__nomor_rm }));
}
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; pasien_id: number; anggota_pasien_id: number; hubungan: string; dibatasi: boolean; dibuat_oleh: number | null; dibuat_pada: Date; anggota: { id: number; nama: string; nomor_rm: string } }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, pasien_id: baris[0].t0__pasien_id, anggota_pasien_id: baris[0].t0__anggota_pasien_id, hubungan: baris[0].t0__hubungan, dibatasi: baris[0].t0__dibatasi, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, anggota: petakt1(baris)[0]! }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`anggota_pasien_id` AS `t0__anggota_pasien_id`, t0.`hubungan` AS `t0__hubungan`, t0.`dibatasi` AS `t0__dibatasi`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`, t1.`nomor_rm` AS `t1__nomor_rm`\nFROM (SELECT t0.* FROM `keluarga_pasien` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`pasien_id` <=> ?)) ORDER BY t0.`id` ASC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.* FROM `pasien` b1 WHERE TRUE) t1 ON t0.`anggota_pasien_id` = t1.`id`\nORDER BY t0.`id` ASC, t1.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, pasien_id === undefined, pasien_id ?? null, batas ?? 2147483647, 0], koneksi);
  const hasil = petakt0(baris);
  return hasil;
}

export async function tambahKeluargaPasienUntukTautkanKeluarga(fasyankes_id: number | undefined, pasien_id: number | undefined, anggota_pasien_id: number | undefined, hubungan: string | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `keluarga_pasien` (`fasyankes_id`, `pasien_id`, `anggota_pasien_id`, `hubungan`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pasien_id === undefined ? null : pasien_id) ?? null, (anggota_pasien_id === undefined ? null : anggota_pasien_id) ?? null, (hubungan === undefined ? null : hubungan) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahKeluargaPasienUntukTautkanKeluargaHasil(id: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__pasien_id: number; t0__anggota_pasien_id: number; t0__hubungan: string; t0__dibatasi: boolean; t0__dibuat_oleh: number | null; t0__dibuat_pada: Date; t1__id: number; t1__nama: string; t1__nomor_rm: string };
function petakt1(semua: Baris[]): { id: number; nama: string; nomor_rm: string }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t1__id, nama: baris[0].t1__nama, nomor_rm: baris[0].t1__nomor_rm }));
}
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; pasien_id: number; anggota_pasien_id: number; hubungan: string; dibatasi: boolean; dibuat_oleh: number | null; dibuat_pada: Date; anggota: { id: number; nama: string; nomor_rm: string } }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, pasien_id: baris[0].t0__pasien_id, anggota_pasien_id: baris[0].t0__anggota_pasien_id, hubungan: baris[0].t0__hubungan, dibatasi: baris[0].t0__dibatasi, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, anggota: petakt1(baris)[0]! }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`anggota_pasien_id` AS `t0__anggota_pasien_id`, t0.`hubungan` AS `t0__hubungan`, t0.`dibatasi` AS `t0__dibatasi`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`, t1.`nomor_rm` AS `t1__nomor_rm`\nFROM (SELECT t0.* FROM `keluarga_pasien` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `pasien` b1 WHERE TRUE) t1 ON t0.`anggota_pasien_id` = t1.`id`\nORDER BY t1.`id` ASC", [id === undefined, id ?? null], koneksi);
  const hasil = petakt0(baris);
  if (!hasil[0]) throw new Error('Baris keluarga_pasien tidak ditemukan.');
  return hasil[0];
}

export async function ubahKeluargaPasienUntukUbahKeluarga(hubungan: string | undefined, dibatasi: boolean | undefined, id: number | undefined, fasyankes_id: number | undefined, pasien_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `keluarga_pasien` t SET `hubungan` = IF(?, t.`hubungan`, ?), `dibatasi` = IF(?, t.`dibatasi`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`pasien_id` <=> ?))", [hubungan === undefined, hubungan ?? null, dibatasi === undefined, dibatasi ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, pasien_id === undefined, pasien_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

