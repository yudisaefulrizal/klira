import { kabarkanLayarPanggilan } from '../layar-panggilan/kanal';
import { REGISTRASI, bolehAksiAntrean, bolehPindahTahap, tanggalWib, TRANSISI_ANTREAN } from '@klira/shared';
import type {
  AksiAntrean, AntreanDto, FilterAntrean, KunjunganDto, KunjunganMasukan, OpsiKunjunganDto, PenggunaSaya, TahapLayanan,
} from '@klira/shared';
import type { PenampungAudit } from '../../middleware/audit';
import { gagal } from '../hasil';
import type { Hasil } from '../hasil';
import { KunjunganBerjalanError } from './repositori';
import type { RepositoriKunjungan } from './repositori';

export type DependensiKunjungan = { repo: RepositoriKunjungan; audit: PenampungAudit; sekarang?: () => Date };
type Pelaku = Pick<PenggunaSaya, 'id' | 'fasyankes_id'>;

const kosongJadiNull = (v: string | null | undefined): string | null => (v == null || v.trim() === '' ? null : v.trim());

export function buatLayananKunjungan({ repo, audit, sekarang = () => new Date() }: DependensiKunjungan) {
  return {
    opsi(p: Pelaku): Promise<OpsiKunjunganDto> {
      return repo.opsi(p.fasyankes_id);
    },

    /** Pendaftaran kunjungan rawat jalan atau langsung rawat inap; antrean otomatis untuk rawat jalan. */
    async daftarkan(p: Pelaku, m: KunjunganMasukan, alamat?: string): Promise<Hasil<KunjunganDto>> {
      if (!(await repo.pasienAda(p.fasyankes_id, m.pasien_id))) return gagal('tidak_ditemukan', REGISTRASI.galat.pasienTidakAda);
      if (m.lokasi_id && m.jenis === 'AMB' && !(await repo.poliOperasional(p.fasyankes_id, m.lokasi_id))) return gagal('tidak_valid', REGISTRASI.galat.poliTidakSah, 'lokasi_id');
      if (m.dpjp_id && !(await repo.dpjpSah(p.fasyankes_id, m.dpjp_id))) return gagal('tidak_valid', REGISTRASI.galat.dpjpTidakSah, 'dpjp_id');
      if (await repo.kunjunganBerjalan(p.fasyankes_id, m.pasien_id)) return gagal('konflik', REGISTRASI.galat.kunjunganBerjalan);
      let k;
      try {
        k = await repo.daftarkan(
          p.fasyankes_id, p.id,
          { ...m, nomor_sep: kosongJadiNull(m.nomor_sep), keluhan_singkat: kosongJadiNull(m.keluhan_singkat) },
          sekarang(),
        );
      } catch (e) {
        if (e instanceof KunjunganBerjalanError) return gagal('konflik', REGISTRASI.galat.kunjunganBerjalan);
        throw e;
      }
      kabarkanLayarPanggilan(p.fasyankes_id);
      await audit.catat({
        fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'input', entitas: 'kunjungan', entitas_id: k.id,
        keterangan: `Pendaftaran kunjungan ${m.jenis}${k.antrean ? ` antrean ${k.antrean.kode}` : ''}`, alamat,
      });
      return { ok: true, data: k };
    },

    /** Maju satu tahap layanan (skrining, pemeriksaan, resep, kasir); penutupan kunjungan punya peristiwanya sendiri. */
    async ubahTahap(p: Pelaku, id: number, ke: TahapLayanan, alamat?: string): Promise<Hasil<KunjunganDto>> {
      const dari = await repo.tahapSekarang(p.fasyankes_id, id);
      if (!dari) return gagal('tidak_ditemukan', REGISTRASI.galat.kunjunganTidakAda);
      if (!bolehPindahTahap(dari, ke)) return gagal('konflik', REGISTRASI.galat.tahapTidakSah, 'tahap');
      const k = await repo.ubahTahap(p.fasyankes_id, id, dari, ke);
      if (!k) return gagal('konflik', REGISTRASI.galat.tahapTidakSah, 'tahap');
      await audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'perbaikan', entitas: 'kunjungan', entitas_id: id, keterangan: `Tahap layanan ${dari} menjadi ${ke}`, alamat });
      return { ok: true, data: k };
    },

    /** Panggil, mulai, selesai, atau batalkan antrean sesuai perpindahan status yang sah. */
    async aksiAntrean(p: Pelaku, id: number, aksi: AksiAntrean, alamat?: string): Promise<Hasil<AntreanDto>> {
      const status = await repo.statusAntrean(p.fasyankes_id, id);
      if (!status) return gagal('tidak_ditemukan', REGISTRASI.galat.antreanTidakAda);
      if (!bolehAksiAntrean(status, aksi)) return gagal('konflik', REGISTRASI.galat.antreanTidakSah);
      const t = TRANSISI_ANTREAN[aksi];
      const hasil = await repo.ubahAntrean(p.fasyankes_id, id, aksi, t.dari, t.ke, sekarang());
      if (!hasil) return gagal('konflik', REGISTRASI.galat.antreanTidakSah);
      kabarkanLayarPanggilan(p.fasyankes_id);
      await audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'perbaikan', entitas: 'antrean', entitas_id: id, keterangan: `Antrean ${hasil.kode}: ${aksi} (${status} menjadi ${t.ke})`, alamat });
      return { ok: true, data: hasil };
    },

    /** Daftar antrean satu hari (bawaan hari ini menurut zona Asia/Jakarta). */
    async daftarAntrean(p: Pelaku, f: FilterAntrean) {
      const tanggal = f.tanggal ?? tanggalWib(sekarang());
      const { total, baris } = await repo.daftarAntrean(p.fasyankes_id, { ...f, tanggal });
      return { data: baris, halaman: f.halaman, ukuran: f.ukuran, total };
    },
  };
}

export type LayananKunjungan = ReturnType<typeof buatLayananKunjungan>;
