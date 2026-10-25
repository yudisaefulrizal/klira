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

const direktoriWebBawaan = path.resolve(__dirname, '../../web/dist');

export type OpsiApp = { layananAkses?: LayananAkses; baseUrl?: string };

export function buatApp(direktoriWeb: string = direktoriWebBawaan, opsi: OpsiApp = {}) {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '100kb' }));
  const layananAkses =
    opsi.layananAkses ??
    buatLayananAkses({
      repo: new RepositoriAksesPrisma(),
      audit: new PenampungAuditPrisma(),
      pembatas: new PembatasPercobaan(),
    });
  app.get('/api/kesehatan', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api', buatRuteAkses(layananAkses, opsi.baseUrl ?? process.env.BASE_URL ?? 'http://localhost'));
  // Semua rute di bawah ini ditolak selama akun wajib ganti kredensial.
  app.use('/api', blokirSelamaWajibGanti(layananAkses));
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
