import * as db from '@klira/db';
import { cariIcd, kamusIcd, sistemIcd } from './terminologi-icd.js';
import { mulaiAntreanDalam } from '../../kunjungan/domain/antrean-otomatis.js';
import { alergiTercatat, nomorDokumen, PEMERIKSAAN_BIDANG, samarNomor, umurTahun } from '@klira/shared';
import { sinkronItemTindakanDalam } from '../../kasir/data-access/repositori.js';
import { ambilKunjungan, keDto } from '../../kunjungan/data-access/repositori.js';
import { tulisPengesahanDalam } from '../../rekam-medis/data-access/repositori.js';
/** Penulisan serempak berebut versi yang sama (unique): pemanggil diminta memuat ulang. */
export class BentrokVersiError extends Error {
    constructor() {
        super('bentrok versi catatan');
    }
}
/** Pemetaan kunci tanda_vital API <-> kolom tabel pemeriksaan. */
const PETA_VITAL_KE_KOLOM = {
    suhu: 'suhu', sistolik: 'tensi_sistol', diastolik: 'tensi_diastol',
    nadi: 'nadi', respirasi: 'respirasi', tinggi_badan: 'tinggi',
    berat_badan: 'berat', lingkar_perut: 'lingkar_perut',
    spo2: 'spo2', gcs: 'gcs', kesadaran: 'kesadaran',
};
const bacaVitalDariBaris = (b) => Object.fromEntries(
    Object.entries(PETA_VITAL_KE_KOLOM).map(([kunciApi, kolomDb]) => [kunciApi, b[kolomDb] ?? null]),
);
const tulisVitalKeKolom = (tv = {}) => Object.fromEntries(
    Object.entries(PETA_VITAL_KE_KOLOM).map(([kunciApi, kolomDb]) => [kolomDb, tv[kunciApi] ?? null]),
);
/** Versi aktif suatu bagian = versi pengesahan terakhir (versi kosong, mis. daftar tindakan dikosongkan, tetap terwakili). */
async function versiTerbaru(c, bagian, kunjunganId) {
    const p = await db.cariPengesahanCatatanUntukVersiTerbaru(bagian, kunjunganId, c);
    return p?.versi ?? null;
}
const kosongPemeriksaan = () => Object.fromEntries(PEMERIKSAAN_BIDANG.map((b) => [b, null]));
/** Isi bagian pada versi tertentu. */
async function bacaVersi(c, bagian, kunjunganId, versi) {
    const hasil = await bacaVersiLepas(c, bagian, kunjunganId, versi);
    return hasil;
}
async function bacaVersiLepas(c, bagian, kunjunganId, versi) {
    switch (bagian) {
        case 'diagnosis_banding':
        case 'kie':
        case 'obat_poli': {
            const n = await db.cariNarasiKlinisUntukBacaVersiLepas(kunjunganId, versi ?? -1, bagian, c);
            return n ? { isi: n.isi } : null;
        }
        case 'evaluasi':
        case 'subjek':
        case 'objek':
        case 'asesmen':
        case 'plan':
        case 'instruksi': {
            const p = await db.cariPemeriksaanBagian(kunjunganId, versi ?? -1, bagian, c);
            return p ? { isi: p[bagian] } : null;
        }
        case 'anamnesis': {
            const a = await db.cariPemeriksaanBagian(kunjunganId, versi ?? -1, 'anamnesis', c);
            return a ? {
                keluhan_utama: a.keluhan_utama, penyerta: a.penyerta, riwayat_sekarang: a.riwayat_sekarang, riwayat_pribadi: a.riwayat_pribadi, riwayat_keluarga: a.riwayat_keluarga, kajian_sosial: a.kajian_sosial,
            } : null;
        }
        case 'keperawatan': {
            const p = await db.cariPemeriksaanBagian(kunjunganId, versi ?? -1, 'keperawatan', c);
            return p ? {
                kajian_keperawatan: p.kajian_keperawatan, telah_diobati: p.telah_diobati, alergi: p.alergi, obat_dikonsumsi: p.obat_dikonsumsi,
                diagnosa_keperawatan: p.diagnosa_keperawatan, rencana_asuhan: p.rencana_asuhan,
                nyeri_jenis: p.nyeri_jenis, nyeri_skala: p.nyeri_skala, nyeri_lokasi: p.nyeri_lokasi, nyeri_durasi: p.nyeri_durasi, nyeri_frekuensi: p.nyeri_frekuensi, nyeri_hilang_bila: p.nyeri_hilang_bila,
                gizi_bb_turun: p.gizi_bb_turun, gizi_asupan_kurang: p.gizi_asupan_kurang,
            } : null;
        }
        case 'tanda_vital': {
            const p = await db.cariPemeriksaanBagian(kunjunganId, versi ?? -1, 'tanda_vital', c);
            return p ? bacaVitalDariBaris(p) : null;
        }
        case 'pemeriksaan': {
            const baris = await db.daftarObservasiUntukBacaVersiLepas(kunjunganId, versi ?? -1, 'pemeriksaan', c);
            if (!baris.length)
                return null;
            const isi = kosongPemeriksaan();
            for (const b of baris)
                if (b.bidang in isi)
                    isi[b.bidang] = b.nilai;
            return isi;
        }
        case 'diagnosis': {
            const baris = await db.daftarDiagnosisUntukBacaVersiLepas(kunjunganId, versi ?? -1, c);
            return { item: baris.map((d) => ({ kode: d.kode_icd10, nama: d.nama, peran: d.peran, snomed: d.kode_snomed })) };
        }
        case 'tindakan': {
            const baris = await db.daftarTindakanUntukBacaVersiLepas(kunjunganId, versi ?? -1, c);
            return {
                // Tanpa tarif dan jumlah 1 dibiarkan undefined (tidak masuk hash) agar pengesahan catatan sebelum P5 tetap sah.
                item: baris.map((t) => ({
                    kode: t.kode_icd9cm, nama: t.nama, tarif_layanan_id: t.tarif_layanan_id ?? undefined, jumlah: t.jumlah === 1 ? undefined : t.jumlah,
                    performer_id: t.performer_id, mulai: t.mulai.toISOString(), selesai: t.selesai?.toISOString() ?? null,
                })),
            };
        }
        case 'tindak_lanjut': {
            const t = await db.cariTindakLanjutUntukBacaVersiLepas(kunjunganId, versi ?? -1, c);
            return t ? { jenis: t.jenis, tujuan: t.tujuan, spri: t.spri, catatan: t.catatan } : null;
        }
    }
}
const KOSONG_DAFTAR = { item: [] };
async function bacaTerbaru(c, bagian, kunjunganId) {
    const v = await versiTerbaru(c, bagian, kunjunganId);
    const isi = await bacaVersi(c, bagian, kunjunganId, v);
    if (isi === null && (bagian === 'diagnosis' || bagian === 'tindakan'))
        return KOSONG_DAFTAR;
    return isi;
}
async function tulisIsi(tx, bagian, isi, kunjunganId, versi, oleh, waktu) {
    const dasar = { kunjungan_id: kunjunganId, versi, dibuat_oleh: oleh };
    switch (bagian) {
        case 'diagnosis_banding':
        case 'kie':
        case 'obat_poli': {
            await db.tambahNarasiKlinisUntukTulisIsi(kunjunganId, bagian, isi.isi, versi, oleh, tx);
            return;
        }
        case 'evaluasi':
        case 'subjek':
        case 'objek':
        case 'asesmen':
        case 'plan':
        case 'instruksi': {
            await db.tambahPemeriksaan({ ...dasar, jenis: 'ralan', bagian, [bagian]: isi.isi }, tx);
            return;
        }
        case 'anamnesis': {
            const a = isi;
            await db.tambahPemeriksaan({
                ...dasar, jenis: 'ralan', bagian: 'anamnesis',
                keluhan_utama: a.keluhan_utama, penyerta: a.penyerta, riwayat_sekarang: a.riwayat_sekarang,
                riwayat_pribadi: a.riwayat_pribadi, riwayat_keluarga: a.riwayat_keluarga, kajian_sosial: a.kajian_sosial,
            }, tx);
            return;
        }
        case 'keperawatan': {
            const dataKeperawatan = isi;
            await db.tambahPemeriksaan({
                ...dasar, jenis: 'ralan', bagian: 'keperawatan',
                kajian_keperawatan: dataKeperawatan?.kajian_keperawatan, telah_diobati: dataKeperawatan?.telah_diobati,
                alergi: dataKeperawatan?.alergi, obat_dikonsumsi: dataKeperawatan?.obat_dikonsumsi,
                diagnosa_keperawatan: dataKeperawatan?.diagnosa_keperawatan, rencana_asuhan: dataKeperawatan?.rencana_asuhan,
                nyeri_jenis: dataKeperawatan?.nyeri_jenis ?? 'tidak', nyeri_skala: dataKeperawatan?.nyeri_skala,
                nyeri_lokasi: dataKeperawatan?.nyeri_lokasi, nyeri_durasi: dataKeperawatan?.nyeri_durasi,
                nyeri_frekuensi: dataKeperawatan?.nyeri_frekuensi, nyeri_hilang_bila: dataKeperawatan?.nyeri_hilang_bila,
                gizi_bb_turun: dataKeperawatan?.gizi_bb_turun ?? false, gizi_asupan_kurang: dataKeperawatan?.gizi_asupan_kurang ?? false,
            }, tx);
            return;
        }
        case 'tanda_vital': {
            await db.tambahPemeriksaan({ ...dasar, jenis: 'ralan', bagian: 'tanda_vital', ...tulisVitalKeKolom(isi) }, tx);
            return;
        }
        case 'pemeriksaan': {
            const p = isi;
            const data = PEMERIKSAAN_BIDANG.filter((b) => p[b] !== null).map((b) => ({ ...dasar, kelompok: 'pemeriksaan', bidang: b, nilai: p[b], waktu }));
            await db.tambahBanyakObservasiUntukTulisIsi(data, tx);
            return;
        }
        case 'diagnosis': {
            const d = isi;
            await db.tambahBanyakDiagnosisUntukTulisIsi(d.item.map((x, urutan) => ({ ...dasar, kode_icd10: x.kode, nama: x.nama, kode_snomed: x.snomed, peran: x.peran, urutan })), tx);
            return;
        }
        case 'tindakan': {
            const t = isi;
            await db.tambahBanyakTindakanUntukTulisIsi(t.item.map((x, urutan) => ({
                ...dasar, kode_icd9cm: x.kode, nama: x.nama, tarif_layanan_id: x.tarif_layanan_id ?? null, jumlah: x.jumlah ?? 1,
                performer_id: x.performer_id ?? null, mulai: new Date(x.mulai), selesai: x.selesai ? new Date(x.selesai) : null, urutan,
            })), tx);
            return;
        }
        case 'tindak_lanjut': {
            const t = isi;
            await db.tambahTindakLanjutUntukTulisIsi(kunjunganId, versi, t.jenis, t.tujuan, t.spri, t.catatan, oleh, tx);
            return;
        }
    }
}
const folderKeDto = (k) => ({
    id: k.id, hubungan: k.hubungan, dibatasi: k.dibatasi, pasien: k.dibatasi ? null : { id: k.anggota.id, nama: k.anggota.nama, nomor_rm: k.anggota.nomor_rm },
});
const favoritKeDto = (f) => ({ id: f.id, jenis: f.jenis, kode: f.kode, nama: f.nama, urutan: f.urutan });
const templatKeDto = (t) => ({ id: t.id, bagian: t.bagian, nama: t.nama, isi: t.isi });
export class RepositoriKlinisMysql {
    async kunjungan(id) {
        return db.cariKunjunganUntukKunjungan(id);
    }
    async kunjunganDto(id) {
        if (!(await db.hitungKunjunganUntukKunjunganAda(id)))
            return null;
        return { ...keDto(await ambilKunjungan(db.pool, id)), nomor_dokumen: nomorDokumen(await db.nomorUrutKunjungan(id)) };
    }
    async dataCetak(kunjunganId) {
        const [k, konteks] = await Promise.all([
            db.cariKunjunganUntukDataCetak(kunjunganId),
            this.konteks(kunjunganId),
        ]);
        if (!k || !konteks)
            return null;
        const dto = keDto(await ambilKunjungan(db.pool, kunjunganId));
        const [folder, resep, order, surat, setuju] = await Promise.all([
            db.cariKeluargaPasienUntukDataCetak(k.pasien_id),
            db.daftarResepUntukDataCetak(kunjunganId),
            db.daftarOrderPenunjangUntukDataCetak(kunjunganId),
            db.cariSuratUntukDataCetak(kunjunganId, 'rujukan'),
            db.cariPersetujuanUntukDataCetak(k.pasien_id, 'general', 'diberikan'),
        ]);
        const idValidator = [...new Set(order.flatMap((o) => (o.hasil?.validator_id ? [o.hasil.validator_id] : [])))];
        const validator = new Map((await db.daftarPenggunaUntukNamaPengguna(idValidator)).map((x) => [x.id, x.nama]));
        const p = k.pasien;
        return {
            kepala: { mulai: k.mulai.toISOString(), nomor_antrean: dto.antrean?.kode ?? null, poli: konteks.kunjungan.poli_nama, dokter: konteks.kunjungan.dpjp_nama },
            pasien: {
                nomor_rm: p.nomor_rm, nama: p.nama, nik: samarNomor(p.nik), tanggal_lahir: p.tanggal_lahir.toISOString().slice(0, 10), jenis_kelamin: p.jenis_kelamin === 'laki_laki' ? 'laki_laki' : 'perempuan',
                agama: p.agama, status_kawin: p.status_kawin, kepala_keluarga: folder?.pasien.nama ?? null, folder: folder?.pasien.nomor_rm ?? null, hubungan: folder?.hubungan ?? null,
                nomor_jkn: samarNomor(p.jkn_nomor_kartu),
            },
            resep: resep.map((r) => ({ nomor: r.nomor_resep, teks: r.teks, item: r.item.map((i) => ({ nama: i.master.nama_tampil, jumlah: i.jumlah, satuan: i.master.satuan, aturan_pakai: i.aturan_pakai })) })),
            penunjang: order.map((o) => ({
                nama: o.nama, nilai: o.hasil?.nilai ?? null, satuan: o.hasil?.satuan ?? null, interpretasi: o.hasil?.interpretasi ?? null,
                validator: o.hasil?.validator_id ? validator.get(o.hasil.validator_id) ?? null : null, waktu: (o.hasil?.divalidasi_pada ?? o.hasil?.dientri_pada)?.toISOString() ?? null,
            })),
            rujukan: surat ? { nomor: surat.nomor_surat, tanggal: surat.dibuat_pada.toISOString(), tujuan: surat.tujuan } : null,
            persetujuan_umum: setuju?.waktu.toISOString() ?? null,
        };
    }
    async namaPengguna(id) {
        return (await db.ambilPenggunaUntukTerakhir(id))?.nama ?? '-';
    }
    async penggunaAda(id) {
        return (await db.hitungPenggunaUntukPenggunaAda3(id, true)) > 0;
    }
    bacaBagian(kunjunganId, bagian) {
        return bacaTerbaru(db.pool, bagian, kunjunganId);
    }
    /** Apakah pengguna sedang bertugas sebagai dokter (salah satu jenis akun aktifnya bernama dokter). */
    async penggunaDokter(penggunaId, sekarang) {
        const baris = await db.daftarPenugasanJenisUntukJenisAkunPemberiHak(penggunaId, sekarang, null, sekarang, true, 'klinis', 'input');
        return baris.some((b) => [b.jenis_akun].flat().some((j) => /dokter/i.test(j?.nama ?? '')));
    }
    async simpanBagian(d) {
        try {
            await db.transaksi(async (tx) => {
                // Versi isi mengikuti versi pengesahan; baris yang sama tidak boleh ditulis dua kali (unique) sehingga penulisan serempak gagal bersih.
                await tulisIsi(tx, d.bagian, d.isi, d.kunjunganId, d.pengesahan.versi, d.oleh, d.pengesahan.waktu);
                await tulisPengesahanDalam(tx, d.pengesahan);
                await mulaiAntreanDalam(tx, d.kunjunganId, d.pengesahan.waktu);
            });
        }
        catch (e) {
            if ((db.bentrokUnik(e) || db.transaksiBisaDiulang(e)))
                throw new BentrokVersiError();
            throw e;
        }
    }
    async konteks(kunjunganId) {
        const k = await db.cariKunjunganUntukKonteks(kunjunganId, 'ATND', 1);
        if (!k)
            return null;
        const [poli, dpjp, keperawatanTerbaru, diagnosisTerbaru, observasiTerbaru, kunjunganSebelumnya] = await Promise.all([
            k.lokasi_id ? db.cariLokasiUntukKonteks(k.lokasi_id) : null,
            k.peserta[0] ? db.cariPenggunaUntukKonteks(k.peserta[0].pengguna_id) : null,
            // Alergi adalah data pasien (dikaji perawat, P6): ambil skrining keperawatan terbaru yang terisi, jangan tertimpa kunjungan baru yang tidak mengisinya.
            db.cariKeperawatanUntukKonteks(k.pasien_id, null, ''),
            db.cariDiagnosisUntukKonteks(k.pasien_id),
            db.cariTandaVitalUntukKonteks(k.pasien_id),
            db.hitungKunjunganUntukKonteks(k.pasien_id, k.id),
        ]);
        const diagnosis = diagnosisTerbaru ? await bacaVersi(db.pool, 'diagnosis', diagnosisTerbaru.kunjungan_id, diagnosisTerbaru.versi) : null;
        const tandaVital = observasiTerbaru ? await bacaVersi(db.pool, 'tanda_vital', observasiTerbaru.kunjungan_id, observasiTerbaru.versi) : null;
        return {
            pasien: { id: k.pasien.id, nama: k.pasien.nama, nomor_rm: k.pasien.nomor_rm, jenis_kelamin: k.pasien.jenis_kelamin, umur_tahun: umurTahun(k.pasien.tanggal_lahir.toISOString().slice(0, 10)) },
            kunjungan: {
                id: k.id, id_layanan: k.id_layanan ?? null, jenis: k.jenis, tahap_layanan: k.tahap_layanan, cara_pembayaran: k.cara_pembayaran, poli_nama: poli?.nama ?? null, poli_kategori: poli?.kategori_poli ?? null, dpjp_id: k.peserta[0]?.pengguna_id ?? null, dpjp_nama: dpjp?.nama ?? null, keluhan_singkat: k.keluhan_singkat,
                pasien_baru: kunjunganSebelumnya === 0,
            },
            // Default "tidak ada" berarti tanpa alergi.
            alergi: alergiTercatat(keperawatanTerbaru?.alergi),
            diagnosis_aktif: (diagnosis?.item ?? []).map((d) => ({ kode: d.kode, nama: d.nama })),
            tanda_vital_terakhir: tandaVital,
        };
    }
    async riwayatPasien(pasienId, kecualiKunjunganId, batas) {
        if (!(await db.hitungPasienUntukPasienAda(pasienId)))
            return null;
        const daftar = await db.daftarKunjunganUntukRiwayatPasien(pasienId, (kecualiKunjunganId) ? (kecualiKunjunganId) : undefined, batas);
        if (!daftar.length)
            return [];
        const ids = daftar.map((k) => k.id);
        const peserta = await db.daftarPesertaKunjunganUntukRiwayatPasien(ids);
        const dpjp = new Map();
        for (const x of peserta)
            if (!dpjp.has(x.kunjungan_id))
                dpjp.set(x.kunjungan_id, x.pengguna_id);
        const namaDokter = new Map((dpjp.size ? await db.daftarPenggunaUntukRiwayat([...new Set(dpjp.values())]) : []).map((x) => [x.id, x.nama]));
        const [anamnesis, diagnosis, lanjut, poli] = await Promise.all([
            db.daftarAnamnesisUntukRiwayatPasien(ids),
            db.daftarDiagnosisUntukRiwayatPasien(ids),
            db.daftarTindakLanjutUntukRiwayatPasien(ids),
            db.daftarLokasiUntukPetakanAntrean(daftar.flatMap((k) => (k.lokasi_id ? [k.lokasi_id] : []))),
        ]);
        return daftar.map((k) => {
            const dx = diagnosis.filter((d) => d.kunjungan_id === k.id);
            const versiDx = dx[0]?.versi;
            return {
                id: k.id, id_layanan: k.id_layanan ?? null, mulai: k.mulai.toISOString(), jenis: k.jenis, poli_nama: poli.find((p) => p.id === k.lokasi_id)?.nama ?? null,
                dpjp_id: dpjp.get(k.id) ?? null, dpjp_nama: namaDokter.get(dpjp.get(k.id)) ?? null, tahap_layanan: k.tahap_layanan, cara_pembayaran: k.cara_pembayaran,
                keluhan_utama: anamnesis.find((a) => a.kunjungan_id === k.id)?.keluhan_utama ?? null,
                diagnosis: dx.filter((d) => d.versi === versiDx).map((d) => ({ kode: d.kode_icd10, nama: d.nama, peran: d.peran })),
                tindak_lanjut: lanjut.find((l) => l.kunjungan_id === k.id)?.jenis ?? null,
            };
        });
    }
    /**
     * Histori pemeriksaan rawat jalan pasien: kunjungan AMB yang pemeriksaannya sudah selesai (tahap resep, kasir, atau ditutup), terbaru dahulu,
     * beserta SOAP, tanda vital, diagnosis, dan tindak lanjut versi terbaru. `kecualiKunjunganId` membuang kunjungan yang sedang dibuka.
     */
    async historiRawatJalan(pasienId, kecualiKunjunganId, batas) {
        const riwayat = await this.riwayatPasien(pasienId, kecualiKunjunganId, 100);
        if (!riwayat)
            return null;
        const selesai = ['resep', 'kasir', 'ditutup'];
        const dipilih = riwayat.filter((k) => k.jenis === 'AMB' && selesai.includes(k.tahap_layanan)).slice(0, batas);
        return Promise.all(dipilih.map(async (k) => {
            const [tandaVital, subjek, objek, asesmen, plan] = await Promise.all(['tanda_vital', 'subjek', 'objek', 'asesmen', 'plan'].map((b) => bacaTerbaru(db.pool, b, k.id)));
            return {
                id: k.id, mulai: k.mulai, poli_nama: k.poli_nama, dpjp_nama: k.dpjp_nama, keluhan_utama: k.keluhan_utama, diagnosis: k.diagnosis, tindak_lanjut: k.tindak_lanjut,
                tanda_vital: tandaVital, subjek: subjek?.isi ?? null, objek: objek?.isi ?? null, asesmen: asesmen?.isi ?? null, plan: plan?.isi ?? null,
            };
        }));
    }
    async salinan(sumberId) {
        const k = await db.cariKunjunganUntukSalinan(sumberId);
        if (!k)
            return null;
        const [anamnesis, diagnosis, tindakan] = await Promise.all([
            bacaTerbaru(db.pool, 'anamnesis', k.id),
            bacaTerbaru(db.pool, 'diagnosis', k.id),
            bacaTerbaru(db.pool, 'tindakan', k.id),
        ]);
        return {
            sumber: { id: k.id, mulai: k.mulai.toISOString() },
            anamnesis, diagnosis: diagnosis?.item.length ? diagnosis : null, tindakan: tindakan?.item.length ? tindakan : null,
        };
    }
    async tarifTindakanSah(ids) {
        if (!ids.length)
            return [];
        return db.daftarTarifLayananUntukTarifTindakanSah([...ids], 'tindakan');
    }
    async tindakanKlinik(cari, batas) {
        const q = cari.trim();
        const t = await db.daftarTarifLayananUntukTindakanKlinik('tindakan', true, q, q, q, batas);
        return t.map((x) => ({ id: x.id, kode: x.kode, nama: x.nama, kode_icd9cm: x.kode_icd9cm, harga_umum: x.harga_umum, harga_jkn: x.harga_jkn }));
    }
    sinkronTagihanTindakan(kunjunganId, oleh, item) {
        return db.transaksi((tx) => sinkronItemTindakanDalam(tx, kunjunganId, oleh, item));
    }
    /** Referensi ICD dari JSON primer; sistem lain tetap memakai master terminologi. */
    async kamusTerminologi(q) {
        if (sistemIcd(q.sistem))
            return kamusIcd({ ...q, sistem: q.sistem });
        const [total, data] = await Promise.all([
            db.hitungKodeTerminologiUntukKamusTerminologi(q.sistem, true, (q.awalan) ? (q.awalan) : undefined),
            db.daftarKodeTerminologiUntukKamusTerminologi(q.sistem, true, (q.awalan) ? (q.awalan) : undefined, q.ukuran, (q.halaman - 1) * q.ukuran),
        ]);
        return { data, total, halaman: q.halaman, ukuran: q.ukuran };
    }
    async cariTerminologi(sistem, q, batas) {
        if (sistemIcd(sistem))
            return cariIcd(sistem, q, batas);
        const [kode, namaAwal, namaMemuat] = await Promise.all([
            db.daftarKodeTerminologiUntukCariTerminologi(sistem, true, q, batas),
            db.daftarKodeTerminologiUntukCariTerminologi2(sistem, true, q, batas),
            db.daftarKodeTerminologiUntukCariTerminologi3(sistem, true, q, batas),
        ]);
        const lihat = new Set();
        const hasil = [];
        for (const b of [...kode, ...namaAwal, ...namaMemuat]) {
            if (lihat.has(b.kode))
                continue;
            lihat.add(b.kode);
            hasil.push(b);
        }
        return hasil.slice(0, batas);
    }
    async daftarFavorit(penggunaId, jenis) {
        const baris = await db.daftarFavoritDokterUntukDaftarFavorit(penggunaId, (jenis) ? (jenis) : undefined, 200);
        return baris.map(favoritKeDto);
    }
    async tambahFavorit(penggunaId, d) {
        const terakhir = await db.ringkasanFavoritDokterUntukTambahFavorit(penggunaId, d.jenis);
        try {
            return favoritKeDto(await db.transaksi(async (koneksiBaru) => { const _hasil = await db.tambahFavoritDokterUntukTambahFavorit(penggunaId, (d)?.jenis, (d)?.kode, (d)?.nama, (terakhir._max.urutan ?? -1) + 1, penggunaId, koneksiBaru); return db.tambahFavoritDokterUntukTambahFavoritHasil(_hasil.id, koneksiBaru); }));
        }
        catch (e) {
            if (db.bentrokUnik(e))
                return null;
            throw e;
        }
    }
    async ubahUrutanFavorit(penggunaId, id, urutan) {
        const hasil = await db.ubahFavoritDokterUntukUbahUrutanFavorit(urutan, id, penggunaId);
        if (!hasil.count)
            return null;
        return favoritKeDto(await db.tambahFavoritDokterUntukTambahFavoritHasil(id));
    }
    async hapusFavorit(penggunaId, id) {
        return (await db.hapusFavoritDokterUntukHapusFavorit(id, penggunaId)).count > 0;
    }
    async daftarTemplat(penggunaId, bagian) {
        const baris = await db.daftarTemplatCatatanUntukDaftarTemplat(penggunaId, (bagian) ? (bagian) : undefined, 200);
        return baris.map(templatKeDto);
    }
    async tambahTemplat(penggunaId, d) {
        return templatKeDto(await db.transaksi(async (koneksiBaru) => { const _hasil = await db.tambahTemplatCatatanUntukTambahTemplat(penggunaId, d.bagian, d.nama, d.isi, penggunaId, koneksiBaru); return db.tambahTemplatCatatanUntukTambahTemplatHasil(_hasil.id, koneksiBaru); }));
    }
    async hapusTemplat(penggunaId, id) {
        return (await db.hapusTemplatCatatanUntukHapusTemplat(id, penggunaId)).count > 0;
    }
    async pasienAda(id) {
        return (await db.hitungPasienUntukPasienAda(id)) > 0;
    }
    async folderKeluarga(pasienId) {
        const [wali, anggota] = await Promise.all([
            db.daftarWaliKeluargaUntukFolderKeluarga(pasienId, 50),
            db.daftarKeluargaPasienUntukFolderKeluarga(pasienId, 100),
        ]);
        return { wali: wali.map((w) => ({ id: w.id, hubungan: w.hubungan, nama: w.nama, kontak: w.kontak })), anggota: anggota.map(folderKeDto) };
    }
    async tautkanKeluarga(oleh, pasienId, d) {
        try {
            const k = await db.transaksi(async (koneksiBaru) => { const _hasil = await db.tambahKeluargaPasienUntukTautkanKeluarga(pasienId, d.anggota_pasien_id, d.hubungan, oleh, koneksiBaru); return db.tambahKeluargaPasienUntukTautkanKeluargaHasil(_hasil.id, koneksiBaru); });
            return folderKeDto(k);
        }
        catch (e) {
            if (db.bentrokUnik(e))
                return null;
            throw e;
        }
    }
    async ubahKeluarga(pasienId, id, d) {
        const hasil = await db.ubahKeluargaPasienUntukUbahKeluarga((d)?.hubungan, (d)?.dibatasi, id, pasienId);
        if (!hasil.count)
            return null;
        return folderKeDto(await db.tambahKeluargaPasienUntukTautkanKeluargaHasil(id));
    }
    async bacaDraf(penggunaId, alur, kunjunganId) {
        const d = await db.cariDrafUntukBacaDraf(penggunaId, alur, kunjunganId);
        return d ? { langkah: d.langkah_terakhir, isi: d.isi, diperbarui_pada: d.diperbarui_pada } : null;
    }
    async simpanDraf(d) {
        const isi = d.isi;
        const r = await db.transaksi(async (koneksiBaru) => { (await db.simpanDrafUntukSimpanDraf(d.penggunaId, d.alur, d.kunjunganId, d.pasienId, d.langkah, isi, d.sekarang, d.penggunaId, koneksiBaru)); return db.simpanDrafUntukSimpanDrafHasil(d.penggunaId, d.alur, d.kunjunganId, koneksiBaru); });
        return { langkah: r.langkah_terakhir, isi: r.isi, diperbarui_pada: r.diperbarui_pada };
    }
    async hapusDraf(kunjunganId, penggunaId, alur) {
        // Tanpa alur: hanya draf catatan klinis (draf hasil lab dan persetujuan tindakan tidak ikut terhapus).
        const h = await db.hapusDrafUntukHapusDraf(kunjunganId, (penggunaId !== undefined) ? (penggunaId) : undefined, alur ? [alur] : ['pemeriksaan-klinis', 'skrining']);
        return h.count;
    }
    async bacaOdontogram(pasienId) {
        return db.bacaOdontogramPasien(pasienId);
    }
    async simpanOdontogram(pasienId, kunjunganId, gigi, intraoral, penggunaId) {
        return db.simpanOdontogramPasien(pasienId, kunjunganId, gigi, intraoral, penggunaId);
    }
    async bacaKia(kunjunganId, pasienId) {
        return db.bacaKiaKunjungan(kunjunganId, pasienId);
    }
    async simpanKia(pasienId, kunjunganId, layanan, data, penggunaId) {
        return db.simpanKiaKunjungan(pasienId, kunjunganId, layanan, data, penggunaId);
    }
    async bacaUgd(kunjunganId) {
        return db.bacaUgdKunjungan(kunjunganId);
    }
    async simpanUgd(pasienId, kunjunganId, triase, data, penggunaId) {
        return db.simpanUgdKunjungan(pasienId, kunjunganId, triase, data, penggunaId);
    }
}
