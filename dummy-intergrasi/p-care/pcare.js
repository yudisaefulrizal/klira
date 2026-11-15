// Server tiruan PCare BPJS. Header, signature, dan enkripsi mengikuti bridging-bpjs ([repo]);
// isi respons dan validasi tulis mengikuti p-care/03-struktur-data.md ([dugaan]).
import express from 'express';
import { buatAuthorization, buatSignature, enkripsiRespons } from './pcare-crypto.js';
import * as D from './pcare-data.js';
import { ruteAntrean } from './antrean.js';
import { pasangMobileJkn } from './mobile-jkn.js';

export const KONFIG_PCARE_BAWAAN = {
  consId: '2112121',
  secretKey: '1a2b1a2b1a2b',
  userKey: '1a2b3c1a2b3c',
  username: 'username-pcare',
  password: 'password-pcare',
  appCode: '012',
  serviceName: 'pcare-rest',
  toleransiDetik: 300,
  // Layanan antrean online FKTP (antrean/add, antrean/panggil, antrean/batal) memakai header yang sama dengan PCare.
  antreanServiceName: 'antreanfktp',
};

const TANGGAL = /^\d{2}-\d{2}-\d{4}$/;

export function buatStorePcare() {
  return { pendaftaran: [], kunjungan: [], obat: [], tindakan: [], kegiatan: [], pesertaKegiatan: [], urutKunjungan: 0, urutKegiatan: 0, antrean: [], urutPendaftaran: {}, tarikanPendaftaran: null };
}

const cocokJalur = (pola, segmen) => {
  const p = pola.split('/').filter(Boolean);
  if (p.length !== segmen.length) return null;
  const param = {};
  for (let i = 0; i < p.length; i += 1) {
    if (p[i].startsWith(':')) param[p[i].slice(1)] = decodeURIComponent(segmen[i]);
    else if (p[i] !== segmen[i]) return null;
  }
  return param;
};

const ambilHalaman = (daftar, { start, limit }) => {
  if (start === undefined) return daftar;
  const mulai = Math.max(0, Number(start) || 0);
  const banyak = Math.max(0, Number(limit) || 0);
  return daftar.slice(mulai, mulai + banyak);
};

/** Nomor urut pendaftaran per tanggal dan poli; tidak dipakai ulang walau pendaftaran dihapus. */
export function nomorUrutBerikut(store, tglDaftar, kdPoli) {
  const kunci = `${tglDaftar}|${kdPoli}`;
  store.urutPendaftaran[kunci] = (store.urutPendaftaran[kunci] ?? 0) + 1;
  return String(store.urutPendaftaran[kunci]).padStart(3, '0');
}

const lebihBesarDariNol = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

function galatBidang(...pasangan) {
  return pasangan.map(([field, message]) => ({ field, message }));
}

export function buatAplikasiPcare(konfigSebagian = {}, store = buatStorePcare()) {
  const k = { ...KONFIG_PCARE_BAWAAN, ...konfigSebagian };
  const rute = [];
  const tambah = (metode, pola, fn) => rute.push({ metode, pola, fn });
  /** Daftar dengan halaman opsional /{start}/{limit}. */
  const daftar = (pola, fn) => {
    tambah('GET', pola, fn);
    tambah('GET', `${pola}/:start/:limit`, fn);
  };
  const daftarSederhana = (pola, data, saring) =>
    daftar(pola, (c) => {
      const cocok = saring ? data.filter((d) => saring(d, c.param)) : data;
      return c.daftar(cocok);
    });

  /* ---------- Peserta ---------- */
  const kirimPeserta = (c, p) => (p ? c.ok(p) : c.tidakAda('Data tidak ditemukan'));
  tambah('GET', '/peserta/:noKartu', (c) => kirimPeserta(c, D.PESERTA.find((p) => p.noKartu === c.param.noKartu)));
  tambah('GET', '/peserta/:jenisKartu/:nomor', (c) => {
    const { jenisKartu, nomor } = c.param;
    if (jenisKartu !== 'nik' && jenisKartu !== 'noka') return c.galat(412, 'Jenis kartu harus nik atau noka');
    const p = D.PESERTA.find((x) => (jenisKartu === 'nik' ? x.noKTP === nomor : x.noKartu === nomor));
    return kirimPeserta(c, p);
  });

  /* ---------- Pendaftaran ---------- */
  const ringkasPendaftaran = (p) => {
    const ps = D.PESERTA.find((x) => x.noKartu === p.noKartu);
    const poli = D.POLI.find((x) => x.kdPoli === p.kdPoli);
    return {
      tglDaftar: p.tglDaftar, noUrut: p.noUrut, peserta: ps, poli,
      keluhan: p.keluhan, kunjSakit: p.kunjSakit, sistole: p.sistole, diastole: p.diastole,
      beratBadan: p.beratBadan, tinggiBadan: p.tinggiBadan, respRate: p.respRate, heartRate: p.heartRate,
      lingkarPerut: p.lingkarPerut, rujukBalik: p.rujukBalik, kdTkp: p.kdTkp,
    };
  };
  daftar('/pendaftaran/tglDaftar/:tgl', (c) => {
    // Dicatat agar simulator Mobile JKN bisa menunjukkan kapan klinik terakhir menarik pendaftaran.
    store.tarikanPendaftaran = { waktu: new Date().toISOString(), tanggal: c.param.tgl };
    return c.daftar(store.pendaftaran.filter((p) => p.tglDaftar === c.param.tgl).map(ringkasPendaftaran));
  });
  daftar('/pendaftaran/noUrut/:noUrut/tglDaftar/:tgl', (c) => {
    const p = store.pendaftaran.find((x) => x.noUrut === c.param.noUrut && x.tglDaftar === c.param.tgl);
    return p ? c.ok(ringkasPendaftaran(p)) : c.tidakAda('Data tidak ditemukan');
  });
  daftar('/pendaftaran/peserta/:noKartu', (c) =>
    c.daftar(store.pendaftaran.filter((p) => p.noKartu === c.param.noKartu).map(ringkasPendaftaran)));
  daftar('/pendaftaran/kdPoli/:kdPoli', (c) =>
    c.daftar(store.pendaftaran.filter((p) => p.kdPoli === c.param.kdPoli).map(ringkasPendaftaran)));
  tambah('POST', '/pendaftaran', (c) => {
    const b = c.body;
    const ps = D.PESERTA.find((x) => x.noKartu === b.noKartu);
    const salah = [];
    if (!b.noKartu) salah.push(['noKartu', 'Nomor kartu wajib diisi']);
    else if (!ps) salah.push(['noKartu', 'Peserta tidak ditemukan']);
    else if (!ps.aktif) salah.push(['noKartu', `Peserta tidak aktif: ${ps.ketAktif}`]);
    if (!TANGGAL.test(b.tglDaftar ?? '')) salah.push(['tglDaftar', 'Format tanggal harus dd-MM-yyyy']);
    if (!D.POLI.some((x) => x.kdPoli === b.kdPoli)) salah.push(['kdPoli', 'Kode poli tidak dikenal']);
    if (!b.keluhan) salah.push(['keluhan', 'Keluhan wajib diisi']);
    if (typeof b.kunjSakit !== 'boolean') salah.push(['kunjSakit', 'kunjSakit harus true atau false']);
    for (const f of ['sistole', 'diastole', 'beratBadan', 'tinggiBadan', 'respRate', 'heartRate']) {
      if (!lebihBesarDariNol(b[f])) salah.push([f, `${f} harus angka`]);
    }
    if (salah.length === 0 && store.pendaftaran.some((p) => p.noKartu === b.noKartu && p.tglDaftar === b.tglDaftar && p.kdPoli === b.kdPoli)) {
      salah.push(['noKartu', 'Peserta sudah terdaftar pada poli dan tanggal yang sama']);
    }
    if (salah.length) return c.galat(412, 'PRECONDITION FAILED', galatBidang(...salah));
    const noUrut = nomorUrutBerikut(store, b.tglDaftar, b.kdPoli);
    store.pendaftaran.push({ ...b, noUrut, kdTkp: b.kdTkp ?? '10' });
    return c.dibuat({ message: noUrut });
  });
  tambah('DELETE', '/pendaftaran/peserta/:noKartu/tglDaftar/:tgl/noUrut/:noUrut/kdPoli/:kdPoli', (c) => {
    const { noKartu, tgl, noUrut, kdPoli } = c.param;
    const i = store.pendaftaran.findIndex((p) => p.noKartu === noKartu && p.tglDaftar === tgl && p.noUrut === noUrut && p.kdPoli === kdPoli);
    if (i < 0) return c.galat(412, 'Data pendaftaran tidak ditemukan');
    if (store.kunjungan.some((x) => x.noKartu === noKartu && x.tglDaftar === tgl && x.kdPoli === kdPoli)) {
      return c.galat(412, 'Pendaftaran sudah memiliki kunjungan');
    }
    store.pendaftaran.splice(i, 1);
    return c.ok(null, 'OK');
  });

  /* ---------- Kunjungan ---------- */
  const bentukKunjungan = (x) => ({
    noKunjungan: x.noKunjungan, tglKunjungan: x.tglDaftar, provider: D.PROVIDER_SENDIRI,
    peserta: D.PESERTA.find((p) => p.noKartu === x.noKartu),
    poli: D.POLI.find((p) => p.kdPoli === x.kdPoli),
    keluhan: x.keluhan, anamnesa: x.anamnesa ?? null, terapi: x.terapi ?? null,
    sistole: x.sistole, diastole: x.diastole, beratBadan: x.beratBadan, tinggiBadan: x.tinggiBadan,
    respRate: x.respRate, lingkarPerut: x.lingkarPerut ?? 0, heartRate: x.heartRate,
    diagnosa1: D.cariDiagnosa(x.kdDiag1).find((d) => d.kdDiag === x.kdDiag1) ?? null,
    diagnosa2: x.kdDiag2 ? D.cariDiagnosa(x.kdDiag2).find((d) => d.kdDiag === x.kdDiag2) ?? null : null,
    diagnosa3: x.kdDiag3 ? D.cariDiagnosa(x.kdDiag3).find((d) => d.kdDiag === x.kdDiag3) ?? null : null,
    dokter: D.DOKTER.find((d) => d.kdDokter === x.kdDokter),
    kesadaran: D.KESADARAN.find((s) => s.kdSadar === x.kdSadar),
    statusPulang: D.STATUS_PULANG.find((s) => s.kdStatusPulang === x.kdStatusPulang),
    tglPulang: x.tglPulang,
  });
  tambah('GET', '/kunjungan/peserta/:noKartu', (c) =>
    c.daftar(store.kunjungan.filter((x) => x.noKartu === c.param.noKartu).map(bentukKunjungan)));
  tambah('GET', '/kunjungan/rujukan/:noKunjungan', (c) => {
    const x = store.kunjungan.find((v) => v.noKunjungan === c.param.noKunjungan);
    if (!x || !x.rujukLanjut) return c.tidakAda('Data tidak ditemukan');
    return c.ok({
      noKunjungan: x.noKunjungan, tglKunjungan: x.tglDaftar, ppk: D.PROVIDER_SENDIRI,
      poli: D.POLI.find((p) => p.kdPoli === x.kdPoli),
      diagnosa: D.cariDiagnosa(x.kdDiag1).find((d) => d.kdDiag === x.kdDiag1) ?? null,
      tglEstRujuk: x.rujukLanjut.tglEstRujuk, rujukLanjut: x.rujukLanjut,
    });
  });
  function validasiKunjungan(b, { baru }) {
    const salah = [];
    const ps = D.PESERTA.find((x) => x.noKartu === b.noKartu);
    if (!ps) salah.push(['noKartu', 'Peserta tidak ditemukan']);
    else if (!ps.aktif) salah.push(['noKartu', `Peserta tidak aktif: ${ps.ketAktif}`]);
    if (!TANGGAL.test(b.tglDaftar ?? '')) salah.push(['tglDaftar', 'Format tanggal harus dd-MM-yyyy']);
    if (!D.POLI.some((x) => x.kdPoli === b.kdPoli)) salah.push(['kdPoli', 'Kode poli tidak dikenal']);
    if (!b.keluhan) salah.push(['keluhan', 'Keluhan wajib diisi']);
    if (!D.KESADARAN.some((x) => x.kdSadar === b.kdSadar)) salah.push(['kdSadar', 'Kode kesadaran tidak dikenal']);
    if (!D.STATUS_PULANG.some((x) => x.kdStatusPulang === b.kdStatusPulang)) salah.push(['kdStatusPulang', 'Status pulang tidak dikenal']);
    if (!D.DOKTER.some((x) => x.kdDokter === b.kdDokter)) salah.push(['kdDokter', 'Dokter tidak dikenal']);
    for (const f of ['sistole', 'diastole', 'beratBadan', 'tinggiBadan', 'respRate', 'heartRate']) {
      if (!lebihBesarDariNol(b[f])) salah.push([f, `${f} harus angka`]);
    }
    for (const f of ['kdDiag1', 'kdDiag2', 'kdDiag3']) {
      if (b[f] && !D.cariDiagnosa(b[f]).some((d) => d.kdDiag === b[f])) salah.push([f, `Kode diagnosa ${b[f]} tidak dikenal`]);
    }
    if (!b.kdDiag1) salah.push(['kdDiag1', 'Diagnosa utama wajib diisi']);
    if (['6', '9'].includes(b.kdStatusPulang) && !b.rujukLanjut) salah.push(['rujukLanjut', 'Status pulang rujuk memerlukan rujukLanjut']);
    if (salah.length === 0 && baru) {
      if (!store.pendaftaran.some((p) => p.noKartu === b.noKartu && p.tglDaftar === b.tglDaftar && p.kdPoli === b.kdPoli)) {
        salah.push(['tglDaftar', 'Data pendaftaran tidak ditemukan']);
      }
      if (store.kunjungan.some((x) => x.noKartu === b.noKartu && x.tglDaftar === b.tglDaftar && x.kdPoli === b.kdPoli)) {
        salah.push(['noKartu', 'Kunjungan untuk pendaftaran ini sudah ada']);
      }
    }
    return salah;
  }
  tambah('POST', '/kunjungan/v1', (c) => {
    const salah = validasiKunjungan(c.body, { baru: true });
    if (salah.length) return c.galat(412, 'PRECONDITION FAILED', galatBidang(...salah));
    store.urutKunjungan += 1;
    const [dd, mm] = c.body.tglDaftar.split('-');
    const noKunjungan = `${D.PROVIDER_SENDIRI.kdProvider}${dd}${mm}Y${String(store.urutKunjungan).padStart(6, '0')}`;
    store.kunjungan.push({ ...c.body, noKunjungan });
    return c.dibuat([{ field: 'noKunjungan', message: noKunjungan }]);
  });
  tambah('PUT', '/kunjungan/v1', (c) => {
    const i = store.kunjungan.findIndex((x) => x.noKunjungan === c.body.noKunjungan);
    if (i < 0) return c.galat(412, 'PRECONDITION FAILED', galatBidang(['noKunjungan', 'Kunjungan tidak ditemukan']));
    const salah = validasiKunjungan(c.body, { baru: false });
    if (salah.length) return c.galat(412, 'PRECONDITION FAILED', galatBidang(...salah));
    store.kunjungan[i] = { ...c.body };
    return c.ok([{ field: 'noKunjungan', message: c.body.noKunjungan }]);
  });
  tambah('DELETE', '/kunjungan/:noKunjungan', (c) => {
    const i = store.kunjungan.findIndex((x) => x.noKunjungan === c.param.noKunjungan);
    if (i < 0) return c.galat(412, 'Kunjungan tidak ditemukan');
    store.kunjungan.splice(i, 1);
    return c.ok(null, 'OK');
  });

  /* ---------- Obat, tindakan, MCU ---------- */
  daftar('/obat/dpho/:keyword', (c) => {
    const kw = c.param.keyword.toLowerCase();
    return c.daftar(D.OBAT_DPHO.filter((o) => o.nmObat.toLowerCase().includes(kw) || o.kdObat.includes(kw)));
  });
  tambah('GET', '/obat/kunjungan/:noKunjungan', (c) =>
    c.daftar(store.obat.filter((o) => o.noKunjungan === c.param.noKunjungan)));
  tambah('POST', '/obat/kunjungan', (c) => {
    const b = c.body;
    const obat = D.OBAT_DPHO.find((o) => o.kdObat === b.kdObat);
    const salah = [];
    if (!store.kunjungan.some((x) => x.noKunjungan === b.kdKunjungan)) salah.push(['kdKunjungan', 'Kunjungan tidak ditemukan']);
    if (!obat) salah.push(['kdObat', 'Obat tidak ditemukan']);
    if (!lebihBesarDariNol(b.jmlObat) || b.jmlObat === 0) salah.push(['jmlObat', 'Jumlah obat harus lebih dari 0']);
    if (salah.length) return c.galat(412, 'PRECONDITION FAILED', galatBidang(...salah));
    const kdObatSK = store.obat.length + 1;
    store.obat.push({ kdObatSK, noKunjungan: b.kdKunjungan, racikan: Boolean(b.racikan), kdRacikan: b.kdRacikan ?? null, obat: { kdObat: obat.kdObat, nmObat: obat.nmObat }, signa1: b.signa1 ?? 1, signa2: b.signa2 ?? 1, jmlObat: b.jmlObat });
    return c.dibuat([{ field: 'kdObatSK', message: String(kdObatSK) }]);
  });
  daftar('/tindakan/kdTkp/:kdTkp', (c) => c.daftar(D.TINDAKAN.filter((t) => t.kdTkp === c.param.kdTkp)));
  tambah('GET', '/tindakan/kunjungan/:noKunjungan', (c) =>
    c.daftar(store.tindakan.filter((t) => t.noKunjungan === c.param.noKunjungan)));
  tambah('POST', '/tindakan/kunjungan', (c) => {
    const b = c.body;
    const t = D.TINDAKAN.find((x) => x.kdTindakan === b.kdTindakan);
    const salah = [];
    if (!store.kunjungan.some((x) => x.noKunjungan === b.kdKunjungan)) salah.push(['kdKunjungan', 'Kunjungan tidak ditemukan']);
    if (!t) salah.push(['kdTindakan', 'Tindakan tidak ditemukan']);
    if (salah.length) return c.galat(412, 'PRECONDITION FAILED', galatBidang(...salah));
    const kdTindakanSK = store.tindakan.length + 1;
    store.tindakan.push({ kdTindakanSK, noKunjungan: b.kdKunjungan, tindakan: { kdTindakan: t.kdTindakan, nmTindakan: t.nmTindakan }, biaya: b.biaya ?? 0, keterangan: b.keterangan ?? null, hasil: b.hasil ?? 0 });
    return c.dibuat([{ field: 'kdTindakanSK', message: String(kdTindakanSK) }]);
  });
  tambah('GET', '/mcu/kunjungan/:noKunjungan', (c) => c.tidakAda('Data tidak ditemukan'));

  /* ---------- Referensi ---------- */
  daftar('/diagnosa/:kdDiagnosa', (c) => c.daftar(D.cariDiagnosa(c.param.kdDiagnosa)));
  daftar('/dokter', (c) => c.daftar(D.DOKTER));
  tambah('GET', '/kesadaran', (c) => c.daftar(D.KESADARAN));
  daftar('/poli/fktp', (c) => c.daftar(D.POLI));
  daftar('/provider', (c) => c.daftar(D.PROVIDER));
  tambah('GET', '/prognosa', (c) => c.daftar(D.PROGNOSA));
  tambah('GET', '/alergi/jenis/:jenis', (c) => c.daftar(D.ALERGI.filter((a) => a.jenis === c.param.jenis)));
  tambah('GET', '/statuspulang/rawatInap/:status', (c) => {
    if (!['true', 'false'].includes(c.param.status)) return c.galat(412, 'Status harus true atau false');
    return c.daftar(D.STATUS_PULANG.filter((s) => String(s.rawatInap) === c.param.status));
  });

  /* ---------- Spesialis ---------- */
  tambah('GET', '/spesialis', (c) => c.daftar(D.SPESIALIS));
  tambah('GET', '/spesialis/sarana', (c) => c.daftar(D.SARANA));
  tambah('GET', '/spesialis/khusus', (c) => c.daftar(D.KHUSUS));
  tambah('GET', '/spesialis/:kdSpesialis/subspesialis', (c) => {
    const ss = D.SUB_SPESIALIS[c.param.kdSpesialis];
    return ss ? c.daftar(ss) : c.tidakAda('Data tidak ditemukan');
  });
  tambah('GET', '/spesialis/rujuk/subspesialis/:kdSub/sarana/:kdSarana/tglEstRujuk/:tgl', (c) => {
    const { kdSub, kdSarana, tgl } = c.param;
    if (!TANGGAL.test(tgl)) return c.galat(412, 'Format tanggal harus dd-MM-yyyy');
    const adaSub = Object.values(D.SUB_SPESIALIS).flat().some((s) => s.kdSubSpesialis === kdSub);
    if (!adaSub || !D.SARANA.some((s) => s.kdSarana === kdSarana)) return c.tidakAda('Data tidak ditemukan');
    return c.daftar(D.FASKES_RUJUKAN);
  });
  tambah('GET', '/spesialis/rujuk/khusus/:kdKhusus/subspesialis/:kdSub/noKartu/:noKartu/tglEstRujuk/:tgl', (c) => {
    const { kdKhusus, noKartu, tgl } = c.param;
    if (!TANGGAL.test(tgl)) return c.galat(412, 'Format tanggal harus dd-MM-yyyy');
    if (!D.KHUSUS.some((s) => s.kdKhusus === kdKhusus) || !D.PESERTA.some((p) => p.noKartu === noKartu)) return c.tidakAda('Data tidak ditemukan');
    return c.daftar(D.FASKES_RUJUKAN);
  });

  /* ---------- Kelompok (Prolanis) ---------- */
  tambah('GET', '/kelompok/club/:kdJenis', (c) => c.daftar(D.CLUB_PROLANIS.filter((x) => x.kdProgram === c.param.kdJenis)));
  tambah('GET', '/kelompok/kegiatan/:bulan', (c) => c.daftar(store.kegiatan.filter((x) => x.tglPelaksanaan.slice(3) === c.param.bulan)));
  tambah('GET', '/kelompok/peserta/:eduId', (c) => c.daftar(store.pesertaKegiatan.filter((x) => x.eduId === Number(c.param.eduId))));
  tambah('POST', '/kelompok/kegiatan', (c) => {
    const b = c.body;
    const salah = [];
    if (!D.CLUB_PROLANIS.some((x) => x.clubId === b.clubId)) salah.push(['clubId', 'Club tidak ditemukan']);
    if (!TANGGAL.test(b.tglPelaksanaan ?? '')) salah.push(['tglPelaksanaan', 'Format tanggal harus dd-MM-yyyy']);
    if (!b.materi) salah.push(['materi', 'Materi wajib diisi']);
    if (salah.length) return c.galat(412, 'PRECONDITION FAILED', galatBidang(...salah));
    store.urutKegiatan += 1;
    store.kegiatan.push({ eduId: store.urutKegiatan, ...b });
    return c.dibuat([{ field: 'eduId', message: String(store.urutKegiatan) }]);
  });
  tambah('POST', '/kelompok/peserta', (c) => {
    const { eduId, noKartu } = c.body;
    const salah = [];
    if (!store.kegiatan.some((x) => x.eduId === eduId)) salah.push(['eduId', 'Kegiatan tidak ditemukan']);
    if (!D.PESERTA.some((p) => p.noKartu === noKartu)) salah.push(['noKartu', 'Peserta tidak ditemukan']);
    if (salah.length) return c.galat(412, 'PRECONDITION FAILED', galatBidang(...salah));
    store.pesertaKegiatan.push({ eduId, noKartu, nama: D.PESERTA.find((p) => p.noKartu === noKartu).nama });
    return c.dibuat([{ field: 'noKartu', message: noKartu }]);
  });
  tambah('DELETE', '/kelompok/kegiatan/:eduId', (c) => {
    const i = store.kegiatan.findIndex((x) => x.eduId === Number(c.param.eduId));
    if (i < 0) return c.galat(412, 'Kegiatan tidak ditemukan');
    store.kegiatan.splice(i, 1);
    store.pesertaKegiatan = store.pesertaKegiatan.filter((x) => x.eduId !== Number(c.param.eduId));
    return c.ok(null, 'OK');
  });
  tambah('DELETE', '/kelompok/peserta/:eduId/:noKartu', (c) => {
    const n = store.pesertaKegiatan.length;
    store.pesertaKegiatan = store.pesertaKegiatan.filter((x) => !(x.eduId === Number(c.param.eduId) && x.noKartu === c.param.noKartu));
    return store.pesertaKegiatan.length < n ? c.ok(null, 'OK') : c.galat(412, 'Peserta kegiatan tidak ditemukan');
  });

  /* ---------- Skrining (ejaan jalur "skrinning" mengikuti repo) ---------- */
  tambah('GET', '/skrinning/rekap', (c) => c.daftar(D.REKAP_SKRINING));
  const pesertaSkrining = (kelompok) => (c) => {
    const kw = c.param.keyword.toLowerCase();
    const cocok = D.PESERTA.filter((p) => (kelompok ? p.pstProl.includes(kelompok) : true) && (p.noKartu.includes(kw) || p.nama.toLowerCase().includes(kw)));
    return c.daftar(cocok.map((p) => ({ noKartu: p.noKartu, nama: p.nama, sex: p.sex, tglLahir: p.tglLahir, pstProl: p.pstProl })));
  };
  daftar('/skrinning/peserta/:keyword', pesertaSkrining(null));
  daftar('/skrinning/prolanis/dm/:keyword', pesertaSkrining('DM'));
  daftar('/skrinning/prolanis/ht/:keyword', pesertaSkrining('HT'));

  /* ---------- Mesin ---------- */
  const app = express();
  /** Pasang satu layanan: verifikasi header, lalu cocokkan jalur. `kunciMeta`: PCare menulis `metaData`, antrean menulis `metadata`. */
  const pasangLayanan = (namaLayanan, daftarRute, kunciMeta) => {
  app.use(`/${namaLayanan}`, express.text({ type: '*/*', limit: '1mb' }));
  app.use(`/${namaLayanan}`, (req, res) => {
    const timestamp = req.get('x-timestamp') ?? '';
    const kirim = (kode, pesan, data, httpKode = kode === 204 ? 200 : kode) => {
      const isi = data === undefined || data === null ? null : enkripsiRespons(data, k.consId, k.secretKey, timestamp);
      res.status(httpKode).json({ [kunciMeta]: { code: kode, message: pesan }, response: isi });
    };

    const tolak = (pesan) => kirim(401, pesan, null);
    if (!req.get('x-cons-id') || !timestamp || !req.get('x-signature') || !req.get('user_key')) return tolak('Unauthorized: header tidak lengkap');
    if (req.get('x-cons-id') !== k.consId) return tolak('Unauthorized: X-cons-id tidak dikenal');
    if (req.get('user_key') !== k.userKey) return tolak('Unauthorized: user_key salah');
    if (req.get('x-signature') !== buatSignature(k.consId, timestamp, k.secretKey)) return tolak('Unauthorized: X-Signature tidak cocok');
    if (!/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > k.toleransiDetik) return tolak('Unauthorized: X-Timestamp di luar batas waktu');
    if (req.get('x-authorization') !== buatAuthorization(k.username, k.password, k.appCode)) return tolak('Unauthorized: X-Authorization salah');

    let body = {};
    if (['POST', 'PUT'].includes(req.method)) {
      try {
        body = req.body ? JSON.parse(req.body) : {};
      } catch {
        return kirim(412, 'Badan permintaan bukan JSON yang sah', null);
      }
    }
    const segmen = req.path.split('/').filter(Boolean);
    const konteks = {
      body,
      param: {},
      ok: (data, pesan = 'OK') => kirim(200, pesan, data),
      dibuat: (data) => kirim(201, 'CREATED', data),
      tidakAda: (pesan) => kirim(204, pesan, null),
      galat: (kode, pesan, data = null) => kirim(kode, pesan, data),
      daftar: (semua) => {
        if (semua.length === 0) return kirim(204, 'Data tidak ditemukan', null);
        return kirim(200, 'OK', { count: semua.length, list: ambilHalaman(semua, konteks.param) });
      },
    };
    let pathAda = false;
    for (const r of daftarRute) {
      const param = cocokJalur(r.pola, segmen);
      if (!param) continue;
      pathAda = true;
      if (r.metode !== req.method) continue;
      konteks.param = param;
      return r.fn(konteks);
    }
    return kirim(pathAda ? 405 : 404, pathAda ? 'Metode tidak didukung' : 'Jalur tidak ditemukan', null);
  });
  };
  pasangLayanan(k.serviceName, rute, 'metaData');
  pasangLayanan(k.antreanServiceName, ruteAntrean({ store, D }), 'metadata');
  pasangMobileJkn(app, { store, D, nomorUrutBerikut });
  app.store = store;
  app.konfig = k;
  return app;
}
