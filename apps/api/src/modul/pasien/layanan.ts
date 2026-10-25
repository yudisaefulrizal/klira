import { REGISTRASI, statusIdentitasDari } from '@klira/shared';
import type {
  CekDuplikatMasukan, DaftarPasienDto, FilterPasien, KandidatDuplikatDto, PasienBaruDto, PasienDetailDto, PenggunaSaya, RegistrasiPasienMasukan, TeksPersetujuanDto,
} from '@klira/shared';
import type { PenampungAudit } from '../../middleware/audit';
import { gagal } from '../hasil';
import type { Hasil } from '../hasil';
import { NikKembarError } from './repositori';
import type { DataRegistrasi, RepositoriPasien } from './repositori';

export type DependensiPasien = { repo: RepositoriPasien; audit: PenampungAudit };
type Pelaku = Pick<PenggunaSaya, 'id' | 'fasyankes_id'>;

const kosongJadiNull = (v: string | null | undefined): string | null => (v == null || v.trim() === '' ? null : v.trim());

/** Masukan registrasi tervalidasi menjadi data simpan: string kosong menjadi null, identitas khusus dikosongkan sesuai jalur. */
export function normalkanRegistrasi(m: RegistrasiPasienMasukan, teks: TeksPersetujuanDto): DataRegistrasi {
  const wali = m.wali.map((w) => ({ hubungan: w.hubungan.trim(), nama: w.nama.trim(), kontak: kosongJadiNull(w.kontak) }));
  const jalur = m.jalur_identitas;
  const penandatanganWali = m.persetujuan.penandatangan === 'wali' ? wali[m.persetujuan.wali_ke ?? -1] : undefined;
  return {
    jalur_identitas: jalur,
    status_identitas: statusIdentitasDari(jalur),
    nik: jalur === 'tanpa_identitas' ? null : kosongJadiNull(m.nik),
    nama: m.nama.trim(),
    ibu_kandung: kosongJadiNull(m.ibu_kandung),
    tempat_lahir: kosongJadiNull(m.tempat_lahir),
    tanggal_lahir: m.tanggal_lahir,
    jenis_kelamin: m.jenis_kelamin,
    agama: kosongJadiNull(m.agama),
    suku: kosongJadiNull(m.suku),
    bahasa: kosongJadiNull(m.bahasa),
    pekerjaan: kosongJadiNull(m.pekerjaan),
    pendidikan: kosongJadiNull(m.pendidikan),
    status_kawin: kosongJadiNull(m.status_kawin),
    alamat: kosongJadiNull(m.alamat),
    kode_wilayah: kosongJadiNull(m.kode_wilayah),
    nomor_paspor: jalur === 'paspor' ? kosongJadiNull(m.nomor_paspor) : null,
    nomor_kitas: jalur === 'kitas' ? kosongJadiNull(m.nomor_kitas) : null,
    jkn_nomor_kartu: kosongJadiNull(m.jkn_nomor_kartu),
    jkn_kelas_hak: kosongJadiNull(m.jkn_kelas_hak),
    jkn_fktp_terdaftar: kosongJadiNull(m.jkn_fktp_terdaftar),
    tidak_cakap: m.tidak_cakap,
    wali,
    persetujuan: {
      teks,
      bentuk: m.persetujuan.bentuk,
      penandatangan: m.persetujuan.penandatangan,
      wali_ke: penandatanganWali ? m.persetujuan.wali_ke ?? null : null,
      penandatangan_nama: penandatanganWali ? penandatanganWali.nama : m.nama.trim(),
    },
  };
}

export function buatLayananPasien({ repo, audit }: DependensiPasien) {
  return {
    /** Daftar minimal (tanpa NIK atau isi rekam medis); tidak dicatat per baris, pembukaan isi dicatat di `detail`. */
    async cari(p: Pelaku, f: FilterPasien): Promise<DaftarPasienDto> {
      return repo.cari(p.fasyankes_id, { cari: f.cari || undefined, tahap: f.tahap, lewati: (f.halaman - 1) * f.ukuran, ambil: f.ukuran });
    },

    /** Isi data pasien: pembukaan dicatat `lihat` sebelum data dilepas (gagal catat berarti tidak dilepas). */
    async detail(p: Pelaku, id: number, alamat?: string): Promise<Hasil<PasienDetailDto>> {
      const d = await repo.detail(p.fasyankes_id, id);
      if (!d) return gagal('tidak_ditemukan', REGISTRASI.galat.pasienTidakAda);
      await audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'lihat', entitas: 'pasien', entitas_id: id, keterangan: 'Membuka data pasien', alamat });
      return { ok: true, data: d };
    },

    async cekDuplikat(p: Pelaku, k: CekDuplikatMasukan, alamat?: string): Promise<KandidatDuplikatDto[]> {
      const bisaCari = !!k.nik || (!!k.nama && !!k.tanggal_lahir && !!k.ibu_kandung);
      const hasil = bisaCari ? await repo.duplikat(p.fasyankes_id, k) : [];
      await audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'lihat', entitas: 'pasien', keterangan: 'Cek duplikat pasien', alamat });
      return hasil;
    },

    async teksGeneral(p: Pelaku): Promise<TeksPersetujuanDto | null> {
      return repo.teksAktif(p.fasyankes_id, 'general');
    },

    /** Registrasi satu transaksi: pasien, wali, dan general consent; nomor RM berurutan per fasyankes. */
    async daftarkan(p: Pelaku, m: RegistrasiPasienMasukan, alamat?: string): Promise<Hasil<PasienBaruDto>> {
      const teks = await repo.teksUntukPakai(p.fasyankes_id, m.persetujuan.teks_persetujuan_id, 'general');
      if (!teks) return gagal('tidak_valid', REGISTRASI.galat.teksTidakSah, 'persetujuan.teks_persetujuan_id');
      const data = normalkanRegistrasi(m, teks);

      const kembar = data.nik || data.ibu_kandung ? await repo.duplikat(p.fasyankes_id, { nik: data.nik, nama: data.nama, tanggal_lahir: data.tanggal_lahir, ibu_kandung: data.ibu_kandung ?? undefined }) : [];
      if (kembar.some((k) => k.alasan === 'nik')) return gagal('konflik', REGISTRASI.galat.nikKembar, 'nik');
      if (kembar.length && !m.konfirmasi_duplikat) return gagal('konflik', REGISTRASI.galat.dataGanda, 'konfirmasi_duplikat');

      let simpan;
      try {
        simpan = await repo.daftarkan(p.fasyankes_id, p.id, data);
      } catch (e) {
        if (e instanceof NikKembarError) return gagal('konflik', REGISTRASI.galat.nikKembar, 'nik');
        throw e;
      }
      const dasar = { fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'input' as const, alamat };
      await audit.catat({ ...dasar, entitas: 'pasien', entitas_id: simpan.id, keterangan: `Registrasi pasien baru (${data.status_identitas})` });
      await audit.catat({ ...dasar, entitas: 'persetujuan', entitas_id: simpan.persetujuan_id, keterangan: `General consent versi ${teks.versi} diberikan` });
      return { ok: true, data: { id: simpan.id, nomor_rm: simpan.nomor_rm, nama: simpan.nama, status_identitas: simpan.status_identitas } };
    },
  };
}

export type LayananPasien = ReturnType<typeof buatLayananPasien>;
