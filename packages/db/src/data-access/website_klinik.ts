import { baca, tulis, pool, type Koneksi } from '../koneksi';


export async function cariWebsiteKlinikUntukBacaKlinikPublik(aktif: boolean | undefined, slug: string | undefined, domain: string | null | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__aktif: boolean; t0__slug: string; t0__domain: string | null; t0__judul: string; t0__ringkasan: string; t0__tentang: string; t0__alamat: string; t0__whatsapp: string; t0__telepon: string; t0__email: string; t0__jam_operasional: string; t0__warna_utama: string; t0__logo_url: string; t0__hero_url: string; t0__tampilkan_jadwal: boolean; t0__tampilkan_nama_praktisi: boolean; t0__fasyankes_id: number; t1__id: number; t1__nama: string };
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
function petakt0(semua: Baris[]): { aktif: boolean; slug: string; domain: string | null; judul: string; ringkasan: string; tentang: string; alamat: string; whatsapp: string; telepon: string; email: string; jam_operasional: string; warna_utama: string; logo_url: string; hero_url: string; tampilkan_jadwal: boolean; tampilkan_nama_praktisi: boolean; fasyankes_id: number; fasyankes: { nama: string } }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ aktif: baris[0].t0__aktif, slug: baris[0].t0__slug, domain: baris[0].t0__domain, judul: baris[0].t0__judul, ringkasan: baris[0].t0__ringkasan, tentang: baris[0].t0__tentang, alamat: baris[0].t0__alamat, whatsapp: baris[0].t0__whatsapp, telepon: baris[0].t0__telepon, email: baris[0].t0__email, jam_operasional: baris[0].t0__jam_operasional, warna_utama: baris[0].t0__warna_utama, logo_url: baris[0].t0__logo_url, hero_url: baris[0].t0__hero_url, tampilkan_jadwal: baris[0].t0__tampilkan_jadwal, tampilkan_nama_praktisi: baris[0].t0__tampilkan_nama_praktisi, fasyankes_id: baris[0].t0__fasyankes_id, fasyankes: petakt1(baris)[0]! }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`aktif` AS `t0__aktif`, t0.`slug` AS `t0__slug`, t0.`domain` AS `t0__domain`, t0.`judul` AS `t0__judul`, t0.`ringkasan` AS `t0__ringkasan`, t0.`tentang` AS `t0__tentang`, t0.`alamat` AS `t0__alamat`, t0.`whatsapp` AS `t0__whatsapp`, t0.`telepon` AS `t0__telepon`, t0.`email` AS `t0__email`, t0.`jam_operasional` AS `t0__jam_operasional`, t0.`warna_utama` AS `t0__warna_utama`, t0.`logo_url` AS `t0__logo_url`, t0.`hero_url` AS `t0__hero_url`, t0.`tampilkan_jadwal` AS `t0__tampilkan_jadwal`, t0.`tampilkan_nama_praktisi` AS `t0__tampilkan_nama_praktisi`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`\nFROM (SELECT t0.* FROM `website_klinik` t0 WHERE ((? OR t0.`aktif` <=> ?)) AND ((? OR t0.`slug` <=> ?)) AND ((? OR t0.`domain` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `fasyankes` b1 WHERE TRUE) t1 ON t0.`fasyankes_id` = t1.`id`\nORDER BY t1.`id` ASC", [aktif === undefined, aktif ?? null, slug === undefined, slug ?? null, domain === undefined, domain ?? null], koneksi);
  const hasil = petakt0(baris);
  return (hasil[0] ?? null) as (typeof hasil)[number] | null;
}

export async function daftarWebsiteKlinikUntukBacaKlinikPublik(aktif: boolean | undefined, domain: string | null | undefined, batas: number | undefined, koneksi: Koneksi = pool) {
  type Baris = { t0__id: number; t0__aktif: boolean; t0__slug: string; t0__domain: string | null; t0__judul: string; t0__ringkasan: string; t0__tentang: string; t0__alamat: string; t0__whatsapp: string; t0__telepon: string; t0__email: string; t0__jam_operasional: string; t0__warna_utama: string; t0__logo_url: string; t0__hero_url: string; t0__tampilkan_jadwal: boolean; t0__tampilkan_nama_praktisi: boolean; t0__fasyankes_id: number; t1__id: number; t1__nama: string };
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
function petakt0(semua: Baris[]): { aktif: boolean; slug: string; domain: string | null; judul: string; ringkasan: string; tentang: string; alamat: string; whatsapp: string; telepon: string; email: string; jam_operasional: string; warna_utama: string; logo_url: string; hero_url: string; tampilkan_jadwal: boolean; tampilkan_nama_praktisi: boolean; fasyankes_id: number; fasyankes: { nama: string } }[] {
  const grup = new Map<string, Baris[]>();
  for (const baris of semua) {
    if (baris.t0__id === null) continue;
    const kunci = String(baris.t0__id);
    const isi = grup.get(kunci);
    if (isi) isi.push(baris); else grup.set(kunci, [baris]);
  }
  return [...grup.values()].map(baris => ({ aktif: baris[0].t0__aktif, slug: baris[0].t0__slug, domain: baris[0].t0__domain, judul: baris[0].t0__judul, ringkasan: baris[0].t0__ringkasan, tentang: baris[0].t0__tentang, alamat: baris[0].t0__alamat, whatsapp: baris[0].t0__whatsapp, telepon: baris[0].t0__telepon, email: baris[0].t0__email, jam_operasional: baris[0].t0__jam_operasional, warna_utama: baris[0].t0__warna_utama, logo_url: baris[0].t0__logo_url, hero_url: baris[0].t0__hero_url, tampilkan_jadwal: baris[0].t0__tampilkan_jadwal, tampilkan_nama_praktisi: baris[0].t0__tampilkan_nama_praktisi, fasyankes_id: baris[0].t0__fasyankes_id, fasyankes: petakt1(baris)[0]! }));
}
  const baris = await baca<Baris>("SELECT t0.`id` AS `t0__id`, t0.`aktif` AS `t0__aktif`, t0.`slug` AS `t0__slug`, t0.`domain` AS `t0__domain`, t0.`judul` AS `t0__judul`, t0.`ringkasan` AS `t0__ringkasan`, t0.`tentang` AS `t0__tentang`, t0.`alamat` AS `t0__alamat`, t0.`whatsapp` AS `t0__whatsapp`, t0.`telepon` AS `t0__telepon`, t0.`email` AS `t0__email`, t0.`jam_operasional` AS `t0__jam_operasional`, t0.`warna_utama` AS `t0__warna_utama`, t0.`logo_url` AS `t0__logo_url`, t0.`hero_url` AS `t0__hero_url`, t0.`tampilkan_jadwal` AS `t0__tampilkan_jadwal`, t0.`tampilkan_nama_praktisi` AS `t0__tampilkan_nama_praktisi`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`\nFROM (SELECT t0.* FROM `website_klinik` t0 WHERE ((? OR t0.`aktif` <=> ?)) AND ((? OR t0.`domain` <=> ?)) ORDER BY t0.`id` ASC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.* FROM `fasyankes` b1 WHERE TRUE) t1 ON t0.`fasyankes_id` = t1.`id`\nORDER BY t0.`id` ASC, t1.`id` ASC", [aktif === undefined, aktif ?? null, domain === undefined, domain ?? null, batas ?? 2147483647, 0], koneksi);
  const hasil = petakt0(baris);
  return hasil;
}

export async function hitungWebsiteKlinikUntukBacaKlinikPublik(aktif: boolean | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `website_klinik` t WHERE ((? OR t.`aktif` <=> ?))", [aktif === undefined, aktif ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function simpanWebsiteKlinikUntukBuatRuteWebsitePengaturan(fasyankes_id: number | undefined, aktif: boolean | undefined, slug: string | undefined, domain: string | null | undefined, judul: string | undefined, ringkasan: string | undefined, tentang: string | undefined, alamat: string | undefined, whatsapp: string | undefined, telepon: string | undefined, email: string | undefined, jam_operasional: string | undefined, warna_utama: string | undefined, logo_url: string | undefined, hero_url: string | undefined, tampilkan_jadwal: boolean | undefined, tampilkan_nama_praktisi: boolean | undefined, diubah_pada: Date | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `website_klinik` (`fasyankes_id`, `aktif`, `slug`, `domain`, `judul`, `ringkasan`, `tentang`, `alamat`, `whatsapp`, `telepon`, `email`, `jam_operasional`, `warna_utama`, `logo_url`, `hero_url`, `tampilkan_jadwal`, `tampilkan_nama_praktisi`, `diubah_pada`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `aktif` = IF(?, `aktif`, ?), `slug` = IF(?, `slug`, ?), `domain` = IF(?, `domain`, ?), `judul` = IF(?, `judul`, ?), `ringkasan` = IF(?, `ringkasan`, ?), `tentang` = IF(?, `tentang`, ?), `alamat` = IF(?, `alamat`, ?), `whatsapp` = IF(?, `whatsapp`, ?), `telepon` = IF(?, `telepon`, ?), `email` = IF(?, `email`, ?), `jam_operasional` = IF(?, `jam_operasional`, ?), `warna_utama` = IF(?, `warna_utama`, ?), `logo_url` = IF(?, `logo_url`, ?), `hero_url` = IF(?, `hero_url`, ?), `tampilkan_jadwal` = IF(?, `tampilkan_jadwal`, ?), `tampilkan_nama_praktisi` = IF(?, `tampilkan_nama_praktisi`, ?), `diubah_pada` = IF(?, `diubah_pada`, ?), `id` = LAST_INSERT_ID(`id`)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (aktif === undefined ? false : aktif) ?? null, (slug === undefined ? null : slug) ?? null, (domain === undefined ? null : domain) ?? null, (judul === undefined ? null : judul) ?? null, (ringkasan === undefined ? null : ringkasan) ?? null, (tentang === undefined ? null : tentang) ?? null, (alamat === undefined ? null : alamat) ?? null, (whatsapp === undefined ? null : whatsapp) ?? null, (telepon === undefined ? null : telepon) ?? null, (email === undefined ? null : email) ?? null, (jam_operasional === undefined ? null : jam_operasional) ?? null, (warna_utama === undefined ? null : warna_utama) ?? null, (logo_url === undefined ? null : logo_url) ?? null, (hero_url === undefined ? null : hero_url) ?? null, (tampilkan_jadwal === undefined ? true : tampilkan_jadwal) ?? null, (tampilkan_nama_praktisi === undefined ? false : tampilkan_nama_praktisi) ?? null, (diubah_pada === undefined ? null : diubah_pada) ?? null, aktif === undefined, aktif ?? null, slug === undefined, slug ?? null, domain === undefined, domain ?? null, judul === undefined, judul ?? null, ringkasan === undefined, ringkasan ?? null, tentang === undefined, tentang ?? null, alamat === undefined, alamat ?? null, whatsapp === undefined, whatsapp ?? null, telepon === undefined, telepon ?? null, email === undefined, email ?? null, jam_operasional === undefined, jam_operasional ?? null, warna_utama === undefined, warna_utama ?? null, logo_url === undefined, logo_url ?? null, hero_url === undefined, hero_url ?? null, tampilkan_jadwal === undefined, tampilkan_jadwal ?? null, tampilkan_nama_praktisi === undefined, tampilkan_nama_praktisi ?? null, diubah_pada === undefined, diubah_pada ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}
