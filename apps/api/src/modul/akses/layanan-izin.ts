import { IZIN, kunciIzin, punyaIzin } from '@klira/shared';
import type { AksesEfektif, AksiIzin, CakupanIzin, KonfirmasiPeringatan, PenggunaSaya, PeringatanTerdeteksi } from '@klira/shared';
import type { PenampungAudit } from '../../middleware/audit';
import { evaluasiPeringatan, hitungAksesEfektif, peringatanBaru, relevanUntukTindakan } from './mesin-izin';
import type { KonteksTindakan, PeringatanInternal, SnapshotAkses } from './mesin-izin';
import { KonflikNama } from './repositori-izin';
import type {
  BarisIzin, BarisIzinAkun, BarisJenisAkun, BarisPenugasan, BarisPeringatan, BarisRiwayat, EntriPeringatan, RepositoriIzin,
} from './repositori-izin';

export type DependensiIzin = { repo: RepositoriIzin; audit: PenampungAudit; sekarang?: () => Date };

/** Pelaku: akun yang bersesi (pimpinan). */
export type Pelaku = Pick<PenggunaSaya, 'id' | 'fasyankes_id'> & { izin?: PenggunaSaya['izin'] };

export type Hasil<T> =
  | { ok: true; data: T }
  | { ok: false; kode: 'tidak_ditemukan' | 'konflik' | 'tidak_valid'; pesan: string }
  | { ok: false; kode: 'perlu_konfirmasi_peringatan'; pesan: string; peringatan: PeringatanTerdeteksi[] };

const gagal = (kode: 'tidak_ditemukan' | 'konflik' | 'tidak_valid', pesan: string): Hasil<never> => ({ ok: false, kode, pesan });
const HARI_MS = 86_400_000;

const tanpaInternal = (w: PeringatanInternal): PeringatanTerdeteksi => ({
  jenis: w.jenis, kunci: w.kunci, pesan: w.pesan, izin: w.izin, penugasan_id: w.penugasan_id,
});

export function buatLayananIzin(dep: DependensiIzin) {
  const sekarang = dep.sekarang ?? (() => new Date());
  const { repo, audit } = dep;

  async function catat(p: Pelaku, aksi: string, entitas: string, entitas_id: number | null, keterangan: string, alamat?: string) {
    await audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi, entitas, entitas_id, keterangan, alamat });
  }

  async function snapshotTarget(p: Pelaku, penggunaId: number): Promise<SnapshotAkses | null> {
    if (!(await repo.penggunaAda(penggunaId, p.fasyankes_id))) return null;
    return repo.ambilSnapshot(penggunaId);
  }

  /**
   * Urus peringatan atas perubahan: bila ada peringatan baru yang belum diterima untuk akun dan belum ada
   * konfirmasi, kembalikan perlu_konfirmasi (tanpa menyimpan apa pun). Tidak memblokir bila alasan diisi.
   */
  async function saringPeringatan(
    penggunaId: number, baru: PeringatanInternal[], konfirmasi?: KonfirmasiPeringatan,
  ): Promise<{ perlu: PeringatanInternal[]; diterima: Map<string, BarisPeringatan> }> {
    const diterima = new Map<string, BarisPeringatan>();
    const perlu: PeringatanInternal[] = [];
    for (const w of baru) {
      const d = await repo.cariDiterima(penggunaId, w.jenis);
      if (d) diterima.set(w.kunci, d);
      else if (!konfirmasi) perlu.push(w);
    }
    return { perlu, diterima };
  }

  async function simpanPeringatanPemberian(
    p: Pelaku, penggunaId: number, baru: PeringatanInternal[], diterima: Map<string, BarisPeringatan>,
    konfirmasi: KonfirmasiPeringatan | undefined, penugasanId: number | null, alamat?: string,
  ): Promise<BarisPeringatan[]> {
    const entri: EntriPeringatan[] = [];
    for (const w of baru) {
      const lama = diterima.get(w.kunci);
      const izin = w.izin ? await repo.cariIzin(w.izin.fitur, w.izin.aksi, w.izin.cakupan) : null;
      entri.push({
        fasyankes_id: p.fasyankes_id, pengguna_id: penggunaId, izin_id: izin?.id ?? null,
        penugasan_id: w.jenis === 'penugasan_lewat_sip' ? penugasanId : null,
        jenis_peringatan: w.jenis,
        alasan_pimpinan: lama?.alasan_pimpinan ?? konfirmasi?.alasan ?? IZIN.alasanBelumAda,
        sumber: 'pemberian', diterima_untuk_akun: lama ? true : (konfirmasi?.terima_untuk_akun ?? false),
        keterangan: w.kunci, ditetapkan_oleh: p.id,
      });
    }
    const tersimpan = await repo.simpanPeringatan(entri);
    for (const t of tersimpan) await catat(p, 'peringatan_izin', 'peringatan_izin', t.id, `${t.jenis_peringatan}: ${t.alasan_pimpinan}`.slice(0, 255), alamat);
    return tersimpan;
  }

  function ringkasIzin(sebelum: BarisIzin[], sesudah: BarisIzin[]): string[] {
    const k = (i: BarisIzin) => kunciIzin(i);
    const a = new Set(sebelum.map(k));
    const b = new Set(sesudah.map(k));
    const tambah = sesudah.filter((i) => !a.has(k(i))).map(k);
    const kurang = sebelum.filter((i) => !b.has(k(i))).map(k);
    return [...(tambah.length ? [`izin ditambah: ${tambah.join(', ')}`] : []), ...(kurang.length ? [`izin dikurangi: ${kurang.join(', ')}`] : [])];
  }

  return {
    // --- Akses efektif ---
    async aksesEfektif(p: Pelaku, penggunaId: number): Promise<Hasil<AksesEfektif>> {
      const snap = await snapshotTarget(p, penggunaId);
      if (!snap) return gagal('tidak_ditemukan', IZIN.penggunaTidakAda);
      return { ok: true, data: hitungAksesEfektif(snap, sekarang()) };
    },

    punyaIzin(pengguna: { izin: PenggunaSaya['izin'] }, fitur: string, aksi: AksiIzin, cakupan?: CakupanIzin): boolean {
      return punyaIzin(pengguna, fitur, aksi, cakupan);
    },

    // --- Jenis akun ---
    daftarIzin: () => repo.daftarIzin(),
    daftarJenisAkun: (p: Pelaku) => repo.daftarJenisAkun(p.fasyankes_id),

    async ambilJenisAkun(p: Pelaku, id: number): Promise<Hasil<BarisJenisAkun>> {
      const j = await repo.ambilJenisAkun(p.fasyankes_id, id);
      return j ? { ok: true, data: j } : gagal('tidak_ditemukan', IZIN.jenisTidakAda);
    },

    async riwayatJenisAkun(p: Pelaku, id: number): Promise<Hasil<BarisRiwayat[]>> {
      if (!(await repo.ambilJenisAkun(p.fasyankes_id, id))) return gagal('tidak_ditemukan', IZIN.jenisTidakAda);
      return { ok: true, data: await repo.riwayatJenisAkun(p.fasyankes_id, id) };
    },

    async buatJenisAkun(
      p: Pelaku, m: { nama: string; syarat_profesi?: string | null; izin_ids: number[]; alasan_perubahan?: string | null }, alamat?: string,
    ): Promise<Hasil<BarisJenisAkun>> {
      const ids = [...new Set(m.izin_ids)];
      const izin = await repo.izinByIds(ids);
      if (izin.length !== ids.length) return gagal('tidak_valid', IZIN.izinTidakDikenal);
      try {
        const j = await repo.buatJenisAkun({
          fasyankes_id: p.fasyankes_id, nama: m.nama, syarat_profesi: m.syarat_profesi ?? null, izin_ids: ids,
          alasan: m.alasan_perubahan ?? null, oleh: p.id, ringkasan: `Dibuat dengan ${ids.length} izin`,
        });
        await catat(p, 'input', 'jenis_akun', j.id, `Jenis akun dibuat: ${j.nama}`, alamat);
        return { ok: true, data: j };
      } catch (galat) {
        if (galat instanceof KonflikNama) return gagal('konflik', IZIN.namaJenisDipakai);
        throw galat;
      }
    },

    async ubahJenisAkun(
      p: Pelaku, id: number,
      m: { nama?: string; syarat_profesi?: string | null; izin_ids?: number[]; aktif?: boolean; alasan_perubahan: string }, alamat?: string,
    ): Promise<Hasil<BarisJenisAkun>> {
      const lama = await repo.ambilJenisAkun(p.fasyankes_id, id);
      if (!lama) return gagal('tidak_ditemukan', IZIN.jenisTidakAda);
      const ids = m.izin_ids ? [...new Set(m.izin_ids)] : undefined;
      let baruIzin: BarisIzin[] | undefined;
      if (ids) {
        baruIzin = await repo.izinByIds(ids);
        if (baruIzin.length !== ids.length) return gagal('tidak_valid', IZIN.izinTidakDikenal);
      }
      const bagian: string[] = [];
      if (m.nama !== undefined && m.nama !== lama.nama) bagian.push(`nama: ${lama.nama} -> ${m.nama}`);
      if (m.syarat_profesi !== undefined && (m.syarat_profesi ?? null) !== lama.syarat_profesi) bagian.push('syarat profesi diubah');
      if (m.aktif !== undefined && m.aktif !== lama.aktif) bagian.push(m.aktif ? 'diaktifkan' : 'dinonaktifkan');
      if (baruIzin) bagian.push(...ringkasIzin(lama.izin, baruIzin));
      try {
        const j = await repo.ubahJenisAkun({
          fasyankes_id: p.fasyankes_id, id, nama: m.nama, syarat_profesi: m.syarat_profesi, izin_ids: ids, aktif: m.aktif,
          alasan: m.alasan_perubahan, oleh: p.id, ringkasan: bagian.length ? bagian.join('; ') : 'Tanpa perubahan isi',
        });
        await catat(p, 'perbaikan', 'jenis_akun', id, `Jenis akun diubah: ${bagian.join('; ') || 'tanpa perubahan isi'}`.slice(0, 255), alamat);
        return { ok: true, data: j };
      } catch (galat) {
        if (galat instanceof KonflikNama) return gagal('konflik', IZIN.namaJenisDipakai);
        throw galat;
      }
    },

    // --- Penugasan jenis ---
    async daftarPenugasan(p: Pelaku, penggunaId: number): Promise<Hasil<BarisPenugasan[]>> {
      if (!(await repo.penggunaAda(penggunaId, p.fasyankes_id))) return gagal('tidak_ditemukan', IZIN.penggunaTidakAda);
      return { ok: true, data: await repo.daftarPenugasan(penggunaId) };
    },

    async tugaskanJenis(
      p: Pelaku, penggunaId: number,
      m: { jenis_akun_id: number; mulai: Date; selesai?: Date | null; konfirmasi_peringatan?: KonfirmasiPeringatan }, alamat?: string,
    ): Promise<Hasil<{ penugasan: BarisPenugasan; peringatan: BarisPeringatan[] }>> {
      const snap = await snapshotTarget(p, penggunaId);
      if (!snap) return gagal('tidak_ditemukan', IZIN.penggunaTidakAda);
      const jenis = await repo.ambilJenisAkun(p.fasyankes_id, m.jenis_akun_id);
      if (!jenis) return gagal('tidak_ditemukan', IZIN.jenisTidakAda);
      const selesai = m.selesai ?? null;
      const sesudah: SnapshotAkses = {
        ...snap,
        penugasan: [
          ...snap.penugasan,
          {
            id: 0, jenis_akun_id: jenis.id, jenis_nama: jenis.nama, syarat_profesi: jenis.syarat_profesi, jenis_aktif: jenis.aktif,
            mulai: m.mulai, selesai, izin: jenis.izin.map(({ fitur, aksi, cakupan }) => ({ fitur, aksi, cakupan })),
          },
        ],
      };
      const t = sekarang();
      const baru = peringatanBaru(snap, sesudah, t);
      const { perlu, diterima } = await saringPeringatan(penggunaId, baru, m.konfirmasi_peringatan);
      if (perlu.length) return { ok: false, kode: 'perlu_konfirmasi_peringatan', pesan: IZIN.perluKonfirmasi, peringatan: perlu.map(tanpaInternal) };
      const penugasan = await repo.buatPenugasan({
        fasyankes_id: p.fasyankes_id, pengguna_id: penggunaId, jenis_akun_id: jenis.id, mulai: m.mulai, selesai, ditetapkan_oleh: p.id,
      });
      await catat(p, 'input', 'penugasan_jenis', penugasan.id, `Penugasan jenis akun ${jenis.nama} ke pengguna ${penggunaId}`, alamat);
      const peringatan = await simpanPeringatanPemberian(p, penggunaId, baru, diterima, m.konfirmasi_peringatan, penugasan.id, alamat);
      return { ok: true, data: { penugasan, peringatan } };
    },

    async akhiriPenugasan(p: Pelaku, penggunaId: number, id: number, selesai: Date, alamat?: string): Promise<Hasil<BarisPenugasan>> {
      if (!(await repo.penggunaAda(penggunaId, p.fasyankes_id))) return gagal('tidak_ditemukan', IZIN.penggunaTidakAda);
      const lama = await repo.ambilPenugasan(penggunaId, id);
      if (!lama) return gagal('tidak_ditemukan', IZIN.penugasanTidakAda);
      if (selesai < lama.mulai) return gagal('tidak_valid', IZIN.selesaiSebelumMulai);
      const baru = await repo.akhiriPenugasan(id, selesai);
      await catat(p, 'perbaikan', 'penugasan_jenis', id, `Periode penugasan diakhiri ${selesai.toISOString()}`, alamat);
      return { ok: true, data: baru };
    },

    // --- Izin per akun ---
    async daftarIzinAkun(p: Pelaku, penggunaId: number): Promise<Hasil<BarisIzinAkun[]>> {
      if (!(await repo.penggunaAda(penggunaId, p.fasyankes_id))) return gagal('tidak_ditemukan', IZIN.penggunaTidakAda);
      return { ok: true, data: await repo.daftarIzinAkun(penggunaId) };
    },

    async beriIzinAkun(
      p: Pelaku, penggunaId: number,
      m: { izin_id: number; tipe: 'tambah' | 'kurang'; alasan: string; mulai: Date; selesai?: Date | null; konfirmasi_peringatan?: KonfirmasiPeringatan },
      alamat?: string,
    ): Promise<Hasil<{ izin_akun: BarisIzinAkun; peringatan: BarisPeringatan[] }>> {
      const snap = await snapshotTarget(p, penggunaId);
      if (!snap) return gagal('tidak_ditemukan', IZIN.penggunaTidakAda);
      const [izin] = await repo.izinByIds([m.izin_id]);
      if (!izin) return gagal('tidak_valid', IZIN.izinTidakDikenal);
      const selesai = m.selesai ?? null;
      const sesudah: SnapshotAkses = {
        ...snap,
        izin_akun: [...snap.izin_akun, { id: 0, tipe: m.tipe, izin: { fitur: izin.fitur, aksi: izin.aksi, cakupan: izin.cakupan }, mulai: m.mulai, selesai }],
      };
      const baru = peringatanBaru(snap, sesudah, sekarang());
      const { perlu, diterima } = await saringPeringatan(penggunaId, baru, m.konfirmasi_peringatan);
      if (perlu.length) return { ok: false, kode: 'perlu_konfirmasi_peringatan', pesan: IZIN.perluKonfirmasi, peringatan: perlu.map(tanpaInternal) };
      const izin_akun = await repo.buatIzinAkun({
        fasyankes_id: p.fasyankes_id, pengguna_id: penggunaId, izin_id: izin.id, tipe: m.tipe, alasan: m.alasan,
        mulai: m.mulai, selesai, ditetapkan_oleh: p.id,
      });
      await catat(p, 'input', 'izin_per_akun', izin_akun.id, `Izin ${m.tipe} ${kunciIzin(izin)} untuk pengguna ${penggunaId}: ${m.alasan}`.slice(0, 255), alamat);
      const peringatan = await simpanPeringatanPemberian(p, penggunaId, baru, diterima, m.konfirmasi_peringatan, null, alamat);
      return { ok: true, data: { izin_akun, peringatan } };
    },

    async akhiriIzinAkun(p: Pelaku, penggunaId: number, id: number, selesai: Date, alamat?: string): Promise<Hasil<BarisIzinAkun>> {
      if (!(await repo.penggunaAda(penggunaId, p.fasyankes_id))) return gagal('tidak_ditemukan', IZIN.penggunaTidakAda);
      const lama = await repo.ambilIzinAkun(penggunaId, id);
      if (!lama) return gagal('tidak_ditemukan', IZIN.izinAkunTidakAda);
      if (selesai < lama.mulai) return gagal('tidak_valid', IZIN.selesaiSebelumMulai);
      const baru = await repo.akhiriIzinAkun(id, selesai);
      await catat(p, 'perbaikan', 'izin_per_akun', id, `Periode izin akun diakhiri ${selesai.toISOString()}`, alamat);
      return { ok: true, data: baru };
    },

    // --- Peringatan ---
    async daftarPeringatan(p: Pelaku, f: { pengguna_id?: number; jenis_peringatan?: string; halaman: number; ukuran: number }) {
      const { data, total } = await repo.daftarPeringatan(p.fasyankes_id, f);
      return { data, halaman: f.halaman, ukuran: f.ukuran, total };
    },

    /** "Terima untuk akun ini": alasan sekali; peringatan berikutnya tidak menghalangi tetapi tercatat. */
    async terimaPeringatan(p: Pelaku, m: { pengguna_id: number; jenis_peringatan: string; alasan: string }, alamat?: string): Promise<Hasil<BarisPeringatan>> {
      if (!(await repo.penggunaAda(m.pengguna_id, p.fasyankes_id))) return gagal('tidak_ditemukan', IZIN.penggunaTidakAda);
      const [r] = await repo.simpanPeringatan([
        {
          fasyankes_id: p.fasyankes_id, pengguna_id: m.pengguna_id, izin_id: null, penugasan_id: null, jenis_peringatan: m.jenis_peringatan,
          alasan_pimpinan: m.alasan, sumber: 'terima', diterima_untuk_akun: true, keterangan: 'Terima untuk akun ini', ditetapkan_oleh: p.id,
        },
      ]);
      await catat(p, 'peringatan_izin', 'peringatan_izin', r.id, `Terima untuk akun ini: ${m.jenis_peringatan}: ${m.alasan}`.slice(0, 255), alamat);
      return { ok: true, data: r };
    },

    /**
     * Saat tindakan terjadi: evaluasi peringatan yang relevan untuk fitur, catat ke peringatan_izin dan audit.
     * Tidak memblokir. Peringatan sama dicatat sekali per 24 jam kecuali bergantung pada data tindakan (pembuat=penyetuju).
     */
    async catatTindakan(pengguna: Pelaku, fitur: string, konteks: KonteksTindakan = {}, alamat?: string): Promise<BarisPeringatan[]> {
      const snap = await repo.ambilSnapshot(pengguna.id);
      if (!snap) return [];
      const t = sekarang();
      const relevan = relevanUntukTindakan(evaluasiPeringatan(snap, t, konteks), fitur);
      const entri: EntriPeringatan[] = [];
      for (const w of relevan) {
        const perTindakan = w.jenis === 'perbaikan_pembuat_penyetuju_sama';
        if (!perTindakan && (await repo.adaTindakanSejak(pengguna.id, w.kunci, new Date(t.getTime() - HARI_MS)))) continue;
        const diterima = await repo.cariDiterima(pengguna.id, w.jenis);
        const izin = w.izin ? await repo.cariIzin(w.izin.fitur, w.izin.aksi, w.izin.cakupan) : null;
        entri.push({
          fasyankes_id: pengguna.fasyankes_id, pengguna_id: pengguna.id, izin_id: izin?.id ?? null, penugasan_id: w.penugasan_id ?? null,
          jenis_peringatan: w.jenis,
          alasan_pimpinan: diterima?.alasan_pimpinan ?? (await repo.alasanTerakhir(pengguna.id, w.jenis)) ?? IZIN.alasanBelumAda,
          sumber: 'tindakan', diterima_untuk_akun: !!diterima, keterangan: w.kunci, ditetapkan_oleh: null,
        });
      }
      const tersimpan = await repo.simpanPeringatan(entri);
      for (const r of tersimpan) {
        await audit.catat({
          fasyankes_id: pengguna.fasyankes_id, pengguna_id: pengguna.id, aksi: 'peringatan_izin', entitas: 'peringatan_izin',
          entitas_id: r.id, keterangan: `${r.jenis_peringatan} saat tindakan pada ${fitur}`.slice(0, 255), alamat,
        });
      }
      return tersimpan;
    },

    /** Dipakai middleware: catat penolakan izin (403) ke audit. */
    async catatPenolakan(pengguna: Pelaku, fitur: string, aksi: string, alamat?: string): Promise<void> {
      await audit.catat({
        fasyankes_id: pengguna.fasyankes_id, pengguna_id: pengguna.id, aksi: 'izin_ditolak', entitas: fitur,
        keterangan: `Ditolak: ${fitur} ${aksi}`, alamat,
      });
    },
  };
}

export type LayananIzin = ReturnType<typeof buatLayananIzin>;
