import * as db from '@klira/db';
import { tanggalWib } from '@klira/shared';
import { gagal } from '../../../umum/hasil.js';

const KESADARAN_KE_PCARE = {
    compos_mentis: '01',
    apatis: '01',
    somnolen: '02',
    sopor: '03',
    koma: '04',
};

const balikTanggal = (yyyyMmDd) => yyyyMmDd.split('-').reverse().join('-');
const tanggalDdmmyyyy = (waktu) => balikTanggal(tanggalWib(new Date(waktu)));

/** Petakan baris `pemetaan_bpjs` menjadi lookup cepat untuk poli, dokter, tindakan, dan obat. */
function buatPetaBpjs(baris) {
    const peta = { poli: new Map(), dokter: new Map(), tindakan: new Map(), obat: new Map() };
    for (const b of baris) {
        const k = String(b.kunci ?? '').trim().toLowerCase();
        if (b.jenis === 'poli')
            peta.poli.set(k, b.kode);
        else if (b.jenis === 'dokter')
            peta.dokter.set(String(b.kunci ?? '').trim(), b.kode);
        else if (b.jenis === 'tindakan')
            peta.tindakan.set(k, b.kode);
        else if (b.jenis === 'obat')
            peta.obat.set(k, b.kode);
    }
    return peta;
}

/**
 * Bridging pelayanan & klaim non-kapitasi PCare BPJS (FKTP):
 * 1. Cek kepesertaan aktif (noKartu / NIK)
 * 2. Ambil referensi master PCare & kelola pemetaan tindakan/obat
 * 3. Kirim alur Pendaftaran -> Kunjungan -> Tindakan -> Obat dan simpan `noKunjungan`.
 */
export function buatLayananPelayananPcare({ layananPcare, audit, repo = db, sekarang = () => new Date() }) {
    const sedangDikirim = new Map();
    async function klienAktif() {
        const aktif = await layananPcare.klienAktif();
        if (!aktif)
            return null;
        return aktif.klien;
    }

    return {
        async cekPeserta(nomor, jenis = 'noka') {
            const k = await klienAktif();
            if (!k)
                return gagal('belum_lengkap', 'Kredensial PCare belum diaktifkan.');
            try {
                const h = await k.cekPeserta(nomor, jenis);
                if (!h.ok)
                    return gagal('konflik', h.pesan);
                return { ok: true, data: h.data };
            }
            catch (e) {
                return gagal('konflik', e?.message ?? 'Gagal menghubungi PCare.');
            }
        },

        async referensi(jenis, q = {}) {
            const k = await klienAktif();
            if (!k)
                return gagal('belum_lengkap', 'Kredensial PCare belum diaktifkan.');
            try {
                let h;
                if (jenis === 'poli')
                    h = await k.referensiPoli(q.start ?? 0, q.limit ?? 100);
                else if (jenis === 'dokter')
                    h = await k.referensiDokter(q.start ?? 0, q.limit ?? 100);
                else if (jenis === 'tindakan')
                    h = await k.referensiTindakan(q.kdTkp ?? '10', q.start ?? 0, q.limit ?? 100);
                else if (jenis === 'diagnosa')
                    h = await k.referensiDiagnosa(q.keyword ?? 'A', q.start ?? 0, q.limit ?? 20);
                else if (jenis === 'obat')
                    h = await k.referensiObat(q.keyword ?? 'a', q.start ?? 0, q.limit ?? 20);
                else if (jenis === 'status_pulang')
                    h = await k.referensiStatusPulang(q.rawatInap === true || q.rawatInap === 'true');
                else if (jenis === 'kesadaran')
                    h = await k.referensiKesadaran();
                else if (jenis === 'faskes_rujuk')
                    h = await k.referensiFaskesRujuk({ kdSubSpesialis: q.kdSubSpesialis ?? '', kdSarana: q.kdSarana ?? '1', tglEstRujuk: q.tglEstRujuk ?? tanggalDdmmyyyy(sekarang()) });
                else
                    return gagal('tidak_valid', 'Jenis referensi PCare tidak dikenal.');
                if (!h.ok)
                    return gagal('konflik', h.pesan);
                return { ok: true, data: h.data?.list ?? h.data ?? [] };
            }
            catch (e) {
                return gagal('konflik', e?.message ?? 'Gagal mengambil referensi PCare.');
            }
        },

        async daftarPemetaan(jenis) {
            const semua = await repo.daftarPemetaanBpjs();
            return jenis ? semua.filter((b) => b.jenis === jenis) : semua;
        },

        async simpanPemetaan(p, { jenis, kunci, kode, nama }, alamat) {
            if (!['poli', 'dokter', 'tindakan', 'obat'].includes(jenis))
                return gagal('tidak_valid', 'Jenis pemetaan tidak valid.');
            if (!String(kunci ?? '').trim() || !String(kode ?? '').trim())
                return gagal('tidak_valid', 'Kunci dan kode BPJS wajib diisi.');
            await repo.simpanPemetaanBpjsSatuan(jenis, String(kunci).trim(), String(kode).trim(), nama ?? null);
            await audit.catat({ pengguna_id: p.id, aksi: 'perbaikan', entitas: 'pemetaan_bpjs', entitas_id: null, keterangan: `Pemetaan ${jenis} ${kunci} -> ${kode}`, alamat });
            return { ok: true, data: await this.daftarPemetaan(jenis) };
        },

        async hapusPemetaan(p, { jenis, kunci }, alamat) {
            await repo.hapusPemetaanBpjsSatuan(jenis, String(kunci ?? '').trim());
            await audit.catat({ pengguna_id: p.id, aksi: 'perbaikan', entitas: 'pemetaan_bpjs', entitas_id: null, keterangan: `Hapus pemetaan ${jenis} ${kunci}`, alamat });
            return { ok: true, data: await this.daftarPemetaan(jenis) };
        },

        async simpanAtributKunjungan(p, kunjunganId, { rujuk_lanjut, non_kapitasi }, alamat) {
            const kunj = await repo.ambilKunjunganUntukPcare(kunjunganId);
            if (!kunj)
                return gagal('tidak_ditemukan', 'Kunjungan tidak ditemukan.');
            await repo.ubahAtributPcareKunjungan(kunjunganId, { pcare_rujuk_lanjut: rujuk_lanjut, non_kapitasi });
            await audit.catat({ pengguna_id: p.id, aksi: 'perbaikan', entitas: 'kunjungan', entitas_id: kunjunganId, keterangan: 'Memperbarui atribut PCare kunjungan', alamat });
            return { ok: true, data: await repo.ambilKunjunganUntukPcare(kunjunganId) };
        },

        /** Kirim pelayanan kunjungan (Pendaftaran -> Kunjungan -> Tindakan -> Obat) ke API PCare dan simpan `noKunjungan`. */
        async kirimKunjungan(p, kunjunganId, opsi = {}, alamat = null) {
            const aktifKirim = sedangDikirim.get(kunjunganId);
            if (aktifKirim)
                return aktifKirim;
            const janji = (async () => {
                const kunj = await repo.ambilKunjunganUntukPcare(kunjunganId);
            if (!kunj)
                return gagal('tidak_ditemukan', 'Kunjungan tidak ditemukan.');
            if (kunj.cara_pembayaran !== 'jkn')
                return gagal('konflik', 'Hanya kunjungan JKN yang dapat dikirim ke PCare.');
            if (!kunj.jkn_nomor_kartu)
                return gagal('tidak_valid', 'Nomor kartu BPJS pasien belum diisi.');

            const k = await klienAktif();
            if (!k)
                return gagal('belum_lengkap', 'Kredensial PCare belum diaktifkan.');

            const peta = buatPetaBpjs(await repo.daftarPemetaanBpjs());
            const kdPoli = peta.poli.get(String(kunj.jenis_poli ?? '').trim().toLowerCase());
            const kdDokter = peta.dokter.get(String(kunj.dokter_id ?? '').trim());
            const kdDiag1 = kunj.diagnosis[0]?.kode_icd10 ?? null;
            if (!kdPoli)
                return gagal('belum_lengkap', `Poli "${kunj.jenis_poli ?? '-'}" belum dipetakan ke kode PCare.`);
            if (!kdDokter)
                return gagal('belum_lengkap', 'Dokter penanggung jawab belum dipetakan ke kode PCare.');
            if (!kdDiag1)
                return gagal('tidak_valid', 'Diagnosis utama (ICD-10) wajib diisi sebelum dikirim ke PCare.');

            const tglDaftar = tanggalDdmmyyyy(kunj.mulai);
            const tglPulang = tanggalDdmmyyyy(kunj.waktu_tutup ?? kunj.selesai ?? kunj.mulai);
            const kdTkp = kunj.jenis === 'IMP' ? '20' : '10';
            const rujukLanjut = opsi.rujuk_lanjut ?? kunj.pcare_rujuk_lanjut ?? null;
            const kdStatusPulang = opsi.kdStatusPulang ?? (rujukLanjut ? '6' : kunj.jenis === 'IMP' ? '1' : '4');
            const pem = kunj.pemeriksaan ?? {};
            const keluhan = pem.keluhan_utama || pem.subjek || kunj.keluhan_singkat || 'Kontrol';
            const ttv = {
                sistole: Number(pem.tensi_sistol) || 120,
                diastole: Number(pem.tensi_diastol) || 80,
                beratBadan: Number(pem.berat) || 60,
                tinggiBadan: Number(pem.tinggi) || 160,
                respRate: Number(pem.respirasi) || 20,
                heartRate: Number(pem.nadi) || 80,
            };

            const tahap = opsi.tahap ?? 'semua';
            if (!['semua', 'pendaftaran', 'kunjungan', 'tindakan', 'obat'].includes(tahap))
                return gagal('tidak_valid', 'Tahap pengiriman PCare tidak dikenal.');
            const kirimSemua = tahap === 'semua';

            let noUrut = kunj.pcare_no_urut ?? null;
            let noKunjungan = kunj.pcare_no_kunjungan;
            const itemTerkirim = {
                tindakan: { ...(kunj.pcare_item_terkirim?.tindakan ?? {}) },
                obat: { ...(kunj.pcare_item_terkirim?.obat ?? {}) },
            };
            const catatGagal = async (pesan) => {
                await repo.catatHasilKirimPcare(kunjunganId, { pcare_no_kunjungan: noKunjungan, pcare_status: 'gagal', pcare_pesan: pesan, pcare_dikirim_pada: sekarang(), pcare_item_terkirim: itemTerkirim });
                return gagal('konflik', pesan);
            };

            try {
                // 1. Pendaftaran (bila tahap 'pendaftaran' atau 'semua' dan belum punya pcare_no_urut)
                if ((kirimSemua || tahap === 'pendaftaran') && !noUrut) {
                    const hDaftar = await k.kirimPendaftaran({
                        noKartu: kunj.jkn_nomor_kartu, tglDaftar, kdPoli, keluhan, kunjSakit: true, ...ttv, kdTkp,
                    });
                    if (!hDaftar.ok && !String(hDaftar.pesan ?? '').toLowerCase().includes('sudah terdaftar'))
                        return catatGagal(`Pendaftaran PCare gagal: ${hDaftar.pesan}`);
                    noUrut = hDaftar.noUrut ?? noUrut;
                    if (noUrut && repo.simpanNoUrutPcareKunjungan)
                        await repo.simpanNoUrutPcareKunjungan(kunjunganId, noUrut);
                    if (tahap === 'pendaftaran') {
                        return { ok: true, data: { kunjungan_id: kunjunganId, tahap: 'pendaftaran', no_urut: noUrut } };
                    }
                }
                if (tahap === 'pendaftaran')
                    return { ok: true, data: { kunjungan_id: kunjunganId, tahap: 'pendaftaran', no_urut: noUrut } };

                // 2. Kunjungan (buat baru atau perbarui)
                if (kirimSemua || tahap === 'kunjungan') {
                    const badanKunjungan = {
                        noKunjungan: noKunjungan ?? null,
                        noKartu: kunj.jkn_nomor_kartu,
                        tglDaftar,
                        kdPoli,
                        keluhan,
                        kdSadar: KESADARAN_KE_PCARE[pem.kesadaran] ?? '01',
                        ...ttv,
                        lingkarPerut: Number(pem.lingkar_perut) || 80,
                        kdStatusPulang,
                        tglPulang,
                        kdDokter,
                        kdDiag1,
                        kdDiag2: kunj.diagnosis[1]?.kode_icd10 ?? null,
                        kdDiag3: kunj.diagnosis[2]?.kode_icd10 ?? null,
                        kdTkp,
                        ...(rujukLanjut ? { rujukLanjut } : {}),
                    };

                    if (!noKunjungan) {
                        const hKunj = await k.kirimKunjungan(badanKunjungan);
                        if (!hKunj.ok || !hKunj.noKunjungan)
                            return catatGagal(`Kunjungan PCare gagal: ${hKunj.pesan ?? 'noKunjungan tidak diterima'}`);
                        noKunjungan = hKunj.noKunjungan;
                    }
                    else if (opsi.perbarui) {
                        const hUbah = await k.ubahKunjungan(badanKunjungan);
                        if (!hUbah.ok)
                            return catatGagal(`Pembaruan kunjungan PCare gagal: ${hUbah.pesan}`);
                    }
                }

                if ((tahap === 'tindakan' || tahap === 'obat') && !noKunjungan)
                    return gagal('belum_lengkap', 'Kirim kunjungan PCare terlebih dahulu sebelum mengirim tindakan/obat.');

                // 3. Tindakan terpetakan (lewati yang sudah pernah terkirim agar tidak ganda)
                const tindakanTerkirim = [];
                if (kirimSemua || tahap === 'tindakan') {
                    for (const t of kunj.tindakan) {
                        if (itemTerkirim.tindakan[t.id])
                            continue;
                        const kdTindakan = peta.tindakan.get(String(t.tarif_layanan_id ?? '').toLowerCase())
                            ?? peta.tindakan.get(String(t.kode_icd9cm ?? '').trim().toLowerCase())
                            ?? peta.tindakan.get(String(t.nama ?? '').trim().toLowerCase());
                        if (!kdTindakan)
                            continue;
                        const hTind = await k.kirimTindakan({ kdKunjungan: noKunjungan, kdTindakan, biaya: 0, keterangan: t.nama, hasil: 0 });
                        if (!hTind.ok)
                            return catatGagal(`Kirim tindakan PCare gagal (${t.nama}): ${hTind.pesan}`);
                        itemTerkirim.tindakan[t.id] = hTind.kdTindakanSK ?? kdTindakan;
                        tindakanTerkirim.push({ kdTindakan, kdTindakanSK: hTind.kdTindakanSK });
                    }
                }

                // 4. Obat terpetakan (opsional; lewati yang sudah pernah terkirim)
                const obatTerkirim = [];
                if ((kirimSemua && opsi.kirimObat !== false) || tahap === 'obat') {
                    for (const o of kunj.obat) {
                        if (itemTerkirim.obat[o.id])
                            continue;
                        const kdObat = peta.obat.get(String(o.master_obat_id ?? '').toLowerCase())
                            ?? peta.obat.get(String(o.nama_obat ?? '').trim().toLowerCase());
                        if (!kdObat)
                            continue;
                        const hObt = await k.kirimObat({ kdKunjungan: noKunjungan, racikan: false, kdObat, signa1: 3, signa2: 1, jmlObat: Number(o.jumlah) || 1 });
                        if (!hObt.ok)
                            return catatGagal(`Kirim obat PCare gagal (${o.nama_obat}): ${hObt.pesan}`);
                        itemTerkirim.obat[o.id] = hObt.kdObatSK ?? kdObat;
                        obatTerkirim.push({ kdObat, kdObatSK: hObt.kdObatSK });
                    }
                }

                const waktu = sekarang();
                await repo.catatHasilKirimPcare(kunjunganId, {
                    pcare_no_kunjungan: noKunjungan,
                    pcare_status: 'terkirim',
                    pcare_pesan: null,
                    pcare_dikirim_pada: waktu,
                    pcare_item_terkirim: itemTerkirim,
                });
                await audit.catat({
                    pengguna_id: p?.id ?? null,
                    aksi: 'input',
                    entitas: 'pcare_kunjungan',
                    entitas_id: kunjunganId,
                    keterangan: `Kunjungan ${kunjunganId} terkirim ke PCare (${noKunjungan}, tahap: ${tahap})`,
                    alamat,
                });
                return {
                    ok: true,
                    data: {
                        kunjungan_id: kunjunganId,
                        tahap,
                        no_urut: noUrut,
                        no_kunjungan: noKunjungan,
                        tindakan_terkirim: tindakanTerkirim.length,
                        obat_terkirim: obatTerkirim.length,
                        dikirim_pada: waktu.toISOString(),
                    },
                };
            }
            catch (e) {
                return catatGagal(e?.message ?? 'Gagal menghubungi layanan PCare.');
            }
            })();
            sedangDikirim.set(kunjunganId, janji);
            try {
                return await janji;
            }
            finally {
                sedangDikirim.delete(kunjunganId);
            }
        },
    };
}
