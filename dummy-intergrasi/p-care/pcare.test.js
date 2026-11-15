import { buatAplikasiPcare, KONFIG_PCARE_BAWAAN } from './pcare.js';
import { buatAuthorization, buatSignature, dekripsiRespons, enkripsiRespons } from './pcare-crypto.js';
import { mulaiDummy, tutupDummy, PORT_PCARE, URL_PCARE } from '../uji-bantu.js';

const K = KONFIG_PCARE_BAWAAN;
let server;
const basis = `${URL_PCARE}/${K.serviceName}`;

/** Klien yang meniru PcareService.php: header, jenis konten, dan dekripsi respons. */
async function panggil(metode, jalur, { body, ubahHeader = {}, timestamp = String(Math.floor(Date.now() / 1000)) } = {}) {
  const header = {
    'X-cons-id': K.consId,
    'X-Timestamp': timestamp,
    'X-Signature': buatSignature(K.consId, timestamp, K.secretKey),
    user_key: K.userKey,
    'X-Authorization': buatAuthorization(K.username, K.password, K.appCode),
    'Content-Type': metode === 'GET' ? 'application/json; charset=utf-8' : 'text/plain',
    ...ubahHeader,
  };
  for (const [n, v] of Object.entries(header)) if (v === null) delete header[n];
  const res = await fetch(`${basis}${jalur}`, { method: metode, headers: header, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json();
  if (typeof json.response === 'string') json.response = dekripsiRespons(json.response, K.consId, K.secretKey, timestamp);
  return { status: res.status, ...json };
}

beforeAll(async () => { server = await mulaiDummy(buatAplikasiPcare(), PORT_PCARE); });
afterAll(() => tutupDummy(server));

const pendaftaranBaku = {
  kdProviderPeserta: '0114A026', tglDaftar: '14-11-2026', noKartu: '0000039043765', kdPoli: '001',
  keluhan: 'Demam 3 hari', kunjSakit: true, sistole: 120, diastole: 80, beratBadan: 60, tinggiBadan: 165,
  respRate: 20, lingkarPerut: 80, heartRate: 80, rujukBalik: 0, kdTkp: '10',
};
const kunjunganBaku = {
  noKunjungan: null, noKartu: '0000039043765', tglDaftar: '14-11-2026', kdPoli: '001', keluhan: 'Demam 3 hari',
  kdSadar: '01', sistole: 120, diastole: 80, beratBadan: 60, tinggiBadan: 165, respRate: 20, lingkarPerut: 80,
  heartRate: 80, terapi: 'Istirahat', kdStatusPulang: '4', tglPulang: '14-11-2026', kdDokter: '123123',
  kdDiag1: 'A01', kdDiag2: null, kdDiag3: null, rujukLanjut: null,
};

describe('kripto PCare', () => {
  it('enkripsi lalu dekripsi mengembalikan isi semula', () => {
    const data = { a: 1, nama: 'Bu Éka', daftar: [1, 2, 3] };
    const sandi = enkripsiRespons(data, '1', 'rahasia', '1700000000');
    expect(typeof sandi).toBe('string');
    expect(dekripsiRespons(sandi, '1', 'rahasia', '1700000000')).toEqual(data);
  });

  it('timestamp berbeda menghasilkan kunci berbeda', () => {
    const sandi = enkripsiRespons({ a: 1 }, '1', 'rahasia', '1700000000');
    expect(() => dekripsiRespons(sandi, '1', 'rahasia', '1700000001')).toThrow();
  });

  it('signature = base64(HMAC-SHA256("consId&timestamp"))', () => {
    expect(buatSignature('2112121', '1700000000', '1a2b1a2b1a2b')).toMatch(/^[A-Za-z0-9+/]{43}=$/);
  });
});

describe('autentikasi header', () => {
  it('menolak header yang kurang', async () => {
    for (const h of ['X-cons-id', 'X-Timestamp', 'X-Signature', 'user_key']) {
      const r = await panggil('GET', '/kesadaran', { ubahHeader: { [h]: null } });
      expect(r.status).toBe(401);
      expect(r.metaData.code).toBe(401);
    }
  });

  it('menolak signature, user_key, X-Authorization salah', async () => {
    expect((await panggil('GET', '/kesadaran', { ubahHeader: { 'X-Signature': 'salah' } })).status).toBe(401);
    expect((await panggil('GET', '/kesadaran', { ubahHeader: { user_key: 'salah' } })).status).toBe(401);
    expect((await panggil('GET', '/kesadaran', { ubahHeader: { 'X-Authorization': buatAuthorization('x', 'y', 'z') } })).status).toBe(401);
  });

  it('menolak timestamp di luar batas', async () => {
    const lama = String(Math.floor(Date.now() / 1000) - 3600);
    const r = await panggil('GET', '/kesadaran', { timestamp: lama });
    expect(r.status).toBe(401);
  });

  it('jalur tak dikenal 404 dan metode salah 405', async () => {
    expect((await panggil('GET', '/tidak-ada')).metaData.code).toBe(404);
    expect((await panggil('DELETE', '/kesadaran')).metaData.code).toBe(405);
  });
});

describe('peserta', () => {
  it('mencari menurut nomor kartu, noka, dan nik', async () => {
    const a = await panggil('GET', '/peserta/0000039043765');
    expect(a.metaData).toEqual({ code: 200, message: 'OK' });
    expect(a.response.nama).toBe('BUDI CONTOH');
    expect(a.response.kdProviderPst.kdProvider).toBe('0114A026');
    expect((await panggil('GET', '/peserta/noka/0000039043765')).response.noKartu).toBe('0000039043765');
    expect((await panggil('GET', '/peserta/nik/3201010202850002')).response.nama).toBe('SITI CONTOH');
  });

  it('peserta tidak aktif tetap ditemukan dengan aktif=false', async () => {
    const r = await panggil('GET', '/peserta/0000039043767');
    expect(r.response.aktif).toBe(false);
    expect(r.response.ketAktif).toMatch(/TIDAK AKTIF/);
  });

  it('tidak ditemukan memberi kode 204 dan response null', async () => {
    const r = await panggil('GET', '/peserta/9999999999999');
    expect(r.metaData.code).toBe(204);
    expect(r.response).toBeNull();
  });

  it('jenis kartu salah memberi 412', async () => {
    expect((await panggil('GET', '/peserta/ktp/123')).metaData.code).toBe(412);
  });
});

describe('referensi dan halaman', () => {
  it('daftar berisi count dan list', async () => {
    const r = await panggil('GET', '/dokter');
    expect(r.response.count).toBe(3);
    expect(r.response.list[0]).toEqual({ kdDokter: '123123', nmDokter: 'dr. Contoh Satu' });
  });

  it('halaman start/limit memotong list tetapi count tetap total', async () => {
    const r = await panggil('GET', '/dokter/1/1');
    expect(r.response.count).toBe(3);
    expect(r.response.list).toHaveLength(1);
    expect(r.response.list[0].kdDokter).toBe('123124');
  });

  it('diagnosa dicari dari ICD-10 klira', async () => {
    const r = await panggil('GET', '/diagnosa/A01.0/0/5');
    expect(r.response.list[0].kdDiag).toBe('A01.0');
    expect(r.response.list[0].nmDiag).toMatch(/Typhoid/i);
  });

  it('obat DPHO, poli, kesadaran, tindakan per TKP, status pulang', async () => {
    expect((await panggil('GET', '/obat/dpho/paracetamol/0/10')).response.list[0].kdObat).toBe('00000001');
    expect((await panggil('GET', '/poli/fktp/0/10')).response.count).toBeGreaterThan(0);
    expect((await panggil('GET', '/kesadaran')).response.list[0].kdSadar).toBe('01');
    expect((await panggil('GET', '/tindakan/kdTkp/10/0/10')).response.list.every((t) => t.kdTkp === '10')).toBe(true);
    expect((await panggil('GET', '/statuspulang/rawatInap/false')).response.list.length).toBeGreaterThan(0);
  });

  it('spesialis, sub spesialis, sarana, khusus, dan faskes rujukan', async () => {
    expect((await panggil('GET', '/spesialis')).response.list[0].kdSpesialis).toBe('ANA');
    expect((await panggil('GET', '/spesialis/ANA/subspesialis')).response.list[0].kdSubSpesialis).toBe('26');
    expect((await panggil('GET', '/spesialis/sarana')).response.count).toBe(2);
    expect((await panggil('GET', '/spesialis/khusus')).response.count).toBe(2);
    const r = await panggil('GET', '/spesialis/rujuk/subspesialis/26/sarana/1/tglEstRujuk/20-11-2026');
    expect(r.response.list[0].kdppk).toBe('0101R001');
    expect((await panggil('GET', '/spesialis/rujuk/khusus/THA/subspesialis/26/noKartu/0000039043765/tglEstRujuk/20-11-2026')).response.count).toBe(2);
  });

  it('skrining memakai ejaan skrinning', async () => {
    expect((await panggil('GET', '/skrinning/rekap')).response.count).toBe(2);
    expect((await panggil('GET', '/skrinning/prolanis/dm/budi/0/10')).metaData.code).toBe(204);
    expect((await panggil('GET', '/skrinning/prolanis/dm/siti/0/10')).response.list[0].nama).toBe('SITI CONTOH');
  });
});

describe('pendaftaran, kunjungan, obat, tindakan', () => {
  it('alur lengkap: daftar, kunjungan, obat, tindakan, rujukan, hapus', async () => {
    const daftar = await panggil('POST', '/pendaftaran', { body: pendaftaranBaku });
    expect(daftar.status).toBe(201);
    expect(daftar.metaData).toEqual({ code: 201, message: 'CREATED' });
    expect(daftar.response.message).toBe('001');

    const sama = await panggil('POST', '/pendaftaran', { body: pendaftaranBaku });
    expect(sama.metaData.code).toBe(412);

    const lihat = await panggil('GET', '/pendaftaran/noUrut/001/tglDaftar/14-11-2026');
    expect(lihat.response.peserta.noKartu).toBe('0000039043765');
    expect((await panggil('GET', '/pendaftaran/tglDaftar/14-11-2026/0/10')).response.count).toBe(1);
    expect((await panggil('GET', '/pendaftaran/peserta/0000039043765')).response.count).toBe(1);

    const kunj = await panggil('POST', '/kunjungan/v1', { body: kunjunganBaku });
    expect(kunj.status).toBe(201);
    const no = kunj.response[0].message;
    expect(kunj.response[0].field).toBe('noKunjungan');
    expect(no).toMatch(/^0114A0261411Y\d{6}$/);

    // pendaftaran yang sudah berkunjungan tidak boleh dihapus
    const hapusDitolak = await panggil('DELETE', '/pendaftaran/peserta/0000039043765/tglDaftar/14-11-2026/noUrut/001/kdPoli/001');
    expect(hapusDitolak.metaData.code).toBe(412);

    const obat = await panggil('POST', '/obat/kunjungan', { body: { kdKunjungan: no, kdObat: '00000001', jmlObat: 10, signa1: 3, signa2: 1 } });
    expect(obat.status).toBe(201);
    expect((await panggil('GET', `/obat/kunjungan/${no}`)).response.list[0].obat.nmObat).toMatch(/Paracetamol/);

    const tindakan = await panggil('POST', '/tindakan/kunjungan', { body: { kdKunjungan: no, kdTindakan: '10101' } });
    expect(tindakan.status).toBe(201);
    expect((await panggil('GET', `/tindakan/kunjungan/${no}`)).response.count).toBe(1);

    const riwayat = await panggil('GET', '/kunjungan/peserta/0000039043765');
    expect(riwayat.response.list[0].noKunjungan).toBe(no);
    expect(riwayat.response.list[0].diagnosa1.kdDiag).toBe('A01');

    // ubah menjadi rujuk lanjut
    const ubah = await panggil('PUT', '/kunjungan/v1', {
      body: { ...kunjunganBaku, noKunjungan: no, kdStatusPulang: '9', rujukLanjut: { kdppk: '0101R001', tglEstRujuk: '20-11-2026', subSpesialis: { kdSubSpesialis1: '26', kdSarana: '1' }, khusus: null } },
    });
    expect(ubah.status).toBe(200);
    const rujukan = await panggil('GET', `/kunjungan/rujukan/${no}`);
    expect(rujukan.response.tglEstRujuk).toBe('20-11-2026');

    expect((await panggil('DELETE', `/kunjungan/${no}`)).status).toBe(200);
    expect((await panggil('GET', '/kunjungan/peserta/0000039043765')).metaData.code).toBe(204);
    expect((await panggil('DELETE', '/pendaftaran/peserta/0000039043765/tglDaftar/14-11-2026/noUrut/001/kdPoli/001')).status).toBe(200);
  });

  it('pendaftaran ditolak untuk peserta tidak aktif, poli salah, atau angka kosong', async () => {
    const tidakAktif = await panggil('POST', '/pendaftaran', { body: { ...pendaftaranBaku, noKartu: '0000039043767' } });
    expect(tidakAktif.metaData.code).toBe(412);
    expect(tidakAktif.response[0]).toMatchObject({ field: 'noKartu' });
    const rusak = await panggil('POST', '/pendaftaran', { body: { ...pendaftaranBaku, noKartu: '0000039043766', kdPoli: '999', sistole: 'x', tglDaftar: '2026-11-14' } });
    expect(rusak.response.map((e) => e.field).sort()).toEqual(['kdPoli', 'sistole', 'tglDaftar']);
  });

  it('kunjungan ditolak tanpa pendaftaran, diagnosa tak dikenal, atau rujuk tanpa rujukLanjut', async () => {
    const tanpaDaftar = await panggil('POST', '/kunjungan/v1', { body: { ...kunjunganBaku, noKartu: '0000039043766' } });
    expect(tanpaDaftar.response[0].message).toMatch(/pendaftaran tidak ditemukan/i);
    const diagBurukLangsung = await panggil('POST', '/kunjungan/v1', { body: { ...kunjunganBaku, kdDiag1: 'ZZZ99', kdStatusPulang: '9' } });
    const bidang = diagBurukLangsung.response.map((e) => e.field);
    expect(bidang).toEqual(expect.arrayContaining(['kdDiag1', 'rujukLanjut']));
  });

  it('badan yang bukan JSON memberi 412', async () => {
    const t = String(Math.floor(Date.now() / 1000));
    const res = await fetch(`${basis}/pendaftaran`, {
      method: 'POST',
      headers: { 'X-cons-id': K.consId, 'X-Timestamp': t, 'X-Signature': buatSignature(K.consId, t, K.secretKey), user_key: K.userKey, 'X-Authorization': buatAuthorization(K.username, K.password, K.appCode), 'Content-Type': 'text/plain' },
      body: '{rusak',
    });
    expect((await res.json()).metaData.code).toBe(412);
  });
});

describe('kelompok prolanis', () => {
  it('club, kegiatan, peserta kegiatan, dan hapus', async () => {
    expect((await panggil('GET', '/kelompok/club/01')).response.list[0].clubId).toBe(1);
    const buat = await panggil('POST', '/kelompok/kegiatan', { body: { clubId: 1, tglPelaksanaan: '10-11-2026', materi: 'Senam' } });
    const eduId = Number(buat.response[0].message);
    expect((await panggil('GET', '/kelompok/kegiatan/11-2026')).response.list[0].eduId).toBe(eduId);
    expect((await panggil('POST', '/kelompok/peserta', { body: { eduId, noKartu: '0000039043766' } })).status).toBe(201);
    expect((await panggil('GET', `/kelompok/peserta/${eduId}`)).response.list[0].noKartu).toBe('0000039043766');
    expect((await panggil('DELETE', `/kelompok/peserta/${eduId}/0000039043766`)).status).toBe(200);
    expect((await panggil('DELETE', `/kelompok/kegiatan/${eduId}`)).status).toBe(200);
    expect((await panggil('DELETE', `/kelompok/kegiatan/${eduId}`)).metaData.code).toBe(412);
  });
});
