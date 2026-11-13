import { tulis, pool } from '../../koneksi.js';
export async function ubahKlaimUntukKlaimKlaimIntegrasiTest(batas_pengajuan, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `klaim` t SET `batas_pengajuan` = IF(?, t.`batas_pengajuan`, ?) WHERE ((? OR t.`id` <=> ?))", [batas_pengajuan === undefined, batas_pengajuan ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahKlaimUntukKlaimKlaimIntegrasiTest2(batas_ajukan_ulang, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `klaim` t SET `batas_ajukan_ulang` = IF(?, t.`batas_ajukan_ulang`, ?) WHERE ((? OR t.`id` <=> ?))", [batas_ajukan_ulang === undefined, batas_ajukan_ulang ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export function hapusKlaimFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `klaim` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
