// Pembantu uji antrean JKN: penyimpanan di memori yang melayani repositori antrean JKN dan repositori kunjungan sekaligus,
// serta jembatan fetch ke aplikasi Express tanpa membuka port.
import { kodeAntrean, tanggalWib } from '@klira/shared';
import { panggilTanpaPort } from '../../umum/panggil-tanpa-port.js';

/** Jam sungguhan: simulator Mobile JKN di service-dummy memakai tanggal hari ini. */
export const SEKARANG = () => new Date();
export const TANGGAL = tanggalWib(SEKARANG());
const tglDb = (t) => new Date(`${t}T00:00:00.000Z`);

/** fetch tiruan yang meneruskan permintaan ke aplikasi Express di memori. */
export const jembatan = (app) => async (url, { method = 'GET', headers = {}, body } = {}) => {
    const u = new URL(url);
    const h = await panggilTanpaPort(app, { metode: method, url: `${u.pathname}${u.search}`, headers, badan: body });
    return { status: h.status, ok: h.status >= 200 && h.status < 300, text: async () => h.teks, json: async () => JSON.parse(h.teks) };
};

export function buatMemori() {
    const s = {
        pasien: [], kunjungan: [], antrean: [], atur: null, peta: [], urutRm: 0,
        poli: [{ jenis_poli: 'Umum', awalan: 'U' }, { jenis_poli: 'Gigi', awalan: 'G' }],
        dokter: [{ id: 21, nama: 'dr. Satu', jenis_poli: 'Umum' }],
    };
    const pasienDari = (id) => s.pasien.find((p) => p.id === id);
    const antreanJenis = (jenis, tanggal) => s.antrean.filter((a) => a.jenis_poli === jenis && a.tanggal.getTime() === tglDb(tanggal).getTime());
    const repoJkn = {
        pengaturan: async () => s.atur,
        fasyankesAktif: async () => (s.atur?.aktif ? [s.atur.fasyankes_id] : []),
        pemetaan: async () => s.peta,
        simpan: async (f, d, pemetaan) => {
            s.atur = { ...(s.atur ?? {}), aktif: d.aktif, service_name: d.service_name, ...(d.user_key_terenkripsi ? { user_key_terenkripsi: d.user_key_terenkripsi } : {}) };
            s.peta = pemetaan;
        },
        cariPasien: async (_f, noka, nik) => s.pasien.find((p) => p.jkn_nomor_kartu === noka) ?? s.pasien.find((p) => nik && p.nik === nik) ?? null,
        isiNomorKartu: async (_f, id, noka) => { pasienDari(id).jkn_nomor_kartu ||= noka; },
        buatPasien: async (_f, d) => {
            s.urutRm += 1;
            const p = { id: s.pasien.length + 1, nomor_rm: `RM-${String(s.urutRm).padStart(6, '0')}`, ...d };
            s.pasien.push(p);
            return { id: p.id, nomor_rm: p.nomor_rm };
        },
        antreanPasien: async (_f, pasienId, jenis, tanggal) => antreanJenis(jenis, tanggal).filter((a) => s.kunjungan.find((k) => k.id === a.kunjungan_id).pasien_id === pasienId).at(-1) ?? null,
        antreanPcare: async (_f, tanggal) => s.antrean.filter((a) => a.pcare_no_urut && a.tanggal.getTime() === tglDb(tanggal).getTime())
            .map((a) => ({ id: a.id, jenis_poli: a.jenis_poli, pcare_no_urut: a.pcare_no_urut, status: a.status, sumber: a.sumber, jkn_nomor_kartu: pasienDari(s.kunjungan.find((k) => k.id === a.kunjungan_id).pasien_id).jkn_nomor_kartu })),
        kaitkanPcare: async (_f, id, noUrut) => { s.antrean.find((a) => a.id === id).pcare_no_urut = noUrut; },
        antreanUntukBpjs: async (_f, id) => {
            const a = s.antrean.find((x) => x.id === id);
            if (!a)
                return null;
            const k = s.kunjungan.find((x) => x.id === a.kunjungan_id);
            const p = pasienDari(k.pasien_id);
            const d = s.dokter.find((x) => x.id === k.dpjp_id);
            return { ...a, jenis: k.jenis, cara_pembayaran: k.cara_pembayaran, nomor_rm: p.nomor_rm, nik: p.nik, nomor_hp: p.nomor_hp ?? null, jkn_nomor_kartu: p.jkn_nomor_kartu ?? null, dokter_id: d?.id ?? null, dokter_nama: d?.nama ?? null };
        },
        catatSinkron: async (_f, id, status, pesan) => Object.assign(s.antrean.find((x) => x.id === id), { bpjs_status: status, bpjs_pesan: pesan }),
    };
    const dtoAntrean = (a) => ({ id: a.id, nomor: a.nomor, kode: kodeAntrean(a.nomor, a.awalan), jenis_poli: a.jenis_poli, status: a.status });
    const repoKunjungan = {
        pasienAda: async (_f, id) => Boolean(pasienDari(id)),
        jenisPoliOperasional: async (_f, jenis) => s.poli.find((p) => p.jenis_poli.toLowerCase() === String(jenis).toLowerCase()) ?? null,
        dpjpSah: async (_f, id) => s.dokter.some((d) => d.id === id),
        dokterDiJenis: async (_f, id, jenis) => s.dokter.some((d) => d.id === id && d.jenis_poli === jenis),
        kunjunganBerjalan: async (_f, pasienId) => s.kunjungan.some((k) => k.pasien_id === pasienId && s.antrean.some((a) => a.kunjungan_id === k.id && !['batal', 'selesai'].includes(a.status))),
        daftarkan: async (_f, _oleh, d, waktu) => {
            const k = { id: s.kunjungan.length + 1, pasien_id: d.pasien_id, jenis: d.jenis, cara_pembayaran: d.cara_pembayaran, dpjp_id: d.dpjp_id ?? null };
            s.kunjungan.push(k);
            const tanggal = tglDb(tanggalWib(waktu));
            const nomor = Math.max(0, ...s.antrean.filter((a) => a.awalan === d.awalan && a.tanggal.getTime() === tanggal.getTime()).map((a) => a.nomor)) + 1;
            const a = { id: s.antrean.length + 1, kunjungan_id: k.id, jenis_poli: d.jenis_poli, awalan: d.awalan, tanggal, nomor, status: 'menunggu', sumber: d.sumber === 'mobile_jkn' ? 'mobile_jkn' : 'loket', pcare_no_urut: d.pcare_no_urut ?? null, waktu_daftar: waktu, waktu_panggil: null, bpjs_status: null, bpjs_pesan: null };
            s.antrean.push(a);
            return { id: k.id, pasien_id: k.pasien_id, jenis: k.jenis, cara_pembayaran: k.cara_pembayaran, antrean: dtoAntrean(a) };
        },
        statusAntrean: async (_f, id) => s.antrean.find((a) => a.id === id)?.status ?? null,
        tahapAntrean: async () => 'pemeriksaan',
        ubahAntrean: async (_f, id, aksi, _dari, ke, waktu) => {
            const a = s.antrean.find((x) => x.id === id);
            a.status = ke;
            if (aksi === 'panggil')
                a.waktu_panggil = waktu;
            return dtoAntrean(a);
        },
    };
    return { s, repoJkn, repoKunjungan };
}
