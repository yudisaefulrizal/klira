import * as db from '@klira/db';
import { statusStokDari } from '@klira/shared';
import { gantiItemObatResepDalam, totalTagihan } from '../../kasir/data-access/repositori.js';
import { ambilKatalogKfa, cariKatalogKfa } from './katalog-kfa.js';
/** Daftar item sama persis (urutan, obat, jumlah, aturan, bentuk, rute): item dan tagihan tidak perlu diganti. */
export const samaItemResep = (a, b) => a.length === b.length && a.every((x, n) => x.master_obat_id === b[n].master_obat_id && x.jumlah === b[n].jumlah && x.aturan_pakai === b[n].aturan_pakai && (x.bentuk ?? null) === (b[n].bentuk ?? null) && (x.rute ?? null) === (b[n].rute ?? null));
const tglIso = (d) => d.toISOString().slice(0, 10);
const awalHariUtc = () => new Date(`${tglIso(new Date())}T00:00:00.000Z`);
export class RepositoriFarmasiMysql {
    // ---- Serah terima obat ----
    /**
     * Serah terima semua resep siap kunjungan ini. Stok dikurangi per batch (kedaluwarsa terdekat lebih dulu, batch kedaluwarsa dilewati) dengan kunci baris,
     * dicatat sebagai mutasi keluar dan pengeluaran obat. Stok kurang hanya diteruskan bila diizinkan (peringatan); jumlah pengeluaran tetap sesuai resep.
     */
    async serahTerima(petugasId, kunjunganId, izinkan, alasan) {
        return db.transaksi(async (tx) => {
            // Kunci baris resep kunjungan sebagai pernyataan pertama agar dua penyerahan serempak tidak sama-sama membaca status siap.
            await db.kunciResepKunjungan(kunjunganId, tx);
            const k = await db.cariKunjunganUntukTahapSekarang(kunjunganId, tx);
            if (!k || k.tahap_layanan === 'ditutup')
                return { ok: false, sebab: 'tahap_salah' };
            const reseps = await db.daftarResepUntukSerahTerima(kunjunganId, tx);
            if (!reseps.length)
                return { ok: false, sebab: 'tidak_ada_resep' };
            if (reseps.some((r) => r.status === 'diajukan' || r.status === 'ditelaah'))
                return { ok: false, sebab: 'belum_siap' };
            const siap = reseps.filter((r) => r.status === 'siap');
            if (!siap.length)
                return { ok: false, sebab: 'sudah_diserahkan' };
            const alokasi = [];
            const terpakai = new Map();
            const hariIni = new Date(`${tglIso(new Date())}T00:00:00.000Z`);
            for (const r of siap) {
                for (const i of r.item) {
                    const stok = await db.kunciStokObatTersedia(i.master_obat_id, hariIni, tx);
                    let sisa = i.jumlah;
                    const ambil = [];
                    for (const s of stok) {
                        const tersedia = s.jumlah - (terpakai.get(s.id) ?? 0);
                        if (sisa <= 0 || tersedia <= 0)
                            continue;
                        const a = Math.min(tersedia, sisa);
                        ambil.push({ stokId: s.id, jumlah: a });
                        terpakai.set(s.id, (terpakai.get(s.id) ?? 0) + a);
                        sisa -= a;
                    }
                    alokasi.push({ resepId: r.id, itemId: i.id, masterId: i.master_obat_id, harga: i.master.harga, butuh: i.jumlah, ambil, kurang: sisa, nama: i.master.nama_tampil, nomor: r.nomor_resep });
                }
            }
            const kekurangan = alokasi.filter((a) => a.kurang > 0).map((a) => ({ master_obat_id: a.masterId, nama: a.nama, butuh: a.butuh, tersedia: a.butuh - a.kurang }));
            if (kekurangan.length && !izinkan)
                return { ok: false, sebab: 'stok_kurang', kekurangan };
            for (const a of alokasi) {
                for (const x of a.ambil) {
                    await db.ubahStokObatUntukSerahTerima(x.jumlah, new Date(), x.stokId, tx);
                    await db.tambahMutasiStokUntukSerahTerima(x.stokId, 'keluar', -x.jumlah, `Serah terima resep ${a.nomor}`, petugasId, tx);
                }
                await db.tambahPengeluaranObatUntukSerahTerima(a.resepId, a.itemId, a.masterId, a.butuh, a.harga, a.kurang > 0, a.kurang > 0 ? alasan : null, petugasId, tx);
            }
            await db.ubahResepUntukSerahTerima('diserahkan', siap.map((r) => r.id), 'siap', tx);
            return { ok: true, kekurangan };
        });
    }
    kfaLokal(kode) {
        return db.daftarKfaLokalUntukKfaLokal((kode) ? (kode) : undefined);
    }
    /** Katalog KFA (JSON statis) digabung dengan tambahan/ubahan klinik (tabel `kfa_lokal`): pencarian per kata, dibatasi jumlah hasil. */
    async cariKfa(f) {
        return cariKatalogKfa(f.cari, f.batas, await this.kfaLokal());
    }
    async kfa(kode) {
        return ambilKatalogKfa(kode, await this.kfaLokal(kode));
    }
    /** Stok yang belum kedaluwarsa dijumlah per obat; kedaluwarsa terdekat hanya dari batch yang masih berisi. */
    async ringkasStok(ids) {
        const hasil = new Map();
        if (!ids.length)
            return hasil;
        const stok = await db.daftarStokObatUntukRingkasStok([...ids], 0);
        const hariIni = awalHariUtc().getTime();
        for (const s of stok) {
            const sekarang = hasil.get(s.master_obat_id) ?? { total: 0, terdekat: null };
            if (s.kedaluwarsa.getTime() >= hariIni)
                sekarang.total += s.jumlah;
            sekarang.terdekat ??= tglIso(s.kedaluwarsa);
            hasil.set(s.master_obat_id, sekarang);
        }
        return hasil;
    }
    keMasterDto(m, ringkas) {
        const total = ringkas?.total ?? 0;
        const terdekat = ringkas?.terdekat ?? null;
        return {
            id: m.id, kfa_kode: m.kfa_kode, kfa_nama: m.kfa_nama, nama_tampil: m.nama_tampil, satuan: m.satuan, harga: m.harga, aktif: m.aktif,
            bentuk_sediaan: m.bentuk_sediaan, rute: m.rute,
            stok_total: total, kedaluwarsa_terdekat: terdekat, status_stok: statusStokDari(total, terdekat),
        };
    }
    async daftarMaster(f) {
        const [total, baris] = await Promise.all([
            db.hitungMasterObatUntukDaftarMaster((!(f.aktif === undefined)) ? (f.aktif) : undefined, f.cari, f.cari),
            db.daftarMasterObatUntukDaftarMaster((!(f.aktif === undefined)) ? (f.aktif) : undefined, f.cari, f.cari, f.ukuran, (f.halaman - 1) * f.ukuran),
        ]);
        const ringkas = await this.ringkasStok(baris.map((b) => b.id));
        return { data: baris.map((b) => this.keMasterDto(b, ringkas.get(b.id))), halaman: f.halaman, ukuran: f.ukuran, total };
    }
    async master(id) {
        const m = await db.cariMasterObatUntukMaster(id);
        if (!m)
            return null;
        return this.keMasterDto(m, (await this.ringkasStok([m.id])).get(m.id));
    }
    /** 'duplikat' bila kode KFA sudah ada di master klinik ini. */
    async buatMaster(oleh, d, kfa) {
        try {
            const m = await db.transaksi(async (koneksiBaru) => { const _hasil = await db.tambahMasterObatUntukBuatMaster(kfa.kode, kfa.nama, kfa.bentuk_sediaan, d.rute || null, d.nama_tampil, d.satuan, d.harga, d.aktif, oleh, koneksiBaru); return db.tambahMasterObatUntukBuatMasterHasil(_hasil.id, koneksiBaru); });
            return this.keMasterDto(m);
        }
        catch (e) {
            if (db.bentrokUnik(e))
                return 'duplikat';
            throw e;
        }
    }
    async ubahMaster(id, d) {
        const ada = await db.ubahMasterObatUntukUbahMaster(d.rute || null, (d)?.nama_tampil, (d)?.satuan, (d)?.harga, (d)?.aktif, new Date(), id);
        return ada.count ? this.master(id) : null;
    }
    async stokMaster(masterId) {
        const stok = await db.daftarStokObatUntukStokMaster(masterId);
        return stok.map((s) => ({ id: s.id, master_obat_id: s.master_obat_id, batch: s.batch, kedaluwarsa: tglIso(s.kedaluwarsa), jumlah: s.jumlah }));
    }
    async riwayatMutasi(masterId, batas = 50) {
        const m = await db.daftarMutasiStokUntukRiwayatMutasi(masterId, batas);
        const nama = new Map((await db.daftarPenggunaUntukNamaPengguna([...new Set(m.map((x) => x.pengguna_id))])).map((u) => [u.id, u.nama]));
        return m.map((x) => ({ id: x.id, stok_id: x.stok_id, batch: x.stok.batch, jenis: x.jenis, jumlah: x.jumlah, alasan: x.alasan, pengguna_nama: nama.get(x.pengguna_id) ?? null, waktu: x.waktu.toISOString() }));
    }
    /**
     * Mutasi stok dalam satu transaksi dengan kunci baris batch. Terima menambah (batch baru dibuat), keluar mengurangi (tidak boleh melebihi stok),
     * koreksi menjadikan jumlah batch sama dengan nilai sebenarnya; selisihnya dicatat bertanda di mutasi_stok (hanya ditambah, tidak diubah).
     */
    async mutasi(penggunaId, d) {
        return db.transaksi(async (tx) => {
            const obat = await db.cariMasterObatUntukMutasi(d.master_obat_id, tx);
            if (!obat)
                return { ok: false, sebab: 'obat_tidak_ada' };
            const kunci = await db.kunciBatchStokObat(d.master_obat_id, d.batch, tx);
            let stokId = kunci[0]?.id;
            const sebelum = kunci[0]?.jumlah ?? 0;
            let sesudah;
            if (d.jenis === 'terima') {
                sesudah = sebelum + d.jumlah;
                if (stokId)
                    await db.ubahStokObatUntukMutasi((d.kedaluwarsa) ? (new Date(`${d.kedaluwarsa}T00:00:00.000Z`)) : (undefined), sesudah, new Date(), stokId, tx);
                else
                    stokId = (await (async () => { const _hasil = await db.tambahStokObatUntukMutasi(d.master_obat_id, d.batch, new Date(`${d.kedaluwarsa}T00:00:00.000Z`), sesudah, penggunaId, tx); return db.tambahStokObatUntukMutasiHasil(_hasil.id, tx); })()).id;
            }
            else {
                if (!stokId)
                    return { ok: false, sebab: 'batch_tidak_ada' };
                if (d.jenis === 'keluar' && d.jumlah > sebelum)
                    return { ok: false, sebab: 'stok_tidak_cukup' };
                sesudah = d.jenis === 'keluar' ? sebelum - d.jumlah : d.jumlah;
                await db.ubahStokObatUntukMutasi2(sesudah, new Date(), stokId, tx);
            }
            await db.tambahMutasiStokUntukSerahTerima(stokId, d.jenis, sesudah - sebelum, d.alasan?.trim() || null, penggunaId, tx);
            const s = await db.tambahStokObatUntukMutasiHasil(stokId, tx);
            return { ok: true, stok: { id: s.id, master_obat_id: s.master_obat_id, batch: s.batch, kedaluwarsa: tglIso(s.kedaluwarsa), jumlah: s.jumlah } };
        });
    }
    // ---- Resep ----
    kunjungan(id) {
        return db.cariKunjunganUntukKunjungan5(id);
    }
    /** Obat aktif milik klinik dari daftar id (urutan tidak dijamin). */
    obatAktifDari(ids) {
        return db.daftarMasterObatUntukObatAktifDari(true, [...ids]);
    }
    async keResepDto(ids) {
        if (!ids.length)
            return [];
        const baris = await db.daftarResepUntukKeResepDto([...ids]);
        const orang = await db.daftarPenggunaUntukNamaPengguna([...new Set([...baris.map((b) => b.dpjp_id), ...baris.flatMap((b) => (b.telaah ? [b.telaah.apoteker_id] : []))])]);
        const nama = new Map(orang.map((o) => [o.id, o.nama]));
        const ringkas = await this.ringkasStok([...new Set(baris.flatMap((b) => b.item.map((i) => i.master_obat_id)))]);
        return baris.map((r) => ({
            id: r.id, kunjungan_id: r.kunjungan_id, nomor_resep: r.nomor_resep, catatan: r.teks, status: r.status, jenis_pembiayaan: r.jenis_pembiayaan, dpjp_nama: nama.get(r.dpjp_id) ?? null,
            dibuat_pada: r.dibuat_pada.toISOString(), waktu_siap: r.waktu_siap?.toISOString() ?? null,
            item: r.item.map((i) => ({
                id: i.id, master_obat_id: i.master_obat_id, nama: i.master.nama_tampil, satuan: i.master.satuan, aturan_pakai: i.aturan_pakai, bentuk: i.bentuk, rute: i.rute, jumlah: i.jumlah,
                harga: i.master.harga, stok_tersedia: ringkas.get(i.master_obat_id)?.total ?? 0,
            })),
            telaah: r.telaah && { apoteker_nama: nama.get(r.telaah.apoteker_id) ?? null, administratif: r.telaah.administratif, farmasetik: r.telaah.farmasetik, klinis: r.telaah.klinis, catatan: r.telaah.catatan, waktu: r.telaah.waktu.toISOString() },
        }));
    }
    async resepKunjungan(kunjunganId) {
        const ids = (await db.daftarResepUntukResepKunjungan(kunjunganId)).map((r) => r.id);
        return this.keResepDto(ids);
    }
    async resep(id) {
        return (await this.keResepDto([id]))[0] ?? null;
    }
    /**
     * Satu resep per kunjungan: dibuat bila belum ada, selain itu catatan dan item obatnya diganti selama resep masih diajukan (belum ditelaah).
     * Item resep dan item tagihan obat dibuat ulang dalam satu transaksi. Nomor resep berurutan per hari (R-TTTTBBHH-NNN); pembuatan serempak
     * diserialkan per klinik supaya satu kunjungan tidak mendapat dua resep.
     */
    async simpanResep(d) {
        for (let percobaan = 0;; percobaan++) {
            try {
                return await db.transaksi(async (tx) => {
                    await db.kunciFasyankes(1, tx);
                    const semua = (await db.daftarResepUntukResepKunjungan(d.kunjungan.id, tx)).sort((x, y) => x.id - y.id);
                    const ada = semua.length ? (await db.kunciResep(semua[0].id, tx))[0] : null;
                    // Dokter boleh mengubah resep sampai apoteker mulai menelaahnya (status berubah atau catatan telaah sudah ada).
                    if (ada && (ada.status !== 'diajukan' || (await db.hitungTelaahUntukSimpanResep(ada.id, tx)) > 0))
                        return 'resep_terkunci';
                    // Tagihan yang sudah dibayar tidak boleh berubah.
                    if (await db.hitungPembayaranUntukCatatTelaah(d.kunjungan.id, tx))
                        return 'tagihan_terkunci';
                    let resepId, lama = [];
                    if (ada) {
                        resepId = ada.id;
                        lama = await db.daftarItemResepUntukCatatTelaah(resepId, tx);
                        await db.ubahCatatanUntukSimpanResep(resepId, d.catatan ?? '', tx);
                        if (lama.length)
                            await db.hapusItemTagihanUntukGantiItemObatResepDalam(lama.map((x) => x.id), tx);
                        await db.hapusItemResepUntukCatatTelaah(resepId, tx);
                    }
                    else {
                        const awal = awalHariUtc();
                        const urut = (await db.hitungResepUntukBuatResep(awal, tx)) + 1;
                        const nomor = `R-${tglIso(awal).replaceAll('-', '')}-${String(urut + percobaan).padStart(3, '0')}`;
                        // Kolom `teks` menyimpan catatan seluruh resep (boleh kosong).
                        const resep = await (async () => { const _hasil = await db.tambahResepUntukBuatResep(d.kunjungan.id, d.dpjpId, nomor, d.catatan ?? '', d.kunjungan.cara_pembayaran, d.oleh, tx); return db.tambahResepUntukBuatResepHasil(_hasil.id, tx); })();
                        resepId = resep.id;
                    }
                    const baru = [];
                    for (const i of d.item) {
                        const baris = await (async () => { const _hasil = await db.tambahItemResepUntukCatatTelaah(resepId, i.master_obat_id, i.aturan_pakai, i.bentuk, i.rute, i.jumlah, d.oleh, tx); return db.tambahItemResepUntukCatatTelaahHasil(_hasil.id, tx); })();
                        const o = d.obat.find((x) => x.id === i.master_obat_id);
                        baru.push({ itemResepId: baris.id, master_obat_id: o.id, nama: o.nama_tampil, harga: o.harga, jumlah: i.jumlah });
                    }
                    await gantiItemObatResepDalam(tx, d.kunjungan.id, d.oleh, [], baru);
                    const t = await db.cariTagihanUntukBuatResep(d.kunjungan.id, tx);
                    return { resepId, diubah: !!ada, tagihan: { status_tagihan: t?.status_tagihan ?? 'lengkap', status_pembayaran: t?.status_pembayaran ?? 'belum', total: t ? totalTagihan(t.item) : 0 } };
                });
            }
            catch (e) {
                if (db.bentrokUnik(e) && percobaan < 5)
                    continue;
                throw e;
            }
        }
    }
    /**
     * Telaah dan item obat disimpan dalam satu transaksi bila resep masih diajukan atau ditelaah (status ditelaah hanya bila ketiganya terpenuhi).
     * Bila daftar item berubah, item resep lama diganti dan item tagihan obat resep itu disinkronkan ulang (harga master obat); perubahan item
     * ditolak bila tagihan kunjungan sudah ada pembayaran atau kunjungan ditutup. item null (tidak dikirim) = item resep dan tagihan obat tidak disentuh.
     */
    async catatTelaah(resepId, apotekerId, d, item, obat) {
        const lengkap = d.administratif && d.farmasetik && d.klinis;
        return db.transaksi(async (tx) => {
            const kunci = await db.kunciResep(resepId, tx);
            const r = kunci[0];
            if (!r || (r.status !== 'diajukan' && r.status !== 'ditelaah'))
                return 'status_berubah';
            // item null = permintaan tanpa daftar item: hanya telaah yang dicatat.
            const lama = item ? await db.daftarItemResepUntukCatatTelaah(resepId, tx) : [];
            if (item && !samaItemResep(lama, item)) {
                const k = await db.cariKunjunganUntukTahapSekarang(r.kunjungan_id, tx);
                if (!k || k.tahap_layanan === 'ditutup')
                    return 'tagihan_terkunci';
                if (await db.hitungPembayaranUntukCatatTelaah(r.kunjungan_id, tx))
                    return 'tagihan_terkunci';
                const idLama = lama.map((x) => x.id);
                await db.hapusItemTagihanUntukGantiItemObatResepDalam(idLama, tx);
                await db.hapusItemResepUntukCatatTelaah(resepId, tx);
                const baru = [];
                for (const i of item) {
                    const baris = await (async () => { const _hasil = await db.tambahItemResepUntukCatatTelaah(resepId, i.master_obat_id, i.aturan_pakai, i.bentuk, i.rute, i.jumlah, apotekerId, tx); return db.tambahItemResepUntukCatatTelaahHasil(_hasil.id, tx); })();
                    const o = obat.find((x) => x.id === i.master_obat_id);
                    baru.push({ itemResepId: baris.id, master_obat_id: o.id, nama: o.nama_tampil, harga: o.harga, jumlah: i.jumlah });
                }
                await gantiItemObatResepDalam(tx, r.kunjungan_id, apotekerId, [], baru);
            }
            await db.ubahResepUntukCatatTelaah(lengkap ? 'ditelaah' : 'diajukan', resepId, tx);
            await db.simpanTelaahResepUntukCatatTelaah(resepId, apotekerId, d.administratif, d.farmasetik, d.klinis, d.catatan?.trim() || null, new Date(), tx);
            return 'ok';
        });
    }
    /** Resep ditelaah menjadi siap; bila semua resep kunjungan siap dan kunjungan masih di tahap resep, tahap maju ke kasir. null bila status bukan ditelaah. */
    async tandaiSiap(resepId) {
        return db.transaksi(async (tx) => {
            const r = await db.cariResepUntukTandaiSiap(resepId, tx);
            if (!r)
                return null;
            const ubah = await db.ubahResepUntukTandaiSiap('siap', new Date(), resepId, 'ditelaah', tx);
            if (!ubah.count)
                return null;
            const belum = await db.hitungResepUntukTandaiSiap(r.kunjungan_id, ['diajukan', 'ditelaah'], tx);
            if (!belum)
                await db.ubahKunjunganUntukUbahTahap('kasir', r.kunjungan_id, 'resep', tx);
            const k = await db.wajibKunjunganUntukTandaiSiap(r.kunjungan_id, tx);
            return { kunjunganId: r.kunjungan_id, tahap: k.tahap_layanan };
        });
    }
    async riwayat(f) {
        const [total, baris] = await Promise.all([
            db.hitungResepUntukRiwayat((f.status) ? f.status : undefined, ((f.dari || f.sampai) && (f.dari)) ? (new Date(`${f.dari}T00:00:00.000+07:00`)) : undefined, ((f.dari || f.sampai) && (f.sampai)) ? (new Date(new Date(`${f.sampai}T00:00:00.000+07:00`).getTime() + 86_400_000)) : undefined),
            db.daftarResepUntukRiwayat((f.status) ? f.status : undefined, ((f.dari || f.sampai) && (f.dari)) ? (new Date(`${f.dari}T00:00:00.000+07:00`)) : undefined, ((f.dari || f.sampai) && (f.sampai)) ? (new Date(new Date(`${f.sampai}T00:00:00.000+07:00`).getTime() + 86_400_000)) : undefined, f.ukuran, (f.halaman - 1) * f.ukuran),
        ]);
        const nama = new Map((await db.daftarPenggunaUntukNamaPengguna([...new Set(baris.map((b) => b.dpjp_id))])).map((u) => [u.id, u.nama]));
        return {
            data: baris.map((r) => ({
                id: r.id, kunjungan_id: r.kunjungan_id, nomor_resep: r.nomor_resep, pasien_nama: r.kunjungan.pasien.nama, pasien_nomor_rm: r.kunjungan.pasien.nomor_rm, status: r.status,
                jumlah_item: r.item.length, dibuat_pada: r.dibuat_pada.toISOString(), dpjp_nama: nama.get(r.dpjp_id) ?? null,
                catatan: r.teks, item: r.item.map((i) => ({ nama: i.master.nama_tampil, jumlah: i.jumlah, satuan: i.master.satuan })),
            })),
            halaman: f.halaman, ukuran: f.ukuran, total,
        };
    }
}
