import { ANTREAN_JKN as A, tanggalWib } from '@klira/shared';
import { NikDipakaiError } from '../data-access/repositori.js';
import { bacaPemetaan } from './pemetaan.js';

/** Jarak minimum antarpenarikan per fasyankes; permintaan yang lebih rapat memakai hasil terakhir. */
export const JEDA_TARIK_MS = 15_000;
const BATAS_WAKTU_MS = 8000;
const UKURAN_HALAMAN = 100;
const MAKS_HALAMAN = 20;
const teks = (v) => (v === undefined || v === null ? '' : String(v).trim());
/** yyyy-mm-dd menjadi dd-MM-yyyy (bentuk tanggal PCare) dan sebaliknya. */
const balikTanggal = (t) => t.split('-').reverse().join('-');

/**
 * Antrean online BPJS untuk FKTP. BPJS tidak memanggil klinik: pendaftaran dari Mobile JKN tercatat di PCare, lalu klinik
 * menariknya lewat `GET /pendaftaran/tglDaftar/{dd-MM-yyyy}/{start}/{limit}` ([repo] bridging-bpjs; isi respons [dugaan]).
 * Setiap pendaftaran PCare hari ini yang belum punya antrean di klira dijadikan kunjungan rawat jalan JKN dengan nomor antrean
 * dari penomoran per jenis poli yang sama dengan loket. Pendaftaran yang hilang dari PCare (dibatalkan peserta) membatalkan
 * antrean yang masih menunggu.
 */
export function buatLayananAntreanJkn({ repo, audit, kunjungan, opsiKunjungan, jenisPoliOperasional, klienPcare, enkripsi, sekarang = () => new Date() }) {
    /** Pelaku untuk tindakan yang datang dari Mobile JKN (tanpa akun pengguna). */
    const pelaku = (fasyankesId) => ({ id: null, sistem: 'mobile_jkn' });
    const terakhir = new Map();
    const berjalan = new Map();

    /** Seluruh pendaftaran PCare pada satu tanggal; null bila PCare tidak menjawab dengan benar. */
    async function bacaPendaftaran(klien, tanggal) {
        const semua = [];
        for (let halaman = 0; halaman < MAKS_HALAMAN; halaman += 1) {
            const h = await klien.kirimMentah({ metode: 'GET', jalur: `/pendaftaran/tglDaftar/${balikTanggal(tanggal)}/${halaman * UKURAN_HALAMAN}/${UKURAN_HALAMAN}` });
            const kode = Number(h.metaData?.code);
            if (h.terbaca && kode === 204)
                return semua;
            if (!h.terbaca || kode !== 200 || h.gagalDekripsi || !Array.isArray(h.response?.list))
                return { galat: h.metaData?.message ?? `HTTP ${h.status}` };
            semua.push(...h.response.list);
            if (h.response.list.length < UKURAN_HALAMAN || semua.length >= Number(h.response.count ?? 0))
                return semua;
        }
        return semua;
    }
    async function pasienDari(ps, alamat) {
        const nomorKartu = teks(ps.noKartu);
        const nik = /^\d{16}$/.test(teks(ps.noKTP)) ? teks(ps.noKTP) : null;
        const ada = await repo.cariPasien(nomorKartu, nik);
        if (ada) {
            if (!ada.jkn_nomor_kartu)
                await repo.isiNomorKartu(ada.id, nomorKartu);
            return ada;
        }
        const lahir = balikTanggal(teks(ps.tglLahir));
        if (!teks(ps.nama) || Number.isNaN(Date.parse(lahir)) || !['L', 'P'].includes(teks(ps.sex).toUpperCase()))
            return null;
        const baru = await repo.buatPasien({
            nik, nama: teks(ps.nama).slice(0, 200), tanggal_lahir: lahir, jenis_kelamin: teks(ps.sex).toUpperCase() === 'L' ? 'laki_laki' : 'perempuan',
            nomor_hp: teks(ps.noHP).slice(0, 20) || null, alamat: null, jkn_nomor_kartu: nomorKartu.slice(0, 50),
        });
        await audit.catat({ pengguna_id: null, aksi: 'input', entitas: 'pasien', entitas_id: baru.id, keterangan: 'Pasien baru dari pendaftaran Mobile JKN (belum ada persetujuan umum)', alamat });
        return baru;
    }
    async function jalankanTarik(alamat) {
        const waktu = sekarang();
        const selesai = (hasil) => {
            const lengkap = { baru: 0, batal: 0, dilewati: [], ...hasil, waktu: waktu.toISOString() };
            terakhir.set(fasyankesId, lengkap);
            return lengkap;
        };
        const atur = await repo.pengaturan();
        if (!atur?.aktif)
            return selesai({ status: 'nonaktif', pesan: A.tarik.nonaktif });
        const aktif = await ({ batasWaktuMs: BATAS_WAKTU_MS });
        if (!aktif)
            return selesai({ status: 'gagal', pesan: A.galat.pcareBelum });
        const tanggal = tanggalWib(waktu);
        let daftar;
        try {
            daftar = await bacaPendaftaran(aktif.klien, tanggal);
        }
        catch (galat) {
            return selesai({ status: 'gagal', pesan: galat?.name === 'GalatIntegrasi' ? galat.message : A.galat.tidakTerhubung });
        }
        if (!Array.isArray(daftar))
            return selesai({ status: 'gagal', pesan: A.galat.ditolak(daftar.galat) });
        const peta = bacaPemetaan(await repo.pemetaan());
        // Nomor kartu ikut menjadi kunci: nomor urut yang dilepas peserta lain tidak boleh menutupi pendaftaran baru.
        const kunci = (jenis, noUrut, nomorKartu) => `${String(jenis).toLowerCase()}|${noUrut}|${nomorKartu ?? ''}`;
        const sesiAktif = repo.sesiAntreanAktif ? await repo.sesiAntreanAktif() : true;
        const sudah = sesiAktif ? await repo.antreanPcare(tanggal) : [];
        const sementaraSudah = !sesiAktif && repo.daftarSementaraJkn ? await repo.daftarSementaraJkn() : [];
        const dikenal = new Set([
            ...sudah.map((a) => kunci(a.jenis_poli, a.pcare_no_urut, a.jkn_nomor_kartu)),
            ...sementaraSudah.map((a) => kunci(a.jenis_poli, a.pcare_no_urut, a.jkn_nomor_kartu)),
        ]);
        const diPcare = new Set();
        const dilewati = [];
        let baru = 0;
        for (const d of daftar) {
            const noUrut = teks(d?.noUrut);
            const nomorKartu = teks(d?.peserta?.noKartu);
            const kdPoli = teks(d?.poli?.kdPoli);
            if (!noUrut || !nomorKartu || !kdPoli)
                continue;
            const jenis = peta.jenisPoli(kdPoli);
            if (!jenis) {
                dilewati.push(A.tarik.poliBelumDipetakan(noUrut, d.poli.nmPoli ?? kdPoli));
                continue;
            }
            const poli = await jenisPoliOperasional(jenis);
            if (!poli) {
                dilewati.push(A.tarik.poliTutup(noUrut, jenis));
                continue;
            }
            diPcare.add(kunci(poli.jenis_poli, noUrut, nomorKartu));
            if (dikenal.has(kunci(poli.jenis_poli, noUrut, nomorKartu)))
                continue;
            let pasien;
            try {
                pasien = await pasienDari(d.peserta, alamat);
            }
            catch (e) {
                if (!(e instanceof NikDipakaiError))
                    throw e;
                pasien = null;
            }
            if (!pasien) {
                dilewati.push(A.tarik.dataPesertaKurang(noUrut));
                continue;
            }
            if (!sesiAktif && repo.tambahSementaraJkn) {
                const adaSementara = await repo.cariSementaraJkn?.(fasyankesId, poli.jenis_poli, noUrut.slice(0, 10), nomorKartu);
                if (!adaSementara) {
                    await repo.tambahSementaraJkn({
                        pasien_id: pasien.id, lokasi_id: poli.lokasi_id ?? null,
                        jenis_poli: poli.jenis_poli, awalan: poli.awalan ?? 'A', pcare_no_urut: noUrut.slice(0, 10),
                        jkn_nomor_kartu: nomorKartu.slice(0, 50), keluhan_singkat: teks(d.keluhan).slice(0, 500) || A.tarik.keluhanBawaan,
                        tanggal_daftar: tanggal,
                    });
                    baru += 1;
                }
                continue;
            }
            // Peserta yang sudah didaftarkan petugas di loket untuk poli yang sama: antreannya dikaitkan, tidak dibuat ganda.
            const lama = await repo.antreanPasien(pasien.id, poli.jenis_poli, tanggal);
            if (lama && lama.status !== 'batal' && lama.status !== 'selesai') {
                if (!lama.pcare_no_urut)
                    await repo.kaitkanPcare(lama.id, noUrut);
                continue;
            }
            const h = await kunjungan.daftarkan({
                pasien_id: pasien.id, jenis: 'AMB', jenis_poli: poli.jenis_poli, cara_pembayaran: 'jkn',
                keluhan_singkat: teks(d.keluhan).slice(0, 500) || A.tarik.keluhanBawaan, sumber: 'mobile_jkn', pcare_no_urut: noUrut.slice(0, 10),
            }, alamat);
            if (h.ok)
                baru += 1;
            else
                dilewati.push(A.tarik.gagalDaftar(noUrut, h.pesan));
        }
        // Pendaftaran yang sudah tidak ada di PCare berarti dibatalkan peserta: antrean Mobile JKN yang masih menunggu ikut dibatalkan.
        let batal = 0;
        for (const a of sudah) {
            if (a.sumber !== 'mobile_jkn' || a.status !== 'menunggu' || diPcare.has(kunci(a.jenis_poli, a.pcare_no_urut, a.jkn_nomor_kartu)))
                continue;
            if ((await kunjungan.aksiAntrean(pelaku(), a.id, 'batal', alamat)).ok)
                batal += 1;
        }
        for (const s of sementaraSudah) {
            if (diPcare.has(kunci(s.jenis_poli, s.pcare_no_urut, s.jkn_nomor_kartu)))
                continue;
            if (repo.batalkanSementaraJkn && (await repo.batalkanSementaraJkn(s.id, waktu)).count > 0)
                batal += 1;
        }
        return selesai({ status: 'ok', pesan: A.tarik.ringkas(baru, batal), baru, batal, dilewati });
    }

    return {
        /* ---------- Pengaturan (layar klira) ---------- */
        async ambil() {
            const [atur, baris, opsi] = await Promise.all([repo.pengaturan(), repo.pemetaan(), opsiKunjungan()]);
            const peta = bacaPemetaan(baris);
            return {
                aktif: Boolean(atur?.aktif),
                service_name: atur?.service_name ?? 'antreanfktp',
                user_key_terisi: Boolean(atur?.user_key_terenkripsi),
                poli: opsi.jenis_poli.map((j) => ({ jenis_poli: j.nilai, kode: peta.kodePoli(j.nilai) ?? '' })),
                dokter: opsi.dpjp.map((d) => ({ pengguna_id: d.id, nama: d.nama, kode: peta.kodeDokter(d.id) ?? '' })),
                tarik_terakhir: terakhir.get(1) ?? null,
            };
        },
        async simpan(p, m, alamat) {
            const poli = m.poli.filter((x) => x.kode);
            const dokter = m.dokter.filter((x) => x.kode);
            const ganda = (daftar) => daftar.map((x) => x.kode).find((k, i, semua) => semua.indexOf(k) !== i);
            if (ganda(poli))
                return { ok: false, kode: 'tidak_valid', pesan: A.galat.poliGanda(ganda(poli)), bidang: 'poli' };
            if (ganda(dokter))
                return { ok: false, kode: 'tidak_valid', pesan: A.galat.dokterGanda(ganda(dokter)), bidang: 'dokter' };
            const pemetaan = [
                ...poli.map((x) => ({ jenis: 'poli', kunci: x.jenis_poli, kode: x.kode })),
                ...dokter.map((x) => ({ jenis: 'dokter', kunci: String(x.pengguna_id), kode: x.kode })),
            ];
            await repo.simpan({ aktif: m.aktif, service_name: m.service_name, user_key_terenkripsi: m.user_key ? enkripsi(m.user_key) : null }, pemetaan, p.id);
            await audit.catat({
                pengguna_id: p.id, aksi: 'perbaikan', entitas: 'pengaturan_antrean_jkn',
                keterangan: `Pengaturan antrean online BPJS disimpan (${m.aktif ? 'aktif' : 'nonaktif'}, ${poli.length} poli, ${dokter.length} dokter)${m.user_key ? '; user key diganti' : ''}`, alamat,
            });
            return { ok: true, data: await this.ambil(p) };
        },

        /* ---------- Menarik pendaftaran Mobile JKN dari PCare ---------- */
        /**
         * Tarik pendaftaran PCare hari ini untuk satu fasyankes. Tidak pernah melempar galat.
         * Tanpa `paksa`, penarikan yang berjarak kurang dari JEDA_TARIK_MS mengembalikan hasil terakhir; penarikan serempak digabung.
         * Hasil: { status: ok | nonaktif | gagal, pesan, baru, batal, dilewati[], waktu }.
         */
        async tarik({ paksa = false, alamat = 'sistem' } = {}) {
            const lalu = terakhir.get(1);
            if (!paksa && lalu && sekarang().getTime() - Date.parse(lalu.waktu) < JEDA_TARIK_MS)
                return lalu;
            if (berjalan.has(1))
                return berjalan.get(1);
            const janji = jalankanTarik(alamat)
                .catch((galat) => {
                    console.error('Tarik pendaftaran PCare gagal', galat);
                    const hasil = { status: 'gagal', pesan: A.galat.tidakTerhubung, baru: 0, batal: 0, dilewati: [], waktu: sekarang().toISOString() };
                    terakhir.set(1, hasil);
                    return hasil;
                })
                .finally(() => berjalan.delete(1));
            berjalan.set(1, janji);
            return janji;
        },
        /** Untuk tugas berkala server: tarik antrean online bila aktif. */
        async tarikSemua() {
            if ((await repo.fasyankesAktif()).length)
                await this.tarik();
        },
    };
}
