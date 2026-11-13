import { baca, tulis, pool } from '../../koneksi.js';
export async function daftarLogAuditUntukAudit(aksi, pengguna_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`aksi`, t.`entitas`, t.`entitas_id`, t.`keterangan`, t.`waktu`, t.`alamat` FROM `log_audit` t WHERE ((? OR t.`aksi` <=> ?)) AND ((? OR t.`pengguna_id` <=> ?))", [aksi === undefined, aksi ?? null, pengguna_id === undefined, pengguna_id ?? null], koneksi);
    return baris;
}
export async function hapusLogAuditUntukAksesIzinIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `log_audit` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarLogAuditUntukAuditAuditIntegrasiTest2(aksi, pengguna_id, entitas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`aksi`, t.`entitas`, t.`entitas_id`, t.`keterangan`, t.`waktu`, t.`alamat` FROM `log_audit` t WHERE ((? OR t.`aksi` <=> ?)) AND ((? OR t.`pengguna_id` <=> ?)) AND ((? OR t.`entitas` <=> ?))", [aksi === undefined, aksi ?? null, pengguna_id === undefined, pengguna_id ?? null, entitas === undefined, entitas ?? null], koneksi);
    return baris;
}
export async function tambahLogAuditUntukAuditAuditIntegrasiTest(fasyankes_id, pengguna_id, aksi, entitas, entitas_id, waktu, alamat, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `log_audit` (`fasyankes_id`, `pengguna_id`, `aksi`, `entitas`, `entitas_id`, `waktu`, `alamat`) VALUES (?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (aksi === undefined ? null : aksi) ?? null, (entitas === undefined ? null : entitas) ?? null, (entitas_id === undefined ? null : entitas_id) ?? null, (waktu === undefined ? new Date() : waktu) ?? null, (alamat === undefined ? null : alamat) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function wajibLogAuditUntukAuditAuditIntegrasiTest(fasyankes_id, aksi, entitas_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`aksi`, t.`entitas`, t.`entitas_id`, t.`keterangan`, t.`waktu`, t.`alamat` FROM `log_audit` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aksi` <=> ?)) AND ((? OR t.`entitas_id` <=> ?)) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, aksi === undefined, aksi ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris log_audit tidak ditemukan.');
    return baris[0];
}
export async function tambahLogAuditUntukAuditAuditIntegrasiTest3(fasyankes_id, aksi, entitas, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `log_audit` (`fasyankes_id`, `aksi`, `entitas`) VALUES (?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (aksi === undefined ? null : aksi) ?? null, (entitas === undefined ? null : entitas) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahLogAuditUntukAuditAuditIntegrasiTest3Hasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`aksi`, t.`entitas`, t.`entitas_id`, t.`keterangan`, t.`waktu`, t.`alamat` FROM `log_audit` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris log_audit tidak ditemukan.');
    return baris[0];
}
export async function hapusLogAuditUntukAuditAuditIntegrasiTest2(id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `log_audit` t WHERE ((? OR t.`id` <=> ?))", [id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungLogAuditUntukAuditAuditIntegrasiTest(aksi, pengguna_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `log_audit` t WHERE ((? OR t.`aksi` <=> ?)) AND ((? OR t.`pengguna_id` <=> ?))", [aksi === undefined, aksi ?? null, pengguna_id === undefined, pengguna_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarLogAuditUntukAuditAuditIntegrasiTest5(fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`aksi`, t.`entitas`, t.`entitas_id`, t.`keterangan`, t.`waktu`, t.`alamat` FROM `log_audit` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return baris;
}
export async function hapusLogAuditUntukFarmasiFarmasiIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `log_audit` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarLogAuditUntukFarmasiFarmasiIntegrasiTest(fasyankes_id, entitas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`aksi`, t.`entitas`, t.`entitas_id`, t.`keterangan`, t.`waktu`, t.`alamat` FROM `log_audit` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`entitas` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, entitas === undefined, entitas ?? null], koneksi);
    return baris;
}
export async function daftarLogAuditUntukFarmasiFarmasiIntegrasiTest2(fasyankes_id, entitas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`aksi`, t.`entitas`, t.`entitas_id`, t.`keterangan`, t.`waktu`, t.`alamat` FROM `log_audit` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`entitas` IN (?)))", [fasyankes_id === undefined, fasyankes_id ?? null, entitas === undefined, (entitas)?.length ? (entitas) : [null]], koneksi);
    return baris;
}
export async function daftarLogAuditUntukKasirKasirIntegrasiTest(fasyankes_id, entitas, entitas_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`aksi`, t.`entitas`, t.`entitas_id`, t.`keterangan`, t.`waktu`, t.`alamat` FROM `log_audit` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
    return baris;
}
export async function hitungLogAuditUntukKasirKasirIntegrasiTest(fasyankes_id, entitas, entitas_id, aksi, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `log_audit` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?)) AND ((? OR t.`aksi` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null, aksi === undefined, aksi ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarLogAuditUntukKeamananKeamananIntegrasiTest(aksi, entitas, pengguna_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`aksi`, t.`entitas`, t.`entitas_id`, t.`keterangan`, t.`waktu`, t.`alamat` FROM `log_audit` t WHERE ((? OR t.`aksi` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`pengguna_id` <=> ?))", [aksi === undefined, aksi ?? null, entitas === undefined, entitas ?? null, pengguna_id === undefined, pengguna_id ?? null], koneksi);
    return baris;
}
export async function hitungLogAuditUntukKlaimKlaimIntegrasiTest(fasyankes_id, entitas, aksi, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `log_audit` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`aksi` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, entitas === undefined, entitas ?? null, aksi === undefined, aksi ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarLogAuditUntukMasterMasterIntegrasiTest(fasyankes_id, entitas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`aksi`, t.`entitas`, t.`entitas_id`, t.`keterangan`, t.`waktu`, t.`alamat` FROM `log_audit` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`entitas` <=> ?)) ORDER BY t.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, entitas === undefined, entitas ?? null], koneksi);
    return baris;
}
export async function daftarLogAuditUntukPasienPasienIntegrasiTest(fasyankes_id, aksi, entitas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`aksi`, t.`entitas`, t.`entitas_id`, t.`keterangan`, t.`waktu`, t.`alamat` FROM `log_audit` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aksi` <=> ?)) AND ((? OR t.`entitas` IN (?)))", [fasyankes_id === undefined, fasyankes_id ?? null, aksi === undefined, aksi ?? null, entitas === undefined, (entitas)?.length ? (entitas) : [null]], koneksi);
    return baris;
}
export async function hitungLogAuditUntukPasienPasienIntegrasiTest(fasyankes_id, aksi, entitas, entitas_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `log_audit` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aksi` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, aksi === undefined, aksi ?? null, entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungLogAuditUntukPasienPasienIntegrasiTest2(fasyankes_id, aksi, entitas, entitas_id, pengguna_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `log_audit` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aksi` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?)) AND ((? OR t.`pengguna_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, aksi === undefined, aksi ?? null, entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null, pengguna_id === undefined, pengguna_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungLogAuditUntukPasienPasienIntegrasiTest3(fasyankes_id, entitas, entitas_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `log_audit` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungLogAuditUntukPdpPdpIntegrasiTest(fasyankes_id, entitas, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `log_audit` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`entitas` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, entitas === undefined, entitas ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarLogAuditUntukPenggunaPembuatanIntegrasiTest(fasyankes_id, pengguna_id, aksi, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`aksi`, t.`entitas`, t.`entitas_id`, t.`keterangan`, t.`waktu`, t.`alamat` FROM `log_audit` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`pengguna_id` <=> ?)) AND ((? OR t.`aksi` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, pengguna_id === undefined, pengguna_id ?? null, aksi === undefined, aksi ?? null], koneksi);
    return baris;
}
export async function hitungLogAuditUntukPenggunaPembuatanIntegrasiTest(fasyankes_id, aksi, entitas_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `log_audit` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`aksi` <=> ?)) AND ((? OR t.`entitas_id` IN (?)))", [fasyankes_id === undefined, fasyankes_id ?? null, aksi === undefined, aksi ?? null, entitas_id === undefined, (entitas_id)?.length ? (entitas_id) : [null]], koneksi);
    return Number(baris.jumlah);
}
export async function daftarLogAuditUntukPenggunaPenggunaIntegrasiTest(fasyankes_id, entitas, aksi, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`aksi`, t.`entitas`, t.`entitas_id`, t.`keterangan`, t.`waktu`, t.`alamat` FROM `log_audit` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`aksi` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, entitas === undefined, entitas ?? null, aksi === undefined, aksi ?? null], koneksi);
    return baris;
}
export async function hitungLogAuditUntukPenunjangPenunjangIntegrasiTest(fasyankes_id, entitas, entitas_id, keterangan, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `log_audit` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?)) AND ((? OR t.`keterangan` LIKE ? ESCAPE '!'))", [fasyankes_id === undefined, fasyankes_id ?? null, entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null, keterangan === undefined, '%' + String(keterangan ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%'], koneksi);
    return Number(baris.jumlah);
}
