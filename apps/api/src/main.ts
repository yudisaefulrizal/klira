import { buatApp } from './app';
import { bacaKonfigurasi } from './config/lingkungan';

const { port, baseUrl } = bacaKonfigurasi();
buatApp().listen(port, () => {
  console.log(`Klira berjalan di port ${port} (${baseUrl})`);
});
