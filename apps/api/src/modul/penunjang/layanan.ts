import { ADDENDUM_TEKS, bolehAksiOrder, hasilJadiAddendum, PENUNJANG } from '@klira/shared';
import type {
  FilterMasterPemeriksaan, FilterRekapLab, HasilBuatOrderDto, HasilMasukan, MasterPemeriksaanDto, MasterPemeriksaanMasukan, OrderLabMasukan, OrderPenunjangDto, PenggunaSaya, RekapLabDto, SpesimenMasukan,
  TarifLabDto, UbahMasterPemeriksaanMasukan,
} from '@klira/shared';
import type { PenampungAudit } from '../../middleware/audit';
import { gagal } from '../hasil';
import type { Hasil } from '../hasil';
import { keDto as keDtoPengesahan } from '../rekam-medis/layanan';
import type { LayananPengesahan } from '../rekam-medis/layanan';
import type { LayananAddendum } from '../rekam-medis/layanan-addendum';
import { susunIsiHasil } from './isi';
import { BentrokError } from './repositori';
import type { OrderBaris, RepositoriPenunjang } from './repositori';

export type DependensiPenunjang = {
  repo: RepositoriPenunjang;
  audit: PenampungAudit;
  pengesahan: LayananPengesahan;
  addendum: Pick<LayananAddendum, 'untukEntitas'>;
  sekarang?: () => Date;
};
type Pelaku = Pick<PenggunaSaya, 'id' | 'fasyankes_id'>;

export const ENTITAS_HASIL = 'hasil_penunjang';

export function buatLayananPenunjang({ repo, audit, pengesahan, addendum, sekarang = () => new Date() }: DependensiPenunjang) {
  // Isi hasil sekarang untuk deteksi perubahan setelah divalidasi: entitas = hasil_penunjang, entitas_id = id order.
  pengesahan.daftarkanPenyedia(ENTITAS_HASIL, (fas, id) => repo.isiHasil(fas, id));

  async function ordersDto(fasyankesId: number, baris: OrderBaris[]): Promise<OrderPenunjangDto[]> {
    const divalidasi = baris.filter((b) => b.status === 'divalidasi').map((b) => b.id);
    const [keadaan, susulan] = await Promise.all([
      Promise.all(baris.map((b) => (b.status === 'divalidasi' ? pengesahan.keadaan(fasyankesId, ENTITAS_HASIL, b.id) : Promise.resolve(null)))),
      addendum.untukEntitas(fasyankesId, ENTITAS_HASIL, divalidasi),
    ]);
    return baris.map((b, i) => ({
      id: b.id, kunjungan_id: b.kunjungan_id, pasien_id: b.pasien_id, nama: b.nama, kode_loinc: b.kode_loinc, prioritas: b.prioritas, catatan: b.catatan, status: b.status,
      dibuat_pada: b.dibuat_pada.toISOString(), dibuat_oleh_nama: b.dibuat_oleh_nama, satuan: b.master?.satuan ?? null, rujukan_teks: b.master?.rujukan_teks ?? null,
      rujukan_min: b.master?.rujukan_min ?? null, rujukan_maks: b.master?.rujukan_maks ?? null, jenis_spesimen: b.master?.jenis_spesimen ?? null,
      spesimen: b.spesimen && { asal: b.spesimen.asal, waktu_ambil: b.spesimen.waktu_ambil.toISOString(), petugas_id: b.spesimen.petugas_id, petugas_nama: b.spesimen.petugas_nama },
      hasil: b.hasil && {
        nilai: b.hasil.nilai, satuan: b.hasil.satuan, rujukan_teks: b.hasil.rujukan_teks, interpretasi: b.hasil.interpretasi, catatan: b.hasil.catatan, dientri_oleh: b.hasil.dientri_oleh,
        dientri_pada: b.hasil.dientri_pada.toISOString(), validator_nama: b.hasil.validator_nama, divalidasi_pada: b.hasil.divalidasi_pada?.toISOString() ?? null,
      },
      pengesahan: keadaan[i]?.pengesahan ? keDtoPengesahan(keadaan[i]!.pengesahan!) : null,
      verifikasi: keadaan[i]?.status ?? 'belum_disahkan',
      addendum: susulan.filter((a) => a.entitas_id === b.id),
    }));
  }

  const lihat = (p: Pelaku, id: number | null, keterangan: string, alamat?: string) =>
    audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'lihat', entitas: 'order_penunjang', entitas_id: id, keterangan, alamat });

  /** Muat order dan periksa aksi yang diminta; satu tempat untuk pesan galat bersama. */
  async function ambilUntukAksi(p: Pelaku, orderId: number, aksi: 'spesimen' | 'hasil' | 'validasi'): Promise<Hasil<OrderBaris>> {
    const o = await repo.order(p.fasyankes_id, orderId);
    if (!o) return gagal('tidak_ditemukan', PENUNJANG.galat.orderTidakAda);
    if (!bolehAksiOrder(o.status, aksi)) return gagal('konflik', o.status === 'divalidasi' ? PENUNJANG.galat.sudahValidasi : PENUNJANG.galat.statusTidakSah);
    return { ok: true, data: o };
  }

  return {
    /** Order lab (dokter): satu baris per pemeriksaan; item tagihan dibuat dari tarif saat order (4.3, 7). Kunjungan yang sudah ditutup ditolak. */
    async buatOrder(p: Pelaku, kunjunganId: number, m: OrderLabMasukan, alamat?: string): Promise<Hasil<HasilBuatOrderDto>> {
      const k = await repo.kunjungan(p.fasyankes_id, kunjunganId);
      if (!k) return gagal('tidak_ditemukan', PENUNJANG.galat.kunjunganTidakAda);
      if (k.tahap_layanan === 'ditutup') return gagal('konflik', PENUNJANG.galat.kunjunganDitutup);
      const master = await repo.masterAktifDari(p.fasyankes_id, m.pemeriksaan_ids);
      if (master.length !== m.pemeriksaan_ids.length) return gagal('tidak_valid', PENUNJANG.galat.pemeriksaanTidakAda, 'pemeriksaan_ids');
      const urut = m.pemeriksaan_ids.map((id) => master.find((x) => x.id === id)!);
      const { orderIds, tagihan } = await repo.buatOrder({ fasyankesId: p.fasyankes_id, kunjungan: k, oleh: p.id, master: urut, prioritas: m.prioritas, catatan: m.catatan });
      for (const id of orderIds) {
        await audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'input', entitas: 'order_penunjang', entitas_id: id, keterangan: `Order lab kunjungan ${kunjunganId} (${m.prioritas}), tagihan item dibuat`, alamat });
      }
      const baris = (await repo.ordersKunjungan(p.fasyankes_id, kunjunganId)).filter((o) => orderIds.includes(o.id));
      return { ok: true, data: { order: await ordersDto(p.fasyankes_id, baris), tagihan } };
    },

    /** Semua order kunjungan beserta spesimen, hasil, pengesahan, dan addendum; dicatat `lihat`. */
    async ordersKunjungan(p: Pelaku, kunjunganId: number, alamat?: string): Promise<Hasil<OrderPenunjangDto[]>> {
      if (!(await repo.kunjungan(p.fasyankes_id, kunjunganId))) return gagal('tidak_ditemukan', PENUNJANG.galat.kunjunganTidakAda);
      const baris = await repo.ordersKunjungan(p.fasyankes_id, kunjunganId);
      await lihat(p, kunjunganId, 'Membuka order penunjang kunjungan', alamat);
      return { ok: true, data: await ordersDto(p.fasyankes_id, baris) };
    },

    async order(p: Pelaku, orderId: number, alamat?: string): Promise<Hasil<OrderPenunjangDto>> {
      const o = await repo.order(p.fasyankes_id, orderId);
      if (!o) return gagal('tidak_ditemukan', PENUNJANG.galat.orderTidakAda);
      await lihat(p, orderId, 'Membuka order penunjang', alamat);
      return { ok: true, data: (await ordersDto(p.fasyankes_id, [o]))[0] };
    },

    /** Ambil spesimen (analis lab): dipesan menjadi spesimen diambil; petugas bawaan pengguna sendiri. */
    async ambilSpesimen(p: Pelaku, orderId: number, m: SpesimenMasukan, alamat?: string): Promise<Hasil<OrderPenunjangDto>> {
      const o = await ambilUntukAksi(p, orderId, 'spesimen');
      if (!o.ok) return o;
      const petugasId = m.petugas_id ?? p.id;
      if (!(await repo.penggunaAda(p.fasyankes_id, petugasId))) return gagal('tidak_valid', PENUNJANG.galat.petugasTidakSah, 'petugas_id');
      if (!(await repo.catatSpesimen({ fasyankesId: p.fasyankes_id, orderId, asal: m.asal, waktuAmbil: new Date(m.waktu_ambil), petugasId, oleh: p.id }))) return gagal('konflik', PENUNJANG.galat.statusTidakSah);
      await audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'input', entitas: 'spesimen', entitas_id: orderId, keterangan: 'Spesimen diambil', alamat });
      return { ok: true, data: (await ordersDto(p.fasyankes_id, [(await repo.order(p.fasyankes_id, orderId))!]))[0] };
    },

    /** Isi hasil dan interpretasi (boleh berulang sebelum validasi); status menjadi menunggu hasil. Satuan dan rujukan disalin dari master saat ini. */
    async isiHasil(p: Pelaku, orderId: number, m: HasilMasukan, alamat?: string): Promise<Hasil<OrderPenunjangDto>> {
      const o = await ambilUntukAksi(p, orderId, 'hasil');
      if (!o.ok) return o;
      const sumber = o.data.master;
      const ok = await repo.simpanHasil({
        fasyankesId: p.fasyankes_id, orderId, nilai: m.nilai, satuan: sumber?.satuan ?? null, rujukanTeks: sumber?.rujukan_teks ?? null,
        interpretasi: m.interpretasi, catatan: m.catatan, oleh: p.id, waktu: sekarang(),
      });
      if (!ok) return gagal('konflik', PENUNJANG.galat.statusTidakSah);
      await audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: o.data.status === 'menunggu_hasil' ? 'perbaikan' : 'input', entitas: 'hasil_penunjang', entitas_id: orderId, keterangan: 'Hasil lab diisi (belum divalidasi)', alamat });
      return { ok: true, data: (await ordersDto(p.fasyankes_id, [(await repo.order(p.fasyankes_id, orderId))!]))[0] };
    },

    /**
     * Validasi hasil (analis lab) = pengesahan catatan generik atas isi hasil. Bila catatan kunjungan sudah disahkan (7), hasil juga dicatat sebagai
     * addendum: baris addendum, versi catatan, dan pengesahan barunya ditulis dalam transaksi yang sama (tidak menimpa catatan lama), dengan penanda kirim ulang.
     */
    async validasi(p: Pelaku, orderId: number, alamat?: string): Promise<Hasil<OrderPenunjangDto>> {
      const o = await ambilUntukAksi(p, orderId, 'validasi');
      if (!o.ok) return o;
      const h = o.data.hasil;
      if (!h) return gagal('konflik', PENUNJANG.galat.hasilBelumAda);
      const isi = susunIsiHasil({ order_id: orderId, nama: o.data.nama, kode_loinc: o.data.kode_loinc, nilai: h.nilai, satuan: h.satuan, rujukan_teks: h.rujukan_teks, interpretasi: h.interpretasi, catatan: h.catatan });
      const rencana = await pengesahan.siapkan({
        fasyankesId: p.fasyankes_id, pelakuId: p.id, fitur: 'penunjang', entitas: ENTITAS_HASIL, entitasId: orderId, isiBaru: isi, bacaIsiSekarang: async () => isi,
      });
      if (!rencana.ok) return rencana;
      if (rencana.data.jenis === 'sama') return gagal('konflik', PENUNJANG.galat.sudahValidasi);
      const k = await repo.kunjungan(p.fasyankes_id, o.data.kunjungan_id);
      const jadiAddendum = !!k && hasilJadiAddendum({ tahap: k.tahap_layanan, bagianDisahkan: await repo.bagianDisahkan(p.fasyankes_id, k.id) });
      try {
        const ok = await repo.validasi({
          fasyankesId: p.fasyankes_id, orderId, kunjunganId: o.data.kunjungan_id, oleh: p.id, waktu: rencana.data.rencana.waktu, pengesahan: rencana.data.rencana,
          addendum: jadiAddendum ? { alasan: ADDENDUM_TEKS.alasanHasil(o.data.nama) } : null,
        });
        if (!ok) return gagal('konflik', PENUNJANG.galat.statusTidakSah);
      } catch (e) {
        if (e instanceof BentrokError) return gagal('konflik', PENUNJANG.galat.bentrok);
        throw e;
      }
      await audit.catat({
        fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'input', entitas: ENTITAS_HASIL, entitas_id: orderId,
        keterangan: `Validasi hasil lab${jadiAddendum ? ' (dicatat sebagai addendum, kirim ulang menunggu)' : ''}`, alamat,
      });
      return { ok: true, data: (await ordersDto(p.fasyankes_id, [(await repo.order(p.fasyankes_id, orderId))!]))[0] };
    },

    /** Rekap lab dengan filter status dan tanggal (data minimal; isi hasil dibuka lewat order dan tercatat). */
    rekap(p: Pelaku, f: FilterRekapLab): Promise<RekapLabDto> {
      return repo.rekap(p.fasyankes_id, f);
    },

    daftarMaster: (p: Pelaku, f: FilterMasterPemeriksaan): Promise<MasterPemeriksaanDto[]> => repo.daftarMaster(p.fasyankes_id, f),
    tarifLab: (p: Pelaku): Promise<TarifLabDto[]> => repo.tarifLab(p.fasyankes_id),

    async buatMaster(p: Pelaku, m: MasterPemeriksaanMasukan, alamat?: string): Promise<Hasil<MasterPemeriksaanDto>> {
      if (m.tarif_layanan_id && !(await repo.tarifLabSah(p.fasyankes_id, m.tarif_layanan_id))) return gagal('tidak_valid', PENUNJANG.galat.tarifTidakSah, 'tarif_layanan_id');
      const d = await repo.buatMaster(p.fasyankes_id, p.id, { ...m, kode: m.kode.trim() });
      if (!d) return gagal('konflik', PENUNJANG.galat.kodeGanda, 'kode');
      await audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'input', entitas: 'master_pemeriksaan', entitas_id: d.id, keterangan: `Master pemeriksaan ${d.kode} dibuat`, alamat });
      return { ok: true, data: d };
    },

    async ubahMaster(p: Pelaku, id: number, m: UbahMasterPemeriksaanMasukan, alamat?: string): Promise<Hasil<MasterPemeriksaanDto>> {
      if (m.tarif_layanan_id && !(await repo.tarifLabSah(p.fasyankes_id, m.tarif_layanan_id))) return gagal('tidak_valid', PENUNJANG.galat.tarifTidakSah, 'tarif_layanan_id');
      // Rentang dari data sekarang dibandingkan bila hanya satu sisi yang diubah.
      const sekarangDto = await repo.master(p.fasyankes_id, id);
      if (!sekarangDto) return gagal('tidak_ditemukan', PENUNJANG.galat.masterTidakAda);
      const min = m.rujukan_min !== undefined ? m.rujukan_min : sekarangDto.rujukan_min;
      const maks = m.rujukan_maks !== undefined ? m.rujukan_maks : sekarangDto.rujukan_maks;
      if (min !== null && maks !== null && min > maks) return gagal('tidak_valid', PENUNJANG.galat.rentang, 'rujukan_maks');
      let d: MasterPemeriksaanDto | null;
      try {
        d = await repo.ubahMaster(p.fasyankes_id, id, m.kode !== undefined ? { ...m, kode: m.kode.trim() } : m);
      } catch (e) {
        if (e instanceof BentrokError) return gagal('konflik', PENUNJANG.galat.kodeGanda, 'kode');
        throw e;
      }
      if (!d) return gagal('tidak_ditemukan', PENUNJANG.galat.masterTidakAda);
      await audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'perbaikan', entitas: 'master_pemeriksaan', entitas_id: id, keterangan: `Master pemeriksaan ${d.kode} diubah`, alamat });
      return { ok: true, data: d };
    },
  };
}

export type LayananPenunjang = ReturnType<typeof buatLayananPenunjang>;
