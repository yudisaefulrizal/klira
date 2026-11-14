import { mulaiAntreanDalam, selesaiAntreanDalam } from '../../kunjungan/domain/antrean-otomatis.js';
import * as db from '@klira/db';
import { BAGIAN_KLINIS, hargaTarif, rentangHariWib, teksRujukan } from '@klira/shared';
import { tambahItemTagihanDalam, totalTagihan } from '../../kasir/data-access/repositori.js';
import { tulisAddendumDalam } from '../../rekam-medis/data-access/repositori-addendum.js';
import { tulisPengesahanDalam } from '../../rekam-medis/data-access/repositori.js';
import { susunIsiHasil } from '../domain/isi.js';
/** Penulisan serempak berebut status atau versi yang sama: pemanggil diminta memuat ulang. */
export class BentrokError extends Error {
    constructor() {
        super('bentrok penunjang');
    }
}
const iso = (d) => d.toISOString();
const tarifDto = (t) => ({ id: t.id, kode: t.kode, nama: t.nama, harga_umum: t.harga_umum, harga_jkn: t.harga_jkn });
async function petakanMaster(fasyankesId, baris, koneksi = db.pool) {
    const tarifIds = [...new Set(baris.flatMap((b) => (b.tarif_layanan_id ? [b.tarif_layanan_id] : [])))];
    const tarif = tarifIds.length ? await db.daftarTarifLayananUntukPetakanMaster(tarifIds, fasyankesId, koneksi) : [];
    const peta = new Map(tarif.map((t) => [t.id, tarifDto(t)]));
    return baris.map((b) => ({
        id: b.id, kode: b.kode, nama: b.nama, kode_loinc: b.kode_loinc, jenis_spesimen: b.jenis_spesimen, satuan: b.satuan, rujukan_min: b.rujukan_min,
        rujukan_maks: b.rujukan_maks, rujukan_teks: b.rujukan_teks, aktif: b.aktif, tarif: b.tarif_layanan_id ? peta.get(b.tarif_layanan_id) ?? null : null, tarif_layanan_id: b.tarif_layanan_id,
    }));
}
const keMasterDto = (m) => ({
    id: m.id, kode: m.kode, nama: m.nama, kode_loinc: m.kode_loinc, jenis_spesimen: m.jenis_spesimen, satuan: m.satuan, rujukan_min: m.rujukan_min,
    rujukan_maks: m.rujukan_maks, rujukan_teks: m.rujukan_teks, aktif: m.aktif, tarif: m.tarif,
});
export class RepositoriPenunjangMysql {
    async kunjungan(fasyankesId, id) {
        return db.cariKunjunganUntukKunjungan5(id, fasyankesId);
    }
    async bagianDisahkan(fasyankesId, kunjunganId) {
        const p = await db.daftarPengesahanCatatanUntukBagianDisahkan(fasyankesId, kunjunganId, [...BAGIAN_KLINIS]);
        return p.map((x) => x.entitas);
    }
    async masterAktifDari(fasyankesId, ids) {
        return petakanMaster(fasyankesId, await db.daftarMasterPemeriksaanUntukMasterAktifDari(fasyankesId, true, 'lab', [...ids]));
    }
    async buatOrder(d) {
        const tarif = await db.daftarTarifLayananUntukBuatOrder(d.fasyankesId, true, 'lab', d.master.flatMap((m) => (m.tarif_layanan_id ? [m.tarif_layanan_id] : [])));
        const tarifPer = new Map(tarif.map((t) => [t.id, t]));
        return db.transaksi(async (tx) => {
            const item = [];
            const orderIds = [];
            for (const m of d.master) {
                const o = await (async () => { const _hasil = await db.tambahOrderPenunjangUntukBuatOrder(d.fasyankesId, d.kunjungan.id, d.kunjungan.pasien_id, 'lab', m.id, m.kode_loinc, m.nama, d.prioritas, d.catatan, d.oleh, tx); return db.tambahOrderPenunjangUntukBuatOrderHasil(_hasil.id, tx); })();
                orderIds.push(o.id);
                const t = m.tarif_layanan_id ? tarifPer.get(m.tarif_layanan_id) ?? null : null;
                item.push({ jenis: 'lab', tarifId: t?.id ?? null, kode: t?.kode ?? m.kode, nama: m.nama, harga: hargaTarif(t, d.kunjungan.cara_pembayaran), orderPenunjangId: o.id });
            }
            const tagihanId = await tambahItemTagihanDalam(tx, d.fasyankesId, d.kunjungan.id, d.oleh, item);
            const t = await db.wajibTagihanUntukBuatOrder(tagihanId, tx);
            return { orderIds, tagihan: { status_tagihan: t.status_tagihan, status_pembayaran: t.status_pembayaran, total: totalTagihan(t.item) } };
        });
    }
    async petakanOrder(fasyankesId, baris) {
        const ids = new Set();
        for (const b of baris) {
            if (b.dibuat_oleh)
                ids.add(b.dibuat_oleh);
            if (b.spesimen)
                ids.add(b.spesimen.petugas_id);
            if (b.hasil) {
                ids.add(b.hasil.dientri_oleh);
                if (b.hasil.validator_id)
                    ids.add(b.hasil.validator_id);
            }
        }
        const pengguna = ids.size ? await db.daftarPenggunaUntukRiwayat([...ids], fasyankesId) : [];
        const nama = new Map(pengguna.map((p) => [p.id, p.nama]));
        return baris.map((b) => ({
            id: b.id, kunjungan_id: b.kunjungan_id, pasien_id: b.pasien_id, nama: b.nama, kode_loinc: b.kode_loinc, prioritas: b.prioritas, catatan: b.catatan, status: b.status,
            dibuat_pada: b.dibuat_pada, dibuat_oleh_nama: b.dibuat_oleh ? nama.get(b.dibuat_oleh) ?? null : null,
            master: b.master && {
                satuan: b.master.satuan, rujukan_teks: teksRujukan(b.master), rujukan_min: b.master.rujukan_min, rujukan_maks: b.master.rujukan_maks, jenis_spesimen: b.master.jenis_spesimen,
            },
            spesimen: b.spesimen && { asal: b.spesimen.asal, waktu_ambil: b.spesimen.waktu_ambil, petugas_id: b.spesimen.petugas_id, petugas_nama: nama.get(b.spesimen.petugas_id) ?? '-' },
            hasil: b.hasil && {
                nilai: b.hasil.nilai, satuan: b.hasil.satuan, rujukan_teks: b.hasil.rujukan_teks, interpretasi: b.hasil.interpretasi, catatan: b.hasil.catatan,
                dientri_oleh: nama.get(b.hasil.dientri_oleh) ?? '-', dientri_pada: b.hasil.dientri_pada, validator_nama: b.hasil.validator_id ? nama.get(b.hasil.validator_id) ?? null : null,
                divalidasi_pada: b.hasil.divalidasi_pada,
            },
        }));
    }
    async order(fasyankesId, id) {
        const o = await db.cariOrderPenunjangUntukOrder(id, fasyankesId);
        return o ? (await this.petakanOrder(fasyankesId, [o]))[0] : null;
    }
    async ordersKunjungan(fasyankesId, kunjunganId) {
        return this.petakanOrder(fasyankesId, await db.daftarOrderPenunjangUntukOrdersKunjungan(fasyankesId, kunjunganId));
    }
    async penggunaAda(fasyankesId, id) {
        return (await db.hitungPenggunaUntukPenggunaAda3(id, fasyankesId, true)) > 0;
    }
    async catatSpesimen(d) {
        return db.transaksi(async (tx) => {
            const u = await db.ubahOrderPenunjangUntukCatatSpesimen('spesimen_diambil', d.orderId, d.fasyankesId, 'dipesan', tx);
            if (u.count === 0)
                return false;
            await db.tambahSpesimenUntukCatatSpesimen(d.fasyankesId, d.orderId, d.asal, d.waktuAmbil, d.petugasId, d.oleh, tx);
            // Penunjang saja: spesimen pertama memulai antrean; setelah semua spesimen diambil kunjungan maju ke kasir dan antrean selesai.
            if (d.kunjunganId) {
                const k = await db.cariKunjunganUntukKunjungan5(d.kunjunganId, d.fasyankesId, tx);
                if (k?.jenis === 'LAB') {
                    await mulaiAntreanDalam(tx, d.fasyankesId, d.kunjunganId, d.waktuAmbil);
                    if ((await db.hitungOrderBelumSpesimenUntukKunjungan(d.fasyankesId, d.kunjunganId, tx)) === 0) {
                        await db.ubahKunjunganUntukUbahTahap('kasir', d.kunjunganId, d.fasyankesId, 'pemeriksaan', tx);
                        await selesaiAntreanDalam(tx, d.fasyankesId, d.kunjunganId, d.waktuAmbil);
                    }
                }
            }
            return true;
        });
    }
    async simpanHasil(d) {
        return db.transaksi(async (tx) => {
            const u = await db.ubahOrderPenunjangUntukSimpanHasil('menunggu_hasil', d.orderId, d.fasyankesId, ['spesimen_diambil', 'menunggu_hasil'], tx);
            if (u.count === 0)
                return false;
            await db.simpanHasilPenunjangUntukSimpanHasil(d.fasyankesId, d.orderId, d.nilai, d.satuan, d.rujukanTeks, d.interpretasi, d.catatan, d.oleh, d.waktu, tx);
            return true;
        });
    }
    async validasi(d) {
        try {
            return await db.transaksi(async (tx) => {
                const u = await db.ubahOrderPenunjangUntukCatatSpesimen('divalidasi', d.orderId, d.fasyankesId, 'menunggu_hasil', tx);
                if (u.count === 0)
                    return false;
                const o = await db.wajibOrderPenunjangUntukValidasi(d.orderId, tx);
                const h = o.hasil;
                if (!h)
                    throw new BentrokError();
                await db.ubahHasilPenunjangUntukValidasi(d.oleh, d.waktu, d.orderId, tx);
                await tulisPengesahanDalam(tx, { ...d.pengesahan, fasyankesId: d.fasyankesId, entitas: 'hasil_penunjang', entitasId: d.orderId });
                if (d.addendum) {
                    await tulisAddendumDalam(tx, {
                        fasyankesId: d.fasyankesId, kunjunganId: d.kunjunganId, entitas: 'hasil_penunjang', entitasId: d.orderId, alasan: d.addendum.alasan, oleh: d.oleh,
                        jenisAkun: d.pengesahan.jenisAkun, waktu: d.waktu,
                        isi: susunIsiHasil({ order_id: o.id, nama: o.nama, kode_loinc: o.kode_loinc, nilai: h.nilai, satuan: h.satuan, rujukan_teks: h.rujukan_teks, interpretasi: h.interpretasi, catatan: h.catatan }),
                    });
                }
                return true;
            });
        }
        catch (e) {
            if ((db.bentrokUnik(e) || db.transaksiBisaDiulang(e)))
                throw new BentrokError();
            throw e;
        }
    }
    async isiHasil(fasyankesId, orderId) {
        const o = await db.cariOrderPenunjangUntukIsiHasil(orderId, fasyankesId);
        if (!o?.hasil)
            return null;
        const h = o.hasil;
        return susunIsiHasil({ order_id: o.id, nama: o.nama, kode_loinc: o.kode_loinc, nilai: h.nilai, satuan: h.satuan, rujukan_teks: h.rujukan_teks, interpretasi: h.interpretasi, catatan: h.catatan });
    }
    async rekap(fasyankesId, f) {
        const { awal, akhir } = rentangHariWib(f.dari, f.sampai);
        const [total, baris, g] = await Promise.all([
            db.hitungOrderPenunjangUntukRekap(fasyankesId, ((awal || akhir) && (awal)) ? (awal) : undefined, ((awal || akhir) && (akhir)) ? (akhir) : undefined, (f.status) ? (f.status) : undefined),
            db.daftarOrderPenunjangUntukRekap(fasyankesId, ((awal || akhir) && (awal)) ? (awal) : undefined, ((awal || akhir) && (akhir)) ? (akhir) : undefined, (f.status) ? (f.status) : undefined, f.ukuran, (f.halaman - 1) * f.ukuran),
            db.kelompokOrderPenunjangUntukRekap(fasyankesId, ((awal || akhir) && (awal)) ? (awal) : undefined, ((awal || akhir) && (akhir)) ? (akhir) : undefined),
        ]);
        const pasienIds = [...new Set(baris.map((b) => b.pasien_id))];
        const pasien = pasienIds.length ? await db.daftarPasienUntukRekap(pasienIds, fasyankesId) : [];
        const peta = new Map(pasien.map((p) => [p.id, p]));
        const jumlah = { dipesan: 0, spesimen_diambil: 0, menunggu_hasil: 0, divalidasi: 0 };
        for (const r of g)
            jumlah[r.status] = r._count._all;
        return {
            data: baris.map((b) => ({
                id: b.id, kunjungan_id: b.kunjungan_id, pasien_nama: peta.get(b.pasien_id)?.nama ?? '-', pasien_nomor_rm: peta.get(b.pasien_id)?.nomor_rm ?? '-', nama: b.nama,
                prioritas: b.prioritas, status: b.status, dibuat_pada: iso(b.dibuat_pada),
                hasil_singkat: b.hasil ? `${b.hasil.nilai}${b.hasil.satuan ? ` ${b.hasil.satuan}` : ''}` : null, interpretasi: b.hasil ? b.hasil.interpretasi : null,
            })),
            halaman: f.halaman, ukuran: f.ukuran, total, jumlah_status: jumlah,
        };
    }
    async daftarMaster(fasyankesId, f) {
        return (await petakanMaster(fasyankesId, await db.daftarMasterPemeriksaanUntukDaftarMaster(fasyankesId, 'lab', (f.aktif !== undefined) ? (f.aktif) : undefined, f.cari, f.cari, f.cari, 500))).map(keMasterDto);
    }
    async master(fasyankesId, id) {
        const m = await db.cariMasterPemeriksaanUntukMaster(id, fasyankesId);
        return m ? keMasterDto((await petakanMaster(fasyankesId, [m]))[0]) : null;
    }
    async tarifLab(fasyankesId) {
        return (await db.daftarTarifLayananUntukOpsi(fasyankesId, 'lab', true, 500)).map(tarifDto);
    }
    async tarifLabSah(fasyankesId, id) {
        return (await db.hitungTarifLayananUntukTarifKamarSah(id, fasyankesId, 'lab', true)) > 0;
    }
    /**
     * Memastikan tarif lab untuk pemeriksaan: memperbarui tarif yang sudah tertaut, atau memakai/membuat tarif berkode sama dengan pemeriksaan.
     * 'bentrok' bila kode itu sudah dipakai tarif jenis lain. Dipanggil dalam transaksi yang sama dengan penyimpanan master.
     */
    async pastikanTarif(tx, fasyankesId, oleh, p) {
        if (p.tarifId) {
            const diubah = await db.ubahTarifLayananUntukPastikanTarif(p.harga_umum, (p.harga_jkn !== undefined) ? (p.harga_jkn) : (undefined), true, p.tarifId, fasyankesId, 'lab', tx);
            if (diubah.count)
                return p.tarifId;
        }
        const ada = await db.ambilTarifLayananUntukPastikanTarif(fasyankesId, p.kode, tx);
        if (ada) {
            if (ada.jenis !== 'lab')
                return 'bentrok';
            await db.ubahTarifLayananUntukPastikanTarif2(p.harga_umum, (p.harga_jkn !== undefined) ? (p.harga_jkn) : (undefined), true, ada.id, tx);
            return ada.id;
        }
        return (await (async () => { const _hasil = await db.tambahTarifLayananUntukPastikanTarif(fasyankesId, p.kode, p.nama, 'lab', p.harga_umum, p.harga_jkn ?? null, oleh, tx); return db.tambahTarifLayananUntukBuatHasil(_hasil.id, tx); })()).id;
    }
    async buatMaster(fasyankesId, oleh, d) {
        const { harga_umum, harga_jkn, ...dasar } = d;
        try {
            return await db.transaksi(async (tx) => {
                let tarifId = dasar.tarif_layanan_id ?? null;
                if (harga_umum !== null && harga_umum !== undefined) {
                    const t = await this.pastikanTarif(tx, fasyankesId, oleh, { kode: dasar.kode, nama: dasar.nama, harga_umum, harga_jkn, tarifId });
                    if (t === 'bentrok')
                        return 'tarif_bentrok';
                    tarifId = t;
                }
                const m = await (async () => { const _hasil = await db.tambahMasterPemeriksaanUntukBuatMaster(fasyankesId, (dasar)?.kode, (dasar)?.nama, 'lab', (dasar)?.kode_loinc, (dasar)?.jenis_spesimen, (dasar)?.satuan, (dasar)?.rujukan_min, (dasar)?.rujukan_maks, (dasar)?.rujukan_teks, tarifId, (dasar)?.aktif, oleh, tx); return db.tambahMasterPemeriksaanUntukBuatMasterHasil(_hasil.id, tx); })();
                return keMasterDto((await petakanMaster(fasyankesId, [m], tx))[0]);
            });
        }
        catch (e) {
            if (db.bentrokUnik(e))
                return null;
            throw e;
        }
    }
    async ubahMaster(fasyankesId, id, d) {
        const ada = await db.cariMasterPemeriksaanUntukMaster(id, fasyankesId);
        if (!ada)
            return null;
        const { harga_umum, harga_jkn, ...dasar } = d;
        try {
            return await db.transaksi(async (tx) => {
                let tarifLink = dasar.tarif_layanan_id !== undefined ? dasar.tarif_layanan_id : ada.tarif_layanan_id;
                if (harga_umum !== null && harga_umum !== undefined) {
                    const t = await this.pastikanTarif(tx, fasyankesId, ada.dibuat_oleh ?? 0, { kode: dasar.kode ?? ada.kode, nama: dasar.nama ?? ada.nama, harga_umum, harga_jkn, tarifId: tarifLink ?? null });
                    if (t === 'bentrok')
                        return 'tarif_bentrok';
                    tarifLink = t;
                }
                const m = await (async () => { (await db.ubahMasterPemeriksaanUntukUbahMaster((dasar)?.kode, (dasar)?.nama, (dasar)?.kode_loinc, (dasar)?.jenis_spesimen, (dasar)?.satuan, (dasar)?.rujukan_min, (dasar)?.rujukan_maks, (dasar)?.rujukan_teks, tarifLink, (dasar)?.aktif, new Date(), id, tx)); return db.tambahMasterPemeriksaanUntukBuatMasterHasil(id, tx); })();
                return keMasterDto((await petakanMaster(fasyankesId, [m], tx))[0]);
            });
        }
        catch (e) {
            if (db.bentrokUnik(e))
                throw new BentrokError();
            throw e;
        }
    }
}
