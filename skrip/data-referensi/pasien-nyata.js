const NAMA_DEPAN_L = [
  'Ahmad', 'Budi', 'Agus', 'Eko', 'Hendra', 'Rizki', 'Wahyu', 'Fajar', 'Dedi', 'Bambang',
  'Hasan', 'Teguh', 'Yohanes', 'Darmawan', 'Arif', 'Adi', 'Surya', 'Dimas', 'Irfan', 'Yoga',
  'Reza', 'Ilham', 'Taufik', 'Bagus', 'Slamet',
];
const NAMA_DEPAN_P = [
  'Siti', 'Dewi', 'Ratna', 'Putri', 'Anisa', 'Maya', 'Lestari', 'Nur', 'Melati', 'Rina',
  'Sri', 'Indah', 'Ayu', 'Kartika', 'Wulan', 'Fitria', 'Dian', 'Ningsih', 'Yuni', 'Rahmawati',
  'Tari', 'Vera', 'Laila', 'Mega', 'Sari',
];
const NAMA_TENGAH = ['Fauzi', 'Pratama', 'Nur', 'Ayu', 'Dwi', 'Tri', 'Adi', 'Putra', 'Putri', 'Kurnia', 'Citra', 'Bayu'];
const NAMA_BELAKANG = [
  'Santoso', 'Pratama', 'Kusuma', 'Wibowo', 'Hidayat', 'Wulandari', 'Saputra', 'Permata', 'Nugroho', 'Rahayu',
  'Setiawan', 'Wijaya', 'Hartono', 'Susanto', 'Kurniawan', 'Gunawan', 'Hakim', 'Nasution', 'Siregar', 'Harahap',
  'Mahendra', 'Utami', 'Ramadhan', 'Suryadi', 'Purnomo',
];
const KOTA = ['Bandung', 'Jakarta', 'Surabaya', 'Semarang', 'Yogyakarta', 'Bogor', 'Bekasi', 'Cimahi', 'Garut', 'Tasikmalaya', 'Cirebon', 'Sumedang', 'Depok', 'Tangerang', 'Malang'];
const JALAN = ['Merdeka', 'Sudirman', 'Asia Afrika', 'Diponegoro', 'Ahmad Yani', 'Gajah Mada', 'Soekarno-Hatta', 'Cihampelas', 'Dago', 'Buah Batu', 'Siliwangi', 'Veteran'];
const PEKERJAAN = ['Karyawan Swasta', 'Wiraswasta', 'PNS', 'Ibu Rumah Tangga', 'Guru', 'Petani', 'Pedagang', 'Mahasiswa', 'Pensiunan', 'Perawat', 'Teknisi', 'Pegawai Bank'];
const AGAMA = ['Islam', 'Islam', 'Islam', 'Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha'];
const PENDIDIKAN = ['SD', 'SMP', 'SMA', 'D3', 'S1', 'S2'];
const OPERATOR_HP = ['0812', '0813', '0821', '0852', '0857', '0878'];
const KODE_WILAYAH_KTP = ['327301', '327302', '327308', '320405', '327701', '317101', '327501', '327101'];

/** Bangkitkan satu profil pasien Indonesia deterministik (tanpa angka di nama) untuk indeks 1..N. */
export function buatProfilPasienNyata(i) {
  const perempuan = i % 2 === 1;
  const depanList = perempuan ? NAMA_DEPAN_P : NAMA_DEPAN_L;
  const idxDepan = i % depanList.length;
  const idxBelakang = Math.floor(i / depanList.length) % NAMA_BELAKANG.length;
  const putaran = Math.floor(i / (depanList.length * NAMA_BELAKANG.length));
  const nama = putaran === 0
    ? `${depanList[idxDepan]} ${NAMA_BELAKANG[idxBelakang]}`
    : `${depanList[idxDepan]} ${NAMA_TENGAH[(putaran + i) % NAMA_TENGAH.length]} ${NAMA_BELAKANG[idxBelakang]}`;

  const tahun = 1955 + ((i * 7) % 52);
  const bulanNum = 1 + ((i * 3) % 12);
  const hariNum = 1 + ((i * 5) % 28);
  const tanggal_lahir = `${tahun}-${String(bulanNum).padStart(2, '0')}-${String(hariNum).padStart(2, '0')}`;
  const ddNik = String(perempuan ? hariNum + 40 : hariNum).padStart(2, '0');
  const mmNik = String(bulanNum).padStart(2, '0');
  const yyNik = String(tahun).slice(-2);
  const prefixWil = KODE_WILAYAH_KTP[i % KODE_WILAYAH_KTP.length];
  const nik = `${prefixWil}${ddNik}${mmNik}${yyNik}${String(i).padStart(4, '0')}`;

  const nomor_hp = `${OPERATOR_HP[i % OPERATOR_HP.length]}${String(10000000 + i * 7919).slice(-8)}`;
  const punyaJkn = i % 5 !== 0 && i % 5 !== 4;
  const jkn_nomor_kartu = punyaJkn ? `000${nik.slice(-10)}` : null;
  const umur = 2026 - tahun;
  const status_kawin = umur < 22 ? 'Belum Kawin' : i % 7 === 0 ? 'Belum Kawin' : 'Kawin';
  const alamat = `Jl. ${JALAN[i % JALAN.length]} No. ${1 + (i % 180)}, RT ${String(1 + (i % 12)).padStart(2, '0')}/RW ${String(1 + (i % 8)).padStart(2, '0')}, ${KOTA[i % KOTA.length]}`;

  return {
    indeks: i,
    ihs_id: `PPF${String(i).padStart(5, '0')}`,
    nik,
    nama,
    nomor_hp,
    tanggal_lahir,
    tgl_pcare: `${String(hariNum).padStart(2, '0')}-${mmNik}-${tahun}`,
    jenis_kelamin: perempuan ? 'perempuan' : 'laki_laki',
    sex: perempuan ? 'P' : 'L',
    gender_fhir: perempuan ? 'female' : 'male',
    tempat_lahir: KOTA[(i * 3) % KOTA.length],
    pekerjaan: PEKERJAAN[i % PEKERJAAN.length],
    agama: AGAMA[i % AGAMA.length],
    bahasa: 'Indonesia',
    status_kawin,
    pendidikan: PENDIDIKAN[i % PENDIDIKAN.length],
    alamat,
    jkn_nomor_kartu,
  };
}

/** Daftar `jumlah` profil pasien realistis untuk seeder dan dummy integrasi. */
export function daftarPasienNyata(jumlah = 1000) {
  const hasil = [];
  for (let i = 1; i <= jumlah; i++)
    hasil.push(buatProfilPasienNyata(i));
  return hasil;
}
