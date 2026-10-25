import path from 'path';
import express from 'express';
import type { ErrorRequestHandler } from 'express';
import { GALAT } from '@klira/shared';
import type { ResponsGalat } from '@klira/shared';
import { blokirSelamaWajibGanti } from './middleware/auth';
import { PenampungAuditPrisma } from './middleware/audit';
import { buatLayananAkses } from './modul/akses/layanan';
import type { LayananAkses } from './modul/akses/layanan';
import { PembatasPercobaan } from './modul/akses/pembatas';
import { RepositoriAksesPrisma } from './modul/akses/repositori';
import { buatRuteAkses } from './modul/akses/rute';
import { buatLayananIzin } from './modul/akses/layanan-izin';
import type { LayananIzin } from './modul/akses/layanan-izin';
import { RepositoriIzinPrisma } from './modul/akses/repositori-izin';
import { buatRuteIzin } from './modul/akses/rute-izin';
import { bacaPengaturanKeamanan, buatLayananKeamanan } from './modul/keamanan/layanan';
import { RepositoriKeamananPrisma } from './modul/keamanan/repositori';
import { buatRuteKeamanan } from './modul/keamanan/rute';
import { buatLayananAudit } from './modul/audit/layanan';
import { RepositoriAuditPrisma } from './modul/audit/repositori';
import { buatRuteAudit } from './modul/audit/rute';
import { buatLayananMaster } from './modul/master/layanan';
import { RepositoriMasterPrisma } from './modul/master/repositori';
import { buatRuteMaster } from './modul/master/rute';
import { buatLayananFasyankes } from './modul/fasyankes/layanan';
import { RepositoriFasyankesPrisma } from './modul/fasyankes/repositori';
import { buatRuteFasyankes } from './modul/fasyankes/rute';
import { buatLayananPasien } from './modul/pasien/layanan';
import { RepositoriPasienPrisma } from './modul/pasien/repositori';
import { buatRutePasien } from './modul/pasien/rute';
import { buatLayananKunjungan } from './modul/kunjungan/layanan';
import { RepositoriKunjunganPrisma } from './modul/kunjungan/repositori';
import { buatRuteKunjungan } from './modul/kunjungan/rute';
import { buatLayananPengguna } from './modul/pengguna/layanan';
import { RepositoriPenggunaPrisma } from './modul/pengguna/repositori';
import { buatLayananPembuatanAkun } from './modul/pengguna/pembuatan';
import { RepositoriAkunBaruPrisma } from './modul/pengguna/repositori-baru';
import { buatRutePengguna } from './modul/pengguna/rute';

const direktoriWebBawaan = path.resolve(__dirname, '../../web/dist');

export type OpsiApp = { layananAkses?: LayananAkses; layananIzin?: LayananIzin; baseUrl?: string };

export function buatApp(direktoriWeb: string = direktoriWebBawaan, opsi: OpsiApp = {}) {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '100kb' }));
  const repoKeamanan = new RepositoriKeamananPrisma();
  const layananAkses =
    opsi.layananAkses ??
    buatLayananAkses({
      repo: new RepositoriAksesPrisma(),
      audit: new PenampungAuditPrisma(),
      pembatas: new PembatasPercobaan(),
      bacaPengaturan: (fasyankesId) => bacaPengaturanKeamanan(repoKeamanan, fasyankesId),
    });
  const layananIzin = opsi.layananIzin ?? buatLayananIzin({ repo: new RepositoriIzinPrisma(), audit: new PenampungAuditPrisma() });
  app.get('/api/kesehatan', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api', buatRuteAkses(layananAkses, opsi.baseUrl ?? process.env.BASE_URL ?? 'http://localhost'));
  // Semua rute di bawah ini ditolak selama akun wajib ganti kredensial.
  app.use('/api', blokirSelamaWajibGanti(layananAkses));
  app.use('/api', buatRuteIzin(layananAkses, layananIzin));
  app.use('/api', buatRuteKeamanan(layananAkses, layananIzin, buatLayananKeamanan({ repo: repoKeamanan, audit: new PenampungAuditPrisma() })));
  app.use('/api', buatRuteMaster(layananAkses, layananIzin, buatLayananMaster({ repo: new RepositoriMasterPrisma(), audit: new PenampungAuditPrisma() })));
  app.use('/api', buatRuteFasyankes(layananAkses, layananIzin, buatLayananFasyankes({ repo: new RepositoriFasyankesPrisma(), audit: new PenampungAuditPrisma() })));
  app.use('/api', buatRutePasien(layananAkses, layananIzin, buatLayananPasien({ repo: new RepositoriPasienPrisma(), audit: new PenampungAuditPrisma() })));
  app.use('/api', buatRuteKunjungan(layananAkses, layananIzin, buatLayananKunjungan({ repo: new RepositoriKunjunganPrisma(), audit: new PenampungAuditPrisma() })));
  app.use('/api', buatRuteAudit(layananAkses, layananIzin, buatLayananAudit({ repo: new RepositoriAuditPrisma(), audit: new PenampungAuditPrisma() })));
  app.use('/api', buatRutePengguna(layananAkses, layananIzin, buatLayananPengguna({ repo: new RepositoriPenggunaPrisma(), audit: new PenampungAuditPrisma() }),
    buatLayananPembuatanAkun({ repo: new RepositoriAkunBaruPrisma(), repoIzin: new RepositoriIzinPrisma(), audit: new PenampungAuditPrisma() })));
  app.use('/api', (_req, res) => {
    res.status(404).json({ galat: 'Rute tidak ditemukan' });
  });
  const penangananGalat: ErrorRequestHandler = (galat, _req, res, next) => {
    if (res.headersSent) return next(galat);
    console.error(galat);
    const badan: ResponsGalat = { galat: { kode: 'galat_server', pesan: GALAT.umum } };
    res.status(galat?.type === 'entity.parse.failed' ? 400 : 500).json(badan);
  };
  app.use('/api', penangananGalat);
  app.use(express.static(direktoriWeb));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    res.sendFile(path.join(direktoriWeb, 'index.html'), (galat) => {
      if (galat) next();
    });
  });
  return app;
}
