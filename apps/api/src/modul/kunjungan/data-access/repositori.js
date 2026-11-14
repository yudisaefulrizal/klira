import * as db from '@klira/db';
import { mulaiAntreanDalam, selesaiAntreanDalam } from '../domain/antrean-otomatis.js';
import { ANTREAN_LAB, TAHAP_BERJALAN, kodeAntrean, tanggalWib } from '@klira/shared';
const tglDb = (t) => new Date(`${t}T00:00:00.000Z`);
const MAKS_ULANG_NOMOR = 5;
/** Pasien sudah punya kunjungan berjalan (terdeteksi di dalam transaksi, aman dari pendaftaran serempak). */
export class KunjunganBerjalanError extends Error {
    constructor() {
        super('kunjungan berjalan');
    }
}
/** Bentrok yang aman diulang: keunikan nomor antrean (ER_DUP_ENTRY), serialisasi/deadlock (ER_LOCK_DEADLOCK). */
export const bisaDiulang = (e) => (db.bentrokUnik(e) || db.transaksiBisaDiulang(e));
export const ambilKunjungan = (tx, id) => db.wajibKunjunganUntukAmbilKunjungan(id, 'ATND', 1, tx);
export const keDto = (k) => ({
    id: k.id, pasien_id: k.pasien_id, jenis: k.jenis, status: k.status, tahap_layanan: k.tahap_layanan, cara_pembayaran: k.cara_pembayaran,
    nomor_sep: k.nomor_sep, lokasi_id: k.lokasi_id, dpjp_id: k.peserta[0]?.pengguna_id ?? null, keluhan_singkat: k.keluhan_singkat, mulai: k.mulai.toISOString(),
    antrean: k.antrean ? { id: k.antrean.id, nomor: k.antrean.nomor, kode: kodeAntrean(k.antrean.nomor, k.antrean.awalan), jenis_poli: k.antrean.jenis_poli, status: k.antrean.status } : null,
});
export class RepositoriKunjunganMysql {
    async pasienAda(fasyankesId, id) {
        return (await db.hitungPasienUntukPasienAda(id, fasyankesId)) > 0;
    }
    async kunjunganBerjalan(fasyankesId, pasienId) {
        return (await db.hitungKunjunganUntukKunjunganBerjalan(fasyankesId, pasienId, [...TAHAP_BERJALAN], 'batal')) > 0;
    }
    /** Jenis poli (nama baku dan awalan antrean) bila ada poli operasional untuknya; null bila tidak ada. */
    async jenisPoliOperasional(fasyankesId, jenis) {
        const kunci = String(jenis ?? '').trim().toLowerCase();
        const p = (await db.daftarPoliUntukJenis(fasyankesId)).find((x) => x.status_operasional === 'O' && x.jenis_poli && x.jenis_poli.trim().toLowerCase() === kunci);
        return p ? { jenis_poli: p.jenis_poli, awalan: p.awalan_antrean } : null;
    }
    /** Jumlah pemeriksaan lab aktif dari daftar id (untuk memastikan semuanya sah sebelum kunjungan dibuat). */
    async pemeriksaanLabAktif(fasyankesId, ids) {
        return (await db.daftarMasterPemeriksaanUntukMasterAktifDari(fasyankesId, true, 'lab', [...ids])).length;
    }
    async dokterDiJenis(fasyankesId, penggunaId, jenis) {
        return (await db.hitungPoliDokterUntukJenis(fasyankesId, jenis, penggunaId)) > 0;
    }
    async dpjpSah(fasyankesId, penggunaId) {
        return (await db.hitungPenggunaUntukDpjpSah(penggunaId, fasyankesId, true)) > 0;
    }
    async dokterDiPoli(fasyankesId, penggunaId, lokasiId) {
        return (await db.hitungJadwalPraktikUntukDokterDiPoli(fasyankesId, penggunaId, lokasiId, true)) > 0;
    }
    async opsi(fasyankesId) {
        const [poli, praktisi, jadwal, poliJenis, pemeriksaanLab] = await Promise.all([
            db.daftarLokasiUntukOpsi2(fasyankesId, 'poli', 'O', 500),
            db.daftarPenggunaUntukOpsi3(fasyankesId, true, 500, 1),
            db.daftarJadwalPraktikUntukOpsi(fasyankesId, true),
            db.daftarPoliUntukJenis(fasyankesId),
            db.daftarMasterPemeriksaanUntukMasterAktifDari(fasyankesId, true, 'lab', undefined),
        ]);
        const operasional = poliJenis.filter((p) => p.status_operasional === 'O' && p.jenis_poli);
        const jenisDariPoli = new Map(operasional.map((p) => [p.id, p.jenis_poli]));
        const jenis = [...new Map(operasional.map((p) => [p.jenis_poli.toLowerCase(), { nilai: p.jenis_poli, label: p.jenis_poli, awalan: p.awalan_antrean }])).values()];
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
        const tanggal = tglDb(tanggalWib(sekarang));
        // Nomor antrean = urutan berikutnya per jenis poli per hari; bentrok keunikan (pendaftaran serempak) diulang.
        for (let percobaan = 1;; percobaan++) {
            try {
                return await db.transaksi(async (tx) => {
                    // Kunci baris pasien: pendaftaran serempak pasien yang sama berurutan, sehingga cek di bawah atomik dengan pembuatan.
                    await db.kunciPasien(d.pasien_id, fasyankesId, tx);
                    const berjalan = await db.hitungKunjunganUntukKunjunganBerjalan(fasyankesId, d.pasien_id, [...TAHAP_BERJALAN], 'batal', tx);
                    if (berjalan > 0)
                        throw new KunjunganBerjalanError();
                    const k = await (async () => { const _hasil = await db.tambahKunjunganUntukDaftarkan(fasyankesId, d.pasien_id, d.jenis, 'arrived', d.jenis === 'LAB' ? 'pemeriksaan' : 'menunggu_skrining', null, d.cara_pembayaran, d.nomor_sep, d.keluhan_singkat, sekarang, oleh, tx); return db.tambahKunjunganUntukDaftarkanHasil(_hasil.id, tx); })();
                    if (d.jenis === 'LAB' && d.perujuk)
                        await db.ubahKunjunganUntukPerujuk(k.id, fasyankesId, d.perujuk, tx);
                    if (d.dpjp_id)
                        await db.tambahPesertaKunjunganUntukDaftarkan(fasyankesId, k.id, d.dpjp_id, 'ATND', sekarang, oleh, tx);
                    if ((d.jenis === 'AMB' || d.jenis === 'LAB') && d.jenis_poli) {
                        // Nomor = urutan berikutnya per jenis poli (awalan) per hari; poli ditetapkan saat dipanggil.
                        const maks = await db.ringkasanAntreanUntukDaftarkan(fasyankesId, d.awalan, tanggal, tx);
                        await db.tambahAntreanUntukDaftarkan(fasyankesId, k.id, d.jenis_poli, d.awalan, tanggal, (maks._max.nomor ?? 0) + 1, 'menunggu', sekarang, oleh, tx);
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
    async ubahTahap(fasyankesId, id, dari, ke) {
        return db.transaksi(async (tx) => {
            const n = await db.ubahKunjunganUntukUbahTahap(ke, id, fasyankesId, dari, tx);
            if (n.count !== 1)
                return null;
            const waktu = new Date();
            if (ke === 'pemeriksaan')
                await mulaiAntreanDalam(tx, fasyankesId, id, waktu);
            if (dari === 'pemeriksaan' && (ke === 'resep' || ke === 'kasir'))
                await selesaiAntreanDalam(tx, fasyankesId, id, waktu);
            return keDto(await ambilKunjungan(tx, id));
        });
    }
    async statusAntrean(fasyankesId, id) {
        return (await db.cariAntreanUntukStatusAntrean(id, fasyankesId))?.status ?? null;
    }
    async ubahAntrean(fasyankesId, id, aksi, dari, ke, waktu, lokasiPilihan) {
        let poliPanggil = null;
        const hasil = await db.transaksi(async (tx) => {
            // Serialisasi panggilan per fasilitas agar urutan ID event mengikuti urutan commit.
            if (aksi === 'panggil') {
                await db.kunciFasyankes(fasyankesId, tx);
                // Antrean dibagi per jenis poli; poli ditetapkan saat pertama dipanggil: poli sejenis yang operasional dan bebas
                // (dan, bila pasien memilih dokter, poli tempat dokter itu bertugas). Satu poli melayani satu pasien sekali waktu.
                const a0 = await db.wajibAntreanUntukUbahAntrean(id, tx);
                let lokasiId = a0.lokasi_id;
                let tetapkan = false;
                if (a0.awalan === ANTREAN_LAB.awalan && a0.jenis_poli === ANTREAN_LAB.jenis_poli) {
                    // Antrean penunjang saja tidak memakai poli: tanpa pemilihan poli dan tanpa aturan satu pasien per poli.
                    poliPanggil = { id: null, nama: ANTREAN_LAB.jenis_poli };
                }
                else if (lokasiId) {
                    const poli0 = await db.wajibLokasiUntukUbahAntrean(lokasiId, fasyankesId, tx);
                    if (poli0.status_operasional !== 'O')
                        return { galat: 'poli_tidak_operasional', poli: poli0.nama };
                    const sibuk = await db.cariAntreanSibukUntukPanggil(fasyankesId, lokasiId, a0.tanggal, id, tx);
                    if (sibuk)
                        return { galat: 'poli_sibuk', poli: poli0.nama, kode: kodeAntrean(sibuk.nomor, sibuk.awalan) };
                    poliPanggil = { id: lokasiId, nama: poli0.nama };
                }
                else {
                    const dpjp = (await ambilKunjungan(tx, a0.kunjungan_id)).peserta[0]?.pengguna_id ?? null;
                    const semua = (await db.daftarPoliUntukJenis(fasyankesId, tx)).filter((x) => x.jenis_poli && x.jenis_poli.toLowerCase() === a0.jenis_poli.toLowerCase() && x.status_operasional === 'O');
                    if (!semua.length)
                        return { galat: 'poli_tidak_operasional', poli: `Poli ${a0.jenis_poli}` };
                    const bebas = await db.daftarPoliBebasUntukPanggil(fasyankesId, a0.jenis_poli, a0.tanggal, dpjp, tx);
                    const pilih = lokasiPilihan ? bebas.find((x) => x.id === lokasiPilihan) : bebas[0];
                    if (!pilih)
                        return { galat: lokasiPilihan ? 'poli_pilihan_tidak_tersedia' : dpjp ? 'dokter_poli_sibuk' : 'jenis_sibuk', jenis: a0.jenis_poli };
                    lokasiId = pilih.id;
                    poliPanggil = pilih;
                    tetapkan = true;
                }
                if (tetapkan)
                    await db.ubahAntreanUntukTetapkanPoli(id, lokasiId, tx);
            }
            const n = await db.ubahAntreanUntukUbahAntrean(ke, (aksi === 'panggil') ? (waktu) : (undefined), ((!(aksi === 'panggil')) && (aksi === 'mulai')) ? (waktu) : (undefined), ((!(aksi === 'panggil')) && (!(aksi === 'mulai'))) ? (waktu) : (undefined), id, fasyankesId, [...dari], tx);
            if (n.count !== 1)
                return false;
            if (aksi === 'panggil') {
                const a = await db.wajibAntreanUntukUbahAntrean(id, tx);
                // Event dan perubahan status berada dalam transaksi yang sama, termasuk panggil ulang.
                await db.tambahEventPanggilanUntukUbahAntrean(fasyankesId, poliPanggil.id, poliPanggil.nama, kodeAntrean(a.nomor, a.awalan), a.tanggal, waktu, tx);
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
        const poli = new Map((await db.daftarLokasiUntukPetakanAntrean(fasyankesId, [...new Set(data.map((a) => a.lokasi_id))])).map((l) => [l.id, l.nama]));
        return data.map((a) => ({
            id: a.id, kunjungan_id: a.kunjungan_id, lokasi_id: a.lokasi_id, poli_nama: poli.get(a.lokasi_id) ?? null, tanggal: a.tanggal.toISOString().slice(0, 10), nomor: a.nomor, jenis_poli: a.jenis_poli,
            kode: kodeAntrean(a.nomor, a.awalan), status: a.status, waktu_daftar: a.waktu_daftar.toISOString(), waktu_panggil: a.waktu_panggil?.toISOString() ?? null,
            pasien_nama: pasien.get(a.kunjungan.pasien_id)?.nama ?? '', pasien_nomor_rm: pasien.get(a.kunjungan.pasien_id)?.nomor_rm ?? '',
        }));
    }
}
