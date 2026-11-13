import { createHash } from 'node:crypto';
import { BATAS_PERBAIKAN_JAM } from '@klira/shared';
/** Fungsi murni pengesahan catatan (4.2): isi kanonik, hash SHA-256, pemilihan jenis akun pengesah, batas perbaikan sendiri. */
/** Isi kanonik: JSON dengan kunci berurutan (rekursif), tanpa nilai undefined, tanggal sebagai ISO; urutan larik dipertahankan. */
export function isiKanonik(nilai) {
    const urut = (v) => {
        if (v instanceof Date)
            return v.toISOString();
        if (Array.isArray(v))
            return v.map((x) => (x === undefined ? null : urut(x)));
        if (v && typeof v === 'object') {
            return Object.fromEntries(Object.entries(v)
                .filter(([, x]) => x !== undefined)
                .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
                .map(([k, x]) => [k, urut(x)]));
        }
        return v === undefined ? null : v;
    };
    return JSON.stringify(urut(nilai));
}
/** Hash SHA-256 (heksadesimal 64 karakter) dari isi kanonik. */
export const hashIsi = (isi) => createHash('sha256').update(isiKanonik(isi), 'utf8').digest('hex');
/** Satu jenis akun yang memberi hak, walau akun merangkap: yang berid terkecil (deterministik). Kosong bila hak dari izin tambahan. */
export function pilihJenisAkun(kandidat) {
    return kandidat.length ? [...kandidat].sort((a, b) => a.id - b.id)[0] : null;
}
/** Pembuat boleh memperbaiki tanpa persetujuan dalam 2x24 jam sejak pengesahan terakhir. */
export function bolehPerbaikiSendiri(terakhir, penggunaId, sekarang) {
    return terakhir.pengguna_id === penggunaId && sekarang.getTime() - terakhir.waktu.getTime() <= BATAS_PERBAIKAN_JAM * 3_600_000;
}
