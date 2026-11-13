import { KLINIS } from '@klira/shared';
import { gagal } from '../../../umum/hasil.js';
import { bolehPerbaikiSendiri, hashIsi, pilihJenisAkun } from './pengesahan.js';
export const keDto = (p) => ({
    versi: p.versi, pengguna_id: p.pengguna_id, pengguna_nama: p.pengguna_nama, jenis_akun: p.jenis_akun_nama, waktu: p.waktu.toISOString(), hash: p.hash,
});
/**
 * Layanan pengesahan catatan generik (4.2, 7: simpan = pengesahan). Dipakai modul klinis dan nanti CPPT, resume, hasil lab:
 * `siapkan` merancang pengesahan (versi, hash, jenis akun, versi catatan) lalu pemanggil menulis isi dan pengesahan dalam
 * satu transaksi; `verifikasi` membandingkan hash isi sekarang dengan pengesahan terakhir.
 */
export function buatLayananPengesahan({ repo, audit, sekarang = () => new Date() }) {
    const penyedia = new Map();
    /** Keadaan pengesahan: belum disahkan, sah (hash cocok), atau berubah setelah disahkan (hash tidak cocok). */
    async function keadaan(fasyankesId, entitas, entitasId) {
        const fn = penyedia.get(entitas);
        const terakhir = await repo.terakhir(fasyankesId, entitas, entitasId);
        if (!terakhir)
            return { status: 'belum_disahkan', pengesahan: null };
        if (!fn)
            return { status: 'berubah', pengesahan: terakhir };
        return { status: hashIsi(await fn(fasyankesId, entitasId)) === terakhir.hash ? 'sah' : 'berubah', pengesahan: terakhir };
    }
    return {
        daftarkanPenyedia(entitas, fn) {
            penyedia.set(entitas, fn);
        },
        entitasDikenal: (entitas) => penyedia.has(entitas),
        async siapkan(m) {
            const waktu = sekarang();
            const terakhir = await repo.terakhir(m.fasyankesId, m.entitas, m.entitasId);
            const hash = hashIsi(m.isiBaru);
            let versiLama = null;
            if (terakhir) {
                const isiSekarang = await m.bacaIsiSekarang();
                if (hash === terakhir.hash && hashIsi(isiSekarang) === terakhir.hash)
                    return { ok: true, data: { jenis: 'sama', versi: terakhir.versi } };
                const alasan = m.alasan?.trim();
                if (!alasan)
                    return gagal('tidak_valid', KLINIS.galat.alasanPerbaikan, 'alasan');
                if (!m.lewatiBatas && m.disetujuiOleh === undefined && !bolehPerbaikiSendiri(terakhir, m.pelakuId, waktu))
                    return gagal('konflik', KLINIS.galat.perbaikanButuhPersetujuan);
                versiLama = { versi: terakhir.versi, isi_lama: isiSekarang ?? null, alasan, disetujui_oleh: m.disetujuiOleh ?? null };
            }
            const jenisAkun = pilihJenisAkun(await repo.jenisAkunPemberiHak(m.fasyankesId, m.pelakuId, m.fitur, terakhir ? 'perbaikan' : 'input', waktu));
            return { ok: true, data: { jenis: 'baru', rencana: { versi: (terakhir?.versi ?? 0) + 1, penggunaId: m.pelakuId, jenisAkun, hash, waktu, versiLama } } };
        },
        keadaan,
        /** API verifikasi: dicatat `lihat` sebelum hasil dilepas. */
        async verifikasi(pelaku, entitas, entitasId, alamat) {
            if (!penyedia.has(entitas))
                return gagal('tidak_ditemukan', KLINIS.galat.entitasTidakDikenal);
            const k = await keadaan(pelaku.fasyankes_id, entitas, entitasId);
            await audit.catat({ fasyankes_id: pelaku.fasyankes_id, pengguna_id: pelaku.id, aksi: 'lihat', entitas: 'pengesahan_catatan', entitas_id: entitasId, keterangan: `Verifikasi pengesahan ${entitas}`, alamat });
            return { ok: true, data: { entitas, entitas_id: entitasId, status: k.status, versi: k.pengesahan?.versi ?? null, pengesahan: k.pengesahan ? keDto(k.pengesahan) : null } };
        },
        riwayatVersi: (fasyankesId, entitas, entitasId) => repo.riwayatVersi(fasyankesId, entitas, entitasId),
    };
}
