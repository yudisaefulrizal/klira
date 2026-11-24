import * as db from '@klira/db';
import { ambilWilayah } from '../../wilayah/data-access/data.js';
import { pilihRuangPanggil } from '../../kunjungan/data-access/ruang-panggil.js';
import { ANTREAN_LAB, TAHAP_BERJALAN, rentangHariWib, tanggalWib, formatNomorRm, kodeAntrean, statusHasilLabDari, umurTahun } from '@klira/shared';
import { tglIso, tglDb, iso } from '../../../umum/nilai.js';
export class WaliTidakSahError extends Error {
}
/** NIK sudah dipakai pasien lain di fasyankes ini (pelanggaran keunikan saat menyimpan). */
export class NikKembarError extends Error {
}
const tingkatUrutanKunjungan = (k) => {
    if (k.antrean?.status === 'batal')
        return 4;
    if (k.tahap_layanan === 'ditutup')
        return 3;
    if (k.antrean?.status === 'dilayani')
        return 0;
    if (k.antrean?.status === 'dipanggil')
        return 1;
    return 2;
};
const urutkanKunjungan = (a, b) => tingkatUrutanKunjungan(a) - tingkatUrutanKunjungan(b) || (b.mulai.getTime() - a.mulai.getTime()) || (b.id - a.id);
export class RepositoriPasienMysql {
    async cari(f) {
        const { awal, akhir } = rentangHariWib(f.tanggal ?? tanggalWib(new Date()), f.tanggal ?? tanggalWib(new Date()));
        const mulai = { gte: awal, lt: akhir };
        // Pencarian dan daftar `semua` melintasi semua tanggal (tanpa tanggal eksplisit); selain itu daftar berisi kunjungan pada tanggal itu.
        const semua = f.semua === 'true', tanpaTanggal = !!(f.cari || semua || f.semua_tanggal === 'true') && !f.tanggal;
        const tahapSet = f.tahap === 'semua' || f.tahap === 'batal' ? [...TAHAP_BERJALAN, 'ditutup'] : [f.tahap];
        const halaman = Math.floor(f.lewati / f.ambil) + 1;
        if (!f.cari && !semua) {
            // Tanpa pencarian dan tanpa filter tanggal eksplisit: muat antrean sesi aktif saja (bukan arsip antrean sesi sebelumnya).
            if (!f.tanggal && f.semua_tanggal !== 'true') {
                const sesi = await db.ambilSesiAntreanAktif();
                if (!sesi) {
                    const sementara = await db.daftarAntreanSementaraJkn('menunggu');
                    return {
                        data: [], halaman, ukuran: f.ambil, total: 0,
                        jumlah_tahap: { menunggu_skrining: 0, pemeriksaan: 0, resep: 0, kasir: 0, ditutup: 0, batal: 0, rawat_inap: 0 },
                        sesi_antrean: { id: null, status: 'tutup' },
                        antrean_sementara_jkn: sementara,
                    };
                }
                const semuaSesi = await db.daftarKunjunganDalamSesi(sesi.id);
                const milik = f.dpjpId ? semuaSesi.filter((k) => k.peserta.some((p) => p.pengguna_id === f.dpjpId)) : semuaSesi;
                const jumlah = { menunggu_skrining: 0, pemeriksaan: 0, resep: 0, kasir: 0, ditutup: 0, batal: 0, rawat_inap: 0 };
                for (const k of milik) {
                    if (k.antrean?.status === 'batal')
                        jumlah.batal += 1;
                    else {
                        if (k.tahap_layanan in jumlah)
                            jumlah[k.tahap_layanan] += 1;
                        if (k.jenis === 'IMP' && k.tahap_layanan !== 'ditutup')
                            jumlah.rawat_inap += 1;
                    }
                }
                const tersaring = (f.tahap === 'semua'
                    ? milik
                    : f.tahap === 'batal'
                        ? milik.filter((k) => k.antrean?.status === 'batal')
                        : f.tahap === 'rawat_inap'
                            ? milik.filter((k) => k.jenis === 'IMP' && k.antrean?.status !== 'batal' && k.tahap_layanan !== 'ditutup')
                            : milik.filter((k) => k.antrean?.status !== 'batal' && k.tahap_layanan === f.tahap)).slice().sort(urutkanKunjungan);
                const baris = await this.petakan(tersaring.slice(f.lewati, f.lewati + f.ambil).map((k) => ({ pasien: k.pasien, kunjungan: k })));
                return {
                    data: baris, halaman, ukuran: f.ambil, total: tersaring.length, jumlah_tahap: jumlah,
                    sesi_antrean: { id: sesi.id, status: sesi.status, dibuka_pada: sesi.dibuka_pada.toISOString() },
                    antrean_sementara_jkn: [],
                };
            }
            if (f.dpjpId || f.semua_tanggal === 'true') {
                const pakaiRentang = f.semua_tanggal !== 'true' && !tanpaTanggal;
                const semuaHari = await db.daftarKunjunganUntukCari(undefined, undefined, 'batal', false, pakaiRentang ? awal : undefined, pakaiRentang ? akhir : undefined, undefined, undefined, undefined, false, 500, 0, 'ATND', 1);
                const milik = f.dpjpId ? semuaHari.filter((k) => k.peserta.some((p) => p.pengguna_id === f.dpjpId)) : semuaHari;
                const jumlah = { menunggu_skrining: 0, pemeriksaan: 0, resep: 0, kasir: 0, ditutup: 0, batal: 0, rawat_inap: 0 };
                for (const k of milik) {
                    if (k.antrean?.status === 'batal')
                        jumlah.batal += 1;
                    else {
                        if (k.tahap_layanan in jumlah)
                            jumlah[k.tahap_layanan] += 1;
                        if (k.jenis === 'IMP' && k.tahap_layanan !== 'ditutup')
                            jumlah.rawat_inap += 1;
                    }
                }
                const tersaring = (f.tahap === 'semua'
                    ? milik
                    : f.tahap === 'batal'
                        ? milik.filter((k) => k.antrean?.status === 'batal')
                        : f.tahap === 'rawat_inap'
                            ? milik.filter((k) => k.jenis === 'IMP' && k.antrean?.status !== 'batal' && k.tahap_layanan !== 'ditutup')
                            : milik.filter((k) => k.antrean?.status !== 'batal' && k.tahap_layanan === f.tahap)).slice().sort(urutkanKunjungan);
                const baris = await this.petakan(tersaring.slice(f.lewati, f.lewati + f.ambil).map((k) => ({ pasien: k.pasien, kunjungan: k })));
                return { data: baris, halaman, ukuran: f.ambil, total: tersaring.length, jumlah_tahap: jumlah };
            }
            const jumlahTahap = await this.hitungTahap(mulai);
            const [total, kunjungan] = await Promise.all([
                db.hitungKunjunganUntukCari(((f.tahap === 'batal') && (!tanpaTanggal)) ? (awal) : undefined, ((f.tahap === 'batal') && (!tanpaTanggal)) ? (akhir) : undefined, 'batal', f.tahap === 'batal', (((!(f.tahap === 'batal')) && (f.tahap === 'semua')) && (!tanpaTanggal)) ? (awal) : undefined, (((!(f.tahap === 'batal')) && (f.tahap === 'semua')) && (!tanpaTanggal)) ? (akhir) : undefined, (((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) && (!tanpaTanggal)) ? (awal) : undefined, (((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) && (!tanpaTanggal)) ? (akhir) : undefined, ((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) ? (tahapSet) : undefined, (!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))),
                db.daftarKunjunganUntukCari(((f.tahap === 'batal') && (!tanpaTanggal)) ? (awal) : undefined, ((f.tahap === 'batal') && (!tanpaTanggal)) ? (akhir) : undefined, 'batal', f.tahap === 'batal', (((!(f.tahap === 'batal')) && (f.tahap === 'semua')) && (!tanpaTanggal)) ? (awal) : undefined, (((!(f.tahap === 'batal')) && (f.tahap === 'semua')) && (!tanpaTanggal)) ? (akhir) : undefined, (((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) && (!tanpaTanggal)) ? (awal) : undefined, (((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) && (!tanpaTanggal)) ? (akhir) : undefined, ((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) ? (tahapSet) : undefined, (!(f.tahap === 'batal')) && (!(f.tahap === 'semua')), f.ambil, f.lewati, 'ATND', 1),
            ]);
            const baris = await this.petakan(kunjungan.slice().sort(urutkanKunjungan).map((k) => ({ pasien: k.pasien, kunjungan: k })));
            return { data: baris, halaman, ukuran: f.ambil, total, jumlah_tahap: jumlahTahap };
        }
        const jumlahTahap = await this.hitungTahap(mulai);
        const digit = /^\d+$/.test(f.cari);
        const [total, pasien] = await Promise.all([
            db.hitungPasienUntukCari([...TAHAP_BERJALAN], 'batal', f.untuk_kunjungan === 'true', f.cari, f.cari, (digit) && (true), ((f.tahap === 'batal') && (!tanpaTanggal)) ? (awal) : undefined, ((f.tahap === 'batal') && (!tanpaTanggal)) ? (akhir) : undefined, f.tahap === 'batal', (((!(f.tahap === 'batal')) && (f.tahap === 'semua')) && (!tanpaTanggal)) ? (awal) : undefined, (((!(f.tahap === 'batal')) && (f.tahap === 'semua')) && (!tanpaTanggal)) ? (akhir) : undefined, (((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) && (!tanpaTanggal)) ? (awal) : undefined, (((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) && (!tanpaTanggal)) ? (akhir) : undefined, ((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) ? (tahapSet) : undefined, (!(f.tahap === 'batal')) && (!(f.tahap === 'semua')), !(f.tahap === 'semua' && !f.tanggal)),
            db.daftarPasienUntukCari([...TAHAP_BERJALAN], 'batal', f.untuk_kunjungan === 'true', f.cari, f.cari, (digit) && (true), ((f.tahap === 'batal') && (!tanpaTanggal)) ? (awal) : undefined, ((f.tahap === 'batal') && (!tanpaTanggal)) ? (akhir) : undefined, f.tahap === 'batal', (((!(f.tahap === 'batal')) && (f.tahap === 'semua')) && (!tanpaTanggal)) ? (awal) : undefined, (((!(f.tahap === 'batal')) && (f.tahap === 'semua')) && (!tanpaTanggal)) ? (akhir) : undefined, (((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) && (!tanpaTanggal)) ? (awal) : undefined, (((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) && (!tanpaTanggal)) ? (akhir) : undefined, ((!(f.tahap === 'batal')) && (!(f.tahap === 'semua'))) ? (tahapSet) : undefined, (!(f.tahap === 'batal')) && (!(f.tahap === 'semua')), !(f.tahap === 'semua' && !f.tanggal), f.ambil, f.lewati, 1, 'ATND'),
        ]);
        const baris = await this.petakan(pasien.map((p) => ({ pasien: p, kunjungan: p.kunjungan[0] ?? null })));
        return { data: baris, halaman, ukuran: f.ambil, total, jumlah_tahap: jumlahTahap };
    }
    async hitungTahap(mulai) {
        const g = await db.kelompokKunjunganUntukHitungTahap(mulai, 'batal');
        const hasil = { menunggu_skrining: 0, pemeriksaan: 0, resep: 0, kasir: 0, ditutup: 0, batal: await db.hitungKunjunganUntukHitungTahap(mulai, 'batal') };
        for (const r of g)
            hasil[r.tahap_layanan] = r._count._all;
        return hasil;
    }
    /** Susun baris minimal; nama poli dan DPJP diambil sekaligus (hanya milik fasyankes ini). */
    async petakan(isi) {
        const lokasiIds = [...new Set(isi.flatMap((i) => (i.kunjungan?.lokasi_id ? [i.kunjungan.lokasi_id] : [])))];
        const penggunaIds = [...new Set(isi.flatMap((i) => i.kunjungan?.peserta.map((p) => p.pengguna_id) ?? []))];
        const kunjunganIds = isi.flatMap((i) => (i.kunjungan ? [i.kunjungan.id] : []));
        // Aksi Panggil ditahan bila ruang periksa yang memegang antrean ini masih melayani pasien lain (panggil ulang), atau bila antrean
        // belum punya ruang dan semua ruang poli itu sibuk atau dokter pilihan pasien sedang menangani pasien lain.
        const sesiAktif = await db.ambilSesiAntreanAktif();
        const sesiId = sesiAktif?.id ?? null;
        const kandidatPenuh = [];
        const kunciPenuhSet = new Set();
        for (const { kunjungan: k } of isi) {
            if (k?.antrean?.status === 'menunggu' && !k.antrean.ruang_id && k.lokasi_id && k.antrean.jenis_poli !== ANTREAN_LAB.jenis_poli) {
                const dpjp = k.peserta[0]?.pengguna_id;
                const kunci = `${k.lokasi_id}|${dpjp ?? ''}`;
                if (!kunciPenuhSet.has(kunci)) {
                    kunciPenuhSet.add(kunci);
                    kandidatPenuh.push({ kunci, poliId: k.lokasi_id, dpjp });
                }
            }
        }
        const ruangIds = [...new Set(isi.flatMap((i) => (i.kunjungan?.antrean?.ruang_id ? [i.kunjungan.antrean.ruang_id] : [])))];
        const [lokasi, pengguna, antreanSibuk, ringkasanLabBaris, lab, resepBaris, sumberAntreanBaris, ...hasilJenisPenuh] = await Promise.all([
            lokasiIds.length || ruangIds.length ? db.daftarLokasiUntukPetakan([...lokasiIds, ...ruangIds]) : [],
            penggunaIds.length ? db.daftarPenggunaUntukRiwayat(penggunaIds) : [],
            ruangIds.length && sesiId ? db.daftarAntreanSibukUntukPetakan(ruangIds, sesiId) : [],
            kunjunganIds.length ? db.ringkasanHasilLabUntukKunjungan(kunjunganIds) : [],
            kunjunganIds.length ? db.kelompokOrderPenunjangUntukPetakan(kunjunganIds, 'divalidasi') : [],
            kunjunganIds.length ? db.daftarResepUntukPetakan(kunjunganIds) : [],
            kunjunganIds.length ? db.daftarSumberAntreanUntukKunjungan(kunjunganIds) : [],
            ...kandidatPenuh.map(async (p) => [p.kunci, sesiId ? ['ruang_sibuk', 'dokter_sibuk', 'ruang_tidak_operasional'].includes((await pilihRuangPanggil({ poliId: p.poliId, sesiId, dpjpId: p.dpjp ?? null })).galat) : false]),
        ]);
        const sibukPoli = new Map();
        for (const a of antreanSibuk)
            if (!sibukPoli.has(a.ruang_id))
                sibukPoli.set(a.ruang_id, a);
        const jenisSibuk = new Map(hasilJenisPenuh);
        const penuh = new Map();
        for (const { kunjungan: k } of isi)
            if (k?.antrean?.status === 'menunggu' && !k.antrean.ruang_id && k.lokasi_id && k.antrean.jenis_poli !== ANTREAN_LAB.jenis_poli && jenisSibuk.get(`${k.lokasi_id}|${k.peserta[0]?.pengguna_id ?? ''}`))
                penuh.set(k.id, k.antrean.jenis_poli);
        // Ringkasan order lab untuk seluruh kunjungan hari ini: dipakai status hasil lab (`LAB`) dan penanda hasil lab siap (`AMB`).
        const ringkasanLab = new Map(ringkasanLabBaris.map((r) => [r.kunjungan_id, r]));
        const resepAda = new Set(resepBaris.map((r) => r.kunjungan_id));
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
            const r = ringkasanLab.get(kunjunganId);
            const selesai = Number(r?.total ?? 0) > 0 && Number(r.divalidasi) >= Number(r.total);
            return { perlu_spesimen: perluSpesimen, perlu_hasil: perluHasil, selesai };
        };
        // Asal antrean (loket atau Mobile JKN) dan hasil pengiriman status antrean ke BPJS.
        const sumberAntrean = new Map(sumberAntreanBaris.map((r) => [r.kunjungan_id, r]));
        const namaPoli = new Map(lokasi.map((l) => [l.id, l.nama]));
        const namaDpjp = new Map(pengguna.map((p) => [p.id, p.nama]));
        return isi.map(({ pasien: p, kunjungan: k }) => {
            const kunjungan = k && {
                id: k.id, id_layanan: k.id_layanan ?? null, jenis: k.jenis, status: k.status, tahap_layanan: k.tahap_layanan, cara_pembayaran: k.cara_pembayaran,
                poli_nama: k.lokasi_id ? namaPoli.get(k.lokasi_id) ?? null : null,
                ruang_nama: k.antrean?.ruang_id ? namaPoli.get(k.antrean.ruang_id) ?? null : null,
                dpjp_id: k.peserta[0]?.pengguna_id ?? null,
                dpjp_nama: k.peserta[0] ? namaDpjp.get(k.peserta[0].pengguna_id) ?? null : null,
                mulai: iso(k.mulai),
                jenis_poli: k.antrean?.jenis_poli || null,
                antrean: k.antrean ? { id: k.antrean.id, kode: kodeAntrean(k.antrean.nomor, k.antrean.awalan), status: k.antrean.status, sumber: sumberAntrean.get(k.id)?.sumber ?? 'loket', pcare_no_urut: sumberAntrean.get(k.id)?.pcare_no_urut ?? null, bpjs_status: sumberAntrean.get(k.id)?.bpjs_status ?? null, bpjs_pesan: sumberAntrean.get(k.id)?.bpjs_pesan ?? null } : null,
                poli_sibuk: penuh.has(k.id)
                    ? { jenis_poli: penuh.get(k.id), kode: null }
                    : k.antrean && ['menunggu', 'dipanggil', 'dilewati'].includes(k.antrean.status) && k.antrean.ruang_id && sibukPoli.get(k.antrean.ruang_id) && sibukPoli.get(k.antrean.ruang_id).id !== k.antrean.id ? { jenis_poli: k.antrean.jenis_poli, kode: kodeAntrean(sibukPoli.get(k.antrean.ruang_id).nomor, sibukPoli.get(k.antrean.ruang_id).awalan) } : null,
                hasil_lab: k.jenis === 'LAB' && ringkasanLab.has(k.id) ? statusHasilLabDari(ringkasanLab.get(k.id)) : null,
                lab: hitungLab(k.id),
                ada_resep: resepAda.has(k.id),
            };
            return {
                id: p.id, nomor_rm: p.nomor_rm, nama: p.nama, jenis_kelamin: p.jenis_kelamin, umur_tahun: umurTahun(tglIso(p.tanggal_lahir)),
                status_identitas: p.status_identitas,
                // Nama desa/kelurahan dari kode wilayah, untuk membedakan pasien bernama sama di hasil pencarian.
                desa_nama: p.kode_wilayah ? ambilWilayah(p.kode_wilayah)?.nama ?? null : null,
                // Nomor kartu JKN (bila ada) agar petugas langsung tahu pasien berpeserta JKN atau tidak.
                jkn_nomor_kartu: p.jkn_nomor_kartu ?? null,
                kunjungan,
            };
        });
    }
    async detail(id) {
        const p = await db.cariPasienUntukDetail(id);
        if (!p)
            return null;
        return {
            id: p.id, nomor_rm: p.nomor_rm, nik: p.nik, nama: p.nama, nomor_hp: p.nomor_hp, ibu_kandung: p.ibu_kandung, tempat_lahir: p.tempat_lahir, tanggal_lahir: tglIso(p.tanggal_lahir),
            jenis_kelamin: p.jenis_kelamin, agama: p.agama, suku: p.suku, bahasa: p.bahasa, pekerjaan: p.pekerjaan, pendidikan: p.pendidikan, status_kawin: p.status_kawin,
            alamat: p.alamat, kode_wilayah: p.kode_wilayah, nomor_paspor: p.nomor_paspor, nomor_kitas: p.nomor_kitas, jkn_nomor_kartu: p.jkn_nomor_kartu,
            asuransi_nama: p.asuransi_nama, asuransi_nomor_polis: p.asuransi_nomor_polis, status_identitas: p.status_identitas, jalur_identitas: p.jalur_identitas,
            tidak_cakap: p.tidak_cakap, wali: p.wali_keluarga.map((w) => ({ id: w.id, hubungan: w.hubungan, nama: w.nama, kontak: w.kontak })),
        };
    }
    async duplikat(k) {
        const hasil = new Map();
        const ke = (p, alasan) => hasil.set(p.id, { id: p.id, nomor_rm: p.nomor_rm, nama: p.nama, tanggal_lahir: tglIso(p.tanggal_lahir), alasan });
        if (k.nik) {
            for (const p of await db.daftarPasienUntukDuplikat(k.nik, 5))
                ke(p, 'nik');
        }
        if (k.nama && k.tanggal_lahir && k.ibu_kandung) {
            const lain = await db.daftarPasienUntukDuplikat2(k.nama, tglDb(k.tanggal_lahir), k.ibu_kandung, 5);
            for (const p of lain)
                if (!hasil.has(p.id))
                    ke(p, 'nama_lahir_ibu');
        }
        return [...hasil.values()];
    }
    async teksAktif(jenis) {
        const t = await db.cariTeksPersetujuanUntukTeksAktif(jenis, true);
        return t ? { ...t, jenis: t.jenis } : null;
    }
    async teksUntukPakai(id, jenis) {
        return db.cariTeksPersetujuanUntukTeksUntukPakai(id, jenis, true);
    }
    async perbaiki(id, oleh, data) {
        try {
            return await db.transaksi(async (tx) => {
                const ada = await db.kunciPasien(id, tx);
                if (!ada.length)
                    return false;
                const lama = await db.daftarWaliKeluargaUntukPerbaiki(id, tx);
                const ids = data.wali.flatMap((w) => w.id ? [w.id] : []);
                // Keep the IDs referenced by existing consent records; never delete/recreate guardians.
                if (ids.length !== lama.length || ids.some((waliId) => !lama.some((w) => w.id === waliId)))
                    throw new WaliTidakSahError();
                const { wali, tanggal_lahir, ...pasien } = data;
                await db.ubahPasienUntukPerbaiki((pasien)?.nik, (pasien)?.nama, (pasien)?.nomor_hp, (pasien)?.ibu_kandung, (pasien)?.tempat_lahir, tglDb(tanggal_lahir), (pasien)?.jenis_kelamin, (pasien)?.agama, (pasien)?.suku, (pasien)?.bahasa, (pasien)?.pekerjaan, (pasien)?.pendidikan, (pasien)?.status_kawin, (pasien)?.alamat, (pasien)?.kode_wilayah, (pasien)?.nomor_paspor, (pasien)?.nomor_kitas, (pasien)?.jkn_nomor_kartu, (pasien)?.asuransi_nama, (pasien)?.asuransi_nomor_polis, (pasien)?.status_identitas, (pasien)?.jalur_identitas, (pasien)?.tidak_cakap, id, tx);
                for (const { id: waliId, ...w } of wali) {
                    if (waliId)
                        await db.ubahWaliKeluargaUntukPerbaiki((w)?.hubungan, (w)?.nama, (w)?.kontak, waliId, id, tx);
                    else
                        await db.tambahWaliKeluargaUntukPerbaiki(id, (w)?.hubungan, (w)?.nama, (w)?.kontak, oleh, tx);
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
    async daftarkan(oleh, d) {
        // Baris urutan dipastikan ada di luar transaksi agar kenaikan di dalamnya bebas balapan pembuatan pertama.
        try {
            await db.tambahUrutanNomorRmUntukDaftarkan(0);
        }
        catch (e) {
            if (!(db.bentrokUnik(e)))
                throw e;
        }
        try {
            return await db.transaksi(async (tx) => {
                const urutan = await (async () => { (await db.ubahUrutanNomorRmUntukDaftarkan(1, tx)); return db.ubahUrutanNomorRmUntukDaftarkanHasil(tx); })();
                const pasien = await (async () => { const _hasil = await db.tambahPasienUntukDaftarkan(formatNomorRm(urutan.terakhir), d.nik, d.nama, d.nomor_hp, d.ibu_kandung, d.tempat_lahir, tglDb(d.tanggal_lahir), d.jenis_kelamin, d.agama, d.suku, d.bahasa, d.pekerjaan, d.pendidikan, d.status_kawin, d.alamat, d.kode_wilayah, d.nomor_paspor, d.nomor_kitas, d.jkn_nomor_kartu, d.asuransi_nama, d.asuransi_nomor_polis, d.status_identitas, d.jalur_identitas, d.tidak_cakap, oleh, tx); return db.tambahPasienUntukDaftarkanHasil(_hasil.id, tx); })();
                const waliId = [];
                for (const w of d.wali) {
                    const baru = await (async () => { const _hasil = await db.tambahWaliKeluargaUntukPerbaiki(pasien.id, w.hubungan, w.nama, w.kontak, oleh, tx); return db.tambahWaliKeluargaUntukDaftarkanHasil(_hasil.id, tx); })();
                    waliId.push(baru.id);
                }
                const p = d.persetujuan;
                const persetujuan = await (async () => { const _hasil = await db.tambahPersetujuanUntukDaftarkan(pasien.id, 'general', p.teks.id, p.teks.versi, p.teks.tujuan, p.teks.isi, p.bentuk, 'diberikan', p.penandatangan, p.wali_ke != null ? waliId[p.wali_ke] ?? null : null, p.penandatangan_nama, oleh, tx); return db.tambahPersetujuanUntukDaftarkanHasil(_hasil.id, tx); })();
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
