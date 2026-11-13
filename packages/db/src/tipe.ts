export type NilaiJson = string | number | boolean | null | NilaiJson[] | { [kunci: string]: NilaiJson };

export type JenisFasyankes = "klinik_pratama_rawat_jalan" | "klinik_pratama_rawat_inap";
export type EnvironmentSatusehat = "sandbox" | "produksi";
export type JenisLokasi = "poli" | "ruang" | "bed";
export type StatusOperasional = "U" | "O";
export type AksiIzin = "input" | "perbaikan" | "lihat";
export type CakupanIzin = "unit" | "layanan";
export type TipeIzinAkun = "tambah" | "kurang";
export type JenisKelamin = "laki_laki" | "perempuan";
export type StatusIdentitas = "lengkap" | "sementara";
export type JenisKunjungan = "AMB" | "IMP";
export type StatusKunjungan = "planned" | "arrived" | "in-progress" | "finished";
export type TahapLayanan = "menunggu_skrining" | "pemeriksaan" | "resep" | "kasir" | "ditutup";
export type CaraPembayaran = "umum" | "jkn" | "asuransi";
export type TipePeserta = "ATND" | "SPRF";
export type StatusAntrean = "menunggu" | "dipanggil" | "dilayani" | "selesai" | "batal";
export type JenisPersetujuan = "general" | "tindakan" | "pembukaan" | "PDP";
export type JenisTarif = "konsultasi" | "tindakan" | "lab" | "kamar" | "obat";
export type TingkatWilayah = "provinsi" | "kabupaten_kota" | "kecamatan" | "kelurahan_desa";
export type KelompokObservasi = "tanda_vital" | "pemeriksaan";
export type PeranDiagnosis = "utama" | "penyerta";
export type JenisTindakLanjut = "pulang" | "rujuk" | "rawat_inap";
export type SistemTerminologi = "icd10" | "icd9cm" | "loinc" | "snomed" | "ucum";
export type JenisFavorit = "diagnosis" | "tindakan" | "resep";
export type BagianTemplat = "anamnesis" | "pemeriksaan";
export type JenisNyeri = "tidak" | "akut" | "kronis";
export type SkriningVisual = "hijau" | "kuning" | "merah";
export type StatusOrderPenunjang = "dipesan" | "spesimen_diambil" | "menunggu_hasil" | "divalidasi";
export type StatusTagihan = "belum_lengkap" | "lengkap";
export type StatusPembayaran = "belum" | "sebagian" | "lunas";
export type StatusResep = "diajukan" | "ditelaah" | "siap" | "diserahkan";
export type JenisMutasi = "terima" | "keluar" | "koreksi";
export type MetodeBayar = "tunai" | "transfer" | "qris";
export type StatusPerbaikan = "diajukan" | "disetujui" | "ditolak";
export type DasarPembukaan = "persetujuan" | "hukum";
export type StatusPembukaan = "diajukan" | "disetujui" | "ditolak";
export type BentukPenyampaian = "elektronik" | "cetak";
export type KelasRawat = "satu" | "dua" | "tiga" | "vip" | "vvip";
export type IndikatorKelas = "kelas_tetap" | "naik_kelas" | "turun_kelas" | "titip_rawat";
export type DisposisiPulang = "home" | "aadvice" | "other-hcf" | "exp-lt48h" | "exp-gt48h" | "oth";
export type StatusKlaim = "menunggu_sep" | "siap_diajukan" | "diajukan" | "dikembalikan" | "diajukan_ulang" | "ditolak" | "dibayar" | "lewat_batas_waktu";
export type JenisHak = "akses" | "salinan" | "koreksi" | "hapus" | "batasi" | "ekspor" | "keberatan";
export type SaluranHak = "langsung" | "surat" | "elektronik" | "telepon";
export type StatusHak = "diterima" | "disetujui" | "ditolak" | "dilaksanakan" | "selesai";
export type StatusMusnah = "direncanakan" | "diperintahkan" | "dilaksanakan" | "selesai";
export type BagianNarasi = "diagnosis_banding" | "kie" | "obat_poli";

export type Fasyankes = {
  id: number;
  fasyankes_id: number;
  nama: string;
  jenis: JenisFasyankes;
  bentuk_usaha: string | null;
  kode_registrasi: string | null;
  organization_id: string | null;
  status_akreditasi: string | null;
  tanggal_akreditasi: Date | null;
  puskesmas_wilayah: string | null;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type FasyankesBaru = {
  fasyankes_id: number;
  nama: string;
  jenis: JenisFasyankes;
  bentuk_usaha?: string | null;
  kode_registrasi?: string | null;
  organization_id?: string | null;
  status_akreditasi?: string | null;
  tanggal_akreditasi?: Date | null;
  puskesmas_wilayah?: string | null;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type KredensialSatusehat = {
  id: number;
  fasyankes_id: number;
  environment: EnvironmentSatusehat;
  client_id: string;
  client_secret_terenkripsi: string;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type KredensialSatusehatBaru = {
  fasyankes_id: number;
  environment: EnvironmentSatusehat;
  client_id: string;
  client_secret_terenkripsi: string;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type Lokasi = {
  id: number;
  fasyankes_id: number;
  nama: string;
  jenis: JenisLokasi;
  induk_id: number | null;
  status_operasional: StatusOperasional;
  ihs_location_id: string | null;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type LokasiBaru = {
  fasyankes_id: number;
  nama: string;
  jenis: JenisLokasi;
  induk_id?: number | null;
  status_operasional?: StatusOperasional;
  ihs_location_id?: string | null;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type Pengguna = {
  id: number;
  fasyankes_id: number;
  nama: string;
  nik: string;
  username: string;
  kata_sandi_hash: string;
  aktif: boolean;
  wajib_ganti_kredensial: boolean;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type PenggunaBaru = {
  fasyankes_id: number;
  nama: string;
  nik: string;
  username: string;
  kata_sandi_hash: string;
  aktif?: boolean;
  wajib_ganti_kredensial?: boolean;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type ProfilProfesi = {
  id: number;
  fasyankes_id: number;
  pengguna_id: number;
  profesi: string;
  nomor_sip: string | null;
  masa_berlaku_sip: Date | null;
  ihs_practitioner_id: string | null;
  aktif: boolean;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type ProfilProfesiBaru = {
  fasyankes_id: number;
  pengguna_id: number;
  profesi: string;
  nomor_sip?: string | null;
  masa_berlaku_sip?: Date | null;
  ihs_practitioner_id?: string | null;
  aktif?: boolean;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type Pasien = {
  id: number;
  fasyankes_id: number;
  nomor_rm: string;
  nik: string | null;
  nama: string;
  nomor_hp: string | null;
  ibu_kandung: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: Date;
  jenis_kelamin: JenisKelamin;
  agama: string | null;
  suku: string | null;
  bahasa: string | null;
  pekerjaan: string | null;
  pendidikan: string | null;
  status_kawin: string | null;
  alamat: string | null;
  kode_wilayah: string | null;
  nomor_paspor: string | null;
  nomor_kitas: string | null;
  ihs_number: string | null;
  jkn_nomor_kartu: string | null;
  asuransi_nama: string | null;
  asuransi_nomor_polis: string | null;
  status_identitas: StatusIdentitas;
  jalur_identitas: string;
  tidak_cakap: boolean;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type PasienBaru = {
  fasyankes_id: number;
  nomor_rm: string;
  nik?: string | null;
  nama: string;
  nomor_hp?: string | null;
  ibu_kandung?: string | null;
  tempat_lahir?: string | null;
  tanggal_lahir: Date;
  jenis_kelamin: JenisKelamin;
  agama?: string | null;
  suku?: string | null;
  bahasa?: string | null;
  pekerjaan?: string | null;
  pendidikan?: string | null;
  status_kawin?: string | null;
  alamat?: string | null;
  kode_wilayah?: string | null;
  nomor_paspor?: string | null;
  nomor_kitas?: string | null;
  ihs_number?: string | null;
  jkn_nomor_kartu?: string | null;
  asuransi_nama?: string | null;
  asuransi_nomor_polis?: string | null;
  status_identitas?: StatusIdentitas;
  jalur_identitas?: string;
  tidak_cakap?: boolean;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type WaliKeluarga = {
  id: number;
  fasyankes_id: number;
  pasien_id: number;
  hubungan: string;
  nama: string;
  kontak: string | null;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type WaliKeluargaBaru = {
  fasyankes_id: number;
  pasien_id: number;
  hubungan: string;
  nama: string;
  kontak?: string | null;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type JenisAkun = {
  id: number;
  fasyankes_id: number;
  nama: string;
  syarat_profesi: string | null;
  aktif: boolean;
  diubah_oleh: number | null;
  alasan_perubahan: string | null;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type JenisAkunBaru = {
  fasyankes_id: number;
  nama: string;
  syarat_profesi?: string | null;
  aktif?: boolean;
  diubah_oleh?: number | null;
  alasan_perubahan?: string | null;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type IzinJenisAkun = {
  id: number;
  fasyankes_id: number;
  jenis_akun_id: number;
  izin_id: number;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type IzinJenisAkunBaru = {
  fasyankes_id: number;
  jenis_akun_id: number;
  izin_id: number;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type RiwayatJenisAkun = {
  id: number;
  fasyankes_id: number;
  jenis_akun_id: number;
  ringkasan: string;
  alasan: string | null;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type RiwayatJenisAkunBaru = {
  fasyankes_id: number;
  jenis_akun_id: number;
  ringkasan: string;
  alasan?: string | null;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type Izin = {
  id: number;
  fasyankes_id: number | null;
  fitur: string;
  aksi: AksiIzin;
  cakupan: CakupanIzin;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type IzinBaru = {
  fasyankes_id?: number | null;
  fitur: string;
  aksi: AksiIzin;
  cakupan: CakupanIzin;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type PenugasanJenis = {
  id: number;
  fasyankes_id: number;
  pengguna_id: number;
  jenis_akun_id: number;
  mulai: Date;
  selesai: Date | null;
  ditetapkan_oleh: number | null;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type PenugasanJenisBaru = {
  fasyankes_id: number;
  pengguna_id: number;
  jenis_akun_id: number;
  mulai: Date;
  selesai?: Date | null;
  ditetapkan_oleh?: number | null;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type IzinPerAkun = {
  id: number;
  fasyankes_id: number;
  pengguna_id: number;
  izin_id: number;
  tipe: TipeIzinAkun;
  alasan: string;
  mulai: Date;
  selesai: Date | null;
  ditetapkan_oleh: number | null;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type IzinPerAkunBaru = {
  fasyankes_id: number;
  pengguna_id: number;
  izin_id: number;
  tipe: TipeIzinAkun;
  alasan: string;
  mulai: Date;
  selesai?: Date | null;
  ditetapkan_oleh?: number | null;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type PeringatanIzin = {
  id: number;
  fasyankes_id: number;
  pengguna_id: number;
  izin_id: number | null;
  penugasan_id: number | null;
  jenis_peringatan: string;
  alasan_pimpinan: string;
  sumber: string;
  diterima_untuk_akun: boolean;
  keterangan: string | null;
  ditetapkan_oleh: number | null;
  waktu: Date;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type PeringatanIzinBaru = {
  fasyankes_id: number;
  pengguna_id: number;
  izin_id?: number | null;
  penugasan_id?: number | null;
  jenis_peringatan: string;
  alasan_pimpinan: string;
  sumber?: string;
  diterima_untuk_akun?: boolean;
  keterangan?: string | null;
  ditetapkan_oleh?: number | null;
  waktu?: Date;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type Sesi = {
  id: number;
  fasyankes_id: number;
  pengguna_id: number;
  id_hash: string;
  alamat: string | null;
  dibuat_pada: Date;
  kedaluwarsa_pada: Date;
};
export type SesiBaru = {
  fasyankes_id: number;
  pengguna_id: number;
  id_hash: string;
  alamat?: string | null;
  dibuat_pada?: Date;
  kedaluwarsa_pada: Date;
};

export type LogAudit = {
  id: number;
  fasyankes_id: number | null;
  pengguna_id: number | null;
  aksi: string;
  entitas: string;
  entitas_id: number | null;
  keterangan: string | null;
  waktu: Date;
  alamat: string | null;
};
export type LogAuditBaru = {
  fasyankes_id?: number | null;
  pengguna_id?: number | null;
  aksi: string;
  entitas: string;
  entitas_id?: number | null;
  keterangan?: string | null;
  waktu?: Date;
  alamat?: string | null;
};

export type PengaturanKeamanan = {
  id: number;
  fasyankes_id: number;
  masa_sesi_jam: number;
  batas_percobaan_masuk: number;
  panjang_minimum_kata_sandi: number;
  diubah_oleh: number | null;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
  diubah_pada: Date;
};
export type PengaturanKeamananBaru = {
  fasyankes_id: number;
  masa_sesi_jam?: number;
  batas_percobaan_masuk?: number;
  panjang_minimum_kata_sandi?: number;
  diubah_oleh?: number | null;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
  diubah_pada?: Date;
};

export type RiwayatBackup = {
  id: number;
  fasyankes_id: number;
  waktu: Date;
  status: string;
  ukuran_byte: bigint | null;
  lokasi: string | null;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type RiwayatBackupBaru = {
  fasyankes_id: number;
  waktu?: Date;
  status: string;
  ukuran_byte?: bigint | null;
  lokasi?: string | null;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type JadwalPraktik = {
  id: number;
  fasyankes_id: number;
  pengguna_id: number;
  lokasi_id: number;
  hari: number;
  jam_mulai: string;
  jam_selesai: string;
  kuota: number;
  berlaku_dari: Date;
  berlaku_sampai: Date | null;
  aktif: boolean;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type JadwalPraktikBaru = {
  fasyankes_id: number;
  pengguna_id: number;
  lokasi_id: number;
  hari: number;
  jam_mulai: string;
  jam_selesai: string;
  kuota: number;
  berlaku_dari: Date;
  berlaku_sampai?: Date | null;
  aktif?: boolean;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type TarifLayanan = {
  id: number;
  fasyankes_id: number;
  kode: string;
  nama: string;
  jenis: JenisTarif;
  harga_umum: number | null;
  harga_jkn: number | null;
  kode_icd9cm: string | null;
  aktif: boolean;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type TarifLayananBaru = {
  fasyankes_id: number;
  kode: string;
  nama: string;
  jenis: JenisTarif;
  harga_umum?: number | null;
  harga_jkn?: number | null;
  kode_icd9cm?: string | null;
  aktif?: boolean;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type Wilayah = {
  id: number;
  kode: string;
  nama: string;
  tingkat: TingkatWilayah;
  induk_kode: string | null;
  contoh: boolean;
  dibuat_pada: Date;
};
export type WilayahBaru = {
  kode: string;
  nama: string;
  tingkat: TingkatWilayah;
  induk_kode?: string | null;
  contoh?: boolean;
  dibuat_pada?: Date;
};

export type RiwayatProfil = {
  id: number;
  fasyankes_id: number;
  jenis: string;
  pengguna_id: number | null;
  ringkasan: string;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type RiwayatProfilBaru = {
  fasyankes_id: number;
  jenis: string;
  pengguna_id?: number | null;
  ringkasan: string;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type UrutanNomorRm = {
  id: number;
  fasyankes_id: number;
  terakhir: number;
  dibuat_pada: Date;
};
export type UrutanNomorRmBaru = {
  fasyankes_id: number;
  terakhir?: number;
  dibuat_pada?: Date;
};

export type Kunjungan = {
  id: number;
  fasyankes_id: number;
  pasien_id: number;
  jenis: JenisKunjungan;
  status: StatusKunjungan;
  tahap_layanan: TahapLayanan;
  kunjungan_asal_id: number | null;
  lokasi_id: number | null;
  cara_pembayaran: CaraPembayaran;
  nomor_sep: string | null;
  spri: string | null;
  keluhan_singkat: string | null;
  service_type: string | null;
  encounter_id: string | null;
  mulai: Date;
  selesai: Date | null;
  waktu_tutup: Date | null;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
  diarsipkan_pada: Date | null;
  retensi_sampai: Date | null;
};
export type KunjunganBaru = {
  fasyankes_id: number;
  pasien_id: number;
  jenis: JenisKunjungan;
  status?: StatusKunjungan;
  tahap_layanan?: TahapLayanan;
  kunjungan_asal_id?: number | null;
  lokasi_id?: number | null;
  cara_pembayaran?: CaraPembayaran;
  nomor_sep?: string | null;
  spri?: string | null;
  keluhan_singkat?: string | null;
  service_type?: string | null;
  encounter_id?: string | null;
  mulai?: Date;
  selesai?: Date | null;
  waktu_tutup?: Date | null;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
  diarsipkan_pada?: Date | null;
  retensi_sampai?: Date | null;
};

export type PesertaKunjungan = {
  id: number;
  fasyankes_id: number;
  kunjungan_id: number;
  pengguna_id: number;
  tipe: TipePeserta;
  mulai: Date;
  selesai: Date | null;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type PesertaKunjunganBaru = {
  fasyankes_id: number;
  kunjungan_id: number;
  pengguna_id: number;
  tipe: TipePeserta;
  mulai?: Date;
  selesai?: Date | null;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type Antrean = {
  id: number;
  fasyankes_id: number;
  kunjungan_id: number;
  lokasi_id: number;
  tanggal: Date;
  nomor: number;
  status: StatusAntrean;
  waktu_daftar: Date;
  waktu_panggil: Date | null;
  waktu_mulai: Date | null;
  waktu_selesai: Date | null;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type AntreanBaru = {
  fasyankes_id: number;
  kunjungan_id: number;
  lokasi_id: number;
  tanggal: Date;
  nomor: number;
  status?: StatusAntrean;
  waktu_daftar?: Date;
  waktu_panggil?: Date | null;
  waktu_mulai?: Date | null;
  waktu_selesai?: Date | null;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type TeksPersetujuan = {
  id: number;
  fasyankes_id: number | null;
  jenis: JenisPersetujuan;
  versi: number;
  judul: string;
  tujuan: string;
  isi: string;
  aktif: boolean;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type TeksPersetujuanBaru = {
  fasyankes_id?: number | null;
  jenis: JenisPersetujuan;
  versi: number;
  judul: string;
  tujuan: string;
  isi: string;
  aktif?: boolean;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type Persetujuan = {
  id: number;
  fasyankes_id: number;
  pasien_id: number;
  jenis: JenisPersetujuan;
  teks_persetujuan_id: number | null;
  versi_teks: number;
  tujuan: string;
  penjelasan: string | null;
  bentuk: string;
  status: string;
  waktu: Date;
  penandatangan: string;
  wali_id: number | null;
  penandatangan_nama: string;
  saksi_pengguna_id: number | null;
  kunjungan_id: number | null;
  tindakan_kode: string | null;
  tindakan_nama: string | null;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type PersetujuanBaru = {
  fasyankes_id: number;
  pasien_id: number;
  jenis: JenisPersetujuan;
  teks_persetujuan_id?: number | null;
  versi_teks: number;
  tujuan: string;
  penjelasan?: string | null;
  bentuk: string;
  status?: string;
  waktu?: Date;
  penandatangan: string;
  wali_id?: number | null;
  penandatangan_nama: string;
  saksi_pengguna_id?: number | null;
  kunjungan_id?: number | null;
  tindakan_kode?: string | null;
  tindakan_nama?: string | null;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type Anamnesis = {
  id: number;
  fasyankes_id: number;
  kunjungan_id: number;
  versi: number;
  keluhan_utama: string;
  penyerta: string | null;
  riwayat_sekarang: string | null;
  riwayat_pribadi: string | null;
  riwayat_keluarga: string | null;
  kajian_sosial: string | null;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type AnamnesisBaru = {
  fasyankes_id: number;
  kunjungan_id: number;
  versi: number;
  keluhan_utama: string;
  penyerta?: string | null;
  riwayat_sekarang?: string | null;
  riwayat_pribadi?: string | null;
  riwayat_keluarga?: string | null;
  kajian_sosial?: string | null;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type Keperawatan = {
  id: number;
  fasyankes_id: number;
  kunjungan_id: number;
  versi: number;
  kajian_keperawatan: string | null;
  telah_diobati: string | null;
  alergi: string | null;
  obat_dikonsumsi: string | null;
  diagnosa_keperawatan: string | null;
  rencana_asuhan: string | null;
  nyeri_jenis: JenisNyeri;
  nyeri_skala: number | null;
  nyeri_lokasi: string | null;
  nyeri_durasi: string | null;
  nyeri_frekuensi: string | null;
  nyeri_hilang_bila: string | null;
  gizi_bb_turun: boolean;
  gizi_asupan_kurang: boolean;
  skrining_visual: SkriningVisual | null;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type KeperawatanBaru = {
  fasyankes_id: number;
  kunjungan_id: number;
  versi: number;
  kajian_keperawatan?: string | null;
  telah_diobati?: string | null;
  alergi?: string | null;
  obat_dikonsumsi?: string | null;
  diagnosa_keperawatan?: string | null;
  rencana_asuhan?: string | null;
  nyeri_jenis?: JenisNyeri;
  nyeri_skala?: number | null;
  nyeri_lokasi?: string | null;
  nyeri_durasi?: string | null;
  nyeri_frekuensi?: string | null;
  nyeri_hilang_bila?: string | null;
  gizi_bb_turun?: boolean;
  gizi_asupan_kurang?: boolean;
  skrining_visual?: SkriningVisual | null;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type Observasi = {
  id: number;
  fasyankes_id: number;
  kunjungan_id: number;
  kelompok: KelompokObservasi;
  versi: number;
  bidang: string;
  kode_loinc: string | null;
  nilai: string;
  satuan_ucum: string | null;
  waktu: Date;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type ObservasiBaru = {
  fasyankes_id: number;
  kunjungan_id: number;
  kelompok: KelompokObservasi;
  versi: number;
  bidang: string;
  kode_loinc?: string | null;
  nilai: string;
  satuan_ucum?: string | null;
  waktu?: Date;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type Diagnosis = {
  id: number;
  fasyankes_id: number;
  kunjungan_id: number;
  versi: number;
  kode_icd10: string;
  nama: string;
  kode_snomed: string | null;
  peran: PeranDiagnosis;
  urutan: number;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type DiagnosisBaru = {
  fasyankes_id: number;
  kunjungan_id: number;
  versi: number;
  kode_icd10: string;
  nama: string;
  kode_snomed?: string | null;
  peran: PeranDiagnosis;
  urutan: number;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type Tindakan = {
  id: number;
  fasyankes_id: number;
  kunjungan_id: number;
  versi: number;
  kode_icd9cm: string;
  nama: string;
  tarif_layanan_id: number | null;
  jumlah: number;
  performer_id: number | null;
  mulai: Date;
  selesai: Date | null;
  urutan: number;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type TindakanBaru = {
  fasyankes_id: number;
  kunjungan_id: number;
  versi: number;
  kode_icd9cm: string;
  nama: string;
  tarif_layanan_id?: number | null;
  jumlah?: number;
  performer_id?: number | null;
  mulai: Date;
  selesai?: Date | null;
  urutan: number;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type TindakLanjut = {
  id: number;
  fasyankes_id: number;
  kunjungan_id: number;
  versi: number;
  jenis: JenisTindakLanjut;
  tujuan: string | null;
  spri: string | null;
  catatan: string | null;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type TindakLanjutBaru = {
  fasyankes_id: number;
  kunjungan_id: number;
  versi: number;
  jenis: JenisTindakLanjut;
  tujuan?: string | null;
  spri?: string | null;
  catatan?: string | null;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type VersiCatatan = {
  id: number;
  fasyankes_id: number;
  entitas: string;
  entitas_id: number;
  versi: number;
  isi_lama: NilaiJson;
  alasan: string;
  disetujui_oleh: number | null;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type VersiCatatanBaru = {
  fasyankes_id: number;
  entitas: string;
  entitas_id: number;
  versi: number;
  isi_lama: NilaiJson;
  alasan: string;
  disetujui_oleh?: number | null;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type PengesahanCatatan = {
  id: number;
  fasyankes_id: number;
  entitas: string;
  entitas_id: number;
  versi: number;
  pengguna_id: number;
  jenis_akun_id: number | null;
  jenis_akun_nama: string | null;
  waktu: Date;
  hash: string;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type PengesahanCatatanBaru = {
  fasyankes_id: number;
  entitas: string;
  entitas_id: number;
  versi: number;
  pengguna_id: number;
  jenis_akun_id?: number | null;
  jenis_akun_nama?: string | null;
  waktu?: Date;
  hash: string;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type KodeTerminologi = {
  id: number;
  sistem: SistemTerminologi;
  kode: string;
  nama: string;
  aktif: boolean;
  contoh: boolean;
};
export type KodeTerminologiBaru = {
  sistem: SistemTerminologi;
  kode: string;
  nama: string;
  aktif?: boolean;
  contoh?: boolean;
};

export type FavoritDokter = {
  id: number;
  fasyankes_id: number;
  pengguna_id: number;
  jenis: JenisFavorit;
  kode: string;
  nama: string;
  urutan: number;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type FavoritDokterBaru = {
  fasyankes_id: number;
  pengguna_id: number;
  jenis: JenisFavorit;
  kode: string;
  nama: string;
  urutan?: number;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type TemplatCatatan = {
  id: number;
  fasyankes_id: number;
  pengguna_id: number;
  bagian: BagianTemplat;
  nama: string;
  isi: NilaiJson;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type TemplatCatatanBaru = {
  fasyankes_id: number;
  pengguna_id: number;
  bagian: BagianTemplat;
  nama: string;
  isi: NilaiJson;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type Draf = {
  id: number;
  fasyankes_id: number;
  pengguna_id: number;
  alur: string;
  kunjungan_id: number;
  pasien_id: number;
  langkah_terakhir: number;
  isi: NilaiJson;
  diperbarui_pada: Date;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type DrafBaru = {
  fasyankes_id: number;
  pengguna_id: number;
  alur: string;
  kunjungan_id: number;
  pasien_id: number;
  langkah_terakhir?: number;
  isi: NilaiJson;
  diperbarui_pada?: Date;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type KeluargaPasien = {
  id: number;
  fasyankes_id: number;
  pasien_id: number;
  anggota_pasien_id: number;
  hubungan: string;
  dibatasi: boolean;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type KeluargaPasienBaru = {
  fasyankes_id: number;
  pasien_id: number;
  anggota_pasien_id: number;
  hubungan: string;
  dibatasi?: boolean;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type MasterPemeriksaan = {
  id: number;
  fasyankes_id: number;
  kode: string;
  nama: string;
  jenis: string;
  kode_loinc: string | null;
  jenis_spesimen: string | null;
  satuan: string | null;
  rujukan_min: number | null;
  rujukan_maks: number | null;
  rujukan_teks: string | null;
  tarif_layanan_id: number | null;
  aktif: boolean;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
  diubah_pada: Date | null;
};
export type MasterPemeriksaanBaru = {
  fasyankes_id: number;
  kode: string;
  nama: string;
  jenis?: string;
  kode_loinc?: string | null;
  jenis_spesimen?: string | null;
  satuan?: string | null;
  rujukan_min?: number | null;
  rujukan_maks?: number | null;
  rujukan_teks?: string | null;
  tarif_layanan_id?: number | null;
  aktif?: boolean;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
  diubah_pada?: Date | null;
};

export type OrderPenunjang = {
  id: number;
  fasyankes_id: number;
  kunjungan_id: number;
  pasien_id: number;
  jenis: string;
  master_pemeriksaan_id: number | null;
  kode_loinc: string | null;
  nama: string;
  prioritas: string;
  catatan: string | null;
  status: StatusOrderPenunjang;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type OrderPenunjangBaru = {
  fasyankes_id: number;
  kunjungan_id: number;
  pasien_id: number;
  jenis?: string;
  master_pemeriksaan_id?: number | null;
  kode_loinc?: string | null;
  nama: string;
  prioritas?: string;
  catatan?: string | null;
  status?: StatusOrderPenunjang;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type Spesimen = {
  id: number;
  fasyankes_id: number;
  order_id: number;
  asal: string;
  waktu_ambil: Date;
  petugas_id: number;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type SpesimenBaru = {
  fasyankes_id: number;
  order_id: number;
  asal: string;
  waktu_ambil: Date;
  petugas_id: number;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type HasilPenunjang = {
  id: number;
  fasyankes_id: number;
  order_id: number;
  nilai: string;
  satuan: string | null;
  rujukan_teks: string | null;
  interpretasi: string;
  catatan: string | null;
  dientri_oleh: number;
  dientri_pada: Date;
  validator_id: number | null;
  divalidasi_pada: Date | null;
};
export type HasilPenunjangBaru = {
  fasyankes_id: number;
  order_id: number;
  nilai: string;
  satuan?: string | null;
  rujukan_teks?: string | null;
  interpretasi: string;
  catatan?: string | null;
  dientri_oleh: number;
  dientri_pada?: Date;
  validator_id?: number | null;
  divalidasi_pada?: Date | null;
};

export type Tagihan = {
  id: number;
  fasyankes_id: number;
  kunjungan_id: number;
  status_tagihan: StatusTagihan;
  status_pembayaran: StatusPembayaran;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
  alasan_tutup_belum_lunas: string | null;
};
export type TagihanBaru = {
  fasyankes_id: number;
  kunjungan_id: number;
  status_tagihan?: StatusTagihan;
  status_pembayaran?: StatusPembayaran;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
  alasan_tutup_belum_lunas?: string | null;
};

export type ItemTagihan = {
  id: number;
  fasyankes_id: number;
  tagihan_id: number;
  jenis: JenisTarif;
  tarif_layanan_id: number | null;
  kode: string;
  nama: string;
  jumlah: number;
  harga: number | null;
  order_penunjang_id: number | null;
  item_resep_id: number | null;
  manual: boolean;
  tindakan_sumber: boolean;
  harga_acuan: number | null;
  alasan_ubah_harga: string | null;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type ItemTagihanBaru = {
  fasyankes_id: number;
  tagihan_id: number;
  jenis: JenisTarif;
  tarif_layanan_id?: number | null;
  kode: string;
  nama: string;
  jumlah?: number;
  harga?: number | null;
  order_penunjang_id?: number | null;
  item_resep_id?: number | null;
  manual?: boolean;
  tindakan_sumber?: boolean;
  harga_acuan?: number | null;
  alasan_ubah_harga?: string | null;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type Addendum = {
  id: number;
  fasyankes_id: number;
  kunjungan_id: number;
  entitas: string;
  entitas_id: number;
  versi: number;
  isi: NilaiJson;
  alasan: string;
  waktu: Date;
  perlu_kirim_ulang: boolean;
  dikirim_pada: Date | null;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type AddendumBaru = {
  fasyankes_id: number;
  kunjungan_id: number;
  entitas: string;
  entitas_id: number;
  versi: number;
  isi: NilaiJson;
  alasan: string;
  waktu?: Date;
  perlu_kirim_ulang?: boolean;
  dikirim_pada?: Date | null;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type KfaLokal = {
  id: number;
  fasyankes_id: number;
  kode: string;
  nama: string;
  bentuk_sediaan: string | null;
  satuan: string | null;
  status: string;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
  diubah_pada: Date | null;
};
export type KfaLokalBaru = {
  fasyankes_id: number;
  kode: string;
  nama: string;
  bentuk_sediaan?: string | null;
  satuan?: string | null;
  status?: string;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
  diubah_pada?: Date | null;
};

export type MasterObat = {
  id: number;
  fasyankes_id: number;
  kfa_kode: string;
  kfa_nama: string;
  bentuk_sediaan: string | null;
  rute: string | null;
  nama_tampil: string;
  satuan: string;
  harga: number;
  aktif: boolean;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
  diubah_pada: Date | null;
};
export type MasterObatBaru = {
  fasyankes_id: number;
  kfa_kode: string;
  kfa_nama: string;
  bentuk_sediaan?: string | null;
  rute?: string | null;
  nama_tampil: string;
  satuan: string;
  harga: number;
  aktif?: boolean;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
  diubah_pada?: Date | null;
};

export type Resep = {
  id: number;
  fasyankes_id: number;
  kunjungan_id: number;
  dpjp_id: number;
  nomor_resep: string;
  teks: string;
  jenis_pembiayaan: CaraPembayaran;
  status: StatusResep;
  waktu_siap: Date | null;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type ResepBaru = {
  fasyankes_id: number;
  kunjungan_id: number;
  dpjp_id: number;
  nomor_resep: string;
  teks: string;
  jenis_pembiayaan?: CaraPembayaran;
  status?: StatusResep;
  waktu_siap?: Date | null;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type ItemResep = {
  id: number;
  fasyankes_id: number;
  resep_id: number;
  master_obat_id: number;
  aturan_pakai: string;
  bentuk: string | null;
  rute: string | null;
  jumlah: number;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type ItemResepBaru = {
  fasyankes_id: number;
  resep_id: number;
  master_obat_id: number;
  aturan_pakai: string;
  bentuk?: string | null;
  rute?: string | null;
  jumlah: number;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type TelaahResep = {
  id: number;
  fasyankes_id: number;
  resep_id: number;
  apoteker_id: number;
  administratif: boolean;
  farmasetik: boolean;
  klinis: boolean;
  catatan: string | null;
  waktu: Date;
};
export type TelaahResepBaru = {
  fasyankes_id: number;
  resep_id: number;
  apoteker_id: number;
  administratif: boolean;
  farmasetik: boolean;
  klinis: boolean;
  catatan?: string | null;
  waktu?: Date;
};

export type StokObat = {
  id: number;
  fasyankes_id: number;
  master_obat_id: number;
  batch: string;
  kedaluwarsa: Date;
  jumlah: number;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
  diubah_pada: Date | null;
};
export type StokObatBaru = {
  fasyankes_id: number;
  master_obat_id: number;
  batch: string;
  kedaluwarsa: Date;
  jumlah?: number;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
  diubah_pada?: Date | null;
};

export type MutasiStok = {
  id: number;
  fasyankes_id: number;
  stok_id: number;
  jenis: JenisMutasi;
  jumlah: number;
  alasan: string | null;
  pengguna_id: number;
  waktu: Date;
};
export type MutasiStokBaru = {
  fasyankes_id: number;
  stok_id: number;
  jenis: JenisMutasi;
  jumlah: number;
  alasan?: string | null;
  pengguna_id: number;
  waktu?: Date;
};

export type ShiftKasir = {
  id: number;
  fasyankes_id: number;
  kasir_id: number;
  buka: Date;
  tutup: Date | null;
  kas_awal: number;
  kas_akhir: number | null;
  selisih: number | null;
  alasan_selisih: string | null;
};
export type ShiftKasirBaru = {
  fasyankes_id: number;
  kasir_id: number;
  buka?: Date;
  tutup?: Date | null;
  kas_awal: number;
  kas_akhir?: number | null;
  selisih?: number | null;
  alasan_selisih?: string | null;
};

export type Pembayaran = {
  id: number;
  fasyankes_id: number;
  tagihan_id: number;
  shift_id: number;
  metode: MetodeBayar;
  jumlah: number;
  waktu: Date;
  kasir_id: number;
};
export type PembayaranBaru = {
  fasyankes_id: number;
  tagihan_id: number;
  shift_id: number;
  metode: MetodeBayar;
  jumlah: number;
  waktu?: Date;
  kasir_id: number;
};

export type PengeluaranObat = {
  id: number;
  fasyankes_id: number;
  resep_id: number;
  item_resep_id: number;
  master_obat_id: number;
  jumlah: number;
  harga: number;
  stok_kurang: boolean;
  alasan: string | null;
  petugas_id: number;
  waktu: Date;
};
export type PengeluaranObatBaru = {
  fasyankes_id: number;
  resep_id: number;
  item_resep_id: number;
  master_obat_id: number;
  jumlah: number;
  harga: number;
  stok_kurang?: boolean;
  alasan?: string | null;
  petugas_id: number;
  waktu?: Date;
};

export type PermintaanPerbaikan = {
  id: number;
  fasyankes_id: number;
  kunjungan_id: number;
  bagian: string;
  isi_baru: NilaiJson;
  alasan: string;
  pemohon_id: number;
  status: StatusPerbaikan;
  penyetuju_id: number | null;
  catatan_keputusan: string | null;
  waktu_keputusan: Date | null;
  dibuat_pada: Date;
};
export type PermintaanPerbaikanBaru = {
  fasyankes_id: number;
  kunjungan_id: number;
  bagian: string;
  isi_baru: NilaiJson;
  alasan: string;
  pemohon_id: number;
  status?: StatusPerbaikan;
  penyetuju_id?: number | null;
  catatan_keputusan?: string | null;
  waktu_keputusan?: Date | null;
  dibuat_pada?: Date;
};

export type ResumeMedis = {
  id: number;
  fasyankes_id: number;
  kunjungan_id: number;
  isi: NilaiJson;
  dibuat_oleh: number | null;
  diperbarui_pada: Date;
  dibuat_pada: Date;
};
export type ResumeMedisBaru = {
  fasyankes_id: number;
  kunjungan_id: number;
  isi: NilaiJson;
  dibuat_oleh?: number | null;
  diperbarui_pada?: Date;
  dibuat_pada?: Date;
};

export type Surat = {
  id: number;
  fasyankes_id: number;
  kunjungan_id: number;
  jenis: string;
  nomor_surat: string;
  tujuan: string | null;
  isi: string;
  dokter_id: number;
  dibuat_pada: Date;
};
export type SuratBaru = {
  fasyankes_id: number;
  kunjungan_id: number;
  jenis: string;
  nomor_surat: string;
  tujuan?: string | null;
  isi: string;
  dokter_id: number;
  dibuat_pada?: Date;
};

export type PembukaanRm = {
  id: number;
  fasyankes_id: number;
  pasien_id: number;
  pemohon_nama: string;
  pemohon_instansi: string | null;
  dasar: DasarPembukaan;
  alasan_hukum: string | null;
  dasar_rinci: string;
  cakupan: string;
  identitas_disamarkan: boolean;
  status: StatusPembukaan;
  penyetuju_id: number | null;
  catatan_keputusan: string | null;
  waktu_keputusan: Date | null;
  diminta_oleh: number;
  dibuat_pada: Date;
};
export type PembukaanRmBaru = {
  fasyankes_id: number;
  pasien_id: number;
  pemohon_nama: string;
  pemohon_instansi?: string | null;
  dasar: DasarPembukaan;
  alasan_hukum?: string | null;
  dasar_rinci: string;
  cakupan: string;
  identitas_disamarkan?: boolean;
  status?: StatusPembukaan;
  penyetuju_id?: number | null;
  catatan_keputusan?: string | null;
  waktu_keputusan?: Date | null;
  diminta_oleh: number;
  dibuat_pada?: Date;
};

export type PenyampaianRm = {
  id: number;
  fasyankes_id: number;
  pasien_id: number;
  kunjungan_id: number | null;
  penerima_nama: string;
  hubungan: string;
  bentuk: BentukPenyampaian;
  bukti_persetujuan: string | null;
  catatan: string | null;
  petugas_id: number;
  waktu: Date;
};
export type PenyampaianRmBaru = {
  fasyankes_id: number;
  pasien_id: number;
  kunjungan_id?: number | null;
  penerima_nama: string;
  hubungan: string;
  bentuk: BentukPenyampaian;
  bukti_persetujuan?: string | null;
  catatan?: string | null;
  petugas_id: number;
  waktu?: Date;
};

export type Penempatan = {
  id: number;
  fasyankes_id: number;
  kunjungan_id: number;
  lokasi_id: number;
  kelas: KelasRawat;
  indikator: IndikatorKelas;
  tarif_id: number | null;
  mulai: Date;
  selesai: Date | null;
  dibuat_oleh: number | null;
};
export type PenempatanBaru = {
  fasyankes_id: number;
  kunjungan_id: number;
  lokasi_id: number;
  kelas: KelasRawat;
  indikator?: IndikatorKelas;
  tarif_id?: number | null;
  mulai?: Date;
  selesai?: Date | null;
  dibuat_oleh?: number | null;
};

export type CatatanHarian = {
  id: number;
  fasyankes_id: number;
  kunjungan_id: number;
  subjektif: string;
  objektif: string;
  asesmen: string;
  rencana: string;
  instruksi: string | null;
  tanda_vital: NilaiJson | null;
  dibuat_oleh: number;
  dibuat_pada: Date;
};
export type CatatanHarianBaru = {
  fasyankes_id: number;
  kunjungan_id: number;
  subjektif: string;
  objektif: string;
  asesmen: string;
  rencana: string;
  instruksi?: string | null;
  tanda_vital?: NilaiJson | null;
  dibuat_oleh: number;
  dibuat_pada?: Date;
};

export type Pemulangan = {
  id: number;
  fasyankes_id: number;
  kunjungan_id: number;
  disposisi: DisposisiPulang;
  kondisi_pulang: string;
  diagnosis_akhir: string;
  ringkasan: string;
  tindak_lanjut: string | null;
  waktu: Date;
  dibuat_oleh: number;
};
export type PemulanganBaru = {
  fasyankes_id: number;
  kunjungan_id: number;
  disposisi: DisposisiPulang;
  kondisi_pulang: string;
  diagnosis_akhir: string;
  ringkasan: string;
  tindak_lanjut?: string | null;
  waktu?: Date;
  dibuat_oleh: number;
};

export type Klaim = {
  id: number;
  fasyankes_id: number;
  kunjungan_id: number;
  nomor_sep: string | null;
  status: StatusKlaim;
  tanggal_selesai: Date;
  batas_pengajuan: Date;
  diagnosis: NilaiJson;
  tindakan: NilaiJson;
  berkas: NilaiJson;
  catatan: string | null;
  diajukan_pada: Date | null;
  dikembalikan_pada: Date | null;
  berita_acara: string | null;
  batas_ajukan_ulang: Date | null;
  alasan: string | null;
  jumlah_dibayar: number | null;
  dibayar_pada: Date | null;
  dibuat_oleh: number;
  dibuat_pada: Date;
  diperbarui_pada: Date;
};
export type KlaimBaru = {
  fasyankes_id: number;
  kunjungan_id: number;
  nomor_sep?: string | null;
  status: StatusKlaim;
  tanggal_selesai: Date;
  batas_pengajuan: Date;
  diagnosis: NilaiJson;
  tindakan: NilaiJson;
  berkas: NilaiJson;
  catatan?: string | null;
  diajukan_pada?: Date | null;
  dikembalikan_pada?: Date | null;
  berita_acara?: string | null;
  batas_ajukan_ulang?: Date | null;
  alasan?: string | null;
  jumlah_dibayar?: number | null;
  dibayar_pada?: Date | null;
  dibuat_oleh: number;
  dibuat_pada?: Date;
  diperbarui_pada?: Date;
};

export type RiwayatKlaim = {
  id: number;
  fasyankes_id: number;
  klaim_id: number;
  dari: StatusKlaim | null;
  ke: StatusKlaim;
  alasan: string | null;
  oleh: number;
  waktu: Date;
};
export type RiwayatKlaimBaru = {
  fasyankes_id: number;
  klaim_id: number;
  dari?: StatusKlaim | null;
  ke: StatusKlaim;
  alasan?: string | null;
  oleh: number;
  waktu?: Date;
};

export type PermintaanHak = {
  id: number;
  fasyankes_id: number;
  pasien_id: number;
  jenis: JenisHak;
  saluran: SaluranHak;
  pemohon_nama: string;
  pemohon_hubungan: string;
  verifikasi: string;
  rincian: string | null;
  diterima_pada: Date;
  batas_waktu: Date;
  status: StatusHak;
  keputusan_oleh: number | null;
  waktu_keputusan: Date | null;
  alasan_keputusan: string | null;
  pelaksanaan: string | null;
  pelaksana_id: number | null;
  waktu_pelaksanaan: Date | null;
  notifikasi_pada: Date | null;
  notifikasi_oleh: number | null;
  catatan_notifikasi: string | null;
  dibuat_oleh: number;
  dibuat_pada: Date;
};
export type PermintaanHakBaru = {
  fasyankes_id: number;
  pasien_id: number;
  jenis: JenisHak;
  saluran: SaluranHak;
  pemohon_nama: string;
  pemohon_hubungan: string;
  verifikasi: string;
  rincian?: string | null;
  diterima_pada: Date;
  batas_waktu: Date;
  status?: StatusHak;
  keputusan_oleh?: number | null;
  waktu_keputusan?: Date | null;
  alasan_keputusan?: string | null;
  pelaksanaan?: string | null;
  pelaksana_id?: number | null;
  waktu_pelaksanaan?: Date | null;
  notifikasi_pada?: Date | null;
  notifikasi_oleh?: number | null;
  catatan_notifikasi?: string | null;
  dibuat_oleh: number;
  dibuat_pada?: Date;
};

export type PenarikanPersetujuan = {
  id: number;
  fasyankes_id: number;
  persetujuan_id: number;
  alasan: string;
  waktu: Date;
  batas_henti: Date;
  dicatat_oleh: number;
};
export type PenarikanPersetujuanBaru = {
  fasyankes_id: number;
  persetujuan_id: number;
  alasan: string;
  waktu?: Date;
  batas_henti: Date;
  dicatat_oleh: number;
};

export type Ropa = {
  id: number;
  fasyankes_id: number;
  nama_kegiatan: string;
  ppdp_nama: string | null;
  sumber_tujuan: string;
  dasar: string;
  tujuan: string;
  jenis_data: string;
  kategori_subjek: string;
  pihak_akses: string;
  pemenuhan_hak: string;
  aliran: string;
  masa_retensi: string;
  pengamanan: string;
  transfer: string;
  dibuat_oleh: number;
  dibuat_pada: Date;
  diperbarui_pada: Date;
};
export type RopaBaru = {
  fasyankes_id: number;
  nama_kegiatan: string;
  ppdp_nama?: string | null;
  sumber_tujuan: string;
  dasar: string;
  tujuan: string;
  jenis_data: string;
  kategori_subjek: string;
  pihak_akses: string;
  pemenuhan_hak: string;
  aliran: string;
  masa_retensi: string;
  pengamanan: string;
  transfer: string;
  dibuat_oleh: number;
  dibuat_pada?: Date;
  diperbarui_pada?: Date;
};

export type Dpia = {
  id: number;
  fasyankes_id: number;
  pemrosesan: string;
  ropa_id: number | null;
  risiko: string;
  mitigasi: string;
  saran_ppdp: string | null;
  tinjau_ulang_pada: Date;
  ditinjau_pada: Date | null;
  dibuat_oleh: number;
  dibuat_pada: Date;
  diperbarui_pada: Date;
};
export type DpiaBaru = {
  fasyankes_id: number;
  pemrosesan: string;
  ropa_id?: number | null;
  risiko: string;
  mitigasi: string;
  saran_ppdp?: string | null;
  tinjau_ulang_pada: Date;
  ditinjau_pada?: Date | null;
  dibuat_oleh: number;
  dibuat_pada?: Date;
  diperbarui_pada?: Date;
};

export type InsidenData = {
  id: number;
  fasyankes_id: number;
  waktu_kejadian: Date | null;
  waktu_diketahui: Date;
  siber: boolean;
  uraian: string;
  data_terungkap: string;
  penanganan: string | null;
  pemulihan: string | null;
  kontak_ppdp: string | null;
  batas_notifikasi: Date;
  notifikasi_pasien_pada: Date | null;
  notifikasi_lembaga_pada: Date | null;
  dibuat_oleh: number;
  dibuat_pada: Date;
  diperbarui_pada: Date;
};
export type InsidenDataBaru = {
  fasyankes_id: number;
  waktu_kejadian?: Date | null;
  waktu_diketahui: Date;
  siber?: boolean;
  uraian: string;
  data_terungkap: string;
  penanganan?: string | null;
  pemulihan?: string | null;
  kontak_ppdp?: string | null;
  batas_notifikasi: Date;
  notifikasi_pasien_pada?: Date | null;
  notifikasi_lembaga_pada?: Date | null;
  dibuat_oleh: number;
  dibuat_pada?: Date;
  diperbarui_pada?: Date;
};

export type InsidenPasien = {
  id: number;
  fasyankes_id: number;
  insiden_id: number;
  pasien_id: number;
};
export type InsidenPasienBaru = {
  fasyankes_id: number;
  insiden_id: number;
  pasien_id: number;
};

export type KebijakanRetensi = {
  id: number;
  fasyankes_id: number;
  jenis_data: string;
  periode_tahun: number;
  dasar_hukum: string;
  metode_musnah: string;
  penanggung_jawab: string | null;
  dibuat_pada: Date;
};
export type KebijakanRetensiBaru = {
  fasyankes_id: number;
  jenis_data: string;
  periode_tahun: number;
  dasar_hukum: string;
  metode_musnah: string;
  penanggung_jawab?: string | null;
  dibuat_pada?: Date;
};

export type Pemusnahan = {
  id: number;
  fasyankes_id: number;
  cakupan: string;
  dasar: string;
  permintaan_hak_id: number | null;
  pasien_id: number | null;
  jadwal: Date;
  status: StatusMusnah;
  prosesor_id: number | null;
  nomor_perintah: string | null;
  perintah_pada: Date | null;
  pelaksana: string | null;
  metode: string | null;
  mencakup_cadangan: boolean;
  pelaksanaan_pada: Date | null;
  berita_acara: string | null;
  berita_acara_pada: Date | null;
  dibuat_oleh: number;
  dibuat_pada: Date;
};
export type PemusnahanBaru = {
  fasyankes_id: number;
  cakupan: string;
  dasar: string;
  permintaan_hak_id?: number | null;
  pasien_id?: number | null;
  jadwal: Date;
  status?: StatusMusnah;
  prosesor_id?: number | null;
  nomor_perintah?: string | null;
  perintah_pada?: Date | null;
  pelaksana?: string | null;
  metode?: string | null;
  mencakup_cadangan?: boolean;
  pelaksanaan_pada?: Date | null;
  berita_acara?: string | null;
  berita_acara_pada?: Date | null;
  dibuat_oleh: number;
  dibuat_pada?: Date;
};

export type ProsesorData = {
  id: number;
  fasyankes_id: number;
  nama: string;
  layanan: string;
  lokasi_data: string;
  nomor_perjanjian: string | null;
  butir_perjanjian: NilaiJson;
  sub_prosesor: NilaiJson;
  sla_lapor_jam: number | null;
  aktif: boolean;
  dibuat_oleh: number;
  dibuat_pada: Date;
  diperbarui_pada: Date;
};
export type ProsesorDataBaru = {
  fasyankes_id: number;
  nama: string;
  layanan: string;
  lokasi_data: string;
  nomor_perjanjian?: string | null;
  butir_perjanjian: NilaiJson;
  sub_prosesor: NilaiJson;
  sla_lapor_jam?: number | null;
  aktif?: boolean;
  dibuat_oleh: number;
  dibuat_pada?: Date;
  diperbarui_pada?: Date;
};

export type WaKoneksi = {
  id: number;
  fasyankes_id: number;
  aktif: boolean;
  generasi: number;
  status: string;
  nomor: string | null;
  qr: string | null;
  detak: Date | null;
  pemilik_engine: string | null;
  sewa_sampai: Date | null;
};
export type WaKoneksiBaru = {
  id?: number;
  fasyankes_id: number;
  aktif?: boolean;
  generasi?: number;
  status?: string;
  nomor?: string | null;
  qr?: string | null;
  detak?: Date | null;
  pemilik_engine?: string | null;
  sewa_sampai?: Date | null;
};

export type WaAuth = {
  id: string;
  isi: string;
};
export type WaAuthBaru = {
  id: string;
  isi: string;
};

export type WaPercakapan = {
  id: number;
  fasyankes_id: number;
  jid: string;
  nama: string;
  foto_profil: string | null;
  foto_periksa_setelah: Date | null;
  pasien_id: number | null;
  status: string;
  penanggung_jawab: number | null;
  diperbarui_pada: Date;
};
export type WaPercakapanBaru = {
  fasyankes_id: number;
  jid: string;
  nama: string;
  foto_profil?: string | null;
  foto_periksa_setelah?: Date | null;
  pasien_id?: number | null;
  status?: string;
  penanggung_jawab?: number | null;
  diperbarui_pada?: Date;
};

export type WaPesan = {
  id: number;
  percakapan_id: number;
  wa_id: string | null;
  arah: string;
  isi: string;
  jenis: string;
  media_id: string | null;
  status: string;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type WaPesanBaru = {
  percakapan_id: number;
  wa_id?: string | null;
  arah: string;
  isi: string;
  jenis?: string;
  media_id?: string | null;
  status: string;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type WaBaca = {
  percakapan_id: number;
  pengguna_id: number;
  pesan_id: number;
};
export type WaBacaBaru = {
  percakapan_id: number;
  pengguna_id: number;
  pesan_id?: number;
};

export type WaMedia = {
  id: string;
  fasyankes_id: number;
  isi: string;
  mime: string;
  nama: string;
};
export type WaMediaBaru = {
  id: string;
  fasyankes_id: number;
  isi: string;
  mime: string;
  nama: string;
};

export type RiwayatTahapLayanan = {
  id: number;
  fasyankes_id: number;
  kunjungan_id: number;
  tahap: TahapLayanan;
  masuk: Date;
  keluar: Date | null;
};
export type RiwayatTahapLayananBaru = {
  fasyankes_id: number;
  kunjungan_id: number;
  tahap: TahapLayanan;
  masuk: Date;
  keluar?: Date | null;
};

export type IgKoneksi = {
  id: number;
  fasyankes_id: number;
  aktif: boolean;
  status: string;
  akun_id: string;
  username: string;
  api_key: string | null;
  webhook_secret: string | null;
  webhook_id: string | null;
  penyedia: string;
  oauth_user_id: string | null;
  access_token: string | null;
  token_berakhir: Date | null;
  token_diperbarui: Date | null;
  generasi: number;
  webhook_aktif: boolean;
};
export type IgKoneksiBaru = {
  id?: number;
  fasyankes_id: number;
  aktif?: boolean;
  status?: string;
  akun_id: string;
  username: string;
  api_key?: string | null;
  webhook_secret?: string | null;
  webhook_id?: string | null;
  penyedia?: string;
  oauth_user_id?: string | null;
  access_token?: string | null;
  token_berakhir?: Date | null;
  token_diperbarui?: Date | null;
  generasi?: number;
  webhook_aktif?: boolean;
};

export type IgPercakapan = {
  id: number;
  fasyankes_id: number;
  jid: string;
  nama: string;
  foto_profil: string | null;
  profil_diperbarui_pada: Date | null;
  pasien_id: number | null;
  status: string;
  penanggung_jawab: number | null;
  diperbarui_pada: Date;
};
export type IgPercakapanBaru = {
  fasyankes_id: number;
  jid: string;
  nama: string;
  foto_profil?: string | null;
  profil_diperbarui_pada?: Date | null;
  pasien_id?: number | null;
  status?: string;
  penanggung_jawab?: number | null;
  diperbarui_pada?: Date;
};

export type IgPesan = {
  id: number;
  percakapan_id: number;
  ig_id: string | null;
  arah: string;
  isi: string;
  jenis: string;
  media_id: string | null;
  status: string;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type IgPesanBaru = {
  percakapan_id: number;
  ig_id?: string | null;
  arah: string;
  isi: string;
  jenis?: string;
  media_id?: string | null;
  status: string;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};

export type IgBaca = {
  percakapan_id: number;
  pengguna_id: number;
  pesan_id: number;
};
export type IgBacaBaru = {
  percakapan_id: number;
  pengguna_id: number;
  pesan_id?: number;
};

export type IgMedia = {
  id: string;
  fasyankes_id: number;
  isi: string;
  mime: string;
  nama: string;
};
export type IgMediaBaru = {
  id: string;
  fasyankes_id: number;
  isi: string;
  mime: string;
  nama: string;
};

export type IgEvent = {
  id: string;
};
export type IgEventBaru = {
  id: string;
};

export type IgOauthState = {
  hash: string;
  pengguna_id: number;
  fasyankes_id: number;
  sesi_hash: string;
  generasi: number;
  berakhir: Date;
};
export type IgOauthStateBaru = {
  hash: string;
  pengguna_id: number;
  fasyankes_id: number;
  sesi_hash: string;
  generasi: number;
  berakhir: Date;
};

export type IgMediaPublik = {
  token_hash: string;
  media_id: string;
  generasi: number;
  berakhir: Date;
};
export type IgMediaPublikBaru = {
  token_hash: string;
  media_id: string;
  generasi: number;
  berakhir: Date;
};

export type IgPenghapusan = {
  kode: string;
  dibuat_pada: Date;
};
export type IgPenghapusanBaru = {
  kode: string;
  dibuat_pada?: Date;
};

export type EventPanggilan = {
  id: number;
  fasyankes_id: number;
  poli_id: number;
  poli_nama: string;
  kode: string;
  tanggal: Date;
  waktu_panggil: Date;
};
export type EventPanggilanBaru = {
  fasyankes_id: number;
  poli_id: number;
  poli_nama: string;
  kode: string;
  tanggal: Date;
  waktu_panggil: Date;
};

export type WebsiteKlinik = {
  id: number;
  fasyankes_id: number;
  aktif: boolean;
  slug: string;
  domain: string | null;
  judul: string;
  ringkasan: string;
  tentang: string;
  alamat: string;
  whatsapp: string;
  telepon: string;
  email: string;
  jam_operasional: string;
  warna_utama: string;
  logo_url: string;
  hero_url: string;
  tampilkan_jadwal: boolean;
  tampilkan_nama_praktisi: boolean;
  diubah_pada: Date;
};
export type WebsiteKlinikBaru = {
  fasyankes_id: number;
  aktif?: boolean;
  slug: string;
  domain?: string | null;
  judul: string;
  ringkasan: string;
  tentang: string;
  alamat: string;
  whatsapp: string;
  telepon: string;
  email: string;
  jam_operasional: string;
  warna_utama: string;
  logo_url: string;
  hero_url: string;
  tampilkan_jadwal?: boolean;
  tampilkan_nama_praktisi?: boolean;
};

export type NarasiKlinis = {
  id: number;
  fasyankes_id: number;
  kunjungan_id: number;
  bagian: BagianNarasi;
  isi: string | null;
  versi: number;
  dibuat_oleh: number | null;
  dibuat_pada: Date;
};
export type NarasiKlinisBaru = {
  fasyankes_id: number;
  kunjungan_id: number;
  bagian: BagianNarasi;
  isi?: string | null;
  versi: number;
  dibuat_oleh?: number | null;
  dibuat_pada?: Date;
};
