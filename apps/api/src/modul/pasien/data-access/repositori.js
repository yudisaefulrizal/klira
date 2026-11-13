import * as db from '@klira/db';
import { ambilWilayah } from '../../wilayah/data-access/data.js';
import { TAHAP_BERJALAN, rentangHariWib, tanggalWib, formatNomorRm, kodeAntrean, umurTahun } from '@klira/shared';
export class WaliTidakSahError extends Error {
}
/** NIK sudah dipakai pasien lain di fasyankes ini (pelanggaran keunikan saat menyimpan). */
export class NikKembarError extends Error {
}
const tgl = (d) => d.toISOString().slice(0, 10);
const tglDb = (t) => new Date(`${t}T00:00:00.000Z`);
const iso = (d) => d.toISOString();
export class RepositoriPasienMysql {
    async cari(fasyankesId, f) {
        const { awal, akhir } = rentangHariWib(f.tanggal ?? tanggalWib(new Date()), f.tanggal ?? tanggalWib(new Date()));
        const mulai = { gte: awal, lt: akhir };
        const jumlahTahap = await this.hitungTahap(fasyankesId, mulai);
        const tahapSet = f.tahap === 'semua' || f.tahap === 'batal' ? [...TAHAP_BERJALAN, 'ditutup'] : [f.tahap];
        const halaman = Math.floor(f.lewati / f.ambil) + 1;
        if (!f.cari) {
            // Tanpa pencarian: kunjungan pada tanggal dan tahap terpilih, yang paling awal dahulu.
            const [total, kunjungan] = await Promise.all([
                db.hitungKunjunganUntukCari(fasyankesId, ((f.tahap === 'batal') && (!(f.cari && !f.tanggal))) ? (awal) : undefined, ((f.tahap === 'batal') && (!(f.cari && !f.tanggal))) ? (akhir) : undefined, 'batal', f.tahap === 'batal', (((!(f.tahap === 'batal')) && (f.tahap === 'semua')) && (!(f.cari && !f.tanggal))) ? (awal) : undefined, (((!(f.tahap === 'batal')) && (f.tahap === 'semua')) && (!(f.cari && !f.tanggal))) ? (akhir) : undefined, (((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) && (!(f.cari && !f.tanggal))) ? (awal) : undefined, (((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) && (!(f.cari && !f.tanggal))) ? (akhir) : undefined, ((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) ? (tahapSet) : undefined, (!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))),
                db.daftarKunjunganUntukCari(fasyankesId, ((f.tahap === 'batal') && (!(f.cari && !f.tanggal))) ? (awal) : undefined, ((f.tahap === 'batal') && (!(f.cari && !f.tanggal))) ? (akhir) : undefined, 'batal', f.tahap === 'batal', (((!(f.tahap === 'batal')) && (f.tahap === 'semua')) && (!(f.cari && !f.tanggal))) ? (awal) : undefined, (((!(f.tahap === 'batal')) && (f.tahap === 'semua')) && (!(f.cari && !f.tanggal))) ? (akhir) : undefined, (((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) && (!(f.cari && !f.tanggal))) ? (awal) : undefined, (((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) && (!(f.cari && !f.tanggal))) ? (akhir) : undefined, ((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) ? (tahapSet) : undefined, (!(f.tahap === 'batal')) && (!(f.tahap === 'semua')), f.ambil, f.lewati, 'ATND', 1),
            ]);
            const baris = await this.petakan(fasyankesId, kunjungan.map((k) => ({ pasien: k.pasien, kunjungan: k })));
            return { data: baris, halaman, ukuran: f.ambil, total, jumlah_tahap: jumlahTahap };
        }
        const digit = /^\d+$/.test(f.cari);
        const [total, pasien] = await Promise.all([
            db.hitungPasienUntukCari(fasyankesId, [...TAHAP_BERJALAN], 'batal', f.untuk_kunjungan === 'true', f.cari, f.cari, (digit) && (true), ((f.tahap === 'batal') && (!(f.cari && !f.tanggal))) ? (awal) : undefined, ((f.tahap === 'batal') && (!(f.cari && !f.tanggal))) ? (akhir) : undefined, f.tahap === 'batal', (((!(f.tahap === 'batal')) && (f.tahap === 'semua')) && (!(f.cari && !f.tanggal))) ? (awal) : undefined, (((!(f.tahap === 'batal')) && (f.tahap === 'semua')) && (!(f.cari && !f.tanggal))) ? (akhir) : undefined, (((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) && (!(f.cari && !f.tanggal))) ? (awal) : undefined, (((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) && (!(f.cari && !f.tanggal))) ? (akhir) : undefined, ((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) ? (tahapSet) : undefined, (!(f.tahap === 'batal')) && (!(f.tahap === 'semua')), !(f.tahap === 'semua' && !f.tanggal)),
            db.daftarPasienUntukCari(fasyankesId, [...TAHAP_BERJALAN], 'batal', f.untuk_kunjungan === 'true', f.cari, f.cari, (digit) && (true), ((f.tahap === 'batal') && (!(f.cari && !f.tanggal))) ? (awal) : undefined, ((f.tahap === 'batal') && (!(f.cari && !f.tanggal))) ? (akhir) : undefined, f.tahap === 'batal', (((!(f.tahap === 'batal')) && (f.tahap === 'semua')) && (!(f.cari && !f.tanggal))) ? (awal) : undefined, (((!(f.tahap === 'batal')) && (f.tahap === 'semua')) && (!(f.cari && !f.tanggal))) ? (akhir) : undefined, (((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) && (!(f.cari && !f.tanggal))) ? (awal) : undefined, (((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) && (!(f.cari && !f.tanggal))) ? (akhir) : undefined, ((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) ? (tahapSet) : undefined, (!(f.tahap === 'batal')) && (!(f.tahap === 'semua')), !(f.tahap === 'semua' && !f.tanggal), f.ambil, f.lewati, 1, 'ATND'),
        ]);
        const baris = await this.petakan(fasyankesId, pasien.map((p) => ({ pasien: p, kunjungan: p.kunjungan[0] ?? null })));
        return { data: baris, halaman, ukuran: f.ambil, total, jumlah_tahap: jumlahTahap };
    }
    async hitungTahap(fasyankesId, mulai) {
        const g = await db.kelompokKunjunganUntukHitungTahap(fasyankesId, mulai, 'batal');
        const hasil = { menunggu_skrining: 0, pemeriksaan: 0, resep: 0, kasir: 0, ditutup: 0, batal: await db.hitungKunjunganUntukHitungTahap(fasyankesId, mulai, 'batal') };
        for (const r of g)
            hasil[r.tahap_layanan] = r._count._all;
        return hasil;
    }
    /** Susun baris minimal; nama poli dan DPJP diambil sekaligus (hanya milik fasyankes ini). */
    async petakan(fasyankesId, isi) {
        const lokasiIds = [...new Set(isi.flatMap((i) => (i.kunjungan?.lokasi_id ? [i.kunjungan.lokasi_id] : [])))];
        const penggunaIds = [...new Set(isi.flatMap((i) => i.kunjungan?.peserta.map((p) => p.pengguna_id) ?? []))];
        const [lokasi, pengguna] = await Promise.all([
            lokasiIds.length ? db.daftarLokasiUntukPetakan(lokasiIds, fasyankesId) : [],
            penggunaIds.length ? db.daftarPenggunaUntukRiwayat(penggunaIds, fasyankesId) : [],
        ]);
        const kunjunganIds = isi.flatMap((i) => (i.kunjungan ? [i.kunjungan.id] : []));
        const lab = kunjunganIds.length
            ? await db.kelompokOrderPenunjangUntukPetakan(fasyankesId, kunjunganIds, 'divalidasi')
            : [];
        const resepAda = new Set(kunjunganIds.length ? (await db.daftarResepUntukPetakan(fasyankesId, kunjunganIds)).map((r) => r.kunjungan_id) : []);
        const hitungLab = (kunjunganId) => {
            let perluSpesimen = 0;
            let perluHasil = 0;
            for (const g of lab) {
                if (g.kunjungan_id !== kunjunganId)
                    continue;
                if (g.status === 'dipesan')
                    perluSpesimen += g._count._all;
                else
                    perluHasil += g._count._all;
            }
            return { perlu_spesimen: perluSpesimen, perlu_hasil: perluHasil };
        };
        const namaPoli = new Map(lokasi.map((l) => [l.id, l.nama]));
        const namaDpjp = new Map(pengguna.map((p) => [p.id, p.nama]));
        return isi.map(({ pasien: p, kunjungan: k }) => {
            const kunjungan = k && {
                id: k.id, jenis: k.jenis, status: k.status, tahap_layanan: k.tahap_layanan, cara_pembayaran: k.cara_pembayaran,
                poli_nama: k.lokasi_id ? namaPoli.get(k.lokasi_id) ?? null : null,
                dpjp_nama: k.peserta[0] ? namaDpjp.get(k.peserta[0].pengguna_id) ?? null : null,
                mulai: iso(k.mulai),
                antrean: k.antrean ? { id: k.antrean.id, kode: kodeAntrean(k.antrean.nomor), status: k.antrean.status } : null,
                lab: hitungLab(k.id),
                ada_resep: resepAda.has(k.id),
            };
            return {
                id: p.id, nomor_rm: p.nomor_rm, nama: p.nama, jenis_kelamin: p.jenis_kelamin, umur_tahun: umurTahun(tgl(p.tanggal_lahir)),
                status_identitas: p.status_identitas,
                // Nama desa/kelurahan dari kode wilayah, untuk membedakan pasien bernama sama di hasil pencarian.
                desa_nama: p.kode_wilayah ? ambilWilayah(p.kode_wilayah)?.nama ?? null : null,
                kunjungan,
            };
        });
    }
    async detail(fasyankesId, id) {
        const p = await db.cariPasienUntukDetail(id, fasyankesId);
        if (!p)
            return null;
        return {
            id: p.id, nomor_rm: p.nomor_rm, nik: p.nik, nama: p.nama, nomor_hp: p.nomor_hp, ibu_kandung: p.ibu_kandung, tempat_lahir: p.tempat_lahir, tanggal_lahir: tgl(p.tanggal_lahir),
            jenis_kelamin: p.jenis_kelamin, agama: p.agama, suku: p.suku, bahasa: p.bahasa, pekerjaan: p.pekerjaan, pendidikan: p.pendidikan, status_kawin: p.status_kawin,
            alamat: p.alamat, kode_wilayah: p.kode_wilayah, nomor_paspor: p.nomor_paspor, nomor_kitas: p.nomor_kitas, jkn_nomor_kartu: p.jkn_nomor_kartu,
            asuransi_nama: p.asuransi_nama, asuransi_nomor_polis: p.asuransi_nomor_polis, status_identitas: p.status_identitas, jalur_identitas: p.jalur_identitas,
            tidak_cakap: p.tidak_cakap, wali: p.wali_keluarga.map((w) => ({ id: w.id, hubungan: w.hubungan, nama: w.nama, kontak: w.kontak })),
        };
    }
    async duplikat(fasyankesId, k) {
        const hasil = new Map();
        const ke = (p, alasan) => hasil.set(p.id, { id: p.id, nomor_rm: p.nomor_rm, nama: p.nama, tanggal_lahir: tgl(p.tanggal_lahir), alasan });
        if (k.nik) {
            for (const p of await db.daftarPasienUntukDuplikat(fasyankesId, k.nik, 5))
                ke(p, 'nik');
        }
        if (k.nama && k.tanggal_lahir && k.ibu_kandung) {
            const lain = await db.daftarPasienUntukDuplikat2(fasyankesId, k.nama, tglDb(k.tanggal_lahir), k.ibu_kandung, 5);
            for (const p of lain)
                if (!hasil.has(p.id))
                    ke(p, 'nama_lahir_ibu');
        }
        return [...hasil.values()];
    }
    async teksAktif(fasyankesId, jenis) {
        // Teks klinik sendiri didahulukan, lalu teks bawaan; yang aktif dengan versi tertinggi.
        for (const fas of [fasyankesId, null]) {
            const t = await db.cariTeksPersetujuanUntukTeksAktif(fas, jenis, true);
            if (t)
                return { ...t, jenis: t.jenis };
        }
        return null;
    }
    async teksUntukPakai(fasyankesId, id, jenis) {
        return db.cariTeksPersetujuanUntukTeksUntukPakai(id, jenis, true, fasyankesId, null);
    }
    async perbaiki(fasyankesId, id, oleh, data) {
        try {
            return await db.transaksi(async (tx) => {
                const ada = await db.kunciPasien(id, fasyankesId, tx);
                if (!ada.length)
                    return false;
                const lama = await db.daftarWaliKeluargaUntukPerbaiki(id, fasyankesId, tx);
                const ids = data.wali.flatMap((w) => w.id ? [w.id] : []);
                // Keep the IDs referenced by existing consent records; never delete/recreate guardians.
                if (ids.length !== lama.length || ids.some((waliId) => !lama.some((w) => w.id === waliId)))
                    throw new WaliTidakSahError();
                const { wali, tanggal_lahir, ...pasien } = data;
                await db.ubahPasienUntukPerbaiki((pasien)?.nik, (pasien)?.nama, (pasien)?.nomor_hp, (pasien)?.ibu_kandung, (pasien)?.tempat_lahir, tglDb(tanggal_lahir), (pasien)?.jenis_kelamin, (pasien)?.agama, (pasien)?.suku, (pasien)?.bahasa, (pasien)?.pekerjaan, (pasien)?.pendidikan, (pasien)?.status_kawin, (pasien)?.alamat, (pasien)?.kode_wilayah, (pasien)?.nomor_paspor, (pasien)?.nomor_kitas, (pasien)?.jkn_nomor_kartu, (pasien)?.asuransi_nama, (pasien)?.asuransi_nomor_polis, (pasien)?.status_identitas, (pasien)?.jalur_identitas, (pasien)?.tidak_cakap, id, fasyankesId, tx);
                for (const { id: waliId, ...w } of wali) {
                    if (waliId)
                        await db.ubahWaliKeluargaUntukPerbaiki((w)?.hubungan, (w)?.nama, (w)?.kontak, waliId, id, fasyankesId, tx);
                    else
                        await db.tambahWaliKeluargaUntukPerbaiki(fasyankesId, id, (w)?.hubungan, (w)?.nama, (w)?.kontak, oleh, tx);
                }
                return true;
            });
        }
        catch (e) {
            if (db.bentrokUnik(e) && db.pesanGalat(e).includes('nik'))
                throw new NikKembarError();
            throw e;
        }
    }
    async daftarkan(fasyankesId, oleh, d) {
        // Baris urutan dipastikan ada di luar transaksi agar kenaikan di dalamnya bebas balapan pembuatan pertama.
        try {
            await db.tambahUrutanNomorRmUntukDaftarkan(fasyankesId, 0);
        }
        catch (e) {
            if (!(db.bentrokUnik(e)))
                throw e;
        }
        try {
            return await db.transaksi(async (tx) => {
                const urutan = await (async () => { (await db.ubahUrutanNomorRmUntukDaftarkan(1, fasyankesId, tx)); return db.ubahUrutanNomorRmUntukDaftarkanHasil(fasyankesId, tx); })();
                const pasien = await (async () => { const _hasil = await db.tambahPasienUntukDaftarkan(fasyankesId, formatNomorRm(urutan.terakhir), d.nik, d.nama, d.nomor_hp, d.ibu_kandung, d.tempat_lahir, tglDb(d.tanggal_lahir), d.jenis_kelamin, d.agama, d.suku, d.bahasa, d.pekerjaan, d.pendidikan, d.status_kawin, d.alamat, d.kode_wilayah, d.nomor_paspor, d.nomor_kitas, d.jkn_nomor_kartu, d.asuransi_nama, d.asuransi_nomor_polis, d.status_identitas, d.jalur_identitas, d.tidak_cakap, oleh, tx); return db.tambahPasienUntukDaftarkanHasil(_hasil.id, tx); })();
                const waliId = [];
                for (const w of d.wali) {
                    const baru = await (async () => { const _hasil = await db.tambahWaliKeluargaUntukPerbaiki(fasyankesId, pasien.id, w.hubungan, w.nama, w.kontak, oleh, tx); return db.tambahWaliKeluargaUntukDaftarkanHasil(_hasil.id, tx); })();
                    waliId.push(baru.id);
                }
                const p = d.persetujuan;
                const persetujuan = await (async () => { const _hasil = await db.tambahPersetujuanUntukDaftarkan(fasyankesId, pasien.id, 'general', p.teks.id, p.teks.versi, p.teks.tujuan, p.teks.isi, p.bentuk, 'diberikan', p.penandatangan, p.wali_ke != null ? waliId[p.wali_ke] ?? null : null, p.penandatangan_nama, oleh, tx); return db.tambahPersetujuanUntukDaftarkanHasil(_hasil.id, tx); })();
                return { id: pasien.id, nomor_rm: pasien.nomor_rm, nama: pasien.nama, status_identitas: pasien.status_identitas, persetujuan_id: persetujuan.id };
            });
        }
        catch (e) {
            if (db.bentrokUnik(e) && db.pesanGalat(e).includes('nik'))
                throw new NikKembarError();
            throw e;
        }
    }
}
