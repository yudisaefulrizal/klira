// Simulator Mobile JKN: berperan sebagai HP peserta. Untuk FKTP, BPJS tidak memanggil klinik: pendaftaran dari Mobile JKN
// tercatat di PCare, lalu klinik menariknya lewat GET /pendaftaran/tglDaftar/{tanggal}. Simulator menulis pendaftaran itu
// langsung ke penyimpanan PCare tiruan dan menampilkan kabar antrean dari klinik (antrean/panggil, antrean/batal).
// Halaman: GET /mobile-jkn. Lihat 04-antrean-online.md.
import express from 'express';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cariAntreanAktif } from './antrean.js';

const HALAMAN = join(dirname(fileURLToPath(import.meta.url)), 'mobile-jkn.html');
/** Tanggal menurut WIB (yyyy-mm-dd); `tambahHari` 1 berarti besok. */
export const tanggalWib = (tambahHari = 0, sekarang = new Date()) => new Date(sekarang.getTime() + 7 * 3_600_000 + tambahHari * 86_400_000).toISOString().slice(0, 10);
/** yyyy-mm-dd menjadi dd-MM-yyyy (bentuk tanggal PCare). */
const tanggalPcare = (t) => t.split('-').reverse().join('-');

export function pasangMobileJkn(app, { store, D, nomorUrutBerikut }) {
  const jawab = (res, kode, pesan, data = null) => res.json({ metadata: { code: kode, message: pesan }, response: data });
  const rute = express.Router();
  rute.use(express.json({ limit: '100kb' }));
  rute.get('/', async (_req, res) => res.type('html').send(await readFile(HALAMAN, 'utf8')));
  rute.get('/api/keadaan', (_req, res) => {
    res.json({
      hariIni: tanggalWib(0),
      besok: tanggalWib(1),
      provider: D.PROVIDER_SENDIRI,
      peserta: D.PESERTA.map((p) => ({ noKartu: p.noKartu, nama: p.nama, nik: p.noKTP, aktif: p.aktif, ketAktif: p.ketAktif, terdaftarDiSini: p.kdProviderPst?.kdProvider === D.PROVIDER_SENDIRI.kdProvider })),
      poli: D.POLI.filter((p) => p.poliSakit).map((p) => ({ kodepoli: p.kdPoli, namapoli: p.nmPoli })),
      antrean: store.antrean,
      pendaftaran: store.pendaftaran.map((p) => ({ tglDaftar: p.tglDaftar, noUrut: p.noUrut, noKartu: p.noKartu, kdPoli: p.kdPoli, keluhan: p.keluhan, sumber: p.sumber ?? 'pcare' })),
      tarikanPendaftaran: store.tarikanPendaftaran,
    });
  });
  // Ambil antrean: hari ini atau besok (panduan Mobile JKN), hanya untuk peserta aktif yang terdaftar di faskes ini.
  rute.post('/api/ambil', (req, res) => {
    const b = req.body ?? {};
    const ps = D.PESERTA.find((p) => p.noKartu === b.noKartu);
    const poli = D.POLI.find((p) => p.kdPoli === b.kodepoli && p.poliSakit);
    if (!ps) return jawab(res, 201, 'Peserta tidak ditemukan');
    if (!ps.aktif) return jawab(res, 201, `Kepesertaan tidak aktif: ${ps.ketAktif}`);
    if (ps.kdProviderPst?.kdProvider !== D.PROVIDER_SENDIRI.kdProvider) return jawab(res, 201, `Peserta terdaftar di ${ps.kdProviderPst?.nmProvider ?? 'faskes lain'}, bukan di faskes ini`);
    if (!poli) return jawab(res, 201, 'Poli tidak ditemukan');
    const tanggalperiksa = tanggalWib(b.tanggal === 'besok' ? 1 : 0);
    const tglDaftar = tanggalPcare(tanggalperiksa);
    if (store.pendaftaran.some((p) => p.noKartu === ps.noKartu && p.tglDaftar === tglDaftar && p.kdPoli === poli.kdPoli)) return jawab(res, 201, 'Anda sudah terdaftar pada poli dan tanggal ini');
    const noUrut = nomorUrutBerikut(store, tglDaftar, poli.kdPoli);
    store.pendaftaran.push({
      kdProviderPeserta: D.PROVIDER_SENDIRI.kdProvider, tglDaftar, noKartu: ps.noKartu, kdPoli: poli.kdPoli, keluhan: String(b.keluhan ?? '').trim() || 'Pendaftaran lewat Mobile JKN', kunjSakit: true,
      sistole: 0, diastole: 0, beratBadan: 0, tinggiBadan: 0, respRate: 0, lingkarPerut: 0, heartRate: 0, rujukBalik: 0, kdTkp: '10', noUrut, sumber: 'mobile_jkn',
    });
    store.antrean.push({
      nomorkartu: ps.noKartu, nik: ps.noKTP, nohp: ps.noHP, kodepoli: poli.kdPoli, namapoli: poli.nmPoli, norm: '', tanggalperiksa, kodedokter: 0, namadokter: '', jampraktek: '',
      nomorantrean: noUrut, angkaantrean: Number(noUrut), keterangan: '', sumber: 'mobile_jkn', status: 'menunggu',
      riwayat: [{ waktu: new Date().toISOString(), peristiwa: 'Diambil lewat Mobile JKN' }],
    });
    return jawab(res, 200, 'Ok', { nomorantrean: noUrut, namapoli: poli.nmPoli, tanggalperiksa });
  });
  // Batal: pendaftaran dihapus dari PCare; klinik mengetahuinya pada penarikan berikutnya.
  rute.post('/api/batal', (req, res) => {
    const b = req.body ?? {};
    const kunci = { nomorkartu: b.noKartu, kodepoli: b.kodepoli, tanggalperiksa: b.tanggalperiksa };
    const tglDaftar = tanggalPcare(String(b.tanggalperiksa ?? ''));
    const i = store.pendaftaran.findIndex((p) => p.noKartu === b.noKartu && p.tglDaftar === tglDaftar && p.kdPoli === b.kodepoli);
    if (i < 0) return jawab(res, 201, 'Pendaftaran tidak ditemukan');
    if (store.kunjungan.some((x) => x.noKartu === b.noKartu && x.tglDaftar === tglDaftar && x.kdPoli === b.kodepoli)) return jawab(res, 201, 'Pendaftaran sudah dilayani');
    store.pendaftaran.splice(i, 1);
    const a = cariAntreanAktif(store, kunci);
    if (a) {
      a.status = 'batal';
      a.riwayat.push({ waktu: new Date().toISOString(), peristiwa: 'Dibatalkan peserta lewat Mobile JKN' });
    }
    return jawab(res, 200, 'Ok');
  });
  app.use('/mobile-jkn', rute);
}
