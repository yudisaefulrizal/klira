import { temaTersimpan, terapkanTema } from './util/tema.js';

terapkanTema(temaTersimpan());
const wadah = document.getElementById('root');
const path = window.location.pathname;
if (path === '/' || /^\/klinik\/[a-z0-9-]+\/?$/.test(path)) {
  const { pasangKlinikPublik } = await import('./halaman/klinik-publik.js');
  pasangKlinikPublik(wadah, path === '/' ? undefined : path.split('/')[2]);
} else if (/^\/layar-panggilan(?:\/|$)/.test(path)) {
  const { pasangLayarPanggilan } = await import('./halaman/layar-panggilan.js');
  pasangLayarPanggilan(wadah);
} else if (path === '/masuk' || path === '/ganti-kredensial') {
  const { pasangAkses } = await import('./halaman/akses.js');
  await pasangAkses(wadah, path);
} else {
  const { pasangAplikasiInternal } = await import('./app-internal.js');
  await pasangAplikasiInternal(wadah);
}
