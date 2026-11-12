// Mengisi data DEMO (fiktif) lewat API Klira yang sedang berjalan, memakai akun sesuai peran agar izin ikut teruji.
// Bukan untuk produksi. Pemakaian: node skrip/data-demo.mjs   (server harus sudah jalan, mis. npm run dev)
// Variabel opsional: KLIRA_URL, KLIRA_ADMIN_USER, KLIRA_ADMIN_SANDI, KLIRA_SANDI_DEMO.
import { createRequire } from 'node:module';
// Default keadaan baik skrining keperawatan dari packages/shared (satu sumber; butuh `npm run build -w packages/shared`).
const { DEFAULT_KEPERAWATAN } = createRequire(import.meta.url)('../packages/shared/dist/index.js');

const BASE = (process.env.KLIRA_URL ?? 'http://127.0.0.1:8074') + '/api';
const ADMIN = { username: process.env.KLIRA_ADMIN_USER ?? 'pimpinan', kata_sandi: process.env.KLIRA_ADMIN_SANDI ?? 'admin123' };
/** Kata sandi semua akun demo setelah ganti kredensial pertama. */
const SANDI_DEMO = process.env.KLIRA_SANDI_DEMO ?? 'admin123';

const hariIni = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
const tambahHari = (n) => new Date(Date.parse(`${hariIni}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const cookie = {};
let gagal = 0;

async function api(siapa, metode, path, badan) {
  const res = await fetch(BASE + path, {
    method: metode,
    headers: { 'content-type': 'application/json', ...(cookie[siapa] ? { cookie: cookie[siapa] } : {}) },
    body: badan === undefined ? undefined : JSON.stringify(badan),
  });
  const isi = await res.json().catch(() => null);
  return { status: res.status, isi, data: isi?.data };
}
/** Panggilan yang wajib berhasil; bila gagal dicatat dan dikembalikan null (skrip lanjut). */
async function wajib(label, siapa, metode, path, badan) {
  const r = await api(siapa, metode, path, badan);
  if (r.status >= 300) {
    gagal++;
    console.log(`  ✗ ${label} [${siapa}] ${metode} ${path} -> ${r.status} ${JSON.stringify(r.isi?.galat ?? r.isi).slice(0, 300)}`);
    return null;
  }
  console.log(`  ✓ ${label}`);
  return r.data ?? true;
}
async function masuk(siapa, username, kata_sandi) {
  const res = await fetch(BASE + '/masuk', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, kata_sandi }) });
  if (res.status !== 200) return false;
  cookie[siapa] = res.headers.get('set-cookie').split(';')[0];
  return true;
}

// ---------------------------------------------------------------- akun
const AKUN = [
  { kunci: 'dokter', nama: 'dr. Ahmad', username: 'dokter', nik: '3273011203850001', jenis: 'Dokter/DPJP', profil: { profesi: 'Dokter Umum', nomor_sip: 'SIP-DU/0123/2025', masa_berlaku_sip: '2030-12-31' } },
  { kunci: 'drg', nama: 'drg. Mahmud', username: 'dokter-gigi', nik: '3273014507880002', jenis: 'Dokter/DPJP', profil: { profesi: 'Dokter Gigi', nomor_sip: 'SIP-DG/0456/2025', masa_berlaku_sip: '2030-12-31' } },
  { kunci: 'perawat', nama: 'Ns. Rina', username: 'perawat', nik: '3273016108920003', jenis: 'Perawat/Bidan/Nakes lain', profil: { profesi: 'Perawat', nomor_sip: 'SIPP/0789/2025', masa_berlaku_sip: '2030-12-31' } },
  { kunci: 'bidan', nama: 'Bd. Dewi', username: 'bidan', nik: '3273015203900004', jenis: 'Perawat/Bidan/Nakes lain', profil: { profesi: 'Bidan', nomor_sip: 'SIPB/0321/2025', masa_berlaku_sip: '2030-12-31' } },
  { kunci: 'daftar', nama: 'Budi', username: 'pendaftaran', nik: '3273010506950005', jenis: 'Petugas pendaftaran' },
  { kunci: 'rm', nama: 'Sari', username: 'rekam-medis', nik: '3273016609930006', jenis: 'Perekam Medis dan Informasi Kesehatan' },
  { kunci: 'kasir', nama: 'Agus', username: 'kasir', nik: '3273011711910007', jenis: 'Petugas klaim/kasir' },
  { kunci: 'apoteker', nama: 'apt. Maya', username: 'apoteker', nik: '3273014402890008', jenis: 'Apoteker/tenaga kefarmasian', profil: { profesi: 'Apoteker', nomor_sip: 'SIPA/0654/2025', masa_berlaku_sip: '2030-12-31' } },
  { kunci: 'lab', nama: 'Fajar', username: 'lab', nik: '3273012308940009', jenis: 'Analis lab' },
  { kunci: 'it', nama: 'Hendra', username: 'admin-it', nik: '3273010902900010', jenis: 'Admin IT fasyankes' },
  { kunci: 'pdp', nama: 'Lina', username: 'pdp', nik: '3273015811870011', jenis: 'Petugas PDP (PPDP)' },
  { kunci: 'vendor', nama: 'Vendor', username: 'admin-vendor', nik: '3273010101800013', jenis: 'Admin vendor' },
  { kunci: 'auditor', nama: 'Rudi', username: 'auditor', nik: '3273012104860012', jenis: 'Auditor' },
];

async function siapkanAkun() {
  console.log('\n[1] Akun per peran');
  const jenis = (await api('admin', 'GET', '/jenis-akun')).data ?? [];
  const idJenis = Object.fromEntries(jenis.map((j) => [j.nama, j.id]));
  const id = {};
  for (const a of AKUN) {
    // Cek keberadaan akun lewat admin dulu: login gagal berulang akan memicu pembatas percobaan masuk (20 gagal/alamat/15 menit).
    const terdaftar = ((await api('admin', 'GET', `/pengguna?cari=${encodeURIComponent(a.username)}&ukuran=20`)).data?.data ?? []).some((u) => u.username === a.username);
    if (terdaftar && await masuk(a.kunci, a.username, SANDI_DEMO)) {
      const saya = await api(a.kunci, 'GET', '/saya');
      id[a.kunci] = saya.data?.id;
      console.log(`  • ${a.username} sudah ada`);
      continue;
    }
    const badan = {
      nama: a.nama, nik: a.nik, username: a.username, profil: a.profil ?? null,
      penugasan: [{ jenis_akun_id: idJenis[a.jenis], mulai: tambahHari(-1) }], izin_akun: [],
    };
    let r = await api('admin', 'POST', '/pengguna', badan);
    if (r.status === 409 || r.status === 422 || (r.status >= 400 && r.isi?.galat?.kode === 'peringatan')) {
      r = await api('admin', 'POST', '/pengguna', { ...badan, konfirmasi_peringatan: { alasan: 'Akun demo presentasi', terima_untuk_akun: true } });
    }
    if (r.status >= 300) { gagal++; console.log(`  ✗ buat ${a.username} -> ${r.status} ${JSON.stringify(r.isi).slice(0, 300)}`); continue; }
    id[a.kunci] = r.data.id;
    await masuk(a.kunci, a.username, r.data.kata_sandi_awal);
    const g = await api(a.kunci, 'POST', '/ganti-kredensial', { username: a.username, kata_sandi_lama: r.data.kata_sandi_awal, kata_sandi: SANDI_DEMO, konfirmasi_kata_sandi: SANDI_DEMO });
    if (g.status >= 300) { gagal++; console.log(`  ✗ ganti kredensial ${a.username} -> ${g.status} ${JSON.stringify(g.isi).slice(0, 200)}`); continue; }
    await masuk(a.kunci, a.username, SANDI_DEMO);
    console.log(`  ✓ ${a.username} (${a.jenis})`);
  }
  return id;
}

// ---------------------------------------------------------------- master
async function cariMaster(jenis, nama) {
  const r = await api('admin', 'GET', `/master/${jenis}?cari=${encodeURIComponent(nama)}&ukuran=100`);
  const kunci = jenis === 'tarif' ? 'kode' : 'nama';
  return r.data?.data?.find((b) => String(b[kunci]).toLowerCase() === nama.toLowerCase());
}
async function masterAda(jenis, nama, badan) {
  const ada = await cariMaster(jenis, nama);
  // Tarif tindakan lama (sebelum P5) belum berkode ICD-9-CM: lengkapi agar bisa dipakai pencatatan tindakan.
  if (ada && jenis === 'tarif' && badan.jenis === 'tindakan' && !ada.kode_icd9cm) await wajib(`lengkapi ICD-9-CM tarif ${nama}`, 'admin', 'PATCH', `/master/tarif/${ada.id}`, badan);
  if (ada) return ada.id;
  const d = await wajib(`${jenis}: ${nama}`, 'admin', 'POST', `/master/${jenis}`, badan);
  return d?.id;
}

async function siapkanMaster(id) {
  console.log('\n[2] Master data (poli, ruang, bed, tarif, jadwal)');
  const poliUmum = await cariMaster('poli', 'umum');
  if (poliUmum) await wajib('ubah nama poli umum', 'admin', 'PATCH', `/master/poli/${poliUmum.id}`, { nama: 'Poli Umum', status_operasional: 'O' });
  const poli = {
    umum: poliUmum?.id ?? await masterAda('poli', 'Poli Umum', { nama: 'Poli Umum' }),
    gigi: await masterAda('poli', 'Poli Gigi', { nama: 'Poli Gigi' }),
    kia: await masterAda('poli', 'Poli KIA', { nama: 'Poli KIA' }),
  };
  const ruang = await masterAda('ruang', 'Ruang Observasi', { nama: 'Ruang Observasi', induk_id: poli.umum });
  for (const b of ['Bed 1', 'Bed 2', 'Bed 3']) await masterAda('bed', b, { nama: b, induk_id: ruang });

  // [kode, nama, jenis, harga umum, harga JKN, kode ICD-9-CM (tindakan)]. Tindakan klinik boleh tanpa harga (kasir melengkapi per kunjungan).
  const tarif = [
    ['KONS-UMUM', 'Konsultasi dokter umum', 'konsultasi', 50_000, 0],
    ['KONS-GIGI', 'Konsultasi dokter gigi', 'konsultasi', 75_000, 0],
    ['KONS-KIA', 'Pemeriksaan kehamilan (ANC)', 'konsultasi', 60_000, 0],
    ['TIN-JAHIT-KECIL', 'Jahit luka ≤ 5 cm', 'tindakan', 75_000, null, '86.59'],
    ['TIN-JAHIT-BESAR', 'Jahit luka > 5 cm', 'tindakan', 150_000, null, '86.59'],
    ['TIN-KUKU', 'Ekstraksi kuku', 'tindakan', 200_000, null, '86.23'],
    ['TIN-NEBU', 'Nebulisasi', 'tindakan', null, null, '93.94'],
    ['TIN-LUKA', 'Perawatan luka sederhana', 'tindakan', 60_000, null, '93.57'],
    ['TIN-CABUT', 'Pencabutan gigi', 'tindakan', 150_000, null, '23.09'],
    ['KMR-OBS', 'Kamar observasi per hari', 'kamar', 250_000, null],
    ['LAB-GDS', 'Gula darah sewaktu', 'lab', 25_000, null],
    ['LAB-HB', 'Hemoglobin', 'lab', 30_000, null],
    ['LAB-KOL', 'Kolesterol total', 'lab', 45_000, null],
    ['LAB-AU', 'Asam urat', 'lab', 35_000, null],
  ];
  const idTarif = {};
  for (const [kode, nama, jenis, harga_umum, harga_jkn, kode_icd9cm] of tarif) idTarif[kode] = await masterAda('tarif', kode, { kode, nama, jenis, harga_umum, harga_jkn, ...(kode_icd9cm ? { kode_icd9cm } : {}) });

  // Jadwal: Senin-Sabtu (dan Minggu, agar demo bisa kapan saja).
  const jadwalAda = (await api('admin', 'GET', '/master/jadwal?ukuran=100')).data?.total ?? 0;
  if (!jadwalAda) {
    const jadwal = [
      [id.dokter, poli.umum, '08:00', '14:00', 30], [id.dokter, poli.umum, '16:00', '21:00', 20],
      [id.drg, poli.gigi, '09:00', '15:00', 12], [id.bidan, poli.kia, '08:00', '13:00', 15],
    ];
    for (const [pengguna_id, lokasi_id, jam_mulai, jam_selesai, kuota] of jadwal) {
      if (!pengguna_id) continue;
      for (let hari = 1; hari <= 7; hari++) {
        const r = await api('admin', 'POST', '/master/jadwal', { pengguna_id, lokasi_id, hari, jam_mulai, jam_selesai, kuota, berlaku_dari: tambahHari(-30) });
        if (r.status >= 300) { gagal++; console.log(`  ✗ jadwal ${pengguna_id}/${hari} -> ${r.status} ${JSON.stringify(r.isi).slice(0, 200)}`); }
      }
    }
    console.log('  ✓ jadwal praktik dibuat');
  }
  return { poli, idTarif };
}

// ---------------------------------------------------------------- profil & website publik
async function siapkanWebsite() {
  console.log('\n[2b] Profil klinik dan website publik (pimpinan)');
  const profil = (await api('admin', 'GET', '/fasyankes/profil')).data;
  if (profil?.nama !== 'Klinik Bhakti Rahayu') {
    await wajib('profil klinik: Klinik Bhakti Rahayu', 'admin', 'PATCH', '/fasyankes/profil', {
      nama: 'Klinik Bhakti Rahayu', jenis: profil?.jenis ?? 'klinik_pratama_rawat_jalan', bentuk_usaha: profil?.bentuk_usaha ?? null,
      kode_registrasi: profil?.kode_registrasi ?? 'KLINIK-CONTOH', organization_id: null, status_akreditasi: null, tanggal_akreditasi: null, puskesmas_wilayah: null,
    });
  }
  const web = (await api('admin', 'GET', '/fasyankes/website')).data ?? {};
  await wajib('website publik aktif (logo, hero, jadwal)', 'admin', 'PUT', '/fasyankes/website', {
    ...Object.fromEntries(Object.entries(web).filter(([k]) => k !== 'nama')),
    aktif: true, slug: 'bhakti-rahayu', judul: 'Layanan kesehatan untuk Anda dan keluarga.',
    ringkasan: 'Temukan layanan, jadwal praktik, dan informasi kunjungan dalam satu tempat.',
    logo_url: '/asset/brand/bhakti-rahayu.png', hero_url: '/asset/ilustrasi/klinik-dokter-pasien-berhijab-v1.png',
    warna_utama: '#0B6B64', tampilkan_jadwal: true, tampilkan_nama_praktisi: true,
  });
}

// ---------------------------------------------------------------- farmasi & lab
// [kata cari KFA, pola nama KFA yang dipilih (sediaan tunggal), nama tampil, satuan, harga]
const OBAT = [
  ['paracetamol 500 mg tablet', /^Paracetamol 500 mg Tablet/, 'Parasetamol 500 mg', 'tablet', 500],
  ['amoxicillin 500 mg kapsul', /^Amoxicillin Trihydrate 500 mg Kapsul/, 'Amoksisilin 500 mg', 'kapsul', 1_200],
  ['ibuprofen 400 mg tablet', /^Ibuprofen 400 mg Tablet/, 'Ibuprofen 400 mg', 'tablet', 800],
  ['cetirizine 10 mg tablet', /^Cetirizine Hydrochloride 10 mg Tablet/, 'Setirizin 10 mg', 'tablet', 700],
  ['omeprazole 20 mg kapsul', /^Omeprazole 20 mg Kapsul/, 'Omeprazol 20 mg', 'kapsul', 1_500],
  ['amlodipine besilate 5 mg tablet', /^Amlodipine Besilate 5 mg Tablet/, 'Amlodipin 5 mg', 'tablet', 600],
  ['metformin hydrochloride 500 mg', /^Metformin Hydrochloride 500 mg Tablet/, 'Metformin 500 mg', 'tablet', 400],
  ['ambroxol hydrochloride 30 mg tablet', /^Ambroxol Hydrochloride 30 mg Tablet/, 'Ambroksol 30 mg', 'tablet', 450],
  ['antasida doen', /ANTASIDA DOEN/, 'Antasida DOEN', 'tablet', 300],
  ['mefenamic acid 500 mg', /^Mefenamic Acid 500 mg Tablet/, 'Asam mefenamat 500 mg', 'tablet', 600],
  ['chlorphenamine maleate 4 mg tablet', /^Chlorphenamine Maleate 4 mg Tablet/, 'CTM 4 mg', 'tablet', 150],
];

async function siapkanFarmasi() {
  console.log('\n[3] Master obat dan stok (apoteker)');
  const ada = (await api('apoteker', 'GET', '/farmasi/master?ukuran=100')).data?.data ?? [];
  const idObat = {};
  for (const [cari, pola, nama, satuan, harga] of OBAT) {
    const lama = ada.find((o) => o.nama_tampil === nama);
    if (lama) { idObat[nama] = lama.id; continue; }
    const kfa = (await api('apoteker', 'GET', `/farmasi/kfa?cari=${encodeURIComponent(cari)}&batas=50`)).data ?? [];
    const pilih = kfa.find((x) => pola.test(x.nama) && x.status === 'aktif') ?? kfa.find((x) => pola.test(x.nama));
    if (!pilih) { gagal++; console.log(`  ✗ KFA tidak ditemukan: ${cari}`); continue; }
    const o = await wajib(`obat ${nama} (KFA ${pilih.kode})`, 'apoteker', 'POST', '/farmasi/master', { kfa_kode: pilih.kode, nama_tampil: nama, satuan, harga });
    if (!o) continue;
    idObat[nama] = o.id;
    await wajib(`stok ${nama}`, 'apoteker', 'POST', '/farmasi/mutasi', { master_obat_id: o.id, jenis: 'terima', batch: `DEMO-${o.id}-A`, kedaluwarsa: tambahHari(540), jumlah: 200 });
  }
  // Satu obat stok menipis dan satu batch hampir kedaluwarsa, agar peringatan stok terlihat saat demo.
  const tipis = idObat['Omeprazol 20 mg'];
  if (tipis && !ada.length) await wajib('stok menipis omeprazol (koreksi)', 'apoteker', 'POST', '/farmasi/mutasi', { master_obat_id: tipis, jenis: 'koreksi', batch: `DEMO-${tipis}-A`, kedaluwarsa: tambahHari(540), jumlah: 8, alasan: 'Stok opname demo' });
  const dekat = idObat['Ambroksol 30 mg'];
  if (dekat && !ada.length) await wajib('batch ambroksol hampir kedaluwarsa', 'apoteker', 'POST', '/farmasi/mutasi', { master_obat_id: dekat, jenis: 'terima', batch: `DEMO-${dekat}-B`, kedaluwarsa: tambahHari(20), jumlah: 30 });
  return idObat;
}

// [kode, nama, LOINC, spesimen, satuan, rujukan min, rujukan maks, kode tarif]
const LAB = [
  ['GDS', 'Gula darah sewaktu', '2339-0', 'Darah kapiler', 'mg/dL', 70, 140, 'LAB-GDS'],
  ['HB', 'Hemoglobin', '718-7', 'Darah vena', 'g/dL', 12, 16, 'LAB-HB'],
  ['KOL', 'Kolesterol total', '2093-3', 'Darah vena', 'mg/dL', 0, 200, 'LAB-KOL'],
  ['AU', 'Asam urat', '3084-1', 'Darah vena', 'mg/dL', 2.4, 7, 'LAB-AU'],
];

async function siapkanLab(idTarif) {
  console.log('\n[4] Master pemeriksaan lab (analis)');
  const ada = (await api('lab', 'GET', '/penunjang/master?ukuran=100')).data;
  const daftar = Array.isArray(ada) ? ada : ada?.data ?? [];
  const idLab = {};
  for (const [kode, nama, loinc, jenis_spesimen, satuan, rujukan_min, rujukan_maks, tarif] of LAB) {
    const lama = daftar.find((p) => p.kode === kode);
    if (lama) { idLab[kode] = lama.id; continue; }
    const p = await wajib(`pemeriksaan ${nama} (LOINC ${loinc})`, 'lab', 'POST', '/penunjang/master', {
      kode, nama, kode_loinc: loinc, jenis_spesimen, satuan, rujukan_min, rujukan_maks,
      rujukan_teks: `${rujukan_min}-${rujukan_maks} ${satuan}`, harga_umum: null, harga_jkn: null, tarif_layanan_id: idTarif[tarif] ?? null, aktif: true,
    });
    if (p) idLab[kode] = p.id;
  }
  return idLab;
}

// ---------------------------------------------------------------- pasien
const PASIEN = [
  ['3273015501800101', 'Siti Aminah', 'perempuan', '1980-01-15', 'Bandung', 'Ibu Rumah Tangga', 'Islam', '081234560101', 'umum'],
  ['3273011006750102', 'Bambang Supriyadi', 'laki_laki', '1975-06-10', 'Bandung', 'Wiraswasta', 'Islam', '081234560102', 'jkn'],
  ['3273016203920103', 'Nur Halimah', 'perempuan', '1992-03-22', 'Cimahi', 'Guru', 'Islam', '081234560103', 'jkn'],
  ['3273010911880104', 'Yohanes Saputra', 'laki_laki', '1988-11-09', 'Garut', 'Karyawan Swasta', 'Kristen', '081234560104', 'umum'],
  ['3273014408600105', 'Ratna Sari Dewi', 'perempuan', '1960-08-04', 'Bandung', 'Pensiunan', 'Islam', '081234560105', 'jkn'],
  ['3273012512010106', 'Rizky Ramadhan', 'laki_laki', '2001-12-25', 'Sumedang', 'Mahasiswa', 'Islam', '081234560106', 'umum'],
  ['3273015707950107', 'Putu Ayu Lestari', 'perempuan', '1995-07-17', 'Denpasar', 'Perawat', 'Hindu', '081234560107', 'umum'],
  ['3273010302680108', 'Hasan Basri', 'laki_laki', '1968-02-03', 'Tasikmalaya', 'Petani', 'Islam', '081234560108', 'jkn'],
  ['3273014110990109', 'Melati Kusuma', 'perempuan', '1999-10-01', 'Bandung', 'Desainer', 'Buddha', '081234560109', 'asuransi'],
  ['3273011504830110', 'Teguh Wibowo', 'laki_laki', '1983-04-15', 'Bogor', 'PNS', 'Islam', '081234560110', 'jkn'],
  ['3273016612970111', 'Anisa Fitriani', 'perempuan', '1997-12-26', 'Bandung', 'Karyawan Swasta', 'Islam', '081234560111', 'umum'],
  ['3273010707550112', 'Darmawan Hadi', 'laki_laki', '1955-07-07', 'Cirebon', 'Pensiunan', 'Islam', '081234560112', 'jkn'],
];

async function siapkanPasien() {
  console.log('\n[5] Registrasi pasien (petugas pendaftaran)');
  const teks = (await api('daftar', 'GET', '/pasien/teks-persetujuan')).data;
  const id = [];
  for (const [nik, nama, jenis_kelamin, tanggal_lahir, tempat_lahir, pekerjaan, agama, nomor_hp, bayar] of PASIEN) {
    const cari = (await api('daftar', 'GET', `/pasien?cari=${nik}&ukuran=5`)).data?.data ?? [];
    if (cari[0]) { id.push({ id: cari[0].id, nama, bayar }); continue; }
    const p = await wajib(`pasien ${nama}`, 'daftar', 'POST', '/pasien', {
      jalur_identitas: 'nik', nik, nama, nomor_hp, tanggal_lahir, jenis_kelamin, tempat_lahir, pekerjaan, agama,
      ibu_kandung: 'Ibu ' + nama.split(' ')[0], bahasa: 'Indonesia', status_kawin: 'Kawin', pendidikan: 'SMA',
      alamat: `Jl. Contoh No. ${id.length + 1}, Bandung (alamat fiktif)`,
      jkn_nomor_kartu: bayar === 'jkn' ? `000${nik.slice(-10)}` : null,
      asuransi_nama: bayar === 'asuransi' ? 'Asuransi Demo Sehat (fiktif)' : null,
      asuransi_nomor_polis: bayar === 'asuransi' ? `POL-${nik.slice(-6)}` : null,
      persetujuan: { teks_persetujuan_id: teks.id, bentuk: 'tertulis', penandatangan: 'pasien', setuju: true },
    });
    if (p) id.push({ id: p.id, nama, bayar });
  }
  // Pasien anak dengan wali (tidak cakap).
  const anak = (await api('daftar', 'GET', '/pasien?cari=Kevin%20Pratama&ukuran=5')).data?.data ?? [];
  if (!anak.length) {
    const p = await wajib('pasien anak Kevin Pratama (dengan wali)', 'daftar', 'POST', '/pasien', {
      jalur_identitas: 'nik', nik: '3273010505200113', nama: 'Kevin Pratama', tanggal_lahir: '2020-05-05', jenis_kelamin: 'laki_laki', tempat_lahir: 'Bandung',
      alamat: 'Jl. Contoh No. 99, Bandung (alamat fiktif)', tidak_cakap: true,
      wali: [{ hubungan: 'Ibu', nama: 'Siti Aminah', kontak: '081234560101' }],
      persetujuan: { teks_persetujuan_id: teks.id, bentuk: 'tertulis', penandatangan: 'wali', wali_ke: 0, setuju: true },
    });
    if (p) id.push({ id: p.id, nama: 'Kevin Pratama', bayar: 'umum' });
  }
  return id;
}

// ---------------------------------------------------------------- alur kunjungan
const KASUS = [
  { keluhan: 'Demam dan batuk pilek 3 hari, sesak ringan', ttv: { sistolik: 120, diastolik: 80, nadi: 92, suhu: 38.2, respirasi: 22, spo2: 96, berat_badan: 60, tinggi_badan: 158 },
    periksa: { keadaan_umum: 'Tampak sakit ringan', kepala_leher: 'Faring hiperemis', thorax: 'Vesikuler, wheezing minimal', abdomen: 'Supel' },
    dx: [{ kode: 'J06.9', nama: 'Acute upper respiratory infection, unspecified', peran: 'utama' }],
    // Tindakan klinik tanpa harga acuan: kasir melengkapi harga sebelum pembayaran.
    tindakan: [['TIN-NEBU', '93.94', 'Nebulisasi', 1]],
    // Racikan puyer: ½ tab x 10 bungkus = 5 tab per bahan (dibulatkan ke atas).
    resep: { teks: 'R/ Parasetamol 500 mg tab ½\n    CTM 4 mg tab ½\n    m.f. pulv. dtd No. X\n    s 3 dd pulv I (bila demam)\nR/ Ambroxol 30 mg tab No. X\n    s 3 dd tab I',
      item: [['Parasetamol 500 mg', 'Racikan puyer: 3 x 1 bungkus bila demam', 5, 'puyer'], ['CTM 4 mg', 'Racikan puyer: 3 x 1 bungkus bila demam', 5, 'puyer'], ['Ambroksol 30 mg', '3 x 1 tablet', 10]] } },
  { keluhan: 'Kontrol tekanan darah tinggi, pusing tengkuk', ttv: { sistolik: 160, diastolik: 100, nadi: 84, suhu: 36.6, respirasi: 18, spo2: 97, berat_badan: 78, tinggi_badan: 168 },
    periksa: { keadaan_umum: 'Baik, kompos mentis', thorax: 'Jantung reguler, murmur (-)', ekstremitas: 'Edema (-)' },
    dx: [{ kode: 'I10', nama: 'Essential (primary) hypertension', peran: 'utama' }], lab: ['KOL', 'AU'],
    resep: { teks: 'R/ Amlodipine 5 mg tab No. XXX\n    s 1 dd tab I (pagi)', item: [['Amlodipin 5 mg', '1 x 1 tablet pagi', 30]] } },
  { keluhan: 'Nyeri ulu hati dan mual sejak 2 hari', ttv: { sistolik: 110, diastolik: 70, nadi: 80, suhu: 36.8, respirasi: 18, spo2: 99, berat_badan: 55, tinggi_badan: 155 },
    periksa: { keadaan_umum: 'Baik', abdomen: 'Nyeri tekan epigastrium (+)' },
    dx: [{ kode: 'K29.7', nama: 'Gastritis, unspecified', peran: 'utama' }],
    resep: { teks: 'R/ Omeprazole 20 mg caps No. VI\n    s 2 dd caps I a.c.\nR/ Antasida DOEN tab No. X\n    s 3 dd tab I (kunyah)', item: [['Omeprazol 20 mg', '2 x 1 kapsul sebelum makan', 6], ['Antasida DOEN', '3 x 1 tablet dikunyah', 10]] } },
  { keluhan: 'Sering haus dan sering BAK, riwayat kencing manis', ttv: { sistolik: 130, diastolik: 85, nadi: 88, suhu: 36.7, respirasi: 18, spo2: 98, berat_badan: 82, tinggi_badan: 165 },
    periksa: { keadaan_umum: 'Baik', ekstremitas: 'Sensibilitas kaki baik' },
    dx: [{ kode: 'E11.9', nama: 'Type 2 diabetes mellitus without complications', peran: 'utama' }], lab: ['GDS'],
    resep: { teks: 'R/ Glucophage 500 mg tab No. LX\n    s 2 dd tab I p.c.', item: [['Metformin 500 mg', '2 x 1 tablet sesudah makan', 60]] } },
  { keluhan: 'Luka robek telapak tangan kanan terkena pisau dapur', ttv: { sistolik: 125, diastolik: 80, nadi: 84, suhu: 36.5, respirasi: 16, spo2: 98, berat_badan: 70, tinggi_badan: 163 },
    periksa: { keadaan_umum: 'Baik', ekstremitas: 'Vulnus laceratum palmar dekstra panjang 3 cm, perdarahan aktif minimal' },
    dx: [{ kode: 'S61.9', nama: 'Open wound of wrist and hand part, part unspecified', peran: 'utama' }],
    tindakan: [['TIN-JAHIT-KECIL', '86.59', 'Jahit luka ≤ 5 cm', 1], ['TIN-LUKA', '93.57', 'Perawatan luka sederhana', 1]],
    resep: { teks: 'R/ Ibuprofen 400 mg tab No. X\n    s 3 dd tab I p.c. (bila nyeri)', item: [['Ibuprofen 400 mg', '3 x 1 tablet sesudah makan', 10]] } },
];

/** Skenario per pasien: sampai tahap mana kunjungannya dibawa. */
const TARGET = ['ditutup', 'ditutup', 'ditutup', 'kasir', 'resep', 'lab', 'pemeriksaan', 'skrining', 'antre', 'antre'];

async function jalankanKunjungan(pasien, poli, idObat, idLab, idTarif) {
  console.log('\n[6] Kunjungan rawat jalan hari ini dengan berbagai tahap');
  const sudah = (await api('daftar', 'GET', `/pasien?tanggal=${hariIni}&ukuran=100`)).data?.data?.filter((p) => p.kunjungan) ?? [];
  if (sudah.length) { console.log(`  • ${sudah.length} kunjungan hari ini sudah ada, dilewati`); return; }
  const opsi = (await api('daftar', 'GET', '/kunjungan/opsi')).data;
  const dpjp = opsi?.dpjp?.find?.((d) => /Ahmad/.test(d.nama ?? d.label))?.id ?? opsi?.praktisi?.find?.((d) => /Ahmad/.test(d.nama ?? d.label))?.id;
  const idDokter = dpjp ?? (await api('dokter', 'GET', '/saya')).data?.id;
  // Shift kasir dibuka sekali.
  const shift = await api('kasir', 'GET', '/kasir/shift');
  if (!shift.data?.terbuka) await wajib('buka shift kasir (kas awal Rp500.000)', 'kasir', 'POST', '/kasir/shift/buka', { kas_awal: 500_000 });

  for (const [i, target] of TARGET.entries()) {
    const p = pasien[i];
    if (!p) break;
    const kasus = KASUS[i % KASUS.length];
    console.log(`  — ${p.nama} → ${target}`);
    const k = await wajib('daftar kunjungan', 'daftar', 'POST', '/kunjungan', {
      pasien_id: p.id, jenis: 'AMB', lokasi_id: poli.umum, dpjp_id: idDokter, cara_pembayaran: p.bayar,
      nomor_sep: p.bayar === 'jkn' ? `0301R00111${String(26000 + i)}V00${i}` : null, keluhan_singkat: kasus.keluhan,
    });
    if (!k || target === 'antre') continue;
    const kid = k.id;
    const antreanId = k.antrean?.id;
    if (antreanId) { await api('perawat', 'POST', `/antrean/${antreanId}/panggil`); await api('perawat', 'POST', `/antrean/${antreanId}/mulai`); }
    // Skrining perawat
    await wajib('tanda vital (perawat)', 'perawat', 'PUT', `/kunjungan/${kid}/klinis/tanda_vital`, { isi: kasus.ttv });
    // Skrining keperawatan (P6): default keadaan baik, alergi dan sebagian temuan diubah agar penanda terlihat.
    await wajib('skrining keperawatan (perawat)', 'perawat', 'PUT', `/kunjungan/${kid}/klinis/keperawatan`, {
      isi: {
        ...DEFAULT_KEPERAWATAN,
        ...(i === 1 ? { alergi: 'Penisilin' } : {}),
        ...(i % 3 === 2 ? { nyeri_jenis: 'akut', nyeri_skala: 4, nyeri_lokasi: 'Kepala', nyeri_durasi: '2 hari', nyeri_frekuensi: 'Hilang timbul', nyeri_hilang_bila: 'Istirahat' } : {}),
        ...(i === 4 ? { jatuh_tidak_seimbang: true } : {}),
        skrining_visual: 'hijau',
      },
    });
    await wajib('anamnesis (perawat)', 'perawat', 'PUT', `/kunjungan/${kid}/klinis/anamnesis`, { isi: { keluhan_utama: kasus.keluhan, riwayat_pribadi: null, riwayat_keluarga: null, penyerta: null } });
    if (target === 'skrining') continue;
    // Pemeriksaan dokter
    await wajib('pemeriksaan fisik (dokter)', 'dokter', 'PUT', `/kunjungan/${kid}/klinis/pemeriksaan`, { isi: kasus.periksa });
    await wajib('diagnosis ICD-10 (dokter)', 'dokter', 'PUT', `/kunjungan/${kid}/klinis/diagnosis`, { isi: { item: kasus.dx } });
    await wajib('assessment (dokter)', 'dokter', 'PUT', `/kunjungan/${kid}/klinis/assessment`, { isi: { isi: `${kasus.dx[0].nama}. Kondisi umum stabil.` } });
    await wajib('plan (dokter)', 'dokter', 'PUT', `/kunjungan/${kid}/klinis/plan`, { isi: { isi: 'Terapi simtomatik, edukasi, kontrol bila keluhan menetap.' } });
    if (kasus.tindakan) {
      // Tindakan dari daftar tindakan klinik: item tagihan tindakan dibuat otomatis (harga sesuai cara bayar).
      const item = kasus.tindakan.map(([kodeTarif, kode, nama, jumlah]) => ({ kode, nama, tarif_layanan_id: idTarif[kodeTarif] ?? null, jumlah, mulai: new Date(Date.now() - 10 * 60_000).toISOString() }));
      await wajib('tindakan dari daftar tindakan klinik (dokter)', 'dokter', 'PUT', `/kunjungan/${kid}/klinis/tindakan`, { isi: { item } });
    }
    if (target === 'pemeriksaan') continue;
    const labKode = kasus.lab ?? (target === 'lab' ? ['GDS', 'HB'] : null);
    if (labKode) {
      const order = await wajib('order lab (dokter)', 'dokter', 'POST', `/kunjungan/${kid}/penunjang/order`, { pemeriksaan_ids: labKode.map((c) => idLab[c]).filter(Boolean), prioritas: 'rutin', catatan: null });
      const orders = Array.isArray(order) ? order : order?.order ?? (order ? [order] : []);
      if (target !== 'lab') {
        for (const o of orders) {
          if (!o?.id) continue;
          await wajib(`ambil spesimen ${o.nama ?? o.id} (analis)`, 'lab', 'POST', `/penunjang/order/${o.id}/spesimen`, { asal: 'Vena mediana cubiti', waktu_ambil: new Date(Date.now() - 60_000).toISOString() });
          const nilai = { 'Kolesterol total': ['238', 'tinggi'], 'Asam urat': ['6.1', 'normal'], 'Gula darah sewaktu': ['212', 'tinggi'] }[o.nama] ?? ['13.5', 'normal'];
          await wajib(`hasil ${o.nama ?? o.id} (analis)`, 'lab', 'PUT', `/penunjang/order/${o.id}/hasil`, { nilai: nilai[0], interpretasi: nilai[1], catatan: null });
          await wajib(`validasi ${o.nama ?? o.id} (analis)`, 'lab', 'POST', `/penunjang/order/${o.id}/validasi`, {});
        }
      }
      if (target === 'lab') continue;
    }
    // Dokter menulis resep teks bebas (P3); item obat dari stok diisi apoteker saat telaah.
    const resep = await wajib('resep teks (dokter)', 'dokter', 'POST', `/kunjungan/${kid}/resep`, { teks: kasus.resep.teks });
    await wajib('tindak lanjut pulang (dokter)', 'dokter', 'PUT', `/kunjungan/${kid}/klinis/tindak_lanjut`, { isi: { jenis: 'pulang', catatan: 'Kontrol 1 minggu bila perlu' } });
    await wajib('selesai pemeriksaan → resep', 'dokter', 'POST', `/kunjungan/${kid}/klinis/selesai`, { tahap: 'resep' });
    if (antreanId) await api('perawat', 'POST', `/antrean/${antreanId}/selesai`);
    if (target === 'resep') continue;
    const resepId = resep?.id ?? resep?.resep?.id;
    const item = kasus.resep.item.map(([nama, aturan_pakai, jumlah, bentuk]) => ({ master_obat_id: idObat[nama], aturan_pakai, jumlah, bentuk: bentuk ?? null, rute: 'oral' })).filter((x) => x.master_obat_id);
    await wajib('telaah + item resep (apoteker)', 'apoteker', 'POST', `/resep/${resepId}/telaah`, { administratif: true, farmasetik: true, klinis: true, catatan: null, item });
    await wajib('resep siap (apoteker)', 'apoteker', 'POST', `/resep/${resepId}/siap`, {});
    if (target === 'kasir') continue;
    // Kasir menambah biaya konsultasi dari master tarif (harga JKN untuk pasien JKN).
    const kas = (await api('kasir', 'GET', `/kunjungan/${kid}/kasir`)).data;
    const kons = kas?.tarif?.find((t) => t.kode === 'KONS-UMUM');
    let g = kons && await wajib('tambah konsultasi dari tarif (kasir)', 'kasir', 'POST', `/kunjungan/${kid}/tagihan/item`, { tarif_id: kons.id, jumlah: 1 });
    // Tindakan tanpa harga acuan (mis. nebulisasi) dilengkapi kasir agar tagihan lengkap.
    for (const it of (g ?? kas)?.tagihan?.item?.filter((x) => x.harga === null) ?? []) {
      g = await wajib(`lengkapi harga ${it.nama} (kasir)`, 'kasir', 'POST', `/kunjungan/${kid}/tagihan/item/${it.id}/harga`, { harga: 50_000 }) ?? g;
    }
    const total = (g ?? kas)?.tagihan?.total ?? 0;
    // Pasien ketiga dibayar dua metode (QRIS separuh, sisanya tunai dibulatkan: kembalian hanya dari tunai).
    const barisBayarDemo = (dua, t) => {
      const tunai = (n) => Math.ceil(n / 10_000) * 10_000 || 10_000;
      const qris = Math.floor(t / 2);
      return dua && qris > 0 ? [{ metode: 'qris', jumlah: qris }, { metode: 'tunai', jumlah: tunai(t - qris) }] : [{ metode: 'tunai', jumlah: tunai(t) }];
    };
    if (p.bayar === 'jkn') console.log(`  • pasien JKN: tagihan Rp${total.toLocaleString('id-ID')} ditanggung JKN, tanpa pembayaran`);
    else await wajib(`pembayaran Rp${total.toLocaleString('id-ID')} (kasir)`, 'kasir', 'POST', `/kunjungan/${kid}/pembayaran`, { pembayaran: barisBayarDemo(i === 2, total) });
    await wajib('serah terima obat (apoteker)', 'apoteker', 'POST', `/kunjungan/${kid}/serah-terima-obat`, {});
    await wajib('tutup kunjungan (kasir)', 'kasir', 'POST', `/kunjungan/${kid}/tutup`, {});
  }
}

// ---------------------------------------------------------------- uji izin
async function ujiIzin() {
  console.log('\n[7] Uji pembatasan izin (harus DITOLAK)');
  const cek = [
    ['kasir', 'GET', '/farmasi/master', 'kasir membuka master obat'],
    ['apoteker', 'POST', '/kasir/shift/buka', 'apoteker membuka shift kasir', { kas_awal: 0 }],
    ['daftar', 'GET', '/audit', 'pendaftaran membuka log audit'],
    ['lab', 'POST', '/pengguna', 'analis membuat akun', {}],
    ['auditor', 'GET', '/farmasi/master', 'auditor membuka master obat'],
  ];
  for (const [siapa, m, p, label, b] of cek) {
    const r = await api(siapa, m, p, b);
    const ok = r.status === 403;
    if (!ok) gagal++;
    console.log(`  ${ok ? '✓' : '✗'} ${label} -> ${r.status}`);
  }
  console.log('\n[8] Uji akses yang harus DIIZINKAN');
  for (const [siapa, p, label] of [['auditor', '/audit', 'auditor membuka log audit'], ['pdp', '/pdp/ringkasan', 'PPDP membuka ringkasan PDP'], ['rm', '/rekam-medis/berkas', 'perekam medis membuka berkas RM'], ['kasir', '/kasir/rekap', 'kasir membuka rekap'], ['admin', '/statistik/pelayanan', 'pimpinan membuka statistik']]) {
    const r = await api(siapa, 'GET', p);
    const ok = r.status === 200;
    if (!ok) gagal++;
    console.log(`  ${ok ? '✓' : '✗'} ${label} -> ${r.status}${ok ? '' : ' ' + JSON.stringify(r.isi).slice(0, 150)}`);
  }
}

// ----------------------------------------------------------------
// Database baru: akun Pimpinan bawaan seed diganti menjadi akun admin demo. Username awal diatur USERNAME_AWAL di .env
// (demo lokal: pimpinan-awal), karena username baru tidak boleh sama dengan username awal.
const USER_AWAL = process.env.USERNAME_AWAL || 'pimpinan-awal';
const SANDI_AWAL = process.env.KATA_SANDI_AWAL || 'klira-awal-2026';
if (!(await masuk('admin', ADMIN.username, ADMIN.kata_sandi)) && (await masuk('admin', USER_AWAL, SANDI_AWAL))) {
  await api('admin', 'POST', '/ganti-kredensial', { username: ADMIN.username, kata_sandi_lama: SANDI_AWAL, kata_sandi: ADMIN.kata_sandi, konfirmasi_kata_sandi: ADMIN.kata_sandi });
}
if (!(await masuk('admin', ADMIN.username, ADMIN.kata_sandi))) {
  console.error(`Gagal masuk sebagai ${ADMIN.username}. Pastikan server jalan di ${BASE} dan kredensial benar.`);
  process.exit(1);
}
console.log(`Mengisi data demo ke ${BASE} (tanggal ${hariIni})`);
const idAkun = await siapkanAkun();
const { poli, idTarif } = await siapkanMaster(idAkun);
await siapkanWebsite();
const idObat = await siapkanFarmasi();
const idLab = await siapkanLab(idTarif);
const pasien = await siapkanPasien();
await jalankanKunjungan(pasien, poli, idObat, idLab, idTarif);
await ujiIzin();
const kesiapan = (await api('admin', 'GET', '/master/kesiapan')).data?.item ?? [];
console.log('\nKesiapan pengaturan awal:', kesiapan.map((k) => `${k.kunci}=${k.jumlah}${k.ok ? '' : '(!)'}`).join(', '));
console.log(gagal ? `\nSelesai dengan ${gagal} langkah gagal (lihat tanda ✗).` : '\nSelesai tanpa kegagalan.');
console.log(`Semua akun demo memakai kata sandi: ${SANDI_DEMO}`);
process.exit(gagal ? 1 : 0);
