// Layanan antrean tiruan dan simulator Mobile JKN, diuji di memori tanpa membuka port.
import { buatAplikasiPcare, KONFIG_PCARE_BAWAAN as K } from './pcare.js';
import { buatAuthorization, buatSignature, dekripsiRespons } from './pcare-crypto.js';
import { tanggalWib } from './mobile-jkn.js';
import { panggilTanpaPort } from '../../apps/api/src/umum/panggil-tanpa-port.js';

const BUDI = '0000039043765';
const HARI_INI = tanggalWib(0);
const pcareTanggal = (t) => t.split('-').reverse().join('-');

/** Klien layanan antrean: header sama dengan PCare, amplop memakai `metadata`. */
async function antrean(app, metode, jalur, body, ubahHeader = {}) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const headers = {
    'X-cons-id': K.consId, 'X-Timestamp': timestamp, 'X-Signature': buatSignature(K.consId, timestamp, K.secretKey), user_key: K.userKey,
    'X-Authorization': buatAuthorization(K.username, K.password, K.appCode), 'Content-Type': 'text/plain', ...ubahHeader,
  };
  const h = await panggilTanpaPort(app, { metode, url: `/${K.antreanServiceName}${jalur}`, headers, badan: body });
  const json = await h.json();
  if (typeof json.response === 'string') json.response = dekripsiRespons(json.response, K.consId, K.secretKey, timestamp);
  return { status: h.status, ...json };
}
const tambahBaku = { nomorkartu: BUDI, nik: '3201010101800001', nohp: '0812', kodepoli: '001', namapoli: 'Umum', norm: 'RM-1', tanggalperiksa: HARI_INI, kodedokter: 123123, namadokter: 'dr. Contoh Satu', jampraktek: '08:00-16:00', nomorantrean: 'U-001', angkaantrean: 1, keterangan: '' };

describe('layanan antrean tiruan', () => {
  it('menolak tanpa header yang sah dan tidak mengganggu layanan PCare', async () => {
    const app = buatAplikasiPcare();
    expect(await antrean(app, 'POST', '/antrean/add', tambahBaku, { user_key: 'salah' })).toMatchObject({ status: 401, metadata: { code: 401 } });
    const pcare = await panggilTanpaPort(app, { url: `/${K.serviceName}/kesadaran` });
    expect((await pcare.json()).metaData.code).toBe(401);
  });
  it('referensi poli dan dokter', async () => {
    const app = buatAplikasiPcare();
    const poli = await antrean(app, 'GET', `/ref/poli/tanggal/${HARI_INI}`);
    expect(poli.metadata.code).toBe(200);
    expect(poli.response.list).toContainEqual({ namapoli: 'Umum', kodepoli: '001' });
    expect((await antrean(app, 'GET', `/ref/dokter/kodepoli/001/tanggal/${HARI_INI}`)).response.list[0]).toMatchObject({ kodedokter: 123123, namadokter: 'dr. Contoh Satu' });
    expect((await antrean(app, 'GET', '/ref/poli/tanggal/14-11-2026')).metadata.code).toBe(201);
  });
  it('tambah, panggil, lalu batal; gagal memakai kode 201', async () => {
    const app = buatAplikasiPcare();
    expect((await antrean(app, 'POST', '/antrean/add', tambahBaku)).metadata).toEqual({ code: 200, message: 'Ok' });
    expect((await antrean(app, 'POST', '/antrean/add', tambahBaku)).metadata.code).toBe(201);
    expect((await antrean(app, 'POST', '/antrean/add', { ...tambahBaku, nomorkartu: '0000039043767' })).metadata.message).toContain('tidak aktif');
    const kunci = { tanggalperiksa: HARI_INI, kodepoli: '001', nomorkartu: BUDI };
    expect((await antrean(app, 'POST', '/antrean/panggil', { ...kunci, status: 3, waktu: 1 })).metadata.code).toBe(201);
    expect((await antrean(app, 'POST', '/antrean/panggil', { ...kunci, status: 1, waktu: 1700000000000 })).metadata.code).toBe(200);
    expect(app.store.antrean[0]).toMatchObject({ status: 'dipanggil', sumber: 'faskes' });
    expect((await antrean(app, 'POST', '/antrean/batal', { ...kunci, alasan: 'Dokter berhalangan' })).metadata.code).toBe(200);
    expect(app.store.antrean[0]).toMatchObject({ status: 'batal', alasanBatal: 'Dokter berhalangan' });
    expect((await antrean(app, 'POST', '/antrean/batal', kunci)).metadata).toEqual({ code: 201, message: 'Antrean tidak ditemukan' });
  });
});

describe('simulator Mobile JKN', () => {
  const rakit = () => {
    const app = buatAplikasiPcare();
    const hp = async (jalur, badan) => (await panggilTanpaPort(app, { metode: badan === undefined ? 'GET' : 'POST', url: `/mobile-jkn/api/${jalur}`, badan })).json();
    return { app, hp };
  };
  /** Klinik menarik pendaftaran lewat PCare (header PCare, amplop metaData). */
  async function tarik(app, tanggal) {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const headers = { 'X-cons-id': K.consId, 'X-Timestamp': timestamp, 'X-Signature': buatSignature(K.consId, timestamp, K.secretKey), user_key: K.userKey, 'X-Authorization': buatAuthorization(K.username, K.password, K.appCode) };
    const json = await (await panggilTanpaPort(app, { url: `/${K.serviceName}/pendaftaran/tglDaftar/${pcareTanggal(tanggal)}/0/100`, headers })).json();
    return { kode: json.metaData.code, list: typeof json.response === 'string' ? dekripsiRespons(json.response, K.consId, K.secretKey, timestamp).list : [] };
  }

  it('halaman dan keadaan awal tersedia', async () => {
    const { app, hp } = rakit();
    const halaman = await panggilTanpaPort(app, { url: '/mobile-jkn/' });
    expect(halaman.status).toBe(200);
    expect(halaman.teks).toContain('Mobile JKN');
    const k = await hp('keadaan');
    expect(k).toMatchObject({ hariIni: HARI_INI, besok: tanggalWib(1), antrean: [], pendaftaran: [], tarikanPendaftaran: null });
    expect(k.peserta.find((p) => p.noKartu === BUDI)).toMatchObject({ aktif: true, terdaftarDiSini: true });
  });
  it('ambil antrean menulis pendaftaran PCare yang bisa ditarik klinik, lengkap dengan data peserta', async () => {
    const { app, hp } = rakit();
    expect(await hp('ambil', { noKartu: BUDI, kodepoli: '001', keluhan: 'Batuk' })).toEqual({ metadata: { code: 200, message: 'Ok' }, response: { nomorantrean: '001', namapoli: 'Umum', tanggalperiksa: HARI_INI } });
    const h = await tarik(app, HARI_INI);
    expect(h.kode).toBe(200);
    expect(h.list).toHaveLength(1);
    expect(h.list[0]).toMatchObject({ tglDaftar: pcareTanggal(HARI_INI), noUrut: '001', keluhan: 'Batuk', poli: { kdPoli: '001', nmPoli: 'Umum' }, peserta: { noKartu: BUDI, nama: 'BUDI CONTOH', sex: 'L', tglLahir: '01-01-1980', noKTP: '3201010101800001' } });
    const k = await hp('keadaan');
    expect(k.antrean[0]).toMatchObject({ nomorkartu: BUDI, nomorantrean: '001', sumber: 'mobile_jkn', status: 'menunggu', tanggalperiksa: HARI_INI });
    expect(k.tarikanPendaftaran).toMatchObject({ tanggal: pcareTanggal(HARI_INI) });
  });
  it('besok tercatat pada tanggal besok dan tidak muncul di penarikan hari ini', async () => {
    const { app, hp } = rakit();
    expect((await hp('ambil', { noKartu: BUDI, kodepoli: '001', tanggal: 'besok' })).response.tanggalperiksa).toBe(tanggalWib(1));
    expect((await tarik(app, HARI_INI)).kode).toBe(204);
    expect((await tarik(app, tanggalWib(1))).list).toHaveLength(1);
  });
  it('menolak peserta tidak aktif, peserta faskes lain, poli tidak dikenal, dan pendaftaran ganda', async () => {
    const { app, hp } = rakit();
    expect((await hp('ambil', { noKartu: '0000039043767', kodepoli: '001' })).metadata.message).toContain('tidak aktif');
    expect((await hp('ambil', { noKartu: '0000039043768', kodepoli: '001' })).metadata.message).toContain('KLINIK LAIN');
    expect((await hp('ambil', { noKartu: BUDI, kodepoli: '999' })).metadata).toEqual({ code: 201, message: 'Poli tidak ditemukan' });
    expect((await hp('ambil', { noKartu: BUDI, kodepoli: '001' })).metadata.code).toBe(200);
    expect((await hp('ambil', { noKartu: BUDI, kodepoli: '001' })).metadata.code).toBe(201);
    expect(app.store.pendaftaran).toHaveLength(1);
  });
  it('batal menghapus pendaftaran dari PCare; nomor urut tidak dipakai ulang; panggilan klinik terlihat di tiket', async () => {
    const { app, hp } = rakit();
    await hp('ambil', { noKartu: BUDI, kodepoli: '001' });
    // Klinik memanggil pasien lewat layanan antrean: status tiket di "HP" ikut berubah.
    expect((await antrean(app, 'POST', '/antrean/panggil', { tanggalperiksa: HARI_INI, kodepoli: '001', nomorkartu: BUDI, status: 1, waktu: Date.now() })).metadata.code).toBe(200);
    expect((await hp('keadaan')).antrean[0].status).toBe('dipanggil');
    expect((await hp('batal', { noKartu: BUDI, kodepoli: '001', tanggalperiksa: HARI_INI })).metadata.code).toBe(200);
    expect(app.store.pendaftaran).toHaveLength(0);
    expect(app.store.antrean[0].status).toBe('batal');
    expect((await hp('batal', { noKartu: BUDI, kodepoli: '001', tanggalperiksa: HARI_INI })).metadata).toEqual({ code: 201, message: 'Pendaftaran tidak ditemukan' });
    expect((await hp('ambil', { noKartu: BUDI, kodepoli: '001' })).response.nomorantrean).toBe('002');
  });
});
