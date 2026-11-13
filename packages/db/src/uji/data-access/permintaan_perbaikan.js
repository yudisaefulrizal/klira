import { baca, tulis, pool } from '../../koneksi.js';
export async function ambilPermintaanPerbaikanUntukRekamMedisRmIntegrasiTest(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`bagian`, t.`isi_baru`, t.`alasan`, t.`pemohon_id`, t.`status`, t.`penyetuju_id`, t.`catatan_keputusan`, t.`waktu_keputusan`, t.`dibuat_pada` FROM `permintaan_perbaikan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    for (const b of baris)
        if (typeof b.isi_baru === 'string')
            b.isi_baru = JSON.parse(b.isi_baru);
    return (baris[0] ?? null);
}
export function hapusPermintaanPerbaikanFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `permintaan_perbaikan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
