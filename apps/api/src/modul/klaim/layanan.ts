import {
  batasAjukanUlang, batasPengajuan, berkasKurang, KLAIM, kodeKlaimBeda, sisaHariBatas, STATUS_KLAIM, statusAwalKlaim, statusKlaimEfektif, TRANSISI_KLAIM,
} from '@klira/shared';
import type {
  BagianKlinis, BerkasKlaim, FilterKlaim, HalamanKlaimDto, KandidatKlaimDto, KlaimDto, KodeKlaim, PenggunaSaya, PengkodeanIsi, SiapkanKlaimMasukan, UbahBerkasKlaimMasukan, UbahStatusKlaimMasukan,
} from '@klira/shared';
import type { PenampungAudit } from '../../middleware/audit';
import { gagal } from '../hasil';
import type { Hasil } from '../hasil';
import { GalatKlaim } from './repositori';
import type { KlaimBaris, KunjunganKlaim, RepositoriKlaimPrisma } from './repositori';

type Pelaku = Pick<PenggunaSaya, 'id' | 'fasyankes_id'>;
const G = KLAIM.galat;
type DiagnosisDokter = { item?: { kode: string; nama: string; peran: 'utama' | 'penyerta' }[] };
type TindakanDokter = { item?: { kode: string; nama: string }[] };

export type DependensiKlaim = {
  repo: RepositoriKlaimPrisma;
  /** Kode final (pengkodean) dan isi catatan dokter, ketersediaan resume medis. */
  rm: { pengkodean: (fasyankesId: number, kunjunganId: number) => Promise<{ isi: PengkodeanIsi } | null>; resumeAda: (fasyankesId: number, kunjunganIds: number[]) => Promise<Set<number>> };
  baca: { bacaBagian: (fasyankesId: number, kunjunganId: number, bagian: BagianKlinis) => Promise<unknown> };
  audit: PenampungAudit;
  sekarang?: () => Date;
};

const tglDb = (t: string): Date => new Date(`${t}T00:00:00.000+07:00`);

/**
 * Klaim JKN/BPJS FKTP (4.5, 7): siapkan klaim dari kunjungan JKN yang sudah ditutup (kode disalin dari rekam medis), kelola SEP dan berkas, dan ubah status
 * (ajukan, dikembalikan, ajukan ulang, ditolak, dibayar) dengan pagar batas 6 bulan dan batas ajukan ulang bulan berikutnya. Semua tercatat di audit dan riwayat status.
 */
export function buatLayananKlaim({ repo, rm, baca, audit, sekarang = () => new Date() }: DependensiKlaim) {
  const catat = (p: Pelaku, aksi: 'input' | 'perbaikan' | 'lihat', id: number | null, keterangan: string, alamat?: string) =>
    audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi, entitas: 'klaim', entitas_id: id, keterangan, alamat });

  /** Kode rekam medis sekarang: pengkodean final bila ada, selain itu catatan dokter (versi terakhir). */
  async function kodeRm(fas: number, kunjunganId: number): Promise<{ diagnosis: KodeKlaim[]; tindakan: KodeKlaim[]; final: boolean }> {
    const final = await rm.pengkodean(fas, kunjunganId);
    if (final) return { diagnosis: final.isi.diagnosis.map((d) => ({ kode: d.kode, nama: d.nama })), tindakan: final.isi.tindakan.map((t) => ({ kode: t.kode, nama: t.nama })), final: true };
    const [d, t] = await Promise.all([baca.bacaBagian(fas, kunjunganId, 'diagnosis') as Promise<DiagnosisDokter | null>, baca.bacaBagian(fas, kunjunganId, 'tindakan') as Promise<TindakanDokter | null>]);
    return { diagnosis: (d?.item ?? []).map((x) => ({ kode: x.kode, nama: x.nama })), tindakan: (t?.item ?? []).map((x) => ({ kode: x.kode, nama: x.nama })), final: false };
  }

  async function keDto(fas: number, k: KlaimBaris, kunj: KunjunganKlaim | undefined, resume: Set<number>, riwayat: Awaited<ReturnType<typeof repo.riwayat>>, nama: Map<number, string>): Promise<KlaimDto> {
    const now = sekarang();
    const dasar = { status: k.status, batas_pengajuan: k.batas_pengajuan, batas_ajukan_ulang: k.batas_ajukan_ulang };
    const kini = await kodeRm(fas, k.kunjungan_id);
    const jenis = kunj?.jenis ?? 'AMB';
    return {
      id: k.id, kunjungan_id: k.kunjungan_id, pasien_nama: kunj?.pasien_nama ?? '-', pasien_nomor_rm: kunj?.pasien_nomor_rm ?? '-', jenis, nomor_sep: k.nomor_sep, status: statusKlaimEfektif(dasar, now), tanggal_selesai: k.tanggal_selesai.toISOString(),
      batas_pengajuan: k.batas_pengajuan.toISOString(), batas_ajukan_ulang: k.batas_ajukan_ulang?.toISOString() ?? null, sisa_hari: sisaHariBatas(dasar, now), diagnosis: k.diagnosis, tindakan: k.tindakan, berkas: k.berkas as BerkasKlaim[],
      berkas_kurang: berkasKurang(jenis, k.berkas), catatan: k.catatan, diajukan_pada: k.diajukan_pada?.toISOString() ?? null, dikembalikan_pada: k.dikembalikan_pada?.toISOString() ?? null, berita_acara: k.berita_acara, alasan: k.alasan,
      jumlah_dibayar: k.jumlah_dibayar, dibayar_pada: k.dibayar_pada?.toISOString() ?? null, kode_beda: kodeKlaimBeda(k, kini), resume_ada: resume.has(k.kunjungan_id), spri: kunj?.spri ?? null,
      riwayat: riwayat.filter((r) => r.klaim_id === k.id).map((r) => ({ dari: r.dari, ke: r.ke, alasan: r.alasan, oleh_nama: nama.get(r.oleh) ?? null, waktu: r.waktu.toISOString() })),
    };
  }

  async function muatDto(p: Pelaku, baris: KlaimBaris[]): Promise<KlaimDto[]> {
    const ids = baris.map((b) => b.kunjungan_id);
    const [kunj, resume, riwayat] = await Promise.all([repo.kunjunganBanyak(p.fasyankes_id, ids), rm.resumeAda(p.fasyankes_id, ids), repo.riwayat(p.fasyankes_id, baris.map((b) => b.id))]);
    const nama = await repo.namaPengguna(riwayat.map((r) => r.oleh));
    return Promise.all(baris.map((b) => keDto(p.fasyankes_id, b, kunj.get(b.kunjungan_id), resume, riwayat, nama)));
  }

  async function ambil(p: Pelaku, id: number): Promise<Hasil<KlaimDto>> {
    const k = await repo.klaim(p.fasyankes_id, id);
    if (!k) return gagal('tidak_ditemukan', G.klaimTidakAda);
    return { ok: true, data: (await muatDto(p, [k]))[0] };
  }
  const bentrok = (e: unknown): Hasil<never> | null => (e instanceof GalatKlaim ? gagal('konflik', e.kode === 'sudah_ada' ? G.sudahAda : G.bentrok) : null);

  return {
    async kandidat(p: Pelaku): Promise<KandidatKlaimDto[]> {
      const k = await repo.kandidat(p.fasyankes_id);
      const resume = await rm.resumeAda(p.fasyankes_id, k.map((x) => x.id));
      const out: KandidatKlaimDto[] = [];
      for (const x of k) {
        out.push({ kunjungan_id: x.id, pasien_nama: x.pasien_nama, pasien_nomor_rm: x.pasien_nomor_rm, jenis: x.jenis, waktu_tutup: (x.waktu_tutup ?? new Date(0)).toISOString(), nomor_sep: x.nomor_sep, resume_ada: resume.has(x.id), kode_ada: !!(await rm.pengkodean(p.fasyankes_id, x.id)) });
      }
      return out;
    },

    /** Kode klaim yang akan disalin untuk satu kunjungan (pratinjau di modal Penyiapan klaim). */
    async kodeKunjungan(p: Pelaku, kunjunganId: number): Promise<Hasil<{ diagnosis: KodeKlaim[]; tindakan: KodeKlaim[]; final: boolean }>> {
      if (!(await repo.kunjungan(p.fasyankes_id, kunjunganId))) return gagal('tidak_ditemukan', G.kunjunganTidakAda);
      return { ok: true, data: await kodeRm(p.fasyankes_id, kunjunganId) };
    },

    async daftar(p: Pelaku, f: FilterKlaim): Promise<HalamanKlaimDto> {
      const now = sekarang();
      const [{ total, baris }, ringkasan] = await Promise.all([repo.daftar(p.fasyankes_id, f, now), repo.ringkasan(p.fasyankes_id, now)]);
      return { data: await muatDto(p, baris), halaman: f.halaman, ukuran: f.ukuran, total, ringkasan };
    },

    detail: async (p: Pelaku, id: number, alamat?: string): Promise<Hasil<KlaimDto>> => {
      const h = await ambil(p, id);
      if (h.ok) await catat(p, 'lihat', id, 'Membuka klaim', alamat);
      return h;
    },

    async siapkan(p: Pelaku, m: SiapkanKlaimMasukan, alamat?: string): Promise<Hasil<KlaimDto>> {
      const k = await repo.kunjungan(p.fasyankes_id, m.kunjungan_id);
      if (!k) return gagal('tidak_ditemukan', G.kunjunganTidakAda);
      if (k.cara_pembayaran !== 'jkn') return gagal('konflik', G.bukanJkn);
      if (k.tahap_layanan !== 'ditutup' || !k.waktu_tutup) return gagal('konflik', G.belumDitutup);
      const [kode, resume] = await Promise.all([kodeRm(p.fasyankes_id, k.id), rm.resumeAda(p.fasyankes_id, [k.id])]);
      const sep = m.nomor_sep ?? k.nomor_sep;
      let id: number;
      try {
        id = await repo.buat({
          fasyankesId: p.fasyankes_id, kunjunganId: k.id, nomorSep: sep, status: statusAwalKlaim({ nomor_sep: sep, berkas: m.berkas, jenis: k.jenis, resume_ada: resume.has(k.id) }), tanggalSelesai: k.waktu_tutup, batas: batasPengajuan(k.waktu_tutup),
          diagnosis: kode.diagnosis, tindakan: kode.tindakan, berkas: m.berkas, catatan: m.catatan, oleh: p.id,
        });
      } catch (e) {
        const g = bentrok(e);
        if (g) return g;
        throw e;
      }
      await catat(p, 'input', id, `Menyiapkan klaim kunjungan ${k.id}`, alamat);
      return ambil(p, id);
    },

    /** Ubah SEP, berkas, dan catatan selama klaim belum diajukan (atau dikembalikan); status awal dihitung ulang untuk klaim yang belum diajukan. */
    async ubahBerkas(p: Pelaku, id: number, m: UbahBerkasKlaimMasukan, alamat?: string): Promise<Hasil<KlaimDto>> {
      const k = await repo.klaim(p.fasyankes_id, id);
      if (!k) return gagal('tidak_ditemukan', G.klaimTidakAda);
      const efektif = statusKlaimEfektif(k, sekarang());
      if (efektif === 'lewat_batas_waktu') return gagal('konflik', G.lewatBatas);
      if (efektif !== 'menunggu_sep' && efektif !== 'siap_diajukan' && efektif !== 'dikembalikan') return gagal('konflik', G.tidakBisaUbah);
      const kunj = await repo.kunjungan(p.fasyankes_id, k.kunjungan_id);
      const resume = await rm.resumeAda(p.fasyankes_id, [k.kunjungan_id]);
      const status = efektif === 'dikembalikan' ? efektif : statusAwalKlaim({ nomor_sep: m.nomor_sep, berkas: m.berkas, jenis: kunj?.jenis ?? 'AMB', resume_ada: resume.has(k.kunjungan_id) });
      try {
        await repo.ubahBerkas(p.fasyankes_id, id, k.status, { nomorSep: m.nomor_sep, berkas: m.berkas, catatan: m.catatan, status, oleh: p.id });
      } catch (e) {
        const g = bentrok(e);
        if (g) return g;
        throw e;
      }
      await catat(p, 'perbaikan', id, `Mengubah SEP atau berkas klaim ${id}`, alamat);
      return ambil(p, id);
    },

    async ubahStatus(p: Pelaku, id: number, m: UbahStatusKlaimMasukan, alamat?: string): Promise<Hasil<KlaimDto>> {
      const k = await repo.klaim(p.fasyankes_id, id);
      if (!k) return gagal('tidak_ditemukan', G.klaimTidakAda);
      const now = sekarang();
      const efektif = statusKlaimEfektif(k, now);
      if (efektif === 'lewat_batas_waktu') return gagal('konflik', G.lewatBatas);
      const t = TRANSISI_KLAIM[m.aksi];
      if (!t.dari.includes(efektif)) return gagal('konflik', G.aksiTidakSah);
      const d: Parameters<typeof repo.ubahStatus>[4] = {};
      if (m.aksi === 'ajukan' || m.aksi === 'ajukan_ulang') d.diajukan_pada = now;
      if (m.aksi === 'dikembalikan') Object.assign(d, { dikembalikan_pada: now, berita_acara: m.berita_acara, batas_ajukan_ulang: batasAjukanUlang(now) });
      if (m.aksi === 'ditolak') d.alasan = m.alasan;
      if (m.aksi === 'dibayar') Object.assign(d, { jumlah_dibayar: m.jumlah_dibayar, dibayar_pada: tglDb(m.dibayar_pada!) });
      try {
        await repo.ubahStatus(p.fasyankes_id, id, k.status, t.ke, d, p.id, m.alasan ?? m.berita_acara ?? null);
      } catch (e) {
        const g = bentrok(e);
        if (g) return g;
        throw e;
      }
      await catat(p, 'perbaikan', id, `Klaim ${id}: ${STATUS_KLAIM.label(efektif)} menjadi ${STATUS_KLAIM.label(t.ke)}`, alamat);
      return ambil(p, id);
    },
  };
}
export type LayananKlaim = ReturnType<typeof buatLayananKlaim>;
