import { butirKurang, hakTerlambat, laporanKeCsv, PDP, sisaJamPdp, tahapHakBerikut, tahapMusnahBerikut, waktuDariIsian } from '@klira/shared';
import type {
  ButirPerjanjian, DpiaDto, DpiaMasukan, FilterHak, FilterPersetujuanPdp, HakDto, HakMasukan, HalamanHakDto, HalamanPdp, HalamanPersetujuanPdpDto, InsidenDto, InsidenMasukan, KebijakanRetensiDto, PemberitahuanMasukan, PemusnahanDto, PemusnahanMasukan,
  PenggunaSaya, ProsesHakMasukan, ProsesorDto, ProsesorMasukan, ProsesPemusnahanMasukan, RopaDto, RopaMasukan, StatusHak, StatusMusnah, TeksPemberitahuanDto,
} from '@klira/shared';
import type { PenampungAudit } from '../../middleware/audit';
import { gagal } from '../hasil';
import type { Hasil } from '../hasil';
import { awalHariWib, GalatPdp } from './repositori';
import type { HakBaris, RepositoriPdpPrisma } from './repositori';

type Pelaku = Pick<PenggunaSaya, 'id' | 'fasyankes_id'>;
const G = PDP.galat;
const iso = (d: Date | null): string | null => d?.toISOString() ?? null;
const tgl = (d: Date): string => d.toISOString().slice(0, 10);

export type DependensiPdp = { repo: RepositoriPdpPrisma; audit: PenampungAudit; sekarang?: () => Date };

/**
 * Pelindungan data pribadi (PP 33/2026): permintaan hak (3x24 jam, keputusan > pelaksanaan > notifikasi), teks pemberitahuan berversi dan penarikan persetujuan,
 * ROPA, DPIA, insiden (notifikasi 3x24 jam), pemusnahan berlangkah (perintah ke prosesor lebih dulu, berita acara), dan prosesor. Semua tercatat di audit; tidak ada hapus.
 */
export function buatLayananPdp({ repo, audit, sekarang = () => new Date() }: DependensiPdp) {
  const catat = (p: Pelaku, aksi: 'input' | 'perbaikan' | 'lihat', entitas: string, id: number | null, keterangan: string, alamat?: string) =>
    audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi, entitas, entitas_id: id, keterangan, alamat });
  const bentrok = (e: unknown): Hasil<never> | null => (e instanceof GalatPdp ? gagal('konflik', e.kode === 'sudah_ditarik' ? G.sudahDitarik : G.bentrok) : null);

  // ---- Permintaan hak ----
  async function dtoHak(p: Pelaku, baris: HakBaris[]): Promise<HakDto[]> {
    const now = sekarang();
    const [pasien, nama] = await Promise.all([repo.pasienBanyak(p.fasyankes_id, baris.map((b) => b.pasien_id)), repo.namaPengguna(baris.flatMap((b) => (b.keputusan_oleh ? [b.keputusan_oleh] : [])))]);
    return baris.map((b): HakDto => ({
      id: b.id, pasien_id: b.pasien_id, pasien_nama: pasien.get(b.pasien_id)?.nama ?? '-', pasien_nomor_rm: pasien.get(b.pasien_id)?.nomor_rm ?? '-', jenis: b.jenis, saluran: b.saluran, pemohon_nama: b.pemohon_nama, pemohon_hubungan: b.pemohon_hubungan as HakDto['pemohon_hubungan'],
      verifikasi: b.verifikasi, rincian: b.rincian, diterima_pada: b.diterima_pada.toISOString(), batas_waktu: b.batas_waktu.toISOString(), status: b.status, terlambat: hakTerlambat(b, now), sisa_jam: b.status === 'selesai' ? null : sisaJamPdp(b.batas_waktu, now),
      tahap_berikut: tahapHakBerikut(b.status), alasan_keputusan: b.alasan_keputusan, keputusan_nama: b.keputusan_oleh ? nama.get(b.keputusan_oleh) ?? null : null, waktu_keputusan: iso(b.waktu_keputusan), pelaksanaan: b.pelaksanaan,
      waktu_pelaksanaan: iso(b.waktu_pelaksanaan), notifikasi_pada: iso(b.notifikasi_pada), catatan_notifikasi: b.catatan_notifikasi,
    }));
  }
  async function ambilHak(p: Pelaku, id: number): Promise<Hasil<HakDto>> {
    const b = await repo.hak(p.fasyankes_id, id);
    return b ? { ok: true, data: (await dtoHak(p, [b]))[0] } : gagal('tidak_ditemukan', G.hakTidakAda);
  }

  // ---- Insiden ----
  async function dtoInsiden(p: Pelaku, hasil: Awaited<ReturnType<typeof repo.daftarInsiden>>): Promise<InsidenDto[]> {
    const now = sekarang();
    const pasien = await repo.pasienBanyak(p.fasyankes_id, hasil.pasien.map((x) => x.pasien_id));
    return hasil.baris.map((b): InsidenDto => {
      const ids = hasil.pasien.filter((x) => x.insiden_id === b.id).map((x) => x.pasien_id);
      const selesai = !!b.notifikasi_pasien_pada && !!b.notifikasi_lembaga_pada;
      return {
        id: b.id, waktu_kejadian: iso(b.waktu_kejadian), waktu_diketahui: b.waktu_diketahui.toISOString(), siber: b.siber, uraian: b.uraian, data_terungkap: b.data_terungkap, penanganan: b.penanganan, pemulihan: b.pemulihan, kontak_ppdp: b.kontak_ppdp,
        batas_notifikasi: b.batas_notifikasi.toISOString(), notifikasi_pasien_pada: iso(b.notifikasi_pasien_pada), notifikasi_lembaga_pada: iso(b.notifikasi_lembaga_pada), sisa_jam: selesai ? null : sisaJamPdp(b.batas_notifikasi, now),
        terlambat: !selesai && now.getTime() > b.batas_notifikasi.getTime(), jumlah_terdampak: ids.length, pasien: ids.flatMap((id) => (pasien.has(id) ? [pasien.get(id)!] : [])),
      };
    });
  }
  async function ambilInsiden(p: Pelaku, id: number): Promise<Hasil<InsidenDto>> {
    const b = await repo.insiden(p.fasyankes_id, id);
    if (!b) return gagal('tidak_ditemukan', G.insidenTidakAda);
    const pasien = (await repo.pasienInsiden(p.fasyankes_id, id)).map((pasien_id) => ({ insiden_id: id, pasien_id, id: 0, fasyankes_id: p.fasyankes_id }));
    return { ok: true, data: (await dtoInsiden(p, { total: 1, baris: [b], pasien }))[0] };
  }

  // ---- Pemusnahan ----
  async function dtoMusnah(p: Pelaku, baris: Awaited<ReturnType<typeof repo.daftarMusnah>>['baris']): Promise<PemusnahanDto[]> {
    const awalHari = awalHariWib(sekarang());
    const [pasien, prosesor] = await Promise.all([repo.pasienBanyak(p.fasyankes_id, baris.flatMap((b) => (b.pasien_id ? [b.pasien_id] : []))), repo.namaProsesor(p.fasyankes_id, baris.flatMap((b) => (b.prosesor_id ? [b.prosesor_id] : [])))]);
    return baris.map((b): PemusnahanDto => ({
      id: b.id, cakupan: b.cakupan, dasar: b.dasar as PemusnahanDto['dasar'], permintaan_hak_id: b.permintaan_hak_id, pasien_id: b.pasien_id, pasien_nama: b.pasien_id ? pasien.get(b.pasien_id)?.nama ?? null : null, jadwal: tgl(b.jadwal), status: b.status as StatusMusnah,
      tahap_berikut: tahapMusnahBerikut(b.status as StatusMusnah), prosesor_id: b.prosesor_id, prosesor_nama: b.prosesor_id ? prosesor.get(b.prosesor_id) ?? null : null, nomor_perintah: b.nomor_perintah, perintah_pada: iso(b.perintah_pada), pelaksana: b.pelaksana,
      metode: b.metode, mencakup_cadangan: b.mencakup_cadangan, pelaksanaan_pada: iso(b.pelaksanaan_pada), berita_acara: b.berita_acara, berita_acara_pada: iso(b.berita_acara_pada), terlambat: b.status !== 'selesai' && b.jadwal.getTime() < awalHari.getTime(),
    }));
  }
  async function ambilMusnah(p: Pelaku, id: number): Promise<Hasil<PemusnahanDto>> {
    const b = await repo.musnah(p.fasyankes_id, id);
    return b ? { ok: true, data: (await dtoMusnah(p, [b]))[0] } : gagal('tidak_ditemukan', G.musnahTidakAda);
  }

  const dtoRopa = (b: Awaited<ReturnType<typeof repo.semuaRopa>>[number]): RopaDto => ({
    id: b.id, nama_kegiatan: b.nama_kegiatan, ppdp_nama: b.ppdp_nama, sumber_tujuan: b.sumber_tujuan, dasar: b.dasar as RopaDto['dasar'], tujuan: b.tujuan, jenis_data: b.jenis_data, kategori_subjek: b.kategori_subjek,
    pihak_akses: b.pihak_akses, pemenuhan_hak: b.pemenuhan_hak, aliran: b.aliran, masa_retensi: b.masa_retensi, pengamanan: b.pengamanan, transfer: b.transfer, diperbarui_pada: b.diperbarui_pada.toISOString(),
  });
  const dtoProsesor = (b: NonNullable<Awaited<ReturnType<typeof repo.prosesor>>>): ProsesorDto => {
    const butir = b.butir_perjanjian as ButirPerjanjian[];
    return {
      id: b.id, nama: b.nama, layanan: b.layanan, lokasi_data: b.lokasi_data, nomor_perjanjian: b.nomor_perjanjian, butir_perjanjian: butir, butir_kurang: butirKurang(butir), sub_prosesor: b.sub_prosesor as ProsesorDto['sub_prosesor'],
      sla_lapor_jam: b.sla_lapor_jam, aktif: b.aktif, diperbarui_pada: b.diperbarui_pada.toISOString(),
    };
  };
  const halaman = <T>(data: T[], h: number, u: number, total: number): HalamanPdp<T> => ({ data, halaman: h, ukuran: u, total });

  return {
    ringkasan: (p: Pelaku) => repo.ringkasan(p.fasyankes_id, sekarang()),

    // Permintaan hak
    async catatHak(p: Pelaku, m: HakMasukan, alamat?: string): Promise<Hasil<HakDto>> {
      if (!(await repo.pasien(p.fasyankes_id, m.pasien_id))) return gagal('tidak_ditemukan', G.pasienTidakAda);
      const id = await repo.buatHak(p.fasyankes_id, m, p.id, sekarang());
      await catat(p, 'input', 'permintaan_hak', id, `Permintaan hak ${m.jenis} pasien ${m.pasien_id}`, alamat);
      return ambilHak(p, id);
    },
    async daftarHak(p: Pelaku, f: FilterHak): Promise<HalamanHakDto> {
      const h = await repo.daftarHak(p.fasyankes_id, f, sekarang());
      return { data: await dtoHak(p, h.baris), halaman: f.halaman, ukuran: f.ukuran, total: h.total, aktif: h.aktif, terlambat: h.terlambat };
    },
    async prosesHak(p: Pelaku, id: number, m: ProsesHakMasukan, alamat?: string): Promise<Hasil<HakDto>> {
      const b = await repo.hak(p.fasyankes_id, id);
      if (!b) return gagal('tidak_ditemukan', G.hakTidakAda);
      if (tahapHakBerikut(b.status) !== m.tahap) return gagal('konflik', G.tahapTidakSah);
      const now = sekarang();
      const dari: StatusHak[] = m.tahap === 'notifikasi' ? ['ditolak', 'dilaksanakan'] : [b.status];
      try {
        if (m.tahap === 'keputusan') await repo.majuHak(p.fasyankes_id, id, dari, m.keputusan === 'setujui' ? 'disetujui' : 'ditolak', { keputusan_oleh: p.id, waktu_keputusan: now, alasan_keputusan: m.alasan });
        else if (m.tahap === 'pelaksanaan') await repo.majuHak(p.fasyankes_id, id, dari, 'dilaksanakan', { pelaksanaan: m.pelaksanaan, pelaksana_id: p.id, waktu_pelaksanaan: now });
        else await repo.majuHak(p.fasyankes_id, id, dari, 'selesai', { notifikasi_pada: now, notifikasi_oleh: p.id, catatan_notifikasi: m.catatan });
      } catch (e) {
        const g = bentrok(e);
        if (g) return g;
        throw e;
      }
      await catat(p, 'perbaikan', 'permintaan_hak', id, `Permintaan hak ${id}: tahap ${m.tahap}`, alamat);
      return ambilHak(p, id);
    },

    // Teks pemberitahuan dan persetujuan
    async daftarPemberitahuan(p: Pelaku): Promise<TeksPemberitahuanDto[]> {
      return (await repo.daftarTeksPdp(p.fasyankes_id)).map((t) => ({ id: t.id, versi: t.versi, judul: t.judul, tujuan: t.tujuan, isi: t.isi, aktif: t.aktif, dibuat_pada: t.dibuat_pada.toISOString() }));
    },
    async buatPemberitahuan(p: Pelaku, m: PemberitahuanMasukan, alamat?: string): Promise<Hasil<{ id: number }>> {
      const id = await repo.buatTeksPdp(p.fasyankes_id, m, p.id);
      await catat(p, 'input', 'teks_pemberitahuan', id, 'Versi baru teks pemberitahuan PDP', alamat);
      return { ok: true, data: { id } };
    },
    async daftarPersetujuan(p: Pelaku, f: FilterPersetujuanPdp): Promise<HalamanPersetujuanPdpDto> {
      const h = await repo.daftarPersetujuan(p.fasyankes_id, f);
      const pasien = await repo.pasienBanyak(p.fasyankes_id, h.baris.map((b) => b.pasien_id));
      return {
        data: h.baris.map((b) => {
          const t = h.tarik.find((x) => x.persetujuan_id === b.id);
          return {
            id: b.id, pasien_id: b.pasien_id, pasien_nama: pasien.get(b.pasien_id)?.nama ?? '-', pasien_nomor_rm: pasien.get(b.pasien_id)?.nomor_rm ?? '-', jenis: b.jenis, versi_teks: b.versi_teks, tujuan: b.tujuan, waktu: b.waktu.toISOString(),
            status: b.status, penandatangan_nama: b.penandatangan_nama, penarikan: t ? { alasan: t.alasan, waktu: t.waktu.toISOString(), batas_henti: t.batas_henti.toISOString() } : null,
          };
        }),
        halaman: f.halaman, ukuran: f.ukuran, total: h.total,
      };
    },
    async tarikPersetujuan(p: Pelaku, persetujuanId: number, alasan: string, alamat?: string): Promise<Hasil<{ batas_henti: string }>> {
      const s = await repo.persetujuan(p.fasyankes_id, persetujuanId);
      if (!s) return gagal('tidak_ditemukan', G.persetujuanTidakAda);
      if (s.jenis !== 'general' && s.jenis !== 'PDP') return gagal('tidak_valid', G.bukanPersetujuanPdp);
      if (s.status !== 'diberikan') return gagal('konflik', G.sudahDitarik);
      const now = sekarang();
      try {
        await repo.tarik(p.fasyankes_id, persetujuanId, alasan, p.id, now);
      } catch (e) {
        const g = bentrok(e);
        if (g) return g;
        throw e;
      }
      await catat(p, 'perbaikan', 'persetujuan', persetujuanId, `Penarikan persetujuan ${s.jenis} pasien ${s.pasien_id}`, alamat);
      return { ok: true, data: { batas_henti: new Date(now.getTime() + 72 * 3_600_000).toISOString() } };
    },

    // ROPA
    async daftarRopa(p: Pelaku, h: number, u: number): Promise<HalamanPdp<RopaDto>> {
      const r = await repo.daftarRopa(p.fasyankes_id, h, u);
      return halaman(r.baris.map(dtoRopa), h, u, r.total);
    },
    /** ROPA lengkap sebagai CSV (13 butir, PP 33/2026 P74); sel berawalan rumus dinetralkan. */
    async ropaCsv(p: Pelaku, alamat?: string): Promise<string> {
      const baris = await repo.semuaRopa(p.fasyankes_id);
      await catat(p, 'lihat', 'ropa', null, 'Ekspor ROPA', alamat);
      const R = PDP.ropa;
      return laporanKeCsv({
        kolom: ['Pengendali', R.ppdp, R.namaKegiatan, R.sumberTujuan, R.dasar, R.tujuan, R.jenisData, R.kategoriSubjek, R.pihakAkses, R.pemenuhanHak, R.aliran, R.masaRetensi, R.pengamanan, R.transfer],
        baris: baris.map((b) => ['Klinik', b.ppdp_nama ?? '', b.nama_kegiatan, b.sumber_tujuan, R.dasarLabel[b.dasar] ?? b.dasar, b.tujuan, b.jenis_data, b.kategori_subjek, b.pihak_akses, b.pemenuhan_hak, b.aliran, b.masa_retensi, b.pengamanan, b.transfer]),
      });
    },
    async buatRopa(p: Pelaku, m: RopaMasukan, alamat?: string): Promise<Hasil<{ id: number }>> {
      const id = await repo.buatRopa(p.fasyankes_id, m, p.id);
      await catat(p, 'input', 'ropa', id, `ROPA: ${m.nama_kegiatan}`, alamat);
      return { ok: true, data: { id } };
    },
    async ubahRopa(p: Pelaku, id: number, m: RopaMasukan, alamat?: string): Promise<Hasil<{ id: number }>> {
      if (!(await repo.ubahRopa(p.fasyankes_id, id, m))) return gagal('tidak_ditemukan', G.ropaTidakAda);
      await catat(p, 'perbaikan', 'ropa', id, `Ubah ROPA: ${m.nama_kegiatan}`, alamat);
      return { ok: true, data: { id } };
    },

    // DPIA
    async daftarDpia(p: Pelaku, h: number, u: number): Promise<HalamanPdp<DpiaDto>> {
      const r = await repo.daftarDpia(p.fasyankes_id, h, u);
      const hariIni = awalHariWib(sekarang());
      return halaman(r.baris.map((b): DpiaDto => ({
        id: b.id, pemrosesan: b.pemrosesan, ropa_id: b.ropa_id, ropa_nama: b.ropa_id ? r.ropa.get(b.ropa_id) ?? null : null, risiko: b.risiko, mitigasi: b.mitigasi, saran_ppdp: b.saran_ppdp, tinjau_ulang_pada: tgl(b.tinjau_ulang_pada),
        ditinjau_pada: iso(b.ditinjau_pada), jatuh_tempo: b.tinjau_ulang_pada.getTime() < hariIni.getTime(), diperbarui_pada: b.diperbarui_pada.toISOString(),
      })), h, u, r.total);
    },
    async simpanDpia(p: Pelaku, id: number | null, m: DpiaMasukan, alamat?: string): Promise<Hasil<{ id: number }>> {
      if (m.ropa_id && !(await repo.ropaAda(p.fasyankes_id, m.ropa_id))) return gagal('tidak_valid', G.ropaTidakAda, 'ropa_id');
      if (id === null) {
        const baru = await repo.buatDpia(p.fasyankes_id, m, p.id, sekarang());
        await catat(p, 'input', 'dpia', baru, `DPIA: ${m.pemrosesan}`, alamat);
        return { ok: true, data: { id: baru } };
      }
      if (!(await repo.ubahDpia(p.fasyankes_id, id, m, sekarang()))) return gagal('tidak_ditemukan', G.dpiaTidakAda);
      await catat(p, 'perbaikan', 'dpia', id, `Ubah DPIA: ${m.pemrosesan}`, alamat);
      return { ok: true, data: { id } };
    },

    // Insiden
    async daftarInsiden(p: Pelaku, h: number, u: number): Promise<HalamanPdp<InsidenDto>> {
      const r = await repo.daftarInsiden(p.fasyankes_id, h, u);
      return halaman(await dtoInsiden(p, r), h, u, r.total);
    },
    async simpanInsiden(p: Pelaku, id: number | null, m: InsidenMasukan, alamat?: string): Promise<Hasil<InsidenDto>> {
      const ada = await repo.pasienBanyak(p.fasyankes_id, m.pasien_ids);
      if (ada.size !== new Set(m.pasien_ids).size) return gagal('tidak_valid', G.pasienTidakAda, 'pasien_ids');
      if (id === null) {
        const baru = await repo.buatInsiden(p.fasyankes_id, m, p.id, waktuDariIsian);
        await catat(p, 'input', 'insiden', baru, `Insiden ${m.siber ? 'siber' : 'data'}: ${m.pasien_ids.length} pasien terdampak`, alamat);
        return ambilInsiden(p, baru);
      }
      if (!(await repo.ubahInsiden(p.fasyankes_id, id, m, waktuDariIsian, sekarang()))) return gagal('tidak_ditemukan', G.insidenTidakAda);
      await catat(p, 'perbaikan', 'insiden', id, `Ubah insiden ${id}`, alamat);
      return ambilInsiden(p, id);
    },

    // Retensi dan pemusnahan
    async kebijakan(p: Pelaku): Promise<KebijakanRetensiDto[]> {
      return (await repo.kebijakan(p.fasyankes_id)).map((k) => ({ id: k.id, jenis_data: k.jenis_data, periode_tahun: k.periode_tahun, dasar_hukum: k.dasar_hukum, metode_musnah: k.metode_musnah, penanggung_jawab: k.penanggung_jawab }));
    },
    async daftarMusnah(p: Pelaku, h: number, u: number): Promise<HalamanPdp<PemusnahanDto>> {
      const r = await repo.daftarMusnah(p.fasyankes_id, h, u);
      return halaman(await dtoMusnah(p, r.baris), h, u, r.total);
    },
    async rencanaMusnah(p: Pelaku, m: PemusnahanMasukan, alamat?: string): Promise<Hasil<PemusnahanDto>> {
      if (m.pasien_id && !(await repo.pasien(p.fasyankes_id, m.pasien_id))) return gagal('tidak_ditemukan', G.pasienTidakAda);
      if (m.permintaan_hak_id && !(await repo.hakAda(p.fasyankes_id, m.permintaan_hak_id))) return gagal('tidak_ditemukan', G.hakTerkaitTidakAda);
      const id = await repo.buatMusnah(p.fasyankes_id, m, p.id);
      await catat(p, 'input', 'pemusnahan', id, `Rencana pemusnahan: ${m.cakupan}`, alamat);
      return ambilMusnah(p, id);
    },
    async prosesMusnah(p: Pelaku, id: number, m: ProsesPemusnahanMasukan, alamat?: string): Promise<Hasil<PemusnahanDto>> {
      const b = await repo.musnah(p.fasyankes_id, id);
      if (!b) return gagal('tidak_ditemukan', G.musnahTidakAda);
      if (tahapMusnahBerikut(b.status as StatusMusnah) !== m.tahap) return gagal('konflik', G.tahapTidakSah);
      const now = sekarang();
      try {
        if (m.tahap === 'perintah') {
          if (!(await repo.prosesorAktif(p.fasyankes_id)).some((x) => x.id === m.prosesor_id)) return gagal('tidak_valid', G.prosesorTidakSah, 'prosesor_id');
          await repo.majuMusnah(p.fasyankes_id, id, 'direncanakan', 'diperintahkan', { prosesor_id: m.prosesor_id, nomor_perintah: m.nomor_perintah, perintah_pada: now });
        } else if (m.tahap === 'pelaksanaan') {
          if (!m.mencakup_cadangan) return gagal('tidak_valid', G.cadanganWajib, 'mencakup_cadangan');
          await repo.majuMusnah(p.fasyankes_id, id, 'diperintahkan', 'dilaksanakan', { pelaksana: m.pelaksana, metode: m.metode, mencakup_cadangan: true, pelaksanaan_pada: m.pelaksanaan_pada ? waktuDariIsian(m.pelaksanaan_pada) : now });
        } else {
          await repo.majuMusnah(p.fasyankes_id, id, 'dilaksanakan', 'selesai', { berita_acara: m.berita_acara, berita_acara_pada: now });
        }
      } catch (e) {
        const g = bentrok(e);
        if (g) return g;
        throw e;
      }
      await catat(p, 'perbaikan', 'pemusnahan', id, `Pemusnahan ${id}: tahap ${m.tahap}`, alamat);
      return ambilMusnah(p, id);
    },

    // Prosesor
    async daftarProsesor(p: Pelaku, h: number, u: number): Promise<HalamanPdp<ProsesorDto>> {
      const r = await repo.daftarProsesor(p.fasyankes_id, h, u);
      return halaman(r.baris.map(dtoProsesor), h, u, r.total);
    },
    opsiProsesor: (p: Pelaku) => repo.prosesorAktif(p.fasyankes_id),
    async simpanProsesor(p: Pelaku, id: number | null, m: ProsesorMasukan, alamat?: string): Promise<Hasil<{ id: number }>> {
      if (id === null) {
        const baru = await repo.buatProsesor(p.fasyankes_id, m, p.id);
        await catat(p, 'input', 'prosesor', baru, `Prosesor: ${m.nama}`, alamat);
        return { ok: true, data: { id: baru } };
      }
      if (!(await repo.ubahProsesor(p.fasyankes_id, id, m))) return gagal('tidak_ditemukan', G.prosesorTidakAda);
      await catat(p, 'perbaikan', 'prosesor', id, `Ubah prosesor: ${m.nama}`, alamat);
      return { ok: true, data: { id } };
    },
  };
}
export type LayananPdp = ReturnType<typeof buatLayananPdp>;
