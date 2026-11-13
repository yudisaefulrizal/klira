import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function daftarLokasiUntukBacaKlinikPublik(fasyankes_id: number | undefined, jenis: T.JenisLokasi | undefined, status_operasional: T.StatusOperasional | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; nama: string }>("SELECT t.`id`, t.`nama` FROM `lokasi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`status_operasional` <=> ?)) ORDER BY t.`nama` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, status_operasional === undefined, status_operasional ?? null], koneksi);
  return baris;
}

export async function daftarLokasiUntukBuatRuteStatistik(fasyankes_id: number | undefined, jenis: T.JenisLokasi | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; nama: string }>("SELECT t.`id`, t.`nama` FROM `lokasi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) ORDER BY t.`nama` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null], koneksi);
  return baris;
}

export async function hitungLokasiUntukDaftar(fasyankes_id: number | undefined, jenis: T.JenisLokasi | undefined, status_operasional: T.StatusOperasional | undefined, nama: string | undefined, ihs_location_id: string | null | undefined, pakai: unknown, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `lokasi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`status_operasional` <=> ?)) AND ((? OR ((((? OR t.`nama` LIKE ? ESCAPE '!'))) OR (((? OR t.`ihs_location_id` LIKE ? ESCAPE '!'))) OR ((EXISTS (SELECT 1 FROM `lokasi` r1 WHERE t.`induk_id` = r1.`id` AND (((? OR r1.`nama` LIKE ? ESCAPE '!')))))))))", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, status_operasional === undefined, status_operasional ?? null, !pakai, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', ihs_location_id === undefined, '%' + String(ihs_location_id ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%'], koneksi);
  return Number(baris.jumlah);
}

export async function daftarLokasiUntukDaftar(fasyankes_id: number | undefined, jenis: T.JenisLokasi | undefined, status_operasional: T.StatusOperasional | undefined, nama: string | undefined, ihs_location_id: string | null | undefined, pakai: unknown, batas: number | undefined, lewati: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__nama: string; t0__jenis: T.JenisLokasi; t0__induk_id: number | null; t0__status_operasional: T.StatusOperasional; t0__ihs_location_id: string | null; t0__dibuat_oleh: number | null; t0__dibuat_pada: Date; t1__id: number; t1__nama: string };
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
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; nama: string; jenis: T.JenisLokasi; induk_id: number | null; status_operasional: T.StatusOperasional; ihs_location_id: string | null; dibuat_oleh: number | null; dibuat_pada: Date; induk: { nama: string } | null }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, nama: baris[0].t0__nama, jenis: baris[0].t0__jenis, induk_id: baris[0].t0__induk_id, status_operasional: baris[0].t0__status_operasional, ihs_location_id: baris[0].t0__ihs_location_id, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, induk: petakt1(baris)[0] ?? null }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`nama` AS `t0__nama`, t0.`jenis` AS `t0__jenis`, t0.`induk_id` AS `t0__induk_id`, t0.`status_operasional` AS `t0__status_operasional`, t0.`ihs_location_id` AS `t0__ihs_location_id`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`\nFROM (SELECT t0.* FROM `lokasi` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`jenis` <=> ?)) AND ((? OR t0.`status_operasional` <=> ?)) AND ((? OR ((((? OR t0.`nama` LIKE ? ESCAPE '!'))) OR (((? OR t0.`ihs_location_id` LIKE ? ESCAPE '!'))) OR ((EXISTS (SELECT 1 FROM `lokasi` r1 WHERE t0.`induk_id` = r1.`id` AND (((? OR r1.`nama` LIKE ? ESCAPE '!'))))))))) ORDER BY t0.`nama` ASC, t0.`id` ASC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.* FROM `lokasi` b1 WHERE TRUE) t1 ON t0.`induk_id` = t1.`id`\nORDER BY t0.`nama` ASC, t0.`id` ASC, t1.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, status_operasional === undefined, status_operasional ?? null, !pakai, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', ihs_location_id === undefined, '%' + String(ihs_location_id ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, lewati ?? 0], koneksi);
  const hasil = petakt0(baris);
  return hasil;
}

export async function cariLokasiUntukAmbil(id: number | undefined, fasyankes_id: number | undefined, jenis: T.JenisLokasi | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__nama: string; t0__jenis: T.JenisLokasi; t0__induk_id: number | null; t0__status_operasional: T.StatusOperasional; t0__ihs_location_id: string | null; t0__dibuat_oleh: number | null; t0__dibuat_pada: Date; t1__id: number; t1__nama: string };
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
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; nama: string; jenis: T.JenisLokasi; induk_id: number | null; status_operasional: T.StatusOperasional; ihs_location_id: string | null; dibuat_oleh: number | null; dibuat_pada: Date; induk: { nama: string } | null }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, nama: baris[0].t0__nama, jenis: baris[0].t0__jenis, induk_id: baris[0].t0__induk_id, status_operasional: baris[0].t0__status_operasional, ihs_location_id: baris[0].t0__ihs_location_id, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, induk: petakt1(baris)[0] ?? null }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`nama` AS `t0__nama`, t0.`jenis` AS `t0__jenis`, t0.`induk_id` AS `t0__induk_id`, t0.`status_operasional` AS `t0__status_operasional`, t0.`ihs_location_id` AS `t0__ihs_location_id`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`\nFROM (SELECT t0.* FROM `lokasi` t0 WHERE ((? OR t0.`id` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`jenis` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `lokasi` b1 WHERE TRUE) t1 ON t0.`induk_id` = t1.`id`\nORDER BY t1.`id` ASC", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null], koneksi);
  const hasil = petakt0(baris);
  return (hasil[0] ?? null) as (typeof hasil)[number] | null;
}

export async function tambahLokasiUntukBuat(fasyankes_id: number | undefined, nama: string | undefined, jenis: T.JenisLokasi | undefined, induk_id: number | null | undefined, status_operasional: T.StatusOperasional | undefined, ihs_location_id: string | null | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `lokasi` (`fasyankes_id`, `nama`, `jenis`, `induk_id`, `status_operasional`, `ihs_location_id`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nama === undefined ? null : nama) ?? null, ((jenis === undefined ? null : jenis) ?? null), (induk_id === undefined ? null : induk_id) ?? null, ((status_operasional === undefined ? "O" : status_operasional) ?? null), (ihs_location_id === undefined ? null : ihs_location_id) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahLokasiUntukBuatHasil(id: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__nama: string; t0__jenis: T.JenisLokasi; t0__induk_id: number | null; t0__status_operasional: T.StatusOperasional; t0__ihs_location_id: string | null; t0__dibuat_oleh: number | null; t0__dibuat_pada: Date; t1__id: number; t1__nama: string };
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
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; nama: string; jenis: T.JenisLokasi; induk_id: number | null; status_operasional: T.StatusOperasional; ihs_location_id: string | null; dibuat_oleh: number | null; dibuat_pada: Date; induk: { nama: string } | null }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, nama: baris[0].t0__nama, jenis: baris[0].t0__jenis, induk_id: baris[0].t0__induk_id, status_operasional: baris[0].t0__status_operasional, ihs_location_id: baris[0].t0__ihs_location_id, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, induk: petakt1(baris)[0] ?? null }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`nama` AS `t0__nama`, t0.`jenis` AS `t0__jenis`, t0.`induk_id` AS `t0__induk_id`, t0.`status_operasional` AS `t0__status_operasional`, t0.`ihs_location_id` AS `t0__ihs_location_id`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`\nFROM (SELECT t0.* FROM `lokasi` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `lokasi` b1 WHERE TRUE) t1 ON t0.`induk_id` = t1.`id`\nORDER BY t1.`id` ASC", [id === undefined, id ?? null], koneksi);
  const hasil = petakt0(baris);
  if (!hasil[0]) throw new Error('Baris lokasi tidak ditemukan.');
  return hasil[0];
}

export async function ubahLokasiUntukUbah(nama: string | undefined, induk_id: number | null | undefined, status_operasional: T.StatusOperasional | undefined, ihs_location_id: string | null | undefined, id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `lokasi` t SET `nama` = IF(?, t.`nama`, ?), `induk_id` = IF(?, t.`induk_id`, ?), `status_operasional` = IF(?, t.`status_operasional`, ?), `ihs_location_id` = IF(?, t.`ihs_location_id`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?))", [nama === undefined, nama ?? null, induk_id === undefined, induk_id ?? null, status_operasional === undefined, (status_operasional ?? null), ihs_location_id === undefined, ihs_location_id ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function ubahLokasiUntukSetAktif(status_operasional: T.StatusOperasional | undefined, id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `lokasi` t SET `status_operasional` = IF(?, t.`status_operasional`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?))", [status_operasional === undefined, (status_operasional ?? null), id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function daftarLokasiUntukOpsi(fasyankes_id: number | undefined, jenis: T.JenisLokasi | undefined, status_operasional: T.StatusOperasional | undefined, nama: string | undefined, batas: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; nama: string }>("SELECT t.`id`, t.`nama` FROM `lokasi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`status_operasional` <=> ?)) AND ((? OR t.`nama` LIKE ? ESCAPE '!')) ORDER BY t.`nama` ASC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, status_operasional === undefined, status_operasional ?? null, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, 0], koneksi);
  return baris;
}

export async function hitungLokasiUntukLokasiAda(id: number | undefined, fasyankes_id: number | undefined, jenis: T.JenisLokasi | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `lokasi` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?))", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function hitungLokasiUntukHitungKesiapan(fasyankes_id: number | undefined, jenis: T.JenisLokasi | undefined, status_operasional: T.StatusOperasional | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `lokasi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`status_operasional` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, status_operasional === undefined, status_operasional ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function daftarLokasiUntukPetakan(id: readonly (number)[] | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; nama: string }>("SELECT t.`id`, t.`nama` FROM `lokasi` t WHERE ((? OR t.`id` IN (?))) AND ((? OR t.`fasyankes_id` <=> ?))", [id === undefined, (id)?.length ? (id) : [null], fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return baris;
}

export async function hitungLokasiUntukPoliOperasional(id: number | undefined, fasyankes_id: number | undefined, jenis: T.JenisLokasi | undefined, status_operasional: T.StatusOperasional | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `lokasi` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`status_operasional` <=> ?))", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, status_operasional === undefined, status_operasional ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function daftarLokasiUntukOpsi2(fasyankes_id: number | undefined, jenis: T.JenisLokasi | undefined, status_operasional: T.StatusOperasional | undefined, batas: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; nama: string }>("SELECT t.`id`, t.`nama` FROM `lokasi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`status_operasional` <=> ?)) ORDER BY t.`nama` ASC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, status_operasional === undefined, status_operasional ?? null, batas ?? 2147483647, 0], koneksi);
  return baris;
}

export async function wajibLokasiUntukUbahAntrean(id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ nama: string }>("SELECT t.`nama` FROM `lokasi` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris lokasi tidak ditemukan.');
  return baris[0];
}

export async function daftarLokasiUntukPetakanAntrean(fasyankes_id: number | undefined, id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; nama: string }>("SELECT t.`id`, t.`nama` FROM `lokasi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`id` IN (?)))", [fasyankes_id === undefined, fasyankes_id ?? null, id === undefined, (id)?.length ? (id) : [null]], koneksi);
  return baris;
}

export async function cariLokasiUntukKonteks(id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ nama: string }>("SELECT t.`nama` FROM `lokasi` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function daftarLokasiUntukLaporan(id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; nama: string }>("SELECT t.`id`, t.`nama` FROM `lokasi` t WHERE ((? OR t.`id` IN (?)))", [id === undefined, (id)?.length ? (id) : [null]], koneksi);
  return baris;
}

export async function daftarLokasiUntukBedSemua(fasyankes_id: number | undefined, jenis: T.JenisLokasi | undefined, batas: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; nama: string; jenis: T.JenisLokasi; induk_id: number | null; status_operasional: T.StatusOperasional; ihs_location_id: string | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`jenis`, t.`induk_id`, t.`status_operasional`, t.`ihs_location_id`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `lokasi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) ORDER BY t.`induk_id` ASC, t.`nama` ASC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, batas ?? 2147483647, 0], koneksi);
  return baris;
}

export async function cariLokasiUntukAsal(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ nama: string }>("SELECT t.`nama` FROM `lokasi` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function cariLokasiUntukPastikanBedBebas(id: number | undefined, fasyankes_id: number | undefined, jenis: T.JenisLokasi | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; nama: string; jenis: T.JenisLokasi; induk_id: number | null; status_operasional: T.StatusOperasional; ihs_location_id: string | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`jenis`, t.`induk_id`, t.`status_operasional`, t.`ihs_location_id`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `lokasi` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function ubahLokasiUntukTempatkan(status_operasional: T.StatusOperasional | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `lokasi` t SET `status_operasional` = IF(?, t.`status_operasional`, ?) WHERE ((? OR t.`id` <=> ?))", [status_operasional === undefined, (status_operasional ?? null), id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function daftarLokasiUntukDetail(id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; nama: string; induk_id: number | null }>("SELECT t.`id`, t.`nama`, t.`induk_id` FROM `lokasi` t WHERE ((? OR t.`id` IN (?)))", [id === undefined, (id)?.length ? (id) : [null]], koneksi);
  return baris;
}

export function kunciLokasiRawatInap(id: number, fasyankesId: number, koneksi: Koneksi) {
  return baca<{ id: number }>('SELECT id FROM lokasi WHERE id = ? AND fasyankes_id = ? FOR UPDATE', [id, fasyankesId], koneksi);
}
