import { baca, tulis, pool, type Koneksi } from '../koneksi';


export async function daftarJadwalPraktikUntukBacaKlinikPublik(fasyankes_id: number | undefined, aktif: boolean | undefined, berlaku_dari: Date | undefined, berlaku_sampai: Date | null | undefined, berlaku_sampai2: Date | null | undefined, lokasi_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__hari: number; t0__jam_mulai: string; t0__jam_selesai: string; t0__lokasi_id: number; t1__id: number; t1__nama: string };
function petakt1(semua: Baris[]): { nama: string }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ nama: baris[0].t1__nama }));
}
function petakt0(semua: Baris[]): { hari: number; jam_mulai: string; jam_selesai: string; lokasi_id: number; pengguna: { nama: string } }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ hari: baris[0].t0__hari, jam_mulai: baris[0].t0__jam_mulai, jam_selesai: baris[0].t0__jam_selesai, lokasi_id: baris[0].t0__lokasi_id, pengguna: petakt1(baris)[0]! }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`hari` AS `t0__hari`, t0.`jam_mulai` AS `t0__jam_mulai`, t0.`jam_selesai` AS `t0__jam_selesai`, t0.`lokasi_id` AS `t0__lokasi_id`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`\nFROM (SELECT t0.* FROM `jadwal_praktik` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`aktif` <=> ?)) AND ((? OR t0.`berlaku_dari` <= ?)) AND ((((? OR t0.`berlaku_sampai` <=> ?))) OR (((? OR t0.`berlaku_sampai` >= ?)))) AND ((? OR t0.`lokasi_id` IN (?))) AND (EXISTS (SELECT 1 FROM `pengguna` r1 WHERE t0.`pengguna_id` = r1.`id` AND (((? OR r1.`aktif` <=> ?)) AND ((? OR r1.`fasyankes_id` <=> ?)) AND (EXISTS (SELECT 1 FROM `profil_profesi` r2 WHERE r1.`id` = r2.`pengguna_id` AND (((? OR r2.`aktif` <=> ?)) AND ((? OR r2.`fasyankes_id` <=> ?)))))))) ORDER BY t0.`hari` ASC, t0.`jam_mulai` ASC) t0\nLEFT JOIN (SELECT b1.* FROM `pengguna` b1 WHERE TRUE) t1 ON t0.`pengguna_id` = t1.`id`\nORDER BY t0.`hari` ASC, t0.`jam_mulai` ASC, t1.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null, berlaku_dari === undefined, berlaku_dari ?? null, berlaku_sampai === undefined, berlaku_sampai ?? null, berlaku_sampai2 === undefined, berlaku_sampai2 ?? null, lokasi_id === undefined, (lokasi_id)?.length ? (lokasi_id) : [null], aktif === undefined, aktif ?? null, fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  const hasil = petakt0(baris);
  return hasil;
}

export async function hitungJadwalPraktikUntukDaftar(fasyankes_id: number | undefined, aktif: boolean | undefined, nama: string | undefined, pakai: unknown, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `jadwal_praktik` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR (((EXISTS (SELECT 1 FROM `pengguna` r1 WHERE t.`pengguna_id` = r1.`id` AND (((? OR r1.`nama` LIKE ? ESCAPE '!')))))) OR ((EXISTS (SELECT 1 FROM `lokasi` r2 WHERE t.`lokasi_id` = r2.`id` AND (((? OR r2.`nama` LIKE ? ESCAPE '!')))))))))", [fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null, !pakai, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%'], koneksi);
  return Number(baris.jumlah);
}

export async function daftarJadwalPraktikUntukDaftar(fasyankes_id: number | undefined, aktif: boolean | undefined, nama: string | undefined, pakai: unknown, batas: number | undefined, lewati: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__pengguna_id: number; t0__lokasi_id: number; t0__hari: number; t0__jam_mulai: string; t0__jam_selesai: string; t0__kuota: number; t0__berlaku_dari: Date; t0__berlaku_sampai: Date | null; t0__aktif: boolean; t0__dibuat_oleh: number | null; t0__dibuat_pada: Date; t1__id: number; t1__nama: string; t2__id: number; t2__nama: string };
function petakt1(semua: Baris[]): { nama: string }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ nama: baris[0].t1__nama }));
}
function petakt2(semua: Baris[]): { nama: string }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t2__id === null) continue;
    const kunci = String(baris.t2__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ nama: baris[0].t2__nama }));
}
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; pengguna_id: number; lokasi_id: number; hari: number; jam_mulai: string; jam_selesai: string; kuota: number; berlaku_dari: Date; berlaku_sampai: Date | null; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date; pengguna: { nama: string }; lokasi: { nama: string } }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, pengguna_id: baris[0].t0__pengguna_id, lokasi_id: baris[0].t0__lokasi_id, hari: baris[0].t0__hari, jam_mulai: baris[0].t0__jam_mulai, jam_selesai: baris[0].t0__jam_selesai, kuota: baris[0].t0__kuota, berlaku_dari: baris[0].t0__berlaku_dari, berlaku_sampai: baris[0].t0__berlaku_sampai, aktif: baris[0].t0__aktif, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, pengguna: petakt1(baris)[0]!, lokasi: petakt2(baris)[0]! }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`pengguna_id` AS `t0__pengguna_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`hari` AS `t0__hari`, t0.`jam_mulai` AS `t0__jam_mulai`, t0.`jam_selesai` AS `t0__jam_selesai`, t0.`kuota` AS `t0__kuota`, t0.`berlaku_dari` AS `t0__berlaku_dari`, t0.`berlaku_sampai` AS `t0__berlaku_sampai`, t0.`aktif` AS `t0__aktif`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`, t2.`id` AS `t2__id`, t2.`nama` AS `t2__nama`\nFROM (SELECT t0.* FROM `jadwal_praktik` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`aktif` <=> ?)) AND ((? OR (((EXISTS (SELECT 1 FROM `pengguna` r1 WHERE t0.`pengguna_id` = r1.`id` AND (((? OR r1.`nama` LIKE ? ESCAPE '!')))))) OR ((EXISTS (SELECT 1 FROM `lokasi` r2 WHERE t0.`lokasi_id` = r2.`id` AND (((? OR r2.`nama` LIKE ? ESCAPE '!'))))))))) ORDER BY t0.`hari` ASC, t0.`jam_mulai` ASC, t0.`id` ASC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.* FROM `pengguna` b1 WHERE TRUE) t1 ON t0.`pengguna_id` = t1.`id`\nLEFT JOIN (SELECT b2.* FROM `lokasi` b2 WHERE TRUE) t2 ON t0.`lokasi_id` = t2.`id`\nORDER BY t0.`hari` ASC, t0.`jam_mulai` ASC, t0.`id` ASC, t1.`id` ASC, t2.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null, !pakai, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, lewati ?? 0], koneksi);
  const hasil = petakt0(baris);
  return hasil;
}

export async function cariJadwalPraktikUntukAmbil(id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__pengguna_id: number; t0__lokasi_id: number; t0__hari: number; t0__jam_mulai: string; t0__jam_selesai: string; t0__kuota: number; t0__berlaku_dari: Date; t0__berlaku_sampai: Date | null; t0__aktif: boolean; t0__dibuat_oleh: number | null; t0__dibuat_pada: Date; t1__id: number; t1__nama: string; t2__id: number; t2__nama: string };
function petakt1(semua: Baris[]): { nama: string }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ nama: baris[0].t1__nama }));
}
function petakt2(semua: Baris[]): { nama: string }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t2__id === null) continue;
    const kunci = String(baris.t2__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ nama: baris[0].t2__nama }));
}
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; pengguna_id: number; lokasi_id: number; hari: number; jam_mulai: string; jam_selesai: string; kuota: number; berlaku_dari: Date; berlaku_sampai: Date | null; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date; pengguna: { nama: string }; lokasi: { nama: string } }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, pengguna_id: baris[0].t0__pengguna_id, lokasi_id: baris[0].t0__lokasi_id, hari: baris[0].t0__hari, jam_mulai: baris[0].t0__jam_mulai, jam_selesai: baris[0].t0__jam_selesai, kuota: baris[0].t0__kuota, berlaku_dari: baris[0].t0__berlaku_dari, berlaku_sampai: baris[0].t0__berlaku_sampai, aktif: baris[0].t0__aktif, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, pengguna: petakt1(baris)[0]!, lokasi: petakt2(baris)[0]! }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`pengguna_id` AS `t0__pengguna_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`hari` AS `t0__hari`, t0.`jam_mulai` AS `t0__jam_mulai`, t0.`jam_selesai` AS `t0__jam_selesai`, t0.`kuota` AS `t0__kuota`, t0.`berlaku_dari` AS `t0__berlaku_dari`, t0.`berlaku_sampai` AS `t0__berlaku_sampai`, t0.`aktif` AS `t0__aktif`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`, t2.`id` AS `t2__id`, t2.`nama` AS `t2__nama`\nFROM (SELECT t0.* FROM `jadwal_praktik` t0 WHERE ((? OR t0.`id` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `pengguna` b1 WHERE TRUE) t1 ON t0.`pengguna_id` = t1.`id`\nLEFT JOIN (SELECT b2.* FROM `lokasi` b2 WHERE TRUE) t2 ON t0.`lokasi_id` = t2.`id`\nORDER BY t1.`id` ASC, t2.`id` ASC", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  const hasil = petakt0(baris);
  return (hasil[0] ?? null) as (typeof hasil)[number] | null;
}

export async function tambahJadwalPraktikUntukBuat(fasyankes_id: number | undefined, pengguna_id: number | undefined, lokasi_id: number | undefined, hari: number | undefined, jam_mulai: string | undefined, jam_selesai: string | undefined, kuota: number | undefined, berlaku_dari: Date | undefined, berlaku_sampai: Date | null | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `jadwal_praktik` (`fasyankes_id`, `pengguna_id`, `lokasi_id`, `hari`, `jam_mulai`, `jam_selesai`, `kuota`, `berlaku_dari`, `berlaku_sampai`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (lokasi_id === undefined ? null : lokasi_id) ?? null, (hari === undefined ? null : hari) ?? null, (jam_mulai === undefined ? null : jam_mulai) ?? null, (jam_selesai === undefined ? null : jam_selesai) ?? null, (kuota === undefined ? null : kuota) ?? null, (berlaku_dari === undefined ? null : berlaku_dari) ?? null, (berlaku_sampai === undefined ? null : berlaku_sampai) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahJadwalPraktikUntukBuatHasil(id: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__pengguna_id: number; t0__lokasi_id: number; t0__hari: number; t0__jam_mulai: string; t0__jam_selesai: string; t0__kuota: number; t0__berlaku_dari: Date; t0__berlaku_sampai: Date | null; t0__aktif: boolean; t0__dibuat_oleh: number | null; t0__dibuat_pada: Date; t1__id: number; t1__nama: string; t2__id: number; t2__nama: string };
function petakt1(semua: Baris[]): { nama: string }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ nama: baris[0].t1__nama }));
}
function petakt2(semua: Baris[]): { nama: string }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t2__id === null) continue;
    const kunci = String(baris.t2__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ nama: baris[0].t2__nama }));
}
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; pengguna_id: number; lokasi_id: number; hari: number; jam_mulai: string; jam_selesai: string; kuota: number; berlaku_dari: Date; berlaku_sampai: Date | null; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date; pengguna: { nama: string }; lokasi: { nama: string } }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, pengguna_id: baris[0].t0__pengguna_id, lokasi_id: baris[0].t0__lokasi_id, hari: baris[0].t0__hari, jam_mulai: baris[0].t0__jam_mulai, jam_selesai: baris[0].t0__jam_selesai, kuota: baris[0].t0__kuota, berlaku_dari: baris[0].t0__berlaku_dari, berlaku_sampai: baris[0].t0__berlaku_sampai, aktif: baris[0].t0__aktif, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, pengguna: petakt1(baris)[0]!, lokasi: petakt2(baris)[0]! }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`pengguna_id` AS `t0__pengguna_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`hari` AS `t0__hari`, t0.`jam_mulai` AS `t0__jam_mulai`, t0.`jam_selesai` AS `t0__jam_selesai`, t0.`kuota` AS `t0__kuota`, t0.`berlaku_dari` AS `t0__berlaku_dari`, t0.`berlaku_sampai` AS `t0__berlaku_sampai`, t0.`aktif` AS `t0__aktif`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`, t2.`id` AS `t2__id`, t2.`nama` AS `t2__nama`\nFROM (SELECT t0.* FROM `jadwal_praktik` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `pengguna` b1 WHERE TRUE) t1 ON t0.`pengguna_id` = t1.`id`\nLEFT JOIN (SELECT b2.* FROM `lokasi` b2 WHERE TRUE) t2 ON t0.`lokasi_id` = t2.`id`\nORDER BY t1.`id` ASC, t2.`id` ASC", [id === undefined, id ?? null], koneksi);
  const hasil = petakt0(baris);
  if (!hasil[0]) throw new Error('Baris jadwal_praktik tidak ditemukan.');
  return hasil[0];
}

export async function ubahJadwalPraktikUntukUbah(pengguna_id: number | undefined, lokasi_id: number | undefined, hari: number | undefined, jam_mulai: string | undefined, jam_selesai: string | undefined, kuota: number | undefined, berlaku_dari: Date | undefined, berlaku_sampai: Date | null | undefined, id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `jadwal_praktik` t SET `pengguna_id` = IF(?, t.`pengguna_id`, ?), `lokasi_id` = IF(?, t.`lokasi_id`, ?), `hari` = IF(?, t.`hari`, ?), `jam_mulai` = IF(?, t.`jam_mulai`, ?), `jam_selesai` = IF(?, t.`jam_selesai`, ?), `kuota` = IF(?, t.`kuota`, ?), `berlaku_dari` = IF(?, t.`berlaku_dari`, ?), `berlaku_sampai` = IF(?, t.`berlaku_sampai`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?))", [pengguna_id === undefined, pengguna_id ?? null, lokasi_id === undefined, lokasi_id ?? null, hari === undefined, hari ?? null, jam_mulai === undefined, jam_mulai ?? null, jam_selesai === undefined, jam_selesai ?? null, kuota === undefined, kuota ?? null, berlaku_dari === undefined, berlaku_dari ?? null, berlaku_sampai === undefined, berlaku_sampai ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function ubahJadwalPraktikUntukSetAktif(aktif: boolean | undefined, id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `jadwal_praktik` t SET `aktif` = IF(?, t.`aktif`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?))", [aktif === undefined, aktif ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function hitungJadwalPraktikUntukHitungKesiapan(fasyankes_id: number | undefined, aktif: boolean | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `jadwal_praktik` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aktif` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function hitungJadwalPraktikUntukDokterDiPoli(fasyankes_id: number | undefined, pengguna_id: number | undefined, lokasi_id: number | undefined, aktif: boolean | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `jadwal_praktik` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`pengguna_id` <=> ?)) AND ((? OR t.`lokasi_id` <=> ?)) AND ((? OR t.`aktif` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, pengguna_id === undefined, pengguna_id ?? null, lokasi_id === undefined, lokasi_id ?? null, aktif === undefined, aktif ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function daftarJadwalPraktikUntukOpsi(fasyankes_id: number | undefined, aktif: boolean | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ pengguna_id: number; lokasi_id: number }>("SELECT t.`pengguna_id`, t.`lokasi_id` FROM `jadwal_praktik` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aktif` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, aktif === undefined, aktif ?? null], koneksi);
  return baris;
}
