import { tulis, pool } from '../../koneksi.js';
export async function ubahPermintaanHakUntukPdpPdpIntegrasiTest(batas_waktu, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `permintaan_hak` t SET `batas_waktu` = IF(?, t.`batas_waktu`, ?) WHERE ((? OR t.`id` <=> ?))", [batas_waktu === undefined, batas_waktu ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export function hapusPermintaanHakFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `permintaan_hak` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
