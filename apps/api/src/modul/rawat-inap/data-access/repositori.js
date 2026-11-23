import * as db from '@klira/db';
import { selesaiAntreanDalam } from '../../kunjungan/domain/antrean-otomatis.js';
import { formatIdLayanan, hargaTarif, TAHAP_BERJALAN, tanggalRetensi, tanggalWib } from '@klira/shared';
import { tambahItemTagihanDalam } from '../../kasir/data-access/repositori.js';
import { hitungHariKamar } from '../domain/hari-kamar.js';
import { tulisPengesahanDalam } from '../../rekam-medis/data-access/repositori.js';
export class GalatRi extends Error {
    kode;
    constructor(kode) {
        super(kode);
        this.kode = kode;
    }
}
const tahapBerjalan = [...TAHAP_BERJALAN];
const kunci = (tx, tabel, fasyankesId, id) => tabel === 'pasien' ? db.kunciPasienRawatInap(id, fasyankesId, tx) : tabel === 'lokasi' ? db.kunciLokasiRawatInap(id, fasyankesId, tx) : db.kunciKunjunganRawatInap(id, fasyankesId, tx);
/** Profesi yang boleh menjadi DPJP, dicocokkan dari awal nama profesi (mis. "Dokter Umum", "Dokter Gigi", "Bidan"). */
const PROFESI_DPJP = { has: (profesi) => /^(dokter|bidan)\b/i.test(profesi ?? '') };
/** Akses data Rawat inap: papan bed, admisi, penempatan, DPJP, catatan harian (CPPT), pemulangan. Hanya INSERT dan penutupan periode; tidak ada hapus. */
export class RepositoriRawatInapMysql {
    async pasienAda(fasyankesId, id) {
        return (await db.hitungPasienUntukPasienAda(id, fasyankesId)) > 0;
    }
    /** Praktisi aktif yang boleh menjadi DPJP (dokter, dokter gigi, bidan); perawat, apoteker, dan profesi lain tidak. */
    async praktisiDpjp(fasyankesId) {
        const praktisi = await db.daftarPenggunaUntukOpsi3(fasyankesId, true, 500, 1);
        return praktisi.filter((p) => PROFESI_DPJP.has(p.profil_profesi[0]?.profesi));
    }
    async dpjpSah(fasyankesId, ids) {
        const sah = new Set((await this.praktisiDpjp(fasyankesId)).map((p) => p.id));
        return [...new Set(ids)].every((id) => sah.has(id));
    }
    async tarifKamarSah(fasyankesId, id) {
        return (await db.hitungTarifLayananUntukTarifKamarSah(id, fasyankesId, 'kamar', true)) > 0;
    }
    async kunjungan(fasyankesId, id) {
        const k = await db.cariKunjunganUntukKunjungan4(id, fasyankesId);
        return k;
    }
    // ---- Opsi dan papan ----
    async opsi(fasyankesId) {
        const [bed, tarif, praktisi] = await Promise.all([
            this.bedSemua(fasyankesId),
            db.daftarTarifLayananUntukOpsi(fasyankesId, 'kamar', true, 200),
            this.praktisiDpjp(fasyankesId),
        ]);
        return {
            bed_kosong: bed.filter((b) => b.status === 'kosong').map((b) => ({ id: b.id, nama: b.nama, ruang_nama: b.ruang_nama, ruang_tarif_id: b.ruang_tarif_id ?? null, ruang_harga_umum: b.ruang_harga_umum ?? null })),
            tarif_kamar: tarif.map((t) => ({ id: t.id, kode: t.kode, nama: t.nama, harga_umum: t.harga_umum, harga_jkn: t.harga_jkn })),
            dpjp: praktisi.map((p) => ({ id: p.id, nama: p.nama, profesi: p.profil_profesi[0]?.profesi ?? '' })),
        };
    }
    async bedSemua(fasyankesId) {
        const lokasi = await db.daftarLokasiUntukBedSemua(fasyankesId, 'bed', 1000);
        const ruangIds = [...new Set(lokasi.flatMap((l) => (l.induk_id ? [l.induk_id] : [])))];
        const [ruangBaris, tarifRuangBaris] = await Promise.all([
            db.daftarLokasiUntukPetakanAntrean(fasyankesId, ruangIds),
            db.daftarTarifRuang(fasyankesId, ruangIds),
        ]);
        const ruang = new Map(ruangBaris.map((r) => [r.id, r.nama]));
        const tarifRuang = new Map(tarifRuangBaris.map((t) => [t.id, t]));
        const aktif = await db.daftarPenempatanUntukBedSemua(fasyankesId, null);
        const kunj = await db.daftarKunjunganUntukBedSemua(aktif.map((a) => a.kunjungan_id), 'ATND', null, 1);
        const orang = new Map((await db.daftarPenggunaUntukNamaPengguna(kunj.flatMap((k) => k.peserta.map((p) => p.pengguna_id)))).map((u) => [u.id, u.nama]));
        return lokasi.map((l) => {
            const a = aktif.find((x) => x.lokasi_id === l.id);
            const k = a && kunj.find((x) => x.id === a.kunjungan_id);
            const tr = l.induk_id ? tarifRuang.get(l.induk_id) : null;
            return {
                id: l.id, nama: l.nama, ruang_id: l.induk_id, ruang_nama: l.induk_id ? ruang.get(l.induk_id) ?? null : null,
                ruang_tarif_id: tr?.tarif_id ?? null, ruang_tarif_nama: tr?.tarif_nama ?? null, ruang_harga_umum: tr?.harga_umum ?? null,
                status: a ? 'terisi' : l.status_operasional === 'O' ? 'kosong' : 'tidak_operasional',
                penghuni: a && k ? { kunjungan_id: k.id, pasien_id: k.pasien_id, pasien_nama: k.pasien.nama, pasien_nomor_rm: k.pasien.nomor_rm, mulai: a.mulai.toISOString(), dpjp_nama: k.peserta[0] ? orang.get(k.peserta[0].pengguna_id) ?? null : null } : null,
            };
        });
    }
    async papan(fasyankesId) {
        const [bed, ruang] = await Promise.all([this.bedSemua(fasyankesId), db.daftarLokasiUntukOpsi2(fasyankesId, 'ruang', 'O', 500)]);
        const tanpaBed = ruang.filter((r) => !bed.some((b) => b.ruang_id === r.id));
        const tarifTanpa = new Map((await db.daftarTarifRuang(fasyankesId, tanpaBed.map((r) => r.id))).map((t) => [t.id, t]));
        const menunggu = await db.daftarKunjunganUntukPapan(fasyankesId, 'IMP', 'planned', tahapBerjalan, 200, 'ATND', null, 1);
        const orang = new Map((await db.daftarPenggunaUntukNamaPengguna(menunggu.flatMap((k) => k.peserta.map((p) => p.pengguna_id)))).map((u) => [u.id, u.nama]));
        return {
            bed,
            // Ruang rawat inap aktif yang belum punya bed tetap ditampilkan agar admin tahu langkah berikutnya.
            ruang_tanpa_bed: tanpaBed.map((r) => {
                const tr = tarifTanpa.get(r.id);
                return { id: r.id, nama: r.nama, tarif_id: tr?.tarif_id ?? null, tarif_nama: tr?.tarif_nama ?? null, harga_umum: tr?.harga_umum ?? null };
            }),
            menunggu: menunggu.map((k) => ({ kunjungan_id: k.id, pasien_id: k.pasien_id, pasien_nama: k.pasien.nama, pasien_nomor_rm: k.pasien.nomor_rm, mulai: k.mulai.toISOString(), dpjp_nama: k.peserta[0] ? orang.get(k.peserta[0].pengguna_id) ?? null : null })),
            ringkasan: { total: bed.length, terisi: bed.filter((b) => b.status === 'terisi').length, kosong: bed.filter((b) => b.status === 'kosong').length, tidak_operasional: bed.filter((b) => b.status === 'tidak_operasional').length },
        };
    }
    // ---- Asal admisi ----
    async asal(fasyankesId, pasienId) {
        const berjalan = await db.daftarKunjunganUntukAsal(fasyankesId, pasienId, tahapBerjalan);
        const imp = berjalan.find((k) => k.jenis === 'IMP');
        const amb = berjalan.find((k) => k.jenis === 'AMB');
        if (!amb)
            return { asal: null, rawat_inap_id: imp?.id ?? null, ada_pembayaran: false };
        const [poli, tl, bayar] = await Promise.all([
            amb.lokasi_id ? db.cariLokasiUntukAsal(amb.lokasi_id) : null,
            db.cariTindakLanjutUntukAsal(amb.id, 'rawat_inap'),
            db.hitungPembayaranUntukAsal(amb.id),
        ]);
        return { asal: { kunjungan_id: amb.id, tahap_layanan: amb.tahap_layanan, poli_nama: poli?.nama ?? null, cara_pembayaran: amb.cara_pembayaran, spri: tl?.spri ?? null }, rawat_inap_id: imp?.id ?? null, ada_pembayaran: bayar > 0 };
    }
    // ---- Admisi ----
    /**
     * Admisi dalam satu transaksi (pasien dikunci): kunjungan rawat inap, DPJP, penempatan, dan bila berasal dari rawat jalan: kunjungan asal ditutup
     * dan tagihan serta resep belum diserahkan dipindah ke rawat inap. Bed dikunci agar tidak terisi dua pasien.
     */
    async admisi(p, d, sekarang) {
        return db.transaksi(async (tx) => {
            await kunci(tx, 'pasien', p.fasyankesId, d.pasien_id);
            const berjalan = await db.daftarKunjunganUntukAsal(p.fasyankesId, d.pasien_id, tahapBerjalan, tx);
            if (berjalan.some((k) => k.jenis === 'IMP'))
                throw new GalatRi('sudah_inap');
            const asal = berjalan.find((k) => k.jenis === 'AMB') ?? null;
            if (asal && (await db.hitungPembayaranUntukAsal(asal.id, tx)) > 0)
                throw new GalatRi('ada_pembayaran');
            if (d.bed_id)
                await this.pastikanBedBebas(tx, p.fasyankesId, d.bed_id);
            const tl = asal && (await db.cariTindakLanjutUntukAsal(asal.id, 'rawat_inap', tx));
            const tglWib = tanggalWib(sekarang);
            const awalanId = formatIdLayanan(tglWib, 1).slice(0, 9);
            const maksLayanan = await db.hitungMaksUrutanIdLayanan(p.fasyankesId, awalanId, tx);
            const idLayanan = formatIdLayanan(tglWib, maksLayanan + 1);
            const k = await (async () => { const _hasil = await db.tambahKunjunganUntukAdmisi(p.fasyankesId, idLayanan, d.pasien_id, 'IMP', d.bed_id ? 'in-progress' : 'planned', 'pemeriksaan', asal?.id ?? null, asal?.cara_pembayaran ?? d.cara_pembayaran, asal?.nomor_sep ?? null, d.spri ?? tl?.spri ?? null, d.keluhan_singkat ?? asal?.keluhan_singkat ?? null, sekarang, p.oleh, tx); return db.tambahKunjunganUntukDaftarkanHasil(_hasil.id, tx); })();
            await db.tambahPesertaKunjunganUntukDaftarkan(p.fasyankesId, k.id, d.dpjp_id, 'ATND', sekarang, p.oleh, tx);
            for (const id of d.dpjp_bersama)
                await db.tambahPesertaKunjunganUntukDaftarkan(p.fasyankesId, k.id, id, 'SPRF', sekarang, p.oleh, tx);
            if (d.bed_id)
                await this.tempatkan(tx, p, k.id, d.bed_id, d, sekarang);
            if (asal)
                await this.teruskanDariRawatJalan(tx, p, asal.id, k.id, sekarang);
            return { kunjungan_id: k.id, menunggu_ruangan: !d.bed_id };
        });
    }
    /** Bed harus ada, operasional, dan belum dihuni. Pengecekan hunian memakai pembacaan terkunci (data terbaru), karena salinan data transaksi bisa lebih tua dari kunci bed. */
    async pastikanBedBebas(tx, fasyankesId, bedId) {
        await kunci(tx, 'lokasi', fasyankesId, bedId);
        const bed = await db.cariLokasiUntukPastikanBedBebas(bedId, fasyankesId, 'bed', tx);
        if (!bed)
            throw new GalatRi('bed_tidak_sah');
        const dihuni = (await db.kunciPenempatanAktif(fasyankesId, bedId, tx)).length > 0;
        if (dihuni)
            throw new GalatRi('bed_terisi');
        if (bed.status_operasional !== 'O')
            throw new GalatRi('bed_tidak_sah');
    }
    async tempatkan(tx, p, kunjunganId, bedId, d, sekarang) {
        const bed = await db.cariLokasiUntukPastikanBedBebas(bedId, p.fasyankesId, 'bed', tx);
        let tarifId = d.tarif_id ?? null;
        let ruangNama = null;
        if (bed?.induk_id) {
            const [[tr], [ruang]] = await Promise.all([
                db.daftarTarifRuang(p.fasyankesId, [bed.induk_id], tx),
                db.daftarLokasiUntukPetakanAntrean(p.fasyankesId, [bed.induk_id], tx),
            ]);
            ruangNama = ruang?.nama ?? null;
            if (!tarifId)
                tarifId = tr?.tarif_id ?? null;
        }
        if (tarifId && !(await db.hitungTarifLayananUntukTarifKamarSah(tarifId, p.fasyankesId, 'kamar', true, tx)))
            throw new GalatRi('tarif_tidak_sah');
        await db.tambahPenempatanUntukTempatkan(p.fasyankesId, kunjunganId, bedId, tarifId, sekarang, p.oleh, tx, ruangNama, bed?.nama ?? null);
        await db.ubahLokasiUntukTempatkan('U', bedId, tx);
    }
    async teruskanDariRawatJalan(tx, p, asalId, baruId, sekarang) {
        const lama = await db.ambilTagihanUntukTeruskanDariRawatJalan(asalId, tx);
        if (lama) {
            const baru = await (async () => { (await db.simpanTagihanUntukTambahItemTagihanDalam(p.fasyankesId, baruId, p.oleh, tx)); return db.simpanTagihanUntukTambahItemTagihanDalamHasil(baruId, tx); })();
            await db.ubahItemTagihanUntukTeruskanDariRawatJalan(baru.id, lama.id, tx);
            const semua = await db.daftarItemTagihanUntukTambahItemTagihanDalam(baru.id, tx);
            await db.ubahTagihanUntukTambahItemTagihanDalam(semua.every((x) => x.harga !== null) ? 'lengkap' : 'belum_lengkap', baru.id, tx);
        }
        await db.ubahResepUntukTeruskanDariRawatJalan(baruId, asalId, p.fasyankesId, 'diserahkan', tx);
        await selesaiAntreanDalam(tx, p.fasyankesId, asalId, sekarang);
        await db.ubahKunjunganUntukTeruskanDariRawatJalan('finished', 'ditutup', sekarang, tanggalRetensi(sekarang), asalId, tx);
    }
    // ---- Detail dan penempatan ----
    async detail(fasyankesId, kunjunganId) {
        const k = await db.cariKunjunganUntukDetail(kunjunganId, fasyankesId, 'IMP');
        if (!k)
            return null;
        const [pen, peserta, pulang] = await Promise.all([
            db.daftarPenempatanUntukDetail(k.id),
            db.daftarPesertaKunjunganUntukDetail(k.id),
            db.ambilPemulanganUntukDetail(k.id),
        ]);
        const bed = new Map((await db.daftarLokasiUntukDetail(pen.map((x) => x.lokasi_id))).map((l) => [l.id, l]));
        const ruang = new Map((await db.daftarLokasiUntukLaporan([...bed.values()].flatMap((b) => (b.induk_id ? [b.induk_id] : [])))).map((l) => [l.id, l.nama]));
        const tarif = new Map((await db.daftarTarifLayananUntukDetail(pen.flatMap((x) => (x.tarif_id ? [x.tarif_id] : [])))).map((t) => [t.id, t.nama]));
        const orang = new Map((await db.daftarPenggunaUntukNamaPengguna([...peserta.map((x) => x.pengguna_id), ...(pulang ? [pulang.dibuat_oleh] : [])])).map((u) => [u.id, u.nama]));
        return {
            kunjungan: { id: k.id, pasien_id: k.pasien_id, pasien_nama: k.pasien.nama, pasien_nomor_rm: k.pasien.nomor_rm, status: k.status, tahap_layanan: k.tahap_layanan, cara_pembayaran: k.cara_pembayaran, mulai: k.mulai.toISOString(), spri: k.spri },
            penempatan: pen.map((x) => ({
                id: x.id, bed_id: x.lokasi_id, bed_nama: x.bed_nama ?? bed.get(x.lokasi_id)?.nama ?? null, ruang_nama: x.ruang_nama ?? ruang.get(bed.get(x.lokasi_id)?.induk_id ?? 0) ?? null,
                tarif_id: x.tarif_id, tarif_nama: x.tarif_id ? tarif.get(x.tarif_id) ?? null : null, mulai: x.mulai.toISOString(), selesai: x.selesai?.toISOString() ?? null,
            })),
            dpjp: peserta.filter((x) => !x.selesai).map((x) => ({ id: x.pengguna_id, nama: orang.get(x.pengguna_id) ?? '-', tipe: x.tipe })),
            // Riwayat lengkap termasuk DPJP yang periodenya sudah ditutup (mis. setelah pemulangan), untuk rekam medis.
            dpjp_riwayat: peserta.map((x) => ({ id: x.pengguna_id, nama: orang.get(x.pengguna_id) ?? '-', tipe: x.tipe, mulai: x.mulai?.toISOString() ?? null, selesai: x.selesai?.toISOString() ?? null })),
            pemulangan: pulang && { disposisi: pulang.disposisi, kondisi_pulang: pulang.kondisi_pulang, diagnosis_akhir: pulang.diagnosis_akhir, ringkasan: pulang.ringkasan, tindak_lanjut: pulang.tindak_lanjut, waktu: pulang.waktu.toISOString(), dibuat_oleh_nama: orang.get(pulang.dibuat_oleh) ?? null },
        };
    }
    /** Pindah bed (menutup periode lama, membuka yang baru) dan/atau ganti DPJP; kunjungan dikunci agar perubahan serempak berurutan. */
    async ubahPenempatan(p, kunjunganId, d, sekarang) {
        await db.transaksi(async (tx) => {
            await kunci(tx, 'kunjungan', p.fasyankesId, kunjunganId);
            const k = await db.cariKunjunganUntukUbahPenempatan(kunjunganId, p.fasyankesId, tx);
            if (!k)
                throw new GalatRi('tidak_ditemukan');
            if (k.jenis !== 'IMP')
                throw new GalatRi('bukan_inap');
            if (k.tahap_layanan === 'kasir' || k.tahap_layanan === 'ditutup')
                throw new GalatRi('sudah_pulang');
            const sekarangAktif = await db.cariPenempatanUntukUbahPenempatan(kunjunganId, null, tx);
            const bedTujuan = d.bed_id ?? sekarangAktif?.lokasi_id ?? null;
            if (bedTujuan) {
                const sama = sekarangAktif && sekarangAktif.lokasi_id === bedTujuan;
                const penempatanSama = sama && (sekarangAktif.tarif_id ?? null) === (d.tarif_id ?? null);
                if (!penempatanSama) {
                    if (sekarangAktif && !d.alasan?.trim())
                        throw new GalatRi('alasan_pindah');
                    if (!sama)
                        await this.pastikanBedBebas(tx, p.fasyankesId, bedTujuan);
                    if (sekarangAktif) {
                        await db.ubahPenempatanUntukUbahPenempatan(sekarang, sekarangAktif.id, tx);
                        if (!sama)
                            await db.ubahLokasiUntukTempatkan('O', sekarangAktif.lokasi_id, tx);
                    }
                    if (sama) {
                        const bed = await db.cariLokasiUntukPastikanBedBebas(bedTujuan, p.fasyankesId, 'bed', tx);
                        const [ruang] = bed?.induk_id ? await db.daftarLokasiUntukPetakanAntrean(p.fasyankesId, [bed.induk_id], tx) : [];
                        await db.tambahPenempatanUntukTempatkan(p.fasyankesId, kunjunganId, bedTujuan, d.tarif_id ?? null, sekarang, p.oleh, tx, ruang?.nama ?? null, bed?.nama ?? null);
                    }
                    else {
                        await this.tempatkan(tx, p, kunjunganId, bedTujuan, d, sekarang);
                    }
                    if (k.status === 'planned')
                        await db.ubahKunjunganUntukUbahPenempatan('in-progress', kunjunganId, tx);
                }
            }
            await this.terapkanDpjp(tx, p, kunjunganId, d.dpjp_id, d.dpjp_bersama, sekarang);
        });
    }
    async terapkanDpjp(tx, p, kunjunganId, utama, bersama, sekarang) {
        const aktif = await db.daftarPesertaKunjunganUntukTerapkanDpjp(kunjunganId, null, tx);
        const inginkan = [{ id: utama, tipe: 'ATND' }, ...bersama.map((id) => ({ id, tipe: 'SPRF' }))];
        for (const a of aktif) {
            if (!inginkan.some((x) => x.id === a.pengguna_id && x.tipe === a.tipe))
                await db.ubahPesertaKunjunganUntukTerapkanDpjp(sekarang, a.id, tx);
        }
        for (const x of inginkan) {
            if (!aktif.some((a) => a.pengguna_id === x.id && a.tipe === x.tipe)) {
                await db.tambahPesertaKunjunganUntukDaftarkan(p.fasyankesId, kunjunganId, x.id, x.tipe, sekarang, p.oleh, tx);
            }
        }
    }
    // ---- Catatan harian (CPPT) ----
    async daftarCatatan(fasyankesId, kunjunganId) {
        const baris = await db.daftarCppt(fasyankesId, kunjunganId, 200);
        return baris.map((b) => ({ id: b.id, isi: isiCatatan(b), dibuat_oleh: b.dibuat_oleh, dibuat_pada: b.dibuat_pada }));
    }
    async isiCatatan(fasyankesId, id) {
        const b = await db.cariCppt(id, fasyankesId);
        return b && isiCatatan(b);
    }
    async namaPengguna(ids) {
        return new Map((await db.daftarPenggunaUntukNamaPengguna([...new Set(ids)])).map((u) => [u.id, u.nama]));
    }
    async tambahCatatan(fasyankesId, kunjunganId, isi, oleh, pengesahan) {
        return db.transaksi(async (tx) => {
            const tv = isi.tanda_vital ?? {};
            const { id } = await db.tambahPemeriksaan({
                fasyankes_id: fasyankesId,
                kunjungan_id: kunjunganId,
                jenis: 'cppt',
                bagian: 'cppt',
                versi: 1,
                subjek: isi.subjektif,
                objek: isi.objektif,
                asesmen: isi.asesmen,
                plan: isi.rencana,
                instruksi: isi.instruksi,
                suhu: tv.suhu ?? null,
                tensi_sistol: tv.sistolik ?? null,
                tensi_diastol: tv.diastolik ?? null,
                nadi: tv.nadi ?? null,
                respirasi: tv.respirasi ?? null,
                tinggi: tv.tinggi_badan ?? null,
                berat: tv.berat_badan ?? null,
                lingkar_perut: tv.lingkar_perut ?? null,
                spo2: tv.spo2 ?? null,
                gcs: tv.gcs ?? null,
                kesadaran: tv.kesadaran ?? null,
                dibuat_oleh: oleh,
            }, tx);
            await tulisPengesahanDalam(tx, { ...pengesahan(id), fasyankesId, entitas: 'cppt', entitasId: id });
            return id;
        });
    }
    // ---- Pemulangan ----
    /** Pemulangan atomik: catat pemulangan, tutup penempatan dan periode DPJP, kosongkan bed, tambah biaya kamar, lanjutkan kunjungan ke kasir. */
    async pulangkan(p, kunjunganId, d, sekarang) {
        return db.transaksi(async (tx) => {
            await kunci(tx, 'kunjungan', p.fasyankesId, kunjunganId);
            const k = await db.cariKunjunganUntukUbahPenempatan(kunjunganId, p.fasyankesId, tx);
            if (!k)
                throw new GalatRi('tidak_ditemukan');
            if (k.jenis !== 'IMP')
                throw new GalatRi('bukan_inap');
            if (k.tahap_layanan === 'kasir' || k.tahap_layanan === 'ditutup' || (await db.hitungPemulanganUntukPulangkan(kunjunganId, tx)) > 0)
                throw new GalatRi('sudah_pulang');
            await db.tambahPemulanganUntukPulangkan(p.fasyankesId, kunjunganId, d.disposisi, d.kondisi_pulang, d.diagnosis_akhir, d.ringkasan, d.tindak_lanjut, sekarang, p.oleh, tx);
            const aktif = await db.daftarPenempatanUntukPulangkan(kunjunganId, null, tx);
            for (const a of aktif) {
                await db.ubahPenempatanUntukUbahPenempatan(sekarang, a.id, tx);
                await db.ubahLokasiUntukTempatkan('O', a.lokasi_id, tx);
            }
            await db.ubahPesertaKunjunganUntukPulangkan(sekarang, kunjunganId, null, tx);
            const semua = await db.daftarPenempatanUntukPulangkan2(kunjunganId, null, tx);
            const tarif = new Map((await db.daftarTarifLayananUntukPulangkan(semua.flatMap((x) => (x.tarif_id ? [x.tarif_id] : [])), tx)).map((t) => [t.id, t]));
            // Hari kamar per blok 24 jam sejak masuk, bukan per penempatan: pindah bed di hari yang sama tidak ditagih dua kali.
            const item = hitungHariKamar(semua, sekarang).map(({ id: penempatanId, hari }) => {
                const x = semua.find((s) => s.id === penempatanId);
                const t = tarif.get(x.tarif_id);
                return { jenis: 'kamar', tarifId: t.id, kode: t.kode, nama: `${t.nama} (${hari} hari)`, harga: hargaTarif(t, k.cara_pembayaran), orderPenunjangId: null, jumlah: hari };
            });
            if (item.length)
                await tambahItemTagihanDalam(tx, p.fasyankesId, kunjunganId, p.oleh, item);
            await db.ubahKunjunganUntukPulangkan('finished', 'kasir', sekarang, kunjunganId, tx);
            return { pemulangan: sekarang, tagihanKamar: item.length };
        });
    }
}
function isiCatatan(b) {
    const tv = {
        suhu: b.suhu, sistolik: b.tensi_sistol, diastolik: b.tensi_diastol,
        nadi: b.nadi, respirasi: b.respirasi, tinggi_badan: b.tinggi,
        berat_badan: b.berat, lingkar_perut: b.lingkar_perut,
        spo2: b.spo2, gcs: b.gcs, kesadaran: b.kesadaran,
    };
    const adaVital = Object.values(tv).some((v) => v !== null && v !== undefined);
    return {
        subjektif: b.subjek, objektif: b.objek, asesmen: b.asesmen, rencana: b.plan, instruksi: b.instruksi,
        tanda_vital: adaVital ? tv : null,
    };
}
