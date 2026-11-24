import { ADDENDUM_TEKS, bolehAksiOrder, hasilJadiAddendum, PENUNJANG, ringkasPerubahanHarga } from '@klira/shared';
import { gagal } from '../../../umum/hasil.js';
import { kabarkanLayarPanggilan } from '../../layar-panggilan/domain/kanal.js';
import { kabarkanNotifikasi } from '../../notifikasi/domain/kanal.js';
import { cariKatalogLoinc } from '../data-access/katalog-loinc.js';
import { keDto as keDtoPengesahan } from '../../rekam-medis/domain/layanan.js';
import { susunIsiHasil } from './isi.js';
import { BentrokError } from '../data-access/repositori.js';
export const ENTITAS_HASIL = 'hasil_penunjang';
export function buatLayananPenunjang({ repo, audit, pengesahan, addendum, sekarang = () => new Date() }) {
    // Isi hasil sekarang untuk deteksi perubahan setelah divalidasi: entitas = hasil_penunjang, entitas_id = id order.
    pengesahan.daftarkanPenyedia(ENTITAS_HASIL, (id) => repo.isiHasil(id));
    async function ordersDto(baris) {
        const divalidasi = baris.filter((b) => b.status === 'divalidasi').map((b) => b.id);
        const [keadaan, susulan] = await Promise.all([
            Promise.all(baris.map((b) => (b.status === 'divalidasi' ? pengesahan.keadaan(ENTITAS_HASIL, b.id) : Promise.resolve(null)))),
            addendum.untukEntitas(ENTITAS_HASIL, divalidasi),
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
            pengesahan: keadaan[i]?.pengesahan ? keDtoPengesahan(keadaan[i].pengesahan) : null,
            verifikasi: keadaan[i]?.status ?? 'belum_disahkan',
            addendum: susulan.filter((a) => a.entitas_id === b.id),
        }));
    }
    const lihat = (p, id, keterangan, alamat) => audit.catat({ pengguna_id: p.id, aksi: 'lihat', entitas: 'order_penunjang', entitas_id: id, keterangan, alamat });
    /** Muat order dan periksa aksi yang diminta; satu tempat untuk pesan galat bersama. */
    async function ambilUntukAksi(p, orderId, aksi) {
        const o = await repo.order(orderId);
        if (!o)
            return gagal('tidak_ditemukan', PENUNJANG.galat.orderTidakAda);
        if (!bolehAksiOrder(o.status, aksi))
            return gagal('konflik', o.status === 'divalidasi' ? PENUNJANG.galat.sudahValidasi : PENUNJANG.galat.statusTidakSah);
        return { ok: true, data: o };
    }
    return {
        /** Order lab (dokter): satu baris per pemeriksaan; item tagihan dibuat dari tarif saat order (4.3, 7). Kunjungan yang sudah ditutup ditolak. */
        async buatOrder(p, kunjunganId, m, alamat) {
            const k = await repo.kunjungan(kunjunganId);
            if (!k)
                return gagal('tidak_ditemukan', PENUNJANG.galat.kunjunganTidakAda);
            if (k.tahap_layanan === 'ditutup')
                return gagal('konflik', PENUNJANG.galat.kunjunganDitutup);
            const master = await repo.masterAktifDari(m.pemeriksaan_ids);
            if (master.length !== m.pemeriksaan_ids.length)
                return gagal('tidak_valid', PENUNJANG.galat.pemeriksaanTidakAda, 'pemeriksaan_ids');
            const urut = m.pemeriksaan_ids.map((id) => master.find((x) => x.id === id));
            const { orderIds, tagihan } = await repo.buatOrder({ kunjungan: k, oleh: p.id, master: urut, prioritas: m.prioritas, catatan: m.catatan });
            kabarkanLayarPanggilan();
            kabarkanNotifikasi({
                tipe: 'order_lab_baru',
                pelakuId: p.id,
                kunjunganId,
                jumlah: orderIds.length,
                prioritas: m.prioritas,
            });
            for (const id of orderIds) {
                await audit.catat({ pengguna_id: p.id, aksi: 'input', entitas: 'order_penunjang', entitas_id: id, keterangan: `Order lab kunjungan ${kunjunganId} (${m.prioritas}), tagihan item dibuat`, alamat });
            }
            const baris = (await repo.ordersKunjungan(kunjunganId)).filter((o) => orderIds.includes(o.id));
            return { ok: true, data: { order: await ordersDto(baris), tagihan } };
        },
        /** Semua order kunjungan beserta spesimen, hasil, pengesahan, dan addendum; dicatat `lihat`. */
        async ordersKunjungan(p, kunjunganId, alamat) {
            if (!(await repo.kunjungan(kunjunganId)))
                return gagal('tidak_ditemukan', PENUNJANG.galat.kunjunganTidakAda);
            const baris = await repo.ordersKunjungan(kunjunganId);
            await lihat(p, kunjunganId, 'Membuka order penunjang kunjungan', alamat);
            return { ok: true, data: await ordersDto(baris) };
        },
        async order(p, orderId, alamat) {
            const o = await repo.order(orderId);
            if (!o)
                return gagal('tidak_ditemukan', PENUNJANG.galat.orderTidakAda);
            await lihat(p, orderId, 'Membuka order penunjang', alamat);
            return { ok: true, data: (await ordersDto([o]))[0] };
        },
        /** Ambil spesimen (analis lab): dipesan menjadi spesimen diambil; petugas bawaan pengguna sendiri. */
        async ambilSpesimen(p, orderId, m, alamat) {
            const o = await ambilUntukAksi(p, orderId, 'spesimen');
            if (!o.ok)
                return o;
            const petugasId = m.petugas_id ?? p.id;
            if (!(await repo.penggunaAda(petugasId)))
                return gagal('tidak_valid', PENUNJANG.galat.petugasTidakSah, 'petugas_id');
            if (!(await repo.catatSpesimen({ orderId, asal: m.asal, waktuAmbil: new Date(m.waktu_ambil), petugasId, oleh: p.id, kunjunganId: o.data.kunjungan_id })))
                return gagal('konflik', PENUNJANG.galat.statusTidakSah);
            kabarkanLayarPanggilan();
            await audit.catat({ pengguna_id: p.id, aksi: 'input', entitas: 'spesimen', entitas_id: orderId, keterangan: 'Spesimen diambil', alamat });
            return { ok: true, data: (await ordersDto([(await repo.order(orderId))]))[0] };
        },
        /** Isi hasil dan interpretasi (boleh berulang sebelum validasi); status menjadi menunggu hasil. Satuan dan rujukan disalin dari master saat ini. */
        async isiHasil(p, orderId, m, alamat) {
            const o = await ambilUntukAksi(p, orderId, 'hasil');
            if (!o.ok)
                return o;
            const sumber = o.data.master;
            const ok = await repo.simpanHasil({
                orderId, nilai: m.nilai, satuan: sumber?.satuan ?? null, rujukanTeks: sumber?.rujukan_teks ?? null,
                interpretasi: m.interpretasi, catatan: m.catatan, oleh: p.id, waktu: sekarang(),
            });
            if (!ok)
                return gagal('konflik', PENUNJANG.galat.statusTidakSah);
            await audit.catat({ pengguna_id: p.id, aksi: o.data.status === 'menunggu_hasil' ? 'perbaikan' : 'input', entitas: 'hasil_penunjang', entitas_id: orderId, keterangan: 'Hasil lab diisi (belum divalidasi)', alamat });
            return { ok: true, data: (await ordersDto([(await repo.order(orderId))]))[0] };
        },
        /**
         * Validasi hasil (analis lab) = pengesahan catatan generik atas isi hasil. Bila catatan kunjungan sudah disahkan (7), hasil juga dicatat sebagai
         * addendum: baris addendum, versi catatan, dan pengesahan barunya ditulis dalam transaksi yang sama (tidak menimpa catatan lama), dengan penanda kirim ulang.
         */
        async validasi(p, orderId, alamat) {
            const o = await ambilUntukAksi(p, orderId, 'validasi');
            if (!o.ok)
                return o;
            const h = o.data.hasil;
            if (!h)
                return gagal('konflik', PENUNJANG.galat.hasilBelumAda);
            const isi = susunIsiHasil({ order_id: orderId, nama: o.data.nama, kode_loinc: o.data.kode_loinc, nilai: h.nilai, satuan: h.satuan, rujukan_teks: h.rujukan_teks, interpretasi: h.interpretasi, catatan: h.catatan });
            const rencana = await pengesahan.siapkan({
                pelakuId: p.id, fitur: 'penunjang', entitas: ENTITAS_HASIL, entitasId: orderId, isiBaru: isi, bacaIsiSekarang: async () => isi,
            });
            if (!rencana.ok)
                return rencana;
            if (rencana.data.jenis === 'sama')
                return gagal('konflik', PENUNJANG.galat.sudahValidasi);
            const k = await repo.kunjungan(o.data.kunjungan_id);
            const jadiAddendum = !!k && hasilJadiAddendum({ jenis: k.jenis, tahap: k.tahap_layanan, bagianDisahkan: await repo.bagianDisahkan(k.id) });
            try {
                const ok = await repo.validasi({
                    orderId, kunjunganId: o.data.kunjungan_id, oleh: p.id, waktu: rencana.data.rencana.waktu, pengesahan: rencana.data.rencana,
                    addendum: jadiAddendum ? { alasan: ADDENDUM_TEKS.alasanHasil(o.data.nama) } : null,
                });
                if (!ok)
                    return gagal('konflik', PENUNJANG.galat.statusTidakSah);
            }
            catch (e) {
                if (e instanceof BentrokError)
                    return gagal('konflik', PENUNJANG.galat.bentrok);
                throw e;
            }
            await audit.catat({
                pengguna_id: p.id, aksi: 'input', entitas: ENTITAS_HASIL, entitas_id: orderId,
                keterangan: `Validasi hasil lab${jadiAddendum ? ' (dicatat sebagai addendum, kirim ulang menunggu)' : ''}`, alamat,
            });
            const semuaOrder = await repo.ordersKunjungan?.(o.data.kunjungan_id);
            if (semuaOrder?.length && semuaOrder.every((x) => x.status === 'divalidasi')) {
                if (k?.jenis === 'LAB') {
                    kabarkanNotifikasi({ tipe: 'hasil_lab_kasir', pelakuId: p.id, kunjunganId: k.id });
                } else if (k) {
                    const dpjpId = (await repo.dpjpKunjungan?.(k.id)) ?? null;
                    kabarkanNotifikasi({ tipe: 'hasil_lab_selesai', pelakuId: p.id, dpjpId, kunjunganId: k.id });
                }
            }
            return { ok: true, data: (await ordersDto([(await repo.order(orderId))]))[0] };
        },
        /** Rekap lab dengan filter status dan tanggal (data minimal; isi hasil dibuka lewat order dan tercatat). */
        rekap(p, f) {
            return repo.rekap(f);
        },
        daftarMaster: (p, f) => repo.daftarMaster(f),
        cariLoinc: (f) => cariKatalogLoinc(f.cari, f.batas),
        tarifLab: (p) => repo.tarifLab(),
        async buatMaster(p, m, alamat) {
            if (m.tarif_layanan_id && !(await repo.tarifLabSah(m.tarif_layanan_id)))
                return gagal('tidak_valid', PENUNJANG.galat.tarifTidakSah, 'tarif_layanan_id');
            const d = await repo.buatMaster(p.id, { ...m, kode: m.kode.trim() });
            if (d === 'tarif_bentrok')
                return gagal('konflik', PENUNJANG.galat.tarifBentrok, 'kode');
            if (!d)
                return gagal('konflik', PENUNJANG.galat.kodeGanda, 'kode');
            await audit.catat({ pengguna_id: p.id, aksi: 'input', entitas: 'master_pemeriksaan', entitas_id: d.id, keterangan: `Master pemeriksaan ${d.kode} dibuat`, alamat });
            if (d.tarif && m.harga_umum !== null && m.harga_umum !== undefined) {
                await audit.catat({ pengguna_id: p.id, aksi: 'input', entitas: 'tarif_layanan', entitas_id: d.tarif.id, keterangan: `Tarif lab ${d.tarif.kode} ditetapkan lewat master pemeriksaan: ${ringkasPerubahanHarga([['harga umum', null, d.tarif.harga_umum], ['harga JKN', null, d.tarif.harga_jkn]])}`, alamat });
            }
            return { ok: true, data: d };
        },
        async ubahMaster(p, id, m, alamat) {
            if (m.tarif_layanan_id && !(await repo.tarifLabSah(m.tarif_layanan_id)))
                return gagal('tidak_valid', PENUNJANG.galat.tarifTidakSah, 'tarif_layanan_id');
            // Rentang dari data sekarang dibandingkan bila hanya satu sisi yang diubah.
            const sekarangDto = await repo.master(id);
            if (!sekarangDto)
                return gagal('tidak_ditemukan', PENUNJANG.galat.masterTidakAda);
            const min = m.rujukan_min !== undefined ? m.rujukan_min : sekarangDto.rujukan_min;
            const maks = m.rujukan_maks !== undefined ? m.rujukan_maks : sekarangDto.rujukan_maks;
            if (min !== null && maks !== null && min > maks)
                return gagal('tidak_valid', PENUNJANG.galat.rentang, 'rujukan_maks');
            let d;
            try {
                d = await repo.ubahMaster(id, m.kode !== undefined ? { ...m, kode: m.kode.trim() } : m);
            }
            catch (e) {
                if (e instanceof BentrokError)
                    return gagal('konflik', PENUNJANG.galat.kodeGanda, 'kode');
                throw e;
            }
            if (d === 'tarif_bentrok')
                return gagal('konflik', PENUNJANG.galat.tarifBentrok, 'kode');
            if (!d)
                return gagal('tidak_ditemukan', PENUNJANG.galat.masterTidakAda);
            await audit.catat({ pengguna_id: p.id, aksi: 'perbaikan', entitas: 'master_pemeriksaan', entitas_id: id, keterangan: `Master pemeriksaan ${d.kode} diubah`, alamat });
            const harga = d.tarif ? ringkasPerubahanHarga([['harga umum', sekarangDto.tarif?.harga_umum, d.tarif.harga_umum], ['harga JKN', sekarangDto.tarif?.harga_jkn, d.tarif.harga_jkn]]) : null;
            if (d.tarif && harga) {
                await audit.catat({ pengguna_id: p.id, aksi: 'perbaikan', entitas: 'tarif_layanan', entitas_id: d.tarif.id, keterangan: `Harga tarif lab ${d.tarif.kode} diubah lewat master pemeriksaan: ${harga}`, alamat });
            }
            return { ok: true, data: d };
        },
    };
}
