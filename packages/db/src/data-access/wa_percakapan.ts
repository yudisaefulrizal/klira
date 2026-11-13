import { baca, tulis, pool, type Koneksi } from '../koneksi';


export async function hapusWaPercakapanUntukBersihkanDalam(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `wa_percakapan` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function daftarWaPercakapanUntukBuatRuteWhatsapp(fasyankes_id: number | undefined, jid: string | undefined, jid2: string | undefined, batas: number | undefined, lewati: number | undefined, pesan_batas: number | undefined, pengguna_id: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__fasyankes_id: number; t0__jid: string; t0__nama: string; t0__foto_profil: string | null; t0__foto_periksa_setelah: Date | null; t0__pasien_id: number | null; t0__status: string; t0__penanggung_jawab: number | null; t0__diperbarui_pada: Date; t1__id: number; t1__percakapan_id: number; t1__wa_id: string | null; t1__arah: string; t1__isi: string; t1__jenis: string; t1__media_id: string | null; t1__status: string; t1__dibuat_oleh: number | null; t1__dibuat_pada: Date; t2__percakapan_id: number; t2__pengguna_id: number; t2__pesan_id: number };
function petakt1(semua: Baris[]): { id: number; percakapan_id: number; wa_id: string | null; arah: string; isi: string; jenis: string; media_id: string | null; status: string; dibuat_oleh: number | null; dibuat_pada: Date }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t1__id === null) continue;
    const kunci = String(baris.t1__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t1__id, percakapan_id: baris[0].t1__percakapan_id, wa_id: baris[0].t1__wa_id, arah: baris[0].t1__arah, isi: baris[0].t1__isi, jenis: baris[0].t1__jenis, media_id: baris[0].t1__media_id, status: baris[0].t1__status, dibuat_oleh: baris[0].t1__dibuat_oleh, dibuat_pada: baris[0].t1__dibuat_pada }));
}
function petakt2(semua: Baris[]): { percakapan_id: number; pengguna_id: number; pesan_id: number }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t2__percakapan_id === null) continue;
    const kunci = JSON.stringify([baris.t2__percakapan_id, baris.t2__pengguna_id]);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ percakapan_id: baris[0].t2__percakapan_id, pengguna_id: baris[0].t2__pengguna_id, pesan_id: baris[0].t2__pesan_id }));
}
function petakt0(semua: Baris[]): { id: number; fasyankes_id: number; jid: string; nama: string; foto_profil: string | null; foto_periksa_setelah: Date | null; pasien_id: number | null; status: string; penanggung_jawab: number | null; diperbarui_pada: Date; pesan: { id: number; percakapan_id: number; wa_id: string | null; arah: string; isi: string; jenis: string; media_id: string | null; status: string; dibuat_oleh: number | null; dibuat_pada: Date }[]; baca: { percakapan_id: number; pengguna_id: number; pesan_id: number }[] }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, jid: baris[0].t0__jid, nama: baris[0].t0__nama, foto_profil: baris[0].t0__foto_profil, foto_periksa_setelah: baris[0].t0__foto_periksa_setelah, pasien_id: baris[0].t0__pasien_id, status: baris[0].t0__status, penanggung_jawab: baris[0].t0__penanggung_jawab, diperbarui_pada: baris[0].t0__diperbarui_pada, pesan: petakt1(baris), baca: petakt2(baris) }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`jid` AS `t0__jid`, t0.`nama` AS `t0__nama`, t0.`foto_profil` AS `t0__foto_profil`, t0.`foto_periksa_setelah` AS `t0__foto_periksa_setelah`, t0.`pasien_id` AS `t0__pasien_id`, t0.`status` AS `t0__status`, t0.`penanggung_jawab` AS `t0__penanggung_jawab`, t0.`diperbarui_pada` AS `t0__diperbarui_pada`, t1.`id` AS `t1__id`, t1.`percakapan_id` AS `t1__percakapan_id`, t1.`wa_id` AS `t1__wa_id`, t1.`arah` AS `t1__arah`, t1.`isi` AS `t1__isi`, t1.`jenis` AS `t1__jenis`, t1.`media_id` AS `t1__media_id`, t1.`status` AS `t1__status`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`, t2.`percakapan_id` AS `t2__percakapan_id`, t2.`pengguna_id` AS `t2__pengguna_id`, t2.`pesan_id` AS `t2__pesan_id`\nFROM (SELECT t0.* FROM `wa_percakapan` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND ((((? OR t0.`jid` LIKE ? ESCAPE '!'))) OR (((? OR t0.`jid` LIKE ? ESCAPE '!')))) ORDER BY t0.`diperbarui_pada` DESC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.*, ROW_NUMBER() OVER (PARTITION BY b1.`percakapan_id` ORDER BY b1.`id` DESC) AS _urutan FROM `wa_pesan` b1 WHERE TRUE) t1 ON t0.`id` = t1.`percakapan_id` AND t1._urutan <= ?\nLEFT JOIN (SELECT b2.* FROM `wa_baca` b2 WHERE ((? OR b2.`pengguna_id` <=> ?))) t2 ON t0.`id` = t2.`percakapan_id`\nORDER BY t0.`diperbarui_pada` DESC, t1.`id` DESC, t2.`percakapan_id` ASC, t2.`pengguna_id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, jid === undefined, '%' + String(jid ?? '').replace(/[!%_]/g, teken => '!' + teken), jid2 === undefined, '%' + String(jid2 ?? '').replace(/[!%_]/g, teken => '!' + teken), batas ?? 2147483647, lewati ?? 0, (pesan_batas ?? 2147483647) + (0), pengguna_id === undefined, pengguna_id ?? null], koneksi);
  const hasil = petakt0(baris);
  return hasil;
}

export async function ambilWaPercakapanUntukBuatRuteWhatsapp(fasyankes_id: number | undefined, jid: string | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; jid: string; nama: string; foto_profil: string | null; foto_periksa_setelah: Date | null; pasien_id: number | null; status: string; penanggung_jawab: number | null; diperbarui_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`jid`, t.`nama`, t.`foto_profil`, t.`foto_periksa_setelah`, t.`pasien_id`, t.`status`, t.`penanggung_jawab`, t.`diperbarui_pada` FROM `wa_percakapan` t WHERE (((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jid` <=> ?))) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, jid === undefined, jid ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function simpanWaPercakapanUntukBuatRuteWhatsapp(fasyankes_id: number | undefined, jid: string | undefined, nama: string | undefined, pasien_id: number | null | undefined, nama2: string | undefined, pasien_id2: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `wa_percakapan` (`fasyankes_id`, `jid`, `nama`, `pasien_id`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `nama` = IF(?, `nama`, ?), `pasien_id` = IF(?, `pasien_id`, ?), `id` = LAST_INSERT_ID(`id`)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (jid === undefined ? null : jid) ?? null, (nama === undefined ? null : nama) ?? null, (pasien_id === undefined ? null : pasien_id) ?? null, nama2 === undefined, nama2 ?? null, pasien_id2 === undefined, pasien_id2 ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function simpanWaPercakapanUntukBuatRuteWhatsappHasil(fasyankes_id: number | undefined, jid: string | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; jid: string; nama: string; foto_profil: string | null; foto_periksa_setelah: Date | null; pasien_id: number | null; status: string; penanggung_jawab: number | null; diperbarui_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`jid`, t.`nama`, t.`foto_profil`, t.`foto_periksa_setelah`, t.`pasien_id`, t.`status`, t.`penanggung_jawab`, t.`diperbarui_pada` FROM `wa_percakapan` t WHERE (((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jid` <=> ?))) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, jid === undefined, jid ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris wa_percakapan tidak ditemukan.');
  return baris[0];
}

export async function cariWaPercakapanUntukBuatRuteWhatsapp(id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; jid: string; nama: string; foto_profil: string | null; foto_periksa_setelah: Date | null; pasien_id: number | null; status: string; penanggung_jawab: number | null; diperbarui_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`jid`, t.`nama`, t.`foto_profil`, t.`foto_periksa_setelah`, t.`pasien_id`, t.`status`, t.`penanggung_jawab`, t.`diperbarui_pada` FROM `wa_percakapan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function ubahWaPercakapanUntukBuatRuteWhatsapp(pasien_id: number | null | undefined, penanggung_jawab: number | null | undefined, id: number | undefined, pasien_id2: number | null | undefined, pasien_id3: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `wa_percakapan` t SET `pasien_id` = IF(?, t.`pasien_id`, ?), `penanggung_jawab` = IF(?, t.`penanggung_jawab`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((((? OR t.`pasien_id` <=> ?))) OR (((? OR t.`pasien_id` <=> ?))))", [pasien_id === undefined, pasien_id ?? null, penanggung_jawab === undefined, penanggung_jawab ?? null, id === undefined, id ?? null, pasien_id2 === undefined, pasien_id2 ?? null, pasien_id3 === undefined, pasien_id3 ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function ubahWaPercakapanUntukBuatRuteWhatsapp2(pasien_id: number | null | undefined, penanggung_jawab: number | null | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `wa_percakapan` t SET `pasien_id` = IF(?, t.`pasien_id`, ?), `penanggung_jawab` = IF(?, t.`penanggung_jawab`, ?) WHERE ((? OR t.`id` <=> ?))", [pasien_id === undefined, pasien_id ?? null, penanggung_jawab === undefined, penanggung_jawab ?? null, id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function ubahWaPercakapanUntukBuatRuteWhatsapp3(diperbarui_pada: Date | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `wa_percakapan` t SET `diperbarui_pada` = IF(?, t.`diperbarui_pada`, ?) WHERE ((? OR t.`id` <=> ?))", [diperbarui_pada === undefined, diperbarui_pada ?? null, id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function cariWaPercakapanUntukBuatPembaruanFotoWhatsapp(fasyankes_id: number | undefined, jid: string | undefined, jid2: string | undefined, foto_periksa_setelah: Date | null | undefined, foto_periksa_setelah2: Date | null | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; jid: string; nama: string; foto_profil: string | null; foto_periksa_setelah: Date | null; pasien_id: number | null; status: string; penanggung_jawab: number | null; diperbarui_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`jid`, t.`nama`, t.`foto_profil`, t.`foto_periksa_setelah`, t.`pasien_id`, t.`status`, t.`penanggung_jawab`, t.`diperbarui_pada` FROM `wa_percakapan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((((((? OR t.`jid` LIKE ? ESCAPE '!'))) OR (((? OR t.`jid` LIKE ? ESCAPE '!'))))) AND (((((? OR t.`foto_periksa_setelah` <=> ?))) OR (((? OR t.`foto_periksa_setelah` <= ?)))))) ORDER BY t.`foto_periksa_setelah` ASC, t.`id` DESC LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, jid === undefined, '%' + String(jid ?? '').replace(/[!%_]/g, teken => '!' + teken), jid2 === undefined, '%' + String(jid2 ?? '').replace(/[!%_]/g, teken => '!' + teken), foto_periksa_setelah === undefined, foto_periksa_setelah ?? null, foto_periksa_setelah2 === undefined, foto_periksa_setelah2 ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function ubahWaPercakapanUntukBuatPembaruanFotoWhatsapp(foto_profil: string | null | undefined, foto_periksa_setelah: Date | null | undefined, id: number | undefined, fasyankes_id: number | undefined, jid: string | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `wa_percakapan` t SET `foto_profil` = IF(?, t.`foto_profil`, ?), `foto_periksa_setelah` = IF(?, t.`foto_periksa_setelah`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jid` <=> ?))", [foto_profil === undefined, foto_profil ?? null, foto_periksa_setelah === undefined, foto_periksa_setelah ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, jid === undefined, jid ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function simpanWaPercakapanUntukTerima(fasyankes_id: number | undefined, jid: string | undefined, nama: string | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `wa_percakapan` (`fasyankes_id`, `jid`, `nama`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `id` = `id`, `id` = LAST_INSERT_ID(`id`)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (jid === undefined ? null : jid) ?? null, (nama === undefined ? null : nama) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function daftarWaPercakapanUntukRapikanRiwayatWhatsapp(id: number | undefined, fasyankes_id: number | undefined, batas: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number }>("SELECT t.`id` FROM `wa_percakapan` t WHERE ((? OR t.`id` > ?)) AND ((? OR t.`fasyankes_id` <=> ?)) ORDER BY t.`id` ASC LIMIT ? OFFSET ?", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, batas ?? 2147483647, 0], koneksi);
  return baris;
}

export async function kunciWaPercakapan(id: number, koneksi: Koneksi = pool) {
  return baca<{ id: number }>("SELECT id FROM wa_percakapan WHERE id = ? FOR UPDATE", [id], koneksi);
}

export async function hitungWaPercakapanBelumDibaca(penggunaId: number, fasyankesId: number, koneksi: Koneksi = pool) {
  return baca<{ belum: bigint; terbaru: number | null }>("SELECT COUNT(DISTINCT CASE WHEN p.id > COALESCE(b.pesan_id, 0) THEN c.id END) AS belum,\n             MAX(p.id) AS terbaru\n      FROM wa_percakapan c\n      LEFT JOIN wa_pesan p ON p.percakapan_id = c.id AND p.arah = 'masuk'\n      LEFT JOIN wa_baca b ON b.percakapan_id = c.id AND b.pengguna_id = ?\n      WHERE c.fasyankes_id = ?\n        AND (c.jid LIKE '%@s.whatsapp.net' OR c.jid LIKE '%@lid')", [penggunaId, fasyankesId], koneksi);
}

export async function kunciWaPercakapanFasyankes(fasyankesId: number, koneksi: Koneksi = pool) {
  return baca<{ id: number }>("SELECT id FROM wa_percakapan WHERE fasyankes_id = ? ORDER BY id FOR UPDATE", [fasyankesId], koneksi);
}
