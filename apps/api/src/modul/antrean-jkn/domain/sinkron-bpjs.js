import { ANTREAN_JKN as A, kodeAntrean } from '@klira/shared';
import { bacaPemetaan } from './pemetaan.js';

/** Batas waktu per panggilan: petugas tidak boleh menunggu lama bila layanan antrean BPJS lambat. */
export const BATAS_WAKTU_ANTREAN_MS = 5000;
const tgl = (d) => new Date(d).toISOString().slice(0, 10);

/**
 * Mengabarkan antrean pasien JKN ke layanan antrean BPJS: tambah (saat daftar di loket), panggil, dan batal.
 * Jalur dan isi badan mengikuti bridging-bpjs (antrean/add, antrean/panggil, antrean/batal).
 * Tidak pernah melempar galat: pendaftaran dan panggilan di klinik tetap berjalan walau BPJS mati; hasilnya dicatat di baris antrean.
 * Hasil: { status: dilewati | terkirim | gagal, pesan }.
 */
export function buatSinkronAntreanBpjs({ repo, klienPcare, dekripsi, sekarang = () => new Date() }) {
    const lewati = { status: 'dilewati', pesan: '' };
    async function kirim(antreanId, jenis) {
        let tercatat = false;
        try {
            const atur = await repo.pengaturan();
            if (!atur?.aktif)
                return lewati;
            const a = await repo.antreanUntukBpjs(antreanId);
            // Hanya rawat jalan pasien JKN yang punya nomor kartu; antrean dari Mobile JKN sudah diketahui BPJS sehingga tidak ditambahkan lagi.
            if (!a || a.jenis !== 'AMB' || a.cara_pembayaran !== 'jkn' || !a.jkn_nomor_kartu)
                return lewati;
            if (jenis === 'tambah' && a.sumber === 'mobile_jkn')
                return lewati;
            const gagal = async (pesan) => {
                await repo.catatSinkron(antreanId, 'gagal', pesan);
                tercatat = true;
                return { status: 'gagal', pesan };
            };
            const peta = bacaPemetaan(await repo.pemetaan());
            const kodepoli = peta.kodePoli(a.jenis_poli);
            if (!kodepoli)
                return gagal(A.galat.poliBelumDipetakan(a.jenis_poli));
            const aktif = await ({
                serviceName: atur.service_name, batasWaktuMs: BATAS_WAKTU_ANTREAN_MS,
                ...(atur.user_key_terenkripsi ? { userKey: dekripsi(atur.user_key_terenkripsi) } : {}),
            });
            if (!aktif)
                return gagal(A.galat.pcareBelum);
            const dasar = { tanggalperiksa: tgl(a.tanggal), kodepoli, nomorkartu: a.jkn_nomor_kartu };
            const permintaan = jenis === 'tambah'
                ? {
                    jalur: '/antrean/add',
                    badan: {
                        nomorkartu: a.jkn_nomor_kartu, nik: a.nik ?? '', nohp: a.nomor_hp ?? '', kodepoli, namapoli: a.jenis_poli, norm: a.nomor_rm, tanggalperiksa: dasar.tanggalperiksa,
                        kodedokter: Number(peta.kodeDokter(a.dokter_id)) || 0, namadokter: a.dokter_nama ?? '', jampraktek: '',
                        nomorantrean: kodeAntrean(a.nomor, a.awalan), angkaantrean: a.nomor, keterangan: '',
                    },
                }
                : jenis === 'panggil' || jenis === 'lewati'
                    // Status BPJS: 1 hadir (dipanggil), 2 tidak hadir (dilewati).
                    ? { jalur: '/antrean/panggil', badan: { ...dasar, status: jenis === 'panggil' ? 1 : 2, waktu: sekarang().getTime() } }
                    : { jalur: '/antrean/batal', badan: { ...dasar, alasan: A.tarik.batalKlinik } };
            const h = await aktif.klien.kirimMentah({ metode: 'POST', ...permintaan });
            const kode = Number(h.metaData?.code);
            // Layanan antrean memakai 200 untuk berhasil dan 201 untuk gagal (berbeda dari PCare, yang memakai 201 untuk data baru).
            if (!h.terbaca || kode !== 200)
                return gagal(A.galat.ditolak(h.metaData?.message ?? `HTTP ${h.status}`));
            await repo.catatSinkron(antreanId, 'terkirim', null);
            return { status: 'terkirim', pesan: '' };
        }
        catch (galat) {
            const pesan = galat?.name === 'GalatIntegrasi' ? galat.message : A.galat.tidakTerhubung;
            if (!tercatat)
                await repo.catatSinkron(antreanId, 'gagal', pesan).catch(() => { });
            return { status: 'gagal', pesan };
        }
    }
    return {
        /** Setelah kunjungan didaftarkan; `kunjungan.antrean.id` adalah antrean yang baru dibuat. */
        async setelahDaftar(p, kunjungan) {
            if (p.sistem === 'mobile_jkn' || !kunjungan?.antrean?.id || kunjungan.cara_pembayaran !== 'jkn')
                return lewati;
            return kirim(kunjungan.antrean.id, 'tambah');
        },
        /** Setelah aksi antrean. Pembatalan yang berasal dari peserta (pendaftaran hilang dari PCare) tidak dikabarkan balik. */
        async setelahAksi(p, antreanId, aksi) {
            if ((aksi !== 'panggil' && aksi !== 'lewati' && aksi !== 'batal') || p.sistem === 'mobile_jkn')
                return lewati;
            return kirim(antreanId, aksi);
        },
    };
}
