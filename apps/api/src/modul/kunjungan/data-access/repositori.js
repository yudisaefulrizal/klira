import * as db from '@klira/db';
import { mulaiAntreanDalam, selesaiAntreanDalam } from '../domain/antrean-otomatis.js';
import { ANTREAN_LAB, TAHAP_BERJALAN, formatIdLayanan, kodeAntrean, tanggalWib } from '@klira/shared';
import { namaPanggil, pilihRuangPanggil } from './ruang-panggil.js';
const tglDb = (t) => new Date(`${t}T00:00:00.000Z`);
const MAKS_ULANG_NOMOR = 5;
/** Pasien sudah punya kunjungan berjalan (terdeteksi di dalam transaksi, aman dari pendaftaran serempak). */
export class KunjunganBerjalanError extends Error {
    constructor() {
        super('kunjungan berjalan');
    }
}
/** Sesi antrean sedang ditutup sehingga pendaftaran yang membutuhkan nomor antrean tidak dapat diproses. */
export class AntreanDitutupError extends Error {
    constructor() {
        super('antrean ditutup');
    }
}
/** Bentrok yang aman diulang: keunikan nomor antrean/id_layanan (ER_DUP_ENTRY), serialisasi/deadlock (ER_LOCK_DEADLOCK). */
export const bisaDiulang = (e) => (db.bentrokUnik(e) || db.transaksiBisaDiulang(e));
export const ambilKunjungan = (tx, id) => db.wajibKunjunganUntukAmbilKunjungan(id, 'ATND', 1, tx);
export const keDto = (k) => ({
    id: k.id, id_layanan: k.id_layanan ?? null, pasien_id: k.pasien_id, jenis: k.jenis, status: k.status, tahap_layanan: k.tahap_layanan, cara_pembayaran: k.cara_pembayaran,
    nomor_sep: k.nomor_sep, lokasi_id: k.lokasi_id, dpjp_id: k.peserta[0]?.pengguna_id ?? null, keluhan_singkat: k.keluhan_singkat, mulai: k.mulai.toISOString(),
    antrean: k.antrean ? { id: k.antrean.id, sesi_id: k.antrean.sesi_id ?? null, nomor: k.antrean.nomor, kode: kodeAntrean(k.antrean.nomor, k.antrean.awalan), jenis_poli: k.antrean.jenis_poli, ruang_id: k.antrean.ruang_id ?? null, status: k.antrean.status } : null,
});
export class RepositoriKunjunganMysql {
    async pasienAda(fasyankesId, id) {
        return (await db.hitungPasienUntukPasienAda(id, fasyankesId)) > 0;
    }
    async kunjunganBerjalan(fasyankesId, pasienId) {
        return (await db.hitungKunjunganUntukKunjunganBerjalan(fasyankesId, pasienId, [...TAHAP_BERJALAN], 'batal')) > 0;
    }
    /** Poli operasional menurut namanya: id, nama baku (disalin ke antrean), dan awalan antrean; null bila tidak ada. */
    async jenisPoliOperasional(fasyankesId, jenis) {
        const p = await this.poliMenurutNama(fasyankesId, jenis);
        return p && p.status_operasional === 'O' ? { lokasi_id: p.id, jenis_poli: p.nama, awalan: p.awalan_antrean } : null;
    }
    async poliMenurutNama(fasyankesId, nama) {
        const kunci = String(nama ?? '').trim().toLowerCase();
        return (await db.daftarPoli(fasyankesId)).find((x) => x.nama.trim().toLowerCase() === kunci) ?? null;
    }
    /** Jumlah pemeriksaan lab aktif dari daftar id (untuk memastikan semuanya sah sebelum kunjungan dibuat). */
    async pemeriksaanLabAktif(fasyankesId, ids) {
        return (await db.daftarMasterPemeriksaanUntukMasterAktifDari(fasyankesId, true, 'lab', [...ids])).length;
    }
    /** Dokter punya jadwal praktik di poli bernama `jenis`. */
    async dokterDiJenis(fasyankesId, penggunaId, jenis) {
        const p = await this.poliMenurutNama(fasyankesId, jenis);
        return !!p && (await db.hitungJadwalPraktikUntukDokterDiPoli(fasyankesId, penggunaId, p.id)) > 0;
    }
    async dpjpSah(fasyankesId, penggunaId) {
        return (await db.hitungPenggunaUntukDpjpSah(penggunaId, fasyankesId, true)) > 0;
    }
    async dokterDiPoli(fasyankesId, penggunaId, lokasiId) {
        return (await db.hitungJadwalPraktikUntukDokterDiPoli(fasyankesId, penggunaId, lokasiId)) > 0;
    }
    async opsi(fasyankesId) {
        const [poli, praktisi, jadwal, pemeriksaanLab] = await Promise.all([
            db.daftarLokasiUntukOpsi2(fasyankesId, 'poli', 'O', 500),
            db.daftarPenggunaUntukOpsi3(fasyankesId, true, 500, 1),
            db.daftarJadwalPraktikUntukOpsi(fasyankesId),
            db.daftarMasterPemeriksaanUntukMasterAktifDari(fasyankesId, true, 'lab', undefined),
        ]);
        const operasional = (await db.daftarPoli(fasyankesId)).filter((p) => p.status_operasional === 'O');
        const jenisDariPoli = new Map(operasional.map((p) => [p.id, p.nama]));
        const jenis = operasional.map((p) => ({ nilai: p.nama, label: p.nama, awalan: p.awalan_antrean }));
        return {
            poli,
            jenis_poli: jenis,
            pemeriksaan_lab: pemeriksaanLab.map((m) => ({ id: m.id, nama: m.nama })).sort((a, b) => a.nama.localeCompare(b.nama, 'id')),
            dpjp: praktisi.map((p) => ({
                id: p.id, nama: p.nama, profesi: p.profil_profesi[0]?.profesi ?? '',
                poli_ids: [...new Set(jadwal.filter((j) => j.pengguna_id === p.id).map((j) => j.lokasi_id))],
                jenis_poli: [...new Set(jadwal.filter((j) => j.pengguna_id === p.id).map((j) => jenisDariPoli.get(j.lokasi_id)).filter(Boolean))],
            })),
        };
    }
    async daftarkan(fasyankesId, oleh, d, sekarang) {
        const tglWib = tanggalWib(sekarang);
        const tanggal = tglDb(tglWib);
        const awalanId = `LY-${tglWib.slice(2, 4)}${tglWib.slice(5, 7)}${tglWib.slice(8, 10)}`;
        const perluAntrean = (d.jenis === 'AMB' || d.jenis === 'LAB') && !!d.jenis_poli;
        // Nomor antrean = urutan berikutnya per poli per sesi; ID layanan = urutan harian per fasyankes; bentrok keunikan diulang.
        for (let percobaan = 1;; percobaan++) {
            try {
                return await db.transaksi(async (tx) => {
                    // Kunci baris pasien: pendaftaran serempak pasien yang sama berurutan, sehingga cek di bawah atomik dengan pembuatan.
                    await db.kunciPasien(d.pasien_id, fasyankesId, tx);
                    const berjalan = await db.hitungKunjunganUntukKunjunganBerjalan(fasyankesId, d.pasien_id, [...TAHAP_BERJALAN], 'batal', tx);
                    if (berjalan > 0)
                        throw new KunjunganBerjalanError();
                    let sesi = null;
                    if (perluAntrean) {
                        sesi = await db.ambilSesiAntreanAktif(fasyankesId, tx);
                        if (!sesi)
                            throw new AntreanDitutupError();
                    }
                    const maksLayanan = await db.hitungMaksUrutanIdLayanan(fasyankesId, awalanId, tx);
                    const idLayanan = formatIdLayanan(tglWib, maksLayanan + 1);
                    const k = await (async () => { const _hasil = await db.tambahKunjunganUntukDaftarkan(fasyankesId, idLayanan, d.pasien_id, d.jenis, 'arrived', d.jenis === 'LAB' ? 'pemeriksaan' : 'menunggu_skrining', d.lokasi_id ?? null, d.cara_pembayaran, d.nomor_sep, d.keluhan_singkat, sekarang, oleh, tx); return db.tambahKunjunganUntukDaftarkanHasil(_hasil.id, tx); })();
                    if (d.jenis === 'LAB' && d.perujuk)
                        await db.ubahKunjunganUntukPerujuk(k.id, fasyankesId, d.perujuk, tx);
                    if (d.dpjp_id)
                        await db.tambahPesertaKunjunganUntukDaftarkan(fasyankesId, k.id, d.dpjp_id, 'ATND', sekarang, oleh, tx);
                    if (perluAntrean) {
                        // Nomor = urutan berikutnya per poli (awalan) per sesi aktif; ruang periksa ditetapkan saat dipanggil.
                        const maks = await db.ringkasanAntreanUntukDaftarkan(fasyankesId, d.awalan, sesi.id, tx);
                        await db.tambahAntreanUntukDaftarkan(fasyankesId, sesi.id, k.id, d.lokasi_id ?? null, d.jenis_poli, d.awalan, tanggal, (maks._max.nomor ?? 0) + 1, 'menunggu', sekarang, oleh, tx);
                        if (d.sumber === 'mobile_jkn')
                            await db.tandaiSumberAntrean(k.id, fasyankesId, 'mobile_jkn', d.pcare_no_urut ?? null, tx);
                    }
                    return keDto(await ambilKunjungan(tx, k.id));
                });
            }
            catch (e) {
                if (!bisaDiulang(e) || percobaan >= MAKS_ULANG_NOMOR)
                    throw e;
            }
        }
    }
    async tahapSekarang(fasyankesId, id) {
        return (await db.cariKunjunganUntukTahapSekarang(id, fasyankesId))?.tahap_layanan ?? null;
    }
    async detailUntukUbahDpjp(fasyankesId, id) {
        const k = await db.wajibKunjunganUntukAmbilKunjungan(id, 'ATND', 1);
        if (!k || k.fasyankes_id !== fasyankesId)
            return null;
        return keDto(k);
    }
    async ubahDpjp(fasyankesId, id, dpjpId, oleh, sekarang) {
        return db.transaksi(async (tx) => {
            const ada = await db.daftarPesertaKunjunganUntukTerapkanDpjp(id, null, tx);
            const atnd = ada.find((a) => a.tipe === 'ATND');
            if (dpjpId) {
                if (atnd)
                    await db.ubahDpjpPesertaKunjungan(id, dpjpId, tx);
                else
                    await db.tambahPesertaKunjunganUntukDaftarkan(fasyankesId, id, dpjpId, 'ATND', sekarang, oleh, tx);
            } else if (atnd) {
                await db.hapusDpjpPesertaKunjungan(id, tx);
            }
            return keDto(await ambilKunjungan(tx, id));
        });
    }
    async ubahTahap(fasyankesId, id, dari, ke) {
        return db.transaksi(async (tx) => {
            const n = await db.ubahKunjunganUntukUbahTahap(ke, id, fasyankesId, dari, tx);
            if (n.count !== 1)
                return null;
            const waktu = new Date();
            if (dari === 'pemeriksaan' && (ke === 'resep' || ke === 'kasir'))
                await selesaiAntreanDalam(tx, fasyankesId, id, waktu);
            return keDto(await ambilKunjungan(tx, id));
        });
    }
    async statusAntrean(fasyankesId, id) {
        return (await db.cariAntreanUntukStatusAntrean(id, fasyankesId))?.status ?? null;
    }
    /** Tahap layanan kunjungan milik antrean ini; null bila antrean tidak ada. */
    tahapAntrean(fasyankesId, id) {
        return db.cariTahapLayananUntukTahapAntrean(id, fasyankesId);
    }
    async ubahAntrean(fasyankesId, id, aksi, dari, ke, waktu, lokasiPilihan) {
        let poliPanggil = null;
        const hasil = await db.transaksi(async (tx) => {
            // Serialisasi panggilan per fasilitas agar urutan ID event mengikuti urutan commit.
            if (aksi === 'panggil') {
                await db.kunciFasyankes(fasyankesId, tx);
                // Antrean dibagi per poli (layanan); ruang periksa ditetapkan saat pertama dipanggil: ruang poli itu yang aktif dan bebas
                // (bila pasien memilih dokter, dokter itu harus sedang tidak menangani pasien lain). Satu ruang melayani satu pasien sekali waktu.
                const a0 = await db.wajibAntreanUntukUbahAntrean(id, tx);
                if (a0.awalan === ANTREAN_LAB.awalan && a0.jenis_poli === ANTREAN_LAB.jenis_poli) {
                    // Antrean penunjang saja tidak memakai poli: tanpa pemilihan ruang dan tanpa aturan satu pasien per ruang.
                    poliPanggil = { id: null, nama: ANTREAN_LAB.jenis_poli };
                }
                else {
                    const poli = a0.lokasi_id ? await db.wajibLokasiUntukUbahAntrean(a0.lokasi_id, fasyankesId, tx) : null;
                    if (!poli || poli.status_operasional !== 'O')
                        return { galat: 'poli_tidak_operasional', poli: `Poli ${poli?.nama ?? a0.jenis_poli}` };
                    if (a0.ruang_id) {
                        // Panggil ulang: tetap di ruang yang sudah ditetapkan.
                        const ruang = await db.wajibLokasiUntukUbahAntrean(a0.ruang_id, fasyankesId, tx);
                        if (ruang.status_operasional !== 'O')
                            return { galat: 'poli_tidak_operasional', poli: ruang.nama };
                        const sibuk = await db.cariAntreanSibukUntukPanggil(fasyankesId, a0.ruang_id, a0.sesi_id, id, tx);
                        if (sibuk)
                            return { galat: 'poli_sibuk', poli: ruang.nama, kode: kodeAntrean(sibuk.nomor, sibuk.awalan) };
                        poliPanggil = { id: ruang.id, nama: namaPanggil(poli, ruang) };
                    }
                    else {
                        const dpjp = (await ambilKunjungan(tx, a0.kunjungan_id)).peserta[0]?.pengguna_id ?? null;
                        const h = await pilihRuangPanggil(fasyankesId, { poliId: poli.id, sesiId: a0.sesi_id, dpjpId: dpjp, kecualiId: id, ruangPilihan: lokasiPilihan }, tx);
                        if (h.galat)
                            return { galat: h.galat, jenis: poli.nama, kode: h.kode };
                        if (h.ruang)
                            await db.tetapkanRuangAntrean(id, h.ruang.id, tx);
                        poliPanggil = { id: h.ruang?.id ?? poli.id, nama: namaPanggil(poli, h.ruang) };
                    }
                }
            }
            const n = await db.ubahAntreanUntukUbahAntrean(ke, (aksi === 'panggil') ? (waktu) : (undefined), ((!(aksi === 'panggil')) && (aksi === 'mulai')) ? (waktu) : (undefined), (aksi === 'selesai' || aksi === 'batal') ? (waktu) : (undefined), id, fasyankesId, [...dari], tx);
            if (n.count !== 1)
                return false;
            // Dilewati melepas ruang: antrean tidak lagi memegangnya, dan ruang dipilih ulang saat dipanggil lagi.
            if (aksi === 'lewati')
                await db.tetapkanRuangAntrean(id, null, tx);
            if (aksi === 'panggil') {
                const a = await db.wajibAntreanUntukUbahAntrean(id, tx);
                // Event dan perubahan status berada dalam transaksi yang sama, termasuk panggil ulang.
                await db.tambahEventPanggilanUntukUbahAntrean(fasyankesId, a.sesi_id, poliPanggil.id, poliPanggil.nama, kodeAntrean(a.nomor, a.awalan), a.tanggal, waktu, tx);
            }
            if (aksi === 'mulai') {
                const a = await db.wajibAntreanUntukUbahAntrean2(id, tx);
                await db.ubahKunjunganUntukUbahAntrean('in-progress', a.kunjungan_id, fasyankesId, ['planned', 'arrived'], tx);
            }
            return true;
        });
        if (!hasil)
            return null;
        if (hasil.galat)
            return hasil;
        return (await this.petakanAntrean(fasyankesId, { id }))[0] ?? null;
    }
    async daftarAntrean(fasyankesId, f) {
        const where = { fasyankes_id: fasyankesId, tanggal: tglDb(f.tanggal), ...(f.lokasi_id ? { lokasi_id: f.lokasi_id } : {}), ...(f.status ? { status: f.status } : {}) };
        const [total, baris] = await Promise.all([
            db.hitungAntreanUntukDaftarAntrean(fasyankesId, tglDb(f.tanggal), (f.lokasi_id) ? (f.lokasi_id) : undefined, (f.status) ? (f.status) : undefined),
            this.petakanAntrean(fasyankesId, where, { skip: (f.halaman - 1) * f.ukuran, take: f.ukuran }),
        ]);
        return { total, baris };
    }
    async petakanAntrean(fasyankesId, where, halaman) {
        const data = await db.daftarAntreanUntukPetakanAntrean((where)?.id, (where)?.fasyankes_id, (where)?.tanggal, (where)?.lokasi_id, (where)?.status, fasyankesId, halaman?.take, halaman?.skip);
        const pasien = new Map((await db.daftarPasienUntukPetakanAntrean(fasyankesId, data.map((a) => a.kunjungan.pasien_id))).map((p) => [p.id, p]));
        const nama = new Map((await db.daftarLokasiUntukPetakanAntrean(fasyankesId, [...new Set(data.flatMap((a) => [a.lokasi_id, a.ruang_id].filter(Boolean)))])).map((l) => [l.id, l.nama]));
        return data.map((a) => ({
            id: a.id, kunjungan_id: a.kunjungan_id, lokasi_id: a.lokasi_id, poli_nama: nama.get(a.lokasi_id) ?? null, ruang_id: a.ruang_id ?? null, ruang_nama: nama.get(a.ruang_id) ?? null, tanggal: a.tanggal.toISOString().slice(0, 10), nomor: a.nomor, jenis_poli: a.jenis_poli,
            kode: kodeAntrean(a.nomor, a.awalan), status: a.status, waktu_daftar: a.waktu_daftar.toISOString(), waktu_panggil: a.waktu_panggil?.toISOString() ?? null,
            pasien_nama: pasien.get(a.kunjungan.pasien_id)?.nama ?? '', pasien_nomor_rm: pasien.get(a.kunjungan.pasien_id)?.nomor_rm ?? '',
        }));
    }
    async sesiAntreanTerakhir(fasyankesId) {
        return db.ambilSesiAntreanTerakhir(fasyankesId);
    }
    async daftarAntreanSementaraJkn(fasyankesId) {
        return db.daftarAntreanSementaraJkn(fasyankesId, 'menunggu');
    }
    async bukaSesiAntrean(fasyankesId, oleh, waktu) {
        return db.transaksi(async (tx) => {
            await db.kunciFasyankes(fasyankesId, tx);
            const aktif = await db.ambilSesiAntreanAktif(fasyankesId, tx);
            if (aktif)
                return { galat: 'sudah_buka', sesi: aktif };
            const sesi = await db.buatSesiAntrean(fasyankesId, oleh, waktu, tx);
            const sementara = await db.daftarAntreanSementaraJkn(fasyankesId, 'menunggu', tx);
            return { sesi, sementara };
        });
    }
    async tandaiSementaraJknDipindahkan(id, fasyankesId, kunjunganId, waktu) {
        return db.tandaiAntreanSementaraJknDipindahkan(id, fasyankesId, kunjunganId, waktu);
    }
    async tutupSesiAntrean(fasyankesId, oleh, waktu) {
        return db.transaksi(async (tx) => {
            await db.kunciFasyankes(fasyankesId, tx);
            const aktif = await db.ambilSesiAntreanAktif(fasyankesId, tx);
            if (!aktif)
                return { galat: 'sudah_tutup' };
            const belumSelesai = await db.daftarAntreanBelumSelesaiDalamSesi(fasyankesId, aktif.id, tx);
            if (belumSelesai.length)
                return { galat: 'belum_selesai', belum_selesai: belumSelesai };
            await db.tutupSesiAntrean(aktif.id, fasyankesId, oleh, waktu, tx);
            return { ok: true, sesi_id: aktif.id };
        });
    }
}
