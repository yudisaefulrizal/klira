import path from 'path';
import express from 'express';

const direktoriWebBawaan = path.resolve(__dirname, '../../web/dist');

export function buatApp(direktoriWeb: string = direktoriWebBawaan) {
  const app = express();
  app.set('trust proxy', true);
  app.get('/api/kesehatan', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api', (_req, res) => {
    res.status(404).json({ galat: 'Rute tidak ditemukan' });
  });
  app.use(express.static(direktoriWeb));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    res.sendFile(path.join(direktoriWeb, 'index.html'), (galat) => {
      if (galat) next();
    });
  });
  return app;
}
