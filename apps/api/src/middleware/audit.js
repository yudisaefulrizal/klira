import { GALAT } from '@klira/shared';
import { RepositoriAuditMysql } from '../modul/audit/data-access/repositori.js';
/** Penulisan audit gagal; tindakan sensitif harus gagal-aman (lihat dokumen/laporan/pertanyaan.md). */
export class GalatAudit extends Error {
    sebab;
    constructor(sebab) {
        super('Gagal menulis log audit');
        this.sebab = sebab;
    }
}
/** Alamat IP klien; menghormati trust proxy (Express mengisi req.ip). */
export const alamatDari = (req) => req.ip ?? 'tidak-diketahui';
/** Penampung bawaan: menulis hanya-tambah lewat repositori audit. Kegagalan dicatat ke log aplikasi lalu dilempar. */
export class PenampungAuditMysql {
    repo;
    constructor(repo = new RepositoriAuditMysql()) {
        this.repo = repo;
    }
    async catat(entri) {
        try {
            await this.repo.tambah({
                fasyankes_id: entri.fasyankes_id ?? null,
                pengguna_id: entri.pengguna_id ?? null,
                aksi: entri.aksi,
                entitas: entri.entitas.slice(0, 100),
                entitas_id: entri.entitas_id ?? null,
                keterangan: entri.keterangan?.replace(/\s+/g, ' ').slice(0, 255) ?? null,
                alamat: entri.alamat?.slice(0, 64) ?? null,
                waktu: new Date(),
            });
        }
        catch (sebab) {
            console.error('Gagal mencatat audit', { aksi: entri.aksi, entitas: entri.entitas, entitas_id: entri.entitas_id }, sebab);
            throw new GalatAudit(sebab);
        }
    }
}
const penampungBawaan = new PenampungAuditMysql();
/** Layanan pencatatan audit (jalur tunggal). */
export const catatAudit = (entri, penampung = penampungBawaan) => penampung.catat(entri);
/** Pengambil id dari parameter rute; null bila bukan bilangan bulat positif. */
export const idDariParam = (nama = 'id') => (req) => {
    const n = Number(req.params[nama]);
    return Number.isInteger(n) && n > 0 ? n : null;
};
const galat500 = (res) => {
    const badan = { galat: { kode: 'galat_server', pesan: GALAT.umum } };
    res.status(500).json(badan);
};
function entriDari(req, res, aksi, opsi, idLain) {
    const p = res.locals.pengguna;
    const pola = `${req.baseUrl}${req.route?.path ?? ''}`;
    return {
        fasyankes_id: p?.fasyankes_id ?? null,
        pengguna_id: p?.id ?? null,
        aksi,
        entitas: opsi.entitas,
        entitas_id: idLain ?? opsi.id?.(req) ?? null,
        keterangan: opsi.ringkasan ?? `${req.method} ${pola}`,
        alamat: alamatDari(req),
    };
}
/**
 * Fasilitas audit per rute. Pasang setelah wajibMasuk dan wajibIzin:
 *   rute.get('/pasien/:id', masuk, wajibIzin('rekam-medis','lihat'), audit.lihat({ entitas: 'pasien', id: idDariParam() }), ...)
 *   rute.post('/pasien', masuk, wajibIzin(...), audit.input({ entitas: 'pasien' }), ...)
 * Catatan hanya memuat identitas entitas dan ringkasan tetap; isi badan, query, dan hasil tidak disimpan.
 */
export function buatFasilitasAudit(penampung = penampungBawaan) {
    /** lihat: dicatat SEBELUM data dilepas; bila gagal tulis, permintaan ditolak 500 (gagal-aman). */
    const lihat = (opsi) => (req, res, next) => {
        penampung.catat(entriDari(req, res, 'lihat', opsi)).then(() => next(), () => galat500(res));
    };
    /** input/perbaikan: dicatat saat respons sukses (2xx) hendak dikirim; gagal tulis mengubah respons menjadi 500. */
    const tulis = (aksi) => (opsi) => (req, res, next) => {
        const asli = res.json.bind(res);
        res.json = (badan) => {
            if (res.statusCode < 200 || res.statusCode >= 300)
                return asli(badan);
            const idRespons = badan?.data?.id;
            const id = typeof idRespons === 'number' && Number.isInteger(idRespons) ? idRespons : null;
            penampung.catat(entriDari(req, res, aksi, opsi, id)).then(() => asli(badan), () => {
                res.status(500);
                asli({ galat: { kode: 'galat_server', pesan: GALAT.umum } });
            });
            return res;
        };
        next();
    };
    return { lihat, input: tulis('input'), perbaikan: tulis('perbaikan') };
}
