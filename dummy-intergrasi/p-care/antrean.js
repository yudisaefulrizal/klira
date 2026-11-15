// Layanan antrean online FKTP tiruan (dipanggil klinik): referensi poli dan dokter, tambah, panggil, dan batal antrean.
// Jalur dan isi badan mengikuti bridging-bpjs ([repo]: src/Antrean dan README); isi respons dan validasi adalah [dugaan].

const TANGGAL = /^\d{4}-\d{2}-\d{2}$/;
// Peserta yang ditandai tidak hadir masih dapat dipanggil lagi oleh klinik, jadi antreannya tetap aktif.
const AKTIF = ['menunggu', 'dipanggil', 'tidak_hadir'];

/** Antrean aktif (belum batal dan belum selesai) seorang peserta pada poli dan tanggal itu. */
export const cariAntreanAktif = (store, b) =>
  store.antrean.find((a) => a.nomorkartu === b.nomorkartu && a.kodepoli === b.kodepoli && a.tanggalperiksa === b.tanggalperiksa && AKTIF.includes(a.status));

const catat = (antrean, peristiwa) => antrean.riwayat.push({ waktu: new Date().toISOString(), peristiwa });

/** Daftar rute untuk mesin layanan di pcare.js: { metode, pola, fn(c) }. */
export function ruteAntrean({ store, D }) {
  const rute = [];
  const tambah = (metode, pola, fn) => rute.push({ metode, pola, fn });

  tambah('GET', '/ref/poli/tanggal/:tgl', (c) => {
    if (!TANGGAL.test(c.param.tgl)) return c.galat(201, 'Format tanggal harus yyyy-mm-dd');
    return c.ok({ list: D.POLI.filter((p) => p.poliSakit).map((p) => ({ namapoli: p.nmPoli, kodepoli: p.kdPoli })) });
  });
  tambah('GET', '/ref/dokter/kodepoli/:kdPoli/tanggal/:tgl', (c) => {
    if (!TANGGAL.test(c.param.tgl)) return c.galat(201, 'Format tanggal harus yyyy-mm-dd');
    if (!D.POLI.some((p) => p.kdPoli === c.param.kdPoli)) return c.galat(201, 'Poli tidak ditemukan');
    return c.ok({ list: D.DOKTER.map((d) => ({ namadokter: d.nmDokter, kodedokter: Number(d.kdDokter), jampraktek: '08:00-16:00', kapasitas: 30 })) });
  });

  tambah('POST', '/antrean/add', (c) => {
    const b = c.body;
    const ps = D.PESERTA.find((x) => x.noKartu === b.nomorkartu);
    if (!b.nomorkartu) return c.galat(201, 'nomorkartu wajib diisi');
    if (!ps) return c.galat(201, 'Peserta tidak ditemukan');
    if (!ps.aktif) return c.galat(201, `Peserta tidak aktif: ${ps.ketAktif}`);
    if (!D.POLI.some((x) => x.kdPoli === b.kodepoli)) return c.galat(201, 'Kode poli tidak dikenal');
    if (!TANGGAL.test(b.tanggalperiksa ?? '')) return c.galat(201, 'Format tanggalperiksa harus yyyy-mm-dd');
    if (!b.nomorantrean || !Number.isInteger(b.angkaantrean)) return c.galat(201, 'nomorantrean dan angkaantrean wajib diisi');
    if (cariAntreanAktif(store, b)) return c.galat(201, 'Peserta sudah memiliki antrean pada poli dan tanggal yang sama');
    const antrean = { ...b, sumber: 'faskes', status: 'menunggu', riwayat: [] };
    catat(antrean, 'Antrean ditambahkan klinik');
    store.antrean.push(antrean);
    return c.ok(null, 'Ok');
  });
  // status: 1 = hadir (dipanggil), 2 = tidak hadir.
  tambah('POST', '/antrean/panggil', (c) => {
    const b = c.body;
    const a = cariAntreanAktif(store, b);
    if (!a) return c.galat(201, 'Antrean tidak ditemukan');
    if (b.status !== 1 && b.status !== 2) return c.galat(201, 'status harus 1 (hadir) atau 2 (tidak hadir)');
    if (!Number.isFinite(b.waktu)) return c.galat(201, 'waktu harus angka milidetik');
    a.status = b.status === 1 ? 'dipanggil' : 'tidak_hadir';
    a.waktuPanggil = b.waktu;
    catat(a, b.status === 1 ? 'Dipanggil klinik' : 'Ditandai tidak hadir');
    return c.ok(null, 'Ok');
  });
  tambah('POST', '/antrean/batal', (c) => {
    const b = c.body;
    const a = cariAntreanAktif(store, b);
    if (!a) return c.galat(201, 'Antrean tidak ditemukan');
    a.status = 'batal';
    a.alasanBatal = b.alasan ?? '';
    catat(a, `Dibatalkan klinik${b.alasan ? `: ${b.alasan}` : ''}`);
    return c.ok(null, 'Ok');
  });
  return rute;
}
