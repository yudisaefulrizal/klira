import { GALAT } from '@klira/shared';
import { gagal } from '../../hasil.js';
/** Tagihan dasar (4.5): baca tagihan kunjungan. Item ditambah oleh modul asalnya (mis. order lab) lewat `tambahItemTagihanDalam`; kasir lengkap menyusul. */
export function buatLayananTagihan({ repo, audit }) {
    return {
        /** Tagihan kunjungan; kunjungan tanpa tagihan mengembalikan tagihan kosong (belum lengkap, belum dibayar). Dicatat `lihat`. */
        async ambil(p, kunjunganId, alamat) {
            if (!(await repo.kunjunganAda(p.fasyankes_id, kunjunganId)))
                return gagal('tidak_ditemukan', GALAT.tidakDitemukan);
            const t = (await repo.ambil(p.fasyankes_id, kunjunganId)) ?? {
                id: null, kunjungan_id: kunjunganId, status_tagihan: 'belum_lengkap', status_pembayaran: 'belum', total: 0, item: [],
            };
            await audit.catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'lihat', entitas: 'tagihan', entitas_id: kunjunganId, keterangan: 'Membuka tagihan kunjungan', alamat });
            return { ok: true, data: t };
        },
    };
}
