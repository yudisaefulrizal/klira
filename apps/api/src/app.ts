import { readFile } from 'node:fs/promises';
import { bacaKlinikPublik } from './modul/website-klinik/data-access/data';
import { htmlKlinikPublik } from './modul/website-klinik/domain/html';
import { buatRuteWebsitePublik, buatRuteWebsitePengaturan } from './modul/website-klinik/entry-points/rute';
import { buatRuteLayarPanggilan } from './modul/layar-panggilan/entry-points/rute';
import { GalatMeta } from './modul/instagram/domain/meta';
import { buatRuteInstagram } from './modul/instagram/entry-points/rute';
import { buatRuteInstagramPublik } from './modul/instagram/entry-points/publik';
import { buatRuteStatistik } from './modul/statistik/entry-points/rute';
import path from 'path';
import express from 'express';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { GALAT } from '@klira/shared';
import type { ResponsGalat } from '@klira/shared';
import { blokirSelamaWajibGanti } from './middleware/auth';
import { PenampungAuditMysql } from './middleware/audit';
import { buatLayananAkses } from './modul/akses/domain/layanan';
import type { LayananAkses } from './modul/akses/domain/layanan';
import { PembatasPercobaan } from './modul/akses/domain/pembatas';
import { RepositoriAksesMysql } from './modul/akses/data-access/repositori';
import { buatRuteAkses } from './modul/akses/entry-points/rute';
import { buatLayananIzin } from './modul/akses/domain/layanan-izin';
import type { LayananIzin } from './modul/akses/domain/layanan-izin';
import { RepositoriIzinMysql } from './modul/akses/data-access/repositori-izin';
import { buatRuteIzin } from './modul/akses/entry-points/rute-izin';
import { bacaPengaturanKeamanan, buatLayananKeamanan } from './modul/keamanan/domain/layanan';
import { RepositoriKeamananMysql } from './modul/keamanan/data-access/repositori';
import { buatRuteKeamanan } from './modul/keamanan/entry-points/rute';
import { buatLayananAudit } from './modul/audit/domain/layanan';
import { RepositoriAuditMysql } from './modul/audit/data-access/repositori';
import { buatRuteAudit } from './modul/audit/entry-points/rute';
import { buatLayananMaster } from './modul/master/domain/layanan';
import { RepositoriMasterMysql } from './modul/master/data-access/repositori';
import { buatRuteMaster } from './modul/master/entry-points/rute';
import { buatLayananFasyankes } from './modul/fasyankes/domain/layanan';
import { RepositoriFasyankesMysql } from './modul/fasyankes/data-access/repositori';
import { buatRuteFasyankes } from './modul/fasyankes/entry-points/rute';
import { buatLayananPasien } from './modul/pasien/domain/layanan';
import { RepositoriPasienMysql } from './modul/pasien/data-access/repositori';
import { buatRutePasien } from './modul/pasien/entry-points/rute';
import { buatLayananKunjungan } from './modul/kunjungan/domain/layanan';
import { RepositoriKunjunganMysql } from './modul/kunjungan/data-access/repositori';
import { buatRuteKunjungan } from './modul/kunjungan/entry-points/rute';
import { buatLayananPengesahan } from './modul/rekam-medis/domain/layanan';
import { RepositoriPengesahanMysql } from './modul/rekam-medis/data-access/repositori';
import { buatRutePengesahan } from './modul/rekam-medis/entry-points/rute';
import { buatLayananKlinis } from './modul/klinis/domain/layanan';
import { buatLayananRm } from './modul/rekam-medis/domain/layanan-rm';
import { RepositoriRmMysql } from './modul/rekam-medis/data-access/repositori-rm';
import { buatRuteRm } from './modul/rekam-medis/entry-points/rute-rm';
import { buatLayananDokumen } from './modul/rekam-medis/domain/layanan-dokumen';
import { RepositoriDokumenMysql } from './modul/rekam-medis/data-access/repositori-dokumen';
import { buatRuteDokumen } from './modul/rekam-medis/entry-points/rute-dokumen';
import { buatLayananPdp } from './modul/pdp/domain/layanan';
import { RepositoriPdpMysql } from './modul/pdp/data-access/repositori';
import { buatRutePdp } from './modul/pdp/entry-points/rute';
import { buatLayananKlaim } from './modul/klaim/domain/layanan';
import { RepositoriKlaimMysql } from './modul/klaim/data-access/repositori';
import { buatRuteKlaim } from './modul/klaim/entry-points/rute';
import { buatLayananRawatInap } from './modul/rawat-inap/domain/layanan';
import { RepositoriRawatInapMysql } from './modul/rawat-inap/data-access/repositori';
import { buatRuteRawatInap } from './modul/rawat-inap/entry-points/rute';
import { RepositoriKlinisMysql } from './modul/klinis/data-access/repositori';
import { buatRuteKlinis } from './modul/klinis/entry-points/rute';
import { buatLayananAddendum } from './modul/rekam-medis/domain/layanan-addendum';
import { RepositoriAddendumMysql } from './modul/rekam-medis/data-access/repositori-addendum';
import { buatRuteAddendum } from './modul/rekam-medis/entry-points/rute-addendum';
import { buatLayananTagihan } from './modul/kasir/domain/layanan';
import { RepositoriTagihanMysql } from './modul/kasir/data-access/repositori';
import { buatRuteKasir } from './modul/kasir/entry-points/rute';
import { buatLayananFarmasi } from './modul/farmasi/domain/layanan';
import { RepositoriFarmasiMysql } from './modul/farmasi/data-access/repositori';
import { buatRuteFarmasi } from './modul/farmasi/entry-points/rute';
import { buatLayananKasir } from './modul/kasir/domain/layanan-kasir';
import { RepositoriKasirMysql } from './modul/kasir/data-access/repositori-kasir';
import { buatRuteKasirLengkap } from './modul/kasir/entry-points/rute-kasir';
import { buatLayananPenunjang } from './modul/penunjang/domain/layanan';
import { RepositoriPenunjangMysql } from './modul/penunjang/data-access/repositori';
import { buatRutePenunjang } from './modul/penunjang/entry-points/rute';
import { buatLayananPersetujuan } from './modul/persetujuan/domain/layanan';
import { RepositoriPersetujuanMysql } from './modul/persetujuan/data-access/repositori';
import { buatRutePersetujuan } from './modul/persetujuan/entry-points/rute';
import { buatLayananPengguna } from './modul/pengguna/domain/layanan';
import { RepositoriPenggunaMysql } from './modul/pengguna/data-access/repositori';
import { buatLayananPembuatanAkun } from './modul/pengguna/domain/pembuatan';
import { RepositoriAkunBaruMysql } from './modul/pengguna/data-access/repositori-baru';
import { buatRutePengguna } from './modul/pengguna/entry-points/rute';

import { buatRuteWhatsapp } from './modul/whatsapp/entry-points/rute';

const direktoriWebBawaan = path.resolve(__dirname, '../../web/dist');

export type OpsiApp = { layananAkses?: LayananAkses; layananIzin?: LayananIzin; baseUrl?: string; frontend?: RequestHandler };

export function buatApp(direktoriWeb: string = direktoriWebBawaan, opsi: OpsiApp = {}) {
  const app = express();
  app.set('trust proxy', true);
  app.use('/api/instagram', express.json({ limit: '12mb' }));
  app.use('/api/whatsapp', express.json({ limit: '12mb' }));
  const repoKeamanan = new RepositoriKeamananMysql();
  const layananAkses =
    opsi.layananAkses ??
    buatLayananAkses({
      repo: new RepositoriAksesMysql(),
      audit: new PenampungAuditMysql(),
      pembatas: new PembatasPercobaan(),
      bacaPengaturan: (fasyankesId) => bacaPengaturanKeamanan(repoKeamanan, fasyankesId),
    });
  app.locals.layananAkses = layananAkses;
  app.use(buatRuteInstagramPublik(layananAkses));
  app.use(express.json({ limit: '100kb' }));
  const layananIzin = opsi.layananIzin ?? buatLayananIzin({ repo: new RepositoriIzinMysql(), audit: new PenampungAuditMysql() });
  app.get('/api/kesehatan', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api', buatRuteAkses(layananAkses, opsi.baseUrl ?? process.env.BASE_URL ?? 'http://localhost'));
  app.use('/api', buatRuteLayarPanggilan());
  app.use('/api', buatRuteWebsitePublik());
  // Semua rute di bawah ini ditolak selama akun wajib ganti kredensial.
  app.use('/api', blokirSelamaWajibGanti(layananAkses));
  app.use('/api', buatRuteWebsitePengaturan(layananAkses, layananIzin));
  app.use('/api', buatRuteStatistik(layananAkses, layananIzin));
  app.use('/api', buatRuteWhatsapp(layananAkses, layananIzin));
  app.use('/api', buatRuteInstagram(layananAkses, layananIzin));
  app.use('/api', buatRuteIzin(layananAkses, layananIzin));
  app.use('/api', buatRuteKeamanan(layananAkses, layananIzin, buatLayananKeamanan({ repo: repoKeamanan, audit: new PenampungAuditMysql() })));
  app.use('/api', buatRuteMaster(layananAkses, layananIzin, buatLayananMaster({ repo: new RepositoriMasterMysql(), audit: new PenampungAuditMysql() })));
  app.use('/api', buatRuteFasyankes(layananAkses, layananIzin, buatLayananFasyankes({ repo: new RepositoriFasyankesMysql(), audit: new PenampungAuditMysql() })));
  app.use('/api', buatRutePasien(layananAkses, layananIzin, buatLayananPasien({ repo: new RepositoriPasienMysql(), audit: new PenampungAuditMysql() })));
  const layananKunjungan = buatLayananKunjungan({ repo: new RepositoriKunjunganMysql(), audit: new PenampungAuditMysql() });
  app.use('/api', buatRuteKunjungan(layananAkses, layananIzin, layananKunjungan));
  // Pengesahan catatan generik (dipakai ulang CPPT, resume, hasil lab nanti) dan modul klinis yang mendaftarkan penyedia isinya.
  const layananPengesahan = buatLayananPengesahan({ repo: new RepositoriPengesahanMysql(), audit: new PenampungAuditMysql() });
  const repoKlinis = new RepositoriKlinisMysql();
  const layananKlinis = buatLayananKlinis({ repo: repoKlinis, audit: new PenampungAuditMysql(), pengesahan: layananPengesahan, kunjungan: layananKunjungan });
  app.use('/api', buatRuteKlinis(layananAkses, layananIzin, layananKlinis));
  const repoRm = new RepositoriRmMysql();
  app.use('/api', buatRuteRm(layananAkses, layananIzin, buatLayananRm({
    repo: repoRm, pengesahanRepo: new RepositoriPengesahanMysql(), klinis: layananKlinis, baca: repoKlinis, audit: new PenampungAuditMysql(),
  })));
  const repoDokumen = new RepositoriDokumenMysql();
  const layananDokumen = buatLayananDokumen({ repo: repoDokumen, repoRm, pengesahan: layananPengesahan, baca: repoKlinis, audit: new PenampungAuditMysql() });
  app.use('/api', buatRuteDokumen(layananAkses, layananIzin, layananDokumen));
  app.use('/api', buatRutePdp(layananAkses, layananIzin, buatLayananPdp({ repo: new RepositoriPdpMysql(), audit: new PenampungAuditMysql() })));
  app.use('/api', buatRuteKlaim(layananAkses, layananIzin, buatLayananKlaim({
    repo: new RepositoriKlaimMysql(), rm: { resumeAda: (fas, ids) => repoDokumen.resumeAda(fas, ids) }, baca: repoKlinis, audit: new PenampungAuditMysql(),
  })));
  app.use('/api', buatRuteRawatInap(layananAkses, layananIzin, buatLayananRawatInap({
    repo: new RepositoriRawatInapMysql(), pengesahan: layananPengesahan, audit: new PenampungAuditMysql(), simpanResume: layananDokumen.simpanResume,
  })));
  // Addendum generik, penunjang (order, spesimen, hasil), persetujuan tindakan, dan tagihan dasar.
  const layananAddendum = buatLayananAddendum({ repo: new RepositoriAddendumMysql(), audit: new PenampungAuditMysql(), pengesahan: layananPengesahan });
  app.use('/api', buatRuteAddendum(layananAkses, layananIzin, layananAddendum));
  app.use('/api', buatRutePenunjang(layananAkses, layananIzin, buatLayananPenunjang({
    repo: new RepositoriPenunjangMysql(), audit: new PenampungAuditMysql(), pengesahan: layananPengesahan, addendum: layananAddendum,
  })));
  app.use('/api', buatRutePersetujuan(layananAkses, layananIzin, buatLayananPersetujuan({
    repo: new RepositoriPersetujuanMysql(), audit: new PenampungAuditMysql(),
    tindakanKunjungan: async (fas, id) => ((await repoKlinis.bacaBagian(fas, id, 'tindakan'))?.item ?? []).map((t) => ({ kode: t.kode, nama: t.nama })),
  })));
  app.use('/api', buatRuteFarmasi(layananAkses, layananIzin, buatLayananFarmasi({ repo: new RepositoriFarmasiMysql(), audit: new PenampungAuditMysql() })));
  const repoFarmasi = new RepositoriFarmasiMysql();
  app.use('/api', buatRuteKasirLengkap(layananAkses, layananIzin, buatLayananKasir({ repo: new RepositoriKasirMysql(), farmasi: repoFarmasi, audit: new PenampungAuditMysql() })));
  app.use('/api', buatRuteKasir(layananAkses, layananIzin, buatLayananTagihan({ repo: new RepositoriTagihanMysql(), audit: new PenampungAuditMysql() })));
  app.use('/api', buatRutePengesahan(layananAkses, layananIzin, layananPengesahan));
  app.use('/api', buatRuteAudit(layananAkses, layananIzin, buatLayananAudit({ repo: new RepositoriAuditMysql(), audit: new PenampungAuditMysql() })));
  app.use('/api', buatRutePengguna(layananAkses, layananIzin, buatLayananPengguna({ repo: new RepositoriPenggunaMysql(), audit: new PenampungAuditMysql() }),
    buatLayananPembuatanAkun({ repo: new RepositoriAkunBaruMysql(), repoIzin: new RepositoriIzinMysql(), audit: new PenampungAuditMysql() })));
  app.use('/api', (_req, res) => {
    res.status(404).json({ galat: 'Rute tidak ditemukan' });
  });
  const penangananGalat: ErrorRequestHandler = (galat, _req, res, next) => {
    if (res.headersSent) return next(galat);
    if (galat instanceof GalatMeta) {
      res.status(galat.status).json({ galat: { kode: 'instagram_meta', pesan: galat.message } });
      return;
    }
    console.error(galat);
    const badan: ResponsGalat = { galat: { kode: 'galat_server', pesan: GALAT.umum } };
    res.status(galat?.type === 'entity.parse.failed' ? 400 : 500).json(badan);
  };
  if (opsi.frontend) {
    app.use(opsi.frontend);
    app.use(penangananGalat);
    return app;
  }
  app.get(['/', '/klinik/:slug'], async (req, res, next) => {
    try {
      const slug = typeof req.params.slug === 'string' ? req.params.slug : undefined;
      const data = slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? null : await bacaKlinikPublik(req.hostname, slug);
      const html = await readFile(path.join(direktoriWeb, 'index.html'), 'utf8');
      res.setHeader('Cache-Control', 'no-store');
      res.status(data ? 200 : 404).type('html').send(htmlKlinikPublik(html, data));
    } catch (e) { next(e); }
  });
  app.use(express.static(direktoriWeb));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    res.sendFile(path.join(direktoriWeb, 'index.html'), (galat) => {
      if (galat) next();
    });
  });
  app.use(penangananGalat);
  return app;
}
