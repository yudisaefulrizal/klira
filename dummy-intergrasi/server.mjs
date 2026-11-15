// service-dummy: PCare dan SATUSEHAT tiruan, masing-masing pada port sendiri.
// Pemakaian: node dummy-intergrasi/server.mjs   (atau npm run service-dummy)
//   PCare     : http://localhost:8075/pcare-rest/...                         (ubah dengan DUMMY_PORT_PCARE)
//               http://localhost:8075/antreanfktp/... (antrean online) dan http://localhost:8075/mobile-jkn/ (simulator Mobile JKN)
//   SATUSEHAT : http://localhost:8076/oauth2/v1, /fhir-r4/v1, /kfa-v2, /kyc/v1 (ubah dengan DUMMY_PORT_SATUSEHAT)
import { buatAplikasiPcare } from './p-care/pcare.js';
import { buatAplikasiSatusehat } from './satusehat/satusehat.js';

export const NAMA_LAYANAN = 'service-dummy';
export const PORT_PCARE = 8075;
export const PORT_SATUSEHAT = 8076;

export function buatLayananDummy(opsi = {}) {
  return { pcare: buatAplikasiPcare(opsi.pcare), satusehat: buatAplikasiSatusehat(opsi.satusehat) };
}

const dengar = (app, port) => new Promise((selesai, gagal) => {
  const server = app.listen(port, () => selesai(server));
  server.once('error', gagal);
});

export async function jalankanLayananDummy({ portPcare = PORT_PCARE, portSatusehat = PORT_SATUSEHAT, opsi } = {}) {
  const { pcare, satusehat } = buatLayananDummy(opsi);
  const servers = [await dengar(pcare, portPcare), await dengar(satusehat, portSatusehat)];
  return { pcare, satusehat, tutup: () => Promise.all(servers.map((s) => new Promise((selesai) => s.close(selesai)))) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const portPcare = Number(process.env.DUMMY_PORT_PCARE) || PORT_PCARE;
  const portSatusehat = Number(process.env.DUMMY_PORT_SATUSEHAT) || PORT_SATUSEHAT;
  try {
    const { pcare, satusehat } = await jalankanLayananDummy({ portPcare, portSatusehat });
    const p = pcare.konfig;
    const s = satusehat.konfig;
    console.log(`${NAMA_LAYANAN} siap`);
    console.log(`PCare     : http://localhost:${portPcare}  service_name=${p.serviceName} cons_id=${p.consId} secret_key=${p.secretKey} user_key=${p.userKey}`);
    console.log(`            username=${p.username} password=${p.password} app_code=${p.appCode}`);
    console.log(`Antrean   : http://localhost:${portPcare}/${p.antreanServiceName}  (header dan kredensial sama dengan PCare)`);
    console.log(`Mobile JKN: http://localhost:${portPcare}/mobile-jkn/  (simulator HP peserta; pendaftarannya ditarik klinik lewat PCare)`);
    console.log(`SATUSEHAT : http://localhost:${portSatusehat}  client_id=${s.clientId} client_secret=${s.clientSecret} organization_id=${s.organizationId}`);
  } catch (galat) {
    console.error(`${NAMA_LAYANAN} gagal mulai: ${galat.message}`);
    process.exit(1);
  }
}
